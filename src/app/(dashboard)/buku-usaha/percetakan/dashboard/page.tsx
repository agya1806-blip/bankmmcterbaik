"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle, Clock,
  Plus, Download, Printer, Search,
  ArrowRight, Trash2, Settings,
} from "lucide-react";
import toast from "react-hot-toast";
import { useProfilUsahaStore } from "../store/useProfilUsahaStore";

/* ─── Types ─── */
type StatusAntrean = "antrean-desain" | "proses-cetak" | "finishing" | "selesai";

interface ProductionItem {
  id: string;
  tanggal: string;
  customer: string;
  deskripsi: string;
  tipe: string;
  totalHPP: number;
  totalJual: number;
  status: StatusAntrean;
  wasteAkumulasi: number;
}

const STATUS_CFG: Record<StatusAntrean, { label: string; color: string; next: StatusAntrean }> = {
  "antrean-desain": { label: "Antrean Desain", color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400", next: "proses-cetak" },
  "proses-cetak": { label: "Proses Cetak", color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400", next: "finishing" },
  "finishing": { label: "Finishing", color: "text-violet-600 bg-violet-100 dark:bg-violet-900/30 dark:text-violet-400", next: "selesai" },
  "selesai": { label: "Siap Diambil", color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400", next: "selesai" },
};

const STATUS_ORDER: StatusAntrean[] = ["antrean-desain", "proses-cetak", "finishing", "selesai"];

const FIXED_OPERATIONAL_COST = 5_000_000;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatRupiah(n: number) {
  return `IDR ${n.toLocaleString("id-ID")}`;
}

const MOCK_ORDERS: ProductionItem[] = [
  { id: "PRT-001", tanggal: "2026-07-13", customer: "Toko Buku Alea", deskripsi: "Banner Flexi 3x2m x 2 pcs", tipe: "meteran", totalHPP: 165000, totalJual: 360000, status: "selesai", wasteAkumulasi: 0.6 },
  { id: "PRT-002", tanggal: "2026-07-13", customer: "CV Karya Mandiri", deskripsi: "Cetak Buku 100 hlm x 50 eks", tipe: "buku", totalHPP: 4250000, totalJual: 8750000, status: "finishing", wasteAkumulasi: 0 },
  { id: "PRT-003", tanggal: "2026-07-12", customer: "UD Sinar Abadi", deskripsi: "Stiker Ritrama 1x0.5m x 10 lbr", tipe: "meteran", totalHPP: 425000, totalJual: 780000, status: "proses-cetak", wasteAkumulasi: 0.125 },
  { id: "PRT-004", tanggal: "2026-07-12", customer: "Yayasan Pendidikan Al-Falah", deskripsi: "Spanduk Korchin 5x2m", tipe: "meteran", totalHPP: 378000, totalJual: 700000, status: "antrean-desain", wasteAkumulasi: 1.0 },
  { id: "PRT-005", tanggal: "2026-07-11", customer: "Toko Buku Alea", deskripsi: "Cetak Buku 200 hlm hardcover x 10 eks", tipe: "buku", totalHPP: 2400000, totalJual: 5200000, status: "selesai", wasteAkumulasi: 0 },
];

export default function DashboardPercetakan() {
  const router = useRouter();
  const { profil } = useProfilUsahaStore();
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<ProductionItem[]>(MOCK_ORDERS);
  const [search, setSearch] = useState("");

  useEffect(() => setMounted(true), []);

  const updateStatus = useCallback((id: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        const next = STATUS_CFG[o.status].next;
        if (next === o.status) {
          toast.success(`Order ${id} sudah selesai`);
          return o;
        }
        toast.success(`Order ${id} → ${STATUS_CFG[next].label}`);
        return { ...o, status: next };
      })
    );
  }, []);

  const hapusOrder = useCallback((id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
    toast.success(`Order ${id} dihapus`);
  }, []);

  /* KPI */
  const kpi = useMemo(() => {
    const omzet = orders.filter((o) => o.status === "selesai").reduce((s, o) => s + o.totalJual, 0);
    const hpp = orders.filter((o) => o.status === "selesai").reduce((s, o) => s + o.totalHPP, 0);
    const labaKotor = omzet - hpp;
    const labaBersih = labaKotor - FIXED_OPERATIONAL_COST;
    return { omzet, hpp, labaKotor, labaBersih };
  }, [orders]);

  /* Waste */
  const wasteData = useMemo(() => {
    const bulanIni = todayISO().slice(0, 7);
    const totalWaste = orders
      .filter((o) => o.tanggal.startsWith(bulanIni))
      .reduce((s, o) => s + o.wasteAkumulasi, 0);
    const targetWaste = 10;
    const rasio = Math.min((totalWaste / targetWaste) * 100, 100);
    return { totalWaste, rasio, efisien: rasio < 50 };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (!search) return orders;
    const q = search.toLowerCase();
    return orders.filter((o) => o.customer.toLowerCase().includes(q) || o.id.toLowerCase().includes(q));
  }, [orders, search]);

  const exportXLSX = useCallback(() => {
    const header = "No Invoice,Customer,Tipe,Deskripsi,HPP,Jual,Status,Tanggal\n";
    const rows = orders.map((o) =>
      `"${o.id}","${o.customer}","${o.tipe}","${o.deskripsi}",${o.totalHPP},${o.totalJual},"${STATUS_CFG[o.status].label}","${o.tanggal}"`
    ).join("\n");
    const blob = new Blob(["\uFEFF" + header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Laporan-Percetakan-${todayISO()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("File CSV laporan di-download");
  }, [orders]);

  if (!mounted) return <div className="min-h-[60vh]" />;

  return (
    <div className="max-w-2xl mx-auto pb-20 space-y-5 animate-fade-in">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/20">
            <Printer className="size-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-heading">{profil.nama || "Dashboard Percetakan"}</h1>
            <p className="text-xs text-muted-foreground/60">Pusat komando operasional &mdash; {profil.alamat || "Divisi Percetakan"}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push("/buku-usaha/pengaturan")}
            className="px-2.5 py-2 rounded-xl bg-muted/40 text-muted-foreground text-[10px] font-bold hover:bg-muted/60 hover:scale-105 active:scale-95 transition-all flex items-center gap-1"
            title="Pengaturan Profil Usaha"
          >
            <Settings className="size-3.5" /> Pengaturan
          </button>
          <button
            onClick={() => router.push("/buku-usaha/percetakan/kasir")}
            className="px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[10px] font-bold shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Plus className="size-3.5" /> Buat Order Baru
          </button>
          <button
            onClick={exportXLSX}
            className="px-3 py-2 rounded-xl bg-muted/50 text-muted-foreground text-[10px] font-bold hover:bg-muted/80 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Download className="size-3.5" /> Excel
          </button>
        </div>
      </div>

      {/* ─── 4 KPI Cards ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-xl shadow-emerald-500/25">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_60%)]" />
          <div className="relative z-10 space-y-1">
            <p className="text-white/70 text-[9px] font-semibold uppercase tracking-widest">Omzet Kotor</p>
            <p className="text-lg font-bold font-heading text-white tabular-nums">{formatRupiah(kpi.omzet)}</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-rose-500 to-rose-600 shadow-xl shadow-rose-500/25">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_60%)]" />
          <div className="relative z-10 space-y-1">
            <p className="text-white/70 text-[9px] font-semibold uppercase tracking-widest">Modal (HPP)</p>
            <p className="text-lg font-bold font-heading text-white tabular-nums">{formatRupiah(kpi.hpp)}</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-amber-500 to-orange-600 shadow-xl shadow-amber-500/25">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_60%)]" />
          <div className="relative z-10 space-y-1">
            <p className="text-white/70 text-[9px] font-semibold uppercase tracking-widest">Laba Kotor</p>
            <p className={`text-lg font-bold font-heading text-white tabular-nums ${kpi.labaKotor < 0 ? "text-red-200" : ""}`}>
              {kpi.labaKotor >= 0 ? "+" : ""}{formatRupiah(kpi.labaKotor)}
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-violet-500 to-purple-600 shadow-xl shadow-violet-500/25">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_60%)]" />
          <div className="relative z-10 space-y-1">
            <p className="text-white/70 text-[9px] font-semibold uppercase tracking-widest">Laba Bersih</p>
            <p className={`text-lg font-bold font-heading text-white tabular-nums ${kpi.labaBersih < 0 ? "text-red-200" : ""}`}>
              {kpi.labaBersih >= 0 ? "+" : ""}{formatRupiah(kpi.labaBersih)}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Waste Monitor ─── */}
      <div className="floating-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold flex items-center gap-1.5">
            <AlertTriangle className="size-3.5 text-amber-500" /> Waste &amp; Material Monitor
          </p>
          <span className="text-[10px] text-muted-foreground/50">Bulan Ini</span>
        </div>
        <div className="flex items-end justify-between mb-1">
          <div>
            <p className="text-[10px] text-muted-foreground/60">Akumulasi Limbah Bahan</p>
            <p className="text-lg font-bold font-heading tabular-nums text-amber-500">{wasteData.totalWaste.toFixed(2)} m²</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground/60">Efisiensi</p>
            <p className={`text-lg font-bold font-heading ${wasteData.efisien ? "text-emerald-500" : "text-rose-500"}`}>
              {wasteData.efisien ? "Baik" : "Boros"}
            </p>
          </div>
        </div>
        <div className="h-2.5 rounded-full bg-muted/50 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              wasteData.efisien
                ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                : "bg-gradient-to-r from-amber-400 to-rose-500"
            }`}
            style={{ width: `${wasteData.rasio}%` }}
          />
        </div>
        <p className="text-[9px] text-muted-foreground/40">
          {wasteData.totalWaste > 0
            ? `${wasteData.totalWaste.toFixed(2)} m² dari target ${10} m² (${wasteData.rasio.toFixed(0)}%)`
            : "Belum ada data waste bulan ini"}
        </p>
      </div>

      {/* ─── Workflow Production Board ─── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold flex items-center gap-1.5">
            <Clock className="size-4 text-indigo-500" /> Workflow Production Board
          </h2>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari..."
              className="input-premium w-32 text-[10px] pl-6"
            />
          </div>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
          {STATUS_ORDER.map((st) => (
            <p key={st} className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-wider text-center">
              {STATUS_CFG[st].label}
            </p>
          ))}
        </div>

        {/* Board */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {STATUS_ORDER.map((st) => {
            const items = filteredOrders.filter((o) => o.status === st);
            return (
              <div key={st} className="space-y-1.5">
                {items.length === 0 ? (
                  <div className="h-16 rounded-xl bg-muted/10 border border-dashed border-muted/30 flex items-center justify-center">
                    <p className="text-[8px] text-muted-foreground/30">Kosong</p>
                  </div>
                ) : (
                  items.map((o) => (
                    <div
                      key={o.id}
                      className="floating-card p-2 space-y-1 hover:shadow-md transition-shadow cursor-pointer group"
                      onClick={() => updateStatus(o.id)}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-[8px] font-semibold truncate leading-tight">{o.id}</p>
                        <button
                          onClick={(e) => { e.stopPropagation(); hapusOrder(o.id); }}
                          className="size-4 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all shrink-0"
                        >
                          <Trash2 className="size-2.5 text-rose-500" />
                        </button>
                      </div>
                      <p className="text-[7px] text-muted-foreground/60 truncate leading-tight">{o.customer}</p>
                      <p className="text-[7px] text-muted-foreground/40 truncate leading-tight">{o.deskripsi}</p>
                      <div className="flex items-center justify-between pt-0.5">
                        <p className="text-[7px] font-semibold tabular-nums text-emerald-600">{formatRupiah(o.totalJual)}</p>
                        {st !== "selesai" && (
                          <ArrowRight className="size-2.5 text-muted-foreground/30 group-hover:text-indigo-500 transition-colors" />
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

      {/* ─── Floating Action ─── */}
      <div className="fixed bottom-6 right-6 z-30 flex flex-col gap-2 items-end">
        <button
          onClick={() => router.push("/buku-usaha/percetakan/kasir")}
          className="size-14 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-2xl shadow-indigo-500/40 hover:shadow-indigo-500/60 hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
        >
          <Plus className="size-6" />
        </button>
        <p className="text-[9px] text-muted-foreground/50 font-medium bg-background/80 backdrop-blur-sm px-2 py-0.5 rounded-full shadow-sm">
          Buat Order Baru
        </p>
      </div>
    </div>
  );
}
