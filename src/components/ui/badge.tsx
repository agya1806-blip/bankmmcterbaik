import React from "react";
import { cn } from "./cn";

export function Badge({ variant = "default", className, children }: { variant?: "default" | "success" | "warning" | "danger" | "info"; className?: string; children: React.ReactNode }) {
  const styles = {
    default: "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400",
    success: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400",
    warning: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400",
    danger: "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400",
    info: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400",
  };
  return <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[9px] font-bold uppercase tracking-wider", styles[variant], className)}>{children}</span>;
}
