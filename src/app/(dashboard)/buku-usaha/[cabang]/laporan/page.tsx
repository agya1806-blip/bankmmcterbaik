"use client";

import React, { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLiveQuery } from "@/hooks/useLiveQuery";
import { db, type BookOrBranch } from "@/lib/db-v4";

const BRANCH_MAP: Record<string, BookOrBranch> = {
  pribadi: "pribadi",
  keluarga: "keluarga",
  percetakan: "usaha-percetakan",
  laptop: "usaha-laptop",
  gadget: "usaha-gadget",
  warkop: "usaha-warkop",
  konveksi: "usaha-konveksi",
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
          <span className="text-sm">◀️</span>
        </button>
        <h1 className="text-lg font-heading font-extrabold tracking-tight">Laporan Keuangan</h1>
        <button
          onClick={exportCSV}
          className="px-4 py-2 bg-gradient-to-r from-[#7B61FF] to-[#FF5C00] text-white rounded-xl text-[10px] font-bold shadow-md hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all duration-200"
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
        {[
          { label: "Pendapatan", value: report.totalPendapatan, color: "emerald" },
          { label: "Laba Bersih", value: report.labaBersih, color: report.labaBersih >= 0 ? "emerald" : "rose" },
        ].map((s, i) => (
          <div key={s.label} className="premium-card premium-card-glow p-4 flex flex-col gap-1.5 animate-slide-up" style={{ animationDelay: `${i * 80}ms`, animationFillMode: "backwards" }}>
            <span className="text-[10px] font-heading font-bold text-slate-400 uppercase tracking-wider">{s.label}</span>
            <span className={`text-lg font-heading font-extrabold tracking-tight text-${s.color}-600 dark:text-${s.color}-400`}>
              Rp{s.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      <div className="premium-card premium-card-glow p-4 space-y-2.5 animate-slide-up" style={{ animationDelay: "200ms", animationFillMode: "backwards" }}>
        <h3 className="text-[10px] font-heading font-extrabold text-slate-400 uppercase tracking-wider">Rincian Keuangan</h3>
        {[
          { label: "Jumlah Transaksi", value: String(report.jumlahTransaksi), color: "", icon: "📊" },
          { label: "Total HPP", value: `Rp${report.totalHpp.toLocaleString()}`, color: "text-rose-500", icon: "💰" },
          { label: "Laba Kotor", value: `Rp${report.labaKotor.toLocaleString()}`, color: "text-[#7B61FF]", icon: "📈" },
          { label: "Cashflow Masuk", value: `Rp${report.cashflowMasuk.toLocaleString()}`, color: "text-emerald-500", icon: "📥" },
          { label: "Cashflow Keluar", value: `Rp${report.cashflowKeluar.toLocaleString()}`, color: "text-rose-500", icon: "📤" },
          { label: "Piutang Aktif", value: `Rp${report.piutangAktif.toLocaleString()}`, color: "text-amber-500", icon: "⏳" },
          { label: "Total Produk", value: String(report.jumlahProduk), color: "", icon: "📦" },
        ].map((row, i) => (
          <div key={i} className="flex justify-between items-center text-xs font-medium border-b pb-2.5 border-slate-100 dark:border-slate-800 last:border-0 last:pb-0 hover:bg-slate-50 dark:hover:bg-zinc-900/50 rounded-lg px-2 -mx-2 transition-colors duration-200">
            <span className="flex items-center gap-2">
              <span className="text-[11px]">{row.icon}</span>
              <span className="text-slate-600 dark:text-slate-300">{row.label}</span>
            </span>
            <span className={`font-heading font-extrabold ${row.color}`}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
