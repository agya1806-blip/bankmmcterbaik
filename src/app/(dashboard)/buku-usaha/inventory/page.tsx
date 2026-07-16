"use client";

import React, { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type BookOrBranch, type DbInventoryItem } from "@/lib/db-v4";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Package,
  AlertTriangle,
  X,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const BRANCH_MAP: Record<string, BookOrBranch> = {
  percetakan: "usaha-percetakan",
  laptop: "usaha-laptop",
  gadget: "usaha-gadget",
  warkop: "usaha-warkop",
  kelontong: "usaha-kelontong",
  konveksi: "usaha-konveksi",
  "toko-pakaian": "usaha-toko-pakaian",
};

const CATEGORIES = [
  "Semua", "Umum", "Makanan", "Minuman", "Elektronik",
  "Pakaian", "ATK", "Jasa",
];

interface FormData {
  nama: string;
  stok: number;
  stokMin: number;
  hargaJual: number;
  hargaModal: number;
  kategori: string;
  catatan: string;
}

const emptyForm: FormData = {
  nama: "", stok: 0, stokMin: 2, hargaJual: 0, hargaModal: 0,
  kategori: "Umum", catatan: "",
};

export default function InventoryGlobalPage() {
  const [selectedBranch, setSelectedBranch] =
    useState<BookOrBranch>("usaha-warkop");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);

  const items =
    useLiveQuery(
      () =>
        db.inventory
          .where("bookOrBranchId")
          .equals(selectedBranch)
          .toArray(),
      [selectedBranch]
    ) || [];

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchSearch = item.nama
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchCategory =
        activeCategory === "Semua" || item.kategori === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [items, searchQuery, activeCategory]);

  const lowStockItems = items.filter((item) => item.stok <= item.stokMin);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama) return;

    const now = new Date().toISOString();
    if (editingId) {
      await db.inventory.update(editingId, {
        nama: form.nama,
        stok: form.stok,
        stokMin: form.stokMin,
        hargaJual: form.hargaJual,
        hargaModal: form.hargaModal,
        kategori: form.kategori,
        catatan: form.catatan,
        updatedAt: now,
      });
    } else {
      await db.inventory.add({
        id: crypto.randomUUID(),
        bookOrBranchId: selectedBranch,
        sku: `SKU-${Date.now()}`,
        nama: form.nama,
        stok: form.stok,
        stokMin: form.stokMin,
        hargaJual: form.hargaJual,
        hargaModal: form.hargaModal,
        kategori: form.kategori,
        catatan: form.catatan,
        satuan: "Pcs",
        createdAt: now,
        updatedAt: now,
      });
    }

    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (item: DbInventoryItem) => {
    setForm({
      nama: item.nama,
      stok: item.stok,
      stokMin: item.stokMin,
      hargaJual: item.hargaJual,
      hargaModal: item.hargaModal,
      kategori: item.kategori,
      catatan: item.catatan,
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus produk ini?")) return;
    await db.inventory.delete(id);
  };

  const updateStock = async (id: string, delta: number) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const newStock = Math.max(0, item.stok + delta);
    await db.inventory.update(id, { stok: newStock, updatedAt: new Date().toISOString() });
  };

  return (
    <div className="flex flex-col gap-4 pt-2 pb-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-extrabold tracking-tight">
          Inventaris Barang
        </h1>
        <button
          onClick={() => {
            setForm(emptyForm);
            setEditingId(null);
            setShowForm(true);
          }}
          className="p-2 bg-gradient-to-r from-[#7B61FF] to-[#FF5C00] text-white rounded-full shadow-md active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <select
        value={selectedBranch}
        onChange={(e) => setSelectedBranch(e.target.value as BookOrBranch)}
        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-zinc-900 border-none outline-none font-bold"
      >
        {Object.entries(BRANCH_MAP).map(([slug, id]) => (
          <option key={id} value={id}>
            {slug.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </option>
        ))}
      </select>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Cari produk..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs bg-slate-100 dark:bg-zinc-900 rounded-xl border-none outline-none focus:ring-1 focus:ring-[#7B61FF]"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all ${
              activeCategory === cat
                ? "bg-[#7B61FF] text-white"
                : "bg-slate-100 dark:bg-zinc-900 text-slate-400"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {lowStockItems.length > 0 && (
        <div className="premium-card p-3 border-amber-300/50">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[10px] font-bold text-amber-600">
              {lowStockItems.length} produk stok menipis
            </span>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            <Package className="w-10 h-10 mx-auto mb-2 stroke-[1.5] opacity-30" />
            Belum ada produk
          </div>
        ) : (
          filtered.map((item) => {
            const isLow = item.stok <= item.stokMin;
            return (
              <div
                key={item.id}
                className={`premium-card p-3 flex items-center gap-3 ${
                  isLow ? "border-amber-300/50" : ""
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isLow
                      ? "bg-amber-100 dark:bg-amber-900/30"
                      : "bg-slate-100 dark:bg-zinc-800"
                  }`}
                >
                  {isLow ? (
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  ) : (
                    <Package className="w-4 h-4 text-slate-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-extrabold line-clamp-1">
                    {item.nama}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-[#7B61FF] font-bold">
                      Rp{item.hargaJual.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-400">
                      HPP: Rp{item.hargaModal.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => updateStock(item.id, -1)}
                    className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center active:scale-90"
                  >
                    <span className="text-xs font-bold">-</span>
                  </button>
                  <span
                    className={`text-xs font-extrabold w-8 text-center ${
                      isLow ? "text-rose-500" : ""
                    }`}
                  >
                    {item.stok}
                  </span>
                  <button
                    onClick={() => updateStock(item.id, 1)}
                    className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center active:scale-90"
                  >
                    <span className="text-xs font-bold">+</span>
                  </button>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center backdrop-blur-sm">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="w-full max-w-md bg-white dark:bg-[#131527] rounded-t-[32px] p-5 pb-8 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-extrabold">
                  {editingId ? "Edit Produk" : "Tambah Produk Baru"}
                </h3>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  className="p-1 rounded-full bg-slate-100 dark:bg-zinc-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-3 text-[11px] font-bold">
                <div>
                  <label className="block mb-1 text-slate-400">Nama Produk</label>
                  <input
                    type="text"
                    value={form.nama}
                    onChange={(e) => setForm({ ...form, nama: e.target.value })}
                    placeholder="Contoh: Kaos Polos Hitam"
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 text-slate-400">Harga Jual (Rp)</label>
                    <input
                      type="number"
                      value={form.hargaJual || ""}
                      onChange={(e) => setForm({ ...form, hargaJual: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-slate-400">HPP / Modal (Rp)</label>
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
                    <label className="block mb-1 text-slate-400">Stok</label>
                    <input
                      type="number"
                      value={form.stok}
                      onChange={(e) => setForm({ ...form, stok: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-slate-400">Stok Minimum</label>
                    <input
                      type="number"
                      value={form.stokMin}
                      onChange={(e) => setForm({ ...form, stokMin: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-slate-400">Kategori</label>
                  <select
                    value={form.kategori}
                    onChange={(e) => setForm({ ...form, kategori: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none font-bold"
                  >
                    {CATEGORIES.filter((c) => c !== "Semua").map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-slate-400">Catatan</label>
                  <textarea
                    rows={2}
                    value={form.catatan}
                    onChange={(e) => setForm({ ...form, catatan: e.target.value })}
                    placeholder="Opsional..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#7B61FF] to-[#FF5C00] text-white font-extrabold text-xs shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {editingId ? "Simpan Perubahan" : "Tambah Produk"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
