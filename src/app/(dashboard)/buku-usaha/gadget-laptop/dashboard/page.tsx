"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Smartphone, Package, AlertTriangle, Shield, Plus, Download,
  Settings, Box, RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import { useProfilUsahaStore } from "../../percetakan/store/useProfilUsahaStore";
import { useBusinessStore } from "@/store/useBusinessStore";
import { KasirSkeleton } from "@/components/ui/skeleton";

/* ─── Helpers ─── */

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
  const gadgetItems = useBusinessStore((s) => s.gadgetItems);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  /* ─── Stok dari store ─── */
  const stokList = useMemo(() => {
    return gadgetItems.map((g) => ({
      id: g.id,
      brand: g.brand || "-",
      tipe: g.model,
      imeiSn: g.imei1,
      kondisi: "baru" as const,
      hargaModal: g.hpp,
      hargaJual: g.price,
      qty: 1,
      garansiHingga: g.warrantyEnd || "",
    }));
  }, [gadgetItems]);

  /* ─── Ringkasan ─── */
  const totalUnit = stokList.length;
  const totalHpp = stokList.reduce((s, item) => s + item.hargaModal, 0);
  const totalJual = stokList.reduce((s, item) => s + item.hargaJual, 0);
  const potensiLaba = totalJual - totalHpp;

  /* ─── KPI ─── */
  const kpi = useMemo(() => ({
    totalUnit,
    totalHpp,
    potensiLaba,
    unitTerjual: 0, /* Transaction persistence not yet implemented */
  }), [totalUnit, totalHpp, potensiLaba]);

  /* ─── Low Stock + Warranty Alert ─── */
  const lowStock = useMemo(() => stokList.filter((s) => s.qty > 0 && s.qty < 2), [stokList]);
  const warrantyExpiring = useMemo(
    () => stokList.filter((s) => {
      if (!s.garansiHingga) return false;
      const days = daysUntil(s.garansiHingga);
      return days >= 0 && days <= 30;
    }),
    [stokList]
  );

  const exportXLSX = useCallback(() => {
    const header = "Kode,Brand,Tipe,IMEI/SN,Kondisi,Modal,Jual,Qty,GaransiHingga\n";
    const rows = stokList.map((s) =>
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
  }, [stokList]);

  if (!mounted) return <KasirSkeleton />;

  return (
    <div className="max-w-2xl mx-auto pb-20 space-y-5 animate-fade-in">
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
            <p className="text-white/70 text-[9px] font-semibold uppercase tracking-widest">Total Unit</p>
            <p className="text-lg font-bold font-heading text-white tabular-nums">{kpi.totalUnit} unit</p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-rose-500 to-rose-600 shadow-xl shadow-rose-500/25">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_60%)]" />
          <div className="relative z-10 space-y-1">
            <p className="text-white/70 text-[9px] font-semibold uppercase tracking-widest">Total HPP</p>
            <p className="text-lg font-bold font-heading text-white tabular-nums">{formatRupiah(kpi.totalHpp)}</p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-amber-500 to-orange-600 shadow-xl shadow-amber-500/25">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_60%)]" />
          <div className="relative z-10 space-y-1">
            <p className="text-white/70 text-[9px] font-semibold uppercase tracking-widest">Potensi Laba</p>
            <p className={`text-lg font-bold font-heading text-white tabular-nums ${kpi.potensiLaba < 0 ? "text-red-200" : ""}`}>
              +{formatRupiah(kpi.potensiLaba)}
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

      {/* ─── INVENTORY OVERVIEW ─── */}
      <div className="floating-card p-4 space-y-3">
        <p className="text-xs font-semibold flex items-center gap-1.5">
          <Package className="size-3.5 text-cyan-500" /> Inventory Overview
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 p-3 text-center">
            <Box className="size-5 mx-auto text-emerald-500 mb-1" />
            <p className="text-lg font-bold font-heading tabular-nums text-emerald-600">{stokList.length}</p>
            <p className="text-[9px] text-muted-foreground/50">Total Items</p>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 p-3 text-center">
            <RefreshCw className="size-5 mx-auto text-amber-500 mb-1" />
            <p className="text-lg font-bold font-heading tabular-nums text-amber-600">{stokList.filter((s) => !s.garansiHingga || daysUntil(s.garansiHingga) <= 30).length}</p>
            <p className="text-[9px] text-muted-foreground/50">Garansi &le;30 hr</p>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-rose-500/10 to-rose-500/5 border border-rose-500/20 p-3 text-center">
            <AlertTriangle className="size-5 mx-auto text-rose-500 mb-1" />
            <p className="text-lg font-bold font-heading tabular-nums text-rose-600">{stokList.filter((s) => s.garansiHingga && daysUntil(s.garansiHingga) <= 0).length}</p>
            <p className="text-[9px] text-muted-foreground/50">Garansi Habis</p>
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
