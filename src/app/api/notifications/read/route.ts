/**
 * POST /api/notifications/read
 *
 * Mark one or all notifications as read for the authenticated user.
 *
 * Accepts:
 *   { notificationId: string }  — mark single notification as read
 *   { all: true }               — mark all unread notifications as read
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const RequestSchema = z.union([
  z.object({ notificationId: z.string().uuid() }),
  z.object({ all: z.literal(true) }),
])

export async function POST(request: Request) {
  // 1. AUTHENTICATE
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. VALIDATE INPUT
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input.' }, { status: 400 })
  }

  try {
    if ('all' in parsed.data) {
      // Mark all unread notifications as read
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      return NextResponse.json({ success: true })
    }

    // Mark single notification as read (scoped to user)
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', parsed.data.notificationId)
      .eq('user_id', user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`[NOTIFICATIONS_READ] Error for user ${user.id}:`, error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Failed to mark as read.' }, { status: 500 })
  }
}
