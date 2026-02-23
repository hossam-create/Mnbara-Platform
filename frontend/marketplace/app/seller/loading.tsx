import { Skeleton } from '@/components/ui/skeleton';

export default function SellerDashboardLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-6 border rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
              <Skeleton className="h-10 w-16 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Listings */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-8 w-20" />
            </div>

            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 border rounded-lg">
                  <div className="flex gap-4">
                    <Skeleton className="w-20 h-20 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <div className="flex items-center gap-4 mt-2">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-5 w-12" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sales Analytics */}
          <div className="space-y-6">
            <Skeleton className="h-6 w-28" />

            {/* Chart Placeholder */}
            <div className="p-6 border rounded-lg">
              <Skeleton className="h-48 w-full" />
            </div>

            {/* Recent Sales */}
            <div className="space-y-4">
              <Skeleton className="h-6 w-24" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-3 border rounded flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <Skeleton className="h-6 w-28 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 border rounded-lg text-center">
                <Skeleton className="w-12 h-12 rounded mx-auto mb-3" />
                <Skeleton className="h-4 w-20 mx-auto mb-2" />
                <Skeleton className="h-3 w-24 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
