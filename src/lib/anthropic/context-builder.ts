import type { SupabaseClient } from '@supabase/supabase-js'
import { formatNOK } from '@/lib/utils/format-currency'
import { LEGAL_REFERENCES, type LegalReference } from '@/lib/constants/legal-references'

/**
 * Maps user situations (document types, financial status) to relevant law keys.
 * When a situation is detected, the corresponding laws are injected into
 * Claude's context so it can give specific, law-backed advice.
 */
const SITUATION_LAW_MAP: Record<string, string[]> = {
  // Document types (from document-analysis.ts classification)
  inkasso: ['inkassoloven', 'tvangsfullbyrdelsesloven', 'gjeldsordningsloven', 'forsinkelsesrenteloven'],
  letter: ['inkassoloven', 'finansavtaleloven'],
  contract: ['husleieloven', 'finansavtaleloven', 'forbrukerkjopsloven'],
  invoice: ['forsinkelsesrenteloven', 'forbrukerkjopsloven'],
  tax: ['finansavtaleloven'],
  bank_statement: ['finansavtaleloven'],
  // Financial status triggers
  overdue_bills: ['inkassoloven', 'forsinkelsesrenteloven', 'tvangsfullbyrdelsesloven'],
  low_balance: ['gjeldsordningsloven', 'inkassoloven'],
}

/**
 * Determines which legal references are relevant based on the user's
 * document types and financial status. Returns deduplicated references
 * with the reason they're relevant.
 */
function getRelevantLaws(
  documentTypes: string[],
  hasOverdueBills: boolean,
  safeToSpend: number
): { ref: LegalReference; reasons: string[] }[] {
  const lawReasons = new Map<string, string[]>()

  // Check document types
  for (const docType of documentTypes) {
    const lawKeys = SITUATION_LAW_MAP[docType]
    if (!lawKeys) continue
    for (const key of lawKeys) {
      const existing = lawReasons.get(key) ?? []
      existing.push(`${docType} document on file`)
      lawReasons.set(key, existing)
    }
  }

  // Check financial status
  if (hasOverdueBills) {
    for (const key of SITUATION_LAW_MAP.overdue_bills) {
      const existing = lawReasons.get(key) ?? []
      existing.push('overdue bills detected')
      lawReasons.set(key, existing)
    }
  }

  if (safeToSpend <= 0) {
    for (const key of SITUATION_LAW_MAP.low_balance) {
      const existing = lawReasons.get(key) ?? []
      existing.push('no safe-to-spend margin')
      lawReasons.set(key, existing)
    }
  }

  // Match keys to full references
  const results: { ref: LegalReference; reasons: string[] }[] = []
  for (const [key, reasons] of lawReasons) {
    const ref = LEGAL_REFERENCES.find((r) => r.key === key)
    if (ref) {
      // Deduplicate reasons
      results.push({ ref, reasons: [...new Set(reasons)] })
    }
  }

  return results
}

/**
 * Builds a summarized financial context string to inject into Claude API calls.
 *
 * PRIVACY CRITICAL:
 * - Never include account numbers, IBANs, or personal identifiers
 * - Only include aggregated/summarized figures
 * - Raw bank data stays in Supabase — only summaries cross the Atlantic to Claude
 *
 * @param supabase - Authenticated Supabase client (scoped to the current user)
 * @param userId - The authenticated user's ID
 * @returns A plain-text context block to prepend to the system prompt
 */
