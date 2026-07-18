"use client";
import React from "react";
import { Scan } from "lucide-react";

interface ProductBarcodeProps {
  value: string;
  onChange: (value: string) => void;
  onScan: () => void;
}

export function ProductBarcode({ value, onChange, onScan }: ProductBarcodeProps) {
  return (
    <div>
      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Barcode</label>
      <div className="flex items-center gap-2 mt-1">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 input-premium"
          placeholder="Scan atau ketik"
        />
        <button
          type="button"
          onClick={onScan}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-400 hover:text-[#7B61FF] shrink-0 transition-colors"
        >
          <Scan className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
