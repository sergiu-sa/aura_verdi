import { cn } from '@/lib/utils/cn'

interface AvatarProps {
  /** Display name — used to derive initials */
  name: string
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Minimal avatar showing the user's initials.
 * No profile photos in v1 — keeps things simple and private.
 */
export function Avatar({ name, size = 'md', className }: AvatarProps) {
  const initials = getInitials(name)

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-medium shrink-0',
        'bg-aura-primary/20 text-aura-primary border border-aura-primary/30',
        sizeClasses[size],
        className
      )}
      aria-label={name}
    >
      {initials}
    </div>
  )
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
