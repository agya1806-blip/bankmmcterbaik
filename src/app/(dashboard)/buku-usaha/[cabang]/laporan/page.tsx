"use client";

import React, { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type BookOrBranch } from "@/lib/db-v4";
import {
  ArrowLeft, TrendingUp, TrendingDown, DollarSign,
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
      () => db.transactions.where("bookOrBranchId").equals(bookOrBranchId).toArray(),
      [bookOrBranchId]
    ) || [];

  const cashflows =
    useLiveQuery(
      () => db.cashflows.where("bookOrBranchId").equals(bookOrBranchId).toArray(),
      [bookOrBranchId]
    ) || [];

  const inventory =
    useLiveQuery(
      () => db.inventory.where("bookOrBranchId").equals(bookOrBranchId).toArray(),
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
      const cfDate = new Date(cf.createdAt);
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
      totalPendapatan += tx.totalBruto;
      const items = Array.isArray(tx.items) ? tx.items : [];
      items.forEach((item: any) => {
        totalHpp += (item.hargaModal || 0) * item.qty;
      });
    });

    const cashflowMasuk = filteredCashflow
      .filter((c) => c.tipe === "masuk")
      .reduce((sum, c) => sum + c.nominal, 0);
    const cashflowKeluar = filteredCashflow
      .filter((c) => c.tipe === "keluar")
      .reduce((sum, c) => sum + c.nominal, 0);

    const labaKotor = totalPendapatan - totalHpp;
    const labaBersih = cashflowMasuk - cashflowKeluar;
    const piutangAktif = filteredTx
      .filter((tx) => tx.sisaTagihan > 0)
      .reduce((sum, tx) => sum + tx.sisaTagihan, 0);

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
    const headers = ["No Invoice", "Pelanggan", "Status", "Total", "DP", "Sisa Piutang", "Tanggal"];
    const rows = filteredTx.map((tx) => [
      tx.invoiceNumber,
      tx.customerNama,
      tx.status,
      tx.totalBruto,
      tx.dpDibayar,
      tx.sisaTagihan,
      new Date(tx.tanggal).toLocaleString("id-ID"),
    ]);
    let csv = "data:text/csv;charset=utf-8,";
    csv += headers.join(",") + "\n";
    rows.forEach((row) => {
      csv += row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(",") + "\n";
    });
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `Laporan_${cabangSlug}_${new Date().toISOString().slice(0, 10)}.csv`);
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
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push(`/buku-usaha/${cabangSlug}`)}
          className="p-2 bg-white dark:bg-[#131527] rounded-full shadow-md"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-extrabold tracking-tight">Laporan Keuangan</h1>
        <button
          onClick={exportCSV}
          className="px-3 py-1.5 bg-[#7B61FF] text-white rounded-xl text-[10px] font-bold"
        >
          Export CSV
        </button>
      </div>

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

      <div className="grid grid-cols-2 gap-3">
        <div className="premium-card p-4 flex flex-col gap-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Pendapatan</span>
          <span className="text-sm font-extrabold text-emerald-600">
            Rp{report.totalPendapatan.toLocaleString()}
          </span>
        </div>
        <div className="premium-card p-4 flex flex-col gap-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Laba Bersih</span>
          <span className={`text-sm font-extrabold ${report.labaBersih >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            Rp{report.labaBersih.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="premium-card p-4 space-y-3">
        <h3 className="text-xs font-extrabold text-slate-400 uppercase">Rincian Keuangan</h3>
        {[
          { label: "Jumlah Transaksi", value: String(report.jumlahTransaksi), color: "" },
          { label: "Total HPP", value: `Rp${report.totalHpp.toLocaleString()}`, color: "text-rose-500" },
          { label: "Laba Kotor", value: `Rp${report.labaKotor.toLocaleString()}`, color: "text-[#7B61FF]" },
          { label: "Cashflow Masuk", value: `Rp${report.cashflowMasuk.toLocaleString()}`, color: "text-emerald-500" },
          { label: "Cashflow Keluar", value: `Rp${report.cashflowKeluar.toLocaleString()}`, color: "text-rose-500" },
          { label: "Piutang Aktif", value: `Rp${report.piutangAktif.toLocaleString()}`, color: "text-amber-500" },
          { label: "Total Produk", value: String(report.jumlahProduk), color: "" },
        ].map((row, i) => (
          <div key={i} className="flex justify-between text-xs font-medium border-b pb-2 border-slate-100 dark:border-slate-800">
            <span>{row.label}</span>
            <span className={`font-bold ${row.color}`}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
