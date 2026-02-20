/**
 * Date formatting utilities for Aura.
 * Display format: Norwegian dd.mm.yyyy
 * Storage format: ISO 8601 (yyyy-mm-dd or full ISO timestamp)
 */

/**
 * Formats a date for display using the Norwegian date format.
 * Example: new Date('2026-02-20') → "20.02.2026"
 */
export function formatDateNO(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('nb-NO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Formats a date with abbreviated month name.
 * Example: new Date('2026-02-20') → "20. feb. 2026"
 */
export function formatDateNOLong(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('nb-NO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Returns the number of days until a future date.
 * Returns 0 if the date is today or in the past.
 * Example: 3 days from now → 3
 */
export function daysUntil(date: Date | string): number {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  const diffMs = d.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
}

/**
 * Returns a human-readable relative time string (in Norwegian context).
 * Example: 0 → "i dag" | 1 → "i morgen" | 3 → "om 3 dager" | -1 → "i går"
 */
export function relativeDate(date: Date | string): string {
  const days = daysUntil(date)
  if (days === 0) return 'i dag'
  if (days === 1) return 'i morgen'
  if (days === 2) return 'i overmorgen'
  if (days > 0) return `om ${days} dager`
  return 'forfalt'
}

/**
 * Formats a date as an ISO date string (for database storage).
 * Example: new Date('2026-02-20T12:00:00') → "2026-02-20"
 */
export function toISODate(date: Date): string {
  return date.toISOString().split('T')[0]
}
