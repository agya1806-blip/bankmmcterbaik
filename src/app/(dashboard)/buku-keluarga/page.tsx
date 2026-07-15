"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp, Plus, Users, Home, Heart, ShoppingBag,
} from "lucide-react";
import toast from "react-hot-toast";
import { CardSkeleton } from "@/components/ui/skeleton";
import { useBusinessStore, type PersonalCategory } from "@/store/useBusinessStore";

const KATEGORI: { id: PersonalCategory; label: string; icon: React.ElementType; warna: string }[] = [
  { id: "Makanan", label: "Makanan", icon: ShoppingBag, warna: "text-orange-400" },
  { id: "Transportasi", label: "Transportasi", icon: TrendingUp, warna: "text-blue-400" },
  { id: "Cicilan", label: "Cicilan", icon: Home, warna: "text-yellow-400" },
  { id: "Hiburan", label: "Hiburan", icon: Heart, warna: "text-red-400" },
  { id: "Lainnya", label: "Lainnya", icon: Users, warna: "text-gray-400" },
];

function getKategori(id: string) { return KATEGORI.find((k) => k.id === id) || KATEGORI[6]; }
function genId() { return Math.random().toString(36).substring(2, 11); }
function todayISO() { return new Date().toISOString().slice(0, 10); }
function formatRupiah(n: number) { return `IDR ${n.toLocaleString("id-ID")}`; }

function Ringkasan({ pemasukan, pengeluaran }: { pemasukan: number; pengeluaran: number }) {
  const saldo = pemasukan - pengeluaran;
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="premium-stat bg-gradient-to-br from-[#7B61FF] to-[#FF5C00] shadow-xl shadow-[#7B61FF]/25">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_60%)]" />
        <div className="relative z-10 space-y-1">
          <p className="premium-stat-label">Saldo</p>
          <p className="premium-stat-value">{formatRupiah(saldo)}</p>
        </div>
      </div>
      <div className="premium-stat bg-gradient-to-br from-blue-500 to-blue-600 shadow-xl shadow-blue-500/25">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_60%)]" />
        <div className="relative z-10 space-y-1">
          <p className="premium-stat-label">Pemasukan</p>
          <p className="premium-stat-value">+{formatRupiah(pemasukan)}</p>
        </div>
      </div>
      <div className="premium-stat bg-gradient-to-br from-rose-500 to-rose-600 shadow-xl shadow-rose-500/25">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_60%)]" />
        <div className="relative z-10 space-y-1">
          <p className="premium-stat-label">Pengeluaran</p>
          <p className="premium-stat-value">-{formatRupiah(pengeluaran)}</p>
        </div>
      </div>
    </div>
  );
}

