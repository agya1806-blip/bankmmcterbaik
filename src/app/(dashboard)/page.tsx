"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db, BOOK_LABELS, BRANCH_SLUGS, type BookOrBranch } from "@/lib/db-v4";
import {
  Wallet, BookUser, Briefcase, HeartHandshake,
  BookOpen, ArrowRight, Building2, ArrowRightLeft, Bot,
  TrendingUp, Users, AlertCircle, Receipt,
} from "lucide-react";

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
  {
    id: "buku-pribadi", label: "Buku Pribadi", desc: "Keuangan pribadi & tabungan",
    icon: BookUser, gradient: "from-emerald-500 to-emerald-600",
    route: "/buku-pribadi", key: "pribadi",
  },
  {
    id: "buku-keluarga", label: "Buku Keluarga", desc: "Keuangan keluarga",
    icon: Building2, gradient: "from-blue-500 to-blue-600",
    route: "/buku-keluarga", key: "keluarga",
  },
  {
    id: "buku-usaha", label: "Buku Usaha", desc: "7 cabang: Percetakan, Gadget, Laptop, Warkop, Kelontong, Konveksi, Pakaian",
    icon: Briefcase, gradient: "from-violet-500 to-violet-600",
    route: "/buku-usaha", key: "usaha",
  },
  {
    id: "buku-sedekah", label: "Buku Sedekah", desc: "Zakat, infak, sedekah",
    icon: HeartHandshake, gradient: "from-emerald-500 to-teal-500",
    route: "", key: "sedekah",
  },
  {
    id: "buku-catatan", label: "Catatan Lainnya", desc: "Hutang/piutang, memo digital",
    icon: BookOpen, gradient: "from-amber-500 to-orange-500",
    route: "", key: "catatan",
  },
];

