/**
 * POST /api/profile/password
 *
 * Changes the authenticated user's password.
 * The user is already logged in — the session is proof of identity.
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const RequestSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters.'),
})

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
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? 'Invalid input.' },
      { status: 400 }
    )
  }

  try {
    // 3. UPDATE PASSWORD
    const { error: updateError } = await supabase.auth.updateUser({
      password: parsed.data.newPassword,
    })

    if (updateError) {
      console.error(`[PASSWORD] Update failed for user ${user.id}:`, updateError.message)
      return NextResponse.json({ error: 'Failed to update password. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`[PASSWORD] Error for user ${user.id}:`, error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Failed to update password.' }, { status: 500 })
  }
}
