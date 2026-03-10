'use client'

/**
 * ForecastChart — area chart showing projected balance over time.
 *
 * Receives the full 90-day forecast from the server. The user can
 * toggle between 30/60/90 day views (client-side filtering, no refetch).
 *
 * Color zones: green (safe), amber (caution), red (danger) based on
 * projected balance thresholds matching SafeToSpend logic.
 */

import { useState, useMemo } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts'
import { formatNOK, formatNOKCompact } from '@/lib/utils/format-currency'
import { useThemeColors } from '@/hooks/use-theme-colors'
import type { ForecastPoint } from '@/types/financial'

const WARNING_THRESHOLD = 5_000
const DANGER_THRESHOLD = 1_000

const RANGES = [
  { label: '30 days', days: 30 },
  { label: '60 days', days: 60 },
  { label: '90 days', days: 90 },
] as const

interface Props {
  points: ForecastPoint[]
}

// ── Custom tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  colors,
}: {
  active?: boolean
  payload?: Array<{ payload: ForecastPoint }>
  colors?: { positive: string; danger: string; warning: string }
}) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload

  let balanceColor = colors?.positive ?? '#4DD9A0'
  if (point.balance < DANGER_THRESHOLD) balanceColor = colors?.danger ?? '#C75050'
  else if (point.balance < WARNING_THRESHOLD) balanceColor = colors?.warning ?? '#D4A039'

  // Format date as Norwegian
  const date = new Date(point.date).toLocaleDateString('nb-NO', {
    day: 'numeric',
    month: 'short',
  })

  return (
    <div className="bg-aura-surface border border-aura-border rounded-lg px-3 py-2 shadow-xl max-w-[200px]">
      <p className="text-aura-text-secondary text-xs mb-1">{date}</p>
      <p className="text-sm font-medium" style={{ color: balanceColor }}>
        {formatNOK(point.balance)}
      </p>
      {point.events.length > 0 && (
        <div className="mt-1.5 pt-1.5 border-t border-aura-border">
          {point.events.map((e, i) => (
            <p key={i} className="text-xs text-aura-text-secondary truncate">
              <span className={e.amount < 0 ? 'text-aura-danger' : 'text-aura-positive'}>
                {e.amount < 0 ? '−' : '+'}{formatNOK(Math.abs(e.amount)).replace(' kr', '')}
              </span>
              {' '}{e.name}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export function ForecastChart({ points }: Props) {
  const colors = useThemeColors()
  const [range, setRange] = useState(30)

  const filteredPoints = useMemo(
    () => points.slice(0, range + 1),
    [points, range]
  )

  // Compute gradient stops based on data range
  const { minBal, maxBal } = useMemo(() => {
    let min = Infinity
    let max = -Infinity
    for (const p of filteredPoints) {
      if (p.balance < min) min = p.balance
      if (p.balance > max) max = p.balance
    }
    return { minBal: min, maxBal: max }
  }, [filteredPoints])

  // Calculate Y-axis percentage positions for threshold lines
  const yRange = maxBal - minBal
  const warningPct = yRange > 0
    ? Math.max(0, Math.min(1, (maxBal - WARNING_THRESHOLD) / yRange))
    : 0
  const dangerPct = yRange > 0
    ? Math.max(0, Math.min(1, (maxBal - DANGER_THRESHOLD) / yRange))
    : 0

  // Lowest point info
  const lowestPoint = useMemo(() => {
    let lowest = filteredPoints[0]
    for (const p of filteredPoints) {
      if (p.balance < lowest.balance) lowest = p
    }
    return lowest
  }, [filteredPoints])

  let lowestColor = 'text-aura-positive'
  if (lowestPoint.balance < DANGER_THRESHOLD) lowestColor = 'text-aura-danger'
  else if (lowestPoint.balance < WARNING_THRESHOLD) lowestColor = 'text-aura-warning'

  const lowestDate = new Date(lowestPoint.date).toLocaleDateString('nb-NO', {
    day: 'numeric',
    month: 'short',
  })

  // Tick interval: show roughly 5-6 labels
  const tickInterval = Math.max(1, Math.floor(filteredPoints.length / 6))

  return (
    <div className="surface p-5 rounded-xl mb-4">
      {/* Header + range tabs */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-section-header">Projected balance</p>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setRange(r.days)}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                range === r.days
                  ? 'bg-aura-primary text-white'
                  : 'text-aura-text-secondary hover:text-aura-text hover:bg-aura-border'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={filteredPoints}
          margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
        >
          <defs>
            <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.positive} stopOpacity={0.3} />
              <stop offset={`${warningPct * 100}%`} stopColor={colors.warning} stopOpacity={0.2} />
              <stop offset={`${dangerPct * 100}%`} stopColor={colors.danger} stopOpacity={0.15} />
              <stop offset="100%" stopColor={colors.danger} stopOpacity={0.05} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="label"
            tick={{ fill: colors.chartAxis, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval={tickInterval}
          />

          <YAxis
            tickFormatter={(v: number) => formatNOKCompact(v)}
            tick={{ fill: colors.chartAxis, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={70}
          />

          <Tooltip content={<ChartTooltip colors={colors} />} />

          {/* Warning threshold line */}
          {minBal < WARNING_THRESHOLD && maxBal > WARNING_THRESHOLD && (
            <ReferenceLine
              y={WARNING_THRESHOLD}
              stroke={colors.warning}
              strokeDasharray="4 4"
              strokeOpacity={0.5}
            />
          )}

          {/* Danger threshold line */}
          {minBal < DANGER_THRESHOLD && maxBal > DANGER_THRESHOLD && (
            <ReferenceLine
              y={DANGER_THRESHOLD}
              stroke={colors.danger}
              strokeDasharray="4 4"
              strokeOpacity={0.5}
            />
          )}

          <Area
            type="monotone"
            dataKey="balance"
            stroke={colors.primary}
            strokeWidth={2}
            fill="url(#forecastGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Lowest point summary */}
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-aura-text-secondary">
          Lowest point: <span className={lowestColor}>{formatNOK(lowestPoint.balance)}</span> on {lowestDate}
        </span>
        {lowestPoint.balance < WARNING_THRESHOLD && (
          <span className={`${lowestColor} text-[10px]`}>
            {lowestPoint.balance < DANGER_THRESHOLD ? 'Balance goes critical' : 'Balance gets tight'}
          </span>
        )}
      </div>
    </div>
  )
}
