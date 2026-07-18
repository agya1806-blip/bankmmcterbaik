"use client";

import React from "react";
import { Eye, RotateCcw, History, ArrowUp, ArrowDown } from "lucide-react";
import type { Inventory } from "@/lib/db-v4";

interface InventoryTableProps {
  items: Inventory[];
  onViewDetail: (item: Inventory) => void;
  onAdjustStock: (item: Inventory) => void;
  onViewHistory: (item: Inventory) => void;
  onMutasi: (item: Inventory, tipe: "masuk" | "keluar") => void;
}

export function InventoryTable({ items, onViewDetail, onAdjustStock, onViewHistory, onMutasi }: InventoryTableProps) {
  const statusBadge = (item: Inventory) => {
    if (item.stok === 0) return { label: "Habis", color: "bg-red-100 text-red-600 dark:bg-red-950/30" };
    if (item.stok <= item.stokMin) return { label: "Menipis", color: "bg-amber-100 text-amber-600 dark:bg-amber-950/30" };
    return { label: "Normal", color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30" };
  };

  if (items.length === 0) return null;

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-[9px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
            <th className="p-2 text-left">Foto</th>
            <th className="p-2 text-left">Produk</th>
            <th className="p-2 text-left hidden md:table-cell">Kategori</th>
            <th className="p-2 text-left hidden sm:table-cell">SKU</th>
            <th className="p-2 text-left hidden lg:table-cell">Barcode</th>
            <th className="p-2 text-right">Stok</th>
            <th className="p-2 text-center hidden sm:table-cell">Min</th>
            <th className="p-2 text-center">Status</th>
            <th className="p-2 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((item) => {
            const status = statusBadge(item);
            return (
              <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                <td className="p-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 overflow-hidden">
                    {item.fotoUrl ? <img src={item.fotoUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-[10px] font-extrabold">{item.nama.charAt(0)}</span>}
                  </div>
                </td>
                <td className="p-2 font-bold max-w-[120px] truncate">{item.nama}</td>
                <td className="p-2 text-slate-400 hidden md:table-cell">{item.kategori || "-"}</td>
                <td className="p-2 text-slate-400 hidden sm:table-cell font-mono text-[9px]">{item.sku || "-"}</td>
                <td className="p-2 text-slate-400 hidden lg:table-cell font-mono text-[9px]">{item.barcode || "-"}</td>
                <td className={`p-2 text-right font-extrabold ${item.stok <= item.stokMin ? "text-amber-600" : "text-slate-800 dark:text-slate-200"}`}>{item.stok}</td>
                <td className="p-2 text-center text-slate-400 hidden sm:table-cell">{item.stokMin}</td>
                <td className="p-2 text-center">
                  <span className={`inline-block text-[8px] px-2 py-0.5 rounded-full font-bold ${status.color}`}>{status.label}</span>
                </td>
                <td className="p-2">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => onViewDetail(item)} className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 active:scale-90 transition-all" title="Detail">
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                    <button onClick={() => onMutasi(item, "masuk")} className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 active:scale-90 transition-all" title="Stok Masuk">
                      <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
                    </button>
                    <button onClick={() => onMutasi(item, "keluar")} className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/50 active:scale-90 transition-all" title="Stok Keluar">
                      <ArrowUp className="w-3.5 h-3.5 text-rose-500" />
                    </button>
                    <button onClick={() => onAdjustStock(item)} className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50 active:scale-90 transition-all" title="Penyesuaian">
                      <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                    </button>
                    <button onClick={() => onViewHistory(item)} className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/50 active:scale-90 transition-all" title="Riwayat">
                      <History className="w-3.5 h-3.5 text-blue-600" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
