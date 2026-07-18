"use client";

import React from "react";
import { Star, Heart, Wallet, X } from "lucide-react";
import type { DbCustomer } from "@/lib/db-v4";

export interface CartItemSummary {
  id: string;
  nama: string;
  qty: number;
  subtotal: number;
}

interface PosCartPanelProps {
  cartItems: CartItemSummary[];
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
  onCancel: () => void;
  grandTotal: number;
  hasItems: boolean;
  isProcessing: boolean;
  catatan: string;
  setCatatan: (v: string) => void;
  dpDibayar: number;
  setDpDibayar: (v: number) => void;
  sedekahNominal: number;
  setSedekahNominal: (v: number) => void;
  poinDigunakan: number;
  setPoinDigunakan: (v: number) => void;
  statusPesanan: "baru" | "diproses" | "selesai";
  setStatusPesanan: (v: "baru" | "diproses" | "selesai") => void;
  walletIdTarget: string;
  setWalletIdTarget: (v: string) => void;
  wallets: { id: string; namaDompet: string; saldo: number }[];
  customers: DbCustomer[];
  selectedCustomerId: string;
  sisaTagihan: number;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="premium-card p-3 space-y-2">
      <span className="text-[10px] font-heading font-extrabold uppercase tracking-wider text-slate-400">{title}</span>
      {children}
    </div>
  );
}

const formatRp = (n: number) => `Rp${n.toLocaleString()}`;

export default function PosCartPanel({
  cartItems, onRemoveItem, onCheckout, onCancel,
  grandTotal, hasItems, isProcessing,
  catatan, setCatatan,
  dpDibayar, setDpDibayar,
  sedekahNominal, setSedekahNominal,
  poinDigunakan, setPoinDigunakan,
  statusPesanan, setStatusPesanan,
  walletIdTarget, setWalletIdTarget,
  wallets, customers, selectedCustomerId, sisaTagihan,
}: PosCartPanelProps) {
  const cust = customers.find(c => c.id === selectedCustomerId);
  const maxPoin = cust ? Math.min(cust.poin, Math.floor(grandTotal / 100)) : 0;

  return (
    <>
      {cartItems.length > 0 && (
        <Section title={`Item (${cartItems.length})`}>
          <div className="space-y-1.5">
            {cartItems.map(item => (
              <div key={item.id} className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-heading font-bold line-clamp-1">{item.nama || "(tanpa nama)"}</p>
                  <p className="text-[9px] text-slate-400">x{item.qty}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold text-[#7B61FF] tabular-nums">{formatRp(item.subtotal)}</span>
                  <button onClick={() => onRemoveItem(item.id)} className="p-1 text-rose-500"><X className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
            <span className="text-xs font-heading font-bold text-slate-400">Total</span>
            <span className="text-lg font-heading font-extrabold gradient-text">{formatRp(grandTotal + (poinDigunakan * 100))}</span>
          </div>
          {poinDigunakan > 0 && (
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-slate-400 font-bold">Diskon poin</span>
              <span className="text-emerald-500 font-extrabold">-Rp{(poinDigunakan * 100).toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-700">
            <span className="text-xs font-heading font-bold">Grand Total</span>
            <span className="text-lg font-heading font-extrabold gradient-text">{formatRp(grandTotal)}</span>
          </div>
        </Section>
      )}

      <Section title="Catatan">
        <textarea placeholder="Catatan orderan..." value={catatan} onChange={e => setCatatan(e.target.value)} rows={2} className="w-full input-premium text-xs resize-none" />
      </Section>

      <Section title="Down Payment (DP)">
        <input type="number" min="0" value={dpDibayar || ""} onChange={e => setDpDibayar(Number(e.target.value))} placeholder="0" className="w-full input-premium text-xs" />
        {dpDibayar > 0 && (
          <div className="mt-1.5 flex items-center justify-between text-[10px]">
            <span className="text-slate-400 font-bold">Sisa tagihan:</span>
            <span className={`font-extrabold ${sisaTagihan > 0 ? "text-amber-500" : "text-emerald-500"}`}>{formatRp(sisaTagihan)}</span>
          </div>
        )}
      </Section>

      {cust && (
        <Section title="Poin Pelanggan">
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[10px] font-bold text-amber-600">Poin: {cust.poin}</span>
          </div>
          <input type="number" placeholder={`Gunakan poin (maks: ${maxPoin.toLocaleString()})`} value={poinDigunakan || ""}
            onChange={(e) => setPoinDigunakan(Math.min(maxPoin, Math.max(0, Number(e.target.value))))}
            className="w-full input-premium text-xs mt-1" />
          {poinDigunakan > 0 && (
            <p className="text-[9px] text-emerald-500 font-bold mt-1">Diskon poin: -Rp{(poinDigunakan * 100).toLocaleString()}</p>
          )}
        </Section>
      )}

      <Section title="Sedekah">
        <div>
          <label className="text-[9px] text-slate-400 font-bold uppercase flex items-center gap-1"><Heart className="w-3 h-3" /> Sedekah</label>
          <input type="number" value={sedekahNominal || ""} onChange={(e) => setSedekahNominal(Math.max(0, Number(e.target.value)))} className="w-full input-premium text-xs mt-1" />
        </div>
      </Section>

      <Section title="Status Pesanan">
        <div className="flex gap-2">
          {([["baru", "Baru"], ["diproses", "Diproses"], ["selesai", "Selesai"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setStatusPesanan(key)} className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all ${statusPesanan === key ? "bg-gradient-to-r from-[#7B61FF] to-[#FF5C00] text-white shadow-md" : "bg-slate-100 dark:bg-zinc-800 text-slate-400"}`}>{label}</button>
          ))}
        </div>
      </Section>

      <Section title="Dompet Penerima">
        <div className="grid grid-cols-2 gap-2">
          {wallets.map(w => (
            <button key={w.id} onClick={() => setWalletIdTarget(w.id)} className={`p-2.5 rounded-xl text-left transition-all ${walletIdTarget === w.id ? "bg-[#7B61FF]/10 border-2 border-[#7B61FF] shadow-md" : "bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-slate-700/60"}`}>
              <p className="text-[10px] font-heading font-bold">{w.namaDompet}</p>
              <p className="text-[9px] text-slate-400">{formatRp(w.saldo)}</p>
            </button>
          ))}
          {wallets.length === 0 && <div className="col-span-2 text-center py-6 text-slate-400 text-xs animate-fade-in"><Wallet className="w-5 h-5 mx-auto mb-2 opacity-40" />Belum ada dompet</div>}
        </div>
      </Section>

      <div className="flex gap-2">
        {hasItems && (
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-rose-500/10 text-rose-500 font-bold text-xs active:scale-[0.98] transition-transform flex items-center justify-center gap-1">
            <X className="w-4 h-4" /> Batal
          </button>
        )}
        <button onClick={onCheckout} disabled={isProcessing || grandTotal === 0} className="flex-1 py-3.5 rounded-2xl btn-primary text-sm font-heading font-extrabold disabled:opacity-50 active:scale-[0.97] transition-transform">
          {isProcessing ? "Memproses..." : `Simpan Orderan${grandTotal > 0 ? ` • ${formatRp(grandTotal)}` : ""}`}
        </button>
      </div>
    </>
  );
}
