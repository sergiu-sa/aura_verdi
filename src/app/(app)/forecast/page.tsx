import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { buildForecast } from '@/lib/forecast/engine'
import { ForecastChart } from '@/components/forecast/forecast-chart'
import { EventTimeline } from '@/components/forecast/event-timeline'
import type { PlannedEvent } from '@/types/financial'

export const metadata: Metadata = { title: 'Forecast' }

async function getForecastData(userId: string) {
  const supabase = await createClient()

  const now = new Date()
  const ninetyDaysAgo = new Date(now)
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const [accountsRes, billsRes, incomeRes, eventsRes] = await Promise.all([
    supabase
      .from('accounts')
      .select('balance')
      .eq('user_id', userId),

    // All unpaid bills (including future recurring ones)
    supabase
      .from('bills_upcoming')
      .select('name, amount, due_date, recurrence')
      .eq('user_id', userId)
      .eq('is_paid', false)
      .order('due_date', { ascending: true }),

    // Recurring income: positive recurring transactions from the last 90 days
    supabase
      .from('transactions')
      .select('description, amount, transaction_date')
      .eq('user_id', userId)
      .eq('is_recurring', true)
      .gt('amount', 0)
      .gte('transaction_date', ninetyDaysAgo.toISOString().split('T')[0])
      .order('transaction_date', { ascending: false }),

    // User's planned events
    supabase
      .from('planned_events')
      .select('id, name, amount, event_date, recurrence, category, notes')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('event_date', { ascending: true }),
  ])

  const accounts = accountsRes.data ?? []
  const bills = billsRes.data ?? []
  const incomeTransactions = incomeRes.data ?? []
  const plannedEvents = eventsRes.data ?? []

  const currentBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0)

  // Deduplicate recurring income by description (keep the most recent occurrence)
  const incomeMap = new Map<string, { name: string; amount: number; lastDate: string }>()
  for (const tx of incomeTransactions) {
    const key = tx.description ?? `income-${tx.amount}`
    if (!incomeMap.has(key)) {
      incomeMap.set(key, {
        name: tx.description ?? 'Recurring income',
        amount: Number(tx.amount),
        lastDate: tx.transaction_date,
      })
    }
  }

  const forecastInput = {
    currentBalance,
    bills: bills.map((b) => ({
      name: b.name,
      amount: Number(b.amount),
      dueDate: b.due_date,
      recurrence: b.recurrence,
    })),
    recurringIncome: [...incomeMap.values()],
    plannedEvents: plannedEvents.map((e) => ({
      name: e.name,
      amount: Number(e.amount),
      eventDate: e.event_date,
      recurrence: e.recurrence,
    })),
    days: 90,
  }

  // Build full 90-day forecast (client will filter to 30/60/90)
  const forecastPoints = buildForecast(forecastInput)

  return {
    currentBalance,
    forecastPoints,
    bills: bills.map((b) => ({
      name: b.name,
      amount: Number(b.amount),
      dueDate: b.due_date,
      recurrence: b.recurrence,
    })),
    plannedEvents: plannedEvents.map((e) => ({
      id: e.id,
      name: e.name,
      amount: Number(e.amount),
      eventDate: e.event_date,
      recurrence: e.recurrence as PlannedEvent['recurrence'],
      category: e.category as string | null,
      notes: e.notes as string | null,
    })),
    hasBank: accounts.length > 0,
  }
}

export default async function ForecastPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const data = await getForecastData(user.id)

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto animate-fade-in">
      <p className="text-section-header mb-2">Cash Flow</p>
      <h1 className="font-display text-4xl text-aura-text mb-6">Forecast</h1>

      {!data.hasBank ? (
        <div className="surface p-8 rounded-xl text-center">
          <p className="text-aura-text-secondary text-sm">
            Connect your bank account in Settings to see your cash flow forecast.
          </p>
        </div>
      ) : (
        <>
          <ForecastChart points={data.forecastPoints} />
          <EventTimeline
            bills={data.bills}
            plannedEvents={data.plannedEvents}
          />
        </>
      )}
    </div>
  )
}
