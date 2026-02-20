import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Legal Help' }

export default function LegalPage() {
  return (
    <div className="p-6 md:p-8 animate-fade-in">
      <p className="text-section-header mb-6">Rights & Defense</p>
      <h1 className="font-display text-4xl text-aura-text mb-2">Legal Help</h1>
      <p className="text-aura-text-secondary">Legal center — coming in Step 3 (Phase 3).</p>
    </div>
  )
}