export async function buildFinancialContext(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const now = new Date()
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAhead = new Date(now)
  thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30)

  // Fetch all data in parallel for speed
  const [accountsRes, billsRes, transactionsRes, docsRes, allDocTypesRes, partnerAccountsRes] = await Promise.all([
    supabase
      .from('accounts')
      .select('balance, account_name, currency')
      .eq('user_id', userId),

    supabase
      .from('bills_upcoming')
      .select('name, amount, due_date')
      .eq('user_id', userId)
      .eq('is_paid', false)
      .lte('due_date', thirtyDaysAhead.toISOString().split('T')[0])
      .order('due_date', { ascending: true }),

    supabase
      .from('transactions')
      .select('amount, category, transaction_date')
      .eq('user_id', userId)
      .gte('transaction_date', thirtyDaysAgo.toISOString().split('T')[0]),

    supabase
      .from('documents')
      .select('document_type, ai_summary, status')
      .eq('user_id', userId)
      .eq('status', 'analyzed')
      .order('uploaded_at', { ascending: false })
      .limit(3),

    // All document types the user has (for legal context mapping)
    supabase
      .from('documents')
      .select('document_type')
      .eq('user_id', userId)
      .eq('status', 'analyzed'),

    // Partner's shared accounts (RLS enforces access)
    supabase
      .from('accounts')
      .select('account_name, balance')
      .neq('user_id', userId)
      .eq('is_shared_with_partner', true),
  ])

  const accounts = accountsRes.data ?? []
  const bills = billsRes.data ?? []
  const transactions = transactionsRes.data ?? []
  const recentDocs = docsRes.data ?? []
  const allDocTypes = allDocTypesRes.data ?? []
  const partnerAccounts = partnerAccountsRes.data ?? []

  // Deduplicated list of document types the user has
  const userDocTypes = [...new Set(allDocTypes.map((d) => d.document_type).filter(Boolean))]

  // Check if any bills are overdue (due_date in the past)
  const today = now.toISOString().split('T')[0]
  const hasOverdueBills = bills.some((b) => b.due_date < today)

  // If no bank data yet, return a "not connected" context
  if (accounts.length === 0) {
    return `## USER'S FINANCIAL OVERVIEW (${now.toLocaleDateString('nb-NO')})

No bank accounts connected yet.
The user has not linked a bank account via the app.
If they ask about their finances, gently suggest connecting their bank in Settings.
You can still answer general financial and legal questions.`
  }

  // Aggregate balances
  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0)
  const totalUpcomingBills = bills.reduce((sum, b) => sum + Number(b.amount), 0)
  const safeToSpend = Math.max(0, totalBalance - totalUpcomingBills)

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

  // Build the context string — concise, no PII
  let context = `## USER'S FINANCIAL OVERVIEW (${now.toLocaleDateString('nb-NO')})

Total available balance: ${formatNOK(totalBalance)}
Safe to spend (after upcoming bills): ${formatNOK(safeToSpend)}
Connected accounts: ${accounts.length}

Income last 30 days: ${formatNOK(totalMonthlyIncome)}
Expenses last 30 days: ${formatNOK(totalMonthlyExpenses)}
`

  if (bills.length > 0) {
    context += `\nUpcoming bills (next 30 days):\n`
    for (const b of bills) {
      const dueDate = new Date(b.due_date).toLocaleDateString('nb-NO')
      context += `- ${b.name}: ${formatNOK(Number(b.amount))} — due ${dueDate}\n`
    }
  } else {
    context += `\nNo upcoming bills recorded.\n`
  }

  const topCategories = Object.entries(spendingByCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)

  if (topCategories.length > 0) {
    context += `\nTop spending categories (last 30 days):\n`
    for (const [cat, amt] of topCategories) {
      context += `- ${cat}: ${formatNOK(amt)}\n`
    }
  }

  if (recentDocs.length > 0) {
    context += `\nRecently analyzed documents:\n`
    for (const d of recentDocs) {
      const summary = d.ai_summary?.slice(0, 150) ?? 'No summary'
      context += `- ${d.document_type}: ${summary}\n`
    }
  }

  if (partnerAccounts.length > 0) {
    const partnerTotal = partnerAccounts.reduce((sum, a) => sum + Number(a.balance), 0)
    const householdTotal = totalBalance + partnerTotal

    context += `\n## PARTNER'S SHARED ACCOUNTS\n`
    context += `Shared accounts: ${partnerAccounts.length}\n`
    context += `Partner shared balance: ${formatNOK(partnerTotal)}\n`
    for (const a of partnerAccounts) {
      context += `- ${a.account_name}: ${formatNOK(Number(a.balance))}\n`
    }
    context += `Combined household balance: ${formatNOK(householdTotal)}\n`
  }

  // ── Situation-aware legal references ──────────────────────────────────
  const relevantLaws = getRelevantLaws(userDocTypes, hasOverdueBills, safeToSpend)

  if (relevantLaws.length > 0) {
    context += `\n## APPLICABLE LAWS FOR THIS USER\n`
    context += `The following Norwegian laws are relevant based on the user's documents and financial status. Cite these actively when the user asks related questions.\n\n`
    for (const { ref, reasons } of relevantLaws) {
      context += `### ${ref.nameno} (${ref.nameen})\n`
      context += `- Why relevant: ${reasons.join('; ')}\n`
      context += `- Key rights: ${ref.relevance}\n`
      context += `- Official text: ${ref.lovdataUrl}\n`
      context += `- Last verified: ${ref.lastVerified}\n\n`
    }
  }

  return context
}
