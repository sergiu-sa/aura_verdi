'use client'

/**
 * TransactionList — client component with search and category filtering.
 * All filtering happens client-side (no server roundtrip).
 */

import { useState, useMemo } from 'react'
import { Search, ArrowUpDown, RefreshCw } from 'lucide-react'
import { SPENDING_CATEGORIES } from '@/lib/constants/categories'
import { formatNOK } from '@/lib/utils/format-currency'
import Link from 'next/link'

interface Transaction {
  id: string
  transaction_date: string
  description: string | null
  amount: number
  category: string | null
  counterpart_name: string | null
  is_recurring: boolean
}

interface Props {
  transactions: Transaction[]
}

const CATEGORY_OPTIONS = [
  { value: '', label: 'All categories' },
  ...Object.entries(SPENDING_CATEGORIES).map(([key, cat]) => ({
    value: key,
    label: `${cat.emoji} ${cat.label}`,
  })),
]

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('nb-NO', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function getCategoryInfo(category: string | null) {
  if (!category) return { emoji: '❓', label: 'Ukategorisert' }
  const cat = SPENDING_CATEGORIES[category as keyof typeof SPENDING_CATEGORIES]
  return cat ?? { emoji: '❓', label: category }
}

export function TransactionList({ transactions }: Props) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [sortAsc, setSortAsc] = useState(false)

  const filtered = useMemo(() => {
    let result = transactions

    // Category filter
    if (categoryFilter) {
      result = result.filter((tx) => tx.category === categoryFilter)
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (tx) =>
          tx.description?.toLowerCase().includes(q) ||
          tx.counterpart_name?.toLowerCase().includes(q)
      )
    }

    // Sort
    if (sortAsc) {
      result = [...result].sort(
        (a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
      )
    }

    return result
  }, [transactions, categoryFilter, search, sortAsc])

  // ── Empty state ──────────────────────────────────────────────────────────
  if (transactions.length === 0) {
    return (
      <div className="surface p-8 rounded-xl text-center">
        <p className="text-3xl mb-3">🏦</p>
        <p className="text-aura-text text-sm font-medium mb-2">No transactions yet</p>
        <p className="text-aura-text-secondary text-xs leading-relaxed max-w-xs mx-auto mb-5">
          Connect your bank account in Settings to see your transactions here.
        </p>
        <Link
          href="/settings"
          className="text-sm text-aura-primary hover:text-aura-primary-light font-medium transition-colors"
        >
          Go to Settings
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-aura-text-dim" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions..."
            className="w-full bg-aura-surface border border-aura-border rounded-lg pl-9 pr-3 py-2 text-sm text-aura-text placeholder:text-aura-text-dim focus:outline-none focus:border-aura-primary"
          />
        </div>

        {/* Category dropdown */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-aura-surface border border-aura-border rounded-lg px-3 py-2 text-sm text-aura-text focus:outline-none focus:border-aura-primary [color-scheme:dark]"
        >
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* Sort toggle */}
        <button
          onClick={() => setSortAsc((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-2 bg-aura-surface border border-aura-border rounded-lg text-sm text-aura-text-secondary hover:text-aura-text transition-colors"
          title={sortAsc ? 'Oldest first' : 'Newest first'}
        >
          <ArrowUpDown size={14} />
          <span className="hidden sm:inline">{sortAsc ? 'Oldest' : 'Newest'}</span>
        </button>
      </div>

      {/* ── Results count ───────────────────────────────────────────────────── */}
      <p className="text-xs text-aura-text-dim mb-3">
        {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
        {(search || categoryFilter) ? ' (filtered)' : ''}
      </p>

      {/* ── No results ──────────────────────────────────────────────────────── */}
      {filtered.length === 0 && (
        <div className="surface p-6 rounded-xl text-center">
          <p className="text-sm text-aura-text-secondary">No transactions match your filters.</p>
        </div>
      )}

      {/* ── Transaction rows ─────────────────────────────────────────────────── */}
      <div className="space-y-1">
        {filtered.map((tx) => {
          const cat = getCategoryInfo(tx.category)
          const isPositive = tx.amount > 0

          return (
            <div
              key={tx.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-aura-surface transition-colors group"
            >
              {/* Category emoji */}
              <span className="text-base flex-shrink-0 w-7 text-center">{cat.emoji}</span>

              {/* Description + counterpart */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-aura-text truncate">
                  {tx.description ?? 'Unknown transaction'}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {tx.counterpart_name && (
                    <p className="text-[11px] text-aura-text-dim truncate">{tx.counterpart_name}</p>
                  )}
                  {tx.is_recurring && (
                    <span className="flex items-center gap-0.5 text-[10px] text-aura-primary">
                      <RefreshCw size={9} />
                      Recurring
                    </span>
                  )}
                </div>
              </div>

              {/* Date */}
              <span className="text-xs text-aura-text-dim flex-shrink-0 hidden sm:block">
                {formatDate(tx.transaction_date)}
              </span>

              {/* Amount */}
              <span
                className={`text-sm font-medium flex-shrink-0 tabular-nums ${
                  isPositive ? 'text-aura-positive' : 'text-aura-text'
                }`}
              >
                {isPositive ? '+' : ''}{formatNOK(tx.amount)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
