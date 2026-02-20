import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Documents' }

export default function DocumentsPage() {
  return (
    <div className="p-6 md:p-8 animate-fade-in">
      <p className="text-section-header mb-6">Vault</p>
      <h1 className="font-display text-4xl text-aura-text mb-2">Documents</h1>
      <p className="text-aura-text-secondary">Document vault — coming in Step 8.</p>
    </div>
  )
}
