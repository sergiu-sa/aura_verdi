/**
 * GET /api/account/export
 *
 * GDPR data export — returns all user data as a JSON file download.
 * Includes: profile, accounts, transactions, bills, documents (metadata only),
 * chat messages, notifications, and partner sharing records.
 *
 * Security: Auth required. Rate limited.
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/utils/rate-limiter'

export async function GET() {
  // 1. AUTHENTICATE
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. RATE LIMIT — max 3 exports per hour
  if (!checkRateLimit(`export:${user.id}`, 3, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  try {
    // 3. FETCH ALL USER DATA in parallel
    const [
      profileRes,
      accountsRes,
      transactionsRes,
      billsRes,
      documentsRes,
      chatRes,
      notificationsRes,
      connectionsRes,
    ] = await Promise.all([
      supabase.from('profiles').select('display_name, preferred_language, notification_preferences, created_at').eq('id', user.id).single(),
      supabase.from('accounts').select('account_name, balance, currency, account_type, is_shared_with_partner, last_updated_at').eq('user_id', user.id),
      supabase.from('transactions').select('transaction_date, amount, currency, description, category, is_recurring, counterpart_name').eq('user_id', user.id).order('transaction_date', { ascending: false }),
      supabase.from('bills_upcoming').select('name, amount, currency, due_date, is_paid, category, recurrence, priority, created_at').eq('user_id', user.id),
      supabase.from('documents').select('original_filename, file_size_bytes, mime_type, document_type, ai_summary, status, uploaded_at').eq('user_id', user.id),
      supabase.from('chat_messages').select('role, content, tokens_used, created_at').eq('user_id', user.id).order('created_at', { ascending: true }),
      supabase.from('notifications').select('type, title, message, is_read, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('bank_connections').select('bank_name, status, consent_expires_at, last_synced_at, created_at').eq('user_id', user.id),
    ])

    const exportData = {
      exported_at: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        profile: profileRes.data,
      },
      bank_connections: connectionsRes.data ?? [],
      accounts: accountsRes.data ?? [],
      transactions: transactionsRes.data ?? [],
      bills: billsRes.data ?? [],
      documents: documentsRes.data ?? [],
      chat_messages: chatRes.data ?? [],
      notifications: notificationsRes.data ?? [],
    }

    // 4. RETURN AS DOWNLOADABLE JSON
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="aura-data-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (error) {
    console.error(`[EXPORT] Error for user ${user.id}:`, error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Failed to export data.' }, { status: 500 })
  }
}
