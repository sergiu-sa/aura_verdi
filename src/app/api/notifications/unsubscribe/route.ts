/**
 * GET /api/notifications/unsubscribe?token=...
 *
 * GDPR-compliant one-click unsubscribe from email notifications.
 * Works without login — uses a signed HMAC token from the email link.
 *
 * On success: disables email notifications for the user and shows
 * a simple branded confirmation page.
 */

import { createClient } from '@supabase/supabase-js'
import { verifyUnsubscribeToken } from '@/lib/notifications/tokens'
import { NextResponse } from 'next/server'

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return new NextResponse('Missing token', { status: 400 })
  }

  const userId = verifyUnsubscribeToken(token)
  if (!userId) {
    return new NextResponse(
      'Invalid or expired unsubscribe link. Log in to Aura to manage your notification settings.',
      { status: 403 }
    )
  }

  const supabase = createServiceClient()

  // Disable ALL email notifications for this user
  const { data: profile } = await supabase
    .from('profiles')
    .select('notification_preferences')
    .eq('id', userId)
    .single()

  const prefs = (profile?.notification_preferences as Record<string, unknown>) || {}
  prefs.email_critical = false
  prefs.email_informational = false

  await supabase
    .from('profiles')
    .update({ notification_preferences: prefs })
    .eq('id', userId)

  // Simple branded confirmation page
  return new NextResponse(
    `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Unsubscribed — Aura</title>
    </head>
    <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;text-align:center;padding:60px 24px;background:#121218;color:#E8E8EC;min-height:100vh;margin:0;">
      <h1 style="color:#0D7377;font-size:28px;margin-bottom:8px;">Aura</h1>
      <p style="font-size:18px;margin-top:32px;">You've been unsubscribed from email notifications.</p>
      <p style="color:#8888A0;margin-top:12px;">You'll still see notifications inside the app.</p>
      <p style="color:#8888A0;">You can re-enable email alerts anytime in Aura → Settings.</p>
    </body>
    </html>`,
    { headers: { 'Content-Type': 'text/html' } }
  )
}
