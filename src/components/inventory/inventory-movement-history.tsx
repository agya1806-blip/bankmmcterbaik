"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, History, Clock } from "lucide-react";
import type { DbInventoryMutation } from "@/lib/db-v4";

interface InventoryMovementHistoryProps {
  mutations: DbInventoryMutation[];
  productName?: string;
}

export function InventoryMovementHistory({ mutations, productName }: InventoryMovementHistoryProps) {
  if (mutations.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-slate-400">
        <Clock className="w-8 h-8 mb-2 text-slate-300" />
        <p className="text-xs">Belum ada riwayat mutasi</p>
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-3">
      <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-700 rounded-full" />
      {mutations.map((m, i) => (
        <motion.div
          key={m.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="relative flex items-start gap-3"
        >
          <div className={`absolute -left-[22px] w-[22px] flex items-center justify-center`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
              m.tipe === "masuk" ? "bg-emerald-100 dark:bg-emerald-950/30" :
              m.tipe === "keluar" ? "bg-rose-100 dark:bg-rose-950/30" :
              "bg-amber-100 dark:bg-amber-950/30"
            }`}>
              {m.tipe === "masuk" ? <ArrowDown className="w-3 h-3 text-emerald-600" /> :
               m.tipe === "keluar" ? <ArrowUp className="w-3 h-3 text-rose-500" /> :
               <History className="w-3 h-3 text-amber-600" />}
            </div>
          </div>
          <div className="flex-1 bg-white dark:bg-[#1a1b2e] rounded-xl p-3 shadow-sm border border-slate-100 dark:border-slate-800 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className={`text-[10px] font-extrabold ${
                  m.tipe === "masuk" ? "text-emerald-600" :
                  m.tipe === "keluar" ? "text-rose-500" :
                  "text-amber-600"
                }`}>
                  {m.tipe === "masuk" ? "Stok Masuk" : m.tipe === "keluar" ? "Stok Keluar" : "Penyesuaian"}
                </span>
                {productName && <p className="text-[11px] font-bold truncate mt-0.5">{productName}</p>}
              </div>
              <div className="text-right shrink-0">
                <p className={`text-[11px] font-extrabold ${m.tipe === "masuk" ? "text-emerald-600" : "text-rose-500"}`}>
                  {m.tipe === "masuk" ? "+" : "-"}{m.qty}
                </p>
                <p className="text-[9px] text-slate-400">Stok: {m.stokSesudah}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-[9px] text-slate-400">
              <span>{new Date(m.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
              {m.alasan && <><span>·</span><span>{m.alasan}</span></>}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
