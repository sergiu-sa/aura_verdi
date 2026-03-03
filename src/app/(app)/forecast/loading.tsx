export default function ForecastLoading() {
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="h-3 w-16 bg-[#1C1C28] rounded mb-2" />
      <div className="h-9 w-40 bg-[#1C1C28] rounded mb-6" />

      {/* Chart skeleton */}
      <div className="bg-[#1C1C28] rounded-xl p-5 animate-pulse mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="h-3 w-28 bg-[#2C2C3A] rounded" />
          <div className="flex gap-1">
            <div className="h-6 w-16 bg-[#2C2C3A] rounded" />
            <div className="h-6 w-16 bg-[#2C2C3A] rounded" />
            <div className="h-6 w-16 bg-[#2C2C3A] rounded" />
          </div>
        </div>
        <div className="h-[300px] w-full bg-[#2C2C3A] rounded" />
      </div>

      {/* Event list skeleton */}
      <div className="bg-[#1C1C28] rounded-xl p-5 animate-pulse">
        <div className="h-3 w-32 bg-[#2C2C3A] rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-4 w-12 bg-[#2C2C3A] rounded" />
              <div className="h-4 flex-1 bg-[#2C2C3A] rounded" />
              <div className="h-4 w-20 bg-[#2C2C3A] rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
