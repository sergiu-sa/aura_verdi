'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

/**
 * UUID generator that works in both SSR (Node.js) and browser contexts.
 */
function generateId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

import { RotateCcw, History } from 'lucide-react'
import { MessageBubble } from './message-bubble'
import { ChatInput } from './chat-input'
import { QuickActions } from './quick-actions'
import { ConversationList } from './conversation-list'
import type { ConversationSummary } from '@/app/(app)/chat/page'

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

interface Props {
  conversations?: ConversationSummary[]
  initialConversationId?: string | null
  initialMessages?: { role: 'user' | 'assistant'; content: string }[] | null
}

/**
 * Main chat interface — handles all state and communication with /api/chat.
 *
 * Architecture:
 * - Supports both new conversations (fresh UUID) and resumed ones (from URL ?c=)
 * - Conversation list panel toggles on the left
 * - User sends message → POST to /api/chat (streaming response)
 * - Both messages saved to Supabase via the API route
 */
export function ChatContainer({ conversations = [], initialConversationId, initialMessages }: Props) {
  const router = useRouter()

  // Build initial messages from server data or start fresh
  const startMessages: Message[] = initialMessages
    ? initialMessages.map((m, i) => ({ id: `loaded-${i}`, role: m.role, content: m.content }))
    : [WELCOME_MESSAGE]

  const [messages, setMessages] = useState<Message[]>(startMessages)
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  // Stable conversation ID for this session
  const conversationIdRef = useRef(initialConversationId ?? generateId())
  const bottomRef = useRef<HTMLDivElement>(null)
  const hasInteracted = initialMessages ? messages.length > 0 : messages.length > 1

  // Auto-scroll to bottom on every new message or streaming update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleNewConversation = useCallback(() => {
    if (isStreaming) return
    setMessages([WELCOME_MESSAGE])
    setInput('')
    conversationIdRef.current = generateId()
    setShowHistory(false)
    // Update URL without the ?c= param
    router.push('/chat')
  }, [isStreaming, router])

  const handleSelectConversation = useCallback((id: string) => {
    if (isStreaming) return
    setShowHistory(false)
    // Navigate to the conversation — server will fetch messages
    router.push(`/chat?c=${id}`)
  }, [isStreaming, router])

  const sendMessage = useCallback(async (content: string) => {
    const text = content.trim()
    if (!text || isStreaming) return

    setInput('')

    const userMsg: Message = { id: generateId(), role: 'user', content: text }
    const assistantMsgId = generateId()
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
        let errMsg = 'Something went wrong. Please try again.'
        try {
          const data = await response.json()
          if (data.error) errMsg = data.error
        } catch { /* ignore */ }

        if (response.status === 429) {
          errMsg = "You're sending messages too quickly. Please wait a moment."
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId ? { ...m, content: errMsg } : m
          )
        )
        return
      }

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        accumulated += decoder.decode(value, { stream: true })

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
    <div className="flex h-full">

      {/* ── Conversation list panel ────────────────────────────────── */}
      {showHistory && (
        <div className="w-64 flex-shrink-0 absolute md:relative z-30 h-full">
          <ConversationList
            conversations={conversations}
            activeId={initialConversationId ?? null}
            onSelect={handleSelectConversation}
            onNewConversation={handleNewConversation}
            onClose={() => setShowHistory(false)}
          />
        </div>
      )}

      {/* ── Main chat area ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* ── Message list ───────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
          <div className="max-w-2xl mx-auto flex flex-col gap-4">
            {/* Chat toolbar */}
            <div className="flex justify-between -mb-2">
              {conversations.length > 0 && (
                <button
                  onClick={() => setShowHistory((v) => !v)}
                  className="flex items-center gap-1.5 text-xs text-[#8888A0] hover:text-[#E8E8EC] transition-colors"
                >
                  <History size={12} />
                  History
                </button>
              )}
              {hasInteracted && (
                <button
                  onClick={handleNewConversation}
                  disabled={isStreaming}
                  className="flex items-center gap-1.5 text-xs text-[#8888A0] hover:text-[#E8E8EC] transition-colors disabled:opacity-50 ml-auto"
                >
                  <RotateCcw size={12} />
                  New conversation
                </button>
              )}
            </div>

            {messages.map((msg, i) => {
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

            <div ref={bottomRef} />
          </div>
        </div>

        {/* ── Bottom input area ───────────────────────────────────────── */}
        <div className="border-t border-aura-border bg-aura-background px-4 md:px-6 py-4">
          <div className="max-w-2xl mx-auto flex flex-col gap-3">
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
    </div>
  )
}
