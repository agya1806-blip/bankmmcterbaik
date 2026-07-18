"use client";
import React from "react";
import { Search, X } from "lucide-react";
import { cn } from "./cn";

/**
 * Search input with built-in search icon and clear button.
 *
 * @example
 * ```tsx
 * <SearchInput
 *   value={search}
 *   onChange={setSearch}
 *   placeholder="Cari produk..."
 * />
 * ```
 */
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
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full input-premium pl-9 pr-8"
        aria-label={placeholder}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          aria-label="Hapus pencarian"
        >
          <X className="w-3.5 h-3.5 text-slate-400" />
        </button>
      )}
    </div>
  );
}
