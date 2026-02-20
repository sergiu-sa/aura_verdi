/**
 * Core financial data types for Aura.
 * These mirror the database schema but are typed for safe use in the frontend.
 */

import type { SpendingCategory } from '@/lib/constants/categories'

// ── Bank Account ──────────────────────────────────────────────────────────────

export interface Account {
  id: string
  userId: string
  bankConnectionId: string
  accountName: string | null
  balance: number
  currency: string
  accountType: string | null
  isSharedWithPartner: boolean
  lastUpdatedAt: string
}

// ── Transaction ───────────────────────────────────────────────────────────────

export interface Transaction {
  id: string
  accountId: string
  userId: string
  transactionDate: string // ISO date "yyyy-mm-dd"
  bookingDate: string | null
  amount: number // Negative = expense, positive = income
  currency: string
  description: string | null
  category: SpendingCategory | null
  categoryConfidence: number | null
  isRecurring: boolean
  counterpartName: string | null
  internalReference: string | null
}

// ── Upcoming Bill ─────────────────────────────────────────────────────────────

export interface UpcomingBill {
  id: string
  userId: string
  name: string
  amount: number
  currency: string
  dueDate: string // ISO date "yyyy-mm-dd"
  isAutoDetected: boolean
  isPaid: boolean
  category: SpendingCategory | null
  recurrence: 'once' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | null
}

// ── Financial Snapshot (sent to Claude — no PII) ──────────────────────────────

export interface FinancialSnapshot {
  date: string
  totalBalance: number
  safeToSpend: number
  connectedAccounts: number
  monthlyIncome: number
  monthlyExpenses: number
  upcomingBills: Array<{
    name: string
    amount: number
    dueDate: string
  }>
  spendingByCategory: Record<string, number>
  recentDocumentSummaries: Array<{
    type: string
    summary: string
  }>
}

// ── Financial Health Status ───────────────────────────────────────────────────

export type HealthStatus = 'safe' | 'caution' | 'danger'

export interface FinancialHealth {
  status: HealthStatus
  safeToSpend: number
  nextBillName: string | null
  nextBillAmount: number | null
  nextBillDays: number | null
  monthlyDeficit: number // Positive = surplus, negative = deficit
}
