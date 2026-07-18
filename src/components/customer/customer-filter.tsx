"use client";
import React from "react";
import { cn } from "@/components/ui/cn";
import type { CustomerStatus } from "./customer-types";

interface CustomerFilterProps {
  filterStatus: CustomerStatus;
  onFilterStatusChange: (status: CustomerStatus) => void;
}

const statusOptions: { value: CustomerStatus; label: string }[] = [
  { value: "semua", label: "Semua" },
  { value: "aktif", label: "Aktif" },
  { value: "tidak-aktif", label: "Tidak Aktif" },
  { value: "memiliki-piutang", label: "Memiliki Piutang" },
];

export function CustomerFilter({ filterStatus, onFilterStatusChange }: CustomerFilterProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
      {statusOptions.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onFilterStatusChange(opt.value)}
          className={cn(
            "shrink-0 px-3 py-1.5 text-[10px] font-bold rounded-xl transition-all duration-200",
            filterStatus === opt.value
              ? "bg-[#008CEB] text-white shadow-sm"
              : "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-zinc-700"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}