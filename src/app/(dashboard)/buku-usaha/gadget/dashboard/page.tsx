"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Smartphone, Package, AlertTriangle, Shield, Plus, Download, Settings, Box, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { useBusinessStore } from "@/store/useBusinessStore";
import { CardSkeleton } from "@/components/ui/skeleton";

function todayISO() { return new Date().toISOString().slice(0, 10); }
function formatRupiah(n: number) { return `IDR ${n.toLocaleString("id-ID")}`; }

export default function DashboardGadget() {
  const router = useRouter();
  const gadgetItems = useBusinessStore((s) => s.gadgetItems);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const stokMenipis = useMemo(() => gadgetItems.filter((g) => (g.hpp ?? 0) <= 0), [gadgetItems]);
  const totalStok = useMemo(() => gadgetItems.length, [gadgetItems]);

  if (!mounted) return <CardSkeleton />;

  return (
    <div className="max-w-2xl mx-auto pb-20 space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/buku-usaha")} className="size-10 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors">
          <ArrowLeft className="size-5 text-slate-300" />
        </button>
        <div className="size-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-xl shadow-cyan-500/20">
          <Smartphone className="size-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold font-heading">Dashboard Gadget</h1>
          <p className="text-xs text-muted-foreground/60">Toko Gadget & Aksesoris</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="floating-card p-4 space-y-1">
          <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">Total Produk</p>
          <p className="text-xl font-bold font-heading tabular-nums">{gadgetItems.length}</p>
        </div>
        <div className="floating-card p-4 space-y-1">
          <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">Total Stok</p>
          <p className="text-xl font-bold font-heading tabular-nums">{totalStok}</p>
        </div>
      </div>

      {stokMenipis.length > 0 && (
        <div className="floating-card p-4 border border-amber-500/30 space-y-2">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertTriangle className="size-4" />
            <span className="text-xs font-bold">Stok Menipis ({stokMenipis.length})</span>
          </div>
          {stokMenipis.map((g) => (
            <div key={g.id} className="flex justify-between text-xs text-slate-300">
              <span>{g.brand} {g.model}</span>
              <span className="text-amber-400 font-bold">1 pcs</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => router.push("/buku-usaha/gadget/kasir")}
          className="floating-card p-5 space-y-2 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.97] transition-all">
          <div className="size-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
            <Plus className="size-5 text-white" />
          </div>
          <p className="text-sm font-bold">Buka Kasir</p>
          <p className="text-[10px] text-muted-foreground/50">Transaksi penjualan gadget</p>
        </button>
        <button onClick={() => router.push("/buku-usaha/gadget")}
          className="floating-card p-5 space-y-2 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.97] transition-all">
          <div className="size-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
            <Settings className="size-5 text-white" />
          </div>
          <p className="text-sm font-bold">Pengaturan</p>
          <p className="text-[10px] text-muted-foreground/50">Kelola produk & stok</p>
        </button>
      </div>
    </div>
  );
}
