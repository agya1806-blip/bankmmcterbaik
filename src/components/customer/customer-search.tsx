"use client";
import React from "react";
import { Search } from "lucide-react";

interface CustomerSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function CustomerSearch({ value, onChange }: CustomerSearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input
        type="text"
        placeholder="Cari nama atau nomor HP..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-9 pr-4 h-10 text-xs bg-slate-100 dark:bg-zinc-900 rounded-xl border-none outline-none focus:ring-1 focus:ring-[#008CEB] transition-all"
      />
    </div>
  );
}