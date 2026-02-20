'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils/cn'
import {
  LayoutDashboard,
  MessageCircle,
  FileText,
  Scale,
  Settings,
  LogOut,
  type LucideIcon,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  /** Short description shown on hover / for screen readers */
  description: string
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Financial overview',
  },
  {
    label: 'Chat',
    href: '/chat',
    icon: MessageCircle,
    description: 'Talk to Aura',
  },
  {
    label: 'Documents',
    href: '/documents',
    icon: FileText,
    description: 'Contracts & letters',
  },
  {
    label: 'Legal',
    href: '/legal',
    icon: Scale,
    description: 'Rights & templates',
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'Preferences',
  },
]

interface SidebarProps {
  userDisplayName: string
  userEmail: string
}

export function Sidebar({ userDisplayName, userEmail }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex w-60 flex-col border-r border-aura-border bg-aura-surface shrink-0 h-screen sticky top-0">

      {/* ── Logo ─────────────────────────────────────────────────── */}
      <div className="px-5 py-5 border-b border-aura-border">
        <div className="flex items-center gap-3">
          <AuraLogo />
          <span className="font-display text-xl text-aura-text tracking-tight">Aura</span>
        </div>
      </div>

      {/* ── Navigation ───────────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} isActive={pathname.startsWith(item.href)} />
        ))}
      </nav>

      {/* ── User footer ──────────────────────────────────────────── */}
      <div className="px-3 pb-4 pt-3 border-t border-aura-border">
        {/* User info */}
        <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
          <Avatar name={userDisplayName} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-aura-text truncate">{userDisplayName}</p>
            <p className="text-xs text-aura-text-dim truncate">{userEmail}</p>
          </div>
        </div>

        {/* Sign out */}
        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-3 text-aura-text-dim hover:text-aura-danger hover:bg-aura-danger-muted/50"
          >
            <LogOut size={14} className="shrink-0" />
            Sign out
          </Button>
        </form>
      </div>
    </aside>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      title={item.description}
      className={cn(
        // Base
        'relative flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-150 group',
        // Inactive
        !isActive && 'text-aura-text-secondary hover:text-aura-text hover:bg-white/5',
        // Active — teal left bar + muted teal background
        isActive && [
          'text-aura-text bg-aura-primary/10',
          'before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-r-full before:bg-aura-primary',
        ]
      )}
    >
      <Icon
        size={16}
        className={cn(
          'shrink-0 transition-colors duration-150',
          isActive ? 'text-aura-primary' : 'text-aura-text-dim group-hover:text-aura-text-secondary'
        )}
      />
      <span>{item.label}</span>
    </Link>
  )
}

function AuraLogo() {
  return (
    <div className="relative w-7 h-7 shrink-0">
      <div className="absolute inset-0 rounded-full border border-aura-primary/60" />
      <div className="absolute inset-[3px] rounded-full border border-aura-primary/25" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display text-aura-primary text-sm leading-none">A</span>
      </div>
    </div>
  )
}
