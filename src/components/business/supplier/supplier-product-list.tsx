"use client";
import React from "react";
import { Package } from "lucide-react";

interface ProductSummary {
  namaItem: string;
  totalQty: number;
  totalHarga: number;
}

interface SupplierProductListProps {
  products: ProductSummary[];
}

export function SupplierProductList({ products }: SupplierProductListProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center py-6 text-slate-400">
        <Package className="w-6 h-6 mb-2 text-slate-300" />
        <p className="text-[10px]">Belum ada produk</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {products.slice(0, 10).map((p, i) => (
        <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold truncate">{p.namaItem}</p>
            <p className="text-[9px] text-slate-400">Total: {p.totalQty} pcs</p>
          </div>
          <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0 ml-2">
            Rp{p.totalHarga.toLocaleString()}
          </p>
        </div>
      ))}
      {products.length > 10 && (
        <p className="text-[9px] text-slate-400 text-center pt-1">+{products.length - 10} produk lainnya</p>
      )}
    </div>
  );
}
