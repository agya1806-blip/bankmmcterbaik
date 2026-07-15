"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db, BOOK_LABELS, BRANCH_SLUGS } from "@/lib/db-v4";
import { ArrowLeft, BarChart3, FileSpreadsheet, FileText, Download } from "lucide-react";
import toast from "react-hot-toast";
import { jsPDF } from "jspdf";

function formatRupiah(n: number) { return `Rp ${n.toLocaleString("id-ID")}`; }

export default function GlobalLaporanPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState<"bulan" | "tahun">("bulan");
  const [data, setData] = useState<{
    perCabang: Record<string, { omzet: number; transaksi: number; piutang: number }>;
    totalOmzet: number;
    totalTransaksi: number;
    totalPiutang: number;
  }>({ perCabang: {}, totalOmzet: 0, totalTransaksi: 0, totalPiutang: 0 });

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    (async () => {
      try {
        const now = new Date();
        const filterKey = periode === "bulan" ? now.toISOString().slice(0, 7) : now.toISOString().slice(0, 4);
        const allTrans = await db.transactions.toArray();
        const filtered = allTrans.filter((t) => t.tanggal?.startsWith(filterKey) && t.status !== "BATAL");

        const piutangAktif = await db.piutang.where("status").equals("AKTIF").toArray();

        const perCabang: Record<string, { omzet: number; transaksi: number; piutang: number }> = {};
        for (const slug of BRANCH_SLUGS) {
          const branchTx = filtered.filter((t) => t.bookOrBranchId === slug);
          const branchPiutang = piutangAktif.filter((p) => p.bookOrBranchId === slug);
          perCabang[slug] = {
            omzet: branchTx.reduce((s, t) => s + t.totalBruto, 0),
            transaksi: branchTx.length,
            piutang: branchPiutang.reduce((s, p) => s + p.sisaPiutang, 0),
          };
        }

        setData({
          perCabang,
          totalOmzet: filtered.reduce((s, t) => s + t.totalBruto, 0),
          totalTransaksi: filtered.length,
          totalPiutang: piutangAktif.reduce((s, p) => s + p.sisaPiutang, 0),
        });
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, [mounted, periode]);

  const exportPdf = async () => {
    try {
      const doc = new jsPDF({ orientation: "landscape" });
      doc.setFontSize(16);
      doc.text("Laporan Laba Rugi Gabungan", 20, 20);
      doc.setFontSize(9);
      let y = 35;
      const headers = ["Cabang", "Omzet", "Transaksi", "Piutang"];
      const cols = [20, 70, 120, 170];
      headers.forEach((h, i) => { doc.text(h, cols[i], y); });
      y += 7;
      BRANCH_SLUGS.forEach((slug) => {
        const d = data.perCabang[slug] || { omzet: 0, transaksi: 0, piutang: 0 };
        if (y > 190) { doc.addPage(); y = 20; }
        doc.text(BOOK_LABELS[slug] || slug, cols[0], y);
        doc.text(formatRupiah(d.omzet), cols[1], y);
        doc.text(String(d.transaksi), cols[2], y);
        doc.text(formatRupiah(d.piutang), cols[3], y);
        y += 6;
      });
      y += 3;
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("TOTAL", cols[0], y);
      doc.text(formatRupiah(data.totalOmzet), cols[1], y);
      doc.text(String(data.totalTransaksi), cols[2], y);
      doc.text(formatRupiah(data.totalPiutang), cols[3], y);
      doc.save(`laporan-global-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("PDF berhasil diunduh");
    } catch { toast.error("Gagal export PDF"); }
  };

  const exportExcel = async () => {
    try {
      const XLSX = await import("xlsx");
      const rows = BRANCH_SLUGS.map((slug) => {
        const d = data.perCabang[slug] || { omzet: 0, transaksi: 0, piutang: 0 };
        return { Cabang: BOOK_LABELS[slug] || slug, Omzet: d.omzet, Transaksi: d.transaksi, Piutang: d.piutang };
      });
      rows.push({ Cabang: "TOTAL", Omzet: data.totalOmzet, Transaksi: data.totalTransaksi, Piutang: data.totalPiutang });
      const ws = XLSX.utils.json_to_sheet(rows);
      ws["!cols"] = [{ wch: 20 }, { wch: 20 }, { wch: 12 }, { wch: 20 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Laporan Global");
      XLSX.writeFile(wb, `laporan-global-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success("Excel berhasil diunduh");
    } catch { toast.error("Gagal export Excel"); }
  };

  if (!mounted || loading) {
    return <div className="space-y-4 animate-pulse"><div className="h-8 w-48 rounded-lg bg-slate-200 dark:bg-slate-800/50" /><div className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800/30" /></div>;
  }

  return (
    <div className="space-y-5 pb-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/buku-global")} className="size-9 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all active:scale-90">
            <ArrowLeft className="size-4 text-slate-500" />
          </button>
          <div className="size-10 rounded-xl bg-gradient-to-r from-[#7B61FF] to-violet-600 flex items-center justify-center shadow-lg">
            <BarChart3 className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold font-heading">Laporan Global</h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Laba rugi gabungan semua cabang</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={exportPdf} className="size-9 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all active:scale-90" title="Export PDF">
            <FileText className="size-4 text-slate-500" />
          </button>
          <button onClick={exportExcel} className="size-9 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all active:scale-90" title="Export Excel">
            <Download className="size-4 text-slate-500" />
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        {(["bulan", "tahun"] as const).map((p) => (
          <button key={p} onClick={() => setPeriode(p)}
            className={`h-9 px-4 rounded-xl text-xs font-semibold transition-all ${
              periode === p ? "btn-gradient" : "btn-ghost"
            }`}>
            {p === "bulan" ? "Bulan Ini" : "Tahun Ini"}
          </button>
        ))}
      </div>

      <div className="premium-card overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200/60 dark:border-slate-800/60">
                <th className="text-left py-3 px-4 font-semibold text-slate-500 dark:text-slate-400">Cabang</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-500 dark:text-slate-400">Omzet</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-500 dark:text-slate-400">Transaksi</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-500 dark:text-slate-400">Piutang</th>
              </tr>
            </thead>
            <tbody>
              {BRANCH_SLUGS.map((slug) => {
                const d = data.perCabang[slug] || { omzet: 0, transaksi: 0, piutang: 0 };
                return (
                  <tr key={slug} className="border-b border-slate-100 dark:border-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">{BOOK_LABELS[slug]}</td>
                    <td className="py-3 px-4 text-right tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold">{formatRupiah(d.omzet)}</td>
                    <td className="py-3 px-4 text-right tabular-nums text-slate-600 dark:text-slate-400">{d.transaksi}</td>
                    <td className="py-3 px-4 text-right tabular-nums text-rose-600 dark:text-rose-400 font-semibold">{formatRupiah(d.piutang)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gradient-to-r from-[#7B61FF]/5 to-[#FF5C00]/5 font-bold">
                <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200">Total Gabungan</td>
                <td className="py-3.5 px-4 text-right tabular-nums text-emerald-600 dark:text-emerald-400">{formatRupiah(data.totalOmzet)}</td>
                <td className="py-3.5 px-4 text-right tabular-nums text-slate-800 dark:text-slate-200">{data.totalTransaksi}</td>
                <td className="py-3.5 px-4 text-right tabular-nums text-rose-600 dark:text-rose-400">{formatRupiah(data.totalPiutang)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
