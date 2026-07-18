"use client";
import React from "react";
import { Smartphone, DollarSign, Star, Pencil, Trash2, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Customer, DbPiutang } from "./customer-types";

interface CustomerTableProps {
  customers: Customer[];
  customerPiutangMap: Record<string, DbPiutang[]>;
  onSelect: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
  onBroadcast: (customer: Customer) => void;
  selectedId?: string;
}

function getKategori(totalBelanja: number): { label: string; variant: "default" | "success" | "warning" | "danger" | "info" } {
  if (totalBelanja >= 10000000) return { label: "Platinum", variant: "info" };
  if (totalBelanja >= 5000000) return { label: "Gold", variant: "warning" };
  if (totalBelanja >= 1000000) return { label: "Silver", variant: "default" };
  return { label: "Regular", variant: "success" };
}

function getStatus(terakhirTransaksi: string): { label: string; variant: "success" | "danger" } {
  if (!terakhirTransaksi) return { label: "Tidak Aktif", variant: "danger" };
  const daysSince = Math.floor((Date.now() - new Date(terakhirTransaksi).getTime()) / (1000 * 60 * 60 * 24));
  return daysSince <= 90 ? { label: "Aktif", variant: "success" } : { label: "Tidak Aktif", variant: "danger" };
}

export function CustomerTable({
  customers,
  customerPiutangMap,
  onSelect,
  onEdit,
  onDelete,
  onBroadcast,
  selectedId,
}: CustomerTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50 dark:bg-zinc-900">
            <th className="text-left py-2.5 px-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Nama</th>
            <th className="text-left py-2.5 px-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider hidden sm:table-cell">No HP</th>
            <th className="text-left py-2.5 px-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Kategori</th>
            <th className="text-right py-2.5 px-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Poin</th>
            <th className="text-right py-2.5 px-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Total Belanja</th>
            <th className="text-right py-2.5 px-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Piutang</th>
            <th className="text-left py-2.5 px-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Terakhir</th>
            <th className="text-center py-2.5 px-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Status</th>
            <th className="text-center py-2.5 px-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {customers.map((c) => {
            const kategori = getKategori(c.totalBelanja);
            const status = getStatus(c.terakhirTransaksi);
            const piutangTotal = customerPiutangMap[c.id]?.reduce((sum, p) => sum + p.sisaPiutang, 0) || 0;
            return (
              <tr
                key={c.id}
                onClick={() => onSelect(c)}
                className={`cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-zinc-800/50 ${
                  selectedId === c.id ? "bg-[#008CEB]/5" : ""
                }`}
              >
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#008CEB] to-[#00C9A7] flex items-center justify-center text-white text-[10px] font-extrabold shrink-0">
                      {c.nama.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{c.nama}</p>
                      <p className="text-[9px] text-slate-400 sm:hidden">{c.noWA}</p>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 px-3 text-slate-500 hidden sm:table-cell">{c.noWA}</td>
                <td className="py-2.5 px-3 hidden md:table-cell">
                  <Badge variant={kategori.variant}>{kategori.label}</Badge>
                </td>
                <td className="py-2.5 px-3 text-right hidden md:table-cell">
                  <span className="font-bold text-amber-500 flex items-center gap-1 justify-end">
                    <Star className="w-3 h-3" /> {c.poin.toLocaleString()}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right hidden lg:table-cell">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    Rp{c.totalBelanja.toLocaleString()}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right hidden lg:table-cell">
                  {piutangTotal > 0 ? (
                    <span className="font-bold text-amber-600">Rp{piutangTotal.toLocaleString()}</span>
                  ) : (
                    <span className="text-slate-300 dark:text-slate-600">-</span>
                  )}
                </td>
                <td className="py-2.5 px-3 hidden lg:table-cell">
                  {c.terakhirTransaksi ? (
                    <span className="text-slate-500 text-[9px]">
                      {new Date(c.terakhirTransaksi).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </span>
                  ) : (
                    <span className="text-slate-300 dark:text-slate-600">-</span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-center hidden sm:table-cell">
                  <Badge variant={status.variant}>{status.label}</Badge>
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); onBroadcast(c); }}
                      className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-slate-400 hover:text-emerald-600 transition-colors"
                      title="Kirim WA"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onEdit(c); }}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-[#008CEB] transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
                      className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}