'use client'

/**
 * BalanceDistribution — horizontal stacked bar showing what percentage
 * of total balance each account holds.
 *
 * Positive balances extend right, negative balances extend left.
 * Labels shown on segments > 8% width; narrow segments use tooltip only.
 */

import { useState, useMemo } from 'react'
import { formatNOK } from '@/lib/utils/format-currency'

export interface DistributionAccount {
  id: string
  account_name: string
  balance: number
}

interface Props {
  accounts: DistributionAccount[]
}

interface Segment {
  id: string
  account_name: string
  balance: number
  color: string
  pctOfBar: number
  pctOfSide: number
}

const POSITIVE_COLORS = [
  '#0D7377', // teal primary
  '#4DD9A0', // green
  '#11999E', // teal light
  '#2D8B6F', // muted green
  '#3DBFA8', // mid teal
]

const NEGATIVE_COLORS = [
  '#C75050', // red primary
  '#E07070', // light red
  '#A03030', // dark red
]

export function BalanceDistribution({ accounts }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  const {
    positiveSegments,
    negativeSegments,
    positiveFraction,
    negativeFraction,
    grandTotal,
  } = useMemo(() => {
    const nonZero = accounts.filter((a) => a.balance !== 0)
    if (nonZero.length === 0) {
      return {
        positiveSegments: [],
        negativeSegments: [],
        positiveFraction: 0,
        negativeFraction: 0,
        grandTotal: 0,
      }
    }

    const positiveAccounts = nonZero
      .filter((a) => a.balance > 0)
      .sort((a, b) => b.balance - a.balance)

    const negativeAccounts = nonZero
      .filter((a) => a.balance < 0)
      .sort((a, b) => a.balance - b.balance) // most negative first

    const positiveTotal = positiveAccounts.reduce((s, a) => s + a.balance, 0)
    const negativeAbsTotal = negativeAccounts.reduce(
      (s, a) => s + Math.abs(a.balance),
      0
    )
    const total = positiveTotal + negativeAbsTotal

    const posFraction = total > 0 ? positiveTotal / total : 0
    const negFraction = total > 0 ? negativeAbsTotal / total : 0

    const posSegments: Segment[] = positiveAccounts.map((a, i) => ({
      id: a.id,
      account_name: a.account_name,
      balance: a.balance,
      color: POSITIVE_COLORS[i % POSITIVE_COLORS.length],
      pctOfBar: (a.balance / total) * 100,
      pctOfSide: positiveTotal > 0 ? (a.balance / positiveTotal) * 100 : 0,
    }))

    const negSegments: Segment[] = negativeAccounts.map((a, i) => ({
      id: a.id,
      account_name: a.account_name,
      balance: a.balance,
      color: NEGATIVE_COLORS[i % NEGATIVE_COLORS.length],
      pctOfBar: (Math.abs(a.balance) / total) * 100,
      pctOfSide:
        negativeAbsTotal > 0
          ? (Math.abs(a.balance) / negativeAbsTotal) * 100
          : 0,
    }))

    return {
      positiveSegments: posSegments,
      negativeSegments: negSegments,
      positiveFraction: posFraction,
      negativeFraction: negFraction,
      grandTotal: total,
    }
  }, [accounts])

  if (grandTotal === 0) return null

  const hoveredSegment = [...positiveSegments, ...negativeSegments].find(
    (s) => s.id === hoveredId
  )

  // All segments for legend
  const allSegments = [...negativeSegments, ...positiveSegments]

  function handleMouseMove(e: React.MouseEvent) {
    setTooltipPos({ x: e.clientX + 12, y: e.clientY - 48 })
  }

  function renderSegment(seg: Segment, isFirst: boolean, isLast: boolean) {
    const rounding = []
    if (isFirst) rounding.push('rounded-l-md')
    if (isLast) rounding.push('rounded-r-md')

    const shortName = seg.account_name.split(' ')[0]
    const showLabel = seg.pctOfBar > 8

    return (
      <div
        key={seg.id}
        className={`relative overflow-hidden transition-opacity ${rounding.join(' ')} ${
          hoveredId && hoveredId !== seg.id ? 'opacity-60' : ''
        }`}
        style={{
          width: seg.pctOfSide + '%',
          backgroundColor: seg.color,
          minWidth: '2px',
        }}
        onMouseEnter={() => setHoveredId(seg.id)}
        onMouseLeave={() => setHoveredId(null)}
      >
        {showLabel && (
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-white/90 truncate px-1">
            {shortName} {seg.pctOfBar.toFixed(0)}%
          </span>
        )}
      </div>
    )
  }

  return (
    <div
      className="surface p-4 rounded-xl mb-4"
      onMouseMove={handleMouseMove}
    >
      <p className="text-[10px] text-[#55556A] uppercase tracking-wider mb-3">
        Balance distribution
      </p>

      {/* The bar */}
      <div className="flex w-full h-7 rounded-lg overflow-hidden">
        {/* Negative half (extends left) */}
        {negativeSegments.length > 0 && (
          <div
            className="flex flex-row-reverse shrink-0"
            style={{ width: negativeFraction * 100 + '%' }}
          >
            {negativeSegments.map((seg, i) =>
              renderSegment(
                seg,
                i === negativeSegments.length - 1, // leftmost gets rounded-l
                i === 0 && positiveSegments.length === 0 // rightmost only if no positive half
              )
            )}
          </div>
        )}

        {/* Center divider */}
        {negativeSegments.length > 0 && positiveSegments.length > 0 && (
          <div className="w-px bg-[#2C2C3A] shrink-0" />
        )}

        {/* Positive half (extends right) */}
        {positiveSegments.length > 0 && (
          <div
            className="flex flex-row shrink-0"
            style={{ width: positiveFraction * 100 + '%' }}
          >
            {positiveSegments.map((seg, i) =>
              renderSegment(
                seg,
                i === 0 && negativeSegments.length === 0, // leftmost only if no negative half
                i === positiveSegments.length - 1 // rightmost gets rounded-r
              )
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
        {allSegments.slice(0, 6).map((seg) => (
          <div
            key={seg.id}
            className="flex items-center gap-1.5 text-xs text-[#8888A0]"
            onMouseEnter={() => setHoveredId(seg.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <span
              className="w-2 h-2 rounded-sm shrink-0"
              style={{ backgroundColor: seg.color }}
            />
            <span className="truncate max-w-[100px]">{seg.account_name}</span>
          </div>
        ))}
        {allSegments.length > 6 && (
          <span className="text-xs text-[#55556A]">
            +{allSegments.length - 6} more
          </span>
        )}
      </div>

      {/* Tooltip (hidden on touch devices — legend provides the fallback) */}
      {hoveredSegment && (
        <div
          className="fixed z-50 pointer-events-none bg-[#1C1C28] border border-[#2C2C3A] rounded-lg px-3 py-2 shadow-xl hidden md:block"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          <p className="text-[#E8E8EC] text-sm font-medium">
            {hoveredSegment.account_name}
          </p>
          <p
            className={`text-sm tabular-nums ${
              hoveredSegment.balance >= 0 ? 'text-[#4DD9A0]' : 'text-[#C75050]'
            }`}
          >
            {formatNOK(hoveredSegment.balance)}
          </p>
          <p className="text-[#8888A0] text-xs">
            {hoveredSegment.pctOfBar.toFixed(1)}% of total
          </p>
        </div>
      )}
    </div>
  )
}
