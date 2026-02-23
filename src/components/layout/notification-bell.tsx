'use client'

/**
 * NotificationBell
 *
 * Bell icon with unread badge + dropdown panel.
 * Uses Supabase Realtime via useNotifications — updates instantly
 * when the cron creates new notifications, no polling needed.
 */

import { useState, useRef, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useNotifications, type Notification } from '@/hooks/use-notifications'

interface Props {
  userId: string
  /** Which side to open the dropdown toward. Default: 'right' (for sidebar). */
  align?: 'left' | 'right'
}

export function NotificationBell({ userId, align = 'right' }: Props) {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(userId)

  // Close panel on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'relative flex items-center justify-center w-8 h-8 rounded-md transition-colors',
          open
            ? 'text-aura-text bg-white/10'
            : 'text-aura-text-dim hover:text-aura-text hover:bg-white/5'
        )}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell size={16} />
        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-aura-primary text-white text-[10px] font-medium leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className={cn(
          'absolute top-full mt-2 w-80 rounded-xl border border-[#2C2C3A] bg-[#1C1C28] shadow-xl z-50 overflow-hidden',
          align === 'right' ? 'right-0' : 'left-0'
        )}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#2C2C3A]">
            <p className="text-sm font-medium text-aura-text">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={() => { markAllAsRead(); setOpen(false) }}
                className="text-xs text-aura-primary hover:text-aura-primary-light transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-2xl mb-2">🔔</p>
                <p className="text-sm text-aura-text-secondary">No new notifications</p>
                <p className="text-xs text-[#4A4A60] mt-1">You&apos;re all caught up</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <NotificationItem
                  key={notif.id}
                  notification={notif}
                  onRead={() => markAsRead(notif.id)}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-component ─────────────────────────────────────────────────────────────

function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification
  onRead: () => void
}) {
  const urgencyColor = {
    critical: 'text-aura-danger',
    info: 'text-aura-primary',
    background: 'text-aura-text-secondary',
  }[notification.urgency] ?? 'text-aura-text-secondary'

  const urgencyDot = {
    critical: 'bg-aura-danger',
    info: 'bg-aura-primary',
    background: 'bg-[#4A4A60]',
  }[notification.urgency] ?? 'bg-[#4A4A60]'

  return (
    <div className="flex gap-3 px-4 py-3 border-b border-[#2C2C3A] last:border-0 hover:bg-white/[0.03] transition-colors">
      {/* Urgency dot */}
      <div className="pt-1.5 shrink-0">
        <div className={cn('w-1.5 h-1.5 rounded-full', urgencyDot)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn('text-xs font-medium mb-0.5', urgencyColor)}>{notification.title}</p>
        <p className="text-xs text-aura-text-secondary leading-relaxed">{notification.message}</p>
        <p className="text-[10px] text-[#4A4A60] mt-1">
          {formatRelativeTime(notification.created_at)}
        </p>
      </div>

      {/* Dismiss button */}
      <button
        onClick={onRead}
        className="shrink-0 text-[#4A4A60] hover:text-aura-text-secondary transition-colors text-xs leading-none pt-0.5"
        aria-label="Dismiss notification"
      >
        ✕
      </button>
    </div>
  )
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay === 1) return 'Yesterday'
  return `${diffDay} days ago`
}
