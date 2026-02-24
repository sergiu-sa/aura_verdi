/**
 * POST /api/partner/invite
 *
 * Send a partner invite to another Aura user by email.
 * The partner must already have an Aura account.
 *
 * Accepts: { partnerEmail: string }
 * Returns: { sharingId: string }
 */

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const RequestSchema = z.object({
  partnerEmail: z.string().email(),
})

// Service role client — needed to look up users by email
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
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }

  const { partnerEmail } = parsed.data

  try {
    // 3. REJECT self-invite
    if (partnerEmail.toLowerCase() === user.email?.toLowerCase()) {
      return NextResponse.json({ error: "You can't invite yourself." }, { status: 400 })
    }

    // 4. CHECK if already linked
    const { data: existing } = await supabase
      .from('partner_sharing')
      .select('id')
      .or(`user_id.eq.${user.id},partner_id.eq.${user.id}`)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'You already have a pending or active partner link.' }, { status: 409 })
    }

    // 5. LOOK UP partner by email (service role required — never expose this to client)
    const serviceClient = getServiceClient()
    const { data: usersPage, error: listError } = await serviceClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    })

    if (listError) {
      console.error(`[PARTNER_INVITE] Failed to look up users for ${user.id}:`, listError.message)
      return NextResponse.json({ error: 'Failed to look up partner. Please try again.' }, { status: 500 })
    }

    const partnerAuthUser = usersPage.users.find(
      (u) => u.email?.toLowerCase() === partnerEmail.toLowerCase()
    )

    if (!partnerAuthUser) {
      return NextResponse.json(
        { error: "That email isn't registered with Aura. Ask your partner to create an account first." },
        { status: 404 }
      )
    }

    if (partnerAuthUser.id === user.id) {
      return NextResponse.json({ error: "You can't invite yourself." }, { status: 400 })
    }

    // 6. CREATE partner_sharing record
    const { data: sharing, error: insertError } = await supabase
      .from('partner_sharing')
      .insert({
        user_id: user.id,
        partner_id: partnerAuthUser.id,
        accepted: false,
      })
      .select('id')
      .single()

    if (insertError) {
      // UNIQUE constraint violation = already invited
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'An invite already exists for this partner.' }, { status: 409 })
      }
      throw insertError
    }

    return NextResponse.json({ sharingId: sharing.id })
  } catch (error) {
    console.error(`[PARTNER_INVITE] Error for user ${user.id}:`, error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Failed to send invite. Please try again.' }, { status: 500 })
  }
}
