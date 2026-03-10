export default function AccountsLoading() {
  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="h-3 w-16 bg-aura-border rounded animate-pulse mb-2" />
      <div className="h-10 w-40 bg-aura-border rounded animate-pulse mb-2" />
      <div className="h-4 w-48 bg-aura-border rounded animate-pulse mb-6" />

      {/* Total balance skeleton */}
      <div className="surface p-5 rounded-xl mb-4">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 bg-aura-border rounded animate-pulse" />
          <div className="h-7 w-32 bg-aura-border rounded animate-pulse" />
        </div>
      </div>

      {/* Account card skeletons */}
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="surface p-4 rounded-xl flex items-center justify-between">
            <div>
              <div className="h-4 w-40 bg-aura-border rounded animate-pulse" />
              <div className="h-3 w-24 bg-aura-border rounded animate-pulse mt-1.5" />
            </div>
            <div className="h-6 w-28 bg-aura-border rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
