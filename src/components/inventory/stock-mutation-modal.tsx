"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, ArrowDown, ArrowUp } from "lucide-react";
import type { Inventory } from "@/lib/db-v4";

interface StockMutationModalProps {
  product: Inventory;
  tipe: "masuk" | "keluar";
  onSave: (productId: string, tipe: "masuk" | "keluar", qty: number, alasan: string) => Promise<void>;
  onClose: () => void;
}

export function StockMutationModal({ product, tipe, onSave, onClose }: StockMutationModalProps) {
  const [qty, setQty] = useState(1);
  const [alasan, setAlasan] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (qty <= 0) return;
    setLoading(true);
    try {
      await onSave(product.id, tipe, qty, alasan);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const isMasuk = tipe === "masuk";

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm bg-white dark:bg-[#131527] rounded-2xl p-5 space-y-4 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-extrabold flex items-center gap-2">
            {isMasuk ? <ArrowDown className="w-4 h-4 text-emerald-500" /> : <ArrowUp className="w-4 h-4 text-rose-500" />}
            Stok {isMasuk ? "Masuk" : "Keluar"}
          </h3>
          <button onClick={onClose} className="p-1 rounded-full bg-slate-100 dark:bg-zinc-800">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="text-xs">
          <p className="font-bold">{product.nama}</p>
          <p className="text-slate-400 mt-0.5">Stok saat ini: <strong>{product.stok}</strong></p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block mb-1 font-bold text-slate-400">Jumlah</label>
            <input type="number" value={qty || ""} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none font-bold text-lg"
              min="1" required />
          </div>
          <div>
            <label className="block mb-1 font-bold text-slate-400">Alasan (opsional)</label>
            <input type="text" value={alasan} onChange={(e) => setAlasan(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none"
              placeholder={isMasuk ? "Pembelian dari supplier..." : "Penjualan, retur..."} />
          </div>
          <button type="submit" disabled={loading}
            className={`w-full py-3 rounded-2xl text-white font-extrabold text-xs shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2 ${
              isMasuk ? "bg-gradient-to-r from-emerald-500 to-emerald-600" : "bg-gradient-to-r from-rose-500 to-rose-600"
            }`}>
            {isMasuk ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
            {loading ? "Memproses..." : `Stok ${isMasuk ? "Masuk" : "Keluar"}`}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
