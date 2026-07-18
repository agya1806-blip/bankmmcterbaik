"use client";

import React from "react";
import { ArrowLeft, Plus, Package } from "lucide-react";

interface InventoryHeaderProps {
  title: string;
  productCount: number;
  onBack: () => void;
  onAdd: () => void;
}

export function InventoryHeader({ title, productCount, onBack, onAdd }: InventoryHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <button onClick={onBack} className="p-2 bg-white dark:bg-[#131527] rounded-full shadow-md active:scale-90 transition-transform">
        <ArrowLeft className="w-4 h-4" />
      </button>
      <div className="flex items-center gap-2">
        <Package className="w-5 h-5 text-[#008CEB]" />
        <h1 className="text-lg font-extrabold tracking-tight">{title}</h1>
        <span className="text-[10px] text-slate-400 font-bold">({productCount})</span>
      </div>
      <button onClick={onAdd} className="p-2 bg-gradient-to-r from-[#008CEB] to-[#00C9A7] text-white rounded-full shadow-md active:scale-90 transition-transform">
        <Plus className="w-5 h-5" />
      </button>
    </div>
  );
}
