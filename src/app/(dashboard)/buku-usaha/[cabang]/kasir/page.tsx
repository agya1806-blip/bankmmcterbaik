"use client";

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLiveQuery } from "@/hooks/useLiveQuery";
import { useSessionStore } from "@/store/useSessionStore";
import {
  db, type UnitId, type DbTransaction, type DbCustomer, type DbProduction, type DbInventoryItem,
} from "@/lib/db-v4";
import {
  executeTransactionPipelineV4, type PosCartItem,
} from "@/engine/transaction-pipeline-v4";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, Plus, Trash2, Search, Wallet, FileText,
  ArrowLeft, Edit3, X, Clock, AlertTriangle,
  User, StickyNote, Package, Banknote, Minus,
} from "lucide-react";

const BRANCH_MAP: Record<string, UnitId> = {
  percetakan: "usaha-percetakan", laptop: "usaha-laptop", gadget: "usaha-gadget",
  warkop: "usaha-warkop", konveksi: "usaha-konveksi", kelontong: "usaha-kelontong",
};

const GRID_BRANCHES = ["warkop", "kelontong"];

type TabType = "order" | "riwayat";
type StatusPesanan = "baru" | "diproses" | "selesai";

interface ManualCartItem {
  tempId: string;
  namaItem: string;
  qty: number;
  harga: number;
  hargaModal: number;
}

interface GridCartItem {
  productId: string;
  namaItem: string;
  qty: number;
  hargaSatuan: number;
  hargaModal: number;
}

