"use client";

import React from "react";
import { Package, AlertTriangle, XCircle, DollarSign } from "lucide-react";

interface InventorySummaryCardsProps {
  totalItems: number;
  totalStock: number;
  lowStock: number;
  outOfStock: number;
  nilaiPersediaan: number;
}

export function InventorySummaryCards({ totalItems, totalStock, lowStock, outOfStock, nilaiPersediaan }: InventorySummaryCardsProps) {
  const cards = [
    { label: "Total Item", value: totalItems, icon: <Package className="w-4 h-4" />, color: "from-blue-500 to-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30 text-blue-600" },
    { label: "Total Stok", value: totalStock, icon: <Package className="w-4 h-4" />, color: "from-emerald-500 to-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600" },
    { label: "Stok Menipis", value: lowStock, icon: <AlertTriangle className="w-4 h-4" />, color: "from-amber-500 to-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30 text-amber-600" },
    { label: "Stok Habis", value: outOfStock, icon: <XCircle className="w-4 h-4" />, color: "from-red-500 to-red-600", bg: "bg-red-100 dark:bg-red-900/30 text-red-600" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
      {cards.map((c) => (
        <div key={c.label} className="bg-white dark:bg-[#1a1b2e] rounded-2xl p-3 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center text-white shadow-sm shrink-0`}>
            {c.icon}
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{c.label}</p>
            <p className="text-base font-extrabold">{c.value.toLocaleString()}</p>
          </div>
        </div>
      ))}
      <div className="col-span-2 lg:col-span-4 bg-white dark:bg-[#1a1b2e] rounded-2xl p-3 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#008CEB] to-[#00C9A7] flex items-center justify-center text-white shadow-sm shrink-0">
          <DollarSign className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Nilai Persediaan</p>
          <p className="text-base font-extrabold text-[#008CEB]">Rp{nilaiPersediaan.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
