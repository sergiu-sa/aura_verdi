/**
 * Chat message types for Aura's conversation interface.
 */

export type MessageRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  userId: string
  conversationId: string
  role: MessageRole
  content: string
  tokensUsed?: number
  createdAt: string
}

/** Message as used in the Claude API messages array */
export interface ClaudeMessage {
  role: MessageRole
  content: string
}

/** State for the chat UI */
export interface ChatState {
  messages: ChatMessage[]
  isLoading: boolean
  conversationId: string
  error: string | null
}
