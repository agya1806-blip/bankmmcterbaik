"use client";
import React from "react";
import { Package, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface ProductStockSummaryProps {
  total: number;
  active: number;
  inactive: number;
  lowStock: number;
}

export function ProductStockSummary({ total, active, inactive, lowStock }: ProductStockSummaryProps) {
  const cards = [
    {
      label: "Total Produk",
      value: total,
      icon: <Package className="w-4 h-4" />,
      color: "from-[#008CEB] to-[#00C9A7]",
      bg: "bg-[#008CEB]/10",
    },
    {
      label: "Produk Aktif",
      value: active,
      icon: <CheckCircle className="w-4 h-4" />,
      color: "from-emerald-400 to-emerald-500",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
    },
    {
      label: "Produk Nonaktif",
      value: inactive,
      icon: <XCircle className="w-4 h-4" />,
      color: "from-slate-400 to-slate-500",
      bg: "bg-slate-100 dark:bg-slate-800",
    },
    {
      label: "Stok Hampir Habis",
      value: lowStock,
      icon: <AlertTriangle className="w-4 h-4" />,
      color: "from-amber-400 to-amber-500",
      bg: "bg-amber-50 dark:bg-amber-950/30",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div key={card.label} className="premium-card p-3 flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-md shrink-0`}>
            {card.icon}
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</p>
            <p className="text-lg font-extrabold text-slate-800 dark:text-slate-200">{card.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
