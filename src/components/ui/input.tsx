import { cn } from '@/lib/utils/cn'
import { forwardRef } from 'react'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        // Base layout
        'flex h-10 w-full rounded-md px-3 py-2 text-sm',
        // Colors — dark surface matching Aura palette
        'bg-aura-surface border border-aura-border text-aura-text',
        // Placeholder
        'placeholder:text-aura-text-dim',
        // Focus — teal ring
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aura-primary focus-visible:border-aura-primary',
        // Transition
        'transition-colors duration-150',
        // File input special handling
        'file:border-0 file:bg-transparent file:text-sm file:font-medium',
        // Disabled
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = 'Input'

export { Input }
