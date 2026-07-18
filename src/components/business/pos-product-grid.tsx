"use client";

import React from "react";
import { Search, Scan, Package, Plus, Minus, Trash2, AlertTriangle } from "lucide-react";
import type { DbInventoryItem } from "@/lib/db-v4";

export interface GridCartItem {
  productId: string;
  namaItem: string;
  qty: number;
  hargaSatuan: number;
  hargaModal: number;
}

interface PosProductGridProps {
  products: DbInventoryItem[];
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  setShowBarcodeScanner: (v: boolean) => void;
  kategoriList: string[];
  selectedKategori: string;
  setSelectedKategori: (v: string) => void;
  gridCart: GridCartItem[];
  updateGridQty: (productId: string, delta: number) => void;
  removeGridItem: (productId: string) => void;
  gridTotal: number;
  addProductToGrid: (prod: DbInventoryItem) => void;
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

export default function PosProductGrid({
  products, searchQuery, setSearchQuery, setShowBarcodeScanner,
  kategoriList, selectedKategori, setSelectedKategori,
  gridCart, updateGridQty, removeGridItem, gridTotal, addProductToGrid,
}: PosProductGridProps) {
  const filteredProducts = products.filter(p => {
    const matchSearch = !searchQuery || p.nama.toLowerCase().includes(searchQuery.toLowerCase());
    const matchKategori = selectedKategori === "Semua" || p.kategori === selectedKategori;
    return matchSearch && matchKategori;
  });

  return (
    <>
      <Section title="Produk">
        <div className="relative mb-2 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Cari produk..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 input-premium text-xs" />
          </div>
          <button onClick={() => setShowBarcodeScanner(true)} className="p-2 rounded-xl bg-[#7B61FF]/10 text-[#7B61FF] shrink-0">
            <Scan className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar mb-2">
          {kategoriList.map(kat => (
            <button key={kat} onClick={() => setSelectedKategori(kat)} className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${selectedKategori === kat ? "bg-[#7B61FF] text-white shadow-md" : "bg-slate-100 dark:bg-zinc-800 text-slate-400"}`}>{kat}</button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto pr-1">
          {filteredProducts.map((prod) => {
            const inCart = gridCart.find(i => i.productId === prod.id);
            return (
              <button key={prod.id} onClick={() => addProductToGrid(prod)} disabled={prod.stok <= 0} className={`premium-card p-2 text-left active:scale-[0.96] disabled:opacity-40 transition-all ${inCart ? "ring-2 ring-[#7B61FF]" : ""}`}>
                <span className="text-[10px] font-heading font-bold line-clamp-2 block min-h-[28px]">{prod.nama}</span>
                <span className="text-[10px] text-[#7B61FF] font-extrabold block mt-1">{formatRp(prod.hargaJual)}</span>
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-[9px] font-bold ${prod.stok <= prod.stokMin ? "text-amber-500" : "text-slate-400"}`}>
                    {prod.stok <= prod.stokMin && <AlertTriangle className="w-3 h-3 inline mr-0.5" />}{prod.stok}
                  </span>
                  {inCart && <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-[#7B61FF] text-white font-bold">{inCart.qty}</span>}
                </div>
              </button>
            );
          })}
          {filteredProducts.length === 0 && <div className="col-span-3 text-center py-6 text-slate-400 text-xs animate-fade-in"><Package className="w-5 h-5 mx-auto mb-2 opacity-40" />Tidak ada produk</div>}
        </div>
      </Section>

      {gridCart.length > 0 && (
        <Section title={`Keranjang (${gridCart.length})`}>
          <div className="space-y-1.5">
            {gridCart.map(item => (
              <div key={item.productId} className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-heading font-bold line-clamp-1">{item.namaItem}</p>
                  <p className="text-[9px] text-slate-400">{formatRp(item.hargaSatuan)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => updateGridQty(item.productId, -1)} className="p-1 bg-slate-100 dark:bg-zinc-800 rounded-full"><Minus className="w-3 h-3" /></button>
                  <span className="text-[11px] font-extrabold min-w-[20px] text-center">{item.qty}</span>
                  <button onClick={() => updateGridQty(item.productId, 1)} className="p-1 bg-slate-100 dark:bg-zinc-800 rounded-full"><Plus className="w-3 h-3" /></button>
                  <button onClick={() => removeGridItem(item.productId)} className="p-1 text-rose-500 ml-1"><Trash2 className="w-3 h-3" /></button>
                </div>
                <span className="text-[10px] font-extrabold text-[#7B61FF] ml-2 tabular-nums">{formatRp(item.qty * item.hargaSatuan)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
            <span className="text-xs font-heading font-bold text-slate-400">Total</span>
            <span className="text-lg font-heading font-extrabold gradient-text">{formatRp(gridTotal)}</span>
          </div>
        </Section>
      )}
    </>
  );
}
