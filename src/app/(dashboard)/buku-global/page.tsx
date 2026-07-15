"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db, BOOK_LABELS, BRANCH_SLUGS, type BookOrBranch, type DbTransaction } from "@/lib/db-v4";
import { TrendingUp, Wallet, AlertCircle, Settings, Globe, ChevronRight, Activity, PieChartIcon, DollarSign, Lock, FileSpreadsheet } from "lucide-react";
import { PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

function formatRupiah(n: number) { return `Rp ${n.toLocaleString("id-ID")}`; }
function shortRupiah(n: number) {
  if (n >= 1_000_000_000) return `Rp${(n / 1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000) return `Rp${(n / 1_000_000).toFixed(1)}JT`;
  if (n >= 1_000) return `Rp${(n / 1_000).toFixed(0)}RB`;
  return `Rp${n}`;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 11) return "Selamat Pagi";
  if (h < 15) return "Selamat Siang";
  if (h < 18) return "Selamat Sore";
  return "Selamat Malam";
}

const COLORS = ["#7B61FF", "#FF5C00", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];
const TARGET_OMZET = 100_000_000;

export default function BukuGlobalPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [pinVerified, setPinVerified] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [loading, setLoading] = useState(true);

  const [data, setData] = useState({
    totalKekayaan: 0,
    omzetBulanIni: 0,
    labaBersih: 0,
    totalPiutang: 0,
    perCabang: {} as Record<string, number>,
    recentTransactions: [] as DbTransaction[],
    cashflowTrend: [] as { bulan: string; pemasukan: number; pengeluaran: number }[],
    piutangActive: 0,
    totalPengeluaran: 0,
  });

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || !pinVerified) return;
    (async () => {
      setLoading(true);
      try {
        const allWallets = await db.wallets.where("isActive").equals(1).toArray();
        const totalKekayaan = allWallets.reduce((s, w) => s + w.saldo, 0);

        const allTrans = await db.transactions.toArray();
        const bulanIni = new Date().toISOString().slice(0, 7);
        const omzetBulanIni = allTrans
          .filter((t) => t.tanggal?.startsWith(bulanIni) && t.status !== "BATAL")
          .reduce((s, t) => s + t.totalBruto, 0);

        const piutangAktif = await db.piutang.where("status").equals("AKTIF").toArray();
        const totalPiutang = piutangAktif.reduce((s, p) => s + p.sisaPiutang, 0);

        const perCabang: Record<string, number> = {};
        for (const slug of BRANCH_SLUGS) {
          const branchTrans = allTrans.filter((t) => t.bookOrBranchId === slug && t.tanggal?.startsWith(bulanIni) && t.status !== "BATAL");
          perCabang[slug] = branchTrans.reduce((s, t) => s + t.totalBruto, 0);
        }

        const recent = allTrans
          .filter((t) => t.status !== "BATAL")
          .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
          .slice(0, 5);

        const cashflows = await db.cashflows.toArray();
        const cashflowBulanIni = cashflows.filter((c) => c.createdAt?.startsWith(bulanIni));
        const pengeluaranBulanIni = cashflowBulanIni.filter((c) => c.tipe === "keluar").reduce((s, c) => s + c.nominal, 0);
        const labaBersih = omzetBulanIni - pengeluaranBulanIni;

        const cashflowTrend: { bulan: string; pemasukan: number; pengeluaran: number }[] = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          const monthFlow = cashflows.filter((c) => c.createdAt?.startsWith(key));
          cashflowTrend.push({
            bulan: key.slice(5),
            pemasukan: monthFlow.filter((c) => c.tipe === "masuk").reduce((s, c) => s + c.nominal, 0),
            pengeluaran: monthFlow.filter((c) => c.tipe === "keluar").reduce((s, c) => s + c.nominal, 0),
          });
        }

        setData({ totalKekayaan, omzetBulanIni, labaBersih, totalPiutang, perCabang, recentTransactions: recent, cashflowTrend, piutangActive: totalPiutang, totalPengeluaran: pengeluaranBulanIni });
      } catch { /* silent */ }
      setLoading(false);
    })();
  }, [mounted, pinVerified]);

  const handleVerifyPin = () => {
    if (pinInput === "123456") { setPinVerified(true); setPinError(false); }
    else setPinError(true);
  };

  if (!mounted) return <div className="space-y-4 animate-pulse"><div className="h-8 w-48 rounded-lg bg-slate-200 dark:bg-slate-800/50" /><div className="grid grid-cols-2 gap-3">{[1, 2, 3, 4].map((i) => <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800/30" />)}</div></div>;

  if (!pinVerified) {
    return (
      <div className="max-w-sm mx-auto pt-20 space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="size-16 rounded-2xl bg-gradient-to-r from-[#7B61FF] to-[#FF5C00] flex items-center justify-center mx-auto shadow-lg shadow-[#7B61FF]/20">
            <Globe className="size-8 text-white" />
          </div>
          <h1 className="text-lg font-bold font-heading">Buku Global</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Konsolidasi seluruh cabang usaha</p>
        </div>
        <div className="premium-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="size-4 text-[#FF5C00]" />
            <p className="text-sm font-semibold">Masukkan PIN Master</p>
          </div>
          <input type="password" inputMode="numeric" value={pinInput}
            onChange={(e) => { setPinInput(e.target.value.replace(/\D/g, "").slice(0, 6)); setPinError(false); }}
            onKeyDown={(e) => e.key === "Enter" && handleVerifyPin()}
            placeholder="******" className="input-premium w-full text-center text-lg tracking-[0.5em] tabular-nums" maxLength={6} />
          {pinError && <p className="text-[10px] text-red-400 text-center">PIN salah. Coba lagi.</p>}
          <button onClick={handleVerifyPin} disabled={pinInput.length < 4}
            className="btn-gradient w-full">
            <Lock className="size-4" /> Buka Dashboard Global
          </button>
        </div>
      </div>
    );
  }

  const pieData = BRANCH_SLUGS.filter((s) => (data.perCabang[s] || 0) > 0).map((s) => ({
    name: BOOK_LABELS[s] || s,
    value: data.perCabang[s] || 0,
  }));
  const totalOmzet = pieData.reduce((s, d) => s + d.value, 0);

  const progressPercent = Math.min(Math.round((data.omzetBulanIni / TARGET_OMZET) * 100), 100);
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  if (loading) return <div className="space-y-4 animate-pulse"><div className="h-8 w-48 rounded-lg bg-slate-200 dark:bg-slate-800/50" /><div className="grid grid-cols-2 gap-3">{[1, 2, 3, 4].map((i) => <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800/30" />)}</div></div>;

  return (
    <div className="space-y-5 pb-4 animate-fade-in">
      {/* Hero Banner with Greeting */}
      <div className="premium-card p-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#7B61FF]/5 via-[#FF5C00]/3 to-transparent pointer-events-none" />
        <div className="relative flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-bold font-heading text-slate-900 dark:text-slate-50">{getGreeting()}, Owner</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
              Berikut adalah ringkasan performa konsolidasi dari seluruh cabang Anda hari ini.
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/60 dark:border-emerald-800/40">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400">DB Secured</span>
          </div>
        </div>
      </div>

      {/* Circular Progress + Stat Cards Row */}
      <div className="grid grid-cols-3 gap-3">
        {/* Circular Progress Ring */}
        <div className="premium-card col-span-1 p-4 flex flex-col items-center justify-center">
          <div className="relative size-32">
            <svg className="size-32 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#e2e8f0" strokeWidth="8" className="dark:stroke-slate-700" />
              <circle cx="60" cy="60" r="54" fill="none" stroke="url(#progressGradient)" strokeWidth="8"
                strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                style={{ transition: "stroke-dashoffset 1s ease-out" }} />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#7B61FF" />
                  <stop offset="100%" stopColor="#FF5C00" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold font-heading gradient-text">{progressPercent}%</span>
              <span className="text-[9px] text-slate-500 dark:text-slate-400">Target</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 text-center">
            {shortRupiah(data.omzetBulanIni)} / {shortRupiah(TARGET_OMZET)}
          </p>
        </div>

        {/* Compact Stat Cards */}
        <div className="col-span-2 grid grid-cols-2 gap-2">
          <div className="premium-stat !p-3">
            <div className="size-7 rounded-lg bg-gradient-to-r from-[#7B61FF]/10 to-[#7B61FF]/5 flex items-center justify-center mb-1.5">
              <Wallet className="size-3.5 text-[#7B61FF]" />
            </div>
            <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">Kekayaan Bersih</p>
            <p className="text-base font-bold font-heading tabular-nums text-[#7B61FF]">{shortRupiah(data.totalKekayaan)}</p>
          </div>
          <div className="premium-stat !p-3">
            <div className="size-7 rounded-lg bg-gradient-to-r from-[#FF5C00]/10 to-[#FF5C00]/5 flex items-center justify-center mb-1.5">
              <TrendingUp className="size-3.5 text-[#FF5C00]" />
            </div>
            <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">Omzet Bulan Ini</p>
            <p className="text-base font-bold font-heading tabular-nums text-[#FF5C00]">{shortRupiah(data.omzetBulanIni)}</p>
          </div>
          <div className="premium-stat !p-3">
            <div className="size-7 rounded-lg bg-gradient-to-r from-violet-500/10 to-fuchsia-500/5 flex items-center justify-center mb-1.5">
              <DollarSign className="size-3.5 text-violet-500" />
            </div>
            <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">Laba Bersih</p>
            <p className={`text-base font-bold font-heading tabular-nums ${data.labaBersih >= 0 ? "text-emerald-500" : "text-red-500"}`}>{shortRupiah(data.labaBersih)}</p>
          </div>
          <div className="premium-stat !p-3">
            <div className="size-7 rounded-lg bg-gradient-to-r from-rose-500/10 to-rose-500/5 flex items-center justify-center mb-1.5">
              <AlertCircle className="size-3.5 text-rose-500" />
            </div>
            <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">Piutang Aktif</p>
            <p className="text-base font-bold font-heading tabular-nums text-rose-500">{shortRupiah(data.totalPiutang)}</p>
          </div>
        </div>
      </div>

      {/* Pie Chart - Kontribusi Pendapatan */}
      {pieData.length > 0 && (
        <div className="premium-card p-4 space-y-3">
          <p className="text-sm font-semibold flex items-center gap-1.5">
            <PieChartIcon className="size-4 text-[#7B61FF]" /> Kontribusi Pendapatan per Cabang
          </p>
          <div className="flex items-center gap-4">
            <div className="w-28 h-28 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={28} outerRadius={42} paddingAngle={3} dataKey="value">
                    {pieData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => formatRupiah(Number(v) || 0)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1.5">
              {pieData.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="truncate text-slate-600 dark:text-slate-400">{d.name}</span>
                  </div>
                  <span className="tabular-nums font-semibold text-slate-800 dark:text-slate-200 ml-2">{totalOmzet > 0 ? `${Math.round((d.value / totalOmzet) * 100)}%` : "0%"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Area Chart - Arus Kas Global */}
      {data.cashflowTrend.length > 0 && (
        <div className="premium-card p-4 space-y-3">
          <p className="text-sm font-semibold flex items-center gap-1.5">
            <Activity className="size-4 text-[#7B61FF]" /> Arus Kas Global (6 Bulan)
          </p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.cashflowTrend}>
                <defs>
                  <linearGradient id="colorPemasukan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7B61FF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7B61FF" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPengeluaran" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF5C00" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#FF5C00" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-20" />
                <XAxis dataKey="bulan" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: any) => formatRupiah(Number(v) || 0)} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Area type="monotone" dataKey="pemasukan" stroke="#7B61FF" strokeWidth={2.5} fill="url(#colorPemasukan)" dot={false} />
                <Area type="monotone" dataKey="pengeluaran" stroke="#FF5C00" strokeWidth={2.5} fill="url(#colorPengeluaran)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Activity Feed */}
      <div className="premium-card p-4 space-y-3">
        <p className="text-sm font-semibold flex items-center gap-1.5">
          <Activity className="size-4 text-[#7B61FF]" /> Transaksi Terbaru
        </p>
        {data.recentTransactions.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <div className="size-12 rounded-2xl bg-slate-100 dark:bg-slate-800/40 flex items-center justify-center mx-auto">
              <Activity className="size-5 text-slate-400" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Belum ada transaksi</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">Mulai transaksi dari halaman kasir cabang</p>
          </div>
        ) : (
          <div className="space-y-1">
            {data.recentTransactions.map((tx, i) => (
              <div key={tx.id || i} className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/40">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-[#7B61FF]" />
                    <p className="font-semibold truncate">{tx.invoiceNumber}</p>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {tx.customerNama || "Walk-in"} <span className="text-slate-300 dark:text-slate-600">•</span> {BOOK_LABELS[tx.bookOrBranchId as BookOrBranch] || tx.bookOrBranchId}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{formatRupiah(tx.totalBruto)}</p>
                  <p className="text-[9px] text-slate-400">{tx.tanggal?.slice(0, 10)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => router.push("/buku-global/laporan")}
          className="premium-card p-4 flex items-center gap-3 hover:shadow-md transition-all active:scale-[0.97] group">
          <div className="size-10 rounded-xl bg-gradient-to-r from-[#7B61FF] to-violet-600 flex items-center justify-center">
            <FileSpreadsheet className="size-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold group-hover:text-[#7B61FF] transition-colors">Laporan Laba Rugi</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Gabungan semua cabang</p>
          </div>
          <ChevronRight className="size-4 text-slate-300 dark:text-slate-600" />
        </button>
        <button onClick={() => router.push("/buku-global/pengaturan")}
          className="premium-card p-4 flex items-center gap-3 hover:shadow-md transition-all active:scale-[0.97] group">
          <div className="size-10 rounded-xl bg-gradient-to-r from-[#FF5C00] to-orange-600 flex items-center justify-center">
            <Settings className="size-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold group-hover:text-[#FF5C00] transition-colors">Pengaturan</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Backup, Restore & Keamanan</p>
          </div>
          <ChevronRight className="size-4 text-slate-300 dark:text-slate-600" />
        </button>
      </div>
    </div>
  );
}
