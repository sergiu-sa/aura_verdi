'use client'

/**
 * SpendingTrend — monthly spending comparison with sparkline.
 *
 * Shows a 6-month bar chart of spending + income, with month-over-month change.
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
import { formatNOK, formatNOKCompact } from '@/lib/utils/format-currency'
import { useThemeColors } from '@/hooks/use-theme-colors'

interface MonthData {
  month: string   // YYYY-MM
  spending: number
  income: number
}

interface Props {
  data: MonthData[]
}

function formatMonth(yyyymm: string): string {
  const [year, month] = yyyymm.split('-')
  const names = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des']
  return `${names[parseInt(month) - 1]} ${year.slice(2)}`
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ value: number; dataKey: string; payload: MonthData }>
}) {
  if (!active || !payload?.length) return null
  const item = payload[0].payload
  return (
    <div className="bg-aura-surface border border-aura-border rounded-lg px-3 py-2 shadow-xl">
      <p className="text-aura-text text-xs font-medium mb-1">{formatMonth(item.month)}</p>
      <p className="text-xs text-aura-danger">Spending: {formatNOK(item.spending)}</p>
      {item.income > 0 && (
        <p className="text-xs text-aura-positive">Income: {formatNOK(item.income)}</p>
      )}
    </div>
  )
}

export function SpendingTrend({ data }: Props) {
  const colors = useThemeColors()
  if (data.length < 2) return null

  // Month-over-month comparison
  const current = data[data.length - 1]
  const previous = data[data.length - 2]
  const diff = current.spending - previous.spending
  const pctChange = previous.spending > 0
    ? Math.round((diff / previous.spending) * 100)
    : 0

  return (
    <div className="surface p-5 rounded-xl">
      <div className="flex items-center justify-between mb-1">
        <p className="text-section-header">Spending trend</p>
        {pctChange !== 0 && (
          <span className={`text-xs font-medium ${pctChange > 0 ? 'text-aura-danger' : 'text-aura-positive'}`}>
            {pctChange > 0 ? '↑' : '↓'} {Math.abs(pctChange)}% vs last month
          </span>
        )}
      </div>
      <p className="text-xs text-aura-text-secondary mb-3">
        {formatMonth(current.month)}: {formatNOKCompact(current.spending)} spent
      </p>

      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="month"
            tickFormatter={formatMonth}
            tick={{ fill: colors.chartAxis, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide domain={[0, 'dataMax']} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: colors.hoverOverlay }} />
          <Bar dataKey="spending" radius={[3, 3, 0, 0]} barSize={20}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={i === data.length - 1 ? colors.primary : colors.border}
                fillOpacity={i === data.length - 1 ? 1 : 0.8}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
