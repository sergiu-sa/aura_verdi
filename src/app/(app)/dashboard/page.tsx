import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SafeToSpend, SafeToSpendEmpty } from '@/components/dashboard/safe-to-spend'
import { FinancialHealth, type HealthStatus } from '@/components/dashboard/financial-health'
import { BillCountdown } from '@/components/dashboard/bill-countdown'
import { SpendingChart, type CategorySpend } from '@/components/dashboard/spending-chart'
import { DailyTip } from '@/components/dashboard/daily-tip'
import { PartnerOverview } from '@/components/dashboard/partner-overview'
import { ForecastMini } from '@/components/dashboard/forecast-mini'
import { buildForecast } from '@/lib/forecast/engine'

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

// ── Partner data ─────────────────────────────────────────────────────────────

async function getPartnerDashboardData(userId: string) {
  const supabase = await createClient()

  // Check if user has a partner
  const { data: profile } = await supabase
    .from('profiles')
    .select('partner_id')
    .eq('id', userId)
    .single()

  if (!profile?.partner_id) return null

  // Fetch partner's shared accounts and partner name in parallel
  const [sharedRes, partnerRes] = await Promise.all([
    supabase
      .from('accounts')
      .select('account_name, balance')
      .neq('user_id', userId)
      .eq('is_shared_with_partner', true),

    supabase
      .from('profiles')
      .select('display_name')
      .eq('id', profile.partner_id)
      .single(),
  ])

  const accounts = sharedRes.data ?? []
  if (accounts.length === 0) return null

  const partnerName = partnerRes.data?.display_name ?? 'Partner'
  const partnerTotalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0)

  return { partnerName, accounts, partnerTotalBalance }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [data, partnerData] = await Promise.all([
    getDashboardData(user.id),
    getPartnerDashboardData(user.id),
  ])

  // Build a 30-day forecast for the mini sparkline card
  const forecastPoints = data.hasBank
    ? buildForecast({
        currentBalance: data.totalBalance,
        bills: data.bills.map((b) => ({
          name: b.name,
          amount: Number(b.amount),
          dueDate: b.due_date,
          recurrence: null, // Dashboard bills query doesn't fetch recurrence
        })),
        recurringIncome: [],
        plannedEvents: [],
        days: 30,
      })
    : []

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

        {/* ── Forecast Mini ──────────────────────────────────────────── */}
        {forecastPoints.length > 0 && (
          <ForecastMini points={forecastPoints} />
        )}

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

        {/* ── Partner Overview ───────────────────────────────────────── */}
        {partnerData && (
          <div className="sm:col-span-2">
            <PartnerOverview
              partnerName={partnerData.partnerName}
              accounts={partnerData.accounts}
              partnerTotalBalance={partnerData.partnerTotalBalance}
              householdTotal={data.totalBalance + partnerData.partnerTotalBalance}
            />
          </div>
        )}

      </div>
    </div>
  )
}
