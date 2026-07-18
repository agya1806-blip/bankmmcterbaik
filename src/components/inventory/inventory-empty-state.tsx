"use client";

import React from "react";
import { Package } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

interface InventoryEmptyStateProps {
  hasFilter: boolean;
  onAdd: () => void;
}

export function InventoryEmptyState({ hasFilter, onAdd }: InventoryEmptyStateProps) {
  if (hasFilter) {
    return (
      <EmptyState
        icon={<Package className="w-7 h-7 text-slate-400" />}
        title="Tidak ada produk yang cocok"
        description="Coba ubah kata kunci atau filter"
      />
    );
  }
  return (
    <EmptyState
      icon={<Package className="w-7 h-7 text-slate-400" />}
      title="Belum ada produk"
      description="Tambahkan produk pertama Anda untuk memulai pencatatan stok"
      action={
        <button onClick={onAdd}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#008CEB] to-[#00C9A7] text-white font-bold text-xs active:scale-[0.98]">
          Tambah Produk
        </button>
      }
    />
  );
}
