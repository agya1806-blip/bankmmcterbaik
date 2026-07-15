export function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/60 dark:bg-[#131527]/60 ${className || ""}`} />;
}

export function CardSkeleton() {
  return (
    <div className="bg-white/90 backdrop-blur-md border border-slate-200/60 dark:bg-[#131527]/90 dark:border-slate-800/60 rounded-2xl p-5 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <div className="flex gap-4 p-3">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
  );
}

export function KasirSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="space-y-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <div className="space-y-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}
