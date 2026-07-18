"use client";

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLiveQuery } from "@/hooks/useLiveQuery";
import { db, type UnitId, type Inventory, type DbInventoryMutation } from "@/lib/db-v4";
import { showToast } from "@/lib/toast";
import KalkulatorHarga from "@/components/business/kalkulator-harga";
import { SkeletonCard } from "@/components/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Package, Search, ArrowRightLeft, Pencil, Trash2, X, Save, History, ArrowDown, ArrowUp, Calculator, AlertTriangle, RotateCcw } from "lucide-react";

const BRANCH_MAP: Record<string, UnitId> = {
  pribadi: "pribadi",
  keluarga: "keluarga",
  percetakan: "usaha-percetakan",
  laptop: "usaha-laptop",
  gadget: "usaha-gadget",
  warkop: "usaha-warkop",
  konveksi: "usaha-konveksi",
  kelontong: "usaha-kelontong",
  "toko-pakaian": "usaha-toko-pakaian",
};

interface FormData {
  nama: string;
  hargaJual: number;
  hargaModal: number;
  stok: number;
  stokMin: number;
  kategori: string;
  catatan: string;
  sku: string;
  satuan: string;
}

const emptyForm: FormData = {
  nama: "",
  hargaJual: 0,
  hargaModal: 0,
  stok: 0,
  stokMin: 2,
  kategori: "",
  catatan: "",
  sku: "",
  satuan: "pcs",
};

