/**
 * POST /api/partner/accept
 *
 * Accept a pending partner invite.
 * Sets accepted = true and links profiles.partner_id on both users.
 *
 * Accepts: { sharingId: string }
 * Returns: { success: true }
 */

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const RequestSchema = z.object({
  sharingId: z.string().uuid(),
})

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

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

  const { sharingId } = parsed.data

  try {
    // 3. FIND the invite — must be addressed to this user and not yet accepted
    const { data: sharing } = await supabase
      .from('partner_sharing')
      .select('id, user_id, partner_id')
      .eq('id', sharingId)
      .eq('partner_id', user.id)
      .eq('accepted', false)
      .single()

    if (!sharing) {
      return NextResponse.json({ error: 'Invite not found or already accepted.' }, { status: 404 })
    }

    const serviceClient = getServiceClient()

    // 4. SET accepted = true
    await serviceClient
      .from('partner_sharing')
      .update({ accepted: true })
      .eq('id', sharingId)

    // 5. LINK profiles.partner_id on both users
    await Promise.all([
      serviceClient
        .from('profiles')
        .update({ partner_id: sharing.partner_id })
        .eq('id', sharing.user_id),

      serviceClient
        .from('profiles')
        .update({ partner_id: sharing.user_id })
        .eq('id', sharing.partner_id),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`[PARTNER_ACCEPT] Error for user ${user.id}:`, error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Failed to accept invite. Please try again.' }, { status: 500 })
  }
}
