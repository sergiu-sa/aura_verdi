import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility for merging Tailwind CSS class names.
 * Combines clsx (conditional classes) with tailwind-merge (resolves conflicts).
 *
 * Used by all shadcn/ui components and throughout the codebase.
 *
 * Example:
 *   cn('px-4 py-2', isActive && 'bg-aura-primary', className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
