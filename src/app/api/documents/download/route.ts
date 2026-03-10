/**
 * GET /api/documents/download?id=xxx
 *
 * Creates a short-lived signed URL for a document stored in Supabase Storage.
 * Returns { url } which the client can open in a new tab.
 *
 * Security: Auth check + user ownership verification.
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // 1. AUTHENTICATE
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. VALIDATE INPUT
  const { searchParams } = new URL(request.url)
  const documentId = searchParams.get('id')
  if (!documentId) {
    return NextResponse.json({ error: 'Missing document ID.' }, { status: 400 })
  }

  try {
    // 3. FETCH DOCUMENT — must belong to this user
    const { data: doc } = await supabase
      .from('documents')
      .select('file_path, original_filename')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (!doc) {
      return NextResponse.json({ error: 'Document not found.' }, { status: 404 })
    }

    // 4. CREATE SIGNED URL (valid for 60 seconds)
    const { data: signed, error: signError } = await supabase.storage
      .from('user-documents')
      .createSignedUrl(doc.file_path, 60, {
        download: doc.original_filename,
      })

    if (signError || !signed?.signedUrl) {
      console.error(`[DOCUMENTS] Signed URL error for user ${user.id}:`, signError?.message ?? 'Unknown')
      return NextResponse.json({ error: 'Failed to generate download link.' }, { status: 500 })
    }

    return NextResponse.json({ url: signed.signedUrl })
  } catch (error) {
    console.error(`[DOCUMENTS] Download error for user ${user.id}:`, error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
