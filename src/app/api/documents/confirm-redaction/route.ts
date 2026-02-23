/**
 * POST /api/documents/confirm-redaction
 *
 * Privacy Shield — Step 2.
 * The user has reviewed the PII detections in the UI and submitted their
 * confirmed/rejected selections. This route applies the confirmed redactions,
 * stores the redacted text and the mask→original mapping in the database.
 *
 * Also handles the "skip" case: if the user chooses to skip redaction,
 * redaction_status is set to 'skipped' and the raw extracted text will
 * be used for analysis (with a warning in the UI).
 *
 * Accepts: { documentId, detections: PIIDetection[], skip?: boolean }
 * Returns: { redactedText, redactionCount }
 */

import { createClient } from '@/lib/supabase/server'
import { applyRedactions } from '@/lib/redaction/pseudonymizer'
import type { PIIDetection } from '@/lib/redaction/pii-detector'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const DetectionSchema = z.object({
  type: z.string(),
  start: z.number(),
  end: z.number(),
  original: z.string(),
  suggestedMask: z.string(),
  confirmed: z.boolean(),
})

const RequestSchema = z.object({
  documentId: z.string().uuid(),
  detections: z.array(DetectionSchema),
  /** If true, skip redaction entirely and proceed with extracted text */
  skip: z.boolean().optional().default(false),
})

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
    return NextResponse.json({ error: 'Invalid input.' }, { status: 400 })
  }

  const { documentId, detections, skip } = parsed.data

  try {
    // 3. FETCH DOCUMENT (scoped to user, must have extracted text)
    const { data: doc } = await supabase
      .from('documents')
      .select('id, extracted_text, status')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (!doc) {
      return NextResponse.json({ error: 'Document not found.' }, { status: 404 })
    }

    if (!doc.extracted_text) {
      return NextResponse.json(
        { error: 'Document text not found. Please run PII detection first.' },
        { status: 400 }
      )
    }

    if (skip) {
      // User chose to skip redaction — mark status and proceed with raw text
      await supabase.from('documents').update({
        pii_detections: detections,
        redaction_status: 'skipped',
        status: 'redaction_confirmed',
      }).eq('id', documentId)

      return NextResponse.json({
        redactedText: doc.extracted_text,
        redactionCount: 0,
        skipped: true,
      })
    }

    // 4. APPLY CONFIRMED REDACTIONS (cast type: string → PIIType from Zod validation)
    const { redactedText, redactionMap } = applyRedactions(doc.extracted_text, detections as PIIDetection[])

    // 5. STORE REDACTED VERSION + MAPPING
    await supabase.from('documents').update({
      redacted_text: redactedText,
      redaction_map: redactionMap,
      pii_detections: detections,
      redaction_status: 'user_confirmed',
      status: 'redaction_confirmed',
    }).eq('id', documentId)

    return NextResponse.json({
      redactedText,
      redactionCount: detections.filter((d) => d.confirmed).length,
    })
  } catch (error) {
    console.error(`[CONFIRM_REDACTION] Error for user ${user.id}:`, error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Failed to apply redactions. Please try again.' }, { status: 500 })
  }
}
