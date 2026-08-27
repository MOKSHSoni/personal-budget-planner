export function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-slate-200/80 dark:bg-slate-800/70 ${className}`}
    />
  );
}

export function MetricSkeleton() {
  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-8 w-36" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="card-hero bg-slate-100 dark:bg-slate-800/50">
      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-3 md:col-span-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-12 w-56" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function ChartSkeleton({ height = "h-72" }) {
  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className={`w-full ${height} rounded-xl`} />
    </div>
  );
}

export function TransactionRowSkeleton() {
  return (
    <div className="flex items-center justify-between py-3.5">
      <div className="flex items-center gap-3.5">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="space-y-2 text-right">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="card space-y-3">
      <div className="flex justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex justify-between py-2.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

export default Skeleton;

