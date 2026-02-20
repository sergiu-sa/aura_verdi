import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Settings' }

export default function SettingsPage() {
  return (
    <div className="p-6 md:p-8 animate-fade-in">
      <p className="text-section-header mb-6">Preferences</p>
      <h1 className="font-display text-4xl text-aura-text mb-2">Settings</h1>
      <p className="text-aura-text-secondary">Settings & partner linking — coming in Step 9.</p>
    </div>
  )
}
