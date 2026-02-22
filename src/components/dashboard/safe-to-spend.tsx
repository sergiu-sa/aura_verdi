/**
 * SafeToSpend — THE primary number on the dashboard.
 *
 * Design principle: ONE number that matters. This is it.
 * Shows what you can spend today without missing any upcoming bills.
 *
 * Color coding:
 *   > 5 000 kr  → green  (comfortable)
 *   1 000–5 000 → amber  (watch it)
 *   < 1 000 kr  → red    (tight)
 */

import { formatNOK } from '@/lib/utils/format-currency'

interface Props {
  safeToSpend: number
  totalBalance: number
  totalUpcomingBills: number
  accountCount: number
}

export function SafeToSpend({
  safeToSpend,
  totalBalance,
  totalUpcomingBills,
  accountCount,
}: Props) {
  // Color based on how comfortable the buffer is
  const amountColor =
    safeToSpend > 5_000
      ? 'text-[#4DD9A0]'   // comfortable — soft green
      : safeToSpend > 1_000
        ? 'text-[#D4A039]' // watch it — amber
        : 'text-[#C75050]' // tight — muted red

  const statusText =
    safeToSpend > 5_000
      ? 'Looking good'
      : safeToSpend > 1_000
        ? 'Spend carefully'
        : safeToSpend > 0
          ? 'Very tight'
          : 'Bills exceed balance'

  return (
    <div className="surface p-6 md:p-8 rounded-xl">
      {/* Label */}
      <p className="text-section-header mb-3">Safe to spend</p>

      {/* THE number */}
      <p className={`font-display text-5xl md:text-6xl font-normal tracking-tight leading-none ${amountColor}`}>
        {formatNOK(Math.max(0, safeToSpend))}
      </p>

      {/* Status line */}
      <p className="text-[#8888A0] text-sm mt-3">{statusText}</p>

      {/* Breakdown — progressive disclosure */}
      {accountCount > 0 && (
        <div className="mt-5 pt-4 border-t border-[#2C2C3A] space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-[#8888A0]">
              Total balance ({accountCount} {accountCount === 1 ? 'account' : 'accounts'})
            </span>
            <span className="text-amount text-sm">{formatNOK(totalBalance)}</span>
          </div>
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
