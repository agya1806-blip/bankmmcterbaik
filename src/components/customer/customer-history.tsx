"use client";
import React from "react";
import { History, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { DbTransaction } from "./customer-types";

interface CustomerHistoryProps {
  transactions: DbTransaction[];
}

export function CustomerHistory({ transactions }: CustomerHistoryProps) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center py-6 text-slate-400">
        <Clock className="w-6 h-6 mb-2 text-slate-300" />
        <p className="text-[10px] font-medium">Belum ada transaksi</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
        <History className="w-3 h-3" /> Riwayat Transaksi
      </p>
      {transactions.map((tx) => (
        <div key={tx.id} className="flex items-center justify-between py-2 px-3 bg-slate-50 dark:bg-zinc-900 rounded-xl">
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
              Rp{tx.grandTotal.toLocaleString()}
            </p>
            <p className="text-[9px] text-slate-400">
              {new Date(tx.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
            </p>
            <p className="text-[8px] text-amber-500 font-semibold mt-0.5">
              +{Math.floor(tx.grandTotal / 10000)} poin
            </p>
          </div>
          <Badge variant={tx.status === "LUNAS" ? "success" : tx.status === "DP" ? "warning" : "danger"}>
            {tx.status}
          </Badge>
        </div>
      ))}
    </div>
  );
}