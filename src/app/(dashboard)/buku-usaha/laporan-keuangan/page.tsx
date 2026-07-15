"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  Wallet, BarChart3, Printer, Smartphone, Coffee, Shirt,
  ArrowUpRight, DollarSign, Receipt, Clock, Layers, Download, RefreshCw,
  Send, FileText,
} from "lucide-react";
import { useBusinessStore, type BizUnit, BIZ_UNIT_LABELS } from "@/store/useBusinessStore";
import { CardSkeleton } from "@/components/ui/skeleton";
import { usePullRefresh } from "@/lib/use-pull-refresh";
import toast from "react-hot-toast";

const BIZ_COLORS: Record<BizUnit, string> = {
  percetakan: "from-[#7B61FF] to-[#FF5C00]",
  gadget: "from-[#7B61FF] to-[#FF5C00]",
  laptop: "from-[#7B61FF] to-[#FF5C00]",
  kedai_kopi: "from-[#7B61FF] to-[#FF5C00]",
  konveksi: "from-[#7B61FF] to-[#FF5C00]",
};

const BIZ_ICONS: Record<BizUnit, React.ElementType> = {
  percetakan: Printer,
  gadget: Smartphone,
  laptop: Smartphone,
  kedai_kopi: Coffee,
  konveksi: Shirt,
};

