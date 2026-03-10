'use client'

/**
 * ForecastMini — compact sparkline card for the dashboard.
 *
 * Shows a tiny 30-day balance trajectory chart and the lowest
 * projected balance, with a link to the full forecast page.
 */

import Link from 'next/link'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import { formatNOK } from '@/lib/utils/format-currency'
import { useThemeColors } from '@/hooks/use-theme-colors'
import type { ForecastPoint } from '@/types/financial'

interface Props {
  points: ForecastPoint[] // 30-day forecast
}

export function ForecastMini({ points }: Props) {
  const colors = useThemeColors()
  if (points.length === 0) return null

  // Find lowest point
  let lowest = points[0]
  for (const p of points) {
    if (p.balance < lowest.balance) lowest = p
  }

  let lowestColor = 'text-aura-positive'
  if (lowest.balance < 1_000) lowestColor = 'text-aura-danger'
  else if (lowest.balance < 5_000) lowestColor = 'text-aura-warning'

  const lowestDate = new Date(lowest.date).toLocaleDateString('nb-NO', {
    day: 'numeric',
    month: 'short',
  })

  return (
    <div className="surface p-5 rounded-xl">
      <p className="text-section-header mb-3">30-day outlook</p>

      {/* Mini sparkline */}
      <ResponsiveContainer width="100%" height={80}>
        <AreaChart data={points} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <Area
            type="monotone"
            dataKey="balance"
            stroke={colors.primary}
            strokeWidth={1.5}
            fill={colors.primary}
            fillOpacity={0.1}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Lowest point */}
      <p className="text-xs text-aura-text-secondary mt-2">
        Lowest: <span className={lowestColor}>{formatNOK(lowest.balance)}</span> on {lowestDate}
      </p>

      <Link
        href="/forecast"
        className="text-xs text-aura-primary hover:text-aura-primary-light transition-colors mt-1 inline-block"
      >
        View full forecast &rarr;
      </Link>
    </div>
  )
}
