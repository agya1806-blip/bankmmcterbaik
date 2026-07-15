"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Wallet, Plus, PiggyBank, Trash2, Home } from "lucide-react";
import toast from "react-hot-toast";
import { useBusinessStore } from "@/store/useBusinessStore";
import { CardSkeleton } from "@/components/ui/skeleton";

function formatRupiah(n: number) { return `Rp ${n.toLocaleString("id-ID")}`; }

export default function DompetKeluargaPage() {
  const router = useRouter();
  const { wallets, tambahSaldoWallet } = useBusinessStore();
  const [mounted, setMounted] = useState(false);
  const [showTambah, setShowTambah] = useState(false);
  const [nama, setNama] = useState("");
  const [saldoAwal, setSaldoAwal] = useState("");

  useEffect(() => setMounted(true), []);

  const tambahWallet = () => {
    if (!nama.trim()) { toast.error("Nama dompet harus diisi"); return; }
    const saldo = parseInt(saldoAwal.replace(/\D/g, ""), 10) || 0;
    tambahSaldoWallet(`wallet-${Date.now()}`, saldo);
    setNama("");
    setSaldoAwal("");
    setShowTambah(false);
    toast.success("Dompet ditambahkan");
  };

  if (!mounted) return <CardSkeleton />;

  return (
    <div className="max-w-2xl mx-auto pb-20 space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/buku-keluarga")} className="size-10 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors">
          <ArrowLeft className="size-5 text-slate-300" />
        </button>
        <div>
          <h1 className="text-lg font-bold font-heading">Dompet Keluarga</h1>
          <p className="text-xs text-muted-foreground/60">Buku Keluarga</p>
        </div>
        <button onClick={() => setShowTambah(!showTambah)} className="ml-auto size-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/30">
          <Plus className="size-5" />
        </button>
      </div>

      {showTambah && (
        <div className="floating-card p-4 space-y-3 border border-emerald-500/20">
          <input type="text" value={nama} onChange={(e) => setNama(e.target.value)}
            placeholder="Nama dompet" className="input-premium w-full text-xs" />
          <input type="text" inputMode="numeric" value={saldoAwal} onChange={(e) => setSaldoAwal(e.target.value.replace(/\D/g, ""))}
            placeholder="Saldo awal" className="input-premium w-full text-xs" />
          <button onClick={tambahWallet}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold">
            Simpan
          </button>
        </div>
      )}

      <div className="space-y-2">
        {wallets.length === 0 && (
          <p className="text-xs text-muted-foreground/40 text-center py-8">Belum ada dompet</p>
        )}
        {wallets.map((w) => (
          <div key={w.id} className="floating-card p-4 flex items-center gap-3">
            <div className="size-10 rounded-xl bg-slate-800 flex items-center justify-center text-lg">
              <Home className="size-5 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{w.namaDompet}</p>
              <p className="text-[10px] text-muted-foreground/40">Dompet Keluarga</p>
            </div>
            <p className="text-sm font-bold text-emerald-400 font-heading tabular-nums">{formatRupiah(w.saldo)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
