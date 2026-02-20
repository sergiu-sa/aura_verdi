'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import {
  LayoutDashboard,
  MessageCircle,
  FileText,
  Scale,
  Settings,
  type LucideIcon,
} from 'lucide-react'

interface MobileNavItem {
  label: string
  href: string
  icon: LucideIcon
}

const MOBILE_NAV_ITEMS: MobileNavItem[] = [
  { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Chat', href: '/chat', icon: MessageCircle },
  { label: 'Docs', href: '/documents', icon: FileText },
  { label: 'Legal', href: '/legal', icon: Scale },
  { label: 'Settings', href: '/settings', icon: Settings },
]

/**
 * Mobile bottom tab navigation.
 * Visible only on screens smaller than md (768px).
 * Sits at the bottom of the screen with a frosted dark background.
 */
export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-aura-border bg-aura-surface/95 backdrop-blur-md"
      aria-label="Mobile navigation"
    >
      {/* Safe area padding for iOS home bar */}
      <div className="flex items-center pb-safe">
        {MOBILE_NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 py-3 px-1 transition-colors duration-150',
                isActive ? 'text-aura-primary' : 'text-aura-text-dim hover:text-aura-text-secondary'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 1.75}
                className="transition-all duration-150"
              />
              <span
                className={cn(
                  'text-[10px] font-medium transition-colors duration-150',
                  isActive ? 'text-aura-primary' : 'text-aura-text-dim'
                )}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
