"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLiveQuery } from "@/hooks/useLiveQuery";
import { useSessionStore } from "@/store/useSessionStore";
import {
  db, type UnitId, type DbPeriod, BRANCH_MAP, BRANCH_LABELS, BRANCH_COLORS,
} from "@/lib/db-v4";
import { showToast } from "@/lib/toast";
import {
  ChevronLeft, Calendar, Lock, Unlock, TrendingUp, TrendingDown, DollarSign, Clock,
} from "lucide-react";

export default function PeriodPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useSessionStore();
  const cabangSlug = (params?.cabang as string) || "";
  const bookOrBranchId: UnitId = BRANCH_MAP[cabangSlug] || "usaha-warkop";
  const isAdmin = currentUser?.role === "admin";

  const currentPeriod = new Date().toISOString().slice(0, 7);

  const periods = useLiveQuery(() =>
    db.periods
      .where("bookOrBranchId").equals(bookOrBranchId)
      .reverse()
      .sortBy("periode"),
    [bookOrBranchId]
  ) || [];

  const transactions = useLiveQuery(() =>
    db.transactions.where("bookOrBranchId").equals(bookOrBranchId).toArray(),
    [bookOrBranchId]
  ) || [];

  const cashflows = useLiveQuery(() =>
    db.cashflows.where("bookOrBranchId").equals(bookOrBranchId).toArray(),
    [bookOrBranchId]
  ) || [];

  const currentClosedPeriod = periods.find(p => p.periode === currentPeriod && p.status === "closed");
  const isCurrentOpen = !currentClosedPeriod;
  const sortedPeriods = [...periods].sort((a, b) => b.periode.localeCompare(a.periode));

  const [loading, setLoading] = useState(false);

  const computePeriodSummary = (periode: string) => {
    const periodTx = transactions.filter(tx =>
      tx.createdAt.startsWith(periode) && tx.status !== "BATAL"
    );
    const periodCf = cashflows.filter(cf =>
      cf.createdAt.startsWith(periode)
    );
    const totalPendapatan = periodTx.reduce((s, tx) => s + (tx.grandTotal - (tx.sedekahNominal || 0)), 0);
    const totalPengeluaran = periodCf.filter(cf => cf.tipe === "keluar").reduce((s, cf) => s + cf.nominal, 0);
    const labaBersih = totalPendapatan - totalPengeluaran;
    return { totalPendapatan, totalPengeluaran, labaBersih };
  };

  const handleClosePeriod = async () => {
    if (!confirm("Apakah anda yakin menutup periode? Transaksi baru tidak bisa ditambahkan.")) return;
    setLoading(true);
    try {
      const summary = computePeriodSummary(currentPeriod);
      const existing = sortedPeriods.find(p => p.periode === currentPeriod);
      if (existing) {
        if (existing.status === "closed") {
          showToast.error(`Periode ${currentPeriod} sudah ditutup`);
          setLoading(false);
          return;
        }
        await db.periods.update(existing.id, {
          status: "closed",
          labaBersih: summary.labaBersih,
          totalPendapatan: summary.totalPendapatan,
          totalPengeluaran: summary.totalPengeluaran,
          closedAt: new Date().toISOString(),
        });
      } else {
        await db.periods.add({
          id: crypto.randomUUID(),
          bookOrBranchId,
          unitId: bookOrBranchId,
          periode: currentPeriod,
          status: "closed",
          labaBersih: summary.labaBersih,
          totalPendapatan: summary.totalPendapatan,
          totalPengeluaran: summary.totalPengeluaran,
          createdAt: new Date().toISOString(),
          closedAt: new Date().toISOString(),
        });
      }
      showToast.success(`Periode ${currentPeriod} ditutup`);
    } catch (err: unknown) {
      showToast.error(`Gagal: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReopenPeriod = async (period: DbPeriod) => {
    if (!confirm(`Buka kembali periode ${period.periode}?`)) return;
    setLoading(true);
    try {
      await db.periods.update(period.id, {
        status: "open",
        closedAt: undefined,
      });
      showToast.success(`Periode ${period.periode} dibuka kembali`);
    } catch (err: unknown) {
      showToast.error(`Gagal: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const formatRp = (n: number) => `Rp${n.toLocaleString()}`;

  return (
    <div className="flex flex-col gap-4 pt-2 pb-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push(`/buku-bisnis/${cabangSlug}`)} className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center scale-press">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-heading font-extrabold tracking-tight">Periode</h1>
          <p className="text-[10px] text-slate-400 font-bold">{BRANCH_LABELS[cabangSlug] || cabangSlug}</p>
        </div>
      </div>

      <div className="premium-card premium-card-glow p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#008CEB]" />
            <span className="text-xs font-heading font-extrabold">Periode Saat Ini</span>
          </div>
          <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full ${isCurrentOpen ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"}`}>
            {isCurrentOpen ? "Terbuka" : "Ditutup"}
          </span>
        </div>
        <p className="text-lg font-heading font-extrabold tracking-tight mb-3">{currentPeriod}</p>
        {isCurrentOpen && isAdmin && (
          <button
            onClick={handleClosePeriod}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white text-xs font-bold flex items-center justify-center gap-2 hover:from-rose-600 hover:to-rose-700 transition-all disabled:opacity-50"
          >
            <Lock className="w-4 h-4" />
            {loading ? "Memproses..." : "Tutup Periode"}
          </button>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-xs font-heading font-extrabold text-slate-400 uppercase tracking-wider px-1">
          Riwayat Periode
        </h2>
        {sortedPeriods.length === 0 ? (
          <div className="premium-card p-6 text-center">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-xs text-slate-400 font-medium">Belum ada periode ditutup</p>
          </div>
        ) : (
          sortedPeriods.map((period) => {
            const summary = period.status === "closed"
              ? { totalPendapatan: period.totalPendapatan, totalPengeluaran: period.totalPengeluaran, labaBersih: period.labaBersih }
              : computePeriodSummary(period.periode);
            return (
              <div key={period.id} className="premium-card premium-card-glow p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-heading font-extrabold">{period.periode}</span>
                  </div>
                  <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full ${period.status === "open" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                    {period.status === "open" ? "Terbuka" : "Ditutup"}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded-xl">
                    <div className="flex items-center gap-1 mb-1">
                      <TrendingUp className="w-3 h-3 text-emerald-500" />
                      <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">Pendapatan</span>
                    </div>
                    <p className="text-xs font-heading font-extrabold text-emerald-600 dark:text-emerald-400">{formatRp(summary.totalPendapatan)}</p>
                  </div>
                  <div className="bg-rose-50 dark:bg-rose-950/20 p-2.5 rounded-xl">
                    <div className="flex items-center gap-1 mb-1">
                      <TrendingDown className="w-3 h-3 text-rose-500" />
                      <span className="text-[9px] text-rose-600 dark:text-rose-400 font-bold">Pengeluaran</span>
                    </div>
                    <p className="text-xs font-heading font-extrabold text-rose-600 dark:text-rose-400">{formatRp(summary.totalPengeluaran)}</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-2.5 rounded-xl">
                    <div className="flex items-center gap-1 mb-1">
                      <DollarSign className="w-3 h-3 text-blue-500" />
                      <span className="text-[9px] text-blue-600 dark:text-blue-400 font-bold">Laba Bersih</span>
                    </div>
                    <p className={`text-xs font-heading font-extrabold ${summary.labaBersih >= 0 ? "text-blue-600 dark:text-blue-400" : "text-rose-600 dark:text-rose-400"}`}>{formatRp(summary.labaBersih)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span className="text-[9px] text-slate-400 font-medium">
                      {period.status === "closed"
                        ? `Ditutup ${new Date(period.closedAt!).toLocaleDateString("id-ID")}`
                        : `Dibuat ${new Date(period.createdAt).toLocaleDateString("id-ID")}`}
                    </span>
                  </div>
                  {period.status === "closed" && isAdmin && (
                    <button
                      onClick={() => handleReopenPeriod(period)}
                      disabled={loading}
                      className="text-[10px] font-bold text-amber-500 flex items-center gap-1 hover:text-amber-600 transition-all disabled:opacity-50"
                    >
                      <Unlock className="w-3 h-3" />
                      Buka
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
