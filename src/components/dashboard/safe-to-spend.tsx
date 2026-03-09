/**
 * SafeToSpend — THE primary numbers on the dashboard.
 *
 * Shows two safe-to-spend figures:
 *   1. After critical bills only (primary, large)
 *   2. After all bills (secondary, smaller)
 *
 * Color coding (based on safeAfterCritical):
 *   > 5 000 kr  → green  (comfortable)
 *   1 000–5 000 → amber  (watch it)
 *   < 1 000 kr  → red    (tight)
 */

import Link from 'next/link'
import { formatNOK } from '@/lib/utils/format-currency'

interface Props {
  safeToSpend: number
  safeAfterCritical: number
  totalBalance: number
  totalUpcomingBills: number
  accountCount: number
}

function amountColorClass(amount: number): string {
  if (amount > 5_000) return 'text-[#4DD9A0]'
  if (amount > 1_000) return 'text-[#D4A039]'
  return 'text-[#C75050]'
}

export function SafeToSpend({
  safeToSpend,
  safeAfterCritical,
  totalBalance,
  totalUpcomingBills,
  accountCount,
}: Props) {
  const hasCriticalBills = safeAfterCritical !== totalBalance
  const primaryAmount = hasCriticalBills ? safeAfterCritical : safeToSpend
  const primaryLabel = hasCriticalBills ? 'After critical bills' : 'Safe to spend'

  const statusText =
    primaryAmount > 5_000
      ? 'Looking good'
      : primaryAmount > 1_000
        ? 'Spend carefully'
        : primaryAmount > 0
          ? 'Very tight'
          : 'Bills exceed balance'

  return (
    <div className="surface p-6 md:p-8 rounded-xl">
      {/* Label */}
      <p className="text-section-header mb-3">Safe to spend</p>

      {/* Primary number */}
      <div className="mb-1">
        {hasCriticalBills && (
          <p className="text-[#8888A0] text-xs mb-1">{primaryLabel}</p>
        )}
        <p className={`font-display text-5xl md:text-6xl font-normal tracking-tight leading-none ${amountColorClass(primaryAmount)}`}>
          {formatNOK(Math.max(0, primaryAmount))}
        </p>
      </div>

      {/* Secondary: after all bills (only when critical bills exist) */}
      {hasCriticalBills && (
        <div className="mt-3">
          <p className="text-[#8888A0] text-xs mb-1">After all bills</p>
          <p className={`font-display text-3xl font-normal tracking-tight leading-none ${amountColorClass(safeToSpend)}`}>
            {formatNOK(Math.max(0, safeToSpend))}
          </p>
        </div>
      )}

      {/* Status line */}
      <p className="text-[#8888A0] text-sm mt-3">{statusText}</p>

      {/* Breakdown — progressive disclosure */}
      {accountCount > 0 && (
        <div className="mt-5 pt-4 border-t border-[#2C2C3A] space-y-1.5">
          <Link href="/accounts" className="flex justify-between text-xs group hover:bg-white/5 -mx-2 px-2 py-1 rounded transition-colors">
            <span className="text-[#8888A0] group-hover:text-[#E8E8EC] transition-colors">
              Total balance ({accountCount} {accountCount === 1 ? 'account' : 'accounts'})
            </span>
            <span className="text-amount text-sm">{formatNOK(totalBalance)}</span>
          </Link>
          {totalUpcomingBills > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-[#8888A0]">Upcoming bills</span>
              <span className="text-amount text-sm text-[#D4A039]">
                − {formatNOK(totalUpcomingBills)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Empty state (no bank connected) ─────────────────────────────────────────

export function SafeToSpendEmpty() {
  return (
    <div className="surface p-6 md:p-8 rounded-xl">
      <p className="text-section-header mb-3">Safe to spend</p>
      <p className="font-display text-5xl font-normal tracking-tight leading-none text-[#2C2C3A]">
        — kr
      </p>
      <p className="text-[#8888A0] text-sm mt-3">
        Connect your bank in Settings to see this number.
      </p>
    </div>
  )
}
