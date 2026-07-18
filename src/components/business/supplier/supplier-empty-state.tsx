"use client";
import React from "react";
import { Building2 } from "lucide-react";

interface SupplierEmptyStateProps {
  isSearching: boolean;
  onAdd?: () => void;
}

export function SupplierEmptyState({ isSearching, onAdd }: SupplierEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
        <Building2 className="w-7 h-7 text-slate-400" />
      </div>
      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
        {isSearching ? "Tidak ada supplier" : "Belum ada supplier"}
      </h3>
      <p className="text-[11px] text-slate-400 max-w-[220px] mb-4">
        {isSearching
          ? "Tidak ditemukan supplier yang cocok dengan pencarian Anda"
          : "Tambahkan supplier pertama Anda untuk mulai mengelola pembelian"}
      </p>
      {!isSearching && onAdd && (
        <button
          onClick={onAdd}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#008CEB] to-[#00C9A7] text-white font-bold text-xs shadow-lg shadow-[#008CEB]/20 scale-press"
        >
          Tambah Supplier
        </button>
      )}
    </div>
  );
}
