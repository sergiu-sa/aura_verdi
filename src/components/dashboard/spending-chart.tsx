'use client'

/**
 * SpendingChart — horizontal bar chart showing spending by category.
 *
 * Supports time range selection: 7d, 30d, 90d, 1y.
 * When `transactions` prop is provided, it aggregates client-side by range.
 * Falls back to static `data`/`totalExpenses` props when transactions are unavailable.
 */

import { useState, useMemo } from 'react'
import { useThemeColors } from '@/hooks/use-theme-colors'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts'
import { formatNOK } from '@/lib/utils/format-currency'
import { SPENDING_CATEGORIES } from '@/lib/constants/categories'
import { cn } from '@/lib/utils/cn'

// ── Types ────────────────────────────────────────────────────────────────────

export interface CategorySpend {
  category: string
  amount: number
}

type TimeRange = '7d' | '30d' | '90d' | '1y'

interface TransactionRow {
  amount: number
  category: string | null
  transaction_date: string
}

interface Props {
  data: CategorySpend[]
  totalExpenses: number
  transactions?: TransactionRow[]
}

const RANGE_DAYS: Record<TimeRange, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '1y': 365,
}

const RANGE_LABELS: Record<TimeRange, string> = {
  '7d': 'Spending (7 days)',
  '30d': 'Spending (30 days)',
  '90d': 'Spending (90 days)',
  '1y': 'Spending (1 year)',
}

// ── Custom tooltip ────────────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ value: number; payload: CategorySpend }>
}) {
  if (!active || !payload?.length) return null
  const { value, payload: item } = payload[0]
  const catKey = item.category as keyof typeof SPENDING_CATEGORIES
  const cat = SPENDING_CATEGORIES[catKey] ?? SPENDING_CATEGORIES.annet

  return (
    <div className="bg-aura-surface border border-aura-border rounded-lg px-3 py-2 shadow-xl">
      <p className="text-aura-text text-sm font-medium">
        {cat.emoji} {cat.label}
      </p>
      <p className="text-amount text-aura-positive text-sm">{formatNOK(value)}</p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function SpendingChart({ data, totalExpenses, transactions }: Props) {
  const [range, setRange] = useState<TimeRange>('30d')
  const colors = useThemeColors()

  // Compute chart data from transactions when available, filtered by range
  const { chartCategories, chartTotal } = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return { chartCategories: data, chartTotal: totalExpenses }
    }

    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - RANGE_DAYS[range])
    const cutoffStr = cutoff.toISOString().split('T')[0]

    const byCategory: Record<string, number> = {}
    let total = 0

    for (const tx of transactions) {
      if (tx.transaction_date < cutoffStr) continue
      const amount = tx.amount
      if (amount >= 0) continue // skip income
      const abs = Math.abs(amount)
      total += abs
      const cat = tx.category ?? 'ukategorisert'
      byCategory[cat] = (byCategory[cat] ?? 0) + abs
    }

    const sorted: CategorySpend[] = Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([category, amount]) => ({ category, amount }))

    return { chartCategories: sorted, chartTotal: total }
  }, [transactions, range, data, totalExpenses])

  if (chartCategories.length === 0) {
    return (
      <div className="surface p-5 rounded-xl">
        <p className="text-section-header mb-3">Spending this month</p>
        <p className="text-aura-text-secondary text-sm">
          No spending data yet. Sync your bank to see where your money goes.
        </p>
      </div>
    )
  }

  // Map to chart data with display labels
  const chartData = chartCategories.map((item) => {
    const catKey = item.category as keyof typeof SPENDING_CATEGORIES
    const cat = SPENDING_CATEGORIES[catKey] ?? SPENDING_CATEGORIES.annet
    return {
      ...item,
      label: `${cat.emoji} ${cat.label}`,
      color: cat.color,
    }
  })

  // Dynamic chart height: 52px per bar, min 200px
  const chartHeight = Math.max(200, chartData.length * 52)

  return (
    <div className="surface p-5 rounded-xl col-span-1 sm:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <p className="text-section-header">{transactions ? RANGE_LABELS[range] : 'Spending this month'}</p>
        <div className="flex items-center gap-3">
          {transactions && (
            <div className="flex gap-1">
              {(['7d', '30d', '90d', '1y'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={cn(
                    'px-2 py-0.5 rounded text-xs transition-colors',
                    range === r
                      ? 'bg-aura-primary text-white'
                      : 'text-aura-text-secondary hover:text-aura-text'
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
          <p className="text-amount text-aura-text text-sm">
            {formatNOK(chartTotal)}
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
          barSize={14}
        >
          {/* Y axis — category labels */}
          <YAxis
            dataKey="label"
            type="category"
            width={140}
            tick={{ fill: colors.chartAxis, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />

          {/* X axis — amounts (hidden, amounts shown in tooltip) */}
          <XAxis
            type="number"
            hide
            domain={[0, 'dataMax']}
          />

          {/* Custom tooltip */}
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: colors.hoverOverlay }}
          />

          {/* Bars — each category gets its own color */}
          <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.color} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
