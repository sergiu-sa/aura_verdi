export default function DocumentsLoading() {
  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="h-3 w-24 bg-aura-surface rounded mb-2" />
      <div className="h-9 w-44 bg-aura-surface rounded mb-6" />

      {/* Document cards skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-aura-surface rounded-xl p-5 animate-pulse">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-4 w-48 bg-aura-border rounded" />
                <div className="h-3 w-24 bg-aura-border rounded" />
              </div>
              <div className="h-6 w-16 bg-aura-border rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
