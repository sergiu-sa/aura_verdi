'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageBubble } from './message-bubble'
import { ChatInput } from './chat-input'
import { QuickActions } from './quick-actions'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

// Aura's opening message — shown before the user sends anything
const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: "Hei! I'm Aura, your personal financial guardian.\n\nI can help you understand your spending, plan for upcoming bills, navigate legal letters, and answer any financial questions — with full awareness of the Norwegian context.\n\nTo get the most out of me, connect your bank account in Settings. Or just ask me anything right now.",
}

/**
 * Main chat interface — handles all state and communication with /api/chat.
 *
 * Architecture:
 * - Each page load = one conversation (fresh UUID)
 * - User sends message → POST to /api/chat (streaming response)
 * - Streaming text appears character-by-character in the assistant bubble
 * - Both messages saved to Supabase via the API route
 */
export function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)

  // Stable conversation ID for this session
  const conversationIdRef = useRef(crypto.randomUUID())
  // Scroll anchor — always scroll to the bottom after new messages
  const bottomRef = useRef<HTMLDivElement>(null)
  // Track whether there's been any real interaction (to hide quick actions)
  const hasInteracted = messages.length > 1

  // Auto-scroll to bottom on every new message or streaming update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async (content: string) => {
    const text = content.trim()
    if (!text || isStreaming) return

    setInput('')

    // Add user message to UI immediately
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text }
    // Add empty assistant message as placeholder (will be filled by stream)
    const assistantMsgId = crypto.randomUUID()
    const assistantMsg: Message = { id: assistantMsgId, role: 'assistant', content: '' }

    setMessages((prev) => [...prev, userMsg, assistantMsg])
    setIsStreaming(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationId: conversationIdRef.current,
        }),
      })

      if (!response.ok) {
        // Try to parse error from JSON response
        let errMsg = 'Something went wrong. Please try again.'
        try {
          const data = await response.json()
          if (data.error) errMsg = data.error
        } catch { /* ignore */ }

        if (response.status === 429) {
          errMsg = "You're sending messages too quickly. Please wait a moment."
        }

        // Replace the empty assistant placeholder with the error
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId ? { ...m, content: errMsg } : m
          )
        )
        return
      }

      // Read streaming response
      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        accumulated += decoder.decode(value, { stream: true })

        // Update the assistant message in-place as text streams in
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId ? { ...m, content: accumulated } : m
          )
        )
      }
    } catch {
      const errMsg = 'Connection lost. Please check your internet and try again.'
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId ? { ...m, content: errMsg } : m
        )
      )
    } finally {
      setIsStreaming(false)
    }
  }, [isStreaming])

  return (
    <div className="flex flex-col h-full">

      {/* ── Message list ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
        <div className="max-w-2xl mx-auto flex flex-col gap-4">
          {messages.map((msg, i) => {
            // Show typing indicator on the last assistant message while streaming
            const isLastAssistant =
              i === messages.length - 1 && msg.role === 'assistant' && isStreaming

            return (
              <MessageBubble
                key={msg.id}
                role={msg.role}
                content={msg.content}
                isTyping={isLastAssistant && msg.content === ''}
              />
            )
          })}

          {/* Scroll anchor */}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Bottom input area ───────────────────────────────────────── */}
      <div className="border-t border-aura-border bg-aura-background px-4 md:px-6 py-4">
        <div className="max-w-2xl mx-auto flex flex-col gap-3">
          {/* Quick action chips — only shown before first interaction */}
          {!hasInteracted && (
            <QuickActions onSelect={sendMessage} disabled={isStreaming} />
          )}

          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={() => sendMessage(input)}
            disabled={isStreaming}
          />

          <p className="text-center text-[10px] text-aura-text-dim">
            Aura is not a lawyer or licensed financial advisor.
            Always verify important decisions with a qualified professional.
          </p>
        </div>
      </div>

    </div>
  )
}
