"use client";

import React, { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
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
} from "lucide-react";

const BRANCH_MAP: Record<string, BookOrBranch> = {
  percetakan: "usaha-percetakan",
  laptop: "usaha-laptop",
  gadget: "usaha-gadget",
  warkop: "usaha-warkop",
  kelontong: "usaha-kelontong",
  konveksi: "usaha-konveksi",
  "toko-pakaian": "usaha-toko-pakaian",
};

const BRANCH_LABELS: Record<string, string> = {
  percetakan: "Percetakan",
  laptop: "Laptop & Servis",
  gadget: "Gadget",
  warkop: "Warkop & Kuliner",
  kelontong: "Kelontong",
  konveksi: "Konveksi",
  "toko-pakaian": "Toko Pakaian",
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
      (item) => item.stock <= item.safetyStock
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-extrabold tracking-tight">
            {BRANCH_LABELS[cabangSlug] || cabangSlug}
          </h1>
          <p className="text-[10px] text-slate-400 font-medium">
            Dashboard cabang
          </p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#7B61FF] to-[#FF5C00] flex items-center justify-center text-white text-sm font-extrabold shadow-lg">
          {cabangSlug.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Penjualan Hari Ini */}
        <div className="premium-card p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <span className="text-[10px] text-slate-400 font-bold uppercase">
            Hari Ini
          </span>
          <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
            Rp{stats.totalHariIni.toLocaleString()}
          </span>
        </div>

        {/* Total Transaksi */}
        <div className="premium-card p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-blue-500" />
            </div>
          </div>
          <span className="text-[10px] text-slate-400 font-bold uppercase">
            Total Tx
          </span>
          <span className="text-sm font-extrabold">
            {stats.jumlahTransaksi}
          </span>
        </div>

        {/* Piutang Aktif */}
        <div className="premium-card p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <span className="text-[10px] text-slate-400 font-bold uppercase">
            Piutang
          </span>
          <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400">
            Rp{stats.piutangAktif.toLocaleString()}
          </span>
        </div>

        {/* Laba Bersih */}
        <div className="premium-card p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                stats.labaBersih >= 0
                  ? "bg-emerald-100 dark:bg-emerald-900/30"
                  : "bg-rose-100 dark:bg-rose-900/30"
              }`}
            >
              {stats.labaBersih >= 0 ? (
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-rose-500" />
              )}
            </div>
          </div>
          <span className="text-[10px] text-slate-400 font-bold uppercase">
            Laba Bersih
          </span>
          <span
            className={`text-sm font-extrabold ${
              stats.labaBersih >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            Rp{stats.labaBersih.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Stok Menipis Alert */}
      {stats.stokMenipisCount > 0 && (
        <div className="premium-card p-4 border-amber-300/50 dark:border-amber-700/50">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400">
              Stok Menipis ({stats.stokMenipisCount})
            </span>
          </div>
          <div className="space-y-1.5">
            {stats.stokMenipis.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="flex justify-between text-[11px] font-medium"
              >
                <span className="line-clamp-1">{item.name}</span>
                <span className="text-rose-500 font-bold shrink-0 ml-2">
                  {item.stock} left
                </span>
              </div>
            ))}
          </div>
          {stats.stokMenipisCount > 3 && (
            <button
              onClick={() => router.push("/buku-usaha/inventory")}
              className="mt-2 text-[10px] font-bold text-[#7B61FF] flex items-center gap-1"
            >
              Lihat semua <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => router.push(`/buku-usaha/${cabangSlug}/kasir`)}
          className="premium-card p-3 flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7B61FF] to-[#FF5C00] flex items-center justify-center text-white">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold">Kasir</span>
        </button>
        <button
          onClick={() => router.push("/buku-usaha/inventory")}
          className="premium-card p-3 flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white">
            <Package className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold">Barang</span>
        </button>
        <button
          onClick={() =>
            router.push(`/buku-usaha/${cabangSlug}/pelanggan`)
          }
          className="premium-card p-3 flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white">
            <DollarSign className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold">CRM</span>
        </button>
      </div>

      {/* Riwayat Terakhir */}
      <div className="premium-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
            Riwayat Terakhir
          </h3>
          <button
            onClick={() =>
              router.push(`/buku-usaha/${cabangSlug}/transaksi`)
            }
            className="text-[10px] font-bold text-[#7B61FF] flex items-center gap-1"
          >
            Lihat semua <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        {recentTx.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            Belum ada transaksi
          </div>
        ) : (
          <div className="space-y-2">
            {recentTx.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold line-clamp-1">
                    {tx.customerNama}
                  </p>
                  <p className="text-[9px] text-slate-400">
                    {tx.items.length} item
                  </p>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="text-xs font-extrabold text-[#7B61FF]">
                    Rp{tx.totalBruto.toLocaleString()}
                  </p>
                  <span
                    className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold ${
                      tx.sisaTagihan === 0
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-amber-100 text-amber-600"
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
      <div className="premium-card p-4">
        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">
          Cashflow
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-xl">
            <span className="text-[9px] text-emerald-600 font-bold uppercase">
              Masuk
            </span>
            <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
              Rp{stats.cashflowMasuk.toLocaleString()}
            </p>
          </div>
          <div className="bg-rose-50 dark:bg-rose-950/20 p-3 rounded-xl">
            <span className="text-[9px] text-rose-600 font-bold uppercase">
              Keluar
            </span>
            <p className="text-sm font-extrabold text-rose-600 dark:text-rose-400">
              Rp{stats.cashflowKeluar.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
