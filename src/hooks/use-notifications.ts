'use client'

/**
 * useNotifications
 *
 * Supabase Realtime subscription for live notification updates.
 * Fetches unread notifications on mount, then listens for new ones
 * via Postgres Changes — so the bell updates instantly when the cron
 * creates a new notification (no polling needed).
 */

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Notification {
  id: string
  type: string
  urgency: string
  title: string
  message: string
  is_read: boolean
  related_entity_type?: string
  related_entity_id?: string
  created_at: string
}

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  // ── Initial fetch ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return

    async function fetchNotifications() {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(20)

      if (data) {
        setNotifications(data)
        setUnreadCount(data.length)
      }
    }

    fetchNotifications()
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Realtime subscription — new notifications appear instantly ──────────
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification
          setNotifications((prev) => [newNotif, ...prev])
          setUnreadCount((prev) => prev + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mark single notification as read ───────────────────────────────────
  const markAsRead = useCallback(
    async (notificationId: string) => {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    },
    [supabase]
  )

  // ── Mark all as read ───────────────────────────────────────────────────
  const markAllAsRead = useCallback(async () => {
    if (!userId) return

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    setNotifications([])
    setUnreadCount(0)
  }, [userId, supabase])

  return { notifications, unreadCount, markAsRead, markAllAsRead }
}
