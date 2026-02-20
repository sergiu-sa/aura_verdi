import Link from 'next/link'
import { signOut } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  MessageCircle,
  FileText,
  Scale,
  Settings,
  LogOut,
} from 'lucide-react'

// Navigation items — sidebar and mobile nav
const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Chat', href: '/chat', icon: MessageCircle },
  { label: 'Documents', href: '/documents', icon: FileText },
  { label: 'Legal', href: '/legal', icon: Scale },
  { label: 'Settings', href: '/settings', icon: Settings },
]

/**
 * App layout — authenticated pages only.
 * Contains sidebar (desktop) and placeholder for mobile bottom nav (Step 4).
 * Sign-out is wired up here for testing in Step 3.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-aura-background">

      {/* ── Desktop Sidebar ────────────────────────────────────────────── */}
      <aside className="hidden md:flex w-60 flex-col border-r border-aura-border bg-aura-surface shrink-0">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-aura-border">
          <div className="flex items-center gap-2.5">
            <div className="relative w-7 h-7 shrink-0">
              <div className="absolute inset-0 rounded-full border border-aura-primary/60" />
              <div className="absolute inset-[2px] rounded-full border border-aura-primary/25" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display text-aura-primary text-sm leading-none">A</span>
              </div>
            </div>
            <span className="font-display text-xl text-aura-text tracking-tight">Aura</span>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-aura-text-secondary hover:text-aura-text hover:bg-white/5 transition-colors group"
            >
              <Icon
                size={16}
                className="shrink-0 text-aura-text-dim group-hover:text-aura-text transition-colors"
              />
              {label}
            </Link>
          ))}
        </nav>

        {/* Sign out — bottom of sidebar */}
        <div className="px-3 pb-4 border-t border-aura-border pt-3">
          <form action={signOut}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-3 text-aura-text-dim hover:text-aura-danger"
            >
              <LogOut size={15} className="shrink-0" />
              Sign out
            </Button>
          </form>
        </div>
      </aside>

      {/* ── Main content ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header (placeholder — full mobile nav in Step 4) */}
        <header className="flex md:hidden items-center justify-between px-4 py-3 border-b border-aura-border bg-aura-surface">
          <div className="flex items-center gap-2">
            <div className="relative w-7 h-7">
              <div className="absolute inset-0 rounded-full border border-aura-primary/60" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display text-aura-primary text-sm">A</span>
              </div>
            </div>
            <span className="font-display text-lg text-aura-text">Aura</span>
          </div>
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="icon" className="text-aura-text-dim">
              <LogOut size={16} />
            </Button>
          </form>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

    </div>
  )
}
