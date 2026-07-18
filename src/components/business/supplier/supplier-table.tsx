"use client";
import React from "react";
import { Building2, Phone, MapPin, Pencil, Trash2, Eye, MoreHorizontal } from "lucide-react";
import type { DbSupplier, DbPurchaseOrder } from "@/lib/db-v4";

interface SupplierRow {
  supplier: DbSupplier;
  totalPembelian: number;
  totalHutang: number;
  jumlahProduk: number;
  jumlahPO: number;
  status: "aktif" | "tidak-aktif" | "baru";
}

interface SupplierTableProps {
  rows: SupplierRow[];
  onEdit: (supplier: DbSupplier) => void;
  onDelete: (id: string) => void;
  onDetail: (supplier: DbSupplier) => void;
  onCall: (kontak: string) => void;
}

export function SupplierTable({ rows, onEdit, onDelete, onDetail, onCall }: SupplierTableProps) {
  if (rows.length === 0) return null;

  const statusBadge = (status: string) => {
    switch (status) {
      case "aktif":
        return <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">Aktif</span>;
      case "baru":
        return <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">Baru</span>;
      default:
        return <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">Tidak Aktif</span>;
    }
  };

  const DesktopTable = () => (
    <div className="hidden md:block premium-card overflow-hidden animate-fade-in">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <th className="text-left px-4 py-3 font-bold text-slate-400 uppercase tracking-wider text-[9px]">Nama</th>
              <th className="text-left px-4 py-3 font-bold text-slate-400 uppercase tracking-wider text-[9px]">Kontak</th>
              <th className="text-center px-4 py-3 font-bold text-slate-400 uppercase tracking-wider text-[9px]">Produk</th>
              <th className="text-right px-4 py-3 font-bold text-slate-400 uppercase tracking-wider text-[9px]">Pembelian</th>
              <th className="text-right px-4 py-3 font-bold text-slate-400 uppercase tracking-wider text-[9px]">Hutang</th>
              <th className="text-center px-4 py-3 font-bold text-slate-400 uppercase tracking-wider text-[9px]">Status</th>
              <th className="text-center px-4 py-3 font-bold text-slate-400 uppercase tracking-wider text-[9px]">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((row) => (
              <tr
                key={row.supplier.id}
                className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                onClick={() => onDetail(row.supplier)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#008CEB]/10 flex items-center justify-center text-[#008CEB] shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{row.supplier.nama}</p>
                      {row.supplier.alamat && (
                        <p className="text-[9px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-2.5 h-2.5" /> {row.supplier.alamat}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {row.supplier.kontak || "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-center font-bold">{row.jumlahProduk}</td>
                <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                  Rp{row.totalPembelian.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right font-bold text-amber-600 dark:text-amber-400">
                  {row.totalHutang > 0 ? `Rp${row.totalHutang.toLocaleString()}` : "—"}
                </td>
                <td className="px-4 py-3 text-center">{statusBadge(row.status)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); onDetail(row.supplier); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-[#008CEB] hover:bg-[#008CEB]/5 transition-all"
                      title="Lihat Detail"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onEdit(row.supplier); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(row.supplier.id); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const MobileList = () => (
    <div className="md:hidden flex flex-col gap-2 animate-fade-in">
      {rows.map((row) => (
        <div
          key={row.supplier.id}
          className="premium-card p-3 cursor-pointer scale-press"
          onClick={() => onDetail(row.supplier)}
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#008CEB]/10 flex items-center justify-center text-[#008CEB] shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-heading font-bold truncate">{row.supplier.nama}</p>
                {statusBadge(row.status)}
              </div>
              {row.supplier.kontak && (
                <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3" /> {row.supplier.kontak}
                </p>
              )}
              {row.supplier.alamat && (
                <p className="text-[10px] text-slate-400 flex items-start gap-1 mt-0.5 line-clamp-1">
                  <MapPin className="w-3 h-3 shrink-0 mt-0.5" /> {row.supplier.alamat}
                </p>
              )}
              <div className="flex items-center gap-3 mt-1.5 text-[10px]">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Rp{row.totalPembelian.toLocaleString()}</span>
                {row.totalHutang > 0 && (
                  <span className="text-amber-600 dark:text-amber-400 font-bold">Hutang: Rp{row.totalHutang.toLocaleString()}</span>
                )}
                <span className="text-slate-400">{row.jumlahProduk} produk</span>
              </div>
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(row.supplier); }}
                className="p-1.5 text-slate-400 hover:text-emerald-500 transition-colors"
                title="Edit"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(row.supplier.id); }}
                className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                title="Hapus"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <DesktopTable />
      <MobileList />
    </>
  );
}
