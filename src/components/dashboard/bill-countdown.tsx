'use client'

/**
 * BillCountdown — shows upcoming bills sorted by due date.
 *
 * Supports "Mark as paid", "Add bill" inline, and priority levels.
 *
 * Urgency color (by days until due):
 *   ≤ 3 days  → red
 *   4–7 days  → amber
 *   > 7 days  → normal text
 */

import { useState, useRef, useEffect } from 'react'
import { Check, Plus, X, ChevronDown } from 'lucide-react'
import { formatNOK } from '@/lib/utils/format-currency'
import {
  BILL_PRIORITIES,
  PRIORITY_META,
  type BillPriority,
} from '@/lib/constants/bill-priority'

interface Bill {
  id: string
  name: string
  amount: number
  due_date: string
  priority: BillPriority
}

interface Props {
  bills: Bill[]
  onRefresh?: () => void
}

function daysUntil(dueDateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDateStr)
  due.setHours(0, 0, 0, 0)
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function formatDueDate(dueDateStr: string): string {
  return new Date(dueDateStr).toLocaleDateString('nb-NO', {
    day: '2-digit',
    month: 'short',
  })
}

function urgencyColor(days: number): string {
  if (days <= 3) return 'text-[#C75050]'
  if (days <= 7) return 'text-[#D4A039]'
  return 'text-[#8888A0]'
}

function daysLabel(days: number): string {
  if (days < 0) return 'overdue'
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  return `in ${days} days`
}

// ── Priority badge (hidden for 'normal' to reduce visual noise) ──────────

