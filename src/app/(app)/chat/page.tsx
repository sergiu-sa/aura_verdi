import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChatContainer } from '@/components/chat/chat-container'

export const metadata: Metadata = { title: 'Chat with Aura' }

export interface ConversationSummary {
  id: string
  preview: string
  lastMessageAt: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

/**
 * Chat page — fetches conversation history server-side, then hands off to ChatContainer.
 * Supports ?c=<conversationId> to resume a specific conversation.
 */
export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const activeConversationId = params.c ?? null

  // Fetch conversation list — group messages by conversation_id
  const { data: rawConversations } = await supabase
    .from('chat_messages')
    .select('conversation_id, content, role, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  // Build conversation summaries
  const convMap = new Map<string, { preview: string; lastMessageAt: string }>()
  for (const msg of rawConversations ?? []) {
    const existing = convMap.get(msg.conversation_id)
    if (!existing) {
      // First message in this conversation — use as preview if it's from user
      convMap.set(msg.conversation_id, {
        preview: msg.role === 'user' ? (msg.content?.slice(0, 80) ?? 'New conversation') : 'New conversation',
        lastMessageAt: msg.created_at,
      })
    } else {
      // Update last message time
      existing.lastMessageAt = msg.created_at
      // If we haven't found a user message preview yet, check this one
      if (existing.preview === 'New conversation' && msg.role === 'user') {
        existing.preview = msg.content?.slice(0, 80) ?? 'New conversation'
      }
    }
  }

  const conversations: ConversationSummary[] = [...convMap.entries()]
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())

  // If resuming a specific conversation, load its messages
  let initialMessages: ChatMessage[] | null = null
  if (activeConversationId) {
    const { data: msgs } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('user_id', user.id)
      .eq('conversation_id', activeConversationId)
      .order('created_at', { ascending: true })

    if (msgs && msgs.length > 0) {
      initialMessages = msgs.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))
    }
  }

  return (
    <div className="h-[calc(100dvh-56px-68px)] md:h-screen flex flex-col">
      <ChatContainer
        conversations={conversations}
        initialConversationId={activeConversationId}
        initialMessages={initialMessages}
      />
    </div>
  )
}
