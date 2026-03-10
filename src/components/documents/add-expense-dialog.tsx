'use client'

/**
 * AddExpenseDialog — pre-filled form to create a bill from an analyzed document.
 *
 * Shows the financial data extracted by Claude (amount, due date, payee) and
 * lets the user adjust before saving. Submits to POST /api/bills.
 */

import { useState } from 'react'
import { X } from 'lucide-react'
import { SPENDING_CATEGORIES } from '@/lib/constants/categories'
import type { DocumentRecord } from './document-card'

interface Props {
  doc: DocumentRecord
  onClose: () => void
  onAdded: () => void
}

// Map document types to likely expense categories
const DOC_TYPE_CATEGORY_MAP: Record<string, string> = {
  inkasso: 'lan',
  invoice: 'annet',
  letter: 'annet',
}

const CATEGORY_OPTIONS = Object.entries(SPENDING_CATEGORIES).map(([key, cat]) => ({
  value: key,
  label: `${cat.emoji} ${cat.label}`,
}))

const RECURRENCE_OPTIONS = [
  { value: 'once', label: 'One time' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
]

export function AddExpenseDialog({ doc, onClose, onAdded }: Props) {
  const extract = doc.ai_flags?.financial_extract

  const [name, setName] = useState(
    extract?.payee || doc.original_filename.replace(/\.[^.]+$/, '')
  )
  const [amountStr, setAmountStr] = useState(
    extract?.amount ? String(extract.amount) : ''
  )
  const [dueDate, setDueDate] = useState(
    extract?.due_date ?? ''
  )
  const [category, setCategory] = useState(
    DOC_TYPE_CATEGORY_MAP[doc.document_type ?? ''] ?? ''
  )
  const [recurrence, setRecurrence] = useState('once')
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
    if (!dueDate) {
      setError('Due date is required.')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          amount,
          dueDate,
          category: category || null,
          recurrence,
          sourceDocumentId: doc.id,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Failed to add expense.')
        return
      }

      onAdded()
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
      <div className="relative bg-aura-surface border border-aura-border rounded-xl w-full max-w-md p-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg text-aura-text">
            Add as upcoming expense
          </h3>
          <button onClick={onClose} className="text-aura-text-secondary hover:text-aura-text transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Source info */}
        <p className="text-[10px] text-aura-text-dim mb-4">
          From: {doc.original_filename}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="text-xs text-aura-text-secondary block mb-1">Name / Payee</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Tibber AS"
              maxLength={200}
              className="w-full bg-aura-background border border-aura-border rounded-lg px-3 py-2 text-sm text-aura-text placeholder:text-aura-text-dim focus:outline-none focus:border-aura-primary"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs text-aura-text-secondary block mb-1">Amount (kr)</label>
            <input
              type="number"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="0"
              min="0"
              step="1"
              className="w-full bg-aura-background border border-aura-border rounded-lg px-3 py-2 text-sm text-aura-text placeholder:text-aura-text-dim focus:outline-none focus:border-aura-primary [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>

          {/* Due date */}
          <div>
            <label className="text-xs text-aura-text-secondary block mb-1">Due date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-aura-background border border-aura-border rounded-lg px-3 py-2 text-sm text-aura-text focus:outline-none focus:border-aura-primary [color-scheme:dark]"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs text-aura-text-secondary block mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-aura-background border border-aura-border rounded-lg px-3 py-2 text-sm text-aura-text focus:outline-none focus:border-aura-primary [color-scheme:dark]"
            >
              <option value="">None</option>
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Recurrence */}
          <div>
            <label className="text-xs text-aura-text-secondary block mb-1">Repeats</label>
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value)}
              className="w-full bg-aura-background border border-aura-border rounded-lg px-3 py-2 text-sm text-aura-text focus:outline-none focus:border-aura-primary [color-scheme:dark]"
            >
              {RECURRENCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-aura-danger">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-aura-primary hover:bg-aura-primary-light text-white text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Adding...' : 'Add to upcoming expenses'}
          </button>
        </form>
      </div>
    </div>
  )
}
