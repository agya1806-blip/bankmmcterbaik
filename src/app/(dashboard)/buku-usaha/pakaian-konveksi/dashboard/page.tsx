"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Shirt, AlertTriangle, Plus, Download, Settings, Scissors,
} from "lucide-react";
import toast from "react-hot-toast";
import { useProfilUsahaStore } from "../../percetakan/store/useProfilUsahaStore";
import { KasirSkeleton } from "@/components/ui/skeleton";

/* ─── Types ─── */
type StatusCMT = "pola-potong" | "proses-jahit" | "sablon-bordir" | "finishing-qc" | "siap-kirim";

interface OrderCMT {
  id: string;
  customer: string;
  produk: string;
  qty: number;
  status: StatusCMT;
  tenggat: string;
}

interface SKUItem {
  id: string;
  produk: string;
  warna: string;
  ukuran: string;
  stok: number;
  minimal: number;
}

/* ─── Mock ─── */
const MOCK_CMT: OrderCMT[] = [
  { id: "CMT-001", customer: "Toko Batik Jaya", produk: "Kaos Polos Combed 30s", qty: 50, status: "pola-potong", tenggat: "2026-07-18" },
  { id: "CMT-002", customer: "CV Seragam Kita", produk: "Kemeja Kerja Lengan Panjang", qty: 120, status: "proses-jahit", tenggat: "2026-07-20" },
  { id: "CMT-003", customer: "Komunitas Pecinta Alam", produk: "Jaket Hoodie Sablon", qty: 30, status: "sablon-bordir", tenggat: "2026-07-16" },
  { id: "CMT-004", customer: "PDAM Tirta", produk: "Seragam Lapangan PDAM", qty: 200, status: "finishing-qc", tenggat: "2026-07-15" },
  { id: "CMT-005", customer: "Yayasan Al-Falah", produk: "Kaos Anak Bordir Nama", qty: 80, status: "siap-kirim", tenggat: "2026-07-14" },
];

const MOCK_SKU: SKUItem[] = [
  { id: "SKU-001", produk: "Kaos Polos Hitam", warna: "Hitam", ukuran: "S", stok: 5, minimal: 3 },
  { id: "SKU-002", produk: "Kaos Polos Hitam", warna: "Hitam", ukuran: "M", stok: 8, minimal: 3 },
  { id: "SKU-003", produk: "Kaos Polos Hitam", warna: "Hitam", ukuran: "L", stok: 2, minimal: 3 },
  { id: "SKU-004", produk: "Kaos Polos Hitam", warna: "Hitam", ukuran: "XL", stok: 1, minimal: 3 },
  { id: "SKU-005", produk: "Kaos Polos Putih", warna: "Putih", ukuran: "L", stok: 12, minimal: 3 },
  { id: "SKU-006", produk: "Kaos Polos Putih", warna: "Putih", ukuran: "XL", stok: 0, minimal: 3 },
  { id: "SKU-007", produk: "Kemeja Flanel Merah", warna: "Merah", ukuran: "M", stok: 3, minimal: 3 },
  { id: "SKU-008", produk: "Kemeja Flanel Merah", warna: "Merah", ukuran: "L", stok: 1, minimal: 3 },
  { id: "SKU-009", produk: "Jaket Hoodie Abu", warna: "Abu-abu", ukuran: "L", stok: 4, minimal: 3 },
  { id: "SKU-010", produk: "Jaket Hoodie Abu", warna: "Abu-abu", ukuran: "XL", stok: 2, minimal: 3 },
];

