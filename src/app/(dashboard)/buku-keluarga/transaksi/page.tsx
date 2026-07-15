"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, ShoppingBag, Heart, TrendingUp, Users } from "lucide-react";
import toast from "react-hot-toast";
import { useBusinessStore } from "@/store/useBusinessStore";
import { CardSkeleton } from "@/components/ui/skeleton";

const KATEGORI_ICON: Record<string, React.ElementType> = {
  Makanan: ShoppingBag, Transportasi: TrendingUp, Cicilan: TrendingUp,
  Hiburan: Heart, Lainnya: Users,
};

const KATEGORI_WARNA: Record<string, string> = {
  Makanan: "text-orange-400", Transportasi: "text-blue-400", Cicilan: "text-yellow-400",
  Hiburan: "text-red-400", Lainnya: "text-gray-400",
};

function formatRupiah(n: number) { return `Rp ${n.toLocaleString("id-ID")}`; }

export default function TransaksiKeluargaPage() {
  const router = useRouter();
  const { personalTransactions, removePersonalTransaction } = useBusinessStore();
  const [mounted, setMounted] = useState(false);
  const [filterTipe, setFilterTipe] = useState<"all" | "Pemasukan" | "Pengeluaran">("all");

  useEffect(() => setMounted(true), []);

  const filtered = useMemo(() => {
    let list = [...personalTransactions].sort((a, b) => b.tanggal.localeCompare(a.tanggal));
    if (filterTipe !== "all") list = list.filter((t) => t.tipe === filterTipe);
    return list;
  }, [personalTransactions, filterTipe]);

  if (!mounted) return <CardSkeleton />;

  return (
    <div className="max-w-2xl mx-auto pb-20 space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/buku-keluarga")} className="size-10 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors">
          <ArrowLeft className="size-5 text-slate-300" />
        </button>
        <div>
          <h1 className="text-lg font-bold font-heading">Riwayat Transaksi</h1>
          <p className="text-xs text-muted-foreground/60">Buku Keluarga</p>
        </div>
      </div>

      <div className="flex gap-2">
        {(["all", "Pemasukan", "Pengeluaran"] as const).map((tip) => (
          <button key={tip} onClick={() => setFilterTipe(tip)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterTipe === tip ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-muted-foreground/60"}`}>
            {tip === "all" ? "Semua" : tip}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-xs text-muted-foreground/40 text-center py-8">Belum ada transaksi</p>
        )}
        {filtered.map((t) => {
          const Icon = KATEGORI_ICON[t.kategori] || Users;
          const warna = KATEGORI_WARNA[t.kategori] || "text-gray-400";
          return (
            <div key={t.id} className="floating-card p-3 flex items-center gap-3">
              <div className={`size-9 rounded-xl bg-slate-800 flex items-center justify-center ${warna}`}>
                <Icon className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold">{t.catatan || t.kategori}</p>
                <p className="text-[9px] text-muted-foreground/40">{t.tanggal} · {t.kategori}</p>
              </div>
              <p className={`text-xs font-bold tabular-nums ${t.tipe === "Pemasukan" ? "text-emerald-400" : "text-rose-400"}`}>
                {t.tipe === "Pemasukan" ? "+" : "-"}{formatRupiah(t.nominal)}
              </p>
              <button onClick={() => { removePersonalTransaction(t.id); toast.success("Dihapus"); }}
                className="size-8 rounded-lg bg-rose-500/10 flex items-center justify-center hover:bg-rose-500/20">
                <Trash2 className="size-3.5 text-rose-400" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
