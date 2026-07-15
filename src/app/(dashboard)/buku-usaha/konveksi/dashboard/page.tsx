"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Clock, Plus, Tags, Search,
  ArrowRight, MessageSquare,
} from "lucide-react";
import toast from "react-hot-toast";
import { db, type BookOrBranch } from "@/lib/db-v4";

const BRANCH: BookOrBranch = "usaha-konveksi";

function formatRupiah(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

type KanbanCol = "menunggu-bahan" | "diproduksi" | "selesai";

const KANBAN_COLS: { key: KanbanCol; label: string; color: string }[] = [
  { key: "menunggu-bahan", label: "Menunggu Bahan", color: "text-amber-400" },
  { key: "diproduksi", label: "Sedang Diproduksi", color: "text-blue-400" },
  { key: "selesai", label: "Selesai & Siap Diambil", color: "text-emerald-400" },
];

export default function DashboardKonveksi() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    (async () => {
      const all = await db.transactions
        .where("bookOrBranchId")
        .equals(BRANCH)
        .reverse()
        .toArray();
      setTransactions(all);
    })();
  }, [mounted]);

  const updateStatus = useCallback(async (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    if (!tx) return;
    const currentCol = getCol(tx);
    if (currentCol === "selesai") {
      const sisa = tx.sisaTagihan || tx.totalBruto;
      const msg = encodeURIComponent(
        `Halo ${tx.customerNama},\n\nPesanan *${tx.invoiceNumber}* sudah selesai dan siap diambil.\n\nSisa tagihan: ${formatRupiah(sisa)}\n\nMohon segera dilunasi ya. Terima kasih!`
      );
      window.open(`https://wa.me/${tx.customerWA}?text=${msg}`, "_blank");
      return;
    }

    const nextCol: Record<string, KanbanCol> = {
      "menunggu-bahan": "diproduksi",
      "diproduksi": "selesai",
    };
    const next = nextCol[currentCol];
    if (!next) return;

    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, _kanbanStatus: next } : t))
    );
    toast.success(`${tx.invoiceNumber} → ${KANBAN_COLS.find((c) => c.key === next)?.label}`);
  }, [transactions]);

  function getCol(tx: any): KanbanCol {
    if (tx._kanbanStatus) return tx._kanbanStatus;
    if (tx.status === "DP") return "menunggu-bahan";
    if (tx.status === "LUNAS") return "selesai";
    return "diproduksi";
  }

  const kpi = useMemo(() => {
    const selesai = transactions.filter((t) => getCol(t) === "selesai");
    const omzet = selesai.reduce((s: number, t: any) => s + t.totalBruto, 0);
    const totalTx = transactions.length;
    const piutang = transactions.filter((t) => t.status === "DP").length;
    return { omzet, totalTx, piutang };
  }, [transactions]);

  const filtered = useMemo(() => {
    if (!search) return transactions;
    const q = search.toLowerCase();
    return transactions.filter(
      (t: any) =>
        t.invoiceNumber?.toLowerCase().includes(q) ||
        t.customerNama?.toLowerCase().includes(q)
    );
  }, [transactions, search]);

  if (!mounted) {
    return <div className="space-y-4 animate-pulse"><div className="h-32 rounded-2xl bg-slate-100 dark:bg-slate-800/30" /><div className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800/30" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto pb-20 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-gradient-to-r from-[#7B61FF] to-[#FF5C00] flex items-center justify-center shadow-xl shadow-[#7B61FF]/20">
            <Tags className="size-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-heading">Dashboard Konveksi</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Pusat komando produksi konveksi</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => router.push("/buku-usaha/konveksi/kasir")}
            className="btn-gradient text-[10px] h-9 px-3 gap-1.5"
          >
            <Plus className="size-3.5" /> Order Baru
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="premium-stat border-rose-500/20 bg-gradient-to-br from-rose-500/5 to-transparent">
          <p className="premium-stat-label">Omzet</p>
          <p className="premium-stat-value text-rose-500">{formatRupiah(kpi.omzet)}</p>
        </div>
        <div className="premium-stat border-[#7B61FF]/20 bg-gradient-to-br from-[#7B61FF]/5 to-transparent">
          <p className="premium-stat-label">Total Order</p>
          <p className="premium-stat-value text-[#7B61FF]">{kpi.totalTx}</p>
        </div>
        <div className="premium-stat border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
          <p className="premium-stat-label">Menunggu DP</p>
          <p className="premium-stat-value text-amber-500">{kpi.piutang}</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold flex items-center gap-1.5">
            <Clock className="size-4 text-rose-500" /> Production Board
          </h2>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-slate-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari..." className="input-premium w-28 text-[10px] pl-7 h-9" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-2">
          {KANBAN_COLS.map((col) => (
            <p key={col.key} className={`text-[9px] font-semibold uppercase tracking-wider text-center ${col.color}`}>
              {col.label}
            </p>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {KANBAN_COLS.map((col) => {
            const items = filtered.filter((t: any) => getCol(t) === col.key);
            return (
              <div key={col.key} className="space-y-1.5">
                {items.length === 0 ? (
                  <div className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800/20 border border-dashed border-slate-200 dark:border-slate-700/30 flex items-center justify-center">
                    <p className="text-[8px] text-slate-400 dark:text-slate-600">Kosong</p>
                  </div>
                ) : (
                  items.map((tx: any) => (
                    <div key={tx.id}
                      className="premium-card p-2.5 space-y-1 cursor-pointer group"
                      onClick={() => updateStatus(tx.id)}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-[8px] font-semibold truncate">{tx.invoiceNumber}</p>
                      </div>
                      <p className="text-[7px] text-slate-500 truncate">{tx.customerNama}</p>
                      <p className="text-[7px] text-slate-400 dark:text-slate-600 truncate">
                        {tx.items?.map((i: any) => i.namaItem).join(", ") || "-"}
                      </p>
                      <div className="flex items-center justify-between pt-0.5">
                        <p className="text-[7px] font-semibold tabular-nums text-rose-500">{formatRupiah(tx.totalBruto)}</p>
                        {col.key === "selesai" ? (
                          <MessageSquare className="size-2.5 text-emerald-400" />
                        ) : (
                          <ArrowRight className="size-2.5 text-slate-400 group-hover:text-rose-500 transition-colors" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