function PriorityBadge({ priority }: { priority: BillPriority }) {
  if (priority === 'normal') return null
  const meta = PRIORITY_META[priority]
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${meta.badgeClass}`}
    >
      {meta.label}
    </span>
  )
}

// ── Priority dropdown (click-to-open, closes on outside click) ───────────

function PriorityDropdown({
  currentPriority,
  onSelect,
}: {
  currentPriority: BillPriority
  onSelect: (p: BillPriority) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-0.5 rounded text-[#8888A0] hover:text-[#E8E8EC] transition-colors opacity-0 group-hover:opacity-100"
        title="Change priority"
      >
        <ChevronDown size={12} />
      </button>
      {open && (
        <div className="absolute right-0 top-6 z-50 bg-[#1C1C28] border border-[#2C2C3A] rounded-lg py-1 shadow-xl min-w-[120px]">
          {BILL_PRIORITIES.map((p) => (
            <button
              key={p}
              onClick={() => {
                onSelect(p)
                setOpen(false)
              }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors ${
                p === currentPriority
                  ? 'text-[#E8E8EC] bg-white/5'
                  : 'text-[#8888A0] hover:text-[#E8E8EC] hover:bg-white/5'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${PRIORITY_META[p].dotClass}`} />
              {PRIORITY_META[p].label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────

export function BillCountdown({ bills, onRefresh }: Props) {
  const [localBills, setLocalBills] = useState<Bill[]>(bills)
  const [showAddForm, setShowAddForm] = useState(false)
  const [marking, setMarking] = useState<string | null>(null)

  // Add form state
  const [formName, setFormName] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formDate, setFormDate] = useState('')
  const [formPriority, setFormPriority] = useState<BillPriority>('normal')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleMarkPaid(billId: string) {
    setMarking(billId)
    try {
      const res = await fetch('/api/bills', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billId, is_paid: true }),
      })
      if (res.ok) {
        setLocalBills((prev) => prev.filter((b) => b.id !== billId))
        onRefresh?.()
      }
    } catch {
      // Silently fail — bill stays in list
    } finally {
      setMarking(null)
    }
  }

  async function handleChangePriority(billId: string, priority: BillPriority) {
    // Optimistic update
    setLocalBills((prev) =>
      prev.map((b) => (b.id === billId ? { ...b, priority } : b))
    )
    try {
      await fetch('/api/bills', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billId, priority }),
      })
    } catch {
      // On failure, the optimistic update stays until next page load
    }
  }

  async function handleAddBill(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')

    const amount = parseFloat(formAmount)
    if (!formName.trim() || isNaN(amount) || amount <= 0 || !formDate) {
      setFormError('Fill in all fields with valid values.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          amount,
          dueDate: formDate,
          priority: formPriority,
        }),
      })
      const data = await res.json()
      if (res.ok && data.bill) {
        setLocalBills((prev) =>
          [
            ...prev,
            {
              id: data.bill.id,
              name: data.bill.name,
              amount: Number(data.bill.amount),
              due_date: data.bill.due_date,
              priority: (data.bill.priority as BillPriority) ?? 'normal',
            },
          ].sort(
            (a, b) =>
              new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
          )
        )
        setFormName('')
        setFormAmount('')
        setFormDate('')
        setFormPriority('normal')
        setShowAddForm(false)
        onRefresh?.()
      } else {
        setFormError(data.error || 'Failed to add bill.')
      }
    } catch {
      setFormError('Network error. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (localBills.length === 0 && !showAddForm) {
    return (
      <div className="surface p-5 rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <p className="text-section-header">Upcoming bills</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1 text-xs text-[#8888A0] hover:text-[#0D7377] transition-colors"
          >
            <Plus size={12} /> Add
          </button>
        </div>
        <p className="text-[#8888A0] text-sm">
          No upcoming bills in the next 30 days.
        </p>
        <p className="text-[#8888A0] text-xs mt-2">
          Bills are added automatically when you sync your bank, or add one
          manually.
        </p>
      </div>
    )
  }

  const [next, ...rest] = localBills
  const nextDays = next ? daysUntil(next.due_date) : 0

  return (
    <div className="surface p-5 rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <p className="text-section-header">Upcoming bills</p>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="flex items-center gap-1 text-xs text-[#8888A0] hover:text-[#0D7377] transition-colors"
        >
          {showAddForm ? <X size={12} /> : <Plus size={12} />}
          {showAddForm ? 'Cancel' : 'Add'}
        </button>
      </div>

      {/* Add bill form */}
      {showAddForm && (
        <form
          onSubmit={handleAddBill}
          className="mb-4 p-3 rounded-lg bg-[#121218] border border-[#2C2C3A] space-y-2"
        >
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Bill name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="flex-1 bg-transparent border border-[#2C2C3A] rounded px-2 py-1.5 text-xs text-[#E8E8EC] placeholder:text-[#55556A] focus:outline-none focus:border-[#0D7377]"
            />
            <input
              type="number"
              placeholder="Amount"
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
              step="0.01"
              min="0"
              className="w-24 bg-transparent border border-[#2C2C3A] rounded px-2 py-1.5 text-xs text-[#E8E8EC] placeholder:text-[#55556A] focus:outline-none focus:border-[#0D7377]"
            />
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="flex-1 bg-transparent border border-[#2C2C3A] rounded px-2 py-1.5 text-xs text-[#E8E8EC] focus:outline-none focus:border-[#0D7377]"
            />
            <select
              value={formPriority}
              onChange={(e) => setFormPriority(e.target.value as BillPriority)}
              className="bg-[#121218] border border-[#2C2C3A] rounded px-2 py-1.5 text-xs text-[#E8E8EC] focus:outline-none focus:border-[#0D7377]"
            >
              {BILL_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_META[p].label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={submitting}
              className="px-3 py-1.5 rounded text-xs font-medium bg-[#0D7377] text-white hover:bg-[#0D7377]/80 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Adding...' : 'Add'}
            </button>
          </div>
          {formError && <p className="text-xs text-[#C75050]">{formError}</p>}
        </form>
      )}

      {/* Primary — next bill */}
      {next && (
        <div className="flex items-start justify-between mb-1 group">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[#E8E8EC] font-medium text-sm">{next.name}</p>
              <PriorityBadge priority={next.priority} />
            </div>
            <p className={`text-xs mt-0.5 ${urgencyColor(nextDays)}`}>
              {formatDueDate(next.due_date)} — {daysLabel(nextDays)}
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0 ml-4">
            <p className="text-amount text-[#E8E8EC] text-sm">
              {formatNOK(next.amount)}
            </p>
            <PriorityDropdown
              currentPriority={next.priority}
              onSelect={(p) => handleChangePriority(next.id, p)}
            />
            <button
              onClick={() => handleMarkPaid(next.id)}
              disabled={marking === next.id}
              className="p-1 rounded text-[#8888A0] hover:text-[#2D8B6F] hover:bg-[#2D8B6F]/10 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
              title="Mark as paid"
            >
              <Check size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Remaining bills */}
      {rest.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[#2C2C3A] space-y-2">
          {rest.slice(0, 3).map((bill) => {
            const days = daysUntil(bill.due_date)
            return (
              <div
                key={bill.id}
                className="flex items-center justify-between group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[#E8E8EC] text-xs truncate">
                    {bill.name}
                  </span>
                  <PriorityBadge priority={bill.priority} />
                  <span
                    className={`text-xs flex-shrink-0 ${urgencyColor(days)}`}
                  >
                    {daysLabel(days)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 ml-4">
                  <span className="text-amount text-xs text-[#8888A0]">
                    {formatNOK(bill.amount)}
                  </span>
                  <PriorityDropdown
                    currentPriority={bill.priority}
                    onSelect={(p) => handleChangePriority(bill.id, p)}
                  />
                  <button
                    onClick={() => handleMarkPaid(bill.id)}
                    disabled={marking === bill.id}
                    className="p-0.5 rounded text-[#8888A0] hover:text-[#2D8B6F] hover:bg-[#2D8B6F]/10 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                    title="Mark as paid"
                  >
                    <Check size={12} />
                  </button>
                </div>
              </div>
            )
          })}
          {rest.length > 3 && (
            <p className="text-xs text-[#8888A0] pt-1">
              +{rest.length - 3} more bills this month
            </p>
          )}
        </div>
      )}
    </div>
  )
}
