"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  Wallet, TrendingUp, Plus, X, Download,
  Coffee, Car, ShoppingBag, Zap, Home, Heart, BookOpen,
  ArrowUpRight, ArrowDownRight, PiggyBank,
  Trash2, FileDown, Target, Calendar,
  Send,
} from "lucide-react";
import toast from "react-hot-toast";
import { CardSkeleton } from "@/components/ui/skeleton";
import { useBusinessStore, PersonalTransaction, SavingsGoal } from "@/store/useBusinessStore";

/* ─── Kategori tetap ─── */
interface Kategori {
  id: string;
  label: string;
  icon: React.ElementType;
  warna: string;
}

const KATEGORI: Kategori[] = [
  { id: "Makanan", label: "Makanan", icon: Coffee, warna: "text-orange-500" },
  { id: "Transportasi", label: "Transportasi", icon: Car, warna: "text-blue-500" },
  { id: "Belanja", label: "Belanja", icon: ShoppingBag, warna: "text-pink-500" },
  { id: "Cicilan", label: "Cicilan", icon: Zap, warna: "text-yellow-500" },
  { id: "Hiburan", label: "Hiburan", icon: Heart, warna: "text-red-500" },
  { id: "Rumah", label: "Rumah", icon: Home, warna: "text-cyan-500" },
  { id: "Investasi", label: "Investasi", icon: TrendingUp, warna: "text-violet-500" },
  { id: "Lainnya", label: "Lainnya", icon: BookOpen, warna: "text-gray-500" },
];

function getKategori(id: string) {
  return KATEGORI.find((k) => k.id === id) || KATEGORI[7];
}

function genId() {
  return Math.random().toString(36).substring(2, 11);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatRupiah(n: number) {
  return `IDR ${n.toLocaleString("id-ID")}`;
}

/* ─── Ringkasan ─── */
function Ringkasan({ pemasukan, pengeluaran }: { pemasukan: number; pengeluaran: number }) {
  const saldo = pemasukan - pengeluaran;
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-xl shadow-emerald-500/25">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_60%)]" />
        <div className="relative z-10 space-y-1">
          <p className="text-white/70 text-[9px] font-semibold uppercase tracking-widest">Saldo</p>
          <p className="text-base font-bold font-heading text-white tabular-nums">{formatRupiah(saldo)}</p>
        </div>
      </div>
      <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-blue-500 to-blue-600 shadow-xl shadow-blue-500/25">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_60%)]" />
        <div className="relative z-10 space-y-1">
          <p className="text-white/70 text-[9px] font-semibold uppercase tracking-widest">Pemasukan</p>
          <p className="text-base font-bold font-heading text-white tabular-nums">+{formatRupiah(pemasukan)}</p>
        </div>
      </div>
      <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-rose-500 to-rose-600 shadow-xl shadow-rose-500/25">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_60%)]" />
        <div className="relative z-10 space-y-1">
          <p className="text-white/70 text-[9px] font-semibold uppercase tracking-widest">Pengeluaran</p>
          <p className="text-base font-bold font-heading text-white tabular-nums">-{formatRupiah(pengeluaran)}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Form Tambah Goal ─── */
function TambahGoalForm({ onSave, onCancel }: { onSave: (g: SavingsGoal) => void; onCancel: () => void }) {
  const [nama, setNama] = useState("");
  const [target, setTarget] = useState("");
  const [tanggal, setTanggal] = useState(todayISO());
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const nominal = parseInt(target.replace(/\D/g, ""), 10);
      if (!nama.trim() || !nominal) { toast.error("Nama dan nominal target harus diisi"); return; }
      onSave({ id: genId(), nama: nama.trim(), targetNominal: nominal, terkumpul: 0, targetDate: tanggal });
      toast.success(`Goal "${nama}" ditambahkan`);
      onCancel();
    }} className="floating-card p-4 space-y-3 border border-emerald-500/20">
      <input ref={inputRef} type="text" value={nama} onChange={(e) => setNama(e.target.value)}
        placeholder="Nama goal (cth: MacBook Pro)" className="input-premium w-full text-xs" />
      <div className="grid grid-cols-2 gap-3">
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/40">Rp</span>
          <input type="text" inputMode="numeric" value={target} onChange={(e) => setTarget(e.target.value.replace(/\D/g, ""))}
            placeholder="Target nominal" className="input-premium w-full text-xs pl-7 tabular-nums" />
        </div>
        <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)}
          className="input-premium w-full text-xs" />
      </div>
      <div className="flex gap-2">
        <button type="submit"
          className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all">
          <Plus className="size-3 inline mr-1" /> Tambah Goal
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2 rounded-xl text-xs text-muted-foreground/50 hover:bg-muted/30 transition-colors">
          Batal
        </button>
      </div>
    </form>
  );
}

