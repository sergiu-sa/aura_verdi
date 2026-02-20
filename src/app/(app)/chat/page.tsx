import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Chat with Aura' }

export default function ChatPage() {
  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto animate-fade-in">
      <p className="text-section-header mb-2">Assistant</p>
      <h1 className="font-display text-4xl text-aura-text mb-4">Chat with Aura</h1>
      <p className="text-aura-text-secondary text-sm leading-relaxed max-w-md">
        The AI chat interface — where you ask questions, get financial guidance, and talk through
        money decisions with Aura — is being built in Step 5.
      </p>
    </div>
  )
}
