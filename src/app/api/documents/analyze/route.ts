/**
 * POST /api/documents/analyze
 *
 * Privacy Shield — Step 3 
 * Sends ONLY the redacted document text to Claude for analysis.
 * Never receives the raw file — only the pre-redacted text string.
 *
 * CRITICAL SECURITY RULE:
 *   This route rejects documents where redaction_status is not
 *   'user_confirmed' or 'skipped'. No raw PII ever reaches Claude analysis.
 *
 * Flow:
 *   1. Fetch document (must be user_confirmed or skipped)
 *   2. Use redacted_text (or extracted_text if skipped)
 *   3. Send text to Claude with document-analysis prompt
 *   4. Store Claude's raw output as ai_summary_redacted (audit trail)
 *   5. Un-redact Claude's output using the redaction_map
 *   6. Store un-redacted version as ai_summary (shown to user)
 *
 * Accepts: { documentId: string }
 * Returns: { analysis }
 */

import { createClient } from '@/lib/supabase/server'
import { anthropic } from '@/lib/anthropic/client'
import { unRedact } from '@/lib/redaction/un-redact'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { checkRateLimit, RATE_LIMITS } from '@/lib/utils/rate-limiter'
import {
  DOCUMENT_ANALYSIS_SYSTEM_PROMPT,
  DOCUMENT_ANALYSIS_USER_PROMPT,
} from '@/lib/anthropic/prompts/document-analysis'

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

  // 2. RATE LIMIT
  if (!checkRateLimit(`analyze:${user.id}`, RATE_LIMITS.documentAnalyze.max, RATE_LIMITS.documentAnalyze.windowMs)) {
    return NextResponse.json(
      { error: 'Too many analysis requests. Please try again later.' },
      { status: 429 }
    )
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
    // 4. FETCH DOCUMENT RECORD (must belong to this user)
    const { data: doc } = await supabase
      .from('documents')
      .select('id, redacted_text, extracted_text, redaction_map, redaction_status, status')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (!doc) {
      return NextResponse.json({ error: 'Document not found.' }, { status: 404 })
    }

    // 5. ENFORCE PRIVACY SHIELD — reject if redaction step was not completed
    if (!['user_confirmed', 'skipped'].includes(doc.redaction_status ?? '')) {
      return NextResponse.json(
        { error: 'Document must pass through Privacy Shield review before analysis.' },
        { status: 400 }
      )
    }

    if (doc.status === 'analyzing') {
      return NextResponse.json({ error: 'Analysis already in progress.' }, { status: 409 })
    }
    if (doc.status === 'analyzed') {
      return NextResponse.json({ error: 'Document already analyzed.' }, { status: 409 })
    }

    // 6. SELECT TEXT TO SEND — redacted version, or extracted if user skipped redaction
    const textForClaude = doc.redacted_text ?? doc.extracted_text

    if (!textForClaude) {
      return NextResponse.json({ error: 'No document text available for analysis.' }, { status: 400 })
    }

    // 7. SET STATUS TO 'analyzing'
    await supabase.from('documents').update({ status: 'analyzing' }).eq('id', documentId)

    // 8. CALL CLAUDE — text only, no file
    const claudeResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: DOCUMENT_ANALYSIS_SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `${DOCUMENT_ANALYSIS_USER_PROMPT}\n\n---\nDOCUMENT CONTENT (redacted for privacy):\n${textForClaude}`,
      }],
    })

    const rawText = claudeResponse.content[0].type === 'text' ? claudeResponse.content[0].text : ''

    // 9. PARSE CLAUDE'S JSON RESPONSE
    let analysis: Record<string, unknown>
    try {
      const cleaned = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim()
      analysis = JSON.parse(cleaned) as Record<string, unknown>
    } catch {
      console.error(`[DOC_ANALYZE] Claude returned non-JSON for user ${user.id}`)
      await supabase.from('documents').update({ status: 'error' }).eq('id', documentId)
      return NextResponse.json({ error: 'Analysis failed. Please try again.' }, { status: 500 })
    }

    // 10. UN-REDACT THE ANALYSIS for user display
    const redactionMap = (doc.redaction_map as Record<string, string>) ?? {}
    const summaryForUser = unRedact(rawText, redactionMap)

    // Parse the un-redacted version for structured fields
    let analysisForUser: Record<string, unknown>
    try {
      const cleaned = summaryForUser.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim()
      analysisForUser = JSON.parse(cleaned) as Record<string, unknown>
    } catch {
      // If un-redacted JSON is malformed, fall back to the redacted analysis
      analysisForUser = analysis
    }

    // 11. STORE BOTH VERSIONS
    await supabase.from('documents').update({
      document_type: analysis.document_type as string,
      ai_summary: (analysisForUser.summary ?? analysis.summary) as string,
      ai_summary_redacted: rawText,  // raw Claude output (audit trail)
      ai_flags: {
        concerns: analysisForUser.concerns ?? analysis.concerns,
        deadlines: analysisForUser.deadlines ?? analysis.deadlines,
        urgency: analysis.urgency,    // urgency stays as-is (not PII)
        recommended_action: analysisForUser.recommended_action ?? analysis.recommended_action,
      },
      ai_analyzed_at: new Date().toISOString(),
      status: 'analyzed',
    }).eq('id', documentId)

    return NextResponse.json({ analysis: analysisForUser })
  } catch (error) {
    try {
      await supabase.from('documents').update({ status: 'error' }).eq('id', documentId)
    } catch { /* best-effort */ }
    console.error(`[DOC_ANALYZE] Unexpected error for user ${user.id}:`, error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json(
      { error: 'An unexpected error occurred during analysis. Please try again.' },
      { status: 500 }
    )
  }
}
