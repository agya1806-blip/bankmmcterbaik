"use client";
import React from "react";
import { X, Phone, MapPin, Building2, Calendar, FileText, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { DbSupplier, DbPurchaseOrder } from "@/lib/db-v4";
import { SupplierHistory } from "./supplier-history";
import { SupplierProductList } from "./supplier-product-list";

interface ProductSummary {
  namaItem: string;
  totalQty: number;
  totalHarga: number;
}

interface SupplierDetailDrawerProps {
  open: boolean;
  supplier: DbSupplier | null;
  orders: DbPurchaseOrder[];
  products: ProductSummary[];
  onClose: () => void;
  onCall: (kontak: string) => void;
  onEdit: (supplier: DbSupplier) => void;
  onDelete: (id: string) => void;
}

export function SupplierDetailDrawer({
  open,
  supplier,
  orders,
  products,
  onClose,
  onCall,
  onEdit,
  onDelete,
}: SupplierDetailDrawerProps) {
  return (
    <AnimatePresence>
      {open && supplier && (
        <div className="fixed inset-0 z-[100]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white dark:bg-[#0A1628] shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label={`Detail ${supplier.nama}`}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 font-heading truncate">
                {supplier.nama}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors scale-press shrink-0 ml-2"
                aria-label="Tutup"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Profile */}
              <div className="flex flex-col items-center py-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#008CEB] to-[#00C9A7] flex items-center justify-center text-white text-lg font-extrabold mb-2">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-heading font-extrabold">{supplier.nama}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Sejak {new Date(supplier.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>

              {/* Contact Info */}
              <div className="premium-card p-3 space-y-2">
                {supplier.kontak && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-[11px]">{supplier.kontak}</span>
                    <button
                      onClick={() => onCall(supplier.kontak)}
                      className="ml-auto text-[9px] font-bold text-[#008CEB] hover:underline"
                    >
                      Hubungi
                    </button>
                  </div>
                )}
                {supplier.alamat && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="text-[11px]">{supplier.alamat}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-[11px]">Bergabung {new Date(supplier.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
                </div>
              </div>

              {/* Notes */}
              {supplier.catatan && (
                <div className="premium-card p-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Catatan</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">{supplier.catatan}</p>
                </div>
              )}

              {/* Products */}
              <div className="premium-card p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Package className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Produk ({products.length})
                  </span>
                </div>
                <SupplierProductList products={products} />
              </div>

              {/* Purchase History */}
              <div className="premium-card p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Riwayat Pembelian ({orders.length})
                  </span>
                </div>
                <SupplierHistory orders={orders} />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => { onEdit(supplier); onClose(); }}
                  className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-[#008CEB] to-[#00C9A7] text-white font-bold text-xs shadow-lg shadow-[#008CEB]/20 scale-press"
                >
                  Edit Supplier
                </button>
                <button
                  onClick={() => { onDelete(supplier.id); onClose(); }}
                  className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 text-white font-bold text-xs shadow-lg shadow-rose-500/20 scale-press"
                >
                  Hapus
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
