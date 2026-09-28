export default function DashboardLoading() {
  return (
    <div className="w-full h-full min-h-screen p-6 animate-pulse bg-slate-950">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div className="h-10 bg-slate-800/50 rounded-lg w-1/3"></div>
        <div className="h-10 bg-slate-800/50 rounded-full w-10"></div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
            <div className="h-4 bg-slate-800/50 rounded w-1/2 mb-4"></div>
            <div className="h-10 bg-slate-800/50 rounded w-3/4"></div>
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-96 bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
          <div className="h-6 bg-slate-800/50 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-800/30 rounded w-full"></div>
            ))}
          </div>
        </div>
        <div className="h-96 bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
          <div className="h-6 bg-slate-800/50 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-12 h-12 bg-slate-800/50 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-800/50 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-800/30 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
