/**
 * POST /api/documents/upload
 *
 * Accepts a multipart/form-data request with a single file field named "file".
 * Validates the file, uploads it to Supabase Storage, and creates a DB record.
 *
 * Returns { documentId } on success so the client can trigger analysis next.
 *
 * Security:
 *   - Auth check first
 *   - Rate limited (20 uploads/hr)
 *   - Magic byte validation (never trust Content-Type header)
 *   - Filename sanitized before storage
 *   - Max 10MB enforced
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { checkRateLimit, RATE_LIMITS } from '@/lib/utils/rate-limiter'
import { validateFileMagicBytes, sanitizeFilename } from '@/lib/utils/sanitize'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

// Map browser MIME types to allowed document MIME types
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/heic',
])

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

  // 2. RATE LIMIT
  if (!checkRateLimit(`upload:${user.id}`, RATE_LIMITS.documentUpload.max, RATE_LIMITS.documentUpload.windowMs)) {
    return NextResponse.json(
      { error: 'Too many uploads. Please try again later.' },
      { status: 429 }
    )
  }

  // 3. PARSE MULTIPART FORM
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid request — expected multipart/form-data.' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
  }

  // 4. VALIDATE FILE SIZE
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: 'File too large. Maximum size is 10 MB.' },
      { status: 400 }
    )
  }

  if (file.size === 0) {
    return NextResponse.json({ error: 'File is empty.' }, { status: 400 })
  }

  // 5. VALIDATE MIME TYPE (reported by browser — we verify with magic bytes below)
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: 'Unsupported file type. Please upload a PDF or image (JPEG, PNG, HEIC).' },
      { status: 400 }
    )
  }

  // 6. VALIDATE MAGIC BYTES (never trust Content-Type alone)
  const magicBytesValid = await validateFileMagicBytes(file)
  if (!magicBytesValid) {
    return NextResponse.json(
      { error: 'File content does not match its type. Please upload a valid PDF or image.' },
      { status: 400 }
    )
  }

  // 7. SANITIZE FILENAME and build storage path
  const sanitizedName = sanitizeFilename(file.name || 'document')
  const timestamp = Date.now()
  const storagePath = `${user.id}/${timestamp}-${sanitizedName}`

  try {
    // 8. UPLOAD TO SUPABASE STORAGE
    const fileBuffer = await file.arrayBuffer()
    const { error: storageError } = await supabase.storage
      .from('user-documents')
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (storageError) {
      console.error(`[DOC_UPLOAD] Storage error for user ${user.id}:`, storageError.message)
      return NextResponse.json(
        { error: 'Failed to save the file. Please try again.' },
        { status: 500 }
      )
    }

    // 9. CREATE DATABASE RECORD
    const { data: doc, error: dbError } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        file_path: storagePath,
        original_filename: sanitizedName,
        file_size_bytes: file.size,
        mime_type: file.type,
        status: 'uploaded',
      })
      .select('id')
      .single()

    if (dbError || !doc) {
      // Clean up orphaned storage file
      await supabase.storage.from('user-documents').remove([storagePath])
      console.error(`[DOC_UPLOAD] DB error for user ${user.id}:`, dbError?.message)
      return NextResponse.json(
        { error: 'Failed to record the upload. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ documentId: doc.id })
  } catch (error) {
    console.error(`[DOC_UPLOAD] Unexpected error for user ${user.id}:`, error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
