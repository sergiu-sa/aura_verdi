import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

export default function DashboardPage() {
  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto animate-fade-in">
      <p className="text-section-header mb-2">Overview</p>
      <h1 className="font-display text-4xl text-aura-text mb-8">Dashboard</h1>

      {/* Placeholder cards — replaced in Step 7 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { label: 'Safe to spend', note: 'Coming in Step 7' },
          { label: 'Financial health', note: 'Coming in Step 7' },
          { label: 'Upcoming bills', note: 'Coming in Step 7' },
          { label: 'Spending chart', note: 'Coming in Step 7' },
        ].map((card) => (
          <div
            key={card.label}
            className="surface p-6 flex flex-col gap-2"
            style={{ animationFillMode: 'both' }}
          >
            <p className="text-section-header">{card.label}</p>
            <p className="text-aura-text-dim text-sm">{card.note}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
