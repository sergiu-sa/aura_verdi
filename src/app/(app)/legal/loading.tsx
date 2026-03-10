export default function LegalLoading() {
  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="h-3 w-20 bg-aura-surface rounded mb-2" />
      <div className="h-9 w-48 bg-aura-surface rounded mb-6" />

      {/* Legal cards skeleton */}
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-aura-surface rounded-xl p-5 animate-pulse">
            <div className="h-4 w-40 bg-aura-border rounded mb-2" />
            <div className="h-3 w-60 bg-aura-border rounded mb-3" />
            <div className="h-3 w-full bg-aura-border rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
