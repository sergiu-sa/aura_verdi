/**
 * DailyTip — a short, computed observation shown on the dashboard.
 *
 * This is intentionally NOT an AI call. The dashboard loads on every visit
 * and making a Claude API call on each load would be expensive and slow.
 *
 * Instead, we compute a simple, useful observation from the financial data.
 * The user can get full AI-powered analysis by opening the Chat.
 *
 * Design: brief, calm, actionable. No alarm, no judgment.
 */

import { formatNOK } from '@/lib/utils/format-currency'
import { SPENDING_CATEGORIES } from '@/lib/constants/categories'

interface Props {
  safeToSpend: number
  topCategory: string | null
  topCategoryAmount: number
  nextBillName: string | null
  nextBillDays: number | null
  nextBillAmount: number
  hasBank: boolean
  lastSyncedAt: string | null
}

function formatLastSynced(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMins = Math.floor(diffMs / (1000 * 60))

  if (diffMins < 2) return 'just now'
  if (diffMins < 60) return `${diffMins} minutes ago`
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
  return date.toLocaleDateString('nb-NO', { day: '2-digit', month: 'short' })
}

function computeTip(props: Props): string {
  const {
    safeToSpend,
    topCategory,
    topCategoryAmount,
    nextBillName,
    nextBillDays,
    nextBillAmount,
    hasBank,
  } = props

  if (!hasBank) {
    return 'Connect your bank in Settings to get a personalised daily overview.'
  }

  // Build tip from most relevant piece of info
  if (nextBillDays !== null && nextBillDays <= 3 && nextBillName) {
    if (safeToSpend >= nextBillAmount) {
      return `${nextBillName} is due ${nextBillDays === 0 ? 'today' : nextBillDays === 1 ? 'tomorrow' : `in ${nextBillDays} days`}. You have enough covered.`
    } else {
      return `${nextBillName} (${formatNOK(nextBillAmount)}) is due ${nextBillDays === 0 ? 'today' : 'soon'}. Your buffer is tight — check your balance.`
    }
  }

  if (safeToSpend < 500) {
    return 'Your available buffer is very low right now. Avoid non-essential spending until your next income arrives.'
  }

  if (topCategory && topCategoryAmount > 0) {
    const catKey = topCategory as keyof typeof SPENDING_CATEGORIES
    const cat = SPENDING_CATEGORIES[catKey] ?? SPENDING_CATEGORIES.annet
    return `Your biggest spend this month is ${cat.label.toLowerCase()} at ${formatNOK(topCategoryAmount)}. Ask Aura if you want to dig into it.`
  }

  if (safeToSpend > 10_000) {
    return 'You have a healthy buffer this month. A good time to think about savings goals.'
  }

  return 'Your finances are loaded. Chat with Aura for a personalised breakdown.'
}

export function DailyTip(props: Props) {
  const { lastSyncedAt, hasBank } = props
  const tip = computeTip(props)
  const syncedText = lastSyncedAt ? `Updated ${formatLastSynced(lastSyncedAt)}` : null

  return (
    <div className="surface p-5 rounded-xl col-span-1 sm:col-span-2">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-section-header mb-2">Aura says</p>
          <p className="text-[#E8E8EC] text-sm leading-relaxed">{tip}</p>
        </div>
        {/* Subtle Aura identity mark */}
        <div className="w-8 h-8 rounded-full bg-[#0D7377]/20 border border-[#0D7377]/30 flex items-center justify-center flex-shrink-0">
          <span className="text-[#0D7377] text-xs font-display">A</span>
        </div>
      </div>

      {/* Last synced + chat prompt */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#2C2C3A]">
        {syncedText && hasBank ? (
          <p className="text-[#8888A0] text-xs">{syncedText}</p>
        ) : (
          <span />
        )}
        <a
          href="/chat"
          className="text-xs text-[#0D7377] hover:text-[#11999E] transition-colors"
        >
          Open chat →
        </a>
      </div>
    </div>
  )
}
