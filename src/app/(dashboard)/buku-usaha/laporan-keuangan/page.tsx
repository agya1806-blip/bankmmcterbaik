"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Wallet, BarChart3, Printer, Smartphone, Coffee, Shirt,
  ArrowUpRight, DollarSign, Receipt, Clock, Layers,
} from "lucide-react";
import { useBusinessStore, type BizUnit, BIZ_UNIT_LABELS } from "@/store/useBusinessStore";

const BIZ_COLORS: Record<BizUnit, string> = {
  percetakan: "from-indigo-500 to-purple-600",
  gadget: "from-cyan-500 to-blue-600",
  laptop: "from-blue-500 to-indigo-600",
  kedai_kopi: "from-emerald-500 to-emerald-600",
  konveksi: "from-rose-500 to-pink-600",
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

export default function LaporanKeuangan() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const {
    wallets, mutasiLog,
    printingJobs, gadgetItems, laptopBuilds, fashionSKUs, coffeeIngredients,
  } = useBusinessStore();

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

  if (!mounted) return <div className="min-h-[60vh]" />;

  return (
    <div className="max-w-2xl mx-auto pb-20 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="size-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/20">
          <BarChart3 className="size-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold font-heading">Laporan Keuangan</h1>
          <p className="text-xs text-muted-foreground/60">Rekap multi-divisi & kas operasional</p>
        </div>
      </div>

      {/* Ringkasan Global */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-xl shadow-emerald-500/25">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_60%)]" />
          <div className="relative z-10 space-y-1">
            <p className="text-white/70 text-[9px] font-semibold uppercase tracking-widest">Total Kas</p>
            <p className="text-lg font-bold font-heading text-white tabular-nums">{formatRupiah(agg.totalKas)}</p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-blue-500 to-blue-600 shadow-xl shadow-blue-500/25">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_60%)]" />
          <div className="relative z-10 space-y-1">
            <p className="text-white/70 text-[9px] font-semibold uppercase tracking-widest">Revenue</p>
            <p className="text-lg font-bold font-heading text-white tabular-nums">{formatRupiah(agg.totalRevenue)}</p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-rose-500 to-rose-600 shadow-xl shadow-rose-500/25">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_60%)]" />
          <div className="relative z-10 space-y-1">
            <p className="text-white/70 text-[9px] font-semibold uppercase tracking-widest">Total Modal</p>
            <p className="text-lg font-bold font-heading text-white tabular-nums">{formatRupiah(agg.totalModal)}</p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-violet-500 to-purple-600 shadow-xl shadow-violet-500/25">
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
          <Layers className="size-4 text-emerald-500" /> Breakdown Per Unit Bisnis
        </h2>
        <div className="space-y-2">
          {(Object.entries(BIZ_UNIT_LABELS) as [BizUnit, string][]).map(([key, label]) => {
            const u = agg.perUnit[key];
            const Icon = BIZ_ICONS[key];
            return (
              <div key={key} className="floating-card p-4 flex items-start gap-4">
                <div className={`size-10 rounded-xl bg-gradient-to-br ${BIZ_COLORS[key]} flex items-center justify-center shrink-0 shadow-md`}>
                  <Icon className="size-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{label}</p>
                    <span className="text-[10px] text-muted-foreground/50">{u.count} item</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                    <div>
                      <p className="text-[9px] text-muted-foreground/50">Revenue</p>
                      <p className="text-xs font-bold tabular-nums text-emerald-600">{formatRupiah(u.revenue)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground/50">Modal</p>
                      <p className="text-xs font-bold tabular-nums text-rose-500">{formatRupiah(u.modal)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground/50">Laba</p>
                      <p className={`text-xs font-bold tabular-nums ${u.laba >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                        {u.laba >= 0 ? "+" : ""}{formatRupiah(u.laba)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Kas Breakdown */}
      <div>
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
          <Wallet className="size-4 text-emerald-500" /> Kas Operasional
        </h2>
        <div className="space-y-1">
          {wallets.length === 0 ? (
            <div className="floating-card p-6 text-center">
              <Wallet className="size-8 mx-auto text-muted-foreground/20 mb-2" />
              <p className="text-xs text-muted-foreground/40">Belum ada dompet. Tambah dompet di menu Dompet.</p>
            </div>
          ) : wallets.map((w) => {
            const pct = agg.totalKas > 0 ? (w.saldo / agg.totalKas) * 100 : 0;
            return (
              <div key={w.id} className="floating-card p-3 flex items-center gap-3">
                <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${
                  w.tipe === "KasTunai" ? "bg-emerald-500/10 text-emerald-600" :
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
                    <div className="flex-1 h-1.5 rounded-full bg-muted/50 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500" style={{ width: `${Math.min(pct, 100)}%` }} />
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
          <Clock className="size-4 text-emerald-500" /> Mutasi Transfer Terbaru
        </h2>
        {recentMutasi.length === 0 ? (
          <div className="floating-card p-6 text-center">
            <Receipt className="size-8 mx-auto text-muted-foreground/20 mb-2" />
            <p className="text-xs text-muted-foreground/40">Belum ada mutasi transfer</p>
          </div>
        ) : (
          <div className="space-y-1">
            {recentMutasi.map((m) => (
              <div key={m.id} className="floating-card p-3 flex items-center gap-3">
                <div className="size-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
                  <ArrowUpRight className="size-3.5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium truncate">{walletMap.get(m.dariWalletId) || "?"} → {walletMap.get(m.keWalletId) || "?"}</p>
                    <span className="text-xs font-bold tabular-nums text-amber-600">{formatRupiah(m.nominal)}</span>
                  </div>
                  <p className="text-[9px] text-muted-foreground/50">{m.alasan} &middot; {new Date(m.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