export default function PosKasirPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useSessionStore();
  const cabangSlug = (params?.cabang as string) || "";
  const bookOrBranchId: UnitId = BRANCH_MAP[cabangSlug] || "usaha-warkop";
  const isGridMode = GRID_BRANCHES.includes(cabangSlug);

  const products = useLiveQuery(() => db.inventory.where("bookOrBranchId").equals(bookOrBranchId).toArray(), [bookOrBranchId]) || [];
  const customers = useLiveQuery(() => db.customers.where("bookOrBranchId").equals(bookOrBranchId).toArray(), [bookOrBranchId]) || [];
  const wallets = useLiveQuery(() => db.wallets.where("bookOrBranchId").equals(bookOrBranchId).filter(w => w.isActive).toArray(), [bookOrBranchId]) || [];
  const transactions = useLiveQuery(() => db.transactions.where("bookOrBranchId").equals(bookOrBranchId).reverse().toArray(), [bookOrBranchId]) || [];
  const productions = useLiveQuery(() => db.productions.where("bookOrBranchId").equals(bookOrBranchId).toArray(), [bookOrBranchId]) || [];

  const [tab, setTab] = useState<TabType>("order");

  // ─── Shared State ───
  const [walletIdTarget, setWalletIdTarget] = useState("");
  const [catatan, setCatatan] = useState("");
  const [dpDibayar, setDpDibayar] = useState(0);
  const [statusPesanan, setStatusPesanan] = useState<StatusPesanan>("baru");
  const [isProcessing, setIsProcessing] = useState(false);

  // ─── Customer State ───
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [manualNama, setManualNama] = useState("");
  const [manualWA, setManualWA] = useState("");
  const [manualAlamat, setManualAlamat] = useState("");
  const [isManual, setIsManual] = useState(false);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers.slice(0, 20);
    const q = customerSearch.toLowerCase();
    return customers.filter(c => c.nama.toLowerCase().includes(q) || c.noWA.includes(q)).slice(0, 20);
  }, [customers, customerSearch]);

  const currentCustomer = useMemo(() => {
    if (isManual) return null;
    return customers.find(c => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId, isManual]);

  const selectCustomer = (c: DbCustomer) => { setSelectedCustomerId(c.id); setCustomerSearch(""); setIsManual(false); };
  const switchToManual = () => { setSelectedCustomerId(""); setIsManual(true); setManualNama(""); setManualWA(""); setManualAlamat(""); };

  // ═══ GRID MODE STATE ═══
  const [gridCart, setGridCart] = useState<GridCartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKategori, setSelectedKategori] = useState("Semua");

  const kategoriList = useMemo(() => {
    const cats = new Set(products.map(p => p.kategori).filter(Boolean));
    return ["Semua", ...Array.from(cats)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = !searchQuery || p.nama.toLowerCase().includes(searchQuery.toLowerCase());
      const matchKategori = selectedKategori === "Semua" || p.kategori === selectedKategori;
      return matchSearch && matchKategori;
    });
  }, [products, searchQuery, selectedKategori]);

  const addProductToGrid = (prod: DbInventoryItem) => {
    setGridCart(prev => {
      const existing = prev.find(i => i.productId === prod.id);
      if (existing) {
        if (existing.qty >= prod.stok) return prev;
        return prev.map(i => i.productId === prod.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { productId: prod.id, namaItem: prod.nama, qty: 1, hargaSatuan: prod.hargaJual, hargaModal: prod.hargaModal }];
    });
  };

  const updateGridQty = (productId: string, delta: number) => {
    setGridCart(prev => prev.map(i => {
      if (i.productId !== productId) return i;
      const newQty = i.qty + delta;
      return newQty > 0 ? { ...i, qty: newQty } : null;
    }).filter(Boolean) as GridCartItem[]);
  };

  const removeGridItem = (productId: string) => setGridCart(prev => prev.filter(i => i.productId !== productId));
  const clearGridCart = () => setGridCart([]);

  const gridTotal = useMemo(() => gridCart.reduce((s, i) => s + i.qty * i.hargaSatuan, 0), [gridCart]);

  // ═══ MANUAL MODE STATE ═══
  const [manualCart, setManualCart] = useState<ManualCartItem[]>([]);
  const [spesifikasi, setSpesifikasi] = useState("");

  const addManualItem = () => setManualCart(prev => [...prev, { tempId: crypto.randomUUID(), namaItem: "", qty: 1, harga: 0, hargaModal: 0 }]);
  const updateManualItem = (tempId: string, field: keyof ManualCartItem, value: string | number) => setManualCart(prev => prev.map(i => i.tempId === tempId ? { ...i, [field]: value } : i));
  const removeManualItem = (tempId: string) => setManualCart(prev => prev.filter(i => i.tempId !== tempId));
  const manualTotal = useMemo(() => manualCart.reduce((s, i) => s + i.qty * i.harga, 0), [manualCart]);

  // ═══ SHARED ═══
  const grandTotal = isGridMode ? gridTotal : manualTotal;
  const sisaTagihan = Math.max(0, grandTotal - dpDibayar);

  const handleCheckout = async () => {
    if (isGridMode && gridCart.length === 0) return alert("Keranjang kosong!");
    if (!isGridMode && manualCart.length === 0) return alert("Belum ada item!");
    if (!isGridMode && manualCart.some(i => !i.namaItem.trim())) return alert("Nama item harus diisi!");
    if (!walletIdTarget) return alert("Pilih dompet penerima!");
    if (isProcessing) return;

    const namaPelanggan = isManual ? manualNama.trim() : currentCustomer?.nama || "";
    const waPelanggan = isManual ? manualWA.trim() : currentCustomer?.noWA || "";
    if (!namaPelanggan) return alert("Nama pelanggan harus diisi!");

    setIsProcessing(true);
    try {
      const items: PosCartItem[] = isGridMode
        ? gridCart.map(i => ({ namaItem: i.namaItem, qty: i.qty, hargaSatuan: i.hargaSatuan, hargaModal: i.hargaModal, diskonPersen: 0, spesifikasi: "" }))
        : manualCart.map(i => ({ namaItem: i.namaItem.trim(), qty: i.qty, hargaSatuan: i.harga, hargaModal: i.hargaModal, diskonPersen: 0, spesifikasi }));

      const res = await executeTransactionPipelineV4({
        id: crypto.randomUUID(),
        bookOrBranchId,
        userId: currentUser?.id || "system",
        items,
        totalBruto: grandTotal,
        diskonGlobalPersen: 0,
        ppnPersen: 0,
        dpDibayar,
        sedekahNominal: 0,
        paymentMethod: "CASH",
        walletIdTarget,
        customerNama: namaPelanggan,
        customerWA: waPelanggan,
        catatan: catatan || statusPesanan,
      });

      if (res.ok) {
        alert(`Berhasil! Invoice: ${res.invoiceNumber}`);
        resetForm();
      } else {
        alert(`Gagal: ${res.error}`);
      }
    } catch (err: unknown) {
      alert(`Gagal: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setGridCart([]);
    setManualCart([]);
    setSpesifikasi("");
    setCatatan("");
    setDpDibayar(0);
    setWalletIdTarget("");
    setStatusPesanan("baru");
    setSelectedCustomerId("");
    setIsManual(false);
    setManualNama(""); setManualWA(""); setManualAlamat("");
  };

  // ─── Edit / Delete ───
  const [editingTx, setEditingTx] = useState<DbTransaction | null>(null);
  const [editCatatan, setEditCatatan] = useState("");
  const [editDp, setEditDp] = useState(0);

  const startEdit = (tx: DbTransaction) => { setEditingTx(tx); setEditCatatan(tx.catatan); setEditDp(tx.dpDibayar); };

  const saveEdit = async () => {
    if (!editingTx) return;
    const newSisa = Math.max(0, editingTx.grandTotal - editDp);
    await db.transactions.update(editingTx.id, { dpDibayar: editDp, sisaTagihan: newSisa, status: newSisa > 0 ? "DP" : "LUNAS", catatan: editCatatan });
    setEditingTx(null);
  };

  const deleteTx = async (tx: DbTransaction) => {
    if (!confirm(`Hapus ${tx.invoiceNumber}?`)) return;
    await db.transactions.delete(tx.id);
    const prod = productions.find(p => p.transactionId === tx.id);
    if (prod) await db.productions.delete(prod.id);
  };

  const getProdStatus = (txId: string) => {
    const prod = productions.find(p => p.transactionId === txId);
    if (!prod) return "";
    return prod.status === "antre" ? "Baru" : prod.status === "diproduksi" ? "Diproses" : "Selesai";
  };

  const formatRp = (n: number) => `Rp${n.toLocaleString()}`;
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

  const [showInvoice, setShowInvoice] = useState<DbTransaction | null>(null);

  return (
    <div className="flex-1 flex flex-col pt-4 gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.push("/buku-usaha")} className="p-2 bg-white dark:bg-[#131527] rounded-full shadow-md active:scale-95 transition-transform">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-lg font-heading font-extrabold tracking-tight capitalize">Kasir {cabangSlug}</h1>
        <div className="w-9" />
      </div>

      {/* Tab */}
      <div className="flex gap-2">
        {([["order", "Order Baru"], ["riwayat", "Riwayat"]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className={`flex-1 py-2 rounded-xl text-[11px] font-heading font-bold transition-all ${tab === key ? "bg-gradient-to-r from-[#7B61FF] to-[#FF5C00] text-white shadow-md" : "bg-white dark:bg-[#131527] text-slate-400 border border-slate-200/60 dark:border-slate-800/60"}`}>{label}</button>
        ))}
      </div>

      {tab === "order" ? (
        <div className="flex-1 flex flex-col gap-3 overflow-y-auto pb-24">
          {/* PELANGGAN */}
          <Section title="Pelanggan">
            {isManual ? (
              <div className="space-y-2">
                <input type="text" placeholder="Nama pelanggan *" value={manualNama} onChange={e => setManualNama(e.target.value)} className="w-full input-premium text-xs" />
                <input type="tel" placeholder="No. WhatsApp" value={manualWA} onChange={e => setManualWA(e.target.value)} className="w-full input-premium text-xs" />
                <input type="text" placeholder="Alamat" value={manualAlamat} onChange={e => setManualAlamat(e.target.value)} className="w-full input-premium text-xs" />
                <button onClick={() => { setIsManual(false); setSelectedCustomerId(""); }} className="text-[10px] text-[#7B61FF] font-bold">Cari dari daftar</button>
              </div>
            ) : currentCustomer ? (
              <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded-xl">
                <div>
                  <p className="text-xs font-heading font-bold">{currentCustomer.nama}</p>
                  <p className="text-[9px] text-slate-400">{currentCustomer.noWA || "Tanpa WA"}</p>
                </div>
                <button onClick={() => { setSelectedCustomerId(""); setCustomerSearch(""); }} className="text-rose-500 p-1"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Cari nama atau WA..." value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} className="w-full pl-9 pr-4 input-premium text-xs" />
                </div>
                {filteredCustomers.length > 0 && (
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {filteredCustomers.map(c => (
                      <button key={c.id} onClick={() => selectCustomer(c)} className="w-full text-left p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all">
                        <p className="text-[11px] font-bold">{c.nama}</p>
                        <p className="text-[9px] text-slate-400">{c.noWA}</p>
                      </button>
                    ))}
                  </div>
                )}
                {!isGridMode && (
                  <button onClick={switchToManual} className="w-full py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-[10px] font-bold text-slate-500 flex items-center justify-center gap-1">
                    <Plus className="w-3 h-3" /> Input Manual
                  </button>
                )}
              </div>
            )}
          </Section>

          {isGridMode ? (
            /* ═══ GRID MODE (Warkop / Kelontong) ═══ */
            <>
              <Section title="Produk">
                <div className="relative mb-2">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Cari produk..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 input-premium text-xs" />
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
                  {filteredProducts.length === 0 && <p className="col-span-3 text-center py-6 text-slate-400 text-xs">Tidak ada produk</p>}
                </div>
              </Section>

              {/* Grid Cart */}
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
          ) : (
            /* ═══ MANUAL MODE (Percetakan / Laptop / Gadget / Konveksi) ═══ */
            <>
              <Section title="Item Pesanan">
                <div className="space-y-2">
                  {manualCart.map(item => (
                    <div key={item.tempId} className="bg-slate-50 dark:bg-zinc-800/50 p-2.5 rounded-xl space-y-2">
                      <div className="flex items-start gap-2">
                        <input type="text" placeholder="Nama item *" value={item.namaItem} onChange={e => updateManualItem(item.tempId, "namaItem", e.target.value)} className="flex-1 input-premium text-xs" />
                        <button onClick={() => removeManualItem(item.tempId)} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg shrink-0"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <label className="text-[8px] text-slate-400 font-bold uppercase">Qty</label>
                          <input type="number" min="1" value={item.qty} onChange={e => updateManualItem(item.tempId, "qty", Math.max(1, Number(e.target.value)))} className="w-full input-premium text-xs text-center" />
                        </div>
                        <div className="flex-1">
                          <label className="text-[8px] text-slate-400 font-bold uppercase">Harga</label>
                          <input type="number" min="0" value={item.harga || ""} onChange={e => updateManualItem(item.tempId, "harga", Number(e.target.value))} placeholder="0" className="w-full input-premium text-xs text-right" />
                        </div>
                        <div className="flex-1">
                          <label className="text-[8px] text-slate-400 font-bold uppercase">Subtotal</label>
                          <div className="w-full input-premium text-xs text-right font-extrabold text-[#7B61FF]">{formatRp(item.qty * item.harga)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={addManualItem} className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-400 flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform hover:border-[#7B61FF] hover:text-[#7B61FF]">
                    <Plus className="w-4 h-4" /> Tambah Item
                  </button>
                </div>
              </Section>

              {manualCart.length > 0 && (
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
          )}

          {/* SHARED: Catatan, DP, Status, Dompet */}
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
              {wallets.length === 0 && <p className="col-span-2 text-center text-[10px] text-slate-400 py-2">Belum ada dompet</p>}
            </div>
          </Section>

          <button onClick={handleCheckout} disabled={isProcessing || grandTotal === 0} className="w-full py-3.5 rounded-2xl btn-primary text-sm font-heading font-extrabold disabled:opacity-50 active:scale-[0.97] transition-transform">
            {isProcessing ? "Memproses..." : `Simpan Orderan${grandTotal > 0 ? ` • ${formatRp(grandTotal)}` : ""}`}
          </button>
        </div>
      ) : (
        /* ═══ RIWAYAT TAB ═══ */
        <div className="flex-1 overflow-y-auto pb-24 space-y-2">
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">Belum ada transaksi</div>
          ) : transactions.map(tx => (
            <div key={tx.id} className="premium-card p-3 space-y-2">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-heading font-bold line-clamp-1">{tx.invoiceNumber}</p>
                  <p className="text-[10px] text-slate-400">{tx.customerNama} • {formatDate(tx.tanggal)}</p>
                </div>
                <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold shrink-0 ${tx.status === "LUNAS" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>{tx.status}</span>
              </div>
              <div className="space-y-1">
                {tx.items.map((item, idx) => (
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
                  <button onClick={() => setShowInvoice(tx)} className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-blue-500"><FileText className="w-3.5 h-3.5" /></button>
                  <button onClick={() => startEdit(tx)} className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-500"><Edit3 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => deleteTx(tx)} className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {editingTx && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4" onClick={() => setEditingTx(null)}>
            <motion.div initial={{ y: 200 }} animate={{ y: 0 }} exit={{ y: 200 }} onClick={e => e.stopPropagation()} className="w-full max-w-md bg-white dark:bg-[#131527] rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-heading font-extrabold">Edit Transaksi</h3>
              <p className="text-[10px] text-slate-400">{editingTx.invoiceNumber}</p>
              <div>
                <label className="text-[9px] text-slate-400 font-bold uppercase">Catatan</label>
                <textarea value={editCatatan} onChange={e => setEditCatatan(e.target.value)} rows={2} className="w-full input-premium text-xs resize-none mt-1" />
              </div>
              <div>
                <label className="text-[9px] text-slate-400 font-bold uppercase">DP (Rp)</label>
                <input type="number" value={editDp} onChange={e => setEditDp(Number(e.target.value))} className="w-full input-premium text-xs mt-1" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditingTx(null)} className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs font-bold">Batal</button>
                <button onClick={saveEdit} className="flex-1 py-2.5 rounded-xl btn-primary text-xs font-bold">Simpan</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invoice Modal */}
      <AnimatePresence>
        {showInvoice && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4" onClick={() => setShowInvoice(null)}>
            <motion.div initial={{ y: 200 }} animate={{ y: 0 }} exit={{ y: 200 }} onClick={e => e.stopPropagation()} className="w-full max-w-md bg-white dark:bg-[#131527] rounded-2xl p-4 space-y-3 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-heading font-extrabold">Invoice</h3>
                <button onClick={() => setShowInvoice(null)} className="p-1"><X className="w-4 h-4" /></button>
              </div>
              <div className="bg-slate-50 dark:bg-zinc-800 rounded-xl p-4 space-y-3 text-xs" id="invoice-print">
                <div className="text-center border-b border-slate-200 dark:border-slate-700 pb-3">
                  <p className="font-heading font-extrabold text-sm gradient-text">MMCBANK</p>
                  <p className="text-[9px] text-slate-400 capitalize">{cabangSlug}</p>
                </div>
                <div className="space-y-1">
                  <p className="flex justify-between"><span className="text-slate-400">Invoice</span><span className="font-bold">{showInvoice.invoiceNumber}</span></p>
                  <p className="flex justify-between"><span className="text-slate-400">Tanggal</span><span className="font-bold">{formatDate(showInvoice.tanggal)}</span></p>
                  <p className="flex justify-between"><span className="text-slate-400">Pelanggan</span><span className="font-bold">{showInvoice.customerNama}</span></p>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-2 space-y-1.5">
                  {showInvoice.items.map((item, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between"><span className="font-bold">{item.namaItem}</span><span>{formatRp(item.subtotal)}</span></div>
                      <p className="text-[9px] text-slate-400">{item.qty} x {formatRp(item.hargaSatuan)}</p>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-2 space-y-1">
                  <div className="flex justify-between"><span className="text-slate-400">Total</span><span className="font-extrabold text-sm">{formatRp(showInvoice.grandTotal)}</span></div>
                  {showInvoice.dpDibayar > 0 && <>
                    <div className="flex justify-between"><span className="text-slate-400">DP</span><span className="font-bold">{formatRp(showInvoice.dpDibayar)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Sisa</span><span className="font-bold text-amber-500">{formatRp(showInvoice.sisaTagihan)}</span></div>
                  </>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setShowInvoice(null)} className="py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs font-bold">Tutup</button>
                <button onClick={() => { const el = document.getElementById("invoice-print"); if (el) { navigator.clipboard.writeText(el.innerText); alert("Disalin ke clipboard!"); } }} className="py-2.5 rounded-xl btn-primary text-xs font-bold">Salin Teks</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="premium-card p-3 space-y-2">
      <span className="text-[10px] font-heading font-extrabold uppercase tracking-wider text-slate-400">{title}</span>
      {children}
    </div>
  );
}
