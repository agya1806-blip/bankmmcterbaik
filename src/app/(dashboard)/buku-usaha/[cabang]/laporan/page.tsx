"use client";

import React, { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type BookOrBranch } from "@/lib/db-v4";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileSpreadsheet,
  Calendar,
  PieChart,
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

type Period = "all" | "today" | "week" | "month";

export default function LaporanPage() {
  const params = useParams();
  const router = useRouter();
  const cabangSlug = (params?.cabang as string) || "";
  const bookOrBranchId = BRANCH_MAP[cabangSlug] || "usaha-warkop";
  const [period, setPeriod] = useState<Period>("all");

  const transactions =
    useLiveQuery(
      () =>
        db.transactions
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

  const inventory =
    useLiveQuery(
      () =>
        db.inventory
          .where("bookOrBranchId")
          .equals(bookOrBranchId)
          .toArray(),
      [bookOrBranchId]
    ) || [];

  const filteredTx = useMemo(() => {
    const now = new Date();
    return transactions.filter((tx) => {
      const txDate = new Date(tx.tanggal);
      if (period === "today") {
        return txDate.toISOString().slice(0, 10) === now.toISOString().slice(0, 10);
      }
      if (period === "week") {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return txDate >= weekAgo;
      }
      if (period === "month") {
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return txDate >= monthAgo;
      }
      return true;
    });
  }, [transactions, period]);

  const filteredCashflow = useMemo(() => {
    const now = new Date();
    return cashflows.filter((cf) => {
      const cfDate = new Date(cf.tanggal);
      if (period === "today") {
        return cfDate.toISOString().slice(0, 10) === now.toISOString().slice(0, 10);
      }
      if (period === "week") {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return cfDate >= weekAgo;
      }
      if (period === "month") {
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return cfDate >= monthAgo;
      }
      return true;
    });
  }, [cashflows, period]);

  const report = useMemo(() => {
    let totalPendapatan = 0;
    let totalHpp = 0;

    filteredTx.forEach((tx) => {
      totalPendapatan += tx.total;
      try {
        const items = JSON.parse(tx.items);
        items.forEach((item: any) => {
          totalHpp += (item.hpp || 0) * item.qty;
        });
      } catch {}
    });

    const cashflowMasuk = filteredCashflow
      .filter((c) => c.tipe === "masuk")
      .reduce((sum, c) => sum + c.jumlah, 0);
    const cashflowKeluar = filteredCashflow
      .filter((c) => c.tipe === "keluar")
      .reduce((sum, c) => sum + c.jumlah, 0);

    const labaKotor = totalPendapatan - totalHpp;
    const labaBersih = cashflowMasuk - cashflowKeluar;
    const piutangAktif = filteredTx
      .filter((tx) => tx.status === "PIUTANG")
      .reduce((sum, tx) => sum + tx.remainingDebt, 0);

    return {
      totalPendapatan,
      totalHpp,
      labaKotor,
      labaBersih,
      cashflowMasuk,
      cashflowKeluar,
      piutangAktif,
      jumlahTransaksi: filteredTx.length,
      jumlahProduk: inventory.length,
    };
  }, [filteredTx, filteredCashflow, inventory]);

  const exportCSV = () => {
    if (filteredTx.length === 0) return alert("Tidak ada data untuk diekspor!");

    const headers = [
      "No Invoice",
      "Pelanggan",
      "Status",
      "Total",
      "DP",
      "Sisa Piutang",
      "Tanggal",
    ];
    const rows = filteredTx.map((tx) => [
      tx.invoiceNumber,
      tx.customerName,
      tx.status,
      tx.total,
      tx.dpAmount,
      tx.remainingDebt,
      new Date(tx.tanggal).toLocaleString("id-ID"),
    ]);

    let csv = "data:text/csv;charset=utf-8,";
    csv += headers.join(",") + "\n";
    rows.forEach((row) => {
      csv +=
        row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(",") +
        "\n";
    });

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute(
      "download",
      `Laporan_${cabangSlug}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const PERIODS: { key: Period; label: string }[] = [
    { key: "all", label: "Semua" },
    { key: "today", label: "Hari Ini" },
    { key: "week", label: "7 Hari" },
    { key: "month", label: "30 Hari" },
  ];

  return (
    <div className="flex flex-col gap-4 pt-2 pb-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push(`/buku-usaha/${cabangSlug}`)}
          className="p-2 bg-white dark:bg-[#131527] rounded-full shadow-md"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-extrabold tracking-tight">Laporan Keuangan</h1>
        <div className="w-9 h-9" />
      </div>

      {/* Period Filter */}
      <div className="flex gap-2 bg-slate-100 dark:bg-zinc-800 p-1 rounded-2xl">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all ${
              period === p.key
                ? "bg-white dark:bg-[#131527] text-[#7B61FF] shadow-sm"
                : "text-slate-400"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="premium-card p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <span className="text-[10px] text-slate-400 font-bold uppercase">
            Pendapatan
          </span>
          <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
            Rp{report.totalPendapatan.toLocaleString()}
          </span>
        </div>

        <div className="premium-card p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                report.labaBersih >= 0
                  ? "bg-emerald-100 dark:bg-emerald-900/30"
                  : "bg-rose-100 dark:bg-rose-900/30"
              }`}
            >
              {report.labaBersih >= 0 ? (
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
              report.labaBersih >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            Rp{report.labaBersih.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="premium-card p-4 space-y-3">
        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
          Rincian Keuangan
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-medium border-b pb-2 border-slate-100 dark:border-slate-800">
            <span>Jumlah Transaksi</span>
            <span className="font-bold">{report.jumlahTransaksi}</span>
          </div>
          <div className="flex justify-between text-xs font-medium border-b pb-2 border-slate-100 dark:border-slate-800">
            <span>Total HPP Produk</span>
            <span className="font-bold text-rose-500">
              Rp{report.totalHpp.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-xs font-medium border-b pb-2 border-slate-100 dark:border-slate-800">
            <span>Laba Kotor</span>
            <span className="font-bold text-[#7B61FF]">
              Rp{report.labaKotor.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-xs font-medium border-b pb-2 border-slate-100 dark:border-slate-800">
            <span>Cashflow Masuk</span>
            <span className="font-bold text-emerald-500">
              Rp{report.cashflowMasuk.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-xs font-medium border-b pb-2 border-slate-100 dark:border-slate-800">
            <span>Cashflow Keluar</span>
            <span className="font-bold text-rose-500">
              Rp{report.cashflowKeluar.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-xs font-medium">
            <span>Piutang Aktif</span>
            <span className="font-bold text-amber-500">
              Rp{report.piutangAktif.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Inventory Summary */}
      <div className="premium-card p-4">
        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">
          Inventaris
        </h3>
        <div className="flex justify-between text-xs font-medium">
          <span>Total SKU Aktif</span>
          <span className="font-bold">{report.jumlahProduk}</span>
        </div>
      </div>

      {/* Export Button */}
      <button
        onClick={exportCSV}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#7B61FF] to-[#FF5C00] text-white font-extrabold text-sm shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
      >
        <FileSpreadsheet className="w-4 h-4" />
        Ekspor Semua Transaksi (.CSV)
      </button>
    </div>
  );
}
