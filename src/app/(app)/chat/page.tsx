import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Chat with Aura' }

export default function ChatPage() {
  return (
    <div className="p-6 md:p-8 animate-fade-in">
      <p className="text-section-header mb-6">Assistant</p>
      <h1 className="font-display text-4xl text-aura-text mb-2">Chat with Aura</h1>
      <p className="text-aura-text-secondary">Chat interface — coming in Step 5.</p>
    </div>
  )
}
