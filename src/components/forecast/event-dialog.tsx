'use client'

/**
 * EventDialog — form for creating or editing planned financial events.
 *
 * Renders as an overlay modal. Fields: name, amount (with expense/income toggle),
 * date, recurrence, category, notes.
 */

import { useState } from 'react'
import { X } from 'lucide-react'
import { SPENDING_CATEGORIES } from '@/lib/constants/categories'
import type { PlannedEvent } from '@/types/financial'

interface Props {
  event: PlannedEvent | null // null = create, non-null = edit
  onClose: () => void
  onSaved: () => void
}

const RECURRENCE_OPTIONS = [
  { value: 'once', label: 'One time' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
]

const CATEGORY_OPTIONS = Object.entries(SPENDING_CATEGORIES).map(([key, cat]) => ({
  value: key,
  label: `${cat.emoji} ${cat.label}`,
}))

export function EventDialog({ event, onClose, onSaved }: Props) {
  const isEdit = event !== null

  const [name, setName] = useState(event?.name ?? '')
  const [amountStr, setAmountStr] = useState(
    event ? String(Math.abs(event.amount)) : ''
  )
  const [isExpense, setIsExpense] = useState(event ? event.amount < 0 : true)
  const [eventDate, setEventDate] = useState(
    event?.eventDate ?? new Date().toISOString().split('T')[0]
  )
  type Recurrence = 'once' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  const [recurrence, setRecurrence] = useState<Recurrence>((event?.recurrence as Recurrence) ?? 'once')
  const [category, setCategory] = useState(event?.category ?? '')
  const [notes, setNotes] = useState(event?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const amount = parseFloat(amountStr)
    if (!name.trim()) {
      setError('Name is required.')
      return
    }
    if (isNaN(amount) || amount <= 0) {
      setError('Amount must be a positive number.')
      return
    }

    const signedAmount = isExpense ? -amount : amount

    setSaving(true)
    try {
      const method = isEdit ? 'PATCH' : 'POST'
      const body = isEdit
        ? {
            id: event!.id,
            name: name.trim(),
            amount: signedAmount,
            eventDate,
            recurrence: recurrence || 'once',
            category: category || null,
            notes: notes.trim() || null,
          }
        : {
            name: name.trim(),
            amount: signedAmount,
            eventDate,
            recurrence: recurrence || 'once',
            category: category || null,
            notes: notes.trim() || null,
          }

      const res = await fetch('/api/forecast/events', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Failed to save event.')
        return
      }

      onSaved()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Dialog card */}
      <div className="relative bg-[#1C1C28] border border-[#2C2C3A] rounded-xl w-full max-w-md p-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg text-[#E8E8EC]">
            {isEdit ? 'Edit event' : 'Add planned event'}
          </h3>
          <button onClick={onClose} className="text-[#8888A0] hover:text-[#E8E8EC] transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="text-xs text-[#8888A0] block mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Car insurance, Vacation"
              maxLength={100}
              className="w-full bg-[#121218] border border-[#2C2C3A] rounded-lg px-3 py-2 text-sm text-[#E8E8EC] placeholder:text-[#55556A] focus:outline-none focus:border-[#0D7377]"
            />
          </div>

          {/* Amount + type toggle */}
          <div>
            <label className="text-xs text-[#8888A0] block mb-1">Amount (kr)</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0"
                min="0"
                step="1"
                className="flex-1 bg-[#121218] border border-[#2C2C3A] rounded-lg px-3 py-2 text-sm text-[#E8E8EC] placeholder:text-[#55556A] focus:outline-none focus:border-[#0D7377] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <div className="flex rounded-lg border border-[#2C2C3A] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsExpense(true)}
                  className={`px-3 py-2 text-xs transition-colors ${
                    isExpense
                      ? 'bg-[#C75050]/20 text-[#C75050]'
                      : 'text-[#8888A0] hover:text-[#E8E8EC]'
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setIsExpense(false)}
                  className={`px-3 py-2 text-xs transition-colors ${
                    !isExpense
                      ? 'bg-[#4DD9A0]/20 text-[#4DD9A0]'
                      : 'text-[#8888A0] hover:text-[#E8E8EC]'
                  }`}
                >
                  Income
                </button>
              </div>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="text-xs text-[#8888A0] block mb-1">Date</label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full bg-[#121218] border border-[#2C2C3A] rounded-lg px-3 py-2 text-sm text-[#E8E8EC] focus:outline-none focus:border-[#0D7377] [color-scheme:dark]"
            />
          </div>

          {/* Recurrence */}
          <div>
            <label className="text-xs text-[#8888A0] block mb-1">Repeats</label>
            <select
              value={recurrence ?? 'once'}
              onChange={(e) => setRecurrence(e.target.value as Recurrence)}
              className="w-full bg-[#121218] border border-[#2C2C3A] rounded-lg px-3 py-2 text-sm text-[#E8E8EC] focus:outline-none focus:border-[#0D7377] [color-scheme:dark]"
            >
              {RECURRENCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Category (optional) */}
          <div>
            <label className="text-xs text-[#8888A0] block mb-1">Category (optional)</label>
            <select
              value={category ?? ''}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#121218] border border-[#2C2C3A] rounded-lg px-3 py-2 text-sm text-[#E8E8EC] focus:outline-none focus:border-[#0D7377] [color-scheme:dark]"
            >
              <option value="">None</option>
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Notes (optional) */}
          <div>
            <label className="text-xs text-[#8888A0] block mb-1">Notes (optional)</label>
            <textarea
              value={notes ?? ''}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any details about this event..."
              maxLength={500}
              rows={2}
              className="w-full bg-[#121218] border border-[#2C2C3A] rounded-lg px-3 py-2 text-sm text-[#E8E8EC] placeholder:text-[#55556A] focus:outline-none focus:border-[#0D7377] resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-[#C75050]">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[#0D7377] hover:bg-[#0E8589] text-white text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : isEdit ? 'Update event' : 'Add event'}
          </button>
        </form>
      </div>
    </div>
  )
}
