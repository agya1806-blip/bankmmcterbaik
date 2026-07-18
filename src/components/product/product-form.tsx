"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, History, ArrowDown, ArrowUp } from "lucide-react";
import { type DbInventoryMutation } from "@/lib/db-v4";
import { ProductImageUploader } from "./product-image-uploader";
import { ProductBarcode } from "./product-barcode";
import { ProductCategorySelect } from "./product-category-select";
import { ProductPriceSection } from "./product-price-section";
import { Button } from "@/components/ui/button";

export interface ProductFormData {
  nama: string;
  sku: string;
  barcode: string;
  kategori: string;
  hargaModal: number;
  hargaJual: number;
  stok: number;
  stokMin: number;
  satuan: string;
  fotoUrl: string;
  catatan: string;
}

export const emptyFormData: ProductFormData = {
  nama: "",
  sku: "",
  barcode: "",
  kategori: "",
  hargaModal: 0,
  hargaJual: 0,
  stok: 0,
  stokMin: 2,
  satuan: "pcs",
  fotoUrl: "",
  catatan: "",
};

interface ProductFormProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  editingId: string | null;
  formData: ProductFormData;
  onChange: (data: ProductFormData) => void;
  categories: string[];
  onOpenCalculator: () => void;
  onOpenBarcodeScanner: () => void;
  mutations: DbInventoryMutation[];
}

export function ProductForm({
  open,
  onClose,
  onSave,
  editingId,
  formData,
  onChange,
  categories,
  onOpenCalculator,
  onOpenBarcodeScanner,
  mutations,
}: ProductFormProps) {
  const update = (partial: Partial<ProductFormData>) => onChange({ ...formData, ...partial });

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-lg bg-white dark:bg-[#131527] rounded-2xl p-5 pb-4 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-[#131527] z-10">
              <h3 className="text-sm font-extrabold">
                {editingId ? "Edit Produk" : "Tambah Produk Baru"}
              </h3>
              <button
                onClick={onClose}
                className="p-1 rounded-full bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSave();
              }}
              className="space-y-4 text-xs"
            >
              {/* Informasi Dasar */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Informasi Dasar</h4>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Nama Produk</label>
                  <input
                    type="text"
                    value={formData.nama}
                    onChange={(e) => update({ nama: e.target.value })}
                    className="w-full input-premium mt-1"
                    required
                    placeholder="Nama produk"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">SKU</label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => update({ sku: e.target.value })}
                      className="w-full input-premium mt-1"
                      placeholder="SKU-001"
                    />
                  </div>
                  <ProductBarcode
                    value={formData.barcode}
                    onChange={(v) => update({ barcode: v })}
                    onScan={onOpenBarcodeScanner}
                  />
                </div>
                <ProductCategorySelect
                  value={formData.kategori}
                  onChange={(v) => update({ kategori: v })}
                  categories={categories}
                />
              </div>

              {/* Harga */}
              <ProductPriceSection
                hargaModal={formData.hargaModal}
                hargaJual={formData.hargaJual}
                onHargaModalChange={(v) => update({ hargaModal: v })}
                onHargaJualChange={(v) => update({ hargaJual: v })}
                onOpenCalculator={onOpenCalculator}
              />

              {/* Persediaan */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Persediaan</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Stok Awal</label>
                    <input
                      type="number"
                      value={formData.stok}
                      onChange={(e) => update({ stok: Math.max(0, Number(e.target.value)) })}
                      className="w-full input-premium mt-1"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Minimum Stok</label>
                    <input
                      type="number"
                      value={formData.stokMin}
                      onChange={(e) => update({ stokMin: Math.max(0, Number(e.target.value)) })}
                      className="w-full input-premium mt-1"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Satuan</label>
                    <input
                      type="text"
                      value={formData.satuan}
                      onChange={(e) => update({ satuan: e.target.value })}
                      className="w-full input-premium mt-1"
                      placeholder="pcs, kg, liter..."
                    />
                  </div>
                </div>
              </div>

              {/* Media */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Media</h4>
                <ProductImageUploader
                  fotoUrl={formData.fotoUrl}
                  onFotoChange={(v) => update({ fotoUrl: v })}
                />
              </div>

              {/* Informasi Tambahan */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Informasi Tambahan</h4>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Catatan</label>
                  <textarea
                    rows={2}
                    value={formData.catatan}
                    onChange={(e) => update({ catatan: e.target.value })}
                    className="w-full input-premium mt-1 resize-none"
                    placeholder="SN, warna, ukuran, dll..."
                  />
                </div>
              </div>

              {/* Mutasi Stok (only visible when editing) */}
              {editingId && mutations.length > 0 && (
                <div className="border-t pt-4 border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-extrabold mb-3 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-slate-400" />
                    Mutasi Stok
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {mutations.map((m) => (
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
                          <p className={`text-[10px] font-extrabold ${m.tipe === "masuk" ? "text-emerald-500" : "text-rose-500"}`}>
                            {m.tipe === "masuk" ? "+" : "-"}{m.qty}
                          </p>
                          <p className="text-[9px] text-slate-400">Stok: {m.stokSesudah}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Save Button */}
              <Button type="submit" variant="primary" size="lg" className="w-full">
                <Save className="w-4 h-4" />
                {editingId ? "Simpan Perubahan" : "Tambah Produk"}
              </Button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
