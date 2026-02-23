/**
 * Email Notification Service
 *
 * Privacy-safe email alerts via Resend.
 *
 * Rules (per spec):
 * - NEVER include amounts, account numbers, or PII in email bodies
 * - Max 5 emails per user per day
 * - Respect quiet hours (default: 22:00–07:00)
 * - Always include unsubscribe link (GDPR / CAN-SPAM compliance)
 * - Include List-Unsubscribe headers for one-click unsubscribe in email clients
 */

import { Resend } from 'resend'
import { SupabaseClient } from '@supabase/supabase-js'
import { createUnsubscribeToken } from './tokens'

// Lazy-initialize so missing API key doesn't crash at module load time
function getResend() {
  return new Resend(process.env.RESEND_API_KEY || '')
}

interface EmailParams {
  userId: string
  userEmail: string
  notificationId: string
  title: string
  message: string
  isFirstEmail?: boolean // true = include VIP sender tip
}

export async function sendNotificationEmail(params: EmailParams): Promise<string | null> {
  const unsubToken = createUnsubscribeToken(params.userId)
  const unsubUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/unsubscribe?token=${unsubToken}`
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  // VIP tip only on the first email ever sent to this user
  const vipTip = params.isFirstEmail
    ? `<p style="margin-top:24px;padding:16px;background:#1C1C28;border-radius:8px;color:#8888A0;font-size:13px;">
        💡 <strong>Tip:</strong> Add this sender to your VIP or important contacts so critical financial alerts never end up in spam.
       </p>`
    : ''

  try {
    const { data, error } = await getResend().emails.send({
      from: process.env.EMAIL_FROM || 'Aura <noreply@aura.app>',
      to: [params.userEmail],
      subject: `⚠️ Aura: ${params.title}`,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#121218;color:#E8E8EC;">
          <div style="margin-bottom:24px;">
            <span style="color:#0D7377;font-size:20px;font-weight:bold;">Aura</span>
          </div>
          <h2 style="color:#E8E8EC;font-size:18px;margin-bottom:8px;">${params.title}</h2>
          <p style="color:#8888A0;font-size:15px;line-height:1.6;">${params.message}</p>
          <a href="${appUrl}/dashboard"
             style="display:inline-block;margin-top:20px;padding:12px 24px;background:#0D7377;color:white;text-decoration:none;border-radius:8px;font-weight:500;">
            Open Aura
          </a>
          ${vipTip}
          <hr style="border:none;border-top:1px solid #2A2A3A;margin:32px 0 16px;" />
          <p style="color:#555;font-size:12px;">
            You're receiving this because you have critical alerts enabled in Aura.
            <a href="${unsubUrl}" style="color:#0D7377;">Unsubscribe from email alerts</a>
          </p>
        </div>
      `,
      headers: {
        'List-Unsubscribe': `<${unsubUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    })

    if (error) {
      console.error(`[EMAIL] Send failed for user ${params.userId}:`, error.message)
      return null
    }
    return data?.id || null
  } catch (error) {
    console.error(`[EMAIL] Error for user ${params.userId}:`, error instanceof Error ? error.message : 'Unknown')
    return null
  }
}

/** Rate limit: max 5 emails per user per day */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function canSendEmail(supabase: SupabaseClient<any>, userId: string): Promise<boolean> {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from('email_log')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('sent_at', todayStart.toISOString())

  return (count || 0) < 5
}

/** Quiet hours check (default: no emails 22:00–07:00 local server time) */
export function isQuietHours(prefs: Record<string, unknown>): boolean {
  const now = new Date()
  const hour = now.getHours()
  const start = parseInt((prefs.quiet_hours_start as string)?.split(':')[0] || '22')
  const end = parseInt((prefs.quiet_hours_end as string)?.split(':')[0] || '7')

  if (start > end) {
    // Wraps midnight: e.g. 22:00–07:00
    return hour >= start || hour < end
  }
  return hour >= start && hour < end
}
