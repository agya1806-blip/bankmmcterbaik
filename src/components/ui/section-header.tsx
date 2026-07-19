"use client";
import React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "./cn";

interface SectionHeaderProps {
  title: string;
  onSeeAll?: () => void;
  seeAllLabel?: string;
  className?: string;
}

export function SectionHeader({ title, onSeeAll, seeAllLabel = "Lihat Semua", className }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300">{title}</h2>
      {onSeeAll && (
        <button type="button" onClick={onSeeAll} className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:opacity-80 transition-opacity">
          {seeAllLabel}
          <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
