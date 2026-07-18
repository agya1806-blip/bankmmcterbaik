"use client";
import React from "react";
import { Plus, Search, X } from "lucide-react";

interface SupplierToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onAdd: () => void;
}

export function SupplierToolbar({ searchQuery, onSearchChange, onAdd }: SupplierToolbarProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cari nama, kontak, alamat..."
          className="w-full pl-9 pr-8 py-2.5 rounded-2xl bg-white dark:bg-[#131527] text-xs font-medium border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#008CEB]/20 transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            aria-label="Hapus pencarian"
          >
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        )}
      </div>
      <button
        onClick={onAdd}
        className="h-10 px-4 rounded-2xl bg-gradient-to-r from-[#008CEB] to-[#00C9A7] text-white font-bold text-xs shadow-lg shadow-[#008CEB]/20 flex items-center gap-1.5 scale-press"
      >
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">Tambah</span>
      </button>
    </div>
  );
}
