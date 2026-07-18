"use client";
import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "./cn";

/**
 * Statistics card with label, value, icon, and optional trend indicator.
 *
 * @example
 * ```tsx
 * <StatCard
 *   label="Total Penjualan"
 *   value="Rp 12.500.000"
 *   icon={<DollarSign className="w-5 h-5" />}
 *   trend={{ value: 12.5, isUp: true }}
 * />
 * ```
 */
interface StatCardProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isUp: boolean;
  };
  className?: string;
  color?: string;
}

export function StatCard({ label, value, icon, trend, className, color = "from-[#008CEB] to-[#00C9A7]" }: StatCardProps) {
  return (
    <div className={cn("premium-card p-4 flex items-center gap-3", className)}>
      {icon && (
        <div className={cn("w-11 h-11 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white shadow-md shrink-0", color)}>
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-base font-extrabold text-slate-800 dark:text-slate-200 truncate stat-value">
          {value}
        </p>
      </div>
      {trend && (
        <div className={cn(
          "flex items-center gap-0.5 text-[10px] font-bold",
          trend.isUp ? "text-emerald-500" : "text-rose-500"
        )}>
          {trend.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          <span>{Math.abs(trend.value)}%</span>
        </div>
      )}
    </div>
  );
}