export default function InventoryPage() {
  const params = useParams();
  const router = useRouter();
  const cabangSlug = (params?.cabang as string) || "";
  const bookOrBranchId: UnitId = BRANCH_MAP[cabangSlug] || "usaha-warkop";

  const _products =
    useLiveQuery(
      () => db.inventory.where("bookOrBranchId").equals(bookOrBranchId).toArray(),
      [bookOrBranchId]
    );
  const products = _products || [];
  if (_products === undefined) return <SkeletonCard count={5} />;

  const mutations =
    useLiveQuery(
      () => db.inventoryMutations.where("bookOrBranchId").equals(bookOrBranchId).reverse().toArray(),
      [bookOrBranchId]
    ) || [];

  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "low" | "out" | "mutasi">("all");
  const [sortField, setSortField] = useState<"nama" | "stok" | "hargaJual">("nama");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [selectedMutasi, setSelectedMutasi] = useState<string | null>(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockAdjustProduct, setStockAdjustProduct] = useState<Inventory | null>(null);
  const [stockForm, setStockForm] = useState<{ tipe: "masuk" | "keluar"; qty: number; alasan: string }>({ tipe: "masuk", qty: 1, alasan: "" });
  const [showCalculator, setShowCalculator] = useState(false);

  const filtered = useMemo(() => {
    let result = products.filter((p) =>
      p.nama.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (filterMode === "low") result = result.filter((p) => p.stok <= p.stokMin && p.stok > 0);
    if (filterMode === "out") result = result.filter((p) => p.stok === 0);
    result.sort((a, b) => {
      if (sortField === "nama") return a.nama.localeCompare(b.nama);
      if (sortField === "stok") return a.stok - b.stok;
      return b.hargaJual - a.hargaJual;
    });
    return result;
  }, [products, searchQuery, filterMode, sortField]);

  const totalValue = useMemo(() => {
    return products.reduce((sum, p) => sum + p.hargaModal * p.stok, 0);
  }, [products]);

  const lowStockProducts = useMemo(() => {
    return products.filter((p) => p.stok <= p.stokMin);
  }, [products]);

  const productMutations = useMemo(() => {
    if (!selectedMutasi) return [];
    return mutations.filter((m) => m.itemId === selectedMutasi);
  }, [mutations, selectedMutasi]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (p: Inventory) => {
    setEditingId(p.id);
    setForm({
      nama: p.nama,
      hargaJual: p.hargaJual,
      hargaModal: p.hargaModal,
      stok: p.stok,
      stokMin: p.stokMin,
      kategori: p.kategori,
      catatan: p.catatan,
      sku: p.sku,
      satuan: p.satuan,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama) return;

    const now = new Date().toISOString();

    if (editingId) {
      await db.inventory.update(editingId, {
        nama: form.nama,
        hargaJual: form.hargaJual,
        hargaModal: form.hargaModal,
        stok: form.stok,
        stokMin: form.stokMin,
        kategori: form.kategori,
        catatan: form.catatan,
        sku: form.sku,
        satuan: form.satuan,
        updatedAt: now,
      });
    } else {
      await db.inventory.add({
        id: crypto.randomUUID(),
        bookOrBranchId,
        unitId: bookOrBranchId,
        sku: form.sku,
        nama: form.nama,
        kategori: form.kategori,
        stok: form.stok,
        stokMin: form.stokMin,
        hargaModal: form.hargaModal,
        hargaJual: form.hargaJual,
        satuan: form.satuan,
        catatan: form.catatan,
        createdAt: now,
        updatedAt: now,
      });
    }

    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus produk ini?")) return;
    await db.inventory.delete(id);
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockAdjustProduct || stockForm.qty <= 0) return;
    const now = new Date().toISOString();
    const qty = stockForm.tipe === "masuk" ? stockForm.qty : -stockForm.qty;
    const stokSebelum = stockAdjustProduct.stok;
    const stokSesudah = Math.max(0, stokSebelum + qty);
    await db.inventory.update(stockAdjustProduct.id, { stok: stokSesudah, updatedAt: now });
    await db.inventoryMutations.add({
      id: crypto.randomUUID(),
      bookOrBranchId,
      itemId: stockAdjustProduct.id,
      tipe: stockForm.tipe,
      qty: stockForm.qty,
      stokSebelum,
      stokSesudah,
      alasan: stockForm.alasan,
      createdAt: now,
    });
    showToast.success("Stok berhasil disesuaikan");
    setShowStockModal(false);
    setStockAdjustProduct(null);
  };

  const selectedProduct = useMemo(() => {
    if (!selectedMutasi) return null;
    return products.find((p) => p.id === selectedMutasi) || null;
  }, [selectedMutasi, products]);

  return (
    <div className="flex-1 flex flex-col pt-4 space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push(`/buku-usaha/${cabangSlug}`)}
          className="p-2 bg-white dark:bg-[#131527] rounded-full shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-lg font-extrabold tracking-tight">Inventaris</h1>
        <button
          onClick={openAdd}
          className="p-2 bg-gradient-to-r from-[#008CEB] to-[#00C9A7] text-white rounded-full shadow-md"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="premium-card premium-card-glow p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#008CEB] to-[#00C9A7] flex items-center justify-center text-white shadow-md">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-heading font-extrabold">{products.length} Produk</span>
            <p className="text-[9px] text-slate-400 font-medium">Total inventaris</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[9px] text-slate-400 font-medium">Total Nilai Stok</span>
          <p className="text-xs font-heading font-extrabold text-[#008CEB]">Rp{totalValue.toLocaleString()}</p>
        </div>
      </div>

      {lowStockProducts.length > 0 && (
        <div className="premium-card p-3 border-amber-300/50 bg-amber-50/50 dark:bg-amber-950/20">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-bold">
            <AlertTriangle className="w-4 h-4" />
            {lowStockProducts.length} produk dengan stok menipis
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {lowStockProducts.slice(0, 5).map(p => (
              <span key={p.id} className="text-[9px] bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-full font-bold">
                {p.nama}: {p.stok}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Cari produk..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white dark:bg-[#131527] border border-slate-200/60 dark:border-slate-800/60 focus:outline-none text-sm shadow-inner"
          />
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 flex-1">
            {(["all", "low", "out", "mutasi"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => { setFilterMode(mode); if (mode !== "mutasi") setSelectedMutasi(null); }}
                className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                  filterMode === mode
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "bg-slate-100 dark:bg-zinc-800 text-slate-400"
                }`}
              >
                {mode === "all" ? "Semua" : mode === "low" ? "Stok Tipis" : mode === "out" ? "Habis" : "Riwayat Stok"}
              </button>
            ))}
          </div>
          {filterMode !== "mutasi" && (
            <button
              onClick={() => setSortField(sortField === "nama" ? "stok" : sortField === "stok" ? "hargaJual" : "nama")}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center gap-1"
            >
              <ArrowRightLeft className="w-5 h-5 text-slate-400" />
              <span className="text-[10px] font-bold text-slate-400">
                {sortField === "nama" ? "Nama" : sortField === "stok" ? "Stok" : "Harga"}
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[400px] pr-1">
        {filterMode === "mutasi" ? (
          <>
            {selectedMutasi && selectedProduct ? (
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedMutasi(null)}
                  className="flex items-center gap-1.5 text-xs text-[#008CEB] font-bold mb-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Kembali ke semua riwayat
                </button>
                <div className="premium-card premium-card-glow p-3">
                  <h4 className="text-xs font-heading font-bold">{selectedProduct.nama}</h4>
                  <p className="text-[10px] text-slate-400">Stok saat ini: {selectedProduct.stok}</p>
                </div>
              </div>
            ) : null}
            {(() => {
              const displayMutations = selectedMutasi ? productMutations : mutations;
              if (displayMutations.length === 0) {
                return (
                  <div className="text-center py-12 text-slate-400 text-xs animate-fade-in">
                    <History className="w-5 h-5 mx-auto mb-3 opacity-40" />
                    Belum ada riwayat mutasi stok.
                  </div>
                );
              }
              return displayMutations.map((m, i) => {
                const product = products.find((p) => p.id === m.itemId);
                return (
                  <div
                    key={m.id}
                    className="premium-card premium-card-glow p-3 animate-slide-up"
                    style={{ animationDelay: `${i * 50}ms`, animationFillMode: "backwards" }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          m.tipe === "masuk"
                            ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500"
                            : m.tipe === "keluar"
                            ? "bg-rose-50 dark:bg-rose-950/30 text-rose-500"
                            : "bg-amber-50 dark:bg-amber-950/30 text-amber-500"
                        }`}>
                          {m.tipe === "masuk" ? <ArrowDown className="w-3.5 h-3.5" /> : m.tipe === "keluar" ? <ArrowUp className="w-3.5 h-3.5" /> : <History className="w-3.5 h-3.5" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-extrabold ${
                              m.tipe === "masuk" ? "text-emerald-500" : m.tipe === "keluar" ? "text-rose-500" : "text-amber-500"
                            }`}>
                              {m.tipe === "masuk" ? "Masuk" : m.tipe === "keluar" ? "Keluar" : "Penyesuaian"}
                            </span>
                            {product && (
                              <button
                                onClick={() => setSelectedMutasi(m.itemId)}
                                className="text-[10px] text-[#008CEB] font-bold truncate max-w-[120px] hover:underline"
                              >
                                {product.nama}
                              </button>
                            )}
                          </div>
                          <p className="text-[9px] text-slate-400">
                            {new Date(m.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className={`text-[11px] font-extrabold ${
                          m.tipe === "masuk" ? "text-emerald-500" : "text-rose-500"
                        }`}>
                          {m.tipe === "masuk" ? "+" : "-"}{m.qty}
                        </p>
                        <p className="text-[9px] text-slate-400">
                          Stok: {m.stokSesudah}
                        </p>
                      </div>
                    </div>
                    {m.alasan && (
                      <p className="text-[9px] text-slate-400 mt-1.5 ml-9">
                        {m.alasan}
                      </p>
                    )}
                  </div>
                );
              });
            })()}
          </>
        ) : (
          filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs animate-fade-in">
              <Package className="w-5 h-5 mx-auto mb-3 opacity-40" />
              {products.length === 0 ? "Belum ada produk. Tap + untuk menambah." : "Tidak ditemukan."}
            </div>
          ) : (
            filtered.map((p, i) => (
              <div key={p.id} className="premium-card premium-card-glow p-3 flex items-center justify-between animate-slide-up" style={{ animationDelay: `${i * 50}ms`, animationFillMode: "backwards" }}>
                <button
                  onClick={() => setSelectedMutasi(p.id)}
                  className="flex-1 min-w-0 text-left"
                >
                  <h4 className="text-xs font-heading font-bold line-clamp-1">{p.nama}</h4>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[10px] text-[#008CEB] font-extrabold">
                      Rp{p.hargaJual.toLocaleString()}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${p.stok <= p.stokMin ? "bg-amber-50 dark:bg-amber-950/30 text-amber-500" : "text-slate-400"}`}>
                      Stok: {p.stok}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      HPP: Rp{p.hargaModal.toLocaleString()}
                    </span>
                  </div>
                </button>
                <div className="flex gap-1.5 shrink-0 ml-2">
                  <button
                    onClick={() => openEdit(p)}
                    className="p-1.5 bg-slate-100 dark:bg-zinc-800 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors duration-200 active:scale-90"
                  >
                    <Pencil className="w-4 h-4 text-slate-500" />
                  </button>
                  <button
                    onClick={() => { setStockAdjustProduct(p); setStockForm({ tipe: "masuk", qty: 1, alasan: "" }); setShowStockModal(true); }}
                    className="p-1.5 bg-slate-100 dark:bg-zinc-800 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors duration-200 active:scale-90"
                  >
                    <RotateCcw className="w-4 h-4 text-slate-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-1.5 bg-rose-50 dark:bg-rose-950/30 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-colors duration-200 active:scale-90"
                  >
                    <Trash2 className="w-4 h-4 text-rose-500" />
                  </button>
                </div>
              </div>
            ))
          )
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-md bg-white dark:bg-[#131527] rounded-2xl p-5 pb-8 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-extrabold">
                  {editingId ? "Edit Produk" : "Tambah Produk Baru"}
                </h3>
                <button
                  onClick={() => { setShowModal(false); setEditingId(null); }}
                  className="p-1 rounded-full bg-slate-100 dark:bg-zinc-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-3 text-xs">
                <div>
                  <label className="block mb-1 font-bold text-slate-400">SKU</label>
                  <input
                    type="text"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-400">Nama Produk</label>
                  <input
                    type="text"
                    value={form.nama}
                    onChange={(e) => setForm({ ...form, nama: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 font-bold text-slate-400">Harga Jual (Rp)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={form.hargaJual || ""}
                        onChange={(e) => setForm({ ...form, hargaJual: Number(e.target.value) })}
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none"
                        required
                      />
                      <button type="button" onClick={() => setShowCalculator(true)} className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-400 hover:text-[#008CEB] shrink-0">
                        <Calculator className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1 font-bold text-slate-400">HPP/Modal (Rp)</label>
                    <input
                      type="number"
                      value={form.hargaModal || ""}
                      onChange={(e) => setForm({ ...form, hargaModal: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 font-bold text-slate-400">Stok Saat Ini</label>
                    <input
                      type="number"
                      value={form.stok}
                      onChange={(e) => setForm({ ...form, stok: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-bold text-slate-400">Stok Minimum</label>
                    <input
                      type="number"
                      value={form.stokMin}
                      onChange={(e) => setForm({ ...form, stokMin: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 font-bold text-slate-400">Kategori</label>
                    <input
                      type="text"
                      value={form.kategori}
                      onChange={(e) => setForm({ ...form, kategori: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none"
                      placeholder="Makanan, Minuman, dll..."
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-bold text-slate-400">Satuan</label>
                    <input
                      type="text"
                      value={form.satuan}
                      onChange={(e) => setForm({ ...form, satuan: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none"
                      placeholder="pcs, kg, liter..."
                    />
                  </div>
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-400">Catatan</label>
                  <textarea
                    rows={2}
                    value={form.catatan}
                    onChange={(e) => setForm({ ...form, catatan: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none"
                    placeholder="SN, warna, ukuran, dll..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#008CEB] to-[#00C9A7] text-white font-extrabold text-xs shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingId ? "Simpan Perubahan" : "Tambah Produk"}
                </button>
              </form>

              {editingId && productMutations.length > 0 && (
                <div className="border-t pt-4 border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-extrabold mb-3 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-slate-400" />
                    Mutasi Stok
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {productMutations.map((m) => (
                      <div key={m.id} className="flex items-center justify-between bg-slate-50 dark:bg-zinc-800/50 rounded-xl px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                            m.tipe === "masuk"
                              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500"
                              : m.tipe === "keluar"
                              ? "bg-rose-50 dark:bg-rose-950/30 text-rose-500"
                              : "bg-amber-50 dark:bg-amber-950/30 text-amber-500"
                          }`}>
                            {m.tipe === "masuk" ? <ArrowDown className="w-3 h-3" /> : m.tipe === "keluar" ? <ArrowUp className="w-3 h-3" /> : <History className="w-3 h-3" />}
                          </div>
                          <div>
                            <span className={`text-[10px] font-extrabold ${
                              m.tipe === "masuk" ? "text-emerald-500" : m.tipe === "keluar" ? "text-rose-500" : "text-amber-500"
                            }`}>
                              {m.tipe === "masuk" ? "Masuk" : m.tipe === "keluar" ? "Keluar" : "Penyesuaian"}
                            </span>
                            <p className="text-[9px] text-slate-400">
                              {new Date(m.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <p className={`text-[10px] font-extrabold ${
                            m.tipe === "masuk" ? "text-emerald-500" : "text-rose-500"
                          }`}>
                            {m.tipe === "masuk" ? "+" : "-"}{m.qty}
                          </p>
                          <p className="text-[9px] text-slate-400">Stok: {m.stokSesudah}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Kalkulator Harga Modal */}
      <AnimatePresence>
        {showCalculator && (
          <KalkulatorHarga
            onResult={(hargaJual) => {
              setForm({ ...form, hargaJual });
              setShowCalculator(false);
            }}
            onClose={() => setShowCalculator(false)}
            hargaModal={form.hargaModal}
          />
        )}
      </AnimatePresence>

      {/* Modal Sesuaikan Stok */}
      <AnimatePresence>
        {showStockModal && stockAdjustProduct && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-sm bg-white dark:bg-[#131527] rounded-2xl p-5 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-extrabold">Sesuaikan Stok</h3>
                <button
                  onClick={() => { setShowStockModal(false); setStockAdjustProduct(null); }}
                  className="p-1 rounded-full bg-slate-100 dark:bg-zinc-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="text-xs">
                <p className="font-bold">{stockAdjustProduct.nama}</p>
                <p className="text-slate-400 mt-0.5">Stok saat ini: {stockAdjustProduct.stok}</p>
              </div>
              <form onSubmit={handleAdjustStock} className="space-y-3 text-xs">
                <div className="flex gap-2">
                  {(["masuk", "keluar"] as const).map((tipe) => (
                    <button
                      key={tipe}
                      type="button"
                      onClick={() => setStockForm({ ...stockForm, tipe })}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all ${
                        stockForm.tipe === tipe
                          ? tipe === "masuk"
                            ? "bg-emerald-500 text-white"
                            : "bg-rose-500 text-white"
                          : "bg-slate-100 dark:bg-zinc-800 text-slate-400"
                      }`}
                    >
                      {tipe === "masuk" ? "Masuk" : "Keluar"}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-400">Jumlah</label>
                  <input
                    type="number"
                    value={stockForm.qty || ""}
                    onChange={(e) => setStockForm({ ...stockForm, qty: Math.max(0, Number(e.target.value)) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none"
                    required
                    min="1"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-400">Alasan (opsional)</label>
                  <input
                    type="text"
                    value={stockForm.alasan}
                    onChange={(e) => setStockForm({ ...stockForm, alasan: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none"
                    placeholder="Stok opname, retur, dll..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#008CEB] to-[#00C9A7] text-white font-extrabold text-xs shadow-lg active:scale-[0.98] transition-transform"
                >
                  Simpan
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
