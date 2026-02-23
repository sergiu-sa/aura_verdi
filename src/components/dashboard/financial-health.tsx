/**
 * FinancialHealth — a simple green / amber / red status indicator.
 *
 * Calculated from:
 *   - Expense ratio: total expenses / total income (last 30 days)
 *   - Buffer: safe-to-spend amount
 *
 * Status thresholds:
 *   Good    — expenses < 75% of income AND buffer > 5 000 kr
 *   Caution — expenses 75–100% of income OR buffer 1 000–5 000 kr
 *   Critical— expenses > income OR buffer < 1 000 kr
 *   No data — no bank connected or no transactions yet
 */

import { formatNOK } from '@/lib/utils/format-currency'

export type HealthStatus = 'good' | 'caution' | 'critical' | 'no-data'

interface Props {
  status: HealthStatus
  totalMonthlyIncome: number
  totalMonthlyExpenses: number
  safeToSpend: number
}

const CONFIG: Record<
  HealthStatus,
  { label: string; sublabel: string; dot: string; bg: string; border: string }
> = {
  good: {
    label: 'On track',
    sublabel: 'Income is covering your expenses comfortably.',
    dot: 'bg-[#2D8B6F]',
    bg: 'bg-[#0D3B2E]',
    border: 'border-[#2D8B6F]/30',
  },
  caution: {
    label: 'Watch your spending',
    sublabel: 'Expenses are close to your income. Keep an eye on it.',
    dot: 'bg-[#D4A039]',
    bg: 'bg-[#3B2E0D]',
    border: 'border-[#D4A039]/30',
  },
  critical: {
    label: 'Tight this month',
    sublabel: 'Your expenses are exceeding your income.',
    dot: 'bg-[#C75050]',
    bg: 'bg-[#3B0D0D]',
    border: 'border-[#C75050]/30',
  },
  'no-data': {
    label: 'No data yet',
    sublabel: 'Sync your bank to see your financial health.',
    dot: 'bg-[#2C2C3A]',
    bg: 'bg-[#1C1C28]',
    border: 'border-[#2C2C3A]',
  },
}

export function FinancialHealth({
  status,
  totalMonthlyIncome,
  totalMonthlyExpenses,
}: Props) {
  const { label, sublabel, dot, bg, border } = CONFIG[status]
  const hasData = status !== 'no-data'

  return (
    <div className={`surface p-5 rounded-xl border ${border} ${bg}`}>
      <p className="text-section-header mb-3">Financial health</p>

      {/* Status pill */}
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dot}`} />
        <span className="text-[#E8E8EC] font-medium text-sm">{label}</span>
      </div>
      <p className="text-[#8888A0] text-xs leading-relaxed">{sublabel}</p>

      {/* Income vs expenses summary */}
      {hasData && (totalMonthlyIncome > 0 || totalMonthlyExpenses > 0) && (
        <div className="mt-4 pt-4 border-t border-white/5 space-y-1.5">
          {totalMonthlyIncome > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-[#8888A0]">Income (30 days)</span>
              <span className="text-amount text-[#4DD9A0]">
                {formatNOK(totalMonthlyIncome)}
              </span>
            </div>
          )}
          {totalMonthlyExpenses > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-[#8888A0]">Expenses (30 days)</span>
              <span className="text-amount text-[#E8E8EC]">
                {formatNOK(totalMonthlyExpenses)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
