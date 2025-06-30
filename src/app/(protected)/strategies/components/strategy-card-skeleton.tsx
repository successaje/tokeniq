import { Skeleton } from "@/components/ui/skeleton"

export function StrategyCardSkeleton() {
  return (
    <div className="w-full max-w-md overflow-hidden rounded-xl border border-gray-200 bg-white/90 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-6 w-20" />
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="mt-6 flex space-x-3">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  )
}
