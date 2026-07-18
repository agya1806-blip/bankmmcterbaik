"use client";
import React from "react";

interface ProductCostSectionProps {
  hargaModal: number;
  onChange: (value: number) => void;
}

export function ProductCostSection({ hargaModal, onChange }: ProductCostSectionProps) {
  return (
    <div className="space-y-3">
      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Biaya Modal</h4>
      <div>
        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Harga Pokok Penjualan (HPP)</label>
        <input
          type="number"
          value={hargaModal || ""}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full input-premium mt-1"
          placeholder="0"
        />
        <p className="text-[9px] text-slate-400 mt-1">Biaya per unit termasuk bahan, tenaga kerja, dan overhead</p>
      </div>
    </div>
  );
}
