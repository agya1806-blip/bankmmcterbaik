"use client";

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLiveQuery } from "@/hooks/useLiveQuery";
import { db, type UnitId, type Inventory, type DbInventoryMutation, BRANCH_MAP } from "@/lib/db-v4";
import { showToast } from "@/lib/toast";
import { AnimatePresence } from "framer-motion";
import { SkeletonCard } from "@/components/ui/skeleton";
import { Package, Eye, History, X, AlertTriangle } from "lucide-react";
import {
  InventoryHeader,
  InventorySummaryCards,
  InventoryTable,
  InventoryMovementHistory,
  StockAdjustmentModal,
  StockMutationModal,
  StockTransferModal,
  InventoryToolbar,
  InventoryEmptyState,
  type StockFilter,
} from "@/components/inventory";

export default function InventoryPage() {
  const params = useParams();
  const router = useRouter();
  const cabangSlug = (params?.cabang as string) || "";
  const bookOrBranchId: UnitId = BRANCH_MAP[cabangSlug] || "usaha-warkop";

  const _products = useLiveQuery(() => db.inventory.where("bookOrBranchId").equals(bookOrBranchId).toArray(), [bookOrBranchId]);
  const products = _products || [];
  const _mutations = useLiveQuery(() => db.inventoryMutations.where("bookOrBranchId").equals(bookOrBranchId).reverse().toArray(), [bookOrBranchId]) || [];
  const mutations = _mutations || [];

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StockFilter>("all");
  const [showForm, setShowForm] = useState(false);
  const [detailProduct, setDetailProduct] = useState<Inventory | null>(null);
  const [historyProduct, setHistoryProduct] = useState<Inventory | null>(null);
  const [adjustProduct, setAdjustProduct] = useState<Inventory | null>(null);
  const [mutationProduct, setMutationProduct] = useState<{ product: Inventory; tipe: "masuk" | "keluar" } | null>(null);
  const [transferProduct, setTransferProduct] = useState<Inventory | null>(null);
  const [editProduct, setEditProduct] = useState<Inventory | null>(null);

  const counts = useMemo(() => ({
    all: products.length,
    normal: products.filter((p) => p.stok > p.stokMin).length,
    low: products.filter((p) => p.stok <= p.stokMin && p.stok > 0).length,
    out: products.filter((p) => p.stok === 0).length,
  }), [products]);

  const totalStock = useMemo(() => products.reduce((s, p) => s + p.stok, 0), [products]);
  const nilaiPersediaan = useMemo(() => products.reduce((s, p) => s + p.hargaModal * p.stok, 0), [products]);

  const filtered = useMemo(() => {
    let result = products;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) =>
        p.nama.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.barcode || "").toLowerCase().includes(q)
      );
    }
    if (filter === "normal") result = result.filter((p) => p.stok > p.stokMin);
    else if (filter === "low") result = result.filter((p) => p.stok <= p.stokMin && p.stok > 0);
    else if (filter === "out") result = result.filter((p) => p.stok === 0);
    return result;
  }, [products, search, filter]);

  const productMutations = useMemo(() => {
    if (!historyProduct) return [];
    return mutations.filter((m) => m.itemId === historyProduct.id);
  }, [mutations, historyProduct]);

  const lowStockProducts = useMemo(() => products.filter((p) => p.stok <= p.stokMin && p.stok > 0), [products]);

  const openEditForm = (p: Inventory) => {
    setEditProduct(p);
    setShowForm(true);
  };

  /* ─── HANDLERS ─── */

  const handleSaveProduct = async (formData: Partial<Inventory>) => {
    const now = new Date().toISOString();
    if (editProduct) {
      await db.inventory.update(editProduct.id, { ...formData, updatedAt: now });
      showToast.success("Produk diperbarui");
    } else {
      await db.inventory.add({
        id: crypto.randomUUID(), bookOrBranchId, unitId: bookOrBranchId,
        sku: formData.sku || "", barcode: formData.barcode || "",
        nama: formData.nama || "", kategori: formData.kategori || "",
        stok: formData.stok ?? 0, stokMin: formData.stokMin ?? 2,
        hargaModal: formData.hargaModal ?? 0, hargaJual: formData.hargaJual ?? 0,
        satuan: formData.satuan || "pcs", catatan: formData.catatan || "",
        fotoUrl: formData.fotoUrl, createdAt: now, updatedAt: now,
      } as Inventory);
      showToast.success("Produk ditambahkan");
    }
    setShowForm(false);
    setEditProduct(null);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Hapus produk ini? Semua riwayat mutasi stok juga akan terhapus.")) return;
    await db.inventoryMutations.where("itemId").equals(id).delete();
    await db.inventory.delete(id);
    showToast.success("Produk dihapus");
    setDetailProduct(null);
  };

  const handleStockAdjustment = async (productId: string, adjustment: number, alasan: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const now = new Date().toISOString();
    const stokBaru = Math.max(0, product.stok + adjustment);
    await db.inventory.update(productId, { stok: stokBaru, updatedAt: now });
    await db.inventoryMutations.add({
      id: crypto.randomUUID(), bookOrBranchId, itemId: productId,
      tipe: adjustment >= 0 ? "masuk" : "keluar",
      qty: Math.abs(adjustment), stokSebelum: product.stok, stokSesudah: stokBaru,
      alasan, createdAt: now,
    } as DbInventoryMutation);
    showToast.success(`Stok ${adjustment >= 0 ? "ditambah" : "dikurangi"} ${Math.abs(adjustment)}`);
    setAdjustProduct(null);
  };

  const handleStockMutation = async (productId: string, tipe: "masuk" | "keluar", qty: number, alasan: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const now = new Date().toISOString();
    const stokBaru = tipe === "masuk" ? product.stok + qty : Math.max(0, product.stok - qty);
    await db.inventory.update(productId, { stok: stokBaru, updatedAt: now });
    await db.inventoryMutations.add({
      id: crypto.randomUUID(), bookOrBranchId, itemId: productId,
      tipe, qty, stokSebelum: product.stok, stokSesudah: stokBaru,
      alasan, createdAt: now,
    } as DbInventoryMutation);
    showToast.success(`Stok ${tipe === "masuk" ? "masuk" : "keluar"} ${qty}`);
    setMutationProduct(null);
  };

  const handleStockTransfer = async (fromId: string, toId: string, qty: number, alasan: string) => {
    const from = products.find((p) => p.id === fromId);
    const to = products.find((p) => p.id === toId);
    if (!from || !to) return;
    const now = new Date().toISOString();
    await db.inventory.update(fromId, { stok: Math.max(0, from.stok - qty), updatedAt: now });
    await db.inventory.update(toId, { stok: to.stok + qty, updatedAt: now });
    await db.inventoryMutations.add({ id: crypto.randomUUID(), bookOrBranchId, itemId: fromId, tipe: "keluar", qty, stokSebelum: from.stok, stokSesudah: Math.max(0, from.stok - qty), alasan: `Transfer ke ${to.nama}: ${alasan}`, createdAt: now } as DbInventoryMutation);
    await db.inventoryMutations.add({ id: crypto.randomUUID(), bookOrBranchId, itemId: toId, tipe: "masuk", qty, stokSebelum: to.stok, stokSesudah: to.stok + qty, alasan: `Transfer dari ${from.nama}: ${alasan}`, createdAt: now } as DbInventoryMutation);
    showToast.success(`Transfer ${qty} dari ${from.nama} ke ${to.nama}`);
    setTransferProduct(null);
  };

  if (_products === undefined) return <div className="p-4"><SkeletonCard count={5} /></div>;

  return (
    <div className="flex-1 flex flex-col pt-4 space-y-4 pb-8">
      <InventoryHeader
        title="Manajemen Stok"
        productCount={products.length}
        onBack={() => router.push(`/buku-bisnis/${cabangSlug}`)}
        onAdd={() => { setEditProduct(null); setShowForm(true); }}
      />

      <InventorySummaryCards
        totalItems={products.length}
        totalStock={totalStock}
        lowStock={counts.low}
        outOfStock={counts.out}
        nilaiPersediaan={nilaiPersediaan}
      />

      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/20 rounded-2xl p-3 border border-amber-200/50 dark:border-amber-800/30">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-bold">
            <AlertTriangle className="w-4 h-4" />
            {lowStockProducts.length} produk dengan stok menipis
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {lowStockProducts.slice(0, 5).map(p => (
              <span key={p.id} className="text-[9px] bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-full font-bold text-amber-700 dark:text-amber-300">
                {p.nama}: {p.stok}
              </span>
            ))}
          </div>
        </div>
      )}

      <InventoryToolbar
        search={search} onSearchChange={setSearch}
        filter={filter} onFilterChange={setFilter}
        counts={counts}
      />

      {filtered.length === 0 ? (
        <InventoryEmptyState hasFilter={!!search || filter !== "all"} onAdd={() => { setEditProduct(null); setShowForm(true); }} />
      ) : (
        <InventoryTable
          items={filtered}
          onViewDetail={(p) => setDetailProduct(p)}
          onAdjustStock={(p) => setAdjustProduct(p)}
          onViewHistory={(p) => setHistoryProduct(p)}
          onMutasi={(p, t) => setMutationProduct({ product: p, tipe: t })}
        />
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {detailProduct && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-white dark:bg-[#131527] rounded-2xl p-5 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-extrabold flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#008CEB]" /> Detail Produk
                </h3>
                <button onClick={() => setDetailProduct(null)} className="p-1 rounded-full bg-slate-100 dark:bg-zinc-800">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                  {detailProduct.fotoUrl ? <img src={detailProduct.fotoUrl} alt="" className="w-full h-full object-cover" /> : <Package className="w-8 h-8 text-slate-400" />}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-extrabold">{detailProduct.nama}</h4>
                  {detailProduct.sku && <p className="text-[10px] text-slate-400 font-mono">SKU: {detailProduct.sku}</p>}
                  {detailProduct.barcode && <p className="text-[10px] text-slate-400 font-mono">Barcode: {detailProduct.barcode}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/50">
                  <p className="text-[9px] text-slate-400">Kategori</p>
                  <p className="font-bold">{detailProduct.kategori || "-"}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/50">
                  <p className="text-[9px] text-slate-400">Satuan</p>
                  <p className="font-bold">{detailProduct.satuan}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/50">
                  <p className="text-[9px] text-slate-400">Harga Jual</p>
                  <p className="font-bold text-emerald-600">Rp{detailProduct.hargaJual.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/50">
                  <p className="text-[9px] text-slate-400">HPP / Modal</p>
                  <p className="font-bold">Rp{detailProduct.hargaModal.toLocaleString()}</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-[#008CEB]/5 to-[#00C9A7]/5 rounded-2xl p-4">
                <p className="text-[9px] text-slate-400 font-bold uppercase">Ringkasan Stok</p>
                <div className="grid grid-cols-3 gap-3 mt-2 text-center">
                  <div>
                    <p className="text-lg font-extrabold">{detailProduct.stok}</p>
                    <p className="text-[9px] text-slate-400">Stok</p>
                  </div>
                  <div>
                    <p className="text-lg font-extrabold">{detailProduct.stokMin}</p>
                    <p className="text-[9px] text-slate-400">Minimum</p>
                  </div>
                  <div>
                    <p className={`text-lg font-extrabold ${detailProduct.stok <= detailProduct.stokMin ? "text-amber-600" : "text-emerald-600"}`}>
                      {detailProduct.stok === 0 ? "Habis" : detailProduct.stok <= detailProduct.stokMin ? "Menipis" : "Aman"}
                    </p>
                    <p className="text-[9px] text-slate-400">Status</p>
                  </div>
                </div>
              </div>
              {detailProduct.catatan && (
                <div className="text-[10px] text-slate-400">
                  <span className="font-bold text-slate-600 dark:text-slate-300">Catatan:</span> {detailProduct.catatan}
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => { setDetailProduct(null); openEditForm(detailProduct); }}
                  className="flex-1 py-2.5 rounded-xl bg-[#008CEB] text-white font-bold text-xs active:scale-[0.98]">Edit Produk</button>
                <button onClick={() => handleDeleteProduct(detailProduct.id)}
                  className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white font-bold text-xs active:scale-[0.98]">Hapus</button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* History Panel */}
      <AnimatePresence>
        {historyProduct && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-white dark:bg-[#131527] rounded-2xl p-5 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-extrabold flex items-center gap-2">
                  <History className="w-4 h-4 text-[#008CEB]" /> Riwayat Mutasi
                </h3>
                <button onClick={() => setHistoryProduct(null)} className="p-1 rounded-full bg-slate-100 dark:bg-zinc-800">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="text-xs">
                <p className="font-bold">{historyProduct.nama}</p>
                <p className="text-slate-400">Stok saat ini: <strong>{historyProduct.stok}</strong></p>
              </div>
              <InventoryMovementHistory
                mutations={productMutations}
                productName={historyProduct.nama}
              />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Stock Adjustment Modal */}
      <AnimatePresence>
        {adjustProduct && (
          <StockAdjustmentModal
            product={adjustProduct}
            onSave={handleStockAdjustment}
            onClose={() => setAdjustProduct(null)}
          />
        )}
      </AnimatePresence>

      {/* Stock Mutation Modal */}
      <AnimatePresence>
        {mutationProduct && (
          <StockMutationModal
            product={mutationProduct.product}
            tipe={mutationProduct.tipe}
            onSave={handleStockMutation}
            onClose={() => setMutationProduct(null)}
          />
        )}
      </AnimatePresence>

      {/* Stock Transfer Modal */}
      <AnimatePresence>
        {transferProduct && (
          <StockTransferModal
            products={products}
            sourceProduct={transferProduct}
            onSave={handleStockTransfer}
            onClose={() => setTransferProduct(null)}
          />
        )}
      </AnimatePresence>

      {/* Product Form Modal (simple inline for adding/editing basic stock info) */}
      <AnimatePresence>
        {showForm && (
          <ProductFormModal
            product={editProduct}
            onSave={handleSaveProduct}
            onClose={() => { setShowForm(false); setEditProduct(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Inline Product Form (simple CRUD, not full master product) ─── */

function ProductFormModal({
  product, onSave, onClose,
}: {
  product: Inventory | null;
  onSave: (data: Partial<Inventory>) => Promise<void>;
  onClose: () => void;
}) {
  const [nama, setNama] = useState(product?.nama || "");
  const [sku, setSku] = useState(product?.sku || "");
  const [barcode, setBarcode] = useState(product?.barcode || "");
  const [kategori, setKategori] = useState(product?.kategori || "");
  const [satuan, setSatuan] = useState(product?.satuan || "pcs");
  const [hargaJual, setHargaJual] = useState(product?.hargaJual || 0);
  const [hargaModal, setHargaModal] = useState(product?.hargaModal || 0);
  const [stok, setStok] = useState(product?.stok ?? 0);
  const [stokMin, setStokMin] = useState(product?.stokMin ?? 2);
  const [catatan, setCatatan] = useState(product?.catatan || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;
    setLoading(true);
    try {
      await onSave({ nama: nama.trim(), sku, barcode, kategori, satuan, hargaJual, hargaModal, stok, stokMin, catatan });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-[#131527] rounded-2xl p-5 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-extrabold">{product ? "Edit Produk" : "Tambah Produk"}</h3>
          <button onClick={onClose} className="p-1 rounded-full bg-slate-100 dark:bg-zinc-800">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 font-bold text-slate-400">SKU</label>
              <input type="text" value={sku} onChange={(e) => setSku(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none" required />
            </div>
            <div>
              <label className="block mb-1 font-bold text-slate-400">Satuan</label>
              <input type="text" value={satuan} onChange={(e) => setSatuan(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none" placeholder="pcs" />
            </div>
          </div>
          <div>
            <label className="block mb-1 font-bold text-slate-400">Nama Produk</label>
            <input type="text" value={nama} onChange={(e) => setNama(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 font-bold text-slate-400">Kategori</label>
              <input type="text" value={kategori} onChange={(e) => setKategori(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none" placeholder="Makanan, Minuman..." />
            </div>
            <div>
              <label className="block mb-1 font-bold text-slate-400">Barcode</label>
              <input type="text" value={barcode} onChange={(e) => setBarcode(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 font-bold text-slate-400">Harga Jual (Rp)</label>
              <input type="number" value={hargaJual || ""} onChange={(e) => setHargaJual(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none" required />
            </div>
            <div>
              <label className="block mb-1 font-bold text-slate-400">HPP / Modal (Rp)</label>
              <input type="number" value={hargaModal || ""} onChange={(e) => setHargaModal(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 font-bold text-slate-400">Stok Awal</label>
              <input type="number" value={stok} onChange={(e) => setStok(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none" />
            </div>
            <div>
              <label className="block mb-1 font-bold text-slate-400">Stok Minimum</label>
              <input type="number" value={stokMin} onChange={(e) => setStokMin(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block mb-1 font-bold text-slate-400">Catatan</label>
            <textarea rows={2} value={catatan} onChange={(e) => setCatatan(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none" placeholder="SN, warna, ukuran..." />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#008CEB] to-[#00C9A7] text-white font-extrabold text-xs shadow-lg active:scale-[0.98] transition-transform">
            {loading ? "Menyimpan..." : product ? "Simpan Perubahan" : "Tambah Produk"}
          </button>
        </form>
      </div>
    </div>
  );
}
