export default function ForecastLoading() {
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="h-3 w-16 bg-aura-surface rounded mb-2" />
      <div className="h-9 w-40 bg-aura-surface rounded mb-6" />

      {/* Chart skeleton */}
      <div className="bg-aura-surface rounded-xl p-5 animate-pulse mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="h-3 w-28 bg-aura-border rounded" />
          <div className="flex gap-1">
            <div className="h-6 w-16 bg-aura-border rounded" />
            <div className="h-6 w-16 bg-aura-border rounded" />
            <div className="h-6 w-16 bg-aura-border rounded" />
          </div>
        </div>
        <div className="h-[300px] w-full bg-aura-border rounded" />
      </div>

      {/* Event list skeleton */}
      <div className="bg-aura-surface rounded-xl p-5 animate-pulse">
        <div className="h-3 w-32 bg-aura-border rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-4 w-12 bg-aura-border rounded" />
              <div className="h-4 flex-1 bg-aura-border rounded" />
              <div className="h-4 w-20 bg-aura-border rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
