"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Plus, Settings, ArrowLeft } from "lucide-react";
import { CardSkeleton } from "@/components/ui/skeleton";

export default function DashboardKelontong() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <CardSkeleton />;

  return (
    <div className="max-w-2xl mx-auto pb-20 space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/buku-usaha")} className="size-10 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors">
          <ArrowLeft className="size-5 text-slate-300" />
        </button>
        <div className="size-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-xl shadow-violet-500/20">
          <ShoppingBag className="size-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold font-heading">Dashboard Kelontong</h1>
          <p className="text-xs text-muted-foreground/60">Toko Kelontong & Sembako</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => router.push("/buku-usaha/kelontong/kasir")}
          className="floating-card p-5 space-y-2 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.97] transition-all">
          <div className="size-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
            <Plus className="size-5 text-white" />
          </div>
          <p className="text-sm font-bold">Buka Kasir</p>
          <p className="text-[10px] text-muted-foreground/50">Transaksi kelontong</p>
        </button>
        <button
          className="floating-card p-5 space-y-2 opacity-50">
          <div className="size-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center">
            <Settings className="size-5 text-white" />
          </div>
          <p className="text-sm font-bold">Pengaturan</p>
          <p className="text-[10px] text-muted-foreground/50">Kelola produk & stok</p>
        </button>
      </div>
    </div>
  );
}
