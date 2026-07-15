"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db, BOOK_LABELS, BRANCH_SLUGS, type BookOrBranch } from "@/lib/db-v4";
import {
  Wallet, BookUser, Briefcase, HeartHandshake,
  BookOpen, ArrowRight, Building2, ArrowRightLeft, Bot,
  TrendingUp, Users, AlertCircle, Receipt, LayoutDashboard,
} from "lucide-react";
import StockAlert from "@/components/stock-alert";

interface BookCard {
  id: string;
  label: string;
  desc: string;
  icon: React.ElementType;
  gradient: string;
  route: string;
  key: string;
}

const BOOKS: BookCard[] = [
  { id: "buku-pribadi", label: "Buku Pribadi", desc: "Keuangan pribadi & tabungan", icon: BookUser, gradient: "from-[#7B61FF] to-violet-600", route: "/buku-pribadi", key: "pribadi" },
  { id: "buku-keluarga", label: "Buku Keluarga", desc: "Keuangan keluarga", icon: Building2, gradient: "from-blue-500 to-cyan-600", route: "/buku-keluarga", key: "keluarga" },
  { id: "buku-usaha", label: "Buku Usaha", desc: "7 cabang: Percetakan, Laptop, Gadget, Warkop, Kelontong, Konveksi, Pakaian", icon: Briefcase, gradient: "from-[#FF5C00] to-orange-600", route: "/buku-usaha", key: "usaha" },
  { id: "buku-sedekah", label: "Buku Sedekah", desc: "Zakat, infak, sedekah", icon: HeartHandshake, gradient: "from-emerald-500 to-teal-600", route: "", key: "sedekah" },
  { id: "buku-catatan", label: "Catatan Lainnya", desc: "Hutang/piutang, memo digital", icon: BookOpen, gradient: "from-amber-500 to-orange-600", route: "", key: "catatan" },
];

