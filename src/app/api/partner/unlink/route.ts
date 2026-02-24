/**
 * POST /api/partner/unlink
 *
 * Remove an active partner link (or cancel a pending invite).
 * Either partner can unlink at any time. Access is revoked immediately
 * because the RLS policies depend on the partner_sharing record existing.
 *
 * Returns: { success: true }
 */

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST() {
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
    // 2. FIND the sharing record (user can be on either side)
    const { data: sharing } = await supabase
      .from('partner_sharing')
      .select('id, user_id, partner_id')
      .or(`user_id.eq.${user.id},partner_id.eq.${user.id}`)
      .maybeSingle()

    if (!sharing) {
      return NextResponse.json({ error: 'No active partner link found.' }, { status: 404 })
    }

    const serviceClient = getServiceClient()

    // 3. DELETE the sharing record — this immediately revokes all partner RLS access
    await serviceClient
      .from('partner_sharing')
      .delete()
      .eq('id', sharing.id)

    // 4. CLEAR profiles.partner_id on both users
    await Promise.all([
      serviceClient
        .from('profiles')
        .update({ partner_id: null })
        .eq('id', sharing.user_id),

      serviceClient
        .from('profiles')
        .update({ partner_id: null })
        .eq('id', sharing.partner_id),
    ])

    // 5. RESET is_shared_with_partner on all of this user's accounts
    // (clean up so re-linking starts fresh)
    await serviceClient
      .from('accounts')
      .update({ is_shared_with_partner: false })
      .eq('user_id', user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`[PARTNER_UNLINK] Error for user ${user.id}:`, error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Failed to unlink. Please try again.' }, { status: 500 })
  }
}
