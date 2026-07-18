"use client";
import React from "react";
import { cn } from "./cn";

/**
 * Horizontal divider with optional label.
 *
 * @example
 * ```tsx
 * <Divider />
 * <Divider label="Atau" />
 * ```
 */
interface DividerProps {
  label?: string;
  className?: string;
}

export function Divider({ label, className }: DividerProps) {
  if (!label) {
    return <hr className={cn("border-t border-slate-200 dark:border-slate-800", className)} />;
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex-1 border-t border-slate-200 dark:border-slate-800" />
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
        {label}
      </span>
      <div className="flex-1 border-t border-slate-200 dark:border-slate-800" />
    </div>
  );
}
