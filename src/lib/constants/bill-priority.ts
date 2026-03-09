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
    badgeClass: 'bg-[#C75050]/15 text-[#C75050] border border-[#C75050]/30',
    dotClass: 'bg-[#C75050]',
  },
  high: {
    label: 'High',
    badgeClass: 'bg-[#D4A039]/15 text-[#D4A039] border border-[#D4A039]/30',
    dotClass: 'bg-[#D4A039]',
  },
  normal: {
    label: 'Normal',
    badgeClass: 'bg-[#8888A0]/10 text-[#8888A0] border border-[#8888A0]/20',
    dotClass: 'bg-[#8888A0]',
  },
  low: {
    label: 'Low',
    badgeClass: 'bg-[#2D8B6F]/10 text-[#2D8B6F] border border-[#2D8B6F]/20',
    dotClass: 'bg-[#2D8B6F]',
  },
}
