"use client";

import React from "react";
import { Search, Users } from "lucide-react";
import { BOOK_LABELS, POS_UNITS, type UnitId, type BookOrBranch } from "@/lib/db-v4";

const BRANCH_LIST: UnitId[] = POS_UNITS;

interface Props {
  pelangganSearch: string;
  setPelangganSearch: (v: string) => void;
  pelangganBranch: UnitId | "semua";
  setPelangganBranch: (v: UnitId | "semua") => void;
  filteredPelanggan: any[];
}

export default function GlobalPelangganTab({
  pelangganSearch, setPelangganSearch,
  pelangganBranch, setPelangganBranch,
  filteredPelanggan,
}: Props) {
  return (
    <div className="space-y-3 animate-fade-in">
      <div className="space-y-2">
        <div className="relative">
          <span className="absolute left-3 top-2.5 text-sm text-slate-400"><Search className="w-4 h-4" /></span>
          <input type="text" placeholder="Cari nama atau nomor HP..." value={pelangganSearch} onChange={(e) => setPelangganSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-[#131527] rounded-xl border-none outline-none focus:ring-1 focus:ring-[#008CEB]" />
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          <button onClick={() => setPelangganBranch("semua")}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap ${pelangganBranch === "semua" ? "bg-[#008CEB] text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-400"}`}>
            Semua
          </button>
          {BRANCH_LIST.map((b) => (
            <button key={b} onClick={() => setPelangganBranch(b)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap ${pelangganBranch === b ? "bg-[#008CEB] text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-400"}`}>
              {BOOK_LABELS[b]}
            </button>
          ))}
        </div>
      </div>

      <div className="premium-card p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#008CEB]"><Users className="w-5 h-5" /></span>
          <span className="text-xs font-bold">{filteredPelanggan.length} Pelanggan</span>
        </div>
        <div className="text-right">
          <span className="text-[9px] text-slate-400">Total Belanja</span>
          <p className="text-xs font-extrabold text-[#008CEB]">
            Rp{filteredPelanggan.reduce((s: number, c: any) => s + c.totalBelanja, 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {filteredPelanggan.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">Tidak ada data pelanggan.</div>
        ) : (
          filteredPelanggan.map((c: any) => (
            <div key={c.id} className="premium-card p-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-xs font-extrabold">{c.nama}</h4>
                  <p className="text-[9px] text-slate-400 flex items-center gap-1">
                    <span>{c.noWA}</span> · <span>{BOOK_LABELS[c.bookOrBranchId as BookOrBranch]}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-extrabold text-[#00C9A7]">Rp{c.totalBelanja.toLocaleString()}</p>
                  <p className="text-[9px] text-slate-400">{c.totalTransaksi} tx · {c.poin} poin</p>
                </div>
              </div>
              {c.noWA && (
                <a href={`https://api.whatsapp.com/send?phone=${c.noWA.replace(/[^0-9]/g, "")}`}
                  target="_blank" rel="noopener noreferrer"
                  className="mt-2 block w-full py-1.5 bg-emerald-500 text-white rounded-xl text-[10px] font-bold text-center">
                  Hubungi WA
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
