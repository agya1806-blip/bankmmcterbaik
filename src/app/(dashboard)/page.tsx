"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { db, BOOK_LABELS, BRANCH_SLUGS, type BookOrBranch } from "@/lib/db-v4";
import { useSessionStore } from "@/store/useSessionStore";
import { getStorageEstimate, formatBytes } from "@/lib/storageStatus";
import {
  BookUser, Briefcase, HeartHandshake,
  BookOpen, ArrowRight, Building2, ArrowRightLeft, Bot,
  TrendingUp, Users, AlertCircle, Receipt,
  Database, Target, CircleDollarSign, ArrowUpRight, ArrowDownRight,
  Clock, Zap,
} from "lucide-react";
import StockAlert from "@/components/stock-alert";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar,
} from "recharts";

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
  { id: "buku-usaha", label: "Buku Usaha", desc: "7 cabang usaha aktif", icon: Briefcase, gradient: "from-[#FF5C00] to-orange-600", route: "/buku-usaha", key: "usaha" },
  { id: "buku-sedekah", label: "Buku Sedekah", desc: "Zakat, infak, sedekah", icon: HeartHandshake, gradient: "from-emerald-500 to-teal-600", route: "", key: "sedekah" },
  { id: "buku-catatan", label: "Catatan Lainnya", desc: "Hutang/piutang, memo digital", icon: BookOpen, gradient: "from-amber-500 to-orange-600", route: "", key: "catatan" },
];

const PIE_COLORS = ["#7B61FF", "#FF5C00", "#06B6D4", "#F59E0B", "#EC4899", "#10B981", "#6366F1"];

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

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Selamat Malam";
  if (h < 11) return "Selamat Pagi";
  if (h < 15) return "Selamat Siang";
  if (h < 18) return "Selamat Sore";
  return "Selamat Malam";
}

function getGreetingEmoji(): string {
  const h = new Date().getHours();
  if (h < 5) return "\uD83C\uDF19";
  if (h < 11) return "\u2600\uFE0F";
  if (h < 15) return "\u26C5";
  if (h < 18) return "\uD83C\uDF05";
  return "\uD83C\uDF19";
}

function monthKey(d: string) { return d.slice(0, 7); }

function monthName(mk: string) {
  const [y, m] = mk.split("-");
  const names = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  return `${names[parseInt(m, 10) - 1]} ${y.slice(2)}`;
}

