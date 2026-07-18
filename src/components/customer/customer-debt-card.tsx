"use client";
import React, { useState } from "react";
import { BanknoteIcon, History, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { DbPiutang, DbPiutangInstallment } from "./customer-types";

interface CustomerDebtCardProps {
  piutangList: DbPiutang[];
  installments: DbPiutangInstallment[];
}

export function CustomerDebtCard({ piutangList, installments }: CustomerDebtCardProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (piutangList.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
        <BanknoteIcon className="w-3 h-3" /> Riwayat Piutang
      </p>
      {piutangList.map((p) => {
        const inst = installments.filter((i) => i.piutangId === p.id);
        const isExpanded = expandedId === p.id;
        return (
          <div key={p.id} className="bg-slate-50 dark:bg-zinc-900 rounded-xl p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold">Rp{p.totalPiutang.toLocaleString()}</p>
                <p className={`text-[10px] font-semibold ${p.status === "LUNAS" ? "text-emerald-500" : "text-amber-500"}`}>
                  {p.status} &middot; Sisa Rp{p.sisaPiutang.toLocaleString()}
                </p>
              </div>
              {inst.length > 0 && (
                <button
                  onClick={() => setExpandedId(isExpanded ? null : p.id)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-[9px] font-bold bg-white dark:bg-[#131527] rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-[#008CEB]/5 active:scale-[0.97] transition-all"
                >
                  <History className="w-3 h-3" />
                  {inst.length} Cicilan
                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}
            </div>
            {isExpanded && inst.length > 0 && (
              <div className="pt-1 space-y-1">
                {inst.sort((a, b) => b.tanggal.localeCompare(a.tanggal)).map((i) => (
                  <div key={i.id} className="flex items-center justify-between py-1.5 px-2 bg-white dark:bg-[#131527] rounded-lg">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-[#008CEB]">Rp{i.jumlah.toLocaleString()}</p>
                      <p className="text-[8px] text-slate-400">
                        {new Date(i.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <div className="text-right min-w-0">
                      <p className="text-[9px] font-semibold text-slate-600 dark:text-slate-300 capitalize">{i.metode}</p>
                      {i.catatan && <p className="text-[8px] text-slate-400 line-clamp-1">{i.catatan}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}