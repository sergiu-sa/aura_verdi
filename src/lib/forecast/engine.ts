/**
 * Cash flow forecast engine — pure projection logic, no DB calls.
 *
 * Takes the user's current balance, upcoming bills, detected recurring income,
 * and user-created planned events, then projects a day-by-day balance trajectory.
 */

import type { ForecastPoint, ForecastEvent } from '@/types/financial'

// ── Input types ──────────────────────────────────────────────────────────────

interface BillInput {
  name: string
  amount: number // Always positive (it's a bill)
  dueDate: string // ISO "yyyy-mm-dd"
  recurrence: string | null
}

interface IncomeInput {
  name: string
  amount: number // Always positive
  lastDate: string // ISO "yyyy-mm-dd" — most recent occurrence
}

interface PlannedInput {
  name: string
  amount: number // Negative = expense, positive = income
  eventDate: string // ISO "yyyy-mm-dd"
  recurrence: string | null
}

export interface ForecastInput {
  currentBalance: number
  bills: BillInput[]
  recurringIncome: IncomeInput[]
  plannedEvents: PlannedInput[]
  days: number // 30, 60, or 90
}

// ── Recurrence projection ────────────────────────────────────────────────────

/**
 * Projects future dates for a recurring event.
 * Returns all occurrence dates within [rangeStart, rangeEnd].
 */
function projectRecurrence(
  startDateStr: string,
  recurrence: string | null,
  rangeStart: Date,
  rangeEnd: Date
): string[] {
  if (!recurrence || recurrence === 'once') {
    // Single occurrence — include if within range
    const d = new Date(startDateStr)
    if (d >= rangeStart && d <= rangeEnd) {
      return [startDateStr]
    }
    return []
  }

  const dates: string[] = []
  const start = new Date(startDateStr)

  // Generate occurrences starting from the original date, going forward and backward
  // to cover the range. We start from the original date and step in both directions.
  const intervals: Record<string, (d: Date, n: number) => Date> = {
    weekly: (d, n) => {
      const r = new Date(d)
      r.setDate(r.getDate() + 7 * n)
      return r
    },
    monthly: (d, n) => {
      const r = new Date(d)
      r.setMonth(r.getMonth() + n)
      return r
    },
    quarterly: (d, n) => {
      const r = new Date(d)
      r.setMonth(r.getMonth() + 3 * n)
      return r
    },
    yearly: (d, n) => {
      const r = new Date(d)
      r.setFullYear(r.getFullYear() + n)
      return r
    },
  }

  const step = intervals[recurrence]
  if (!step) return [startDateStr]

  // Find the first occurrence at or after rangeStart
  let n = 0
  // Step backward if start is after rangeStart
  while (step(start, n) > rangeEnd) n--
  // Step forward to find first occurrence at or after rangeStart
  while (step(start, n) < rangeStart) n++

  // Collect all occurrences within range
  let current = step(start, n)
  while (current <= rangeEnd) {
    dates.push(toISODate(current))
    n++
    current = step(start, n)
  }

  return dates
}

/** Convert a Date to "yyyy-mm-dd" string */
function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Format as "dd.mm" for chart axis labels */
function toChartLabel(dateStr: string): string {
  const [, m, d] = dateStr.split('-')
  return `${d}.${m}`
}

// ── Main forecast builder ────────────────────────────────────────────────────

export function buildForecast(input: ForecastInput): ForecastPoint[] {
  const { currentBalance, bills, recurringIncome, plannedEvents, days } = input

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const rangeEnd = new Date(today)
  rangeEnd.setDate(rangeEnd.getDate() + days)

  // Initialize day buckets
  const buckets = new Map<string, ForecastEvent[]>()
  for (let i = 0; i <= days; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    buckets.set(toISODate(d), [])
  }

  // Place bills (negative events)
  for (const bill of bills) {
    const dates = projectRecurrence(bill.dueDate, bill.recurrence, today, rangeEnd)
    for (const date of dates) {
      const bucket = buckets.get(date)
      if (bucket) {
        bucket.push({
          name: bill.name,
          amount: -Math.abs(bill.amount), // Bills are always outgoing
          source: 'bill',
        })
      }
    }
  }

  // Place recurring income (positive events)
  for (const income of recurringIncome) {
    // Project monthly from the last known occurrence
    const dates = projectRecurrence(income.lastDate, 'monthly', today, rangeEnd)
    for (const date of dates) {
      const bucket = buckets.get(date)
      if (bucket) {
        bucket.push({
          name: income.name,
          amount: Math.abs(income.amount),
          source: 'income',
        })
      }
    }
  }

  // Place planned events
  for (const event of plannedEvents) {
    const dates = projectRecurrence(event.eventDate, event.recurrence, today, rangeEnd)
    for (const date of dates) {
      const bucket = buckets.get(date)
      if (bucket) {
        bucket.push({
          name: event.name,
          amount: event.amount, // Already signed (negative for expense, positive for income)
          source: 'planned',
        })
      }
    }
  }

  // Walk chronologically, carrying running balance
  const points: ForecastPoint[] = []
  let balance = currentBalance

  const sortedDates = [...buckets.keys()].sort()
  for (const date of sortedDates) {
    const events = buckets.get(date)!
    const dayTotal = events.reduce((sum, e) => sum + e.amount, 0)
    balance += dayTotal

    points.push({
      date,
      balance: Math.round(balance), // Round to whole kr for clean display
      label: toChartLabel(date),
      events,
    })
  }

  return points
}