function todayDate() { return new Date().toISOString().slice(0, 10); }
function weekAgo() { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().slice(0, 10); }
function monthAgo() { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 10); }
function formatRupiah(n: number) { return `Rp ${n.toLocaleString("id-ID")}`; }
function shortRupiah(n: number) {
  if (n >= 1_000_000_000) return `Rp${(n / 1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000) return `Rp${(n / 1_000_000).toFixed(1)}JT`;
  if (n >= 1_000) return `Rp${(n / 1_000).toFixed(0)}RB`;
  return `Rp${n}`;
}

export default function BukuKeuanganGlobal() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [saldoPerBuku, setSaldoPerBuku] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [omsetToday, setOmsetToday] = useState(0);
  const [omsetWeek, setOmsetWeek] = useState(0);
  const [omsetMonth, setOmsetMonth] = useState(0);
  const [piutangAktif, setPiutangAktif] = useState(0);
  const [totalPelanggan, setTotalPelanggan] = useState(0);
  const [topTransactions, setTopTransactions] = useState<{ invoiceNumber: string; totalBruto: number; customerNama: string; bookOrBranchId: string }[]>([]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    (async () => {
      try {
        const allWallets = await db.wallets.where("isActive").equals(1).toArray();
        const grouped: Record<string, number> = {};
        for (const w of allWallets) grouped[w.bookOrBranchId] = (grouped[w.bookOrBranchId] ?? 0) + w.saldo;
        let usahaTotal = 0;
        for (const slug of BRANCH_SLUGS) usahaTotal += grouped[slug] ?? 0;
        grouped["usaha"] = (grouped["usaha"] ?? 0) + usahaTotal;
        setSaldoPerBuku(grouped);

        const allTrans = await db.transactions.toArray();
        const today = todayDate(), w = weekAgo(), m = monthAgo();
        let tDay = 0, tWeek = 0, tMonth = 0;
        for (const tx of allTrans) {
          const d = tx.tanggal.slice(0, 10);
          if (d === today) tDay += tx.totalBruto;
          if (d >= w) tWeek += tx.totalBruto;
          if (d >= m) tMonth += tx.totalBruto;
        }
        setOmsetToday(tDay);
        setOmsetWeek(tWeek);
        setOmsetMonth(tMonth);

        const piutang = await db.piutang.where("status").equals("AKTIF").toArray();
        setPiutangAktif(piutang.reduce((s, p) => s + p.sisaPiutang, 0));

        const customers = await db.customers.toArray();
        setTotalPelanggan(customers.length);

        const sorted = allTrans.sort((a, b) => b.totalBruto - a.totalBruto).slice(0, 5);
        setTopTransactions(sorted.map((t) => ({ invoiceNumber: t.invoiceNumber, totalBruto: t.totalBruto, customerNama: t.customerNama, bookOrBranchId: t.bookOrBranchId })));
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, [mounted]);

  if (!mounted || loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded-lg bg-slate-200 dark:bg-slate-800/50" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800/30" />)}
        </div>
      </div>
    );
  }

  const totalKekayaan = Object.values(saldoPerBuku).reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-5 pb-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-gradient-to-r from-[#7B61FF] to-[#FF5C00] flex items-center justify-center text-white font-bold text-sm shadow-lg">
          <LayoutDashboard className="size-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold font-heading">Dashboard Eksekutif</h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">Ringkasan seluruh lini bisnis & keuangan</p>
        </div>
      </div>

      <StockAlert />

      {/* Total Kekayaan */}
      <div className="premium-card p-5">
        <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Total Kekayaan Bersih</p>
        <p className="text-2xl font-bold font-heading tabular-nums mt-1 gradient-text">
          {formatRupiah(totalKekayaan)}
        </p>
        <div className="flex gap-2 mt-3 flex-wrap">
          {Object.entries(saldoPerBuku).map(([key, saldo]) => {
            if (key === "usaha" || BRANCH_SLUGS.includes(key as BookOrBranch)) return null;
            return (
              <div key={key} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-[9px]">
                <Wallet className="size-3 text-[#7B61FF]/60" />
                <span className="font-medium text-slate-600 dark:text-slate-400">{BOOK_LABELS[key as BookOrBranch] ?? key}</span>
                <span className="tabular-nums font-semibold text-slate-800 dark:text-slate-200">{shortRupiah(saldo)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="premium-stat">
          <div className="size-8 rounded-lg bg-gradient-to-r from-[#7B61FF]/10 to-[#7B61FF]/5 flex items-center justify-center mb-2">
            <TrendingUp className="size-4 text-[#7B61FF]" />
          </div>
          <p className="premium-stat-label">Omset Hari Ini</p>
          <p className="premium-stat-value text-[#7B61FF]">{shortRupiah(omsetToday)}</p>
        </div>
        <div className="premium-stat">
          <div className="size-8 rounded-lg bg-gradient-to-r from-[#FF5C00]/10 to-[#FF5C00]/5 flex items-center justify-center mb-2">
            <TrendingUp className="size-4 text-[#FF5C00]" />
          </div>
          <p className="premium-stat-label">Omset Minggu Ini</p>
          <p className="premium-stat-value text-[#FF5C00]">{shortRupiah(omsetWeek)}</p>
        </div>
        <div className="premium-stat">
          <div className="size-8 rounded-lg bg-gradient-to-r from-violet-500/10 to-fuchsia-500/5 flex items-center justify-center mb-2">
            <TrendingUp className="size-4 text-violet-500" />
          </div>
          <p className="premium-stat-label">Omset Bulan Ini</p>
          <p className="premium-stat-value text-violet-500">{shortRupiah(omsetMonth)}</p>
        </div>
        <div className="premium-stat">
          <div className="size-8 rounded-lg bg-gradient-to-r from-rose-500/10 to-red-500/5 flex items-center justify-center mb-2">
            <AlertCircle className="size-4 text-rose-500" />
          </div>
          <p className="premium-stat-label">Piutang Aktif</p>
          <p className="premium-stat-value text-rose-500">{shortRupiah(piutangAktif)}</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="premium-stat">
          <div className="size-8 rounded-lg bg-gradient-to-r from-indigo-500/10 to-blue-500/5 flex items-center justify-center mb-2">
            <Users className="size-4 text-indigo-500" />
          </div>
          <p className="premium-stat-label">Total Pelanggan</p>
          <p className="premium-stat-value text-indigo-500">{totalPelanggan}</p>
        </div>
        <div className="premium-stat">
          <div className="size-8 rounded-lg bg-gradient-to-r from-amber-500/10 to-yellow-500/5 flex items-center justify-center mb-2">
            <Receipt className="size-4 text-amber-500" />
          </div>
          <p className="premium-stat-label">Total Cabang Usaha</p>
          <p className="premium-stat-value text-amber-500">{BRANCH_SLUGS.length}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => router.push("/mutasi-antar-buku")}
          className="premium-card p-4 flex items-center gap-3 active:scale-[0.97] transition-all text-left group">
          <div className="size-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
            <ArrowRightLeft className="size-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold group-hover:text-[#FF5C00] transition-colors">Mutasi Antar-Buku</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Pindahkan dana antar buku/bisnis</p>
          </div>
        </button>
        <button onClick={() => router.push("/asisten-ai")}
          className="premium-card p-4 flex items-center gap-3 active:scale-[0.97] transition-all text-left group">
          <div className="size-10 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 flex items-center justify-center shadow-md">
            <Bot className="size-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold group-hover:text-[#7B61FF] transition-colors">Tanya AI</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Analisis keuangan dengan AI</p>
          </div>
        </button>
      </div>

      {/* Top 5 Transaksi */}
      {topTransactions.length > 0 && (
        <div className="premium-card p-4 space-y-3">
          <p className="text-sm font-semibold flex items-center gap-1.5">
            <TrendingUp className="size-4 text-[#7B61FF]" /> 5 Transaksi Terbesar
          </p>
          {topTransactions.map((tx, i) => {
            const label = BOOK_LABELS[tx.bookOrBranchId as BookOrBranch] ?? tx.bookOrBranchId;
            return (
              <div key={i} className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/40">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="size-6 rounded-full bg-gradient-to-r from-[#7B61FF]/10 to-[#FF5C00]/10 flex items-center justify-center text-[10px] font-bold text-[#7B61FF] shrink-0">{i + 1}</span>
                  <div className="min-w-0">
                    <p className="font-semibold truncate text-slate-700 dark:text-slate-300">{tx.invoiceNumber} — {tx.customerNama || "Walk-in"}</p>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400">{label}</p>
                  </div>
                </div>
                <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400 shrink-0 ml-2">{formatRupiah(tx.totalBruto)}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Buku Cards */}
      <div className="grid grid-cols-2 gap-3">
        {BOOKS.map((b) => {
          const Icon = b.icon;
          return (
            <button key={b.id} onClick={() => b.route && router.push(b.route)} disabled={!b.route}
              className="premium-card p-4 text-left active:scale-[0.97] transition-all disabled:opacity-50 group">
              <div className={`size-10 rounded-xl bg-gradient-to-r ${b.gradient} flex items-center justify-center mb-3 shadow-md`}>
                <Icon className="size-5 text-white" />
              </div>
              <h3 className="text-sm font-bold font-heading text-slate-800 dark:text-slate-200 mb-0.5">{b.label}</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{b.desc}</p>
              {saldoPerBuku[b.key] !== undefined && (
                <p className="text-xs font-semibold tabular-nums mt-2 text-emerald-600 dark:text-emerald-400">{formatRupiah(saldoPerBuku[b.key])}</p>
              )}
              {b.route && (
                <div className="absolute bottom-3 right-3 size-6 rounded-full bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center group-hover:bg-[#7B61FF]/10 transition-colors">
                  <ArrowRight className="size-3 text-slate-400 group-hover:text-[#7B61FF]" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
