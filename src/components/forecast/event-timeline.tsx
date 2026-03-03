'use client'

/**
 * EventTimeline — chronological list of upcoming financial events.
 *
 * Shows bills and planned events together, sorted by date.
 * Planned events have edit/delete actions.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { formatNOK } from '@/lib/utils/format-currency'
import { EventDialog } from './event-dialog'
import type { PlannedEvent } from '@/types/financial'

interface BillItem {
  name: string
  amount: number
  dueDate: string
  recurrence: string | null
}

interface Props {
  bills: BillItem[]
  plannedEvents: PlannedEvent[]
}

type TimelineEntry = {
  date: string
  name: string
  amount: number
  source: 'bill' | 'planned'
  id?: string // Only for planned events
  recurrence?: string | null
}

export function EventTimeline({ bills, plannedEvents }: Props) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<PlannedEvent | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Merge and sort all events by date
  const entries: TimelineEntry[] = [
    ...bills.map((b) => ({
      date: b.dueDate,
      name: b.name,
      amount: -Math.abs(b.amount),
      source: 'bill' as const,
      recurrence: b.recurrence,
    })),
    ...plannedEvents.map((e) => ({
      date: e.eventDate,
      name: e.name,
      amount: e.amount,
      source: 'planned' as const,
      id: e.id,
      recurrence: e.recurrence,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date))

  // Only show events in the future (or today)
  const today = new Date().toISOString().split('T')[0]
  const futureEntries = entries.filter((e) => e.date >= today)

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      const res = await fetch('/api/forecast/events', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        router.refresh()
      }
    } catch {
      // Silent fail — will show stale data until refresh
    } finally {
      setDeleting(null)
    }
  }

  const handleEdit = (entry: TimelineEntry) => {
    if (entry.source !== 'planned' || !entry.id) return
    const event = plannedEvents.find((e) => e.id === entry.id)
    if (event) {
      setEditingEvent(event)
      setDialogOpen(true)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('nb-NO', {
      day: 'numeric',
      month: 'short',
    })
  }

  const recurrenceLabel = (r: string | null | undefined) => {
    if (!r || r === 'once') return null
    const labels: Record<string, string> = {
      weekly: 'Weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      yearly: 'Yearly',
    }
    return labels[r] ?? null
  }

  return (
    <div className="surface p-5 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <p className="text-section-header">Upcoming events</p>
        <button
          onClick={() => {
            setEditingEvent(null)
            setDialogOpen(true)
          }}
          className="flex items-center gap-1.5 text-xs text-[#0D7377] hover:text-[#10969B] transition-colors"
        >
          <Plus size={14} />
          Add event
        </button>
      </div>

      {futureEntries.length === 0 ? (
        <p className="text-[#8888A0] text-sm">
          No upcoming events. Add a planned expense or income to see it on the forecast.
        </p>
      ) : (
        <div className="space-y-1">
          {futureEntries.slice(0, 15).map((entry, i) => {
            const isExpense = entry.amount < 0
            const badge = recurrenceLabel(entry.recurrence)

            return (
              <div
                key={`${entry.date}-${entry.name}-${i}`}
                className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-[#1A1A26] transition-colors group"
              >
                {/* Date */}
                <span className="text-xs text-[#8888A0] w-14 flex-shrink-0">
                  {formatDate(entry.date)}
                </span>

                {/* Name + badges */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#E8E8EC] truncate">{entry.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                      entry.source === 'bill'
                        ? 'bg-[#2C2C3A] text-[#8888A0]'
                        : 'bg-[#0D7377]/15 text-[#0D7377]'
                    }`}>
                      {entry.source === 'bill' ? 'Bill' : 'Planned'}
                    </span>
                    {badge && (
                      <span className="text-[10px] text-[#8888A0]">{badge}</span>
                    )}
                  </div>
                </div>

                {/* Amount */}
                <span className={`text-sm text-amount flex-shrink-0 ${
                  isExpense ? 'text-[#C75050]' : 'text-[#4DD9A0]'
                }`}>
                  {isExpense ? '−' : '+'}{formatNOK(Math.abs(entry.amount))}
                </span>

                {/* Actions (planned events only) */}
                {entry.source === 'planned' && entry.id && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={() => handleEdit(entry)}
                      className="p-1 text-[#8888A0] hover:text-[#E8E8EC] transition-colors"
                      title="Edit"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id!)}
                      disabled={deleting === entry.id}
                      className="p-1 text-[#8888A0] hover:text-[#C75050] transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}

          {futureEntries.length > 15 && (
            <p className="text-xs text-[#8888A0] pt-2 pl-2">
              +{futureEntries.length - 15} more events
            </p>
          )}
        </div>
      )}

      {/* Add/Edit event dialog */}
      {dialogOpen && (
        <EventDialog
          event={editingEvent}
          onClose={() => {
            setDialogOpen(false)
            setEditingEvent(null)
          }}
          onSaved={() => {
            setDialogOpen(false)
            setEditingEvent(null)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
