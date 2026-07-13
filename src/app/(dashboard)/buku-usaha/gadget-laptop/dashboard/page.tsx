"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Smartphone, Laptop, TrendingUp, TrendingDown, DollarSign, Package,
  AlertTriangle, Shield, Clock, Plus, Download, Settings, Search,
  CheckCircle2, Wrench, Box, RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import { useProfilUsahaStore } from "../../percetakan/store/useProfilUsahaStore";

/* ─── Types ─── */
interface UnitStok {
  id: string;
  brand: string;
  tipe: string;
  imeiSn: string;
  kondisi: "baru" | "second" | "servis";
  hargaModal: number;
  hargaJual: number;
  qty: number;
  garansiHingga: string; /* ISO date */
  masuk: string;
}

interface Penjualan {
  id: string;
  tanggal: string;
  unit: string;
  hpp: number;
  jual: number;
}

/* ─── Mock Data ─── */
const MOCK_STOK: UnitStok[] = [
  { id: "STK-001", brand: "iPhone", tipe: "15 Pro Max 256GB", imeiSn: "356789012345678", kondisi: "baru", hargaModal: 18000000, hargaJual: 22500000, qty: 3, garansiHingga: "2027-07-13", masuk: "2026-06-01" },
  { id: "STK-002", brand: "Samsung", tipe: "Galaxy S24 Ultra", imeiSn: "356789012345679", kondisi: "baru", hargaModal: 16000000, hargaJual: 20000000, qty: 1, garansiHingga: "2027-07-13", masuk: "2026-06-15" },
  { id: "STK-003", brand: "Lenovo", tipe: "ThinkPad X1 Carbon", imeiSn: "SN-LEN-0012345", kondisi: "second", hargaModal: 8500000, hargaJual: 11000000, qty: 1, garansiHingga: "2026-10-13", masuk: "2026-05-20" },
  { id: "STK-004", brand: "iPhone", tipe: "14 Pro 128GB", imeiSn: "356789012345680", kondisi: "second", hargaModal: 9000000, hargaJual: 12000000, qty: 0, garansiHingga: "2026-09-13", masuk: "2026-04-10" },
  { id: "STK-005", brand: "ASUS", tipe: "ROG Zephyrus G14", imeiSn: "SN-ASUS-006789", kondisi: "servis", hargaModal: 14000000, hargaJual: 18000000, qty: 1, garansiHingga: "2027-01-13", masuk: "2026-07-01" },
  { id: "STK-006", brand: "Samsung", tipe: "Galaxy Tab S9", imeiSn: "356789012345681", kondisi: "baru", hargaModal: 7500000, hargaJual: 9500000, qty: 2, garansiHingga: "2027-07-13", masuk: "2026-07-05" },
  { id: "STK-007", brand: "Xiaomi", tipe: "Redmi Note 13 Pro", imeiSn: "356789012345682", kondisi: "baru", hargaModal: 2800000, hargaJual: 3800000, qty: 5, garansiHingga: "2027-07-13", masuk: "2026-07-10" },
  { id: "STK-008", brand: "Apple", tipe: "MacBook Air M3", imeiSn: "SN-APPLE-008888", kondisi: "baru", hargaModal: 14500000, hargaJual: 18500000, qty: 1, garansiHingga: "2027-07-13", masuk: "2026-06-20" },
  { id: "STK-009", brand: "Samsung", tipe: "Galaxy A55", imeiSn: "356789012345683", kondisi: "second", hargaModal: 2800000, hargaJual: 3800000, qty: 2, garansiHingga: "2026-12-13", masuk: "2026-05-01" },
];

