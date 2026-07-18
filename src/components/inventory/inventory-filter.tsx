"use client";

import React from "react";

export type StockFilter = "all" | "normal" | "low" | "out";

interface InventoryFilterProps {
  active: StockFilter;
  onChange: (f: StockFilter) => void;
  counts: { all: number; normal: number; low: number; out: number };
}

export function InventoryFilter({ active, onChange, counts }: InventoryFilterProps) {
  const filters: { key: StockFilter; label: string }[] = [
    { key: "all", label: `Semua (${counts.all})` },
    { key: "normal", label: `Normal (${counts.normal})` },
    { key: "low", label: `Menipis (${counts.low})` },
    { key: "out", label: `Habis (${counts.out})` },
  ];

  return (
    <div className="flex gap-1 overflow-x-auto -mx-1 px-1 pb-1 scrollbar-hide">
      {filters.map((f) => (
        <button
          key={f.key}
          onClick={() => onChange(f.key)}
          className={`px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all ${
            active === f.key
              ? "bg-gradient-to-r from-[#008CEB] to-[#00C9A7] text-white shadow-md"
              : "bg-white dark:bg-[#131527] text-slate-400 border border-slate-100 dark:border-slate-800"
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
