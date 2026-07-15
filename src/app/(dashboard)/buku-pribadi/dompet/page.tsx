"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { useBusinessStore } from "@/store/useBusinessStore";
import { CardSkeleton } from "@/components/ui/skeleton";

function formatRupiah(n: number) { return `Rp ${n.toLocaleString("id-ID")}`; }

const WALLET_ICONS: Record<string, string> = {
  "wallet-kas": "💰", "wallet-bsi": "🏦", "wallet-mandiri": "🏦",
  "wallet-bca": "🏦", "wallet-bri": "🏦", "wallet-dana": "📱",
  "wallet-gopay": "📱", "wallet-ovo": "📱",
};

export default function DompetPribadiPage() {
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
        <button onClick={() => router.push("/buku-pribadi")} className="btn-ghost size-10 rounded-xl flex items-center justify-center">
          <ArrowLeft className="size-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold font-heading">Dompet</h1>
          <p className="text-xs text-muted-foreground/60">Buku Pribadi</p>
        </div>
        <button onClick={() => setShowTambah(!showTambah)} className="ml-auto btn-gradient size-10 rounded-xl flex items-center justify-center">
          <Plus className="size-5 text-white" />
        </button>
      </div>

      {showTambah && (
        <div className="premium-card bg-white/90 backdrop-blur-md dark:bg-[#131527]/90 border border-slate-200/60 dark:border-slate-800/60 p-4 space-y-3">
          <input type="text" value={nama} onChange={(e) => setNama(e.target.value)}
            placeholder="Nama dompet (cth: Dana)" className="input-premium w-full text-xs" />
          <input type="text" inputMode="numeric" value={saldoAwal} onChange={(e) => setSaldoAwal(e.target.value.replace(/\D/g, ""))}
            placeholder="Saldo awal" className="input-premium w-full text-xs" />
          <button onClick={tambahWallet}
            className="btn-gradient w-full py-2.5 rounded-xl text-xs">
            Simpan
          </button>
        </div>
      )}

      <div className="space-y-2">
        {wallets.length === 0 && (
          <p className="text-xs text-muted-foreground/40 text-center py-8">Belum ada dompet</p>
        )}
        {wallets.map((w) => (
          <div key={w.id} className="premium-card bg-white/90 backdrop-blur-md dark:bg-[#131527]/90 border border-slate-200/60 dark:border-slate-800/60 p-4 flex items-center gap-3">
            <div className="size-10 rounded-xl premium-card bg-white/90 backdrop-blur-md dark:bg-[#131527]/90 border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-center text-lg">
              {WALLET_ICONS[w.id] || "💳"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{w.namaDompet}</p>
              <p className="text-[10px] text-muted-foreground/40">{w.tipe || "Kas Tunai"}</p>
            </div>
            <p className="text-sm font-bold text-[#7B61FF] font-heading tabular-nums">{formatRupiah(w.saldo)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
