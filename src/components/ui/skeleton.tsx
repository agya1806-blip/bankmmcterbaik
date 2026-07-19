import React from "react";
import { cn } from "./cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("h-3 rounded-xl bg-slate-200 dark:bg-zinc-800 animate-pulse", className)} />;
}

export function SkeletonCard({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-zinc-900/90 rounded-3xl border border-slate-100 dark:border-zinc-800 p-4 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonLine({ className }: { className?: string }) {
  return <div className={cn("bg-slate-200 dark:bg-zinc-800 rounded animate-pulse", className)} />;
}

export function SkeletonCircle({ size = "w-10 h-10" }: { size?: string }) {
  return <div className={cn("bg-slate-200 dark:bg-zinc-800 rounded-full animate-pulse", size)} />;
}
