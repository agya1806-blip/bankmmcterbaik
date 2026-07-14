"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Coffee, AlertTriangle,
  Plus, Download, Settings, Package,
  Wheat, Timer,
} from "lucide-react";
import toast from "react-hot-toast";
import { useProfilUsahaStore } from "../../percetakan/store/useProfilUsahaStore";

/* ─── Types ─── */
interface OpenBill {
  id: string;
  meja: string;
  pelanggan: string;
  items: number;
  total: number;
  jam: string;
}

interface StokItem {
  id: string;
  nama: string;
  kategori: "kelontong" | "bahan";
  qty: number;
  satuan: string;
  minimal: number;
}

interface TransaksiHari {
  id: string;
  total: number;
}

/* ─── Mock ─── */
const MOCK_OPEN_BILLS: OpenBill[] = [
  { id: "WKP-001", meja: "Meja 3", pelanggan: "Ahmad", items: 3, total: 45000, jam: "10:25" },
  { id: "WKP-002", meja: "Meja 5", pelanggan: "Rina", items: 2, total: 32000, jam: "10:40" },
  { id: "WKP-004", meja: "Meja 2", pelanggan: "Budi", items: 5, total: 87000, jam: "11:05" },
];

const MOCK_STOK: StokItem[] = [
  { id: "STK-001", nama: "Kopi Arabika (gram)", kategori: "bahan", qty: 250, satuan: "gr", minimal: 500 },
  { id: "STK-002", nama: "Susu UHT (ml)", kategori: "bahan", qty: 300, satuan: "ml", minimal: 1000 },
  { id: "STK-003", nama: "Sirup Gula (ml)", kategori: "bahan", qty: 150, satuan: "ml", minimal: 500 },
  { id: "STK-004", nama: "Mie Instan Goreng", kategori: "kelontong", qty: 3, satuan: "pcs", minimal: 10 },
  { id: "STK-005", nama: "Minyak Goreng (liter)", kategori: "kelontong", qty: 1, satuan: "L", minimal: 3 },
  { id: "STK-006", nama: "Rokok Filter", kategori: "kelontong", qty: 8, satuan: "bks", minimal: 5 },
  { id: "STK-007", nama: "Air Mineral (botol)", kategori: "kelontong", qty: 12, satuan: "pcs", minimal: 5 },
  { id: "STK-008", nama: "Gula Pasir (kg)", kategori: "bahan", qty: 2, satuan: "kg", minimal: 5 },
];

const MOCK_TRANSAKSI_HARI: TransaksiHari[] = [
  { id: "WKP-001", total: 45000 },
  { id: "WKP-002", total: 32000 },
  { id: "WKP-003", total: 28000 },
  { id: "WKP-004", total: 87000 },
  { id: "WKP-005", total: 15500 },
];

