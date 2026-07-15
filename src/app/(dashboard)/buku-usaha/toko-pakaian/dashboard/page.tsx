"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shirt, Plus, Settings, ArrowLeft } from "lucide-react";
import { CardSkeleton } from "@/components/ui/skeleton";

export default function DashboardTokoPakaian() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <CardSkeleton />;

  return (
    <div className="max-w-2xl mx-auto pb-20 space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/buku-usaha")} className="size-10 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
          <ArrowLeft className="size-5 text-slate-600 dark:text-slate-400" />
        </button>
        <div className="size-12 rounded-2xl bg-gradient-to-r from-[#7B61FF] to-[#FF5C00] flex items-center justify-center shadow-xl shadow-[#7B61FF]/20">
          <Shirt className="size-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold font-heading">Dashboard Toko Pakaian</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Toko Pakaian & Fashion</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => router.push("/buku-usaha/toko-pakaian/kasir")}
          className="premium-card p-5 space-y-2 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.97] transition-all text-left">
          <div className="size-10 rounded-xl bg-gradient-to-r from-[#7B61FF] to-[#FF5C00] flex items-center justify-center">
            <Plus className="size-5 text-white" />
          </div>
          <p className="text-sm font-bold">Buka Kasir</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">Transaksi pakaian</p>
        </button>
        <button
          className="premium-card p-5 space-y-2 opacity-50 text-left">
          <div className="size-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
            <Settings className="size-5 text-slate-500 dark:text-slate-400" />
          </div>
          <p className="text-sm font-bold">Pengaturan</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">Kelola produk & stok</p>
        </button>
      </div>
    </div>
  );
}
