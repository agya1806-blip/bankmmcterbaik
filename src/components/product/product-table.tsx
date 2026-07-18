"use client";
import React from "react";
import { Pencil, RotateCcw, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Download, ChevronLeft, ChevronRight, Package } from "lucide-react";
import { type Inventory } from "@/lib/db-v4";
import { Badge } from "@/components/ui/badge";

type SortField = "nama" | "stok" | "hargaJual" | "hargaModal" | "kategori" | "sku";
type SortDir = "asc" | "desc";

interface ProductTableProps {
  products: Inventory[];
  sortField: SortField;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onEdit: (product: Inventory) => void;
  onDelete: (id: string) => void;
  onAdjustStock: (product: Inventory) => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onBulkDelete: (ids: string[]) => void;
  onExport: () => void;
}

const columns: { key: SortField; label: string; hide?: "sm" | "md" }[] = [
  { key: "nama", label: "Nama Produk" },
  { key: "sku", label: "SKU", hide: "md" },
  { key: "kategori", label: "Kategori", hide: "sm" },
  { key: "hargaModal", label: "HPP", hide: "sm" },
  { key: "hargaJual", label: "Harga Jual" },
  { key: "stok", label: "Stok" },
];

export function ProductTable({
  products,
  sortField,
  sortDir,
  onSort,
  page,
  pageSize,
  total,
  onPageChange,
  onEdit,
  onDelete,
  onAdjustStock,
  selectedIds,
  onSelectionChange,
  onBulkDelete,
  onExport,
}: ProductTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const allSelected = products.length > 0 && selectedIds.length === products.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  const toggleAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(products.map((p) => p.id));
    }
  };

  const toggleOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-slate-300" />;
    return sortDir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
  };

  const formatPrice = (v: number) => `Rp${v.toLocaleString()}`;

  const statusBadge = (p: Inventory) => {
    if (p.stok === 0) return <Badge variant="danger">Habis</Badge>;
    if (p.stok <= p.stokMin) return <Badge variant="warning">Menipis</Badge>;
    return <Badge variant="success">Aktif</Badge>;
  };

  return (
    <div className="space-y-3">
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-[#008CEB]/5 rounded-xl text-xs">
          <span className="font-medium text-slate-500">{selectedIds.length} dipilih</span>
          <button
            onClick={() => onSelectionChange([])}
            className="text-[10px] text-slate-400 hover:text-slate-600 ml-1"
          >
            (Batal)
          </button>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => onBulkDelete(selectedIds)}
              className="px-3 py-1 rounded-lg bg-rose-500 text-white text-[10px] font-bold hover:bg-rose-600 transition-colors"
            >
              Hapus {selectedIds.length}
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 dark:bg-zinc-900/50">
              <th className="p-3 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected; }}
                  onChange={toggleAll}
                  className="w-4 h-4 rounded accent-[#008CEB] cursor-pointer"
                />
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`p-3 text-left ${col.hide === "md" ? "hidden md:table-cell" : ""} ${col.hide === "sm" ? "hidden sm:table-cell" : ""}`}
                >
                  <button
                    onClick={() => onSort(col.key)}
                    className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600 transition-colors"
                  >
                    {col.label}
                    <SortIcon field={col.key} />
                  </button>
                </th>
              ))}
              <th className="p-3 text-right">
                <button
                  onClick={onExport}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                  title="Export CSV"
                >
                  <Download className="w-4 h-4 text-slate-400" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const isSelected = selectedIds.includes(p.id);
              return (
                <tr
                  key={p.id}
                  className={`border-t border-slate-100 dark:border-slate-800 transition-colors hover:bg-slate-50 dark:hover:bg-zinc-900/30 ${
                    isSelected ? "bg-[#008CEB]/5" : ""
                  }`}
                >
                  <td className="p-3 w-10">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOne(p.id)}
                      className="w-4 h-4 rounded accent-[#008CEB] cursor-pointer"
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {p.fotoUrl ? (
                        <img src={p.fotoUrl} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4 text-slate-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[160px]">
                          {p.nama}
                        </p>
                        <p className="text-[9px] text-slate-400">{p.satuan}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 hidden md:table-cell">
                    <span className="text-[10px] text-slate-500 font-mono">{p.sku || "-"}</span>
                  </td>
                  <td className="p-3 hidden sm:table-cell">
                    <span className="text-[10px] text-slate-500">{p.kategori || "-"}</span>
                  </td>
                  <td className="p-3 hidden sm:table-cell">
                    <span className="text-[10px] text-slate-500">{formatPrice(p.hargaModal)}</span>
                  </td>
                  <td className="p-3">
                    <span className="text-xs font-bold text-[#008CEB]">{formatPrice(p.hargaJual)}</span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${p.stok <= p.stokMin ? "text-amber-500" : "text-slate-700 dark:text-slate-300"}`}>
                        {p.stok}
                      </span>
                      {statusBadge(p)}
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEdit(p)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                      <button
                        onClick={() => onAdjustStock(p)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                        title="Sesuaikan Stok"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                      <button
                        onClick={() => onDelete(p.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400 text-sm">
                  Tidak ada data produk
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-slate-400">
            {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} dari {total}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 disabled:opacity-30 transition-opacity"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`w-7 h-7 rounded-lg text-[10px] font-bold transition-all ${
                  page === p
                    ? "bg-[#008CEB] text-white"
                    : "bg-slate-100 dark:bg-zinc-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-zinc-700"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 disabled:opacity-30 transition-opacity"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export type { SortField, SortDir };
