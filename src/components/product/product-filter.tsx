"use client";
import React from "react";

export type StockFilter = "all" | "active" | "inactive" | "low" | "out";

interface ProductFilterProps {
  stockFilter: StockFilter;
  onStockFilterChange: (filter: StockFilter) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
}

export function ProductFilter({
  stockFilter,
  onStockFilterChange,
  selectedCategory,
  onCategoryChange,
  categories,
}: ProductFilterProps) {
  const stockOptions: { value: StockFilter; label: string }[] = [
    { value: "all", label: "Semua" },
    { value: "active", label: "Aktif" },
    { value: "inactive", label: "Nonaktif" },
    { value: "low", label: "Stok Tipis" },
    { value: "out", label: "Habis" },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="flex gap-1 flex-1 overflow-x-auto pb-1">
        {stockOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onStockFilterChange(opt.value)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
              stockFilter === opt.value
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "bg-slate-100 dark:bg-zinc-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-zinc-700"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {categories.length > 0 && (
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-[10px] font-bold text-slate-400 border-0 appearance-none cursor-pointer"
        >
          <option value="">Semua Kategori</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      )}
    </div>
  );
}
