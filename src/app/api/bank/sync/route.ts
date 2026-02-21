/**
 * POST /api/bank/sync
 *
 * Triggers a manual sync of bank accounts and transactions for the
 * authenticated user. Syncs all active bank connections.
 *
 * Can also sync a specific connection by passing { connectionId } in the body.
 *
 * Rate limit: 6 syncs per hour (syncing too often is wasteful and Neonomics
 * may rate-limit us too — every 4-8 hours is normal usage).
 */

import { createClient } from '@/lib/supabase/server'
import { syncBankConnection } from '@/lib/neonomics/sync'
import { checkRateLimit, RATE_LIMITS } from '@/lib/utils/rate-limiter'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// ── Input validation ─────────────────────────────────────────────────────────

const SyncSchema = z.object({
  // Optional: sync a specific connection. Omit to sync all active connections.
  connectionId: z.string().uuid().optional(),
})

// ── POST /api/bank/sync ──────────────────────────────────────────────────────

export async function POST(request: Request) {
  // 1. AUTHENTICATE
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. RATE LIMIT — 6 syncs per hour per user
  const { bankSync: limit } = RATE_LIMITS
  if (!checkRateLimit(`bank-sync:${user.id}`, limit.max, limit.windowMs)) {
    return NextResponse.json(
      { error: 'Too many sync requests. Please wait before syncing again.' },
      { status: 429 }
    )
  }

  // 3. VALIDATE INPUT
  let body: unknown = {}
  try {
    body = await request.json()
  } catch {
    // Empty body is fine — we'll sync all active connections
  }

  const parsed = SyncSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { connectionId } = parsed.data

  try {
    // 4. FETCH TARGET CONNECTIONS
    let query = supabase
      .from('bank_connections')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (connectionId) {
      query = query.eq('id', connectionId)
    }

    const { data: connections, error: fetchError } = await query

    if (fetchError) {
      console.error(`[BANK_SYNC] Failed to fetch connections for user ${user.id}:`, fetchError.message)
      return NextResponse.json(
        { error: 'Failed to fetch bank connections' },
        { status: 500 }
      )
    }

    if (!connections || connections.length === 0) {
      return NextResponse.json({
        message: 'No active bank connections to sync.',
        synced: [],
      })
    }

    // 5. SYNC EACH CONNECTION
    //    We run them sequentially to avoid hammering Neonomics rate limits.
    const results = []
    for (const conn of connections) {
      const syncResult = await syncBankConnection(supabase, user.id, conn.id)
      results.push({
        connectionId: conn.id,
        accountsSynced: syncResult.accountsSynced,
        transactionsSynced: syncResult.transactionsSynced,
        // Only include errors if there were any
        ...(syncResult.errors.length > 0 && { errors: syncResult.errors }),
      })
    }

    // 6. RETURN SUMMARY (never include sensitive data like amounts or account numbers)
    const totalAccounts = results.reduce((sum, r) => sum + r.accountsSynced, 0)
    const totalTransactions = results.reduce((sum, r) => sum + r.transactionsSynced, 0)

    return NextResponse.json({
      message: `Sync complete. ${totalAccounts} accounts and ${totalTransactions} transactions updated.`,
      synced: results,
    })
  } catch (error) {
    console.error(`[BANK_SYNC] Unexpected error for user ${user.id}:`, error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json(
      { error: 'Sync failed. Please try again.' },
      { status: 500 }
    )
  }
}
