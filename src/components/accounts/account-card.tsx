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

  const balanceColor = balance >= 0 ? 'text-[#4DD9A0]' : 'text-[#C75050]'
  const changeColor = netChange30d > 0 ? 'text-[#4DD9A0]' : netChange30d < 0 ? 'text-[#C75050]' : 'text-[#8888A0]'

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
            <p className="text-[#E8E8EC] text-sm font-medium truncate">
              {accountName || 'Unnamed account'}
            </p>
            {isSharedWithPartner && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#0D7377]/20 text-[#11999E] text-[10px] font-medium shrink-0">
                <Users size={10} />
                Shared
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {bankName && (
              <span className="text-xs text-[#8888A0]">{bankName}</span>
            )}
            {accountType && (
              <>
                <span className="text-[#2C2C3A]">·</span>
                <span className="text-xs text-[#8888A0] capitalize">{accountType}</span>
              </>
            )}
            {bankStatus === 'active' && (
              <>
                <span className="text-[#2C2C3A]">·</span>
                <span className="text-xs text-[#2D8B6F]">Connected</span>
              </>
            )}
            {bankStatus === 'expired' && (
              <>
                <span className="text-[#2C2C3A]">·</span>
                <span className="text-xs text-[#D4A039]">Expired</span>
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
              'text-[#55556A] transition-transform duration-200',
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
          <div className="border-t border-[#2C2C3A] px-4 pb-4 pt-3">
            {/* Last synced */}
            {lastSyncedAt && (
              <div className="flex items-center gap-1.5 mb-3">
                <RefreshCw size={10} className="text-[#55556A]" />
                <p className="text-[10px] text-[#55556A]">
                  Last synced: {new Date(lastSyncedAt).toLocaleDateString('nb-NO', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
            )}

            {/* Recent transactions */}
            <p className="text-[10px] text-[#55556A] uppercase tracking-wider mb-2">
              Recent transactions
            </p>

            {recentTransactions.length === 0 ? (
              <p className="text-xs text-[#8888A0] py-3">
                No recent transactions for this account.
              </p>
            ) : (
              <div className="space-y-1">
                {recentTransactions.map((tx) => {
                  const amount = tx.amount
                  const amountColor = amount >= 0 ? 'text-[#4DD9A0]' : 'text-[#E8E8EC]'

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
                        <p className="text-xs text-[#E8E8EC] truncate">
                          {tx.counterpart_name || tx.description || 'Unknown'}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-[#55556A]">
                            {formatDate(tx.transaction_date)}
                          </span>
                          {tx.is_recurring && (
                            <span className="text-[9px] text-[#0D7377] bg-[#0D7377]/10 px-1 py-0.5 rounded">
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
                className="block text-center text-xs text-[#0D7377] hover:text-[#11999E] mt-3 py-1 transition-colors"
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
