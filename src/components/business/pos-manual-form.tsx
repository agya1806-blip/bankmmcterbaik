"use client";

import React from "react";
import { Plus, Trash2, Calculator } from "lucide-react";

export interface ManualCartItem {
  tempId: string;
  namaItem: string;
  qty: number;
  harga: number;
  hargaModal: number;
}

interface PosManualFormProps {
  items: ManualCartItem[];
  onAdd: () => void;
  onRemove: (tempId: string) => void;
  onUpdate: (tempId: string, field: keyof ManualCartItem, value: string | number) => void;
  spesifikasi: string;
  setSpesifikasi: (v: string) => void;
  manualTotal: number;
  onOpenCalculator: (tempId: string) => void;
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

export default function PosManualForm({
  items, onAdd, onRemove, onUpdate,
  spesifikasi, setSpesifikasi, manualTotal,
  onOpenCalculator,
}: PosManualFormProps) {
  return (
    <>
      <Section title="Item Pesanan">
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.tempId} className="bg-slate-50 dark:bg-zinc-800/50 p-2.5 rounded-xl space-y-2">
              <div className="flex items-start gap-2">
                <input type="text" placeholder="Nama item *" value={item.namaItem} onChange={e => onUpdate(item.tempId, "namaItem", e.target.value)} className="flex-1 input-premium text-xs" />
                <button onClick={() => onRemove(item.tempId)} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg shrink-0"><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-[8px] text-slate-400 font-bold uppercase">Qty</label>
                  <input type="number" min="1" value={item.qty} onChange={e => onUpdate(item.tempId, "qty", Math.max(1, Number(e.target.value)))} className="w-full input-premium text-xs text-center" />
                </div>
                <div className="flex-1">
                  <label className="text-[8px] text-slate-400 font-bold uppercase">Harga</label>
                  <div className="flex items-center gap-1">
                    <input type="number" min="0" value={item.harga || ""} onChange={e => onUpdate(item.tempId, "harga", Number(e.target.value))} placeholder="0" className="flex-1 input-premium text-xs text-right" />
                    <button type="button" onClick={() => onOpenCalculator(item.tempId)} className="p-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-400 hover:text-[#008CEB] shrink-0">
                      <Calculator className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-[8px] text-slate-400 font-bold uppercase">Subtotal</label>
                  <div className="w-full input-premium text-xs text-right font-extrabold text-[#7B61FF]">{formatRp(item.qty * item.harga)}</div>
                </div>
              </div>
            </div>
          ))}
          <button onClick={onAdd} className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-400 flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform hover:border-[#7B61FF] hover:text-[#7B61FF]">
            <Plus className="w-4 h-4" /> Tambah Item
          </button>
        </div>
      </Section>

      {items.length > 0 && (
        <div className="premium-card p-3 bg-gradient-to-br from-[#7B61FF]/5 to-[#FF5C00]/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-heading font-bold text-slate-400">Total Orderan</span>
            <span className="text-lg font-heading font-extrabold gradient-text">{formatRp(manualTotal)}</span>
          </div>
        </div>
      )}

      <Section title="Spesifikasi">
        <textarea placeholder="Contoh: Ukuran A4, 2 sisi..." value={spesifikasi} onChange={e => setSpesifikasi(e.target.value)} rows={3} className="w-full input-premium text-xs resize-none" />
      </Section>
    </>
  );
}
