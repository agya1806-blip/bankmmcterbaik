"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLiveQuery } from "@/hooks/useLiveQuery";
import { useSessionStore } from "@/store/useSessionStore";
import {
  db, type UnitId, type DbTransaction, type DbCustomer, type DbInventoryItem, BRANCH_MAP,
} from "@/lib/db-v4";
import {
  executeTransactionPipelineV4, type PosCartItem,
} from "@/engine/transaction-pipeline-v4";
import { executeCancelTransaction } from "@/engine/cancel-transaction";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, Plus, X, Star } from "lucide-react";
import { showToast } from "@/lib/toast";
import KalkulatorHarga from "@/components/business/kalkulator-harga";
import BarcodeScanner from "@/components/business/barcode-scanner";
import InvoiceA4 from "@/components/invoice-a4";
import { SkeletonCard } from "@/components/skeleton";
import PosProductGrid from "@/components/business/pos-product-grid";
import type { GridCartItem } from "@/components/business/pos-product-grid";
import PosManualForm from "@/components/business/pos-manual-form";
import type { ManualCartItem } from "@/components/business/pos-manual-form";
import PosCartPanel from "@/components/business/pos-cart-panel";
import type { CartItemSummary } from "@/components/business/pos-cart-panel";
import PosOrderHistory from "@/components/business/pos-order-history";

const GRID_BRANCHES = ["warkop", "kelontong"];

