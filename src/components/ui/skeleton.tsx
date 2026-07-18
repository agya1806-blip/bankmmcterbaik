"use client";
import React from "react";
import { cn } from "./cn";

/**
 * Skeleton loading placeholders for content that hasn't loaded yet.
 *
 * @example
 * ```tsx
 * <Skeleton className="h-4 w-3/4" />
 * <Skeleton variant="card" count={3} />
 * <Skeleton variant="circle" size="w-12 h-12" />
 * ```
 */
interface SkeletonProps {
  variant?: "text" | "card" | "circle" | "avatar";
  count?: number;
  size?: string;
  className?: string;
}

export function Skeleton({ variant = "text", count = 1, size, className }: SkeletonProps) {
  if (variant === "circle") {
    return <div className={cn("skeleton rounded-full", size || "w-10 h-10", className)} />;
  }

  if (variant === "avatar") {
    return (
      <div className="flex items-center gap-3">
        <div className={cn("skeleton rounded-full w-10 h-10", className)} />
        <div className="flex flex-col gap-2 flex-1">
          <div className="skeleton h-3 w-1/2" />
          <div className="skeleton h-2 w-1/4" />
        </div>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={cn("premium-card p-4 space-y-2", className)}>
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn("skeleton h-3", className)} />
      ))}
    </>
  );
}
