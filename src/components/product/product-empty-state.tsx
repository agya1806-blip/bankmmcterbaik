"use client";
import React from "react";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductEmptyStateProps {
  hasFilter: boolean;
  onAdd: () => void;
}

export function ProductEmptyState({ hasFilter, onAdd }: ProductEmptyStateProps) {
  if (hasFilter) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
        <p className="text-sm font-medium text-slate-400">Tidak ada produk yang cocok</p>
        <p className="text-[11px] text-slate-400 mt-1">Coba ubah kata kunci atau filter</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
        <Package className="w-7 h-7 text-slate-400" />
      </div>
      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Belum ada produk</h3>
      <p className="text-[11px] text-slate-400 max-w-[220px] mb-4">
        Tambahkan produk pertama Anda untuk memulai pencatatan inventaris
      </p>
      <Button variant="primary" size="sm" onClick={onAdd}>
        Tambah Produk
      </Button>
    </div>
  );
}
