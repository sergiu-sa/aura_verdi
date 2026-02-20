import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Settings' }

export default function SettingsPage() {
  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto animate-fade-in">
      <p className="text-section-header mb-2">Preferences</p>
      <h1 className="font-display text-4xl text-aura-text mb-4">Settings</h1>
      <p className="text-aura-text-secondary text-sm leading-relaxed max-w-md">
        Notification preferences, partner linking, data export, and account management.
        Coming in Step 9.
      </p>
    </div>
  )
}