export default function BukuPribadiPage() {
  const store = useBusinessStore();
  const { personalTransactions, addPersonalTransaction, removePersonalTransaction, savingsGoals, addSavingsGoal, alokasikanTabungan } = store;

  const [mounted, setMounted] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [showTambahGoal, setShowTambahGoal] = useState(false);

  /* form state */
  const [fTanggal, setFTanggal] = useState(todayISO());
  const [fTipe, setFTipe] = useState<"Pemasukan" | "Pengeluaran">("Pengeluaran");
  const [fNominal, setFNominal] = useState("");
  const [fKategori, setFKategori] = useState("Makanan");
  const [fCatatan, setFCatatan] = useState("");
  const [fGoalId, setFGoalId] = useState("");

  useEffect(() => setMounted(true), []);

  /* Ringkasan */
  const totalPemasukan = useMemo(() =>
    personalTransactions.filter((t) => t.tipe === "Pemasukan").reduce((s, t) => s + t.nominal, 0),
  [personalTransactions]);
  const totalPengeluaran = useMemo(() =>
    personalTransactions.filter((t) => t.tipe === "Pengeluaran").reduce((s, t) => s + t.nominal, 0),
  [personalTransactions]);

  const resetForm = useCallback(() => {
    setFTanggal(todayISO());
    setFTipe("Pengeluaran");
    setFNominal("");
    setFKategori("Makanan");
    setFCatatan("");
    setFGoalId("");
  }, []);

  const handleCatat = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const nominal = parseInt(fNominal.replace(/\D/g, ""), 10);
    if (!nominal || nominal <= 0) { toast.error("Nominal harus diisi"); return; }
    const tx: PersonalTransaction = {
      id: genId(),
      tanggal: fTanggal,
      tipe: fTipe,
      kategori: fKategori as PersonalTransaction["kategori"],
      nominal,
      catatan: fCatatan,
    };
    addPersonalTransaction(tx);

    /* Alokasi ke goal jika dipilih */
    if (fTipe === "Pemasukan" && fGoalId) {
      alokasikanTabungan(fGoalId, nominal);
    }

    toast.success(`${fTipe} Rp${nominal.toLocaleString()} dicatat`);
    resetForm();
    setFormOpen(false);
  }, [fTanggal, fTipe, fNominal, fKategori, fCatatan, fGoalId, resetForm, addPersonalTransaction, alokasikanTabungan]);

  const exportCSV = useCallback(() => {
    const rows: string[][] = [
      ["Tanggal", "Tipe", "Kategori", "Nominal", "Catatan"],
    ];
    personalTransactions.forEach((t) => {
      rows.push([t.tanggal, t.tipe, t.kategori, t.nominal.toString(), t.catatan || ""]);
    });
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `buku-pribadi-${todayISO()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV siap diunduh");
  }, [personalTransactions]);

  const exportPDF = useCallback(async () => {
    toast.success("Menyiapkan PDF...");
    try {
      const el = document.getElementById("buku-pribadi-area");
      if (!el) return;
      const html2pdf = (await import("html2pdf.js")).default;
      html2pdf().set({
        margin: [10, 15, 10, 15],
        filename: `buku-pribadi-${todayISO()}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      }).from(el).save();
    } catch { toast.error("Gagal export PDF"); }
  }, []);

  const sendWA = useCallback(() => {
    const lines: string[] = [];
    lines.push("📊 *BUKU PRIBADI*");
    lines.push(`Saldo: ${formatRupiah(totalPemasukan - totalPengeluaran)}`);
    lines.push(`Pemasukan: ${formatRupiah(totalPemasukan)}`);
    lines.push(`Pengeluaran: ${formatRupiah(totalPengeluaran)}`);
    lines.push("");
    lines.push(`*Transaksi (${personalTransactions.length}):*`);
    personalTransactions.slice(0, 10).forEach((t) => {
      const s = t.tipe === "Pemasukan" ? "+" : "-";
      lines.push(`${t.tanggal} ${s}${formatRupiah(t.nominal)} — ${t.kategori}${t.catatan ? ` (${t.catatan})` : ""}`);
    });
    lines.push("");
    lines.push(`_Laporan Buku Pribadi via MMCBank_`);
    window.open(`https://wa.me/62?text=${encodeURIComponent(lines.join("\n"))}`, "_blank");
  }, [personalTransactions, totalPemasukan, totalPengeluaran]);

  if (!mounted) return <CardSkeleton />;

  return (
    <div id="buku-pribadi-area" className="max-w-2xl mx-auto pb-20 space-y-6 animate-fade-in">
      {/* ─── HEADER ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/20">
            <Wallet className="size-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-heading">Buku Pribadi</h1>
            <p className="text-xs text-muted-foreground/60">{personalTransactions.length} transaksi</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={exportPDF}
            className="size-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
            title="Export PDF">
            <FileDown className="size-4 text-white" />
          </button>
          <button onClick={exportCSV}
            className="size-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all"
            title="Export CSV">
            <Download className="size-4 text-white" />
          </button>
          <button onClick={sendWA}
            className="size-9 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md shadow-green-500/20 hover:scale-105 active:scale-95 transition-all"
            title="Kirim WA">
            <Send className="size-4 text-white" />
          </button>
        </div>
      </div>

      {/* ─── RINGKASAN ─── */}
      <Ringkasan pemasukan={totalPemasukan} pengeluaran={totalPengeluaran} />

      {/* ─── TOMBOL CATAT ─── */}
      <button onClick={() => { resetForm(); setFormOpen(true); }}
        className="w-full floating-card p-4 flex items-center justify-between group hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-200"
      >
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Plus className="size-5 text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold">Catat Transaksi Baru</p>
            <p className="text-[10px] text-muted-foreground/60">Pemasukan / Pengeluaran</p>
          </div>
        </div>
        <ArrowUpRight className="size-4 text-muted-foreground/40 group-hover:text-emerald-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
      </button>

      {/* ─── SAVINGS GOALS ─── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold flex items-center gap-1.5">
            <Target className="size-4 text-emerald-500" /> Tabungan Goal
          </h2>
          <button onClick={() => setShowTambahGoal(!showTambahGoal)}
            className="text-[10px] text-emerald-600 font-semibold hover:underline">
            {showTambahGoal ? "Tutup" : "+ Tambah Goal"}
          </button>
        </div>
        {showTambahGoal && (
          <TambahGoalForm onSave={addSavingsGoal} onCancel={() => setShowTambahGoal(false)} />
        )}
        {savingsGoals.length === 0 ? (
          <div className="floating-card p-6 text-center">
            <PiggyBank className="size-8 mx-auto text-muted-foreground/20 mb-2" />
            <p className="text-xs text-muted-foreground/40">Belum ada goal tabungan</p>
            <p className="text-[10px] text-muted-foreground/30 mt-1">Buat goal untuk tracking target keuangan</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {savingsGoals.map((g) => {
              const pct = g.targetNominal > 0 ? Math.min((g.terkumpul / g.targetNominal) * 100, 100) : 0;
              const sisa = Math.max(g.targetNominal - g.terkumpul, 0);
              const tgl = new Date(g.targetDate + "T00:00:00");
              const overdue = tgl < new Date() && g.terkumpul < g.targetNominal;
              return (
                <div key={g.id} className="floating-card p-4 space-y-2 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold">{g.nama}</p>
                      <p className="text-[10px] text-muted-foreground/50 flex items-center gap-1">
                        <Calendar className="size-3" /> {tgl.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        {overdue && <span className="text-rose-500 font-semibold ml-1">(Terlewat)</span>}
                      </p>
                    </div>
                    <button onClick={() => {
                      const alokasi = prompt("Alokasikan pemasukan ke goal ini? Masukkan nominal Rp:");
                      if (alokasi) {
                        const n = parseInt(alokasi.replace(/\D/g, ""), 10);
                        if (n > 0) { alokasikanTabungan(g.id, n); toast.success(`${formatRupiah(n)} dialokasikan ke "${g.nama}"`); }
                      }
                    }}
                      className="size-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center hover:bg-emerald-500/20 transition-colors"
                      title="Alokasikan dana">
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-muted-foreground/60">{formatRupiah(g.terkumpul)}</span>
                      <span className="font-semibold tabular-nums">{formatRupiah(g.targetNominal)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-300 ${
                        pct >= 100 ? "bg-emerald-500" : overdue ? "bg-rose-500" : "bg-gradient-to-r from-amber-400 to-emerald-500"
                      }`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between text-[9px]">
                      <span className={`font-semibold ${pct >= 100 ? "text-emerald-600" : "text-muted-foreground/40"}`}>
                        {pct.toFixed(0)}% terkumpul
                      </span>
                      <span className="text-muted-foreground/40">Sisa {formatRupiah(sisa)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── LOG TRANSAKSI ─── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold flex items-center gap-1.5">
            <TrendingUp className="size-4 text-emerald-500" /> Log Transaksi
          </h2>
          <span className="text-[10px] text-muted-foreground/50">{personalTransactions.length} transaksi</span>
        </div>
        {personalTransactions.length === 0 ? (
          <div className="floating-card p-6 text-center">
            <BookOpen className="size-8 mx-auto text-muted-foreground/20 mb-2" />
            <p className="text-xs text-muted-foreground/40">Belum ada transaksi</p>
            <p className="text-[10px] text-muted-foreground/30 mt-1">Klik &quot;Catat Transaksi Baru&quot; untuk memulai</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {[...personalTransactions]
              .sort((a, b) => b.tanggal.localeCompare(a.tanggal) || b.id.localeCompare(a.id))
              .map((tx) => {
                const kat = getKategori(tx.kategori);
                const Ico = kat.icon;
                return (
                  <div key={tx.id}
                    className="floating-card p-3 flex items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
                  >
                    <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.tipe === "Pemasukan" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-500"
                    }`}>
                      {tx.tipe === "Pemasukan"
                        ? <ArrowDownRight className="size-4" />
                        : <ArrowUpRight className="size-4" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Ico className={`size-3.5 ${kat.warna} shrink-0`} />
                        <p className="text-xs font-medium truncate">{kat.label}</p>
                      </div>
                      {tx.catatan && <p className="text-[10px] text-muted-foreground/60 truncate">{tx.catatan}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-xs font-bold font-heading tabular-nums ${
                        tx.tipe === "Pemasukan" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"
                      }`}>
                        {tx.tipe === "Pemasukan" ? "+" : "-"}{formatRupiah(tx.nominal)}
                      </p>
                      <p className="text-[9px] text-muted-foreground/40">
                        {new Date(tx.tanggal + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <button onClick={() => { removePersonalTransaction(tx.id); toast.success("Transaksi dihapus"); }}
                      className="size-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 text-muted-foreground/40 hover:text-rose-500 transition-all">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* ─── FORM TRANSAKSI ─── */}
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
              <button onClick={() => setFormOpen(false)}
                className="size-8 rounded-xl flex items-center justify-center hover:bg-muted/50 transition-colors">
                <X className="size-4 text-muted-foreground" />
              </button>
            </div>
            <form onSubmit={handleCatat} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Tanggal</label>
                <input type="date" value={fTanggal} onChange={(e) => setFTanggal(e.target.value)} className="input-premium w-full text-xs" />
              </div>
              <div className="flex gap-2">
                {(["Pengeluaran", "Pemasukan"] as const).map((t) => (
                  <button key={t} type="button" onClick={() => setFTipe(t)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      fTipe === t
                        ? t === "Pemasukan"
                          ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                          : "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                        : "bg-muted/40 text-muted-foreground/60 hover:bg-muted/60"
                    }`}>
                    {t}
                  </button>
                ))}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Nominal</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/50 font-medium">Rp</span>
                  <input type="text" inputMode="numeric" value={fNominal}
                    onChange={(e) => setFNominal(e.target.value.replace(/\D/g, ""))}
                    placeholder="0" className="input-premium w-full text-xs pl-9 tabular-nums" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Kategori</label>
                <div className="grid grid-cols-4 gap-2">
                  {KATEGORI.map((kat) => {
                    const Ico = kat.icon;
                    const aktif = fKategori === kat.id;
                    return (
                      <button key={kat.id} type="button" onClick={() => setFKategori(kat.id)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${
                          aktif ? "border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20" : "border-transparent bg-muted/20 hover:bg-muted/40"
                        }`}>
                        <Ico className={`size-4 ${kat.warna}`} />
                        <span className={`text-[8px] font-medium ${aktif ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground/50"}`}>{kat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              {fTipe === "Pemasukan" && savingsGoals.length > 0 && (
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Alokasi ke Goal (opsional)</label>
                  <select value={fGoalId} onChange={(e) => setFGoalId(e.target.value)} className="input-premium w-full text-xs">
                    <option value="">Tanpa alokasi</option>
                    {savingsGoals.map((g) => (
                      <option key={g.id} value={g.id}>{g.nama} — sisa {formatRupiah(Math.max(g.targetNominal - g.terkumpul, 0))}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Catatan</label>
                <input type="text" value={fCatatan} onChange={(e) => setFCatatan(e.target.value)}
                  placeholder="cth: Makan siang" className="input-premium w-full text-xs" maxLength={120} />
              </div>
              <button type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all">
                {fTipe === "Pemasukan" ? "Catat Pemasukan" : "Catat Pengeluaran"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── EXPORT ─── */}
      <div className="floating-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/20">
            <Download className="size-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold">Ekspor Laporan</p>
            <p className="text-[10px] text-muted-foreground/60">CSV / PDF — seluruh riwayat</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white text-[10px] font-semibold shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5">
            <Download className="size-3.5" /> CSV
          </button>
          <button onClick={exportPDF}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-[10px] font-semibold shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5">
            <FileDown className="size-3.5" /> PDF
          </button>
        </div>
      </div>
    </div>
  );
}
