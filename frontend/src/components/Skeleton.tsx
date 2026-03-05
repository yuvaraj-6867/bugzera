export const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
)

export const SkeletonCard = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-3 w-1/2" />
    <div className="flex gap-2">
      <Skeleton className="h-5 w-16 rounded-full" />
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
  </div>
)

export const SkeletonTable = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-2">
    <div className="flex gap-4 px-4 py-2">
      {[40, 20, 20, 20].map((w, i) => (
        <Skeleton key={i} className={`h-3 w-${w}`} />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4 px-4 py-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
      </div>
    ))}
  </div>
)

export const SkeletonList = ({ count = 4 }: { count?: number }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
  </div>
)
