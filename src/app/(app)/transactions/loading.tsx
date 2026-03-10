export default function TransactionsLoading() {
  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      {/* Header skeleton */}
      <div className="h-3 w-16 bg-aura-border rounded animate-pulse mb-2" />
      <div className="h-10 w-48 bg-aura-border rounded animate-pulse mb-2" />
      <div className="h-4 w-64 bg-aura-border rounded animate-pulse mb-6" />

      {/* Filter bar skeleton */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 h-10 bg-aura-surface border border-aura-border rounded-lg animate-pulse" />
        <div className="w-40 h-10 bg-aura-surface border border-aura-border rounded-lg animate-pulse" />
      </div>

      {/* Row skeletons */}
      <div className="space-y-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5">
            <div className="w-7 h-7 bg-aura-border rounded animate-pulse" />
            <div className="flex-1">
              <div className="h-4 w-48 bg-aura-border rounded animate-pulse" />
              <div className="h-3 w-24 bg-aura-border rounded animate-pulse mt-1" />
            </div>
            <div className="h-4 w-20 bg-aura-border rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
