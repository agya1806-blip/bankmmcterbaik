"use client";
import React from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "./cn";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, onBack, action, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-center gap-3 mb-4", className)}>
      {onBack && (
        <button type="button" onClick={onBack} className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors" aria-label="Kembali">
          <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200 truncate">{title}</h1>
        {subtitle && <p className="text-[11px] text-slate-400 truncate">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