const STATUS_CMT: Record<StatusCMT, { label: string; next: StatusCMT; color: string }> = {
  "pola-potong": { label: "Pola/Potong Kain", next: "proses-jahit", color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400" },
  "proses-jahit": { label: "Proses Jahit", next: "sablon-bordir", color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400" },
  "sablon-bordir": { label: "Sablon/Bordir", next: "finishing-qc", color: "text-violet-600 bg-violet-100 dark:bg-violet-900/30 dark:text-violet-400" },
  "finishing-qc": { label: "Finishing & QC", next: "siap-kirim", color: "text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-400" },
  "siap-kirim": { label: "Siap Kirim", next: "siap-kirim", color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400" },
};

function formatRupiah(n: number) {
  return `IDR ${n.toLocaleString("id-ID")}`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function DashboardPakaianKonveksi() {
  const router = useRouter();
  const { profil } = useProfilUsahaStore();
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<OrderCMT[]>(MOCK_CMT);

  useEffect(() => setMounted(true), []);

  const updateStatus = useCallback((id: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        const next = STATUS_CMT[o.status].next;
        if (next === o.status) { toast.success(`Order ${id} sudah selesai`); return o; }
        toast.success(`Order ${id} → ${STATUS_CMT[next].label}`);
        return { ...o, status: next };
      })
    );
  }, []);

  /* ─── KPI ─── */
  const kpi = useMemo(() => {
    const omzet = 45_800_000;
    const hpp = Math.round(omzet * 0.55);
    const laba = omzet - hpp;
    const produk = MOCK_SKU.reduce((s, sk) => s + sk.stok, 0);
    return { omzet, hpp, laba, produk };
  }, []);

  /* ─── SKU Alert ─── */
  const skuAlert = useMemo(() => MOCK_SKU.filter((s) => s.stok < s.minimal), []);

  /* ─── Export ─── */
  const exportXLSX = useCallback(() => {
    const header = "Kode,Produk,Warna,Ukuran,Stok,Minimal\n";
    const rows = MOCK_SKU.map((s) =>
      `"${s.id}","${s.produk}","${s.warna}","${s.ukuran}",${s.stok},${s.minimal}`
    ).join("\n");
    const blob = new Blob(["\uFEFF" + header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SKU-Konveksi-${todayISO()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV SKU di-download");
  }, []);

  if (!mounted) return <KasirSkeleton />;

  return (
    <div className="max-w-2xl mx-auto pb-20 space-y-5 animate-fade-in">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-xl shadow-rose-500/20">
            <Shirt className="size-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-heading">{profil.nama || "Pakaian & Konveksi"}</h1>
            <p className="text-xs text-muted-foreground/60">{profil.alamat || "Fashion & Confectionery"}</p>
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
        <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-rose-500 to-rose-600 shadow-xl shadow-rose-500/25">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_60%)]" />
          <div className="relative z-10 space-y-1">
            <p className="text-white/70 text-[9px] font-semibold uppercase tracking-widest">Omzet Penjualan</p>
            <p className="text-lg font-bold font-heading text-white tabular-nums">{formatRupiah(kpi.omzet)}</p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-rose-600 to-pink-600 shadow-xl shadow-rose-500/25">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_60%)]" />
          <div className="relative z-10 space-y-1">
            <p className="text-white/70 text-[9px] font-semibold uppercase tracking-widest">Total HPP</p>
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
        <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-pink-500 to-pink-600 shadow-xl shadow-pink-500/25">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_60%)]" />
          <div className="relative z-10 space-y-1">
            <p className="text-white/70 text-[9px] font-semibold uppercase tracking-widest">Stok Produk (Pcs)</p>
            <p className="text-lg font-bold font-heading text-white tabular-nums">{kpi.produk} pcs</p>
          </div>
        </div>
      </div>

      {/* ─── CMT Monitor ─── */}
      <div className="floating-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold flex items-center gap-1.5">
            <Scissors className="size-3.5 text-rose-500" /> Production &amp; Jasa CMT Monitor
          </p>
          <span className="text-[10px] text-muted-foreground/50">{orders.length} order</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
          {(Object.entries(STATUS_CMT) as [StatusCMT, typeof STATUS_CMT[StatusCMT]][]).map(([key, cfg]) => {
            const items = orders.filter((o) => o.status === key);
            return (
              <div key={key} className="space-y-1">
                <p className="text-[8px] font-semibold text-muted-foreground/50 uppercase tracking-wider text-center truncate">{cfg.label}</p>
                {items.length === 0 ? (
                  <div className="h-14 rounded-lg bg-muted/10 border border-dashed border-muted/30 flex items-center justify-center">
                    <p className="text-[7px] text-muted-foreground/30">-</p>
                  </div>
                ) : (
                  items.map((o) => (
                    <div key={o.id} onClick={() => updateStatus(o.id)}
                      className="rounded-lg p-1.5 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/50 cursor-pointer hover:shadow-sm transition-shadow"
                    >
                      <p className="text-[7px] font-semibold truncate">{o.id}</p>
                      <p className="text-[6px] text-muted-foreground/60 truncate">{o.customer}</p>
                      <p className="text-[6px] text-muted-foreground/40 truncate">{o.produk}</p>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── SKU Matrix Alert ─── */}
      <div className="floating-card p-4 space-y-3">
        <p className="text-xs font-semibold flex items-center gap-1.5">
          <AlertTriangle className="size-3.5 text-rose-500" /> SKU Matrix Inventory Alert (&lt; 3 pcs)
        </p>
        {skuAlert.length === 0 ? (
          <p className="text-[10px] text-muted-foreground/40">Semua varian aman</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-border/40 text-muted-foreground/50">
                  <th className="text-left py-1.5 font-medium">Produk</th>
                  <th className="text-left py-1.5 font-medium">Warna</th>
                  <th className="text-left py-1.5 font-medium">Ukuran</th>
                  <th className="text-right py-1.5 font-medium">Stok</th>
                  <th className="text-right py-1.5 font-medium">Minimal</th>
                </tr>
              </thead>
              <tbody>
                {skuAlert.map((s) => (
                  <tr key={s.id} className="border-b border-border/10 text-rose-600">
                    <td className="py-1.5 font-medium">{s.produk}</td>
                    <td className="py-1.5">{s.warna}</td>
                    <td className="py-1.5">{s.ukuran}</td>
                    <td className="py-1.5 text-right font-bold">{s.stok}</td>
                    <td className="py-1.5 text-right text-muted-foreground/50">{s.minimal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Floating Action ─── */}
      <div className="fixed bottom-6 right-6 z-30 flex flex-col gap-2 items-end">
        <button onClick={() => router.push("/buku-usaha/pakaian-konveksi/kasir")}
          className="size-14 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-2xl shadow-rose-500/40 hover:shadow-rose-500/60 hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
        >
          <Plus className="size-6" />
        </button>
        <p className="text-[9px] text-muted-foreground/50 font-medium bg-background/80 backdrop-blur-sm px-2 py-0.5 rounded-full shadow-sm">
          Buka POS Kasir Mode
        </p>
      </div>
    </div>
  );
}