function todayDate() { return new Date().toISOString().slice(0, 10); }
function weekAgo() { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().slice(0, 10); }
function monthAgo() { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 10); }
function formatRupiah(n: number) { return `Rp ${n.toLocaleString("id-ID")}`; }

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
        for (const w of allWallets) {
          const key = w.bookOrBranchId;
          grouped[key] = (grouped[key] ?? 0) + w.saldo;
        }
        let usahaTotal = 0;
        for (const slug of BRANCH_SLUGS) {
          usahaTotal += grouped[slug] ?? 0;
        }
        grouped["usaha"] = (grouped["usaha"] ?? 0) + usahaTotal;
        setSaldoPerBuku(grouped);

        const allTrans = await db.transactions.toArray();
        const today = todayDate();
        const w = weekAgo();
        const m = monthAgo();

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
        setTopTransactions(sorted.map((t) => ({
          invoiceNumber: t.invoiceNumber,
          totalBruto: t.totalBruto,
          customerNama: t.customerNama,
          bookOrBranchId: t.bookOrBranchId,
        })));
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, [mounted]);

  if (!mounted || loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded-lg bg-slate-800/50" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-800/30" />
          ))}
        </div>
      </div>
    );
  }

  const totalKekayaan = Object.values(saldoPerBuku).reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-6 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-emerald-500/25">
          M
        </div>
        <div>
          <h1 className="text-lg font-bold font-heading">Dashboard Eksekutif</h1>
          <p className="text-xs text-slate-400">Ringkasan seluruh lini bisnis</p>
        </div>
      </div>

      {/* Total Kekayaan */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/60 p-5">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Total Kekayaan</p>
        <p className="text-3xl font-bold font-heading tabular-nums mt-1 text-emerald-400">
          {formatRupiah(totalKekayaan)}
        </p>
        <div className="flex gap-2 mt-3 flex-wrap">
          {Object.entries(saldoPerBuku).map(([key, saldo]) => {
            if (key === "usaha" || BRANCH_SLUGS.includes(key as BookOrBranch)) return null;
            return (
              <div key={key} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/50 text-[9px]">
                <Wallet className="size-3 text-emerald-400/60" />
                <span className="font-medium text-slate-300">{BOOK_LABELS[key as BookOrBranch] ?? key}</span>
                <span className="tabular-nums font-semibold text-slate-100">{formatRupiah(saldo)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl p-4 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20">
          <TrendingUp className="size-4 text-emerald-500 mb-2" />
          <p className="text-[10px] text-muted-foreground/60">Omset Hari Ini</p>
          <p className="text-sm font-bold font-heading tabular-nums text-emerald-400">{formatRupiah(omsetToday)}</p>
        </div>
        <div className="rounded-2xl p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
          <TrendingUp className="size-4 text-blue-500 mb-2" />
          <p className="text-[10px] text-muted-foreground/60">Omset Minggu Ini</p>
          <p className="text-sm font-bold font-heading tabular-nums text-blue-400">{formatRupiah(omsetWeek)}</p>
        </div>
        <div className="rounded-2xl p-4 bg-gradient-to-br from-violet-500/10 to-violet-500/5 border border-violet-500/20">
          <TrendingUp className="size-4 text-violet-500 mb-2" />
          <p className="text-[10px] text-muted-foreground/60">Omset Bulan Ini</p>
          <p className="text-sm font-bold font-heading tabular-nums text-violet-400">{formatRupiah(omsetMonth)}</p>
        </div>
        <div className="rounded-2xl p-4 bg-gradient-to-br from-rose-500/10 to-rose-500/5 border border-rose-500/20">
          <AlertCircle className="size-4 text-rose-500 mb-2" />
          <p className="text-[10px] text-muted-foreground/60">Piutang Aktif</p>
          <p className="text-sm font-bold font-heading tabular-nums text-rose-400">{formatRupiah(piutangAktif)}</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-4 bg-slate-900/80 border border-slate-800/60">
          <Users className="size-4 text-indigo-400 mb-2" />
          <p className="text-[10px] text-muted-foreground/60">Total Pelanggan</p>
          <p className="text-lg font-bold font-heading tabular-nums text-indigo-400">{totalPelanggan}</p>
        </div>
        <div className="rounded-2xl p-4 bg-slate-900/80 border border-slate-800/60">
          <Receipt className="size-4 text-amber-400 mb-2" />
          <p className="text-[10px] text-muted-foreground/60">Total Cabang Usaha</p>
          <p className="text-lg font-bold font-heading tabular-nums text-amber-400">{BRANCH_SLUGS.length}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => router.push("/mutasi-antar-buku")}
          className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 active:scale-[0.97] transition-all text-left"
        >
          <div className="size-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
            <ArrowRightLeft className="size-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold font-heading">Mutasi Antar-Buku</p>
            <p className="text-[10px] text-slate-400">Pindahkan dana antar buku/bisnis</p>
          </div>
        </button>
        <button onClick={() => router.push("/asisten-ai")}
          className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 active:scale-[0.97] transition-all text-left"
        >
          <div className="size-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Bot className="size-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold font-heading">Tanya AI</p>
            <p className="text-[10px] text-slate-400">Analisis keuangan dengan AI</p>
          </div>
        </button>
      </div>

      {/* Top 5 Transaksi */}
      {topTransactions.length > 0 && (
        <div className="rounded-2xl p-4 bg-slate-900/80 border border-slate-800/60 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-emerald-400" />
            <p className="text-xs font-bold font-heading">5 Transaksi Terbesar</p>
          </div>
          {topTransactions.map((tx, i) => {
            const label = BOOK_LABELS[tx.bookOrBranchId as BookOrBranch] ?? tx.bookOrBranchId;
            return (
              <div key={i} className="flex items-center justify-between text-[10px] py-1.5 border-b border-slate-800/40 last:border-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="size-5 rounded-full bg-slate-800 flex items-center justify-center text-[9px] font-bold text-slate-400 shrink-0">{i + 1}</span>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{tx.invoiceNumber} — {tx.customerNama || "Walk-in"}</p>
                    <p className="text-[9px] text-muted-foreground/50">{label}</p>
                  </div>
                </div>
                <span className="font-semibold tabular-nums text-emerald-400 shrink-0 ml-2">{formatRupiah(tx.totalBruto)}</span>
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
            <button
              key={b.id}
              onClick={() => b.route && router.push(b.route)}
              disabled={!b.route}
              className="relative overflow-hidden rounded-2xl p-4 text-left bg-slate-900/80 border border-slate-800/60 active:scale-[0.97] transition-all disabled:opacity-50"
            >
              <div className={`size-10 rounded-xl bg-gradient-to-br ${b.gradient} flex items-center justify-center mb-3 shadow-lg`}>
                <Icon className="size-5 text-white" />
              </div>
              <h3 className="text-sm font-bold font-heading mb-0.5">{b.label}</h3>
              <p className="text-[10px] text-slate-400 leading-tight">{b.desc}</p>
              {saldoPerBuku[b.key] !== undefined && (
                <p className="text-xs font-semibold tabular-nums mt-2 text-emerald-400">
                  {formatRupiah(saldoPerBuku[b.key])}
                </p>
              )}
              {b.route && (
                <div className="absolute bottom-3 right-3 size-6 rounded-full bg-slate-800/80 flex items-center justify-center">
                  <ArrowRight className="size-3 text-slate-400" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
