import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Legal Help' }

export default function LegalPage() {
  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto animate-fade-in">
      <p className="text-section-header mb-2">Rights & Defense</p>
      <h1 className="font-display text-4xl text-aura-text mb-4">Legal Help</h1>
      <p className="text-aura-text-secondary text-sm leading-relaxed max-w-md">
        Understand your rights under Norwegian law, respond to collection letters,
        and access template letters. Coming in Phase 3.
      </p>
    </div>
  )
}
