"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import { useBusinessStore } from "@/store/useBusinessStore";
import { CardSkeleton } from "@/components/ui/skeleton";

function formatRupiah(n: number) { return `Rp ${n.toLocaleString("id-ID")}`; }

export default function LaporanPribadiPage() {
  const router = useRouter();
  const { personalTransactions } = useBusinessStore();
  const [mounted, setMounted] = useState(false);
  const [bulan, setBulan] = useState(() => new Date().toISOString().slice(0, 7));

  useEffect(() => setMounted(true), []);

  const transaksiBulan = useMemo(() => {
    return personalTransactions.filter((t) => t.tanggal.startsWith(bulan));
  }, [personalTransactions, bulan]);

  const pemasukan = useMemo(() => transaksiBulan.filter((t) => t.tipe === "Pemasukan").reduce((s, t) => s + t.nominal, 0), [transaksiBulan]);
  const pengeluaran = useMemo(() => transaksiBulan.filter((t) => t.tipe === "Pengeluaran").reduce((s, t) => s + t.nominal, 0), [transaksiBulan]);

  const byKategori = useMemo(() => {
    const map = new Map<string, number>();
    transaksiBulan.forEach((t) => {
      if (t.tipe === "Pengeluaran") map.set(t.kategori, (map.get(t.kategori) || 0) + t.nominal);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [transaksiBulan]);

  if (!mounted) return <CardSkeleton />;

  return (
    <div className="max-w-2xl mx-auto pb-20 space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/buku-pribadi")} className="btn-ghost size-10 rounded-xl flex items-center justify-center">
          <ArrowLeft className="size-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold font-heading">Laporan Keuangan</h1>
          <p className="text-xs text-muted-foreground/60">Buku Pribadi</p>
        </div>
      </div>

      <input type="month" value={bulan} onChange={(e) => setBulan(e.target.value)}
        className="input-premium w-full text-xs" />

      <div className="grid grid-cols-2 gap-3">
        <div className="premium-card bg-white/90 backdrop-blur-md dark:bg-[#131527]/90 border border-slate-200/60 dark:border-slate-800/60 p-4 space-y-1 border-l-4 border-l-[#7B61FF]">
          <div className="flex items-center gap-2 text-[#7B61FF]">
            <TrendingUp className="size-4" />
            <span className="text-[10px] uppercase tracking-wider font-bold">Pemasukan</span>
          </div>
          <p className="text-lg font-bold font-heading tabular-nums">+{formatRupiah(pemasukan)}</p>
        </div>
        <div className="premium-card bg-white/90 backdrop-blur-md dark:bg-[#131527]/90 border border-slate-200/60 dark:border-slate-800/60 p-4 space-y-1 border-l-4 border-l-rose-500">
          <div className="flex items-center gap-2 text-rose-400">
            <TrendingDown className="size-4" />
            <span className="text-[10px] uppercase tracking-wider font-bold">Pengeluaran</span>
          </div>
          <p className="text-lg font-bold font-heading tabular-nums">-{formatRupiah(pengeluaran)}</p>
        </div>
      </div>

      <div className="premium-card bg-white/90 backdrop-blur-md dark:bg-[#131527]/90 border border-slate-200/60 dark:border-slate-800/60 p-4 space-y-1">
        <div className="flex items-center gap-2 text-violet-400">
          <PiggyBank className="size-4" />
          <span className="text-[10px] uppercase tracking-wider font-bold">Selisih</span>
        </div>
        <p className={`text-lg font-bold font-heading tabular-nums ${pemasukan - pengeluaran >= 0 ? "text-[#7B61FF]" : "text-rose-400"}`}>
          {formatRupiah(pemasukan - pengeluaran)}
        </p>
      </div>

      {byKategori.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground">Pengeluaran per Kategori</p>
          {byKategori.map(([kategori, total]) => (
            <div key={kategori} className="premium-card bg-white/90 backdrop-blur-md dark:bg-[#131527]/90 border border-slate-200/60 dark:border-slate-800/60 p-3 flex justify-between items-center">
              <span className="text-xs">{kategori}</span>
              <span className="text-xs font-bold text-rose-400 tabular-nums">{formatRupiah(total)}</span>
            </div>
          ))}
        </div>
      )}

      {transaksiBulan.length === 0 && (
        <p className="text-xs text-muted-foreground/40 text-center py-8">Belum ada transaksi bulan ini</p>
      )}
    </div>
  );
}
