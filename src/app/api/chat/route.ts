import { createClient } from '@/lib/supabase/server'
import { anthropic } from '@/lib/anthropic/client'
import { AURA_SYSTEM_PROMPT } from '@/lib/anthropic/prompts/system-prompt'
import { buildFinancialContext } from '@/lib/anthropic/context-builder'
import { checkRateLimit, RATE_LIMITS } from '@/lib/utils/rate-limiter'
import { sanitizeInput } from '@/lib/utils/sanitize'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// ── Input validation ───────────────────────────────────────────────────────
const ChatRequestSchema = z.object({
  message: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(10_000, 'Message is too long')
    .transform((s) => s.trim()),
  conversationId: z.string().uuid('Invalid conversation ID'),
})

// ── POST /api/chat ─────────────────────────────────────────────────────────
export async function POST(request: Request) {
  // 1. AUTHENTICATE — always first
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. RATE LIMIT — before doing any expensive work
  const { chat: limit } = RATE_LIMITS
  if (!checkRateLimit(`chat:${user.id}`, limit.max, limit.windowMs)) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment before sending another message.' },
      { status: 429 }
    )
  }

  // 3. VALIDATE INPUT
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = ChatRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { message, conversationId } = parsed.data
  const sanitizedMessage = sanitizeInput(message)

  try {
    // 4. BUILD FINANCIAL CONTEXT — summarized, no raw PII
    const financialContext = await buildFinancialContext(supabase, user.id)

    // 5. FETCH CONVERSATION HISTORY — last 20 messages for context window
    const { data: history } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('user_id', user.id)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(20)

    // 6. SAVE USER MESSAGE immediately (before streaming)
    await supabase.from('chat_messages').insert({
      user_id: user.id,
      conversation_id: conversationId,
      role: 'user',
      content: sanitizedMessage,
    })

    // 7. BUILD CLAUDE MESSAGES ARRAY
    const claudeMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      ...(history ?? []).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: sanitizedMessage },
    ]

    // 8. STREAM from Claude API
    // System = Aura personality + live financial context (no PII)
    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 1500,
      system: `${AURA_SYSTEM_PROMPT}\n\n${financialContext}`,
      messages: claudeMessages,
    })

    // 9. PIPE stream to client, save to DB when complete
    const encoder = new TextEncoder()
    let fullResponse = ''

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              const text = chunk.delta.text
              fullResponse += text
              controller.enqueue(encoder.encode(text))
            }
          }
          controller.close()
        } catch (err) {
          controller.error(err)
          return
        }

        // 10. SAVE ASSISTANT MESSAGE with token count for cost monitoring
        try {
          const finalMessage = await stream.finalMessage()
          const tokensUsed =
            finalMessage.usage.input_tokens + finalMessage.usage.output_tokens

          await supabase.from('chat_messages').insert({
            user_id: user.id,
            conversation_id: conversationId,
            role: 'assistant',
            content: fullResponse,
            tokens_used: tokensUsed,
          })
        } catch (saveErr) {
          // Log server-side only — non-fatal, the message was still streamed to user
          console.error(`[CHAT] Failed to save assistant message for user ${user.id}:`, saveErr)
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        // Let the client know the conversation ID (useful if client generated it)
        'X-Conversation-Id': conversationId,
      },
    })
  } catch (error) {
    // Never expose stack traces or error details to the client
    console.error(`[CHAT] Error for user ${user.id}:`, error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json(
      { error: 'Aura is unavailable right now. Please try again in a moment.' },
      { status: 500 }
    )
  }
}
