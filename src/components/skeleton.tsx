"use client";
import React from "react";

export function SkeletonCard({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="premium-card p-4 animate-pulse">
          <div className="h-4 bg-slate-200 dark:bg-zinc-700 rounded w-3/4 mb-2" />
          <div className="h-3 bg-slate-200 dark:bg-zinc-700 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`h-3 bg-slate-200 dark:bg-zinc-700 rounded animate-pulse ${className}`} />;
}

export function SkeletonCircle({ size = "w-10 h-10" }: { size?: string }) {
  return <div className={`${size} bg-slate-200 dark:bg-zinc-700 rounded-full animate-pulse`} />;
}
