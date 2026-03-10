/**
 * Bill priority levels — single source of truth.
 *
 * Used by: BillCountdown, API route, notification engine, context builder.
 */

export const BILL_PRIORITIES = ['critical', 'high', 'normal', 'low'] as const
export type BillPriority = (typeof BILL_PRIORITIES)[number]

export const PRIORITY_META: Record<
  BillPriority,
  { label: string; badgeClass: string; dotClass: string }
> = {
  critical: {
    label: 'Critical',
    badgeClass: 'bg-aura-danger/15 text-aura-danger border border-aura-danger/30',
    dotClass: 'bg-aura-danger',
  },
  high: {
    label: 'High',
    badgeClass: 'bg-aura-warning/15 text-aura-warning border border-aura-warning/30',
    dotClass: 'bg-aura-warning',
  },
  normal: {
    label: 'Normal',
    badgeClass: 'bg-aura-text-secondary/10 text-aura-text-secondary border border-aura-text-secondary/20',
    dotClass: 'bg-aura-text-secondary',
  },
  low: {
    label: 'Low',
    badgeClass: 'bg-aura-safe/10 text-aura-safe border border-aura-safe/20',
    dotClass: 'bg-aura-safe',
  },
}
