import { signOut } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { NotificationBell } from './notification-bell'
import { LogOut } from 'lucide-react'

interface TopNavProps {
  userDisplayName: string
  userId: string
}

/**
 * Mobile-only top navigation bar.
 * Shows Aura logo, notification bell, user avatar, and sign-out button.
 * Hidden on md+ screens (desktop uses the sidebar instead).
 */
export function TopNav({ userDisplayName, userId }: TopNavProps) {
  return (
    <header className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b border-aura-border bg-aura-surface/95 backdrop-blur-md">
      {/* Aura wordmark */}
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

      {/* Right: bell + avatar + sign out */}
      <div className="flex items-center gap-1">
        <NotificationBell userId={userId} />
        <Avatar name={userDisplayName} size="sm" />
        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            className="text-aura-text-dim hover:text-aura-danger w-8 h-8"
            title="Sign out"
          >
            <LogOut size={15} />
          </Button>
        </form>
      </div>
    </header>
  )
}
