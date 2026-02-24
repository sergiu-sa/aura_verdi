/**
 * GET /api/partner/status
 *
 * Returns the current partner linking state for the authenticated user.
 * The UI uses this to decide which of the 4 states to render.
 *
 * States:
 *   none     — no invite sent or received
 *   sent     — user sent an invite, waiting for partner to accept
 *   received — user received an invite from someone else
 *   linked   — both sides have accepted, actively linked
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  // 1. AUTHENTICATE
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 2. FIND any partner_sharing record where this user is inviter or invitee
    const { data: sharing } = await supabase
      .from('partner_sharing')
      .select('id, user_id, partner_id, accepted, permission_level, created_at')
      .or(`user_id.eq.${user.id},partner_id.eq.${user.id}`)
      .maybeSingle()

    if (!sharing) {
      return NextResponse.json({ state: 'none' })
    }

    // 3. Determine state and fetch partner's display name
    const isInviter = sharing.user_id === user.id
    const partnerId = isInviter ? sharing.partner_id : sharing.user_id

    const { data: partnerProfile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', partnerId)
      .single()

    const partnerName = partnerProfile?.display_name ?? 'Your partner'

    if (sharing.accepted) {
      return NextResponse.json({
        state: 'linked',
        sharing,
        partnerId,
        partnerName,
      })
    }

    if (isInviter) {
      return NextResponse.json({
        state: 'sent',
        sharing,
        partnerId,
        partnerName,
      })
    }

    // Not accepted, user is the invitee
    return NextResponse.json({
      state: 'received',
      sharing,
      partnerId,
      partnerName,
    })
  } catch (error) {
    console.error(`[PARTNER_STATUS] Error for user ${user.id}:`, error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Failed to fetch partner status.' }, { status: 500 })
  }
}
