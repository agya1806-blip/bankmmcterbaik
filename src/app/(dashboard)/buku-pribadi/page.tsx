"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  Wallet, TrendingUp, Plus, X, Download,
  Coffee, Car, ShoppingBag, Zap, Home, Heart, BookOpen,
  ArrowUpRight, ArrowDownRight, PiggyBank, Lightbulb,
  Shield, Trash2, FileDown,
} from "lucide-react";
import toast from "react-hot-toast";

/* ─── Types ─── */
type TransType = "income" | "expense";

interface AkunDompet {
  id: string;
  nama: string;
  saldo: number;
  icon: string;
  warna: string;
}

interface Kategori {
  id: string;
  label: string;
  icon: React.ElementType;
  warna: string;
}

interface Transaksi {
  id: string;
  tanggal: string;
  tipe: TransType;
  nominal: number;
  kategoriId: string;
  catatan: string;
  amplopId: string | null;
}

interface Amplop {
  id: string;
  nama: string;
  budget: number;
  tersisa: number;
  icon: React.ElementType;
  warna: string;
}

/* ─── Data Statis ─── */
const AKUN_DOMPET: AkunDompet[] = [
  { id: "kas-utama", nama: "Kas Utama", saldo: 45_000_000, icon: "Wallet", warna: "from-emerald-500 to-emerald-600" },
  { id: "dana-darurat", nama: "Dana Darurat", saldo: 120_000_000, icon: "Shield", warna: "from-blue-500 to-blue-600" },
  { id: "tabungan", nama: "Tabungan", saldo: 28_500_000, icon: "PiggyBank", warna: "from-amber-500 to-amber-600" },
  { id: "investasi", nama: "Investasi", saldo: 65_000_000, icon: "TrendingUp", warna: "from-violet-500 to-violet-600" },
];

const KATEGORI: Kategori[] = [
  { id: "makanan", label: "Makanan", icon: Coffee, warna: "text-orange-500" },
  { id: "transportasi", label: "Transportasi", icon: Car, warna: "text-blue-500" },
  { id: "belanja", label: "Belanja", icon: ShoppingBag, warna: "text-pink-500" },
  { id: "tagihan", label: "Tagihan", icon: Zap, warna: "text-yellow-500" },
  { id: "hiburan", label: "Hiburan", icon: Heart, warna: "text-red-500" },
  { id: "rumah", label: "Rumah", icon: Home, warna: "text-cyan-500" },
  { id: "investasi", label: "Investasi", icon: TrendingUp, warna: "text-violet-500" },
  { id: "lainnya", label: "Lainnya", icon: BookOpen, warna: "text-gray-500" },
];

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/* ─── Helpers ─── */
function formatRupiah(n: number) {
  return `IDR ${n.toLocaleString("id-ID")}`;
}

function getKategori(id: string) {
  return KATEGORI.find((k) => k.id === id) || KATEGORI[7];
}

const AMPLOP_AWAL: Amplop[] = [
  { id: "uang-jajan", nama: "Uang Jajan", budget: 1_500_000, tersisa: 1_200_000, icon: Coffee, warna: "from-orange-500 to-amber-500" },
  { id: "bayar-listrik", nama: "Bayar Listrik", budget: 500_000, tersisa: 500_000, icon: Zap, warna: "from-yellow-500 to-yellow-600" },
  { id: "investasi", nama: "Investasi", budget: 3_000_000, tersisa: 3_000_000, icon: TrendingUp, warna: "from-violet-500 to-violet-600" },
];

