import React from "react";
import { cn } from "./cn";

export function StatCard({ icon, value, label, change, variant = "default" }: { icon: React.ReactNode; value: string; label: string; change?: string; variant?: "default" | "emerald" | "gold" | "rose" | "blue" }) {
  const gradients = { default: "from-slate-500 to-slate-600", emerald: "from-emerald-500 to-emerald-600", gold: "from-amber-500 to-amber-600", rose: "from-rose-500 to-rose-600", blue: "from-blue-500 to-blue-600" };
  return (
    <div className="bg-white dark:bg-zinc-900/90 rounded-3xl border border-slate-100 dark:border-zinc-800 p-4 flex items-start gap-3.5 shadow-[0_2px_16px_rgba(13,27,42,0.05)] dark:shadow-[0_2px_16px_rgba(0,0,0,0.2)]">
      <div className={cn("w-10 h-10 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white shrink-0 shadow-md", gradients[variant])}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{label}</p>
        <p className="text-lg font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">{value}</p>
        {change && <p className={cn("text-[10px] font-bold mt-0.5", change.startsWith("+") ? "text-emerald-500" : change.startsWith("-") ? "text-red-500" : "text-slate-400")}>{change}</p>}
      </div>
    </div>
  );
}
