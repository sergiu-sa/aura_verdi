/**
 * Bank sync logic — fetches accounts and transactions from Neonomics
 * and upserts them into Supabase.
 *
 * SECURITY:
 * - This module runs server-side only (called from API routes)
 * - Raw Neonomics data is stored in transactions.raw_data (JSONB) for debugging
 *   but is NEVER sent to Claude — use context-builder for that
 * - IBANs are stored in the accounts table but NEVER logged or sent to Claude
 *
 * DEDUPLICATION:
 * - Accounts: ON CONFLICT (bank_connection_id, neonomics_account_id) → update
 * - Transactions: ON CONFLICT (account_id, internal_reference) → update
 *   Transactions with no internal_reference are inserted fresh (no dedup)
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { neonomics } from './client'
import type { NeonomicsTransaction } from '@/types/neonomics'

// ── Types ───────────────────────────────────────────────────────────────────

export interface SyncResult {
  accountsSynced: number
  transactionsSynced: number
  errors: string[]
}

// ── Balance helper ───────────────────────────────────────────────────────────

/**
 * Pick the best available balance from Neonomics response.
 * Priority: closingBooked > expected > authorised > openingBooked
 */
function pickBalance(
  balances: Array<{ balanceType: string; balanceAmount: { amount: string } }>
): number {
  const priority = ['closingBooked', 'expected', 'authorised', 'openingBooked']
  for (const type of priority) {
    const found = balances.find((b) => b.balanceType === type)
    if (found) return parseFloat(found.balanceAmount.amount)
  }
  // Fall back to first balance if no priority match
  return balances[0] ? parseFloat(balances[0].balanceAmount.amount) : 0
}

// ── Transaction mapper ───────────────────────────────────────────────────────

/**
 * Map a Neonomics transaction to our database shape.
 * Uses transactionId or entryReference as the internal_reference for dedup.
 */
function mapTransaction(
  tx: NeonomicsTransaction,
  accountId: string,
  userId: string
) {
  // The counterpart name: creditor when we're paying, debtor when we receive
  const amount = parseFloat(tx.transactionAmount.amount)
  const counterpartName = amount < 0 ? tx.creditorName : tx.debtorName

  // Description: prefer unstructured (human-readable) over structured
  const description =
    tx.remittanceInformationUnstructured ??
    tx.remittanceInformationStructured ??
    null

  // Dedup reference: use transactionId first, then entryReference
  const internalReference = tx.transactionId ?? tx.entryReference ?? null

  return {
    account_id: accountId,
    user_id: userId,
    transaction_date: tx.bookingDate,
    booking_date: tx.bookingDate,
    amount,
    currency: tx.transactionAmount.currency,
    description,
    // category will be set later by the AI categorization step
    category: null as string | null,
    is_recurring: false,
    counterpart_name: counterpartName ?? null,
    internal_reference: internalReference,
    // Store raw data for debugging (never sent to Claude)
    raw_data: tx as unknown as Record<string, unknown>,
  }
}

// ── Main sync function ───────────────────────────────────────────────────────

/**
 * Syncs one bank connection: fetches accounts + transactions from Neonomics,
 * upserts everything into Supabase.
 *
 * @param supabase      - Authenticated Supabase server client
 * @param userId        - The user's UUID (used as x-device-id for Neonomics)
 * @param connectionId  - The bank_connection.id in our database
 * @returns             - Summary of what was synced
 */
