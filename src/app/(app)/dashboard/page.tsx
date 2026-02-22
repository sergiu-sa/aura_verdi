import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SafeToSpend, SafeToSpendEmpty } from '@/components/dashboard/safe-to-spend'
import { FinancialHealth, type HealthStatus } from '@/components/dashboard/financial-health'
import { BillCountdown } from '@/components/dashboard/bill-countdown'
import { SpendingChart, type CategorySpend } from '@/components/dashboard/spending-chart'
import { DailyTip } from '@/components/dashboard/daily-tip'

export const metadata: Metadata = { title: 'Dashboard' }

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getDashboardData(userId: string) {
  const supabase = await createClient()

  const now = new Date()
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAhead = new Date(now)
  thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30)

  // Fetch everything in parallel
  const [accountsRes, billsRes, transactionsRes, syncRes] = await Promise.all([
    supabase
      .from('accounts')
      .select('id, balance, account_name, currency')
      .eq('user_id', userId),

    supabase
      .from('bills_upcoming')
      .select('id, name, amount, due_date')
      .eq('user_id', userId)
      .eq('is_paid', false)
      .gte('due_date', now.toISOString().split('T')[0])
      .lte('due_date', thirtyDaysAhead.toISOString().split('T')[0])
      .order('due_date', { ascending: true }),

    supabase
      .from('transactions')
      .select('amount, category, transaction_date')
      .eq('user_id', userId)
      .gte('transaction_date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('transaction_date', { ascending: false }),

    // Get the most recent sync time from any active bank connection
    supabase
      .from('bank_connections')
      .select('last_synced_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('last_synced_at', { ascending: false })
      .limit(1),
  ])

  const accounts = accountsRes.data ?? []
  const bills = billsRes.data ?? []
  const transactions = transactionsRes.data ?? []
  const lastSyncedAt = syncRes.data?.[0]?.last_synced_at ?? null

  const hasBank = accounts.length > 0

  // ── Compute financial metrics ─────────────────────────────────────────────

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0)
  const totalUpcomingBills = bills.reduce((sum, b) => sum + Number(b.amount), 0)
  const safeToSpend = totalBalance - totalUpcomingBills

  // Separate income and expenses
  const spendingByCategory: Record<string, number> = {}
  let totalMonthlyIncome = 0
  let totalMonthlyExpenses = 0

  for (const tx of transactions) {
    const amount = Number(tx.amount)
    if (amount > 0) {
      totalMonthlyIncome += amount
    } else {
      totalMonthlyExpenses += Math.abs(amount)
      const cat = tx.category ?? 'ukategorisert'
      spendingByCategory[cat] = (spendingByCategory[cat] ?? 0) + Math.abs(amount)
    }
  }

  // Top spending categories, sorted by amount descending (top 8 for chart)
  const sortedCategories: CategorySpend[] = Object.entries(spendingByCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([category, amount]) => ({ category, amount }))

  const topCategory = sortedCategories[0]?.category ?? null
  const topCategoryAmount = sortedCategories[0]?.amount ?? 0

  // ── Health status ─────────────────────────────────────────────────────────

  let healthStatus: HealthStatus = 'no-data'
  if (hasBank && (totalMonthlyIncome > 0 || totalMonthlyExpenses > 0)) {
    const expenseRatio =
      totalMonthlyIncome > 0 ? totalMonthlyExpenses / totalMonthlyIncome : 1

    if (expenseRatio < 0.75 && safeToSpend > 5_000) {
      healthStatus = 'good'
    } else if (expenseRatio <= 1.0 && safeToSpend > 1_000) {
      healthStatus = 'caution'
    } else {
      healthStatus = 'critical'
    }
  } else if (hasBank) {
    // Bank connected but no transactions yet
    healthStatus = 'no-data'
  }

  // ── Next bill info for daily tip ──────────────────────────────────────────

  const nextBill = bills[0] ?? null
  let nextBillDays: number | null = null
  if (nextBill) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(nextBill.due_date)
    due.setHours(0, 0, 0, 0)
    nextBillDays = Math.round(
      (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )
  }

  return {
    hasBank,
    accounts,
    totalBalance,
    totalUpcomingBills,
    safeToSpend,
    totalMonthlyIncome,
    totalMonthlyExpenses,
    healthStatus,
    bills,
    sortedCategories,
    topCategory,
    topCategoryAmount,
    nextBillName: nextBill?.name ?? null,
    nextBillDays,
    nextBillAmount: Number(nextBill?.amount ?? 0),
    lastSyncedAt,
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const data = await getDashboardData(user.id)

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto animate-fade-in">
      <p className="text-section-header mb-2">Overview</p>
      <h1 className="font-display text-4xl text-aura-text mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* ── Safe to Spend — THE primary number ─────────────────────── */}
        <div className="sm:col-span-2">
          {data.hasBank ? (
            <SafeToSpend
              safeToSpend={data.safeToSpend}
              totalBalance={data.totalBalance}
              totalUpcomingBills={data.totalUpcomingBills}
              accountCount={data.accounts.length}
            />
          ) : (
            <SafeToSpendEmpty />
          )}
        </div>

        {/* ── Financial Health ──────────────────────────────────────── */}
        <FinancialHealth
          status={data.healthStatus}
          totalMonthlyIncome={data.totalMonthlyIncome}
          totalMonthlyExpenses={data.totalMonthlyExpenses}
          safeToSpend={data.safeToSpend}
        />

        {/* ── Bill Countdown ────────────────────────────────────────── */}
        <BillCountdown bills={data.bills} />

        {/* ── Daily Tip ─────────────────────────────────────────────── */}
        <DailyTip
          safeToSpend={data.safeToSpend}
          topCategory={data.topCategory}
          topCategoryAmount={data.topCategoryAmount}
          nextBillName={data.nextBillName}
          nextBillDays={data.nextBillDays}
          nextBillAmount={data.nextBillAmount}
          hasBank={data.hasBank}
          lastSyncedAt={data.lastSyncedAt}
        />

        {/* ── Spending Chart ────────────────────────────────────────── */}
        <SpendingChart
          data={data.sortedCategories}
          totalExpenses={data.totalMonthlyExpenses}
        />

      </div>
    </div>
  )
}
