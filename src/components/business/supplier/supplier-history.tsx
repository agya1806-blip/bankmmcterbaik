"use client";
import React from "react";
import { ClipboardList } from "lucide-react";
import type { DbPurchaseOrder } from "@/lib/db-v4";

interface SupplierHistoryProps {
  orders: DbPurchaseOrder[];
}

const statusStyles: Record<string, string> = {
  draft: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
  dikirim: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  diterima: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  selesai: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  batal: "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400",
};

export function SupplierHistory({ orders }: SupplierHistoryProps) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center py-6 text-slate-400">
        <ClipboardList className="w-6 h-6 mb-2 text-slate-300" />
        <p className="text-[10px]">Belum ada riwayat pembelian</p>
      </div>
    );
  }

  const statusLabel = (status: string) => {
    const labels: Record<string, string> = { draft: "Draft", dikirim: "Dikirim", diterima: "Diterima", selesai: "Selesai", batal: "Batal" };
    return labels[status] || status;
  };

  return (
    <div className="space-y-1.5">
      {orders.map((po) => (
        <div key={po.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold truncate">{po.poNumber}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">
              {new Date(po.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
          <div className="text-right shrink-0 ml-2">
            <p className="text-[10px] font-bold">Rp{po.total.toLocaleString()}</p>
            <span className={`inline-block text-[8px] px-1.5 py-0.5 rounded font-bold mt-0.5 ${statusStyles[po.status] || ""}`}>
              {statusLabel(po.status)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
