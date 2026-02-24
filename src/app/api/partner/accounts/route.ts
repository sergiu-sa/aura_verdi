/**
 * GET /api/partner/accounts
 *
 * Returns the user's own accounts (with sharing status) and the
 * partner's accounts that have been shared with this user.
 *
 * The partner accounts query relies entirely on RLS — Supabase will
 * only return accounts where is_shared_with_partner = true and the
 * partner_sharing record is accepted = true.
 *
 * ---
 *
 * PATCH /api/partner/accounts
 *
 * Toggle is_shared_with_partner on one of the user's own accounts.
 *
 * Accepts: { accountId: string, shared: boolean }
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const PatchSchema = z.object({
  accountId: z.string().uuid(),
  shared: z.boolean(),
})

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
    // 2. FETCH own accounts with sharing status
    const { data: myAccounts } = await supabase
      .from('accounts')
      .select('id, account_name, account_type, balance, currency, is_shared_with_partner')
      .eq('user_id', user.id)
      .order('account_name', { ascending: true })

    // 3. FETCH partner's shared accounts
    // RLS handles this automatically — only returns accounts where:
    //   - partner_sharing exists with partner_id = me AND accepted = true
    //   - accounts.is_shared_with_partner = true
    // We exclude the user's own accounts by filtering user_id != me
    const { data: partnerAccounts } = await supabase
      .from('accounts')
      .select('id, account_name, account_type, currency')
      .neq('user_id', user.id)
      .eq('is_shared_with_partner', true)
      .order('account_name', { ascending: true })

    return NextResponse.json({
      myAccounts: myAccounts ?? [],
      partnerAccounts: partnerAccounts ?? [],
    })
  } catch (error) {
    console.error(`[PARTNER_ACCOUNTS_GET] Error for user ${user.id}:`, error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Failed to fetch accounts.' }, { status: 500 })
  }
}

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
    return NextResponse.json({ error: 'Invalid input.' }, { status: 400 })
  }

  const { accountId, shared } = parsed.data

  try {
    // 3. UPDATE — scoped to user_id to prevent tampering with others' accounts
    const { error } = await supabase
      .from('accounts')
      .update({ is_shared_with_partner: shared })
      .eq('id', accountId)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`[PARTNER_ACCOUNTS_PATCH] Error for user ${user.id}:`, error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Failed to update sharing. Please try again.' }, { status: 500 })
  }
}
