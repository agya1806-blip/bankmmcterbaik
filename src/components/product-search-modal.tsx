"use client";

import { useState, useEffect, useRef } from "react";
import { db, type DbInventoryItem } from "@/lib/db-v4";
import { Package, Search, Plus, X, AlertTriangle } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: { id: string; nama: string; hargaJual: number; qty: number }) => void;
  bookOrBranchId: string;
}

export default function ProductSearchModal({ isOpen, onClose, onSelect, bookOrBranchId }: Props) {
  const [items, setItems] = useState<DbInventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSearch("");
    setLoading(true);
    db.inventory
      .where("bookOrBranchId")
      .equals(bookOrBranchId)
      .toArray()
      .then((data) => {
        setItems(data);
        setLoading(false);
      });
  }, [isOpen, bookOrBranchId]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const filtered = search.trim()
    ? items.filter((i) => i.nama.toLowerCase().includes(search.toLowerCase()))
    : items;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-lg bg-white/95 dark:bg-[var(--card)]/95 backdrop-blur-2xl border border-border/50 shadow-2xl sm:rounded-2xl rounded-t-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Package className="size-4 text-emerald-500" />
            <h2 className="text-sm font-semibold font-heading">Cari Produk</h2>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center size-9 rounded-xl hover:bg-muted/50 transition-colors text-muted-foreground active:scale-90"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-4 pb-0">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama produk..."
              className="input-premium pl-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="text-center py-8 text-sm text-muted-foreground/60">Memuat...</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground/60">
              <AlertTriangle className="size-6" />
              <p className="text-sm">Produk tidak ditemukan</p>
            </div>
          ) : (
            filtered.map((item) => {
              const habis = item.stok <= 0;
              return (
                <div
                  key={item.id}
                  className="floating-card p-3 flex items-center gap-3"
                >
                  <div className="size-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                    <Package className="size-4 text-muted-foreground/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.nama}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground/70">
                        Stok: {item.stok} {item.satuan}
                      </span>
                      {habis && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-500">
                          Habis
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-emerald-500 mt-0.5">
                      Rp {item.hargaJual.toLocaleString("id-ID")}
                    </p>
                  </div>
                  {habis ? (
                    <div className="size-9 rounded-xl bg-muted/30 flex items-center justify-center shrink-0">
                      <X className="size-4 text-muted-foreground/30" />
                    </div>
                  ) : (
                    <button
                      onClick={() =>
                        onSelect({ id: item.id, nama: item.nama, hargaJual: item.hargaJual, qty: 1 })
                      }
                      className="size-9 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors flex items-center justify-center shrink-0 active:scale-90"
                    >
                      <Plus className="size-4" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
