/**
 * Currency formatting utilities for NOK (Norwegian Krone).
 * All amounts in Aura are displayed in NOK using the nb-NO locale.
 */

/**
 * Formats a number as Norwegian Krone — full format.
 * Example: 28400 → "28 400 kr"
 */
export function formatNOK(amount: number): string {
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Compact format for large numbers or tight UI spaces.
 * Example: 1200000 → "1,2 mill. kr" | 28400 → "28k kr" | 4300 → "4 300 kr"
 */
export function formatNOKCompact(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1).replace('.', ',')} mill. kr`
  }
  if (Math.abs(amount) >= 10_000) {
    return `${Math.round(amount / 1_000)}k kr`
  }
  return formatNOK(amount)
}

/**
 * Format a number as NOK with cents (for precise amounts like debts).
 * Example: 649.50 → "649,50 kr"
 */
export function formatNOKPrecise(amount: number): string {
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Returns a sign-prefixed compact format.
 * Example: -1200 → "-1 200 kr" | 500 → "+500 kr"
 */
export function formatNOKDelta(amount: number): string {
  const prefix = amount >= 0 ? '+' : ''
  return `${prefix}${formatNOK(amount)}`
}