function formatRupiah(n: number) {
  return `IDR ${n.toLocaleString("id-ID")}`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function DashboardWarkopKelontong() {
  const router = useRouter();
  const { profil } = useProfilUsahaStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  /* ─── KPI ─── */
  const kpi = useMemo(() => {
    const omzet = MOCK_TRANSAKSI_HARI.reduce((s, t) => s + t.total, 0);
    const hpp = Math.round(omzet * 0.45);
    const laba = omzet - hpp;
    return { omzet, hpp, laba, transaksi: MOCK_TRANSAKSI_HARI.length };
  }, []);

  /* ─── Low Stock ─── */
  const lowStock = useMemo(() => MOCK_STOK.filter((s) => s.qty < s.minimal), []);

  /* ─── Export ─── */
  const exportXLSX = useCallback(() => {
    const header = "Kode,Nama,Kategori,Qty,Satuan,Minimal\n";
    const rows = MOCK_STOK.map((s) =>
      `"${s.id}","${s.nama}","${s.kategori}",${s.qty},"${s.satuan}",${s.minimal}`
    ).join("\n");
    const blob = new Blob(["\uFEFF" + header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Stok-Warkop-${todayISO()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV stok di-download");
  }, []);

  if (!mounted) return <div className="min-h-[60vh]" />;

  return (
    <div className="max-w-2xl mx-auto pb-20 space-y-5 animate-fade-in">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/20">
            <Coffee className="size-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-heading">{profil.nama || "Warkop & Kelontong"}</h1>
            <p className="text-xs text-muted-foreground/60">{profil.alamat || "Kedai Kopi & Retail Modern"}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => router.push("/buku-usaha/pengaturan")}
            className="px-2.5 py-2 rounded-xl bg-muted/40 text-muted-foreground text-[10px] font-bold hover:bg-muted/60 hover:scale-105 active:scale-95 transition-all flex items-center gap-1"
          >
            <Settings className="size-3.5" /> Pengaturan
          </button>
          <button onClick={exportXLSX}
            className="px-2.5 py-2 rounded-xl bg-muted/50 text-muted-foreground text-[10px] font-bold hover:bg-muted/80 hover:scale-105 active:scale-95 transition-all flex items-center gap-1"
          >
            <Download className="size-3.5" /> Excel
          </button>
        </div>
      </div>

      {/* ─── 4 KPI ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-xl shadow-emerald-500/25">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_60%)]" />
          <div className="relative z-10 space-y-1">
            <p className="text-white/70 text-[9px] font-semibold uppercase tracking-widest">Omzet Harian</p>
            <p className="text-lg font-bold font-heading text-white tabular-nums">{formatRupiah(kpi.omzet)}</p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-rose-500 to-rose-600 shadow-xl shadow-rose-500/25">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_60%)]" />
          <div className="relative z-10 space-y-1">
            <p className="text-white/70 text-[9px] font-semibold uppercase tracking-widest">Total Modal (HPP)</p>
            <p className="text-lg font-bold font-heading text-white tabular-nums">{formatRupiah(kpi.hpp)}</p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-amber-500 to-orange-600 shadow-xl shadow-amber-500/25">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_60%)]" />
          <div className="relative z-10 space-y-1">
            <p className="text-white/70 text-[9px] font-semibold uppercase tracking-widest">Laba Bersih</p>
            <p className={`text-lg font-bold font-heading text-white tabular-nums ${kpi.laba < 0 ? "text-red-200" : ""}`}>
              {kpi.laba >= 0 ? "+" : ""}{formatRupiah(kpi.laba)}
            </p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl shadow-emerald-500/25">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_60%)]" />
          <div className="relative z-10 space-y-1">
            <p className="text-white/70 text-[9px] font-semibold uppercase tracking-widest">Transaksi Hari Ini</p>
            <p className="text-lg font-bold font-heading text-white tabular-nums">{kpi.transaksi} struk</p>
          </div>
        </div>
      </div>

      {/* ─── Open Bill Monitor ─── */}
      <div className="floating-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold flex items-center gap-1.5">
            <Timer className="size-3.5 text-amber-500" /> Open Bill Monitor
          </p>
          <span className="text-[10px] text-muted-foreground/50">{MOCK_OPEN_BILLS.length} tagihan menggantung</span>
        </div>
        {MOCK_OPEN_BILLS.length === 0 ? (
          <p className="text-[10px] text-muted-foreground/40">Semua bill sudah dibayar</p>
        ) : (
          <div className="space-y-1.5">
            {MOCK_OPEN_BILLS.map((bill) => (
              <div key={bill.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-500/20 text-[10px]"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="size-7 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Timer className="size-3.5 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{bill.meja || bill.pelanggan}</p>
                    <p className="text-[9px] text-muted-foreground/50">ID: {bill.id} • {bill.items} item • {bill.jam}</p>
                  </div>
                </div>
                <span className="font-bold tabular-nums text-amber-600 ml-2">{formatRupiah(bill.total)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Low Stock & Bahan Tracker ─── */}
      <div className="floating-card p-4 space-y-3">
        <p className="text-xs font-semibold flex items-center gap-1.5">
          <AlertTriangle className="size-3.5 text-rose-500" /> Low Stock &amp; Ingredients Tracker
        </p>
        {lowStock.length === 0 ? (
          <p className="text-[10px] text-muted-foreground/40">Semua stok dalam batas aman</p>
        ) : (
          <div className="space-y-2">
            {lowStock.map((s) => {
              const isBahan = s.kategori === "bahan";
              const pct = s.minimal > 0 ? Math.min(Math.round((s.qty / s.minimal) * 100), 100) : 0;
              return (
                <div key={s.id} className="space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      {isBahan ? <Wheat className="size-3 text-amber-500 shrink-0" /> : <Package className="size-3 text-rose-500 shrink-0" />}
                      <span className="truncate font-medium">{s.nama}</span>
                    </div>
                    <span className="font-bold tabular-nums ml-2 text-rose-500">{s.qty} {s.satuan}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isBahan ? "bg-amber-500" : "bg-rose-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[8px] text-muted-foreground/40">
                    Minimal: {s.minimal} {s.satuan} • {isBahan ? "Butuh restock bahan baku" : "Segera order barang"}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Floating Action ─── */}
      <div className="fixed bottom-6 right-6 z-30 flex flex-col gap-2 items-end">
        <button onClick={() => router.push("/buku-usaha/warkop-kelontong/kasir")}
          className="size-14 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-2xl shadow-emerald-500/40 hover:shadow-emerald-500/60 hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
        >
          <Plus className="size-6" />
        </button>
        <p className="text-[9px] text-muted-foreground/50 font-medium bg-background/80 backdrop-blur-sm px-2 py-0.5 rounded-full shadow-sm">
          Buka POS Kasir Menu
        </p>
      </div>
    </div>
  );
}