export default function BukuKeuanganGlobal() {
  const router = useRouter();
  const user = useSessionStore((s) => s.currentUser);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  const [saldoPerBuku, setSaldoPerBuku] = useState<Record<string, number>>({});
  const [omsetToday, setOmsetToday] = useState(0);
  const [omsetWeek, setOmsetWeek] = useState(0);
  const [omsetMonth, setOmsetMonth] = useState(0);
  const [piutangAktif, setPiutangAktif] = useState(0);
  const [totalPelanggan, setTotalPelanggan] = useState(0);
  const [totalTransaksiCount, setTotalTransaksiCount] = useState(0);
  const [topTransactions, setTopTransactions] = useState<{ invoiceNumber: string; totalBruto: number; customerNama: string; bookOrBranchId: string }[]>([]);
  const [omsetPerBranch, setOmsetPerBranch] = useState<{ name: string; value: number }[]>([]);
  const [omsetMonthly, setOmsetMonthly] = useState<{ name: string; omset: number }[]>([]);
  const [dbStatus, setDbStatus] = useState<{ usage: number; quota: number; percentUsed: number; persisted: boolean }>({ usage: 0, quota: 0, percentUsed: 0, persisted: false });
  const [labaRugi, setLabaRugi] = useState<{ income: number; expense: number }>({ income: 0, expense: 0 });

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    (async () => {
      try {
        const storage = await getStorageEstimate();
        setDbStatus(storage);

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
        let totalIncome = 0, totalExpense = 0;
        const branchMap: Record<string, number> = {};
        const monthlyMap: Record<string, number> = {};

        for (const tx of allTrans) {
          const d = tx.tanggal.slice(0, 10);
          if (d === today) tDay += tx.totalBruto;
          if (d >= w) tWeek += tx.totalBruto;
          if (d >= m) tMonth += tx.totalBruto;

          totalIncome += tx.totalBruto;
          const mk = monthKey(d);
          monthlyMap[mk] = (monthlyMap[mk] ?? 0) + tx.totalBruto;

          const bSlug = tx.bookOrBranchId;
          if (BRANCH_SLUGS.includes(bSlug as BookOrBranch)) {
            branchMap[bSlug] = (branchMap[bSlug] ?? 0) + tx.totalBruto;
          }
        }

        setOmsetToday(tDay);
        setOmsetWeek(tWeek);
        setOmsetMonth(tMonth);
        setTotalTransaksiCount(allTrans.length);

        const expenses = await db.cashflows.where("tipe").equals("keluar").toArray();
        for (const e of expenses) totalExpense += e.nominal ?? 0;
        setLabaRugi({ income: totalIncome, expense: totalExpense });

        const branchPie = Object.entries(branchMap)
          .map(([name, value]) => ({ name: BOOK_LABELS[name as BookOrBranch] ?? name, value }))
          .filter((b) => b.value > 0)
          .sort((a, b) => b.value - a.value);
        setOmsetPerBranch(branchPie);

        const last6 = Object.keys(monthlyMap).sort().slice(-6);
        setOmsetMonthly(last6.map((mk) => ({ name: monthName(mk), omset: monthlyMap[mk] })));

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
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, [mounted]);

  const totalKekayaan = useMemo(() => Object.values(saldoPerBuku).reduce((s, v) => s + v, 0), [saldoPerBuku]);
  const labaBersih = labaRugi.income - labaRugi.expense;
  const labaMargin = labaRugi.income > 0 ? ((labaBersih / labaRugi.income) * 100) : 0;
  const goalTarget = 50_000_000;
  const goalPercent = Math.min(100, Math.round((omsetMonth / goalTarget) * 100));

  if (!mounted || loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800/50" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800/30" />)}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="h-48 rounded-2xl bg-slate-100 dark:bg-slate-800/30" />
          <div className="h-48 rounded-2xl bg-slate-100 dark:bg-slate-800/30" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-4 animate-fade-in">
      {/* ── Hero Banner ── */}
      <div className="hero-gradient p-5 sm:p-6">
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-white/70 text-xs font-medium mb-1">{getGreetingEmoji()} {getGreeting()}</p>
            <h1 className="text-xl sm:text-2xl font-bold text-white font-heading truncate">
              {user?.nama ?? "Pengguna"}
            </h1>
            <p className="text-white/60 text-xs mt-1">Ringkasan seluruh lini bisnis & keuangan</p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${dbStatus.persisted ? "bg-emerald-500/20 text-emerald-200" : "bg-amber-500/20 text-amber-200"}`}>
              <Database className="size-3" />
              {dbStatus.persisted ? "Tersimpan" : "Lokal"}
            </div>
          </div>
        </div>
        <div className="relative z-10 mt-4">
          <p className="text-white/50 text-[10px] uppercase tracking-wider font-semibold">Total Kekayaan Bersih</p>
          <p className="text-2xl sm:text-3xl font-bold text-white font-heading tabular-nums mt-0.5">
            {formatRupiah(totalKekayaan)}
          </p>
        </div>
        <div className="absolute -top-10 -right-10 size-40 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 size-32 rounded-full bg-black/10 blur-xl" />
      </div>

      {/* ── DB Status Bar ── */}
      <div className="premium-card p-3 flex items-center gap-3">
        <Database className="size-4 text-[#7B61FF]" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Penyimpanan</span>
            <span className="tabular-nums font-semibold text-slate-700 dark:text-slate-300">{formatBytes(dbStatus.usage)} / {formatBytes(dbStatus.quota)}</span>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-[#7B61FF] to-[#FF5C00] transition-all duration-500" style={{ width: `${Math.min(100, dbStatus.percentUsed)}%` }} />
          </div>
        </div>
        <span className="text-[10px] tabular-nums font-semibold text-slate-500 dark:text-slate-400 shrink-0">{dbStatus.percentUsed.toFixed(1)}%</span>
      </div>

      <StockAlert />

      {/* ── Metric Cards ── */}
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

      {/* ── Quick Stats Row ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="premium-stat">
          <div className="size-8 rounded-lg bg-gradient-to-r from-indigo-500/10 to-blue-500/5 flex items-center justify-center mb-2">
            <Users className="size-4 text-indigo-500" />
          </div>
          <p className="premium-stat-label">Pelanggan</p>
          <p className="premium-stat-value text-indigo-500">{totalPelanggan}</p>
        </div>
        <div className="premium-stat">
          <div className="size-8 rounded-lg bg-gradient-to-r from-amber-500/10 to-yellow-500/5 flex items-center justify-center mb-2">
            <Receipt className="size-4 text-amber-500" />
          </div>
          <p className="premium-stat-label">Total Transaksi</p>
          <p className="premium-stat-value text-amber-500">{totalTransaksiCount}</p>
        </div>
        <div className="premium-stat">
          <div className="size-8 rounded-lg bg-gradient-to-r from-emerald-500/10 to-teal-500/5 flex items-center justify-center mb-2">
            <CircleDollarSign className="size-4 text-emerald-500" />
          </div>
          <p className="premium-stat-label">Laba Bersih</p>
          <p className={`premium-stat-value ${labaBersih >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
            {labaBersih >= 0 ? "+" : ""}{shortRupiah(labaBersih)}
          </p>
        </div>
      </div>

      {/* ── Goal Tracker ── */}
      <div className="premium-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Target className="size-4 text-[#FF5C00]" />
          <p className="text-sm font-semibold">Target Bulanan</p>
        </div>
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-2xl font-bold font-heading tabular-nums gradient-text">{shortRupiah(omsetMonth)}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">dari target {shortRupiah(goalTarget)}</p>
          </div>
          <span className="text-2xl font-bold font-heading tabular-nums text-[#FF5C00]">{goalPercent}%</span>
        </div>
        <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#7B61FF] to-[#FF5C00] transition-all duration-700 ease-out"
            style={{ width: `${goalPercent}%` }}
          />
        </div>
        {goalPercent >= 100 && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-2 flex items-center gap-1">
            <Zap className="size-3" /> Target tercapai! Luar biasa!
          </p>
        )}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Pie Chart - Omset per Cabang */}
        <div className="premium-card p-4">
          <p className="text-sm font-semibold mb-3 flex items-center gap-1.5">
            <CircleDollarSign className="size-4 text-[#7B61FF]" /> Omset per Cabang
          </p>
          {omsetPerBranch.length > 0 ? (
            <div className="flex items-center gap-2">
              <ResponsiveContainer width="50%" height={160}>
                <PieChart>
                  <Pie data={omsetPerBranch} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value" stroke="none">
                    {omsetPerBranch.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5">
                {omsetPerBranch.slice(0, 5).map((b, i) => (
                  <div key={i} className="flex items-center gap-2 text-[10px]">
                    <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-slate-600 dark:text-slate-400 truncate flex-1">{b.name}</span>
                    <span className="tabular-nums font-semibold text-slate-800 dark:text-slate-200 shrink-0">{shortRupiah(b.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-xs text-slate-400">Belum ada data</div>
          )}
        </div>

        {/* Line Chart - Omset 6 Bulan */}
        <div className="premium-card p-4">
          <p className="text-sm font-semibold mb-3 flex items-center gap-1.5">
            <TrendingUp className="size-4 text-[#FF5C00]" /> Omset 6 Bulan
          </p>
          {omsetMonthly.length > 1 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={omsetMonthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => shortRupiah(v)} width={50} />
                <Tooltip formatter={(v: unknown) => [formatRupiah(Number(v)), "Omset"]} contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }} />
                <Line type="monotone" dataKey="omset" stroke="#7B61FF" strokeWidth={2.5} dot={{ fill: "#7B61FF", r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: "#FF5C00" }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-xs text-slate-400">Butuh minimal 2 bulan data</div>
          )}
        </div>
      </div>

      {/* ── Bar Chart - Top 5 Transaksi ── */}
      {topTransactions.length > 0 && (
        <div className="premium-card p-4">
          <p className="text-sm font-semibold mb-3 flex items-center gap-1.5">
            <TrendingUp className="size-4 text-emerald-500" /> 5 Transaksi Terbesar
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topTransactions.map((t) => ({ name: `${t.invoiceNumber.slice(-6)}`, amount: t.totalBruto, customer: t.customerNama || "Walk-in" }))} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => shortRupiah(v)} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={55} />
              <Tooltip formatter={(v: unknown) => [formatRupiah(Number(v)), "Total"]} contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }} />
              <Bar dataKey="amount" radius={[0, 6, 6, 0]} maxBarSize={24}>
                {topTransactions.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1.5">
            {topTransactions.map((tx, i) => {
              const label = BOOK_LABELS[tx.bookOrBranchId as BookOrBranch] ?? tx.bookOrBranchId;
              return (
                <div key={i} className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/40">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="size-5 rounded-full bg-gradient-to-r from-[#7B61FF]/10 to-[#FF5C00]/10 flex items-center justify-center text-[9px] font-bold text-[#7B61FF] shrink-0">{i + 1}</span>
                    <div className="min-w-0">
                      <p className="font-semibold truncate text-slate-700 dark:text-slate-300">{tx.customerNama || "Walk-in"}</p>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400">{tx.invoiceNumber} &middot; {label}</p>
                    </div>
                  </div>
                  <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400 shrink-0 ml-2">{formatRupiah(tx.totalBruto)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Laba Rugi Table ── */}
      <div className="premium-card p-4">
        <p className="text-sm font-semibold mb-3 flex items-center gap-1.5">
          <CircleDollarSign className="size-4 text-emerald-500" /> Laba Rugi (Kumulatif)
        </p>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/20">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="size-4 text-emerald-500" />
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Total Pendapatan</span>
            </div>
            <span className="text-xs font-bold tabular-nums text-emerald-700 dark:text-emerald-300">{formatRupiah(labaRugi.income)}</span>
          </div>
          <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800/20">
            <div className="flex items-center gap-2">
              <ArrowDownRight className="size-4 text-rose-500" />
              <span className="text-xs font-medium text-rose-700 dark:text-rose-300">Total Pengeluaran</span>
            </div>
            <span className="text-xs font-bold tabular-nums text-rose-700 dark:text-rose-300">{formatRupiah(labaRugi.expense)}</span>
          </div>
          <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/40">
            <div className="flex items-center gap-2">
              <CircleDollarSign className="size-4 text-[#7B61FF]" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Laba Bersih</span>
            </div>
            <div className="text-right">
              <span className={`text-sm font-bold tabular-nums ${labaBersih >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                {labaBersih >= 0 ? "+" : ""}{formatRupiah(labaBersih)}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-2 tabular-nums">{labaMargin.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => router.push("/mutasi-antar-buku")}
          className="premium-card p-4 flex items-center gap-3 active:scale-[0.97] transition-all text-left group">
          <div className="size-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
            <ArrowRightLeft className="size-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold group-hover:text-[#FF5C00] transition-colors">Mutasi Antar-Buku</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Pindahkan dana antar buku</p>
          </div>
        </button>
        <button onClick={() => router.push("/asisten-ai")}
          className="premium-card p-4 flex items-center gap-3 active:scale-[0.97] transition-all text-left group">
          <div className="size-10 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 flex items-center justify-center shadow-md">
            <Bot className="size-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold group-hover:text-[#7B61FF] transition-colors">Tanya AI</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Analisis keuangan</p>
          </div>
        </button>
      </div>

      {/* ── Buku Cards ── */}
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

      {/* ── DB Status Footer ── */}
      <div className="premium-card p-3 flex items-center gap-3">
        <Clock className="size-4 text-slate-400" />
        <p className="text-[10px] text-slate-500 dark:text-slate-400 flex-1">
          {dbStatus.persisted ? "Data tersimpan secara persisten" : "Data disimpan di browser lokal"} &middot; {formatBytes(dbStatus.usage)} terpakai
        </p>
        <div className={`size-2 rounded-full ${dbStatus.persisted ? "bg-emerald-500" : "bg-amber-500"}`} />
      </div>
    </div>
  );
}
