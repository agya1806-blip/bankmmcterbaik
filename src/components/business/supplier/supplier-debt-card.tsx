"use client";
import React from "react";
import { CreditCard, TrendingUp, TrendingDown } from "lucide-react";

interface SupplierDebtCardProps {
  totalHutang: number;
  totalPO: number;
  poDiterima: number;
  poSelesai: number;
}

export function SupplierDebtCard({ totalHutang, totalPO, poDiterima, poSelesai }: SupplierDebtCardProps) {
  const debounced = poDiterima > 0 && poSelesai > 0
    ? Math.round((poDiterima / (poDiterima + poSelesai)) * 100)
    : 0;

  return (
    <div className="premium-card p-3 space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <CreditCard className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ringkasan Hutang & PO</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-[9px] text-slate-400">Total Hutang</p>
          <p className="text-xs font-heading font-extrabold text-amber-600 dark:text-amber-400">
            Rp{totalHutang.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-[9px] text-slate-400">Total PO</p>
          <p className="text-xs font-heading font-extrabold">{totalPO}</p>
        </div>
        <div>
          <p className="text-[9px] text-slate-400 flex items-center gap-1">
            <TrendingUp className="w-2.5 h-2.5 text-emerald-500" /> Diterima
          </p>
          <p className="text-xs font-heading font-extrabold text-emerald-600 dark:text-emerald-400">{poDiterima}</p>
        </div>
        <div>
          <p className="text-[9px] text-slate-400 flex items-center gap-1">
            <TrendingDown className="w-2.5 h-2.5 text-blue-500" /> Selesai
          </p>
          <p className="text-xs font-heading font-extrabold text-blue-600 dark:text-blue-400">{poSelesai}</p>
        </div>
      </div>
      {debounced > 0 && (
        <div className="mt-1">
          <div className="flex items-center justify-between text-[9px] text-slate-400 mb-1">
            <span>Progress</span>
            <span>{debounced}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#008CEB] to-[#00C9A7] transition-all duration-500"
              style={{ width: `${debounced}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
