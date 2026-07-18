"use client";
import React from "react";
import { Calculator } from "lucide-react";

interface ProductPriceSectionProps {
  hargaModal: number;
  hargaJual: number;
  onHargaModalChange: (value: number) => void;
  onHargaJualChange: (value: number) => void;
  onOpenCalculator: () => void;
}

export function ProductPriceSection({
  hargaModal,
  hargaJual,
  onHargaModalChange,
  onHargaJualChange,
  onOpenCalculator,
}: ProductPriceSectionProps) {
  const margin = hargaModal > 0 ? Math.round(((hargaJual - hargaModal) / hargaModal) * 100) : 0;

  return (
    <div className="space-y-3">
      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Harga</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Harga Modal (HPP)</label>
          <input
            type="number"
            value={hargaModal || ""}
            onChange={(e) => onHargaModalChange(Number(e.target.value))}
            className="w-full input-premium mt-1"
            placeholder="0"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Harga Jual</label>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="number"
              value={hargaJual || ""}
              onChange={(e) => onHargaJualChange(Number(e.target.value))}
              className="flex-1 input-premium"
              placeholder="0"
            />
            <button
              type="button"
              onClick={onOpenCalculator}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-400 hover:text-[#008CEB] shrink-0 transition-colors"
            >
              <Calculator className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      {hargaModal > 0 && (
        <div className="flex items-center gap-2 text-[10px] text-slate-400">
          <span>Margin:</span>
          <span className={`font-bold ${margin >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
            {margin}%
          </span>
          <span className="text-slate-300">|</span>
          <span>Laba: Rp{(hargaJual - hargaModal).toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}
