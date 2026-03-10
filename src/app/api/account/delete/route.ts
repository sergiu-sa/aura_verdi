/**
 * POST /api/account/delete
 *
 * GDPR account deletion — permanently deletes all user data.
 * Deletes: storage files, documents, chat messages, notifications, bills,
 * transactions, accounts, bank connections, partner links, email log, and profile.
 * Finally deletes the Supabase Auth user via admin API.
 *
 * Requires confirmation: { confirm: "DELETE" }
 *
 * Security: Auth required. Uses service role for cascading cleanup.
 */

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const DeleteSchema = z.object({
  confirm: z.literal('DELETE'),
})

export async function POST(request: Request) {
  // 1. AUTHENTICATE
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. VALIDATE CONFIRMATION
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const parsed = DeleteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Confirmation required. Send { "confirm": "DELETE" }.' }, { status: 400 })
  }

  try {
    // 3. USE SERVICE ROLE for cascading deletes
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const userId = user.id

    // 4. DELETE STORAGE FILES
    const { data: docs } = await serviceClient
      .from('documents')
      .select('file_path')
      .eq('user_id', userId)

    if (docs && docs.length > 0) {
      const paths = docs.map((d) => d.file_path)
      await serviceClient.storage.from('user-documents').remove(paths)
    }

    // 5. DELETE DATABASE RECORDS (order matters for FK constraints)
    // Tables with no FK dependencies on other user tables first
    await serviceClient.from('email_log').delete().eq('user_id', userId)
    await serviceClient.from('notifications').delete().eq('user_id', userId)
    await serviceClient.from('chat_messages').delete().eq('user_id', userId)
    await serviceClient.from('documents').delete().eq('user_id', userId)
    await serviceClient.from('bills_upcoming').delete().eq('user_id', userId)
    await serviceClient.from('transactions').delete().eq('user_id', userId)
    await serviceClient.from('accounts').delete().eq('user_id', userId)
    await serviceClient.from('bank_connections').delete().eq('user_id', userId)

    // Partner sharing — delete both directions
    await serviceClient.from('partner_sharing').delete().eq('user_id', userId)
    await serviceClient.from('partner_sharing').delete().eq('partner_id', userId)

    // Clear partner link on the other user's profile
    await serviceClient.from('profiles').update({ partner_id: null }).eq('partner_id', userId)

    // Delete own profile
    await serviceClient.from('profiles').delete().eq('id', userId)

    // 6. DELETE AUTH USER
    const { error: deleteAuthError } = await serviceClient.auth.admin.deleteUser(userId)
    if (deleteAuthError) {
      console.error(`[ACCOUNT] Auth delete error for user ${userId}:`, deleteAuthError.message)
      // Continue anyway — data is already gone
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`[ACCOUNT] Delete error for user ${user.id}:`, error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Failed to delete account.' }, { status: 500 })
  }
}
