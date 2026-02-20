import { cn } from '@/lib/utils/cn'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from '@radix-ui/react-slot'
import { forwardRef } from 'react'

const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aura-primary focus-visible:ring-offset-2 focus-visible:ring-offset-aura-background disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98]',
  {
    variants: {
      variant: {
        // Primary — teal, used for main CTAs
        default:
          'bg-aura-primary text-white hover:bg-aura-primary-light shadow-sm shadow-aura-primary/20',
        // Destructive — red, for delete/danger actions
        destructive:
          'bg-aura-danger text-white hover:bg-aura-danger/90',
        // Outlined — transparent with border
        outline:
          'border border-aura-border bg-transparent text-aura-text hover:bg-white/5 hover:border-aura-primary/50',
        // Ghost — minimal, for secondary actions
        ghost:
          'text-aura-text-secondary hover:text-aura-text hover:bg-white/5',
        // Link — styled as a text link
        link:
          'text-aura-primary underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-8 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** When true, renders the button's child directly (useful for links styled as buttons) */
  asChild?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
