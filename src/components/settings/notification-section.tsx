'use client'

import { useState } from 'react'
import type { NotificationPreferences } from '@/types/database'

interface Props {
  preferences: NotificationPreferences
}

export function NotificationSection({ preferences: initial }: Props) {
  const [prefs, setPrefs] = useState<NotificationPreferences>(initial)
  const [saving, setSaving] = useState<string | null>(null)

  const toggle = async (key: 'email_critical' | 'email_informational', value: boolean) => {
    setSaving(key)
    const previous = prefs[key]

    // Optimistic update
    setPrefs((p) => ({ ...p, [key]: value }))

    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      })

      if (!res.ok) {
        // Revert on failure
        setPrefs((p) => ({ ...p, [key]: previous }))
      }
    } catch {
      setPrefs((p) => ({ ...p, [key]: previous }))
    } finally {
      setSaving(null)
    }
  }

  const updateQuietHours = async (key: 'quiet_hours_start' | 'quiet_hours_end', value: string) => {
    setPrefs((p) => ({ ...p, [key]: value }))

    try {
      await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      })
    } catch {
      // Silent fail — the value is saved on next attempt
    }
  }

  return (
    <section className="mb-10">
      <p className="text-xs uppercase tracking-widest text-aura-text-secondary mb-1">Alerts</p>
      <h2 className="font-display text-2xl text-aura-text mb-4">Notifications</h2>

      <div className="rounded-xl bg-aura-surface border border-aura-border p-5 space-y-4">
        {/* Critical emails */}
        <ToggleRow
          label="Critical email alerts"
          description="Bills due, low balance, expiring bank consent"
          checked={prefs.email_critical !== false}
          loading={saving === 'email_critical'}
          onToggle={(v) => toggle('email_critical', v)}
        />

        {/* Informational emails */}
        <ToggleRow
          label="Informational email alerts"
          description="Daily summaries, tips, document updates"
          checked={prefs.email_informational === true}
          loading={saving === 'email_informational'}
          onToggle={(v) => toggle('email_informational', v)}
        />

        {/* Quiet hours */}
        <div className="border-t border-aura-border pt-4">
          <p className="text-sm text-aura-text mb-1">Quiet hours</p>
          <p className="text-xs text-aura-text-secondary mb-3">No emails sent during this period</p>
          <div className="flex items-center gap-3">
            <input
              type="time"
              value={prefs.quiet_hours_start ?? '22:00'}
              onChange={(e) => updateQuietHours('quiet_hours_start', e.target.value)}
              className="bg-aura-input border border-aura-border rounded px-2 py-1.5 text-sm text-aura-text [color-scheme:dark]"
            />
            <span className="text-xs text-aura-text-secondary">to</span>
            <input
              type="time"
              value={prefs.quiet_hours_end ?? '07:00'}
              onChange={(e) => updateQuietHours('quiet_hours_end', e.target.value)}
              className="bg-aura-input border border-aura-border rounded px-2 py-1.5 text-sm text-aura-text [color-scheme:dark]"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Toggle Row ──────────────────────────────────────────────────────────────

function ToggleRow({
  label,
  description,
  checked,
  loading,
  onToggle,
}: {
  label: string
  description: string
  checked: boolean
  loading: boolean
  onToggle: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1 mr-4">
        <p className="text-sm text-aura-text">{label}</p>
        <p className="text-xs text-aura-text-secondary">{description}</p>
      </div>
      <button
        onClick={() => onToggle(!checked)}
        disabled={loading}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
          checked ? 'bg-aura-primary' : 'bg-aura-border'
        } ${loading ? 'opacity-50' : ''}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}
