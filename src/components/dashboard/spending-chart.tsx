'use client'

/**
 * SpendingChart — horizontal bar chart showing spending by category (last 30 days).
 *
 * Uses Recharts ResponsiveContainer + BarChart (layout="vertical").
 * Horizontal bars work well on mobile and fit long category names on the Y axis.
 *
 * This is a Client Component because Recharts uses browser APIs.
 * Data is passed as props from the Server Component parent.
 */

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

// ── Types ────────────────────────────────────────────────────────────────────

export interface CategorySpend {
  category: string
  amount: number
}

interface Props {
  data: CategorySpend[]
  totalExpenses: number
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
    <div className="bg-[#1C1C28] border border-[#2C2C3A] rounded-lg px-3 py-2 shadow-xl">
      <p className="text-[#E8E8EC] text-sm font-medium">
        {cat.emoji} {cat.label}
      </p>
      <p className="text-amount text-[#4DD9A0] text-sm">{formatNOK(value)}</p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function SpendingChart({ data, totalExpenses }: Props) {
  if (data.length === 0) {
    return (
      <div className="surface p-5 rounded-xl">
        <p className="text-section-header mb-3">Spending this month</p>
        <p className="text-[#8888A0] text-sm">
          No spending data yet. Sync your bank to see where your money goes.
        </p>
      </div>
    )
  }

  // Map to chart data with display labels
  const chartData = data.map((item) => {
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
        <p className="text-section-header">Spending this month</p>
        <p className="text-amount text-[#E8E8EC] text-sm">
          {formatNOK(totalExpenses)}
        </p>
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
            tick={{ fill: '#8888A0', fontSize: 12 }}
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
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
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
