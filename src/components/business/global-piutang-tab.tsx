"use client";

import React from "react";
import { Search, CreditCard } from "lucide-react";
import { BOOK_LABELS, POS_UNITS, type UnitId, type BookOrBranch } from "@/lib/db-v4";

const BRANCH_LIST: UnitId[] = POS_UNITS;

interface Props {
  piutangSearch: string;
  setPiutangSearch: (v: string) => void;
  piutangBranchFilter: UnitId | "semua";
  setPiutangBranchFilter: (v: UnitId | "semua") => void;
  selectedPiutang: string | null;
  setSelectedPiutang: (v: string | null) => void;
  bayarPiutangAmount: number;
  setBayarPiutangAmount: (v: number) => void;
  filteredPiutang: any[];
  handleBayarPiutang: (piutangId: string) => void;
}

export default function GlobalPiutangTab({
  piutangSearch, setPiutangSearch,
  piutangBranchFilter, setPiutangBranchFilter,
  selectedPiutang, setSelectedPiutang,
  bayarPiutangAmount, setBayarPiutangAmount,
  filteredPiutang,
  handleBayarPiutang,
}: Props) {
  return (
    <div className="space-y-3 animate-fade-in">
      <div className="space-y-2">
        <div className="relative">
          <span className="absolute left-3 top-2.5 text-sm text-slate-400"><Search className="w-4 h-4" /></span>
          <input type="text" placeholder="Cari nama pelanggan..." value={piutangSearch} onChange={(e) => setPiutangSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-[#131527] rounded-xl border-none outline-none focus:ring-1 focus:ring-[#008CEB]" />
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          <button onClick={() => setPiutangBranchFilter("semua")}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap ${piutangBranchFilter === "semua" ? "bg-[#008CEB] text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-400"}`}>
            Semua
          </button>
          {BRANCH_LIST.map((b) => (
            <button key={b} onClick={() => setPiutangBranchFilter(b)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap ${piutangBranchFilter === b ? "bg-[#008CEB] text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-400"}`}>
              {BOOK_LABELS[b]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filteredPiutang.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">Tidak ada data piutang.</div>
        ) : (
          filteredPiutang.map((p: any) => (
            <div key={p.id} className={`premium-card p-3 space-y-2 ${selectedPiutang === p.id ? "border-[#008CEB]/40" : ""}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-xs font-extrabold">{p.customerNama}</h4>
                  <p className="text-[9px] text-slate-400">{BOOK_LABELS[p.bookOrBranchId as BookOrBranch]}</p>
                  <p className="text-[9px] text-slate-400">Jatuh tempo: {new Date(p.jatuhTempo).toLocaleDateString("id-ID")}</p>
                </div>
                <div className="text-right">
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${p.status === "LUNAS" ? "bg-emerald-100 text-emerald-600" : p.status === "DIHAPUS" ? "bg-slate-100 text-slate-400" : "bg-amber-100 text-amber-600"}`}>
                    {p.status}
                  </span>
                  <p className="text-sm font-extrabold text-amber-500 mt-1">Rp{p.sisaPiutang.toLocaleString()}</p>
                  <p className="text-[9px] text-slate-400">dari Rp{p.totalPiutang.toLocaleString()}</p>
                </div>
              </div>

              {p.status === "AKTIF" && (
                <div className="flex gap-2">
                  <button onClick={() => setSelectedPiutang(selectedPiutang === p.id ? null : p.id)}
                    className="flex-1 py-1.5 bg-[#008CEB] text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-1">
                    <span className="text-sm"><CreditCard className="w-5 h-5" /></span> Bayar
                  </button>
                  <a href={`https://api.whatsapp.com/send?phone=${p.customerWA.replace(/[^0-9]/g, "")}&text=${encodeURIComponent(`Halo ${p.customerNama}, Anda memiliki piutang sebesar Rp${p.sisaPiutang.toLocaleString()}. Mohon segera dilunasi. Terima kasih.`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="py-1.5 px-3 bg-emerald-500 text-white rounded-xl text-[10px] font-bold flex items-center gap-1">
                    WA
                  </a>
                </div>
              )}

              {selectedPiutang === p.id && (
                <div className="p-2 bg-slate-50 dark:bg-zinc-900/50 rounded-xl space-y-2">
                  <input type="number" placeholder="Jumlah bayar" value={bayarPiutangAmount || ""}
                    onChange={(e) => setBayarPiutangAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-zinc-800 focus:outline-none font-bold" />
                  <button onClick={() => handleBayarPiutang(p.id)}
                    className="w-full py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold active:scale-[0.98]">
                    Konfirmasi Bayar Rp{bayarPiutangAmount.toLocaleString()}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
