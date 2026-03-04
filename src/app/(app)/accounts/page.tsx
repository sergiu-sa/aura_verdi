import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatNOK } from '@/lib/utils/format-currency'
import { Wallet } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Accounts' }

export default async function AccountsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch accounts with their bank connection info
  const [accountsRes, connectionsRes] = await Promise.all([
    supabase
      .from('accounts')
      .select('id, account_name, balance, currency, account_type, bank_connection_id')
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

          {/* Account list */}
          <div className="space-y-2">
            {accounts.map((account) => {
              const bank = bankMap.get(account.bank_connection_id)
              const balance = Number(account.balance)
              const balanceColor = balance >= 0 ? 'text-[#4DD9A0]' : 'text-[#C75050]'

              return (
                <div
                  key={account.id}
                  className="surface p-4 rounded-xl flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-[#E8E8EC] text-sm font-medium truncate">
                      {account.account_name || 'Unnamed account'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {bank && (
                        <span className="text-xs text-[#8888A0]">{bank.bank_name}</span>
                      )}
                      {account.account_type && (
                        <>
                          <span className="text-[#2C2C3A]">·</span>
                          <span className="text-xs text-[#8888A0] capitalize">{account.account_type}</span>
                        </>
                      )}
                      {bank?.status === 'active' && (
                        <>
                          <span className="text-[#2C2C3A]">·</span>
                          <span className="text-xs text-[#2D8B6F]">Connected</span>
                        </>
                      )}
                      {bank?.status === 'expired' && (
                        <>
                          <span className="text-[#2C2C3A]">·</span>
                          <span className="text-xs text-[#D4A039]">Expired</span>
                        </>
                      )}
                    </div>
                    {bank?.last_synced_at && (
                      <p className="text-[10px] text-[#55556A] mt-1">
                        Last synced: {new Date(bank.last_synced_at).toLocaleDateString('nb-NO', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                  <p className={`font-display text-lg flex-shrink-0 ml-4 ${balanceColor}`}>
                    {formatNOK(balance)}
                  </p>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