export default function PosKasirPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useSessionStore();
  const cabangSlug = (params?.cabang as string) || "";
  const bookOrBranchId: UnitId = BRANCH_MAP[cabangSlug] || "usaha-warkop";
  const isGridMode = GRID_BRANCHES.includes(cabangSlug);

  // ─── Data Queries ───
  const _products = useLiveQuery(() => db.inventory.where("bookOrBranchId").equals(bookOrBranchId).toArray(), [bookOrBranchId]);
  const _customers = useLiveQuery(() => db.customers.where("bookOrBranchId").equals(bookOrBranchId).toArray(), [bookOrBranchId]);
  const _wallets = useLiveQuery(() => db.wallets.where("bookOrBranchId").equals(bookOrBranchId).filter(w => w.isActive).toArray(), [bookOrBranchId]);
  const products = _products || [];
  const customers = _customers || [];
  const wallets = _wallets || [];
  const transactions: DbTransaction[] = useLiveQuery(() => db.transactions.where("bookOrBranchId").equals(bookOrBranchId).reverse().toArray(), [bookOrBranchId]) || [];
  const productions = useLiveQuery(() => db.productions.where("bookOrBranchId").equals(bookOrBranchId).toArray(), [bookOrBranchId]) || [];
  const profiles = useLiveQuery(() => db.profiles.where("bookOrBranchId").equals(bookOrBranchId).toArray(), [bookOrBranchId]) || [];
  const profile = profiles[0];

  if (_products === undefined || _customers === undefined || _wallets === undefined) return <SkeletonCard count={5} />;

  // ─── Tab ───
  const [tab, setTab] = useState<"order" | "riwayat">("order");

  // ─── Shared State ───
  const [walletIdTarget, setWalletIdTarget] = useState("");
  const [catatan, setCatatan] = useState("");
  const [dpDibayar, setDpDibayar] = useState(0);
  const [poinDigunakan, setPoinDigunakan] = useState(0);
  const [sedekahNominal, setSedekahNominal] = useState(0);
  const [statusPesanan, setStatusPesanan] = useState<"baru" | "diproses" | "selesai">("baru");
  const [isProcessing, setIsProcessing] = useState(false);

  // ─── Customer State ───
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [manualNama, setManualNama] = useState("");
  const [manualWA, setManualWA] = useState("");
  const [manualAlamat, setManualAlamat] = useState("");
  const [isManual, setIsManual] = useState(false);

  // ─── Grid Mode State ───
  const [gridCart, setGridCart] = useState<GridCartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKategori, setSelectedKategori] = useState("Semua");

  // ─── Manual Mode State ───
  const [manualCart, setManualCart] = useState<ManualCartItem[]>([]);
  const [spesifikasi, setSpesifikasi] = useState("");
  const [calculatorItemId, setCalculatorItemId] = useState<string | null>(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  // ─── Edit State ───
  const [editingTx, setEditingTx] = useState<DbTransaction | null>(null);
  const [editCatatan, setEditCatatan] = useState("");
  const [editDp, setEditDp] = useState(0);
  const [showInvoice, setShowInvoice] = useState<DbTransaction | null>(null);

  // ─── Computed ───
  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers.slice(0, 20);
    const q = customerSearch.toLowerCase();
    return customers.filter(c => c.nama.toLowerCase().includes(q) || c.noWA.includes(q)).slice(0, 20);
  }, [customers, customerSearch]);

  const currentCustomer = useMemo(() => {
    if (isManual) return null;
    return customers.find(c => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId, isManual]);

  const kategoriList = useMemo(() => {
    const cats = new Set(products.map(p => p.kategori).filter(Boolean));
    return ["Semua", ...Array.from(cats)];
  }, [products]);

  const gridTotal = useMemo(() => gridCart.reduce((s, i) => s + i.qty * i.hargaSatuan, 0), [gridCart]);
  const manualTotal = useMemo(() => manualCart.reduce((s, i) => s + i.qty * i.harga, 0), [manualCart]);

  const diskonPoin = poinDigunakan * 100;
  const grandTotal = Math.max(0, (isGridMode ? gridTotal : manualTotal) - diskonPoin);
  const sisaTagihan = Math.max(0, grandTotal - dpDibayar);

  const cartItemsSummary: CartItemSummary[] = useMemo(() => {
    if (isGridMode) return gridCart.map(i => ({ id: i.productId, nama: i.namaItem, qty: i.qty, subtotal: i.qty * i.hargaSatuan }));
    return manualCart.map(i => ({ id: i.tempId, nama: i.namaItem, qty: i.qty, subtotal: i.qty * i.harga }));
  }, [isGridMode, gridCart, manualCart]);

  const hasItems = isGridMode ? gridCart.length > 0 : manualCart.length > 0;

  // ─── Customer Handlers ───
  const selectCustomer = (c: DbCustomer) => { setSelectedCustomerId(c.id); setCustomerSearch(""); setIsManual(false); };
  const switchToManual = () => { setSelectedCustomerId(""); setIsManual(true); setManualNama(""); setManualWA(""); setManualAlamat(""); };

  // ─── Grid Handlers ───
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

  // ─── Manual Handlers ───
  const addManualItem = () => setManualCart(prev => [...prev, { tempId: crypto.randomUUID(), namaItem: "", qty: 1, harga: 0, hargaModal: 0 }]);
  const updateManualItem = (tempId: string, field: keyof ManualCartItem, value: string | number) => setManualCart(prev => prev.map(i => i.tempId === tempId ? { ...i, [field]: value } : i));
  const removeManualItem = (tempId: string) => setManualCart(prev => prev.filter(i => i.tempId !== tempId));
  const handleRemoveCartItem = (id: string) => { if (isGridMode) removeGridItem(id); else removeManualItem(id); };

  // ═══ Checkout ═══
  const handleCheckout = async () => {
    if (isGridMode && gridCart.length === 0) return showToast.error("Keranjang kosong!");
    if (!isGridMode && manualCart.length === 0) return showToast.error("Belum ada item!");
    if (!isGridMode && manualCart.some(i => !i.namaItem.trim())) return showToast.error("Nama item harus diisi!");
    if (!walletIdTarget) return showToast.error("Pilih dompet penerima!");
    if (isProcessing) return;

    const namaPelanggan = isManual ? manualNama.trim() : currentCustomer?.nama || "";
    const waPelanggan = isManual ? manualWA.trim() : currentCustomer?.noWA || "";
    if (!namaPelanggan) return showToast.error("Nama pelanggan harus diisi!");

    setIsProcessing(true);
    try {
      const currentPeriod = new Date().toISOString().slice(0, 7);
      const existingPeriod = await db.periods
        .where({ bookOrBranchId, periode: currentPeriod, status: "closed" })
        .first();
      if (existingPeriod) {
        showToast.error(`Periode ${currentPeriod} sudah ditutup! Buka tutupan terlebih dahulu.`);
        setIsProcessing(false);
        return;
      }

      const items: PosCartItem[] = isGridMode
        ? gridCart.map(i => ({ namaItem: i.namaItem, qty: i.qty, hargaSatuan: i.hargaSatuan, hargaModal: i.hargaModal, diskonPersen: 0, spesifikasi: "" }))
        : manualCart.map(i => ({ namaItem: i.namaItem.trim(), qty: i.qty, hargaSatuan: i.harga, hargaModal: i.hargaModal, diskonPersen: 0, spesifikasi }));

      const res = await executeTransactionPipelineV4({
        id: crypto.randomUUID(), bookOrBranchId, userId: currentUser?.id || "system",
        items, totalBruto: grandTotal, diskonGlobalPersen: 0, ppnPersen: 0, dpDibayar,
        sedekahNominal, sedekahType: "infakTerikat", paymentMethod: "CASH", walletIdTarget,
        customerNama: namaPelanggan, customerWA: waPelanggan, catatan: catatan || statusPesanan,
      });

      if (res.ok) {
        if (currentCustomer) {
          const poinBaru = Math.max(0, currentCustomer.poin - poinDigunakan) + Math.floor(grandTotal / 10000);
          await db.customers.update(currentCustomer.id, {
            totalTransaksi: currentCustomer.totalTransaksi + 1, totalBelanja: currentCustomer.totalBelanja + grandTotal,
            poin: poinBaru, terakhirTransaksi: new Date().toISOString(),
          });
        } else if (isManual && manualNama.trim() && manualWA.trim()) {
          const existing = await db.customers.where("bookOrBranchId").equals(bookOrBranchId).filter(c => c.noWA === manualWA.trim()).first();
          if (existing) {
            const poinBaru = Math.max(0, existing.poin - poinDigunakan) + Math.floor(grandTotal / 10000);
            await db.customers.update(existing.id, {
              totalTransaksi: existing.totalTransaksi + 1, totalBelanja: existing.totalBelanja + grandTotal,
              poin: poinBaru, terakhirTransaksi: new Date().toISOString(),
            });
          } else {
            if (customers.find(c => c.nama.toLowerCase() === manualNama.trim().toLowerCase())) return void showToast.error("Nama pelanggan sudah ada");
            await db.customers.add({
              id: crypto.randomUUID(), bookOrBranchId, nama: manualNama.trim(), noWA: manualWA.trim(),
              totalTransaksi: 1, totalBelanja: grandTotal, poin: Math.floor(grandTotal / 10000),
              terakhirTransaksi: new Date().toISOString(), createdAt: new Date().toISOString(),
            });
          }
        }
        showToast.success(`Berhasil! Invoice: ${res.invoiceNumber}`);
        resetForm();
      } else {
        showToast.error(`Gagal: ${res.error}`);
      }
    } catch (err: unknown) {
      showToast.error(`Gagal: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setGridCart([]); setManualCart([]); setSpesifikasi(""); setCatatan("");
    setDpDibayar(0); setPoinDigunakan(0); setSedekahNominal(0); setWalletIdTarget("");
    setStatusPesanan("baru"); setSelectedCustomerId(""); setIsManual(false);
    setManualNama(""); setManualWA(""); setManualAlamat("");
  };

  const handleCancelOrder = () => {
    if (hasItems && confirm("Batalkan pesanan? Semua item akan hilang.")) { resetForm(); localStorage.removeItem(DRAFT_KEY); }
  };

  // ─── Edit / Delete ───
  const startEdit = (tx: DbTransaction) => { setEditingTx(tx); setEditCatatan(tx.catatan); setEditDp(tx.dpDibayar); };
  const saveEdit = async () => {
    if (!editingTx) return;
    const newSisa = Math.max(0, editingTx.grandTotal - editDp);
    await db.transactions.update(editingTx.id, { dpDibayar: editDp, sisaTagihan: newSisa, status: newSisa > 0 ? "DP" : "LUNAS", catatan: editCatatan });
    setEditingTx(null);
  };
  const deleteTx = async (tx: DbTransaction) => {
    if (!confirm(`Batalkan ${tx.invoiceNumber}? Stok, dompet, dan piutang akan dikembalikan.`)) return;
    setIsProcessing(true);
    try {
      const res = await executeCancelTransaction({
        transactionId: tx.id, unitId: bookOrBranchId, userId: currentUser?.id || "system",
        userName: currentUser?.nama || "System", alasan: "Dihapus dari kasir",
      });
      if (res.ok) showToast.success("Transaksi dibatalkan!");
      else showToast.error(`Gagal: ${res.error}`);
    } catch (err: unknown) {
      showToast.error(`Gagal: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally { setIsProcessing(false); }
  };

  const getProdStatus = (txId: string) => {
    const prod = productions.find(p => p.transactionId === txId);
    if (!prod) return "";
    return prod.status === "antre" ? "Baru" : prod.status === "diproduksi" ? "Diproses" : "Selesai";
  };

  const formatRp = (n: number) => `Rp${n.toLocaleString()}`;
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

  // ─── Draft Persistence ───
  const DRAFT_KEY = `kasir_draft_${bookOrBranchId}`;
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.gridCart?.length > 0 || draft.manualCart?.length > 0) {
          if (draft.isGridMode) setGridCart(draft.gridCart || []);
          else { setManualCart(draft.manualCart || []); setSpesifikasi(draft.spesifikasi || ""); }
          setSelectedCustomerId(draft.selectedCustomerId || "");
          setDpDibayar(draft.dpDibayar || 0);
          setCatatan(draft.catatan || "");
          showToast.success("Draft dipulihkan");
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (hasItems) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ isGridMode, gridCart, manualCart, spesifikasi, selectedCustomerId, dpDibayar, catatan }));
    } else {
      localStorage.removeItem(DRAFT_KEY);
    }
  }, [isGridMode, gridCart, manualCart, spesifikasi, selectedCustomerId, dpDibayar, catatan]);

  // ─── Keyboard Shortcuts ───
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); if (hasItems && grandTotal > 0) handleCheckout(); }
      if (e.key === "Escape") resetForm();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isGridMode, gridCart, manualCart, grandTotal, hasItems]);

  // ═══ RENDER ═══
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
          {/* Pelanggan */}
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
                  {currentCustomer.poin > 0 && (
                    <p className="text-[9px] text-amber-500 font-bold flex items-center gap-1 mt-0.5">
                      <Star className="w-3 h-3" /> Poin: {currentCustomer.poin.toLocaleString()}
                    </p>
                  )}
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
            <PosProductGrid
              products={products}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              setShowBarcodeScanner={setShowBarcodeScanner}
              kategoriList={kategoriList}
              selectedKategori={selectedKategori}
              setSelectedKategori={setSelectedKategori}
              gridCart={gridCart}
              updateGridQty={updateGridQty}
              removeGridItem={removeGridItem}
              gridTotal={gridTotal}
              addProductToGrid={addProductToGrid}
            />
          ) : (
            <PosManualForm
              items={manualCart}
              onAdd={addManualItem}
              onRemove={removeManualItem}
              onUpdate={updateManualItem}
              spesifikasi={spesifikasi}
              setSpesifikasi={setSpesifikasi}
              manualTotal={manualTotal}
              onOpenCalculator={setCalculatorItemId}
            />
          )}

          <PosCartPanel
            cartItems={cartItemsSummary}
            onRemoveItem={handleRemoveCartItem}
            onCheckout={handleCheckout}
            onCancel={handleCancelOrder}
            grandTotal={grandTotal}
            hasItems={hasItems}
            isProcessing={isProcessing}
            catatan={catatan}
            setCatatan={setCatatan}
            dpDibayar={dpDibayar}
            setDpDibayar={setDpDibayar}
            sedekahNominal={sedekahNominal}
            setSedekahNominal={setSedekahNominal}
            poinDigunakan={poinDigunakan}
            setPoinDigunakan={setPoinDigunakan}
            statusPesanan={statusPesanan}
            setStatusPesanan={setStatusPesanan}
            walletIdTarget={walletIdTarget}
            setWalletIdTarget={setWalletIdTarget}
            wallets={wallets}
            customers={customers}
            selectedCustomerId={selectedCustomerId}
            sisaTagihan={sisaTagihan}
          />
        </div>
      ) : (
        <PosOrderHistory
          transactions={transactions}
          getProdStatus={getProdStatus}
          formatRp={formatRp}
          formatDate={formatDate}
          onViewInvoice={(tx) => setShowInvoice(tx)}
          onEdit={(tx) => startEdit(tx)}
          onDelete={(tx) => deleteTx(tx)}
        />
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {editingTx && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditingTx(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={e => e.stopPropagation()} className="w-full max-w-md bg-white dark:bg-[#131527] rounded-2xl p-4 space-y-3">
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

      {/* Invoice A4 Modal */}
      {showInvoice && (
        <InvoiceA4
          transaction={showInvoice}
          wallet={wallets.find(w => w.id === showInvoice.walletIdTarget)}
          profile={profile}
          cabangSlug={cabangSlug}
          onClose={() => setShowInvoice(null)}
          onPrint={() => window.print()}
        />
      )}

      {/* Barcode Scanner Modal */}
      {showBarcodeScanner && (
        <BarcodeScanner
          onScan={(barcode) => {
            setShowBarcodeScanner(false);
            db.inventory.where("bookOrBranchId").equals(bookOrBranchId).filter(p => p.barcode === barcode).first().then(found => {
              if (found) {
                if (isGridMode) addProductToGrid(found);
                else setManualCart(prev => [...prev, { tempId: crypto.randomUUID(), namaItem: found.nama, qty: 1, harga: found.hargaJual, hargaModal: found.hargaModal }]);
                showToast.success(`Produk ditemukan: ${found.nama}`);
              } else showToast.error("Produk dengan barcode tersebut tidak ditemukan");
            });
          }}
          onClose={() => setShowBarcodeScanner(false)}
        />
      )}

      {/* Kalkulator Harga Modal */}
      <AnimatePresence>
        {calculatorItemId && (
          <KalkulatorHarga
            onResult={(hargaJual) => { updateManualItem(calculatorItemId, "harga", hargaJual); setCalculatorItemId(null); }}
            onClose={() => setCalculatorItemId(null)}
            hargaModal={manualCart.find(i => i.tempId === calculatorItemId)?.hargaModal}
          />
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