const TRANS_AWAL: Transaksi[] = [
  { id: "t1", tanggal: "2026-07-13", tipe: "income", nominal: 15_000_000, kategoriId: "lainnya", catatan: "Gaji Bulanan", amplopId: null },
  { id: "t2", tanggal: "2026-07-12", tipe: "expense", nominal: 450_000, kategoriId: "makanan", catatan: "Makan di RM Padang + kopi", amplopId: "uang-jajan" },
  { id: "t3", tanggal: "2026-07-11", tipe: "expense", nominal: 200_000, kategoriId: "transportasi", catatan: "Isi bensin + tol", amplopId: "uang-jajan" },
  { id: "t4", tanggal: "2026-07-10", tipe: "expense", nominal: 1_200_000, kategoriId: "tagihan", catatan: "Listrik bulan Juli", amplopId: "bayar-listrik" },
  { id: "t5", tanggal: "2026-07-09", tipe: "expense", nominal: 350_000, kategoriId: "hiburan", catatan: "Netflix + Spotify setahun", amplopId: "uang-jajan" },
  { id: "t6", tanggal: "2026-07-08", tipe: "income", nominal: 2_500_000, kategoriId: "investasi", catatan: "Dividen saham", amplopId: null },
  { id: "t7", tanggal: "2026-07-07", tipe: "expense", nominal: 750_000, kategoriId: "belanja", catatan: "Baju di e-commerce", amplopId: "uang-jajan" },
];

