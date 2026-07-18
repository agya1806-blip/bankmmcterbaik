"use client";

import React from "react";
import { cn } from "@/components/ui/cn";
import { Search } from "lucide-react";

interface SearchBarProps {
  className?: string;
  placeholder?: string;
}

export function SearchBar({ className, placeholder = "Cari..." }: SearchBarProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input
        type="text"
        placeholder={placeholder}
        className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 placeholder:text-slate-400 border-none outline-none focus:ring-2 focus:ring-[#008CEB]/30 transition-all"
      />
    </div>
  );
}
