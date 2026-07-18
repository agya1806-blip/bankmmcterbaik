"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, ArrowRightLeft } from "lucide-react";
import type { Inventory } from "@/lib/db-v4";

interface StockTransferModalProps {
  products: Inventory[];
  sourceProduct: Inventory;
  onSave: (fromId: string, toId: string, qty: number, alasan: string) => Promise<void>;
  onClose: () => void;
}

export function StockTransferModal({ products, sourceProduct, onSave, onClose }: StockTransferModalProps) {
  const [targetId, setTargetId] = useState("");
  const [qty, setQty] = useState(1);
  const [alasan, setAlasan] = useState("");
  const [loading, setLoading] = useState(false);

  const targetProduct = products.find((p) => p.id === targetId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId || qty <= 0 || qty > sourceProduct.stok) return;
    setLoading(true);
    try {
      await onSave(sourceProduct.id, targetId, qty, alasan);
      onClose();
    } finally {
      setLoading(false);
    }
  };

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
            <ArrowRightLeft className="w-4 h-4 text-blue-500" />
            Transfer Stok
          </h3>
          <button onClick={onClose} className="p-1 rounded-full bg-slate-100 dark:bg-zinc-800">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="text-xs space-y-2">
          <p className="font-bold">Sumber: {sourceProduct.nama}</p>
          <p className="text-slate-400">Stok tersedia: <strong>{sourceProduct.stok}</strong></p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block mb-1 font-bold text-slate-400">Produk Tujuan</label>
            <select value={targetId} onChange={(e) => setTargetId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none" required>
              <option value="">Pilih produk...</option>
              {products.filter((p) => p.id !== sourceProduct.id).map((p) => (
                <option key={p.id} value={p.id}>{p.nama} (stok: {p.stok})</option>
              ))}
            </select>
          </div>
          {targetProduct && (
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-[10px]">
              Tujuan: <strong>{targetProduct.nama}</strong> — Stok saat ini: {targetProduct.stok}
            </div>
          )}
          <div>
            <label className="block mb-1 font-bold text-slate-400">Jumlah Transfer</label>
            <input type="number" value={qty || ""} onChange={(e) => setQty(Math.min(Math.max(1, Number(e.target.value)), sourceProduct.stok))}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none font-bold"
              min="1" max={sourceProduct.stok} required />
          </div>
          <div>
            <label className="block mb-1 font-bold text-slate-400">Alasan (opsional)</label>
            <input type="text" value={alasan} onChange={(e) => setAlasan(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none"
              placeholder="Pemindahan stok..." />
          </div>
          <button type="submit" disabled={loading || !targetId}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-extrabold text-xs shadow-lg active:scale-[0.98] transition-transform">
            {loading ? "Memproses..." : "Transfer Stok"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