function formatRupiah(n: number) {
  return `IDR ${n.toLocaleString("id-ID")}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function bulanIni() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function LaporanKeuangan() {
  const reportRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [periode, setPeriode] = useState(bulanIni());
  const [exporting, setExporting] = useState(false);

  useEffect(() => setMounted(true), []);
  const refresh = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 300));
    useBusinessStore.persist.rehydrate();
    toast.success("Data laporan diperbarui");
  }, []);
  const { refreshing, pullDistance, onTouchStart, onTouchMove, onTouchEnd } = usePullRefresh(refresh);

  const store = useBusinessStore();
  const { profile, wallets, mutasiLog, printingJobs, gadgetItems, laptopBuilds, fashionSKUs, coffeeIngredients } = store;

  const agg = useMemo(() => {
    const totalRevenue =
      printingJobs.reduce((s, j) => s + j.hargaJual, 0) +
      gadgetItems.reduce((s, g) => s + g.price, 0) +
      laptopBuilds.reduce((s, l) => s + l.price, 0);

    const totalModal =
      printingJobs.reduce((s, j) => s + j.totalCost, 0) +
      gadgetItems.reduce((s, g) => s + g.hpp, 0) +
      laptopBuilds.reduce((s, l) => s + l.totalHpp, 0);

    const totalKas = wallets.reduce((s, w) => s + w.saldo, 0);
    const labaKotor = totalRevenue - totalModal;

    const perUnit: Record<BizUnit, { revenue: number; modal: number; laba: number; count: number }> = {
      percetakan: { revenue: printingJobs.reduce((s, j) => s + j.hargaJual, 0), modal: printingJobs.reduce((s, j) => s + j.totalCost, 0), laba: printingJobs.reduce((s, j) => s + j.margin, 0), count: printingJobs.length },
      gadget: { revenue: gadgetItems.reduce((s, g) => s + g.price, 0), modal: gadgetItems.reduce((s, g) => s + g.hpp, 0), laba: gadgetItems.reduce((s, g) => s + g.price - g.hpp, 0), count: gadgetItems.length },
      laptop: { revenue: laptopBuilds.reduce((s, l) => s + l.price, 0), modal: laptopBuilds.reduce((s, l) => s + l.totalHpp, 0), laba: laptopBuilds.reduce((s, l) => s + l.margin, 0), count: laptopBuilds.length },
      kedai_kopi: { revenue: 0, modal: 0, laba: 0, count: coffeeIngredients.length },
      konveksi: { revenue: 0, modal: 0, laba: 0, count: fashionSKUs.length },
    };

    return { totalRevenue, totalModal, totalKas, labaKotor, perUnit };
  }, [printingJobs, gadgetItems, laptopBuilds, fashionSKUs, coffeeIngredients, wallets]);

  const recentMutasi = useMemo(() => {
    return [...mutasiLog].sort((a, b) => b.createdAt - a.createdAt).slice(0, 20);
  }, [mutasiLog]);

  const walletMap = useMemo(() => {
    const m = new Map<string, string>();
    wallets.forEach((w) => m.set(w.id, w.namaDompet));
    return m;
  }, [wallets]);

  /* ─── Export PDF ─── */
  const exportPDF = useCallback(async () => {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      html2pdf().set({
        margin: [10, 15, 10, 15],
        filename: `laporan-keuangan-${today()}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: [210, 297], orientation: "portrait" },
      }).from(reportRef.current).save();
      toast.success("PDF laporan siap diunduh");
    } catch {
      toast.error("Gagal export PDF, coba metode Cetak");
    }
    setExporting(false);
  }, []);

  /* ─── Kirim WA ─── */
  const sendWA = useCallback(() => {
    const nama = profile.namaUsaha || "Usaha Saya";
    const lines: string[] = [];
    const t = (s: string) => lines.push(s);

    t(`📊 *LAPORAN KEUANGAN — ${nama}*`);
    t(`🗓 ${periode.replace("-", "/")}`);
    t("");

    t(`💰 *Total Kas:* ${formatRupiah(agg.totalKas)}`);
    t(`📈 *Revenue:* ${formatRupiah(agg.totalRevenue)}`);
    t(`📉 *Modal:* ${formatRupiah(agg.totalModal)}`);
    t(`✅ *Laba Kotor:* ${agg.labaKotor >= 0 ? "+" : ""}${formatRupiah(agg.labaKotor)}`);
    t("");

    t(`*Breakdown per Unit:*`);
    (Object.entries(BIZ_UNIT_LABELS) as [BizUnit, string][]).forEach(([key, label]) => {
      const u = agg.perUnit[key];
      t(`  • ${label}: Rev ${formatRupiah(u.revenue)} | Laba ${formatRupiah(u.laba)} (${u.count} item)`);
    });
    t("");

    t(`*Dompet/Kas:*`);
    if (wallets.length === 0) {
      t("  (belum ada dompet)");
    } else {
      wallets.forEach((w) => {
        t(`  • ${w.namaDompet}: ${formatRupiah(w.saldo)} (${w.tipe})`);
      });
    }
    t("");

    t(`*Mutasi Transfer (${recentMutasi.length} terbaru):*`);
    if (recentMutasi.length === 0) {
      t("  (belum ada mutasi)");
    } else {
      recentMutasi.slice(0, 5).forEach((m) => {
        const dari = walletMap.get(m.dariWalletId) || "?";
        const ke = walletMap.get(m.keWalletId) || "?";
        t(`  • ${dari} → ${ke}: ${formatRupiah(m.nominal)} (${m.alasan})`);
      });
    }
    t("");
    t(`_Laporan dibuat otomatis via MMCBank v3_`);

    const wa = profile.noWhatsapp || "62";
    window.open(`https://wa.me/${wa}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank");
  }, [agg, wallets, recentMutasi, walletMap, profile, periode]);

  /* ─── Export CSV ─── */
  const exportCSV = useCallback(() => {
    const rows: string[][] = [];
    const push = (r: string[]) => rows.push(r);
    push(["Laporan Keuangan", profile.namaUsaha || "", "", ""]);
    push(["Periode", periode, "", ""]);
    push(["Tanggal Cetak", today(), "", ""]);
    push([]);
    push(["Total Kas", formatRupiah(agg.totalKas), "", ""]);
    wallets.forEach((w) => {
      push(["", w.namaDompet, formatRupiah(w.saldo), w.tipe]);
    });
    push([]);
    push(["Unit Bisnis", "Revenue", "Modal", "Laba"]);
    (Object.entries(BIZ_UNIT_LABELS) as [BizUnit, string][]).forEach(([key, label]) => {
      const u = agg.perUnit[key];
      push([label, formatRupiah(u.revenue), formatRupiah(u.modal), formatRupiah(u.laba)]);
    });
    push([]);
    push(["Total", formatRupiah(agg.totalRevenue), formatRupiah(agg.totalModal), formatRupiah(agg.labaKotor)]);
    push([]);
    push(["Mutasi Transfer Terbaru", "", "", ""]);
    push(["Dari", "Ke", "Nominal", "Alasan"]);
    recentMutasi.forEach((m) => {
      push([walletMap.get(m.dariWalletId) || "?", walletMap.get(m.keWalletId) || "?", formatRupiah(m.nominal), m.alasan]);
    });
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-keuangan-${today()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV siap diunduh");
  }, [agg, wallets, recentMutasi, walletMap, profile, periode]);

  if (!mounted) return <div className="grid grid-cols-1 md:grid-cols-3 gap-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>;

  return (
    <div
      className="max-w-2xl mx-auto pb-20 space-y-6 animate-fade-in relative"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {refreshing && (
        <div className="absolute top-0 left-0 right-0 flex items-center justify-center py-3 z-10">
          <RefreshCw className="size-5 animate-spin" />
          <span className="text-[10px] font-semibold ml-2">Memperbarui...</span>
        </div>
      )}
      {pullDistance > 0 && !refreshing && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center z-10 transition-all"
          style={{ height: pullDistance }}
        >
          <RefreshCw className={`size-4 text-muted-foreground/50 transition-transform ${pullDistance >= 60 ? "rotate-180" : ""}`} />
        </div>
      )}

      {/* Header & Periode */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-gradient-to-br from-[#7B61FF] to-[#FF5C00] flex items-center justify-center shadow-xl shadow-[#7B61FF]/20">
            <BarChart3 className="size-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-heading">Laporan Keuangan</h1>
            <p className="text-xs text-muted-foreground/60">{profile.namaUsaha || "Multi-divisi"} &bull; {periode}</p>
          </div>
        </div>
        <input type="month" value={periode} onChange={(e) => setPeriode(e.target.value)}
          className="input-premium text-xs w-36" />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={exportCSV}
          className="btn-ghost flex items-center gap-1.5 px-3 py-2 text-xs font-semibold"
        >
          <Download className="size-3.5" /> CSV
        </button>
        <button onClick={exportPDF} disabled={exporting}
          className="btn-ghost flex items-center gap-1.5 px-3 py-2 text-xs font-semibold disabled:opacity-50"
        >
          <FileText className="size-3.5" /> {exporting ? "..." : "PDF"}
        </button>
        <button onClick={() => window.print()}
          className="btn-ghost flex items-center gap-1.5 px-3 py-2 text-xs font-semibold"
        >
          <Printer className="size-3.5" /> Cetak
        </button>
        <button onClick={sendWA}
          className="btn-ghost flex items-center gap-1.5 px-3 py-2 text-xs font-semibold"
        >
          <Send className="size-3.5" /> Kirim WA
        </button>
      </div>

      {/* ═══════════════ REPORT CONTENT (for PDF) ═══════════════ */}
      <div ref={reportRef} className="space-y-6 premium-card p-5 border border-slate-200/60 dark:border-slate-800/60 print:p-0 print:bg-white">

        {/* Kop Laporan (for print/PDF) */}
        <div className="hidden print:block text-center mb-6">
          <h1 className="text-xl font-bold">{profile.namaUsaha || "LAPORAN KEUANGAN"}</h1>
          <p className="text-sm text-gray-500">Periode: {periode} &bull; Dicetak: {today()}</p>
          <hr className="my-3 border-gray-300" />
        </div>

        {/* Ringkasan Global */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-[#7B61FF] to-[#FF5C00] shadow-xl shadow-[#7B61FF]/25 print:bg-[#7B61FF]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_60%)]" />
            <div className="relative z-10 space-y-1">
              <p className="text-white/70 text-[9px] font-semibold uppercase tracking-widest">Total Kas</p>
              <p className="text-lg font-bold font-heading text-white tabular-nums">{formatRupiah(agg.totalKas)}</p>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-[#7B61FF] to-[#FF5C00] shadow-xl shadow-[#7B61FF]/25 print:bg-[#7B61FF]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_60%)]" />
            <div className="relative z-10 space-y-1">
              <p className="text-white/70 text-[9px] font-semibold uppercase tracking-widest">Revenue</p>
              <p className="text-lg font-bold font-heading text-white tabular-nums">{formatRupiah(agg.totalRevenue)}</p>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-rose-500 to-rose-600 shadow-xl shadow-rose-500/25 print:bg-rose-600">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_60%)]" />
            <div className="relative z-10 space-y-1">
              <p className="text-white/70 text-[9px] font-semibold uppercase tracking-widest">Total Modal</p>
              <p className="text-lg font-bold font-heading text-white tabular-nums">{formatRupiah(agg.totalModal)}</p>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-[#7B61FF] to-[#FF5C00] shadow-xl shadow-[#7B61FF]/25 print:bg-[#7B61FF]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_60%)]" />
            <div className="relative z-10 space-y-1">
              <p className="text-white/70 text-[9px] font-semibold uppercase tracking-widest">Laba Kotor</p>
              <p className={`text-lg font-bold font-heading text-white tabular-nums ${agg.labaKotor < 0 ? "text-red-200" : ""}`}>
                {agg.labaKotor >= 0 ? "+" : ""}{formatRupiah(agg.labaKotor)}
              </p>
            </div>
          </div>
        </div>

        {/* Breakdown Per Unit Bisnis */}
        <div>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
            <Layers className="size-4" /> Breakdown Per Unit Bisnis
          </h2>
          <div className="space-y-2">
            {(Object.entries(BIZ_UNIT_LABELS) as [BizUnit, string][]).map(([key, label]) => {
              const u = agg.perUnit[key];
              const Icon = BIZ_ICONS[key];
              return (
                <div key={key} className="premium-card p-4 space-y-3 border border-slate-200/60 dark:border-slate-800/60 print:border print:border-gray-300 print:rounded-lg">
                  <div className="flex items-start gap-4">
                    <div className={`size-10 rounded-xl bg-gradient-to-br ${BIZ_COLORS[key]} flex items-center justify-center shrink-0 shadow-md print:bg-gray-200 print:rounded`}>
                      <Icon className="size-5 text-white print:text-gray-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">{label}</p>
                        <span className="text-[10px] text-muted-foreground/50">{u.count} item</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <div>
                          <p className="text-[9px] text-muted-foreground/50">Revenue</p>
                          <p className="text-xs font-bold tabular-nums">{formatRupiah(u.revenue)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-muted-foreground/50">Modal</p>
                          <p className="text-xs font-bold tabular-nums text-rose-500">{formatRupiah(u.modal)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-muted-foreground/50">Laba</p>
                          <p className={`text-xs font-bold tabular-nums ${u.laba >= 0 ? "" : "text-rose-500"}`}>
                            {u.laba >= 0 ? "+" : ""}{formatRupiah(u.laba)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Detail items per unit */}
                  {(key === "percetakan" && printingJobs.length > 0) && (
                    <div className="border-t border-slate-200/60 dark:border-slate-800/60 pt-2 space-y-1">
                      <p className="text-[9px] text-muted-foreground/40 font-semibold uppercase tracking-wider">Item Detail</p>
                      <div className="max-h-36 overflow-y-auto space-y-1">
                        {printingJobs.map((j, i) => (
                          <div key={i} className="flex items-center justify-between text-[9px] py-0.5">
                            <span className="truncate text-muted-foreground/70">Job #{i + 1} ({j.type})</span>
                            <span className="tabular-nums font-semibold text-muted-foreground/60 shrink-0 ml-2">{formatRupiah(j.hargaJual)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {(key === "gadget" && gadgetItems.length > 0) && (
                    <div className="border-t border-slate-200/60 dark:border-slate-800/60 pt-2 space-y-1">
                      <p className="text-[9px] text-muted-foreground/40 font-semibold uppercase tracking-wider">Item Detail</p>
                      <div className="max-h-36 overflow-y-auto space-y-1">
                        {gadgetItems.map((g, i) => (
                          <div key={i} className="flex items-center justify-between text-[9px] py-0.5">
                            <span className="truncate text-muted-foreground/70">{g.model || `Item #${i + 1}`}</span>
                            <span className="tabular-nums font-semibold text-muted-foreground/60 shrink-0 ml-2">{formatRupiah(g.price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {(key === "laptop" && laptopBuilds.length > 0) && (
                    <div className="border-t border-slate-200/60 dark:border-slate-800/60 pt-2 space-y-1">
                      <p className="text-[9px] text-muted-foreground/40 font-semibold uppercase tracking-wider">Item Detail</p>
                      <div className="max-h-36 overflow-y-auto space-y-1">
                        {laptopBuilds.map((l, i) => (
                          <div key={i} className="flex items-center justify-between text-[9px] py-0.5">
                            <span className="truncate text-muted-foreground/70">SN: {l.sn || `Build #${i + 1}`}</span>
                            <span className="tabular-nums font-semibold text-muted-foreground/60 shrink-0 ml-2">{formatRupiah(l.price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {(key === "konveksi" && fashionSKUs.length > 0) && (
                    <div className="border-t border-slate-200/60 dark:border-slate-800/60 pt-2 space-y-1">
                      <p className="text-[9px] text-muted-foreground/40 font-semibold uppercase tracking-wider">Item Detail</p>
                      <div className="max-h-36 overflow-y-auto space-y-1">
                        {fashionSKUs.map((f, i) => (
                          <div key={i} className="flex items-center justify-between text-[9px] py-0.5">
                            <span className="truncate text-muted-foreground/70">{f.productName || `SKU #${i + 1}`}</span>
                            <span className="tabular-nums font-semibold text-muted-foreground/60 shrink-0 ml-2">{formatRupiah(f.hpp || f.price || 0)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Tabel Ringkasan (for PDF print) */}
        <div className="hidden print:block">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-400">
                <th className="text-left py-2 font-bold">Unit Bisnis</th>
                <th className="text-right py-2 font-bold">Revenue</th>
                <th className="text-right py-2 font-bold">Modal</th>
                <th className="text-right py-2 font-bold">Laba</th>
              </tr>
            </thead>
            <tbody>
              {(Object.entries(BIZ_UNIT_LABELS) as [BizUnit, string][]).map(([key, label]) => {
                const u = agg.perUnit[key];
                return (
                  <tr key={key} className="border-b border-gray-200">
                    <td className="py-1.5">{label}</td>
                    <td className="text-right py-1.5 tabular-nums">{formatRupiah(u.revenue)}</td>
                    <td className="text-right py-1.5 tabular-nums">{formatRupiah(u.modal)}</td>
                    <td className="text-right py-1.5 tabular-nums">{formatRupiah(u.laba)}</td>
                  </tr>
                );
              })}
              <tr className="border-t-2 border-gray-400 font-bold">
                <td className="py-2">TOTAL</td>
                <td className="text-right py-2 tabular-nums">{formatRupiah(agg.totalRevenue)}</td>
                <td className="text-right py-2 tabular-nums">{formatRupiah(agg.totalModal)}</td>
                <td className="text-right py-2 tabular-nums">{agg.labaKotor >= 0 ? "+" : ""}{formatRupiah(agg.labaKotor)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Kas Breakdown */}
        <div>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
            <Wallet className="size-4" /> Kas Operasional
          </h2>
          <div className="space-y-1">
            {wallets.length === 0 ? (
              <div className="premium-card p-6 text-center border border-slate-200/60 dark:border-slate-800/60">
                <Wallet className="size-8 mx-auto text-muted-foreground/20 mb-2" />
                <p className="text-xs text-muted-foreground/40">Belum ada dompet. Tambah dompet di menu Dompet.</p>
              </div>
            ) : wallets.map((w) => {
              const pct = agg.totalKas > 0 ? (w.saldo / agg.totalKas) * 100 : 0;
              return (
                <div key={w.id} className="premium-card p-3 flex items-center gap-3 border border-slate-200/60 dark:border-slate-800/60 print:border print:border-gray-300 print:rounded-lg">
                  <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${
                    w.tipe === "KasTunai" ? "bg-[#7B61FF]/10" :
                    w.tipe === "Bank" ? "bg-blue-500/10 text-blue-600" :
                    "bg-violet-500/10 text-violet-600"
                  }`}>
                    <DollarSign className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium">{w.namaDompet}</p>
                      <span className="text-xs font-bold tabular-nums">{formatRupiah(w.saldo)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 rounded-full bg-white/90 dark:bg-[#131527]/90 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#7B61FF] to-[#FF5C00]" style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                      <span className="text-[9px] text-muted-foreground/50">{pct.toFixed(1)}%</span>
                    </div>
                    <p className="text-[9px] text-muted-foreground/40 mt-0.5">{w.tipe} &middot; {w.catatan}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mutasi Terbaru */}
        <div>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
            <Clock className="size-4" /> Mutasi Transfer Terbaru
          </h2>
          {recentMutasi.length === 0 ? (
            <div className="premium-card p-6 text-center border border-slate-200/60 dark:border-slate-800/60">
              <Receipt className="size-8 mx-auto text-muted-foreground/20 mb-2" />
              <p className="text-xs text-muted-foreground/40">Belum ada mutasi transfer</p>
            </div>
          ) : (
            <div className="space-y-1">
              {recentMutasi.map((m) => (
                <div key={m.id} className="premium-card p-3 flex items-center gap-3 border border-slate-200/60 dark:border-slate-800/60 print:border print:border-gray-300 print:rounded-lg">
                  <div className="size-8 rounded-lg bg-gradient-to-br from-[#7B61FF] to-[#FF5C00] flex items-center justify-center shrink-0">
                    <ArrowUpRight className="size-3.5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium truncate">{walletMap.get(m.dariWalletId) || "?"} → {walletMap.get(m.keWalletId) || "?"}</p>
                      <span className="text-xs font-bold tabular-nums">{formatRupiah(m.nominal)}</span>
                    </div>
                    <p className="text-[9px] text-muted-foreground/50">{m.alasan} &middot; {new Date(m.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer (for print/PDF) */}
        <div className="hidden print:block text-center text-xs text-gray-400 mt-8 pt-4 border-t border-gray-200">
          <p>Laporan dibuat otomatis via MMCBank v3 &bull; {today()}</p>
        </div>
      </div>
    </div>
  );
}
