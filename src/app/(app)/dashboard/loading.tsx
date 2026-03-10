export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="h-3 w-16 bg-aura-surface rounded mb-2" />
      <div className="h-9 w-40 bg-aura-surface rounded mb-6" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Safe to Spend skeleton */}
        <div className="sm:col-span-2 bg-aura-surface rounded-xl p-6 md:p-8 animate-pulse">
          <div className="h-3 w-24 bg-aura-border rounded mb-3" />
          <div className="h-12 w-48 bg-aura-border rounded mb-3" />
          <div className="h-3 w-20 bg-aura-border rounded" />
        </div>

        {/* Financial Health skeleton */}
        <div className="bg-aura-surface rounded-xl p-5 animate-pulse">
          <div className="h-3 w-28 bg-aura-border rounded mb-3" />
          <div className="h-5 w-20 bg-aura-border rounded mb-4" />
          <div className="space-y-2 pt-3 border-t border-aura-border">
            <div className="h-3 w-full bg-aura-border rounded" />
            <div className="h-3 w-full bg-aura-border rounded" />
          </div>
        </div>

        {/* Bill Countdown skeleton */}
        <div className="bg-aura-surface rounded-xl p-5 animate-pulse">
          <div className="h-3 w-32 bg-aura-border rounded mb-3" />
          <div className="space-y-3 mt-4">
            <div className="h-10 w-full bg-aura-border rounded-lg" />
            <div className="h-10 w-full bg-aura-border rounded-lg" />
          </div>
        </div>

        {/* Daily Tip skeleton */}
        <div className="bg-aura-surface rounded-xl p-5 animate-pulse">
          <div className="h-3 w-16 bg-aura-border rounded mb-3" />
          <div className="h-4 w-full bg-aura-border rounded mb-2" />
          <div className="h-4 w-3/4 bg-aura-border rounded" />
        </div>

        {/* Spending Chart skeleton */}
        <div className="bg-aura-surface rounded-xl p-5 animate-pulse">
          <div className="h-3 w-36 bg-aura-border rounded mb-3" />
          <div className="h-32 w-full bg-aura-border rounded mt-4" />
        </div>
      </div>
    </div>
  )
}
