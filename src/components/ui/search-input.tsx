"use client";
import React from "react";
import { Search, X } from "lucide-react";
import { cn } from "./cn";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export function SearchInput({ value, onChange, placeholder = "Cari...", className, autoFocus }: SearchInputProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full h-10 pl-10 pr-9 rounded-2xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-200"
        aria-label={placeholder}
      />
      {value && (
        <button type="button" onClick={() => onChange("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors" aria-label="Hapus pencarian">
          <X className="w-3.5 h-3.5 text-slate-400" />
        </button>
      )}
    </div>
  );
}