export default function BukuKeluargaPage() {
  const store = useBusinessStore();
  const { personalTransactions, addPersonalTransaction } = store;
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [fTanggal, setFTanggal] = useState(todayISO());
  const [fTipe, setFTipe] = useState<"Pemasukan" | "Pengeluaran">("Pengeluaran");
  const [fNominal, setFNominal] = useState("");
  const [fKategori, setFKategori] = useState<PersonalCategory>("Makanan");
  const [fCatatan, setFCatatan] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); if (formOpen) inputRef.current?.focus(); }, [formOpen]);

  const totalPemasukan = useMemo(() =>
    personalTransactions.filter((t) => t.tipe === "Pemasukan").reduce((s, t) => s + t.nominal, 0),
  [personalTransactions]);
  const totalPengeluaran = useMemo(() =>
    personalTransactions.filter((t) => t.tipe === "Pengeluaran").reduce((s, t) => s + t.nominal, 0),
  [personalTransactions]);

  const resetForm = () => { setFTanggal(todayISO()); setFTipe("Pengeluaran"); setFNominal(""); setFKategori("Makanan"); setFCatatan(""); };

  const simpan = (e: React.FormEvent) => {
    e.preventDefault();
    const nominal = parseInt(fNominal.replace(/\D/g, ""), 10);
    if (!nominal) { toast.error("Nominal harus diisi"); return; }
    addPersonalTransaction({ id: genId(), tanggal: fTanggal, tipe: fTipe, kategori: fKategori, nominal, catatan: fCatatan.trim() || fKategori });
    toast.success(`${fTipe} ${formatRupiah(nominal)} tersimpan`);
    resetForm();
    setFormOpen(false);
  };

  const sorted = useMemo(() => [...personalTransactions].sort((a, b) => b.tanggal.localeCompare(a.tanggal)).slice(0, 10), [personalTransactions]);

  if (!mounted) return <CardSkeleton />;

  return (
    <div className="max-w-2xl mx-auto pb-20 space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="size-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-xl shadow-amber-500/20">
          <Home className="size-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold font-heading">Buku Keluarga</h1>
          <p className="text-xs text-muted-foreground/60">Kelola keuangan rumah tangga</p>
        </div>
      </div>

      <Ringkasan pemasukan={totalPemasukan} pengeluaran={totalPengeluaran} />

      <div className="flex gap-2">
        <button onClick={() => setFormOpen(!formOpen)}
          className="btn-gradient flex-1 py-3.5 rounded-2xl text-xs">
          <Plus className="size-4 inline mr-1" />Catat Transaksi
        </button>
        <button onClick={() => router.push("/buku-keluarga/transaksi")}
          className="btn-ghost flex-1 py-3.5 rounded-2xl text-xs">
          Riwayat
        </button>
        <button onClick={() => router.push("/buku-keluarga/laporan")}
          className="btn-ghost flex-1 py-3.5 rounded-2xl text-xs">
          Laporan
        </button>
        <button onClick={() => router.push("/buku-keluarga/dompet")}
          className="btn-ghost py-3.5 px-4 rounded-2xl">
          <Home className="size-4" />
        </button>
      </div>

      {formOpen && (
        <form onSubmit={simpan} className="premium-card bg-white/90 backdrop-blur-md dark:bg-[#131527]/90 border border-slate-200/60 dark:border-slate-800/60 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <input ref={inputRef} type="date" value={fTanggal} onChange={(e) => setFTanggal(e.target.value)} className="input-premium text-xs" />
            <select value={fTipe} onChange={(e) => setFTipe(e.target.value as any)} className="input-premium text-xs">
              <option value="Pemasukan">Pemasukan</option>
              <option value="Pengeluaran">Pengeluaran</option>
            </select>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/40">Rp</span>
            <input type="text" inputMode="numeric" value={fNominal} onChange={(e) => setFNominal(e.target.value.replace(/\D/g, ""))}
              placeholder="Nominal" className="input-premium w-full text-xs pl-7 tabular-nums" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {KATEGORI.map((k) => {
              const Ico = k.icon;
              return (
                <button key={k.id} type="button" onClick={() => setFKategori(k.id)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl min-w-[60px] transition-all ${fKategori === k.id ? "bg-[#7B61FF]/10 border border-[#7B61FF]/20" : "premium-card bg-white/90 backdrop-blur-md dark:bg-[#131527]/90 border border-slate-200/60 dark:border-slate-800/60"}`}>
                  <Ico className={`size-4 ${fKategori === k.id ? k.warna : "text-muted-foreground/40"}`} />
                  <span className={`text-[8px] whitespace-nowrap ${fKategori === k.id ? "text-white font-semibold" : "text-muted-foreground/40"}`}>{k.label}</span>
                </button>
              );
            })}
          </div>
          <input type="text" value={fCatatan} onChange={(e) => setFCatatan(e.target.value)}
            placeholder="Catatan (opsional)" className="input-premium w-full text-xs" />
          <div className="flex gap-2">
            <button type="submit" className="btn-gradient flex-1 py-3 rounded-xl text-xs">Simpan</button>
            <button type="button" onClick={() => { resetForm(); setFormOpen(false); }}
              className="btn-ghost px-5 py-3 rounded-xl text-xs">Batal</button>
          </div>
        </form>
      )}

      {sorted.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Transaksi Terakhir</p>
          {sorted.map((t) => {
            const kat = getKategori(t.kategori);
            const Ico = kat.icon;
            return (
              <div key={t.id} className="premium-card bg-white/90 backdrop-blur-md dark:bg-[#131527]/90 border border-slate-200/60 dark:border-slate-800/60 p-3 flex items-center gap-3">
                <div className={`size-9 rounded-xl premium-card bg-white/90 backdrop-blur-md dark:bg-[#131527]/90 border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-center ${kat.warna}`}><Ico className="size-4" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold">{t.catatan || kat.label}</p>
                  <p className="text-[9px] text-muted-foreground/40">{t.tanggal}</p>
                </div>
                <p className={`text-xs font-bold tabular-nums ${t.tipe === "Pemasukan" ? "text-[#7B61FF]" : "text-rose-400"}`}>
                  {t.tipe === "Pemasukan" ? "+" : "-"}{formatRupiah(t.nominal)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
