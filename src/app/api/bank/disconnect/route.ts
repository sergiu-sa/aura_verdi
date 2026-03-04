/**
 * POST /api/bank/disconnect
 *
 * Sets a bank connection status to 'revoked'. The user can reconnect later.
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { checkRateLimit, RATE_LIMITS } from '@/lib/utils/rate-limiter'

const DisconnectSchema = z.object({
  connectionId: z.string().uuid(),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!checkRateLimit(`bankSync:${user.id}`, RATE_LIMITS.bankSync.max, RATE_LIMITS.bankSync.windowMs)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const parsed = DisconnectSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input.' }, { status: 400 })
  }

  try {
    const { connectionId } = parsed.data
    const { error: updateError, count } = await supabase
      .from('bank_connections')
      .update({ status: 'revoked' })
      .eq('id', connectionId)
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (updateError) {
      console.error(`[BANK] Disconnect error for user ${user.id}:`, updateError.message)
      return NextResponse.json({ error: 'Failed to disconnect bank.' }, { status: 500 })
    }

    if (count === 0) {
      return NextResponse.json({ error: 'Connection not found or already disconnected.' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`[BANK] Disconnect unexpected error for user ${user.id}:`, error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
