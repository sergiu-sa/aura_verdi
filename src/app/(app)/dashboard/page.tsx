import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

/**
 * Dashboard — financial overview home.
 * Placeholder until Step 7. Shows the page exists and routes work.
 */
export default function DashboardPage() {
  return (
    <div className="p-6 md:p-8 animate-fade-in">
      <p className="text-section-header mb-6">Overview</p>
      <h1 className="font-display text-4xl text-aura-text mb-2">Good evening</h1>
      <p className="text-aura-text-secondary">
        Dashboard — financial health cards coming in Step 7.
      </p>
    </div>
  )
}
