export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="h-3 w-16 bg-[#1C1C28] rounded mb-2" />
      <div className="h-9 w-40 bg-[#1C1C28] rounded mb-6" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Safe to Spend skeleton */}
        <div className="sm:col-span-2 bg-[#1C1C28] rounded-xl p-6 md:p-8 animate-pulse">
          <div className="h-3 w-24 bg-[#2C2C3A] rounded mb-3" />
          <div className="h-12 w-48 bg-[#2C2C3A] rounded mb-3" />
          <div className="h-3 w-20 bg-[#2C2C3A] rounded" />
        </div>

        {/* Financial Health skeleton */}
        <div className="bg-[#1C1C28] rounded-xl p-5 animate-pulse">
          <div className="h-3 w-28 bg-[#2C2C3A] rounded mb-3" />
          <div className="h-5 w-20 bg-[#2C2C3A] rounded mb-4" />
          <div className="space-y-2 pt-3 border-t border-[#2C2C3A]">
            <div className="h-3 w-full bg-[#2C2C3A] rounded" />
            <div className="h-3 w-full bg-[#2C2C3A] rounded" />
          </div>
        </div>

        {/* Bill Countdown skeleton */}
        <div className="bg-[#1C1C28] rounded-xl p-5 animate-pulse">
          <div className="h-3 w-32 bg-[#2C2C3A] rounded mb-3" />
          <div className="space-y-3 mt-4">
            <div className="h-10 w-full bg-[#2C2C3A] rounded-lg" />
            <div className="h-10 w-full bg-[#2C2C3A] rounded-lg" />
          </div>
        </div>

        {/* Daily Tip skeleton */}
        <div className="bg-[#1C1C28] rounded-xl p-5 animate-pulse">
          <div className="h-3 w-16 bg-[#2C2C3A] rounded mb-3" />
          <div className="h-4 w-full bg-[#2C2C3A] rounded mb-2" />
          <div className="h-4 w-3/4 bg-[#2C2C3A] rounded" />
        </div>

        {/* Spending Chart skeleton */}
        <div className="bg-[#1C1C28] rounded-xl p-5 animate-pulse">
          <div className="h-3 w-36 bg-[#2C2C3A] rounded mb-3" />
          <div className="h-32 w-full bg-[#2C2C3A] rounded mt-4" />
        </div>
      </div>
    </div>
  )
}
