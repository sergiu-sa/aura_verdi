/**
 * GET/PATCH /api/notifications/preferences
 *
 * Read and update notification preferences for the authenticated user.
 * Preferences are stored as JSONB in profiles.notification_preferences.
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const PatchSchema = z.object({
  email_critical: z.boolean().optional(),
  email_informational: z.boolean().optional(),
  quiet_hours_start: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  quiet_hours_end: z.string().regex(/^\d{2}:\d{2}$/).optional(),
})

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('notification_preferences')
    .eq('id', user.id)
    .single()

  return NextResponse.json({
    preferences: profile?.notification_preferences ?? {},
  })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid preferences.' }, { status: 400 })
  }

  try {
    // Fetch current prefs, merge with updates
    const { data: profile } = await supabase
      .from('profiles')
      .select('notification_preferences')
      .eq('id', user.id)
      .single()

    const current = (profile?.notification_preferences as Record<string, unknown>) ?? {}
    const updated = { ...current, ...parsed.data }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ notification_preferences: updated })
      .eq('id', user.id)

    if (updateError) {
      console.error(`[NOTIF_PREFS] Update failed for user ${user.id}:`, updateError.message)
      return NextResponse.json({ error: 'Failed to update preferences.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, preferences: updated })
  } catch (error) {
    console.error(`[NOTIF_PREFS] Error for user ${user.id}:`, error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Failed to update preferences.' }, { status: 500 })
  }
}