/* ─── Component ─── */
export default function BukuPribadiPage() {
  const [mounted, setMounted] = useState(false);
  const [transaksiList, setTransaksiList] = useState<Transaksi[]>(TRANS_AWAL);
  const [amplopList, setAmplopList] = useState<Amplop[]>(AMPLOP_AWAL);
  const [formOpen, setFormOpen] = useState(false);
  const [editingAmplop, setEditingAmplop] = useState<string | null>(null);

  /* form state */
  const [fTanggal, setFTanggal] = useState(todayISO());
  const [fTipe, setFTipe] = useState<TransType>("expense");
  const [fNominal, setFNominal] = useState("");
  const [fKategori, setFKategori] = useState("makanan");
  const [fCatatan, setFCatatan] = useState("");
  const [fAmplop, setFAmplop] = useState("");

  useEffect(() => setMounted(true), []);

  const totalSaldo = useMemo(() => AKUN_DOMPET.reduce((s, a) => s + a.saldo, 0), []);

  const resetForm = useCallback(() => {
    setFTanggal(todayISO());
    setFTipe("expense");
    setFNominal("");
    setFKategori("makanan");
    setFCatatan("");
    setFAmplop("");
  }, []);

  const handleCatat = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const nominal = parseInt(fNominal.replace(/\D/g, ""), 10);
      if (!nominal || nominal <= 0) {
        toast.error("Nominal harus diisi dengan benar");
        return;
      }
      const tx: Transaksi = {
        id: generateId(),
        tanggal: fTanggal,
        tipe: fTipe,
        nominal,
        kategoriId: fKategori,
        catatan: fCatatan,
        amplopId: fAmplop || null,
      };
      setTransaksiList((prev) => [tx, ...prev]);

      /* potong amplop jika expense */
      if (fTipe === "expense" && fAmplop) {
        setAmplopList((prev) =>
          prev.map((a) =>
            a.id === fAmplop ? { ...a, tersisa: a.tersisa - nominal } : a
          )
        );
      }

      toast.success(
        `${fTipe === "income" ? "Pemasukan" : "Pengeluaran"} Rp${nominal.toLocaleString()} dicatat`
      );
      resetForm();
      setFormOpen(false);
    },
    [fTanggal, fTipe, fNominal, fKategori, fCatatan, fAmplop, resetForm]
  );

  const handleEditAmplopBudget = useCallback(
    (id: string, budget: number) => {
      setAmplopList((prev) =>
        prev.map((a) => {
          if (a.id !== id) return a;
          const selisih = budget - a.budget;
          return { ...a, budget, tersisa: a.tersisa + selisih };
        })
      );
      setEditingAmplop(null);
      toast.success("Budget amplop diperbarui");
    },
    []
  );

  const handleExportPDF = useCallback(() => {
    toast.success("📄 Laporan PDF Buku Pribadi sedang dibuat (mock)");
  }, []);

  const handleExportExcel = useCallback(() => {
    toast.success("📊 File Excel Buku Pribadi sedang dibuat (mock)");
  }, []);

  const handleHapusTransaksi = useCallback((id: string) => {
    setTransaksiList((prev) => prev.filter((t) => t.id !== id));
    toast.success("Transaksi dihapus");
  }, []);

  if (!mounted) return <div className="min-h-[60vh]" />;

  return (
    <div className="max-w-2xl mx-auto pb-20 space-y-6 animate-fade-in">
      {/* ─── HEADER ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/20">
            <Wallet className="size-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-heading">Buku Pribadi</h1>
            <p className="text-xs text-muted-foreground/60">Personal Wealth & Daily Cashflow</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportPDF}
            className="size-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            <FileDown className="size-4 text-white" />
          </button>
          <button
            onClick={handleExportExcel}
            className="size-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Download className="size-4 text-white" />
          </button>
        </div>
      </div>

      {/* ─── WIDGET RINGKASAN & AKUN DOMPET ─── */}
      <div className="floating-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest flex items-center gap-1.5">
            <Wallet className="size-3.5" /> Total Saldo Dompet
          </p>
          <span className="text-lg font-bold font-heading tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatRupiah(totalSaldo)}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {AKUN_DOMPET.map((akun) => {
            const Ico = akun.icon === "Wallet" ? Wallet : akun.icon === "Shield" ? Shield : akun.icon === "PiggyBank" ? PiggyBank : TrendingUp;
            return (
              <div
                key={akun.id}
                className="relative overflow-hidden rounded-xl p-3 bg-gradient-to-br bg-card border border-border/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
              >
                <div className={`absolute top-0 right-0 size-16 -mr-6 -mt-6 rounded-full bg-gradient-to-br ${akun.warna} opacity-10 group-hover:opacity-20 transition-opacity`} />
                <div className="relative z-10 space-y-1">
                  <div className={`size-7 rounded-lg bg-gradient-to-br ${akun.warna} flex items-center justify-center`}>
                    <Ico className="size-3.5 text-white" />
                  </div>
                  <p className="text-[10px] text-muted-foreground/60 font-medium truncate mt-1">{akun.nama}</p>
                  <p className="text-xs font-bold font-heading tabular-nums">{formatRupiah(akun.saldo)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── FORM TRANSAKSI KILAT ─── */}
      <button
        onClick={() => { resetForm(); setFormOpen(true); }}
        className="w-full floating-card p-4 flex items-center justify-between group hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-200"
      >
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Plus className="size-5 text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold">Catat Transaksi Baru</p>
            <p className="text-[10px] text-muted-foreground/60">Pemasukan / Pengeluaran cepat</p>
          </div>
        </div>
        <ArrowUpRight className="size-4 text-muted-foreground/40 group-hover:text-emerald-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
      </button>

      {/* ─── AMPLOP DIGITAL ─── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold flex items-center gap-1.5">
            <PiggyBank className="size-4 text-emerald-500" /> Amplop Digital
          </h2>
          <span className="text-[10px] text-muted-foreground/50">Anggaran Bulanan</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {amplopList.map((amp) => {
            const pct = amp.budget > 0 ? Math.round((amp.tersisa / amp.budget) * 100) : 0;
            const low = pct < 25;
            const Ico = amp.icon;
            return (
              <div key={amp.id} className="floating-card p-4 space-y-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-start justify-between">
                  <div className={`size-9 rounded-xl bg-gradient-to-br ${amp.warna} flex items-center justify-center shadow-md`}>
                    <Ico className="size-4 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold tabular-nums">{formatRupiah(amp.tersisa)}</p>
                    <p className="text-[10px] text-muted-foreground/50">dari {formatRupiah(amp.budget)}</p>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium">{amp.nama}</p>
                    <div className="flex items-center gap-1">
                      {low && <Lightbulb className="size-3 text-red-500" />}
                      <button
                        onClick={() => setEditingAmplop(editingAmplop === amp.id ? null : amp.id)}
                        className="text-[10px] text-muted-foreground/40 hover:text-emerald-500 transition-colors"
                      >
                        {editingAmplop === amp.id ? "Tutup" : "Atur"}
                      </button>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        low
                          ? "bg-red-500"
                          : pct < 50
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                {editingAmplop === amp.id && (
                  <EditAmplopForm
                    amp={amp}
                    onSave={handleEditAmplopBudget}
                    onCancel={() => setEditingAmplop(null)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── LOG AKTIVITAS ─── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold flex items-center gap-1.5">
            <TrendingUp className="size-4 text-emerald-500" /> Log Aktivitas
          </h2>
          <span className="text-[10px] text-muted-foreground/50">{transaksiList.length} transaksi</span>
        </div>
        <div className="space-y-1.5">
          {transaksiList
            .sort((a, b) => b.tanggal.localeCompare(a.tanggal) || b.id.localeCompare(a.id))
            .map((tx) => {
              const kat = getKategori(tx.kategoriId);
              const Ico = kat.icon;
              const ampAmbil = amplopList.find((a) => a.id === tx.amplopId);
              const AmpIco = ampAmbil ? ampAmbil.icon : null;
              return (
                <div
                  key={tx.id}
                  className="floating-card p-3 flex items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
                >
                  <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${
                    tx.tipe === "income"
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-rose-500/10 text-rose-500"
                  }`}>
                    {tx.tipe === "income"
                      ? <ArrowDownRight className="size-4" />
                      : <ArrowUpRight className="size-4" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Ico className={`size-3.5 ${kat.warna} shrink-0`} />
                      <p className="text-xs font-medium truncate">{kat.label}</p>
                      {AmpIco && (
                        <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground/40">
                          <AmpIco className="size-2.5" />
                        </span>
                      )}
                    </div>
                    {tx.catatan && (
                      <p className="text-[10px] text-muted-foreground/60 truncate">{tx.catatan}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-xs font-bold font-heading tabular-nums ${
                      tx.tipe === "income"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-500 dark:text-rose-400"
                    }`}>
                      {tx.tipe === "income" ? "+" : "-"}
                      {formatRupiah(tx.nominal)}
                    </p>
                    <p className="text-[9px] text-muted-foreground/40">
                      {new Date(tx.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleHapusTransaksi(tx.id)}
                    className="size-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 text-muted-foreground/40 hover:text-rose-500 transition-all"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              );
            })}
        </div>
      </div>

      {/* ─── PANEL FORM (SIDE/DRAWER) ─── */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setFormOpen(false)} />
          <div className="relative w-full max-w-md mx-4 mb-0 sm:mb-0 rounded-2xl bg-card border border-border/60 shadow-2xl p-5 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                  <Plus className="size-4 text-white" />
                </div>
                <p className="text-sm font-bold font-heading">Catat Transaksi</p>
              </div>
              <button
                onClick={() => setFormOpen(false)}
                className="size-8 rounded-xl flex items-center justify-center hover:bg-muted/50 transition-colors"
              >
                <X className="size-4 text-muted-foreground" />
              </button>
            </div>
            <form onSubmit={handleCatat} className="space-y-3.5">
              {/* Tanggal */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Tanggal</label>
                <input
                  type="date"
                  value={fTanggal}
                  onChange={(e) => setFTanggal(e.target.value)}
                  className="input-premium w-full text-xs"
                />
              </div>
              {/* Tipe */}
              <div className="flex gap-2">
                {(["expense", "income"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFTipe(t)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      fTipe === t
                        ? t === "income"
                          ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                          : "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                        : "bg-muted/40 text-muted-foreground/60 hover:bg-muted/60"
                    }`}
                  >
                    {t === "income" ? "Pemasukan" : "Pengeluaran"}
                  </button>
                ))}
              </div>
              {/* Nominal */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Nominal</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/50 font-medium">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={fNominal}
                    onChange={(e) => setFNominal(e.target.value.replace(/\D/g, ""))}
                    placeholder="0"
                    className="input-premium w-full text-xs pl-9 tabular-nums"
                  />
                </div>
              </div>
              {/* Kategori */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Kategori</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {KATEGORI.map((kat) => {
                    const Ico = kat.icon;
                    const aktif = fKategori === kat.id;
                    return (
                      <button
                        key={kat.id}
                        type="button"
                        onClick={() => setFKategori(kat.id)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${
                          aktif
                            ? "border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20"
                            : "border-transparent bg-muted/20 hover:bg-muted/40"
                        }`}
                      >
                        <Ico className={`size-4 ${kat.warna}`} />
                        <span className={`text-[8px] font-medium ${aktif ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground/50"}`}>
                          {kat.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Amplop */}
              {fTipe === "expense" && (
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Potong dari Amplop (opsional)</label>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setFAmplop("")}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-medium border transition-all ${
                        !fAmplop
                          ? "border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600"
                          : "border-border/50 text-muted-foreground/50 hover:border-muted-foreground/20"
                      }`}
                    >
                      Tanpa Amplop
                    </button>
                    {amplopList.map((amp) => {
                      const Ico = amp.icon;
                      const aktif = fAmplop === amp.id;
                      return (
                        <button
                          key={amp.id}
                          type="button"
                          onClick={() => setFAmplop(amp.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium border transition-all ${
                            aktif
                              ? "border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600"
                              : "border-border/50 text-muted-foreground/50 hover:border-muted-foreground/20"
                          }`}
                        >
                          <Ico className="size-3" />
                          {amp.nama}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* Catatan */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Catatan Ringkas</label>
                <input
                  type="text"
                  value={fCatatan}
                  onChange={(e) => setFCatatan(e.target.value)}
                  placeholder="cth: Makan siang di kantor"
                  className="input-premium w-full text-xs"
                  maxLength={120}
                />
              </div>
              {/* Tombol simpan */}
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all"
              >
                {fTipe === "income" ? "Catat Pemasukan" : "Catat Pengeluaran"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── EXPORT BUTTONS EXTRA ─── */}
      <div className="floating-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/20">
            <Download className="size-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold">Ekspor Laporan</p>
            <p className="text-[10px] text-muted-foreground/60">PDF / Excel — seluruh riwayat Buku Pribadi</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportPDF}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-[10px] font-semibold shadow-md shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <FileDown className="size-3.5" /> PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white text-[10px] font-semibold shadow-md shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Download className="size-3.5" /> Excel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-komponen Edit Amplop ─── */
function EditAmplopForm({
  amp,
  onSave,
  onCancel,
}: {
  amp: Amplop;
  onSave: (id: string, budget: number) => void;
  onCancel: () => void;
}) {
  const [val, setVal] = useState(amp.budget.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const n = parseInt(val.replace(/\D/g, ""), 10);
        if (n > 0) onSave(amp.id, n);
      }}
      className="space-y-2 pt-2 border-t border-border/20"
    >
      <label className="text-[10px] text-muted-foreground/50">Budget {amp.nama}</label>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/40">Rp</span>
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={val}
            onChange={(e) => setVal(e.target.value.replace(/\D/g, ""))}
            className="input-premium w-full text-[10px] pl-6 tabular-nums"
          />
        </div>
        <button
          type="submit"
          className="px-2.5 py-2 rounded-lg bg-emerald-500 text-white text-[10px] font-semibold hover:bg-emerald-600 transition-colors"
        >
          Simpan
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-2.5 py-2 rounded-lg text-[10px] text-muted-foreground/50 hover:bg-muted/30 transition-colors"
        >
          Batal
        </button>
      </div>
    </form>
  );
}