const MOCK_PENJUALAN: Penjualan[] = [
  { id: "GL-001", tanggal: "2026-07-13", unit: "iPhone 15 Pro Max 256GB", hpp: 18000000, jual: 22500000 },
  { id: "GL-002", tanggal: "2026-07-12", unit: "Samsung Galaxy S24 Ultra", hpp: 16000000, jual: 20000000 },
  { id: "GL-003", tanggal: "2026-07-11", unit: "Lenovo ThinkPad X1 Carbon (Second)", hpp: 8500000, jual: 11000000 },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatRupiah(n: number) {
  return `IDR ${n.toLocaleString("id-ID")}`;
}

function daysUntil(date: string) {
  const now = new Date();
  const target = new Date(date);
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function DashboardGadgetLaptop() {
  const router = useRouter();
  const { profil } = useProfilUsahaStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  /* ─── KPI ─── */
  const kpi = useMemo(() => {
    const bulanIni = todayISO().slice(0, 7);
    const terjualBulanIni = MOCK_PENJUALAN.filter((p) => p.tanggal.startsWith(bulanIni));
    const omzet = terjualBulanIni.reduce((s, p) => s + p.jual, 0);
    const hpp = terjualBulanIni.reduce((s, p) => s + p.hpp, 0);
    const labaKotor = omzet - hpp;
    const unitTerjual = terjualBulanIni.length;
    return { omzet, hpp, labaKotor, unitTerjual };
  }, []);

  /* ─── Stok Breakdown ─── */
  const stokBreakdown = useMemo(() => {
    const baru = MOCK_STOK.filter((s) => s.kondisi === "baru").reduce((sum, s) => sum + s.qty, 0);
    const second = MOCK_STOK.filter((s) => s.kondisi === "second").reduce((sum, s) => sum + s.qty, 0);
    const servis = MOCK_STOK.filter((s) => s.kondisi === "servis").reduce((sum, s) => sum + s.qty, 0);
    return { baru, second, servis };
  }, []);

  /* ─── Low Stock + Warranty Alert ─── */
  const lowStock = useMemo(() => MOCK_STOK.filter((s) => s.qty > 0 && s.qty < 2), []);
  const warrantyExpiring = useMemo(
    () => MOCK_STOK.filter((s) => {
      const days = daysUntil(s.garansiHingga);
      return days >= 0 && days <= 7;
    }),
    []
  );

  const exportXLSX = useCallback(() => {
    const header = "Kode,Brand,Tipe,IMEI/SN,Kondisi,Modal,Jual,Qty,GaransiHingga\n";
    const rows = MOCK_STOK.map((s) =>
      `"${s.id}","${s.brand}","${s.tipe}","${s.imeiSn}","${s.kondisi}",${s.hargaModal},${s.hargaJual},${s.qty},"${s.garansiHingga}"`
    ).join("\n");
    const blob = new Blob(["\uFEFF" + header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Stok-Gadget-${todayISO()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV stok di-download");
  }, []);

  if (!mounted) return <div className="min-h-[60vh]" />;

  return (
    <div className="max-w-2xl mx-auto pb-24 space-y-5 animate-fade-in">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-xl shadow-cyan-500/20">
            <Smartphone className="size-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-heading">{profil.nama || "Dashboard Gadget & Laptop"}</h1>
            <p className="text-xs text-muted-foreground/60">{profil.alamat || "Divisi Gadget & Laptop"}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push("/buku-usaha/pengaturan")}
            className="px-2.5 py-2 rounded-xl bg-muted/40 text-muted-foreground text-[10px] font-bold hover:bg-muted/60 hover:scale-105 active:scale-95 transition-all flex items-center gap-1"
          >
            <Settings className="size-3.5" /> Pengaturan
          </button>
          <button
            onClick={exportXLSX}
            className="px-2.5 py-2 rounded-xl bg-muted/50 text-muted-foreground text-[10px] font-bold hover:bg-muted/80 hover:scale-105 active:scale-95 transition-all flex items-center gap-1"
          >
            <Download className="size-3.5" /> Excel
          </button>
        </div>
      </div>

      {/* ─── 4 KPI ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-xl shadow-cyan-500/25">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_60%)]" />
          <div className="relative z-10 space-y-1">
            <p className="text-white/70 text-[9px] font-semibold uppercase tracking-widest">Omzet Penjualan</p>
            <p className="text-lg font-bold font-heading text-white tabular-nums">{formatRupiah(kpi.omzet)}</p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-rose-500 to-rose-600 shadow-xl shadow-rose-500/25">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_60%)]" />
          <div className="relative z-10 space-y-1">
            <p className="text-white/70 text-[9px] font-semibold uppercase tracking-widest">Total HPP Stok</p>
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
            <p className="text-white/70 text-[9px] font-semibold uppercase tracking-widest">Unit Terjual</p>
            <p className="text-lg font-bold font-heading text-white tabular-nums">{kpi.unitTerjual} unit</p>
          </div>
        </div>
      </div>

      {/* ─── STOCK BREAKDOWN ─── */}
      <div className="floating-card p-4 space-y-3">
        <p className="text-xs font-semibold flex items-center gap-1.5">
          <Package className="size-3.5 text-cyan-500" /> Stock Breakdown
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 p-3 text-center">
            <Box className="size-5 mx-auto text-emerald-500 mb-1" />
            <p className="text-lg font-bold font-heading tabular-nums text-emerald-600">{stokBreakdown.baru}</p>
            <p className="text-[9px] text-muted-foreground/50">Baru (BNIB)</p>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 p-3 text-center">
            <RefreshCw className="size-5 mx-auto text-amber-500 mb-1" />
            <p className="text-lg font-bold font-heading tabular-nums text-amber-600">{stokBreakdown.second}</p>
            <p className="text-[9px] text-muted-foreground/50">Second / Bekas</p>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-rose-500/10 to-rose-500/5 border border-rose-500/20 p-3 text-center">
            <Wrench className="size-5 mx-auto text-rose-500 mb-1" />
            <p className="text-lg font-bold font-heading tabular-nums text-rose-600">{stokBreakdown.servis}</p>
            <p className="text-[9px] text-muted-foreground/50">Servis / Retur</p>
          </div>
        </div>
      </div>

      {/* ─── LOW STOCK + WARRANTY ALERT ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Low Stock */}
        <div className="floating-card p-4 space-y-2">
          <p className="text-xs font-semibold flex items-center gap-1.5 text-rose-500">
            <AlertTriangle className="size-3.5" /> Low Stock (&lt; 2 unit)
          </p>
          {lowStock.length === 0 ? (
            <p className="text-[10px] text-muted-foreground/40">Semua stok aman</p>
          ) : (
            <div className="space-y-1.5">
              {lowStock.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 text-[10px]">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{s.brand} {s.tipe}</p>
                    <p className="text-[9px] text-muted-foreground/50">{s.imeiSn}</p>
                  </div>
                  <span className="font-bold text-rose-600 ml-2">{s.qty} unit</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Warranty Expiring */}
        <div className="floating-card p-4 space-y-2">
          <p className="text-xs font-semibold flex items-center gap-1.5 text-amber-500">
            <Shield className="size-3.5" /> Garansi Akan Habis (7 hari)
          </p>
          {warrantyExpiring.length === 0 ? (
            <p className="text-[10px] text-muted-foreground/40">Tidak ada garansi yang akan habis</p>
          ) : (
            <div className="space-y-1.5">
              {warrantyExpiring.map((s) => {
                const days = daysUntil(s.garansiHingga);
                return (
                  <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 text-[10px]">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{s.brand} {s.tipe}</p>
                      <p className="text-[9px] text-muted-foreground/50">{s.imeiSn}</p>
                    </div>
                    <span className={`font-semibold ml-2 ${days <= 0 ? "text-rose-600" : "text-amber-600"}`}>
                      {days <= 0 ? "Hari ini" : `${days} hari lagi`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── FLOATING ACTION ─── */}
      <div className="fixed bottom-6 right-6 z-30 flex flex-col gap-2 items-end">
        <button
          onClick={() => router.push("/buku-usaha/gadget-laptop/kasir")}
          className="size-14 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-2xl shadow-cyan-500/40 hover:shadow-cyan-500/60 hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
        >
          <Plus className="size-6" />
        </button>
        <p className="text-[9px] text-muted-foreground/50 font-medium bg-background/80 backdrop-blur-sm px-2 py-0.5 rounded-full shadow-sm">
          POS Kasir Gadget
        </p>
      </div>
    </div>
  );
}
