"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLiveQuery } from "@/hooks/useLiveQuery";
import { db, type UnitId, type Inventory, BRANCH_MAP } from "@/lib/db-v4";
import { showToast } from "@/lib/toast";
import { productService, inventoryService } from "@/services";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  ProductSearch,
  ProductFilter,
  type StockFilter,
  ProductStockSummary,
  ProductEmptyState,
  ProductTable,
  type SortField,
  type SortDir,
  ProductForm,
  type ProductFormData,
  emptyFormData,
} from "@/components/product";
import KalkulatorHarga from "@/components/business/kalkulator-harga";
import BarcodeScanner from "@/components/business/barcode-scanner";
import { Plus, ArrowLeft } from "lucide-react";

export default function MasterProdukPage() {
  const params = useParams();
  const router = useRouter();
  const cabangSlug = (params?.cabang as string) || "";
  const bookOrBranchId: UnitId = BRANCH_MAP[cabangSlug] || "usaha-warkop";

  const _products = useLiveQuery(
    () => productService.getByBranch(bookOrBranchId),
    [bookOrBranchId]
  );
  const products = _products || [];

  const mutations = useLiveQuery(
    () => inventoryService.getMutations(bookOrBranchId),
    [bookOrBranchId]
  ) || [];

  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortField, setSortField] = useState<SortField>("nama");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(emptyFormData);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockAdjustProduct, setStockAdjustProduct] = useState<Inventory | null>(null);
  const [stockForm, setStockForm] = useState<{ tipe: "masuk" | "keluar"; qty: number; alasan: string }>({
    tipe: "masuk",
    qty: 1,
    alasan: "",
  });

  const pageSize = 20;

  const categories = useMemo(() => {
    const unique = new Set(products.map((p) => p.kategori).filter(Boolean));
    return Array.from(unique).sort();
  }, [products]);

  const filtered = useMemo(() => {
    let result = [...products];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.nama.toLowerCase().includes(q) ||
          p.barcode?.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.kategori.toLowerCase().includes(q)
      );
    }

    if (stockFilter === "active") result = result.filter((p) => p.stok > 0);
    else if (stockFilter === "inactive") result = result.filter((p) => p.stok === 0);
    else if (stockFilter === "low") result = result.filter((p) => p.stok <= p.stokMin && p.stok > 0);
    else if (stockFilter === "out") result = result.filter((p) => p.stok === 0);

    if (categoryFilter) result = result.filter((p) => p.kategori === categoryFilter);

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === "nama") cmp = a.nama.localeCompare(b.nama);
      else if (sortField === "stok") cmp = a.stok - b.stok;
      else if (sortField === "hargaJual") cmp = a.hargaJual - b.hargaJual;
      else if (sortField === "hargaModal") cmp = a.hargaModal - b.hargaModal;
      else if (sortField === "kategori") cmp = a.kategori.localeCompare(b.kategori);
      else if (sortField === "sku") cmp = a.sku.localeCompare(b.sku);
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [products, searchQuery, stockFilter, categoryFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const totalActive = useMemo(() => products.filter((p) => p.stok > 0).length, [products]);
  const totalInactive = useMemo(() => products.filter((p) => p.stok === 0).length, [products]);
  const totalLowStock = useMemo(() => products.filter((p) => p.stok <= p.stokMin && p.stok > 0).length, [products]);

  const productMutations = useMemo(() => {
    if (!editingId) return [];
    return mutations.filter((m) => m.itemId === editingId);
  }, [mutations, editingId]);

  const handleSort = useCallback((field: SortField) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortDir("asc");
      return field;
    });
  }, []);

  const openAddForm = () => {
    setEditingId(null);
    setFormData(emptyFormData);
    setShowForm(true);
  };

  const openEditForm = (p: Inventory) => {
    setEditingId(p.id);
    setFormData({
      nama: p.nama,
      sku: p.sku,
      barcode: p.barcode || "",
      kategori: p.kategori,
      hargaModal: p.hargaModal,
      hargaJual: p.hargaJual,
      stok: p.stok,
      stokMin: p.stokMin,
      satuan: p.satuan,
      fotoUrl: p.fotoUrl || "",
      catatan: p.catatan,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.nama) return showToast.error("Nama produk harus diisi");

    const now = new Date().toISOString();

    try {
      if (editingId) {
        await productService.update(editingId, {
          nama: formData.nama,
          sku: formData.sku,
          barcode: formData.barcode || "",
          kategori: formData.kategori,
          hargaModal: formData.hargaModal,
          hargaJual: formData.hargaJual,
          stok: formData.stok,
          stokMin: formData.stokMin,
          satuan: formData.satuan,
          catatan: formData.catatan,
          fotoUrl: formData.fotoUrl || undefined,
        });
        showToast.success("Produk berhasil diperbarui");
      } else {
        await productService.create(formData, bookOrBranchId);
        showToast.success("Produk berhasil ditambahkan");
      }

      setShowForm(false);
      setEditingId(null);
      setFormData(emptyFormData);
    } catch {
      showToast.error("Gagal menyimpan produk");
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteTargetId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await db.inventory.delete(deleteTargetId);
      showToast.success("Produk berhasil dihapus");
      setSelectedIds((prev) => prev.filter((i) => i !== deleteTargetId));
    } catch {
      showToast.error("Gagal menghapus produk");
    }
    setShowDeleteConfirm(false);
    setDeleteTargetId(null);
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      await db.inventory.bulkDelete(ids);
      showToast.success(`${ids.length} produk berhasil dihapus`);
      setSelectedIds([]);
    } catch {
      showToast.error("Gagal menghapus produk");
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockAdjustProduct || stockForm.qty <= 0) return;
    const now = new Date().toISOString();
    const qty = stockForm.tipe === "masuk" ? stockForm.qty : -stockForm.qty;
    const stokSebelum = stockAdjustProduct.stok;
    const stokSesudah = Math.max(0, stokSebelum + qty);
    try {
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
    } catch {
      showToast.error("Gagal menyesuaikan stok");
    }
  };

  const handleExport = () => {
    const headers = ["Nama", "SKU", "Barcode", "Kategori", "Harga Modal", "Harga Jual", "Stok", "Min Stok", "Satuan", "Catatan"];
    const rows = filtered.map((p) => [
      p.nama,
      p.sku,
      p.barcode || "",
      p.kategori,
      p.hargaModal.toString(),
      p.hargaJual.toString(),
      p.stok.toString(),
      p.stokMin.toString(),
      p.satuan,
      p.catatan,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `produk-${cabangSlug}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast.success("Data produk berhasil diexport");
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  if (_products === undefined) {
    return (
      <div className="flex-1 flex flex-col pt-4 space-y-4 p-4">
        <Skeleton variant="card" count={3} />
      </div>
    );
  }

  const hasFilter = searchQuery !== "" || stockFilter !== "all" || categoryFilter !== "";

  return (
    <div className="flex-1 flex flex-col pt-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push(`/buku-usaha/${cabangSlug}`)}
          className="p-2 bg-white dark:bg-[#131527] rounded-full shadow-md hover:shadow-lg transition-shadow"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-lg font-extrabold tracking-tight">Master Produk</h1>
        <Button variant="primary" size="icon-sm" onClick={openAddForm}>
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* Summary Cards */}
      <ProductStockSummary
        total={products.length}
        active={totalActive}
        inactive={totalInactive}
        lowStock={totalLowStock}
      />

      {/* Search + Filter */}
      <div className="space-y-2">
        <ProductSearch value={searchQuery} onChange={(v) => { setSearchQuery(v); setPage(1); }} />
        <ProductFilter
          stockFilter={stockFilter}
          onStockFilterChange={(v) => { setStockFilter(v); setPage(1); }}
          selectedCategory={categoryFilter}
          onCategoryChange={(v) => { setCategoryFilter(v); setPage(1); }}
          categories={categories}
        />
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <ProductEmptyState hasFilter={hasFilter} onAdd={openAddForm} />
      ) : (
        <ProductTable
          products={paginated}
          sortField={sortField}
          sortDir={sortDir}
          onSort={handleSort}
          page={page}
          pageSize={pageSize}
          total={filtered.length}
          onPageChange={handlePageChange}
          onEdit={openEditForm}
          onDelete={handleDelete}
          onAdjustStock={(p) => {
            setStockAdjustProduct(p);
            setStockForm({ tipe: "masuk", qty: 1, alasan: "" });
            setShowStockModal(true);
          }}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onBulkDelete={handleBulkDelete}
          onExport={handleExport}
        />
      )}

      {/* Product Form Modal */}
      <ProductForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditingId(null); }}
        onSave={handleSave}
        editingId={editingId}
        formData={formData}
        onChange={setFormData}
        categories={categories}
        onOpenCalculator={() => setShowCalculator(true)}
        onOpenBarcodeScanner={() => setShowBarcodeScanner(true)}
        mutations={productMutations}
      />

      {/* Barcode Scanner */}
      {showBarcodeScanner && (
        <BarcodeScanner
          onScan={(barcode) => {
            setFormData((prev) => ({ ...prev, barcode }));
            setShowBarcodeScanner(false);
            productService.getByBarcode(barcode, bookOrBranchId).then((existing) => {
              if (existing) openEditForm(existing);
            });
          }}
          onClose={() => setShowBarcodeScanner(false)}
        />
      )}

      {/* Kalkulator Harga */}
      {showCalculator && (
        <KalkulatorHarga
          onResult={(hargaJual) => {
            setFormData((prev) => ({ ...prev, hargaJual }));
            setShowCalculator(false);
          }}
          onClose={() => setShowCalculator(false)}
          hargaModal={formData.hargaModal}
        />
      )}

      {/* Confirm Delete */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setDeleteTargetId(null); }}
        onConfirm={confirmDelete}
        title="Hapus Produk"
        message="Produk yang dihapus tidak dapat dikembalikan."
        confirmLabel="Hapus"
        confirmVariant="danger"
      />

      {/* Stock Adjustment Modal */}
      {showStockModal && stockAdjustProduct && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-[#131527] rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-extrabold">Sesuaikan Stok</h3>
              <button
                onClick={() => { setShowStockModal(false); setStockAdjustProduct(null); }}
                className="p-1 rounded-full bg-slate-100 dark:bg-zinc-800"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
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
              <Button type="submit" variant="primary" size="lg" className="w-full">
                Simpan
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
