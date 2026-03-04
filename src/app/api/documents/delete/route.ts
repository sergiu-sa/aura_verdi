/**
 * POST /api/documents/delete
 *
 * Deletes a document: removes from Supabase Storage, deletes DB record,
 * and cleans up any linked bill in bills_upcoming.
 *
 * Accepts: { documentId: string }
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { checkRateLimit, RATE_LIMITS } from '@/lib/utils/rate-limiter'

const RequestSchema = z.object({ documentId: z.string().uuid() })

export async function POST(request: Request) {
  // 1. AUTHENTICATE
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. RATE LIMIT (reuse document upload limits)
  if (!checkRateLimit(`doc-delete:${user.id}`, RATE_LIMITS.documentUpload.max, RATE_LIMITS.documentUpload.windowMs)) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  // 3. VALIDATE INPUT
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid document ID.' }, { status: 400 })
  }

  const { documentId } = parsed.data

  try {
    // 4. FETCH DOCUMENT — must belong to this user
    const { data: doc } = await supabase
      .from('documents')
      .select('id, file_path, status')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (!doc) {
      return NextResponse.json({ error: 'Document not found.' }, { status: 404 })
    }

    // Don't delete while analysis is in progress
    if (doc.status === 'analyzing') {
      return NextResponse.json({ error: 'Cannot delete while analysis is in progress.' }, { status: 409 })
    }

    // 5. DELETE FROM STORAGE
    if (doc.file_path) {
      const { error: storageError } = await supabase.storage
        .from('user-documents')
        .remove([doc.file_path])

      if (storageError) {
        console.error(`[DOC_DELETE] Storage error for user ${user.id}:`, storageError.message)
        // Continue with DB deletion even if storage fails — the file is orphaned but the user wants it gone
      }
    }

    // 6. DELETE LINKED BILLS (from document-to-expense feature)
    await supabase
      .from('bills_upcoming')
      .delete()
      .eq('source_document_id', documentId)
      .eq('user_id', user.id)

    // 7. DELETE DB RECORD
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error(`[DOC_DELETE] DB error for user ${user.id}:`, deleteError.message)
      return NextResponse.json({ error: 'Failed to delete document.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`[DOC_DELETE] Unexpected error for user ${user.id}:`, error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
