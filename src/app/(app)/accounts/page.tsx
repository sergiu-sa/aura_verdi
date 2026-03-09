import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatNOK } from '@/lib/utils/format-currency'
import { Wallet } from 'lucide-react'
import Link from 'next/link'
import { AccountCard, type AccountTransaction } from '@/components/accounts/account-card'
import { BalanceDistribution } from '@/components/accounts/balance-distribution'

export const metadata: Metadata = { title: 'Accounts' }

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getAccountDetails(
  userId: string,
  accountIds: string[]
): Promise<Map<string, { recentTransactions: AccountTransaction[]; netChange30d: number }>> {
  if (accountIds.length === 0) return new Map()

  const supabase = await createClient()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Single query for all accounts — uses idx_transactions_account index
  const { data: transactions } = await supabase
    .from('transactions')
    .select('id, account_id, transaction_date, description, amount, category, counterpart_name, is_recurring')
    .eq('user_id', userId)
    .in('account_id', accountIds)
    .gte('transaction_date', thirtyDaysAgo.toISOString().split('T')[0])
    .order('transaction_date', { ascending: false })

  // Group by account
  type TxRow = { id: string; account_id: string; transaction_date: string; description: string | null; amount: number; category: string | null; counterpart_name: string | null; is_recurring: boolean | null }
  const byAccount = new Map<string, TxRow[]>()
  for (const id of accountIds) {
    byAccount.set(id, [])
  }

  for (const tx of (transactions ?? []) as TxRow[]) {
    const list = byAccount.get(tx.account_id)
    if (list) list.push(tx)
  }

  // Compute per-account details
  const result = new Map<string, { recentTransactions: AccountTransaction[]; netChange30d: number }>()

  for (const [accountId, txs] of byAccount) {
    const netChange30d = txs.reduce((sum, tx) => sum + Number(tx.amount), 0)
    const recentTransactions: AccountTransaction[] = txs.slice(0, 10).map((tx) => ({
      id: tx.id,
      transaction_date: tx.transaction_date,
      description: tx.description,
      amount: Number(tx.amount),
      category: tx.category,
      counterpart_name: tx.counterpart_name,
      is_recurring: tx.is_recurring ?? false,
    }))

    result.set(accountId, { recentTransactions, netChange30d })
  }

  return result
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AccountsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch accounts with their bank connection info
  const [accountsRes, connectionsRes] = await Promise.all([
    supabase
      .from('accounts')
      .select('id, account_name, balance, currency, account_type, bank_connection_id, is_shared_with_partner')
      .eq('user_id', user.id)
      .order('balance', { ascending: false }),

    supabase
      .from('bank_connections')
      .select('id, bank_name, status, last_synced_at')
      .eq('user_id', user.id),
  ])

  const accounts = accountsRes.data ?? []
  const connections = connectionsRes.data ?? []

  // Build a map of connection ID → bank info
  const bankMap = new Map(connections.map((c) => [c.id, c]))

  // Fetch transaction details for all accounts in a single query
  const accountIds = accounts.map((a) => a.id)
  const detailsMap = await getAccountDetails(user.id, accountIds)

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0)

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto animate-fade-in">
      <p className="text-section-header mb-2">Banking</p>
      <h1 className="font-display text-4xl text-aura-text mb-2">Accounts</h1>
      <p className="text-aura-text-secondary text-sm mb-6">
        {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'} connected
      </p>

      {accounts.length === 0 ? (
        <div className="surface p-8 rounded-xl text-center">
          <Wallet size={32} className="text-[#8888A0] mx-auto mb-3" />
          <p className="text-[#E8E8EC] text-sm font-medium mb-2">No accounts connected</p>
          <p className="text-[#8888A0] text-xs mb-4">
            Connect your bank in Settings to see your accounts and balances.
          </p>
          <Link
            href="/settings"
            className="text-sm text-aura-primary hover:text-aura-primary-light transition-colors font-medium"
          >
            Go to Settings →
          </Link>
        </div>
      ) : (
        <>
          {/* Total balance header */}
          <div className="surface p-5 rounded-xl mb-4">
            <div className="flex items-center justify-between">
              <p className="text-[#8888A0] text-sm">Total balance</p>
              <p className="font-display text-2xl text-[#E8E8EC]">{formatNOK(totalBalance)}</p>
            </div>
          </div>

          {/* Balance distribution bar */}
          <BalanceDistribution
            accounts={accounts.map((a) => ({
              id: a.id,
              account_name: a.account_name ?? 'Account',
              balance: Number(a.balance),
            }))}
          />

          {/* Account list */}
          <div className="space-y-2">
            {accounts.map((account) => {
              const bank = bankMap.get(account.bank_connection_id)
              const details = detailsMap.get(account.id)

              return (
                <AccountCard
                  key={account.id}
                  accountName={account.account_name}
                  accountType={account.account_type}
                  balance={Number(account.balance)}
                  bankName={bank?.bank_name ?? null}
                  bankStatus={bank?.status ?? null}
                  lastSyncedAt={bank?.last_synced_at ?? null}
                  recentTransactions={details?.recentTransactions ?? []}
                  netChange30d={details?.netChange30d ?? 0}
                  isSharedWithPartner={account.is_shared_with_partner ?? false}
                />
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
