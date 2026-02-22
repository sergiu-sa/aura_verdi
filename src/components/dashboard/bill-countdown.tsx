/**
 * BillCountdown — shows upcoming bills sorted by due date.
 *
 * Design: the closest bill is prominently displayed.
 * Remaining bills are shown as a compact list.
 *
 * Urgency color:
 *   ≤ 3 days  → red
 *   4–7 days  → amber
 *   > 7 days  → normal text
 */

import { formatNOK } from '@/lib/utils/format-currency'

interface Bill {
  id: string
  name: string
  amount: number
  due_date: string
}

interface Props {
  bills: Bill[]
}

function daysUntil(dueDateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDateStr)
  due.setHours(0, 0, 0, 0)
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function formatDueDate(dueDateStr: string): string {
  return new Date(dueDateStr).toLocaleDateString('nb-NO', {
    day: '2-digit',
    month: 'short',
  })
}

function urgencyColor(days: number): string {
  if (days <= 3) return 'text-[#C75050]'
  if (days <= 7) return 'text-[#D4A039]'
  return 'text-[#8888A0]'
}

function daysLabel(days: number): string {
  if (days < 0) return 'overdue'
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  return `in ${days} days`
}

export function BillCountdown({ bills }: Props) {
  if (bills.length === 0) {
    return (
      <div className="surface p-5 rounded-xl">
        <p className="text-section-header mb-3">Upcoming bills</p>
        <p className="text-[#8888A0] text-sm">
          No upcoming bills in the next 30 days.
        </p>
        <p className="text-[#8888A0] text-xs mt-2">
          Bills are added automatically when you sync your bank.
        </p>
      </div>
    )
  }

  const [next, ...rest] = bills
  const nextDays = daysUntil(next.due_date)

  return (
    <div className="surface p-5 rounded-xl">
      <p className="text-section-header mb-3">Upcoming bills</p>

      {/* Primary — next bill */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <p className="text-[#E8E8EC] font-medium text-sm">{next.name}</p>
          <p className={`text-xs mt-0.5 ${urgencyColor(nextDays)}`}>
            {formatDueDate(next.due_date)} — {daysLabel(nextDays)}
          </p>
        </div>
        <p className="text-amount text-[#E8E8EC] text-sm flex-shrink-0 ml-4">
          {formatNOK(next.amount)}
        </p>
      </div>

      {/* Remaining bills */}
      {rest.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[#2C2C3A] space-y-2">
          {rest.slice(0, 3).map((bill) => {
            const days = daysUntil(bill.due_date)
            return (
              <div key={bill.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[#E8E8EC] text-xs truncate">{bill.name}</span>
                  <span className={`text-xs flex-shrink-0 ${urgencyColor(days)}`}>
                    {daysLabel(days)}
                  </span>
                </div>
                <span className="text-amount text-xs text-[#8888A0] ml-4 flex-shrink-0">
                  {formatNOK(bill.amount)}
                </span>
              </div>
            )
          })}
          {rest.length > 3 && (
            <p className="text-xs text-[#8888A0] pt-1">
              +{rest.length - 3} more bills this month
            </p>
          )}
        </div>
      )}
    </div>
  )
}
