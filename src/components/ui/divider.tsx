import React from "react";
import { cn } from "./cn";

export function Divider({ label, className }: { label?: string; className?: string }) {
  if (!label) {
    return <hr className={cn("border-t border-slate-200 dark:border-zinc-800", className)} />;
  }
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex-1 border-t border-slate-200 dark:border-zinc-800" />
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">{label}</span>
      <div className="flex-1 border-t border-slate-200 dark:border-zinc-800" />
    </div>
  );
}
