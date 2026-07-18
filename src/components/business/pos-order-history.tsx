"use client";

import React from "react";
import { FileText, Edit3, Trash2, ShoppingCart } from "lucide-react";
import type { DbTransaction } from "@/lib/db-v4";

interface PosOrderHistoryProps {
  transactions: DbTransaction[];
  getProdStatus: (txId: string) => string;
  formatRp: (n: number) => string;
  formatDate: (iso: string) => string;
  onViewInvoice: (tx: DbTransaction) => void;
  onEdit: (tx: DbTransaction) => void;
  onDelete: (tx: DbTransaction) => void;
}

export default function PosOrderHistory({
  transactions, getProdStatus, formatRp, formatDate,
  onViewInvoice, onEdit, onDelete,
}: PosOrderHistoryProps) {
  if (transactions.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto pb-24 space-y-2">
        <div className="text-center py-12 text-slate-400 text-xs animate-fade-in"><ShoppingCart className="w-6 h-6 mx-auto mb-2 opacity-40" />Belum ada transaksi</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto pb-24 space-y-2">
      {transactions.map(tx => (
        <div key={tx.id} className="premium-card p-3 space-y-2">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-heading font-bold line-clamp-1">{tx.invoiceNumber}</p>
              <p className="text-[10px] text-slate-400">{tx.customerNama} • {formatDate(tx.tanggal)}</p>
            </div>
            <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold shrink-0 ${tx.status === "LUNAS" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>{tx.status}</span>
          </div>
          <div className="space-y-1">
            {tx.items.map((item: { namaItem: string; qty: number; subtotal: number }, idx: number) => (
              <div key={idx} className="flex justify-between text-[10px]">
                <span className="text-slate-500">{item.namaItem} x{item.qty}</span>
                <span className="font-bold">{formatRp(item.subtotal)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2">
            <div>
              <p className="text-[10px] text-slate-400">Total: <span className="font-extrabold text-[#7B61FF]">{formatRp(tx.grandTotal)}</span></p>
              {tx.dpDibayar > 0 && <p className="text-[9px] text-slate-400">DP: {formatRp(tx.dpDibayar)} • Sisa: <span className="font-bold text-amber-500">{formatRp(tx.sisaTagihan)}</span></p>}
              {getProdStatus(tx.id) && <p className="text-[9px] text-indigo-500 font-bold mt-0.5">{getProdStatus(tx.id)}</p>}
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => onViewInvoice(tx)} className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-blue-500"><FileText className="w-3.5 h-3.5" /></button>
              <button onClick={() => onEdit(tx)} className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-500"><Edit3 className="w-3.5 h-3.5" /></button>
              <button onClick={() => onDelete(tx)} className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
