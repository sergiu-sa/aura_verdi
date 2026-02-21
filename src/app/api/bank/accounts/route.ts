/**
 * GET /api/bank/accounts
 *
 * Returns the authenticated user's bank accounts from our database.
 * This is used by the Dashboard (Step 7) and the context-builder.
 *
 * Note: This returns data from OUR database (Supabase), not live from Neonomics.
 * To get fresh data, call /api/bank/sync first.
 *
 * IBANs are intentionally excluded from this response.
 * They are stored in the database but should never be sent to the client
 * or to Claude — they are sensitive identifiers.
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
    // 2. FETCH ACCOUNTS — scoped to user, no IBAN in response
    const { data: accounts, error } = await supabase
      .from('accounts')
      .select(`
        id,
        account_name,
        balance,
        currency,
        account_type,
        last_updated_at,
        bank_connections (
          bank_name,
          status,
          last_synced_at,
          consent_expires_at
        )
      `)
      .eq('user_id', user.id)
      .order('last_updated_at', { ascending: false })

    if (error) {
      console.error(`[BANK_ACCOUNTS] DB error for user ${user.id}:`, error.message)
      return NextResponse.json(
        { error: 'Failed to fetch accounts' },
        { status: 500 }
      )
    }

    return NextResponse.json({ accounts: accounts ?? [] })
  } catch (error) {
    console.error(`[BANK_ACCOUNTS] Error for user ${user.id}:`, error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    )
  }
}
