export default function SettingsLoading() {
  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="h-3 w-20 bg-aura-surface rounded mb-2" />
      <div className="h-9 w-32 bg-aura-surface rounded mb-8" />

      {/* Profile section skeleton */}
      <div className="mb-10">
        <div className="h-3 w-16 bg-aura-surface rounded mb-1" />
        <div className="h-7 w-20 bg-aura-surface rounded mb-4" />
        <div className="bg-aura-surface rounded-xl p-5 animate-pulse">
          <div className="space-y-4">
            <div className="h-10 w-full bg-aura-border rounded" />
            <div className="h-10 w-full bg-aura-border rounded" />
          </div>
        </div>
      </div>

      {/* Bank section skeleton */}
      <div className="mb-10">
        <div className="h-3 w-28 bg-aura-surface rounded mb-1" />
        <div className="h-7 w-40 bg-aura-surface rounded mb-4" />
        <div className="bg-aura-surface rounded-xl p-5 animate-pulse">
          <div className="h-16 w-full bg-aura-border rounded" />
        </div>
      </div>

      {/* Partner section skeleton */}
      <div className="mb-10">
        <div className="h-3 w-16 bg-aura-surface rounded mb-1" />
        <div className="h-7 w-36 bg-aura-surface rounded mb-4" />
        <div className="bg-aura-surface rounded-xl p-5 animate-pulse">
          <div className="h-16 w-full bg-aura-border rounded" />
        </div>
      </div>
    </div>
  )
}
