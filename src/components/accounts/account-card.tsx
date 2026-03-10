'use client'

import { useState } from 'react'
import { ChevronDown, Users, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatNOK, formatNOKDelta } from '@/lib/utils/format-currency'
import { SPENDING_CATEGORIES, type SpendingCategory } from '@/lib/constants/categories'

export interface AccountTransaction {
  id: string
  transaction_date: string
  description: string | null
  amount: number
  category: string | null
  counterpart_name: string | null
  is_recurring: boolean
}

interface Props {
  accountName: string
  accountType: string | null
  balance: number
  bankName: string | null
  bankStatus: string | null
  lastSyncedAt: string | null
  recentTransactions: AccountTransaction[]
  netChange30d: number
  isSharedWithPartner: boolean
}

function getCategoryEmoji(category: string | null): string {
  if (!category) return '❓'
  const cat = SPENDING_CATEGORIES[category as SpendingCategory]
  return cat?.emoji ?? '❓'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('nb-NO', {
    day: '2-digit',
    month: '2-digit',
  })
}

export function AccountCard({
  accountName,
  accountType,
  balance,
  bankName,
  bankStatus,
  lastSyncedAt,
  recentTransactions,
  netChange30d,
  isSharedWithPartner,
}: Props) {
  const [expanded, setExpanded] = useState(false)

  const balanceColor = balance >= 0 ? 'text-aura-positive' : 'text-aura-danger'
  const changeColor = netChange30d > 0 ? 'text-aura-positive' : netChange30d < 0 ? 'text-aura-danger' : 'text-aura-text-secondary'

  return (
    <div className="surface rounded-xl overflow-hidden">
      {/* Header — clickable to expand */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full p-4 flex items-center gap-3 text-left hover:bg-white/[0.02] transition-colors"
      >
        {/* Left side: account info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-aura-text text-sm font-medium truncate">
              {accountName || 'Unnamed account'}
            </p>
            {isSharedWithPartner && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-aura-primary/20 text-aura-primary-light text-[10px] font-medium shrink-0">
                <Users size={10} />
                Shared
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {bankName && (
              <span className="text-xs text-aura-text-secondary">{bankName}</span>
            )}
            {accountType && (
              <>
                <span className="text-aura-border">·</span>
                <span className="text-xs text-aura-text-secondary capitalize">{accountType}</span>
              </>
            )}
            {bankStatus === 'active' && (
              <>
                <span className="text-aura-border">·</span>
                <span className="text-xs text-aura-safe">Connected</span>
              </>
            )}
            {bankStatus === 'expired' && (
              <>
                <span className="text-aura-border">·</span>
                <span className="text-xs text-aura-warning">Expired</span>
              </>
            )}
          </div>
        </div>

        {/* Right side: balance + change + chevron */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className={cn('font-display text-lg', balanceColor)}>
              {formatNOK(balance)}
            </p>
            {netChange30d !== 0 && (
              <p className={cn('text-[10px] font-medium', changeColor)}>
                {formatNOKDelta(netChange30d)} (30d)
              </p>
            )}
          </div>
          <ChevronDown
            size={16}
            className={cn(
              'text-aura-text-dim transition-transform duration-200',
              expanded && 'rotate-180'
            )}
          />
        </div>
      </button>

      {/* Expandable transactions panel */}
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out',
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-aura-border px-4 pb-4 pt-3">
            {/* Last synced */}
            {lastSyncedAt && (
              <div className="flex items-center gap-1.5 mb-3">
                <RefreshCw size={10} className="text-aura-text-dim" />
                <p className="text-[10px] text-aura-text-dim">
                  Last synced: {new Date(lastSyncedAt).toLocaleDateString('nb-NO', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
            )}

            {/* Recent transactions */}
            <p className="text-[10px] text-aura-text-dim uppercase tracking-wider mb-2">
              Recent transactions
            </p>

            {recentTransactions.length === 0 ? (
              <p className="text-xs text-aura-text-secondary py-3">
                No recent transactions for this account.
              </p>
            ) : (
              <div className="space-y-1">
                {recentTransactions.map((tx) => {
                  const amount = tx.amount
                  const amountColor = amount >= 0 ? 'text-aura-positive' : 'text-aura-text'

                  return (
                    <div
                      key={tx.id}
                      className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Category emoji */}
                      <span className="text-xs shrink-0 w-5 text-center">
                        {getCategoryEmoji(tx.category)}
                      </span>

                      {/* Description + date */}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-aura-text truncate">
                          {tx.counterpart_name || tx.description || 'Unknown'}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-aura-text-dim">
                            {formatDate(tx.transaction_date)}
                          </span>
                          {tx.is_recurring && (
                            <span className="text-[9px] text-aura-primary bg-aura-primary/10 px-1 py-0.5 rounded">
                              Recurring
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Amount */}
                      <span className={cn('text-xs font-medium tabular-nums shrink-0', amountColor)}>
                        {formatNOK(amount)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            {recentTransactions.length > 0 && (
              <a
                href="/transactions"
                className="block text-center text-xs text-aura-primary hover:text-aura-primary-light mt-3 py-1 transition-colors"
              >
                View all transactions →
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
