"use client";

import React, { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLiveQuery } from "@/hooks/useLiveQuery";
import {
  db,
  type BookOrBranch,
  type Transaction,
  type Cashflow,
  type Inventory,
} from "@/lib/db-v4";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  Package,
  ArrowRight,
  Clock,
  Wallet,
  BarChart3,
} from "lucide-react";

const BRANCH_MAP: Record<string, BookOrBranch> = {
  percetakan: "usaha-percetakan",
  laptop: "usaha-laptop",
  gadget: "usaha-gadget",
  warkop: "usaha-warkop",
  konveksi: "usaha-konveksi",
};

const BRANCH_LABELS: Record<string, string> = {
  percetakan: "Percetakan",
  gadget: "Gadget",
  laptop: "Komputer & Laptop",
  warkop: "Kedai Kopi",
  konveksi: "Fashion & Konveksi",
};

export default function CabangDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const cabangSlug = (params?.cabang as string) || "";
  const bookOrBranchId = BRANCH_MAP[cabangSlug] || "usaha-warkop";

  const transactions =
    useLiveQuery(
      () =>
        db.transactions
          .where("bookOrBranchId")
          .equals(bookOrBranchId)
          .toArray(),
      [bookOrBranchId]
    ) || [];

  const inventory =
    useLiveQuery(
      () =>
        db.inventory
          .where("bookOrBranchId")
          .equals(bookOrBranchId)
          .toArray(),
      [bookOrBranchId]
    ) || [];

  const cashflows =
    useLiveQuery(
      () =>
        db.cashflows
          .where("bookOrBranchId")
          .equals(bookOrBranchId)
          .toArray(),
      [bookOrBranchId]
    ) || [];

  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const todayTx = transactions.filter(
      (tx) => tx.tanggal.slice(0, 10) === todayStr
    );

    const totalHariIni = todayTx.reduce(
      (sum, tx) => sum + tx.totalBruto,
      0
    );
    const totalKeseluruhan = transactions.reduce(
      (sum, tx) => sum + tx.totalBruto,
      0
    );
    const piutangAktif = transactions
      .filter((tx) => tx.sisaTagihan > 0)
      .reduce((sum, tx) => sum + tx.sisaTagihan, 0);
    const stokMenipis = inventory.filter(
      (item) => item.stok <= item.stokMin
    );
    const cashflowMasuk = cashflows
      .filter((c) => c.tipe === "masuk")
      .reduce((sum, c) => sum + c.nominal, 0);
    const cashflowKeluar = cashflows
      .filter((c) => c.tipe === "keluar")
      .reduce((sum, c) => sum + c.nominal, 0);

    return {
      totalHariIni,
      totalKeseluruhan,
      jumlahTransaksi: transactions.length,
      piutangAktif,
      stokMenipis,
      stokMenipisCount: stokMenipis.length,
      cashflowMasuk,
      cashflowKeluar,
      labaBersih: cashflowMasuk - cashflowKeluar,
    };
  }, [transactions, inventory, cashflows]);

  const recentTx = useMemo(() => {
    return [...transactions]
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
      .slice(0, 5);
  }, [transactions]);

  return (
    <div className="flex flex-col gap-4 pt-2 pb-4 animate-fade-in">
      {/* Header Cabang */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-xl font-heading font-extrabold tracking-tight">
            {BRANCH_LABELS[cabangSlug] || cabangSlug}
          </h1>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
            Dashboard & Analitik
          </p>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#7B61FF] to-[#FF5C00] flex items-center justify-center text-white text-base font-extrabold shadow-lg shadow-indigo-500/20">
          {cabangSlug.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Hari Ini", value: `Rp${stats.totalHariIni.toLocaleString()}`, color: "emerald", icon: DollarSign, key: "hariini" },
          { label: "Total Tx", value: String(stats.jumlahTransaksi), color: "blue", icon: ShoppingCart, key: "totaltx" },
          { label: "Piutang", value: `Rp${stats.piutangAktif.toLocaleString()}`, color: "amber", icon: Clock, key: "piutang" },
          { label: "Laba Bersih", value: `Rp${stats.labaBersih.toLocaleString()}`, color: stats.labaBersih >= 0 ? "emerald" : "rose", icon: stats.labaBersih >= 0 ? TrendingUp : TrendingDown, key: "laba" },
        ].map((s, i) => (
          <div key={s.key} className="premium-card premium-card-glow p-4 flex flex-col gap-1 animate-slide-up" style={{ animationDelay: `${i * 80}ms`, animationFillMode: "backwards" }}>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-7 h-7 rounded-lg bg-${s.color}-100 dark:bg-${s.color}-900/30 flex items-center justify-center`}>
                <s.icon className={`w-4 h-4 text-${s.color}-500`} />
              </div>
            </div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{s.label}</span>
            <span className={`text-sm font-heading font-extrabold tracking-tight text-${s.color}-600 dark:text-${s.color}-400`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Stok Menipis Alert */}
      {stats.stokMenipisCount > 0 && (
        <div className="premium-card p-4 border-amber-300/50 dark:border-amber-700/50 animate-slide-up" style={{ animationDelay: "200ms", animationFillMode: "backwards" }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <span className="text-xs font-heading font-extrabold text-amber-600 dark:text-amber-400">
                Stok Menipis
              </span>
              <span className="badge-alert ml-2">{stats.stokMenipisCount}</span>
            </div>
          </div>
          <div className="space-y-2">
            {stats.stokMenipis.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center text-[11px] font-medium bg-amber-50/50 dark:bg-amber-950/20 p-2 rounded-xl"
              >
                <span className="line-clamp-1 font-bold">{item.nama}</span>
                <span className="text-rose-500 font-extrabold shrink-0 ml-2 bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded-lg text-[10px]">
                  {item.stok} tersisa
                </span>
              </div>
            ))}
          </div>
          {stats.stokMenipisCount > 3 && (
            <button
              onClick={() => router.push(`/buku-usaha/${cabangSlug}/inventory`)}
              className="mt-3 w-full py-2 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1 hover:bg-amber-100 dark:hover:bg-amber-950/40 transition-all duration-200"
            >
              Lihat semua ({stats.stokMenipisCount}) <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { label: "Kasir", slug: "kasir", icon: ShoppingCart, color: "from-[#7B61FF] to-[#FF5C00]" },
          { label: "Barang", slug: "inventory", icon: Package, color: "from-blue-500 to-indigo-500" },
          { label: "CRM", slug: "pelanggan", icon: DollarSign, color: "from-emerald-400 to-teal-500" },
          { label: "Cashflow", slug: "cashflow", icon: Wallet, color: "from-amber-400 to-orange-500" },
          { label: "Transaksi", slug: "transaksi", icon: Clock, color: "from-pink-400 to-rose-500" },
          { label: "Laporan", slug: "laporan", icon: BarChart3, color: "from-purple-400 to-violet-500" },
        ].map((btn, i) => (
          <button
            key={btn.slug}
            onClick={() => router.push(`/buku-usaha/${cabangSlug}/${btn.slug}`)}
            className="premium-card premium-card-glow p-3 flex flex-col items-center gap-1.5 scale-press animate-slide-up"
            style={{ animationDelay: `${200 + i * 60}ms`, animationFillMode: "backwards" }}
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${btn.color} flex items-center justify-center text-white shadow-md transition-transform duration-300 hover:scale-110`}>
              <btn.icon className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-heading font-bold text-slate-600 dark:text-slate-300">{btn.label}</span>
          </button>
        ))}
      </div>

      {/* Riwayat Terakhir */}
      <div className="premium-card premium-card-glow p-4 animate-slide-up" style={{ animationDelay: "350ms", animationFillMode: "backwards" }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[10px] font-heading font-extrabold text-slate-400 uppercase tracking-wider">
            Riwayat Terakhir
          </h3>
          <button
            onClick={() => router.push(`/buku-usaha/${cabangSlug}/transaksi`)}
            className="text-[10px] font-bold text-[#7B61FF] flex items-center gap-1 hover:gap-1.5 transition-all duration-200"
          >
            Lihat semua <ArrowRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
        </div>
        {recentTx.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs animate-fade-in">
            Belum ada transaksi
          </div>
        ) : (
          <div className="space-y-2">
            {recentTx.map((tx, i) => (
              <div
                key={tx.id}
                className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-zinc-900/50 rounded-lg px-2 -mx-2 transition-all duration-200"
                style={{ animationDelay: `${400 + i * 60}ms` }}
              >
                <div className="min-w-0">
                  <p className="text-xs font-heading font-bold line-clamp-1">
                    {tx.customerNama}
                  </p>
                  <p className="text-[9px] text-slate-400 font-medium">
                    {tx.items.length} item
                  </p>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="text-xs font-heading font-extrabold text-[#7B61FF]">
                    Rp{tx.totalBruto.toLocaleString()}
                  </p>
                  <span
                    className={`inline-block text-[8px] px-2 py-0.5 rounded-full font-bold mt-0.5 ${
                      tx.sisaTagihan === 0
                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                        : "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {tx.sisaTagihan === 0 ? "LUNAS" : "PIUTANG"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cashflow Summary */}
      <div className="grid grid-cols-2 gap-3 animate-slide-up" style={{ animationDelay: "400ms", animationFillMode: "backwards" }}>
        <div className="premium-card p-4 flex flex-col gap-1.5 border-emerald-200/40 dark:border-emerald-900/30">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 pulse-dot" style={{ animationDelay: "0s" }} />
            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Pemasukan</span>
          </div>
          <p className="text-sm font-heading font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
            Rp{stats.cashflowMasuk.toLocaleString()}
          </p>
        </div>
        <div className="premium-card p-4 flex flex-col gap-1.5 border-rose-200/40 dark:border-rose-900/30">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500 pulse-dot" style={{ animationDelay: "0.5s" }} />
            <span className="text-[9px] text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider">Pengeluaran</span>
          </div>
          <p className="text-sm font-heading font-extrabold text-rose-600 dark:text-rose-400 tracking-tight">
            Rp{stats.cashflowKeluar.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
