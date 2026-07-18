"use client";
import React from "react";
import { ArrowLeft, Building2 } from "lucide-react";

interface SupplierHeaderProps {
  onBack: () => void;
}

export function SupplierHeader({ onBack }: SupplierHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <button
        onClick={onBack}
        className="w-10 h-10 rounded-2xl bg-white dark:bg-[#131527] shadow-md flex items-center justify-center scale-press"
        aria-label="Kembali"
      >
        <ArrowLeft className="w-5 h-5 text-slate-500" />
      </button>
      <div className="text-center">
        <h1 className="text-lg font-heading font-extrabold tracking-tight flex items-center gap-2 justify-center">
          <Building2 className="w-5 h-5 text-[#008CEB]" />
          Supplier
        </h1>
      </div>
      <div className="w-10 h-10" />
    </div>
  );
}
