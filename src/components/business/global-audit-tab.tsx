"use client";

import React from "react";
import { Search } from "lucide-react";
import { BOOK_LABELS, POS_UNITS, type UnitId, type BookOrBranch } from "@/lib/db-v4";

const BRANCH_LIST: UnitId[] = POS_UNITS;

interface Props {
  auditSearch: string;
  setAuditSearch: (v: string) => void;
  auditBranch: UnitId | "semua";
  setAuditBranch: (v: UnitId | "semua") => void;
  auditType: string;
  setAuditType: (v: string) => void;
  filteredAudit: any[];
}

export default function GlobalAuditTab({
  auditSearch, setAuditSearch,
  auditBranch, setAuditBranch,
  auditType, setAuditType,
  filteredAudit,
}: Props) {
  return (
    <div className="space-y-3 animate-fade-in">
      <div className="space-y-2">
        <div className="relative">
          <span className="absolute left-3 top-2.5 text-sm text-slate-400"><Search className="w-4 h-4" /></span>
          <input type="text" placeholder="Cari user atau aksi..." value={auditSearch} onChange={(e) => setAuditSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-[#131527] rounded-xl border-none outline-none focus:ring-1 focus:ring-[#008CEB]" />
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          <button onClick={() => setAuditBranch("semua")}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap ${auditBranch === "semua" ? "bg-[#008CEB] text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-400"}`}>
            Semua Cabang
          </button>
          {BRANCH_LIST.map((b) => (
            <button key={b} onClick={() => setAuditBranch(b)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap ${auditBranch === b ? "bg-[#008CEB] text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-400"}`}>
              {BOOK_LABELS[b]}
            </button>
          ))}
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {["semua", "CREATE", "UPDATE", "DELETE", "BATAL", "TRANSFER_KELUAR", "TRANSFER_MASUK"].map((t) => (
            <button key={t} onClick={() => setAuditType(t)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap ${auditType === t ? "bg-[#00C9A7] text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-400"}`}>
              {t === "semua" ? "Semua" : t.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
        {filteredAudit.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">Tidak ada log aktivitas.</div>
        ) : (
          filteredAudit.map((log: any) => {
            const actionColors: Record<string, string> = {
              CREATE: "bg-emerald-100 text-emerald-600",
              UPDATE: "bg-blue-100 text-blue-600",
              DELETE: "bg-rose-100 text-rose-600",
              BATAL: "bg-amber-100 text-amber-600",
              TRANSFER_KELUAR: "bg-orange-100 text-orange-600",
              TRANSFER_MASUK: "bg-purple-100 text-purple-600",
            };
            return (
              <div key={log.id} className="p-2 rounded-xl bg-white dark:bg-[#131527] flex items-start gap-2">
                <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold shrink-0 mt-0.5 ${actionColors[log.action] || "bg-slate-100 text-slate-400"}`}>
                  {log.action}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold truncate">{log.alasan || log.entityType}</p>
                  <p className="text-[9px] text-slate-400">
                    {log.userName || "System"} · {BOOK_LABELS[log.bookOrBranchId as BookOrBranch]}
                    {log.nominal > 0 && <> · Rp{log.nominal.toLocaleString()}</>}
                  </p>
                  <p className="text-[8px] text-slate-300">{new Date(log.createdAt).toLocaleString("id-ID")}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