export async function syncBankConnection(
  supabase: SupabaseClient,
  userId: string,
  connectionId: string
): Promise<SyncResult> {
  const result: SyncResult = {
    accountsSynced: 0,
    transactionsSynced: 0,
    errors: [],
  }

  // 1. Fetch the bank connection record
  const { data: connection, error: connError } = await supabase
    .from('bank_connections')
    .select('neonomics_session_id, bank_name, status')
    .eq('id', connectionId)
    .eq('user_id', userId) // Belt + suspenders — always scope to user
    .single()

  if (connError || !connection) {
    result.errors.push('Bank connection not found')
    return result
  }

  if (connection.status !== 'active') {
    result.errors.push(`Bank connection is not active (status: ${connection.status})`)
    return result
  }

  if (!connection.neonomics_session_id) {
    result.errors.push('Bank connection has no session ID')
    return result
  }

  const sessionId = connection.neonomics_session_id
  // We use the user's UUID as the device ID — stable and unique per user
  const deviceId = userId

  // 2. Fetch accounts from Neonomics
  let neoAccounts
  try {
    neoAccounts = await neonomics.getAccounts(sessionId, deviceId)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    result.errors.push(`Failed to fetch accounts: ${msg}`)
    // If consent has expired, update connection status
    if (msg.includes('403')) {
      await supabase
        .from('bank_connections')
        .update({ status: 'expired' })
        .eq('id', connectionId)
    }
    return result
  }

  // 3. Upsert each account + fetch its transactions
  for (const neoAccount of neoAccounts) {
    try {
      // Fetch balances for this account
      let balance = 0
      try {
        const balances = await neonomics.getBalances(neoAccount.id, sessionId, deviceId)
        balance = pickBalance(balances)
      } catch {
        // Non-fatal: continue with balance = 0
        result.errors.push(`Could not fetch balance for account (not logging ID)`)
      }

      // Upsert the account — ON CONFLICT on (bank_connection_id, neonomics_account_id)
      const { data: upsertedAccount, error: accountError } = await supabase
        .from('accounts')
        .upsert(
          {
            user_id: userId,
            bank_connection_id: connectionId,
            neonomics_account_id: neoAccount.id,
            account_name: neoAccount.name ?? neoAccount.product ?? 'Account',
            // IBANs are stored but never logged or sent to Claude
            iban: neoAccount.iban ?? neoAccount.bban ?? null,
            balance,
            currency: neoAccount.currency ?? 'NOK',
            account_type: neoAccount.accountType ?? null,
            last_updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'bank_connection_id,neonomics_account_id',
            ignoreDuplicates: false, // Update the balance on re-sync
          }
        )
        .select('id')
        .single()

      if (accountError || !upsertedAccount) {
        result.errors.push(`Failed to upsert account: ${accountError?.message}`)
        continue
      }

      result.accountsSynced++

      // 4. Fetch transactions for this account
      let txResponse
      try {
        txResponse = await neonomics.getTransactions(neoAccount.id, sessionId, deviceId)
      } catch {
        result.errors.push(`Could not fetch transactions for one account`)
        continue
      }

      // Combine booked + pending transactions
      const allTransactions: NeonomicsTransaction[] = [
        ...(txResponse.transactions.booked ?? []),
        ...(txResponse.transactions.pending ?? []),
      ]

      if (allTransactions.length === 0) continue

      // 5. Upsert transactions
      const txRows = allTransactions.map((tx) =>
        mapTransaction(tx, upsertedAccount.id, userId)
      )

      // Upsert in batches of 100 to avoid hitting Supabase limits
      const BATCH_SIZE = 100
      for (let i = 0; i < txRows.length; i += BATCH_SIZE) {
        const batch = txRows.slice(i, i + BATCH_SIZE)

        // Separate transactions with and without internal_reference
        // Only those with an internal_reference can use ON CONFLICT dedup
        const withRef = batch.filter((tx) => tx.internal_reference !== null)
        const withoutRef = batch.filter((tx) => tx.internal_reference === null)

        if (withRef.length > 0) {
          const { error: txError } = await supabase
            .from('transactions')
            .upsert(withRef, {
              onConflict: 'account_id,internal_reference',
              ignoreDuplicates: true, // Don't overwrite existing categorization
            })

          if (txError) {
            result.errors.push(`Transaction upsert error: ${txError.message}`)
          } else {
            result.transactionsSynced += withRef.length
          }
        }

        // Transactions without a reference: only insert if they don't already exist
        // We check for matching (account_id, transaction_date, amount) to avoid duplicates
        for (const tx of withoutRef) {
          const { data: existing } = await supabase
            .from('transactions')
            .select('id')
            .eq('account_id', tx.account_id)
            .eq('transaction_date', tx.transaction_date)
            .eq('amount', tx.amount)
            .limit(1)

          if (!existing || existing.length === 0) {
            const { error } = await supabase.from('transactions').insert(tx)
            if (!error) result.transactionsSynced++
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      result.errors.push(`Error processing one account: ${msg}`)
    }
  }

  // 6. Update last_synced_at on the connection
  await supabase
    .from('bank_connections')
    .update({ last_synced_at: new Date().toISOString() })
    .eq('id', connectionId)
    .eq('user_id', userId)

  return result
}
