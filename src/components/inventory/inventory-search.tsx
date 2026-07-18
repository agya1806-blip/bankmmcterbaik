"use client";

import React from "react";
import { Search } from "lucide-react";

interface InventorySearchProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export function InventorySearch({ value, onChange, placeholder = "Cari nama produk, SKU, atau barcode..." }: InventorySearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white dark:bg-[#131527] border border-slate-200/60 dark:border-slate-800/60 focus:outline-none text-sm shadow-inner"
      />
    </div>
  );
}
