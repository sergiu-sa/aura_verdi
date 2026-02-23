/**
 * GET /api/notifications/check
 *
 * Triggered by Vercel Cron every day at 06:00 UTC.
 * Checks all users and creates notification records.
 * Also sends emails for pending critical notifications.
 *
 * Security: Requires Authorization: Bearer {CRON_SECRET} header.
 *
 * For local testing:
 *   curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/notifications/check
 */

import { createClient } from '@supabase/supabase-js'
import { runNotificationChecks, createNotifications } from '@/lib/notifications/engine'
import { sendNotificationEmail, canSendEmail, isQuietHours } from '@/lib/notifications/email'
import { NextResponse } from 'next/server'

// Service role client — this runs without a user session
function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: Request) {
  // SECURITY: Verify this is a legitimate Vercel Cron call
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  try {
    // Get all active users
    const { data: users } = await supabase
      .from('profiles')
      .select('id, notification_preferences')

    let totalCreated = 0
    let totalEmailed = 0

    for (const user of users || []) {
      const prefs = (user.notification_preferences as Record<string, unknown>) || {}

      // 1. Run notification checks and create records
      const notifications = await runNotificationChecks(supabase, user.id)
      const created = await createNotifications(supabase, user.id, notifications)
      totalCreated += created

      // 2. Send emails for pending critical notifications
      if (isQuietHours(prefs)) continue // respect quiet hours

      const { data: pendingEmails } = await supabase
        .from('notifications')
        .select('id, title, message')
        .eq('user_id', user.id)
        .eq('is_emailed', false)
        .in('channel', ['email', 'both'])

      if (!pendingEmails?.length) continue
      if (!(await canSendEmail(supabase, user.id))) continue

      // Get user's email from Supabase Auth
      const { data: authUser } = await supabase.auth.admin.getUserById(user.id)
      if (!authUser?.user?.email) continue

      // Check if this is the user's first-ever email (for VIP tip)
      const { count: emailCount } = await supabase
        .from('email_log')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      for (const notif of pendingEmails) {
        const resendId = await sendNotificationEmail({
          userId: user.id,
          userEmail: authUser.user.email,
          notificationId: notif.id,
          title: notif.title,
          message: notif.message,
          isFirstEmail: (emailCount || 0) === 0,
        })

        if (resendId) {
          await supabase
            .from('notifications')
            .update({ is_emailed: true })
            .eq('id', notif.id)

          await supabase.from('email_log').insert({
            user_id: user.id,
            notification_id: notif.id,
            email_type: 'critical_alert',
            resend_id: resendId,
          })
          totalEmailed++
        }
      }
    }

    // 3. Clean up expired notifications
    await supabase
      .from('notifications')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .not('expires_at', 'is', null)

    return NextResponse.json({
      checked: users?.length || 0,
      created: totalCreated,
      emailed: totalEmailed,
    })
  } catch (error) {
    console.error('[CRON] Notification check failed:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
