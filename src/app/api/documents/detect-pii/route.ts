/**
 * POST /api/documents/detect-pii
 *
 * Privacy Shield — Step 1.
 * Downloads the uploaded document, uses Claude as an OCR engine to extract
 * raw text, then runs regex-based Norwegian PII detection on that text.
 *
 * IMPORTANT: This is a text-extraction-only call to Claude.
 * Claude is instructed to transcribe, not analyze.
 * The extracted text is stored in `extracted_text` but NEVER sent to
 * the analysis Claude call — only the redacted version is.
 *
 * Returns: { extractedText, detections, detectionCount }
 */

import { createClient } from '@/lib/supabase/server'
import { anthropic } from '@/lib/anthropic/client'
import { detectPII } from '@/lib/redaction/pii-detector'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const RequestSchema = z.object({ documentId: z.string().uuid() })

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
    return NextResponse.json({ error: 'Invalid document ID.' }, { status: 400 })
  }

  const { documentId } = parsed.data

  try {
    // 3. FETCH DOCUMENT RECORD (scoped to user)
    const { data: doc } = await supabase
      .from('documents')
      .select('id, file_path, mime_type, status')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (!doc) {
      return NextResponse.json({ error: 'Document not found.' }, { status: 404 })
    }

    // 4. DOWNLOAD FILE FROM SUPABASE STORAGE
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('user-documents')
      .download(doc.file_path)

    if (downloadError || !fileData) {
      console.error(`[DETECT_PII] Download failed for user ${user.id}:`, downloadError?.message)
      return NextResponse.json({ error: 'Failed to retrieve the document.' }, { status: 500 })
    }

    const buffer = Buffer.from(await fileData.arrayBuffer())
    const base64 = buffer.toString('base64')
    const mimeType = doc.mime_type ?? 'application/pdf'

    // 5. EXTRACT TEXT — transcription-only call to Claude (no analysis)
    let extractedText: string

    if (mimeType === 'application/pdf') {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: base64 },
            },
            {
              type: 'text',
              text: 'Extract ALL text from this document exactly as it appears. Preserve line breaks and formatting. Output only the extracted text, nothing else.',
            },
          ],
        }],
      })
      extractedText = response.content[0].type === 'text' ? response.content[0].text : ''
    } else if (mimeType.startsWith('image/')) {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: base64,
              },
            },
            {
              type: 'text',
              text: 'Extract ALL text from this image exactly as it appears. Preserve line breaks and formatting. Output only the extracted text, nothing else.',
            },
          ],
        }],
      })
      extractedText = response.content[0].type === 'text' ? response.content[0].text : ''
    } else {
      // Plain text / CSV fallback
      extractedText = buffer.toString('utf-8')
    }

    // 6. RUN PII DETECTION (regex-based, no AI)
    const detections = detectPII(extractedText)

    // 7. STORE EXTRACTED TEXT + FINDINGS
    await supabase.from('documents').update({
      extracted_text: extractedText,
      pii_detections: detections,
      redaction_status: detections.length > 0 ? 'auto_detected' : 'pending',
      status: 'pii_detected',
    }).eq('id', documentId)

    return NextResponse.json({
      extractedText,
      detections,
      detectionCount: detections.length,
    })
  } catch (error) {
    console.error(`[DETECT_PII] Error for user ${user.id}:`, error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'PII detection failed. Please try again.' }, { status: 500 })
  }
}
