/**
 * PATCH /api/profile
 *
 * Updates the authenticated user's profile (display name).
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const PatchSchema = z.object({
  displayName: z.string().min(1).max(100).trim(),
})

export async function PATCH(request: Request) {
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

  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Display name is required (1-100 characters).' }, { status: 400 })
  }

  try {
    // 3. UPDATE PROFILE
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ display_name: parsed.data.displayName })
      .eq('id', user.id)

    if (updateError) {
      console.error(`[PROFILE] Update failed for user ${user.id}:`, updateError.message)
      return NextResponse.json({ error: 'Failed to update profile.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`[PROFILE] Error for user ${user.id}:`, error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Failed to update profile.' }, { status: 500 })
  }
}
