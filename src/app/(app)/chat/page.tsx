import type { Metadata } from 'next'
import { ChatContainer } from '@/components/chat/chat-container'

export const metadata: Metadata = { title: 'Chat with Aura' }

/**
 * Chat page — full-height layout to make the most of the screen.
 * ChatContainer handles all state and streaming logic.
 */
export default function ChatPage() {
  return (
    // h-[calc(100vh-...)] accounts for mobile top bar (56px) + bottom nav (68px)
    // On desktop, it's just full height minus any headers
    <div className="h-[calc(100dvh-56px-68px)] md:h-screen flex flex-col">
      <ChatContainer />
    </div>
  )
}
