"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Laptop, AlertTriangle, Plus, Settings, ArrowLeft } from "lucide-react";
import { useBusinessStore } from "@/store/useBusinessStore";
import { CardSkeleton } from "@/components/ui/skeleton";

export default function DashboardLaptop() {
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
        <button onClick={() => router.push("/buku-usaha")} className="size-10 rounded-xl bg-white dark:bg-[#131527]/90 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all active:scale-[0.97]">
          <ArrowLeft className="size-5 text-slate-600 dark:text-slate-400" />
        </button>
        <div className="size-12 rounded-2xl bg-gradient-to-r from-[#7B61FF] to-[#FF5C00] flex items-center justify-center shadow-xl shadow-[#7B61FF]/20">
          <Laptop className="size-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold font-heading">Dashboard Laptop</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Toko Laptop & Service</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="premium-stat">
          <p className="premium-stat-label">Total Produk</p>
          <p className="premium-stat-value text-blue-500">{gadgetItems.length}</p>
        </div>
        <div className="premium-stat">
          <p className="premium-stat-label">Total Stok</p>
          <p className="premium-stat-value text-blue-500">{totalStok}</p>
        </div>
      </div>

      {stokMenipis.length > 0 && (
        <div className="premium-card p-4 border-amber-500/30 space-y-2">
          <div className="flex items-center gap-2 text-amber-500">
            <AlertTriangle className="size-4" />
            <span className="text-xs font-bold">Stok Menipis ({stokMenipis.length})</span>
          </div>
          {stokMenipis.map((g) => (
            <div key={g.id} className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>{g.brand} {g.model}</span>
              <span className="text-amber-500 font-bold">1 pcs</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => router.push("/buku-usaha/laptop/kasir")}
          className="premium-card p-5 space-y-2 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.97] transition-all text-left">
          <div className="size-10 rounded-xl bg-gradient-to-r from-[#7B61FF] to-[#FF5C00] flex items-center justify-center">
            <Plus className="size-5 text-white" />
          </div>
          <p className="text-sm font-bold">Buka Kasir</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">Transaksi penjualan laptop</p>
        </button>
        <button onClick={() => router.push("/buku-usaha/laptop")}
          className="premium-card p-5 space-y-2 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.97] transition-all text-left">
          <div className="size-10 rounded-xl bg-gradient-to-r from-[#7B61FF] to-[#FF5C00] flex items-center justify-center">
            <Settings className="size-5 text-white" />
          </div>
          <p className="text-sm font-bold">Pengaturan</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">Kelola produk & stok</p>
        </button>
      </div>
    </div>
  );
}
