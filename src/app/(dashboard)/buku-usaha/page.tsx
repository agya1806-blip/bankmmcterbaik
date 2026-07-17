"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "@/hooks/useLiveQuery";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { format, subDays, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { db, type BookOrBranch } from "@/lib/db-v4";
import { useSessionStore } from "@/store/useSessionStore";
import {
  Bell, Settings, Wallet, TrendingUp, TrendingDown, ShoppingCart,
  Clock, BarChart3, BookOpen, User, Home, Building2, ChevronRight,
} from "lucide-react";

interface BookCard {
  slug: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  route: string;
}

const MAIN_BOOKS: BookCard[] = [
  { slug: "global", label: "Buku Global", desc: "Ringkasan semua data", icon: <BarChart3 className="w-5 h-5 text-white" />, color: "from-[#008CEB] to-[#00C9A7]", route: "/buku-global" },
  { slug: "pribadi", label: "Buku Pribadi", desc: "Keuangan pribadi", icon: <User className="w-5 h-5 text-white" />, color: "from-slate-500 to-slate-600", route: "/buku-pribadi" },
  { slug: "keluarga", label: "Buku Keluarga", desc: "Keuangan keluarga", icon: <Home className="w-5 h-5 text-white" />, color: "from-rose-400 to-rose-500", route: "/buku-keluarga" },
  { slug: "usaha", label: "Buku Usaha", desc: "Unit usaha & bisnis", icon: <Building2 className="w-5 h-5 text-white" />, color: "from-amber-400 to-orange-500", route: "/buku-usaha/usaha" },
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 18) return "Selamat sore";
  return "Selamat malam";
}

function MiniCashflowTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0F1926]/95 border border-slate-700/60 rounded-xl px-3 py-2 shadow-xl">
      <p className="text-[9px] text-slate-400 font-bold mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-[10px] font-bold" style={{ color: p.color }}>
          {p.name}: Rp{Number(p.value).toLocaleString()}
        </p>
      ))}
    </div>
  );
}

export default function BukuUsahaPage() {
  const router = useRouter();
  const { currentUser } = useSessionStore();
  const [showNotif, setShowNotif] = useState(false);

  const allTransactions = useLiveQuery(() => db.transactions.toArray()) || [];
  const allCashflows = useLiveQuery(() => db.cashflows.toArray()) || [];
  const allWallets = useLiveQuery(() => db.wallets.toArray()) || [];
  const allPiutang = useLiveQuery(() => db.piutang.toArray()) || [];

  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const totalSaldo = allWallets.reduce((s, w) => s + w.saldo, 0);
    const cashflowMasuk = allCashflows.filter((c) => c.tipe === "masuk").reduce((s, c) => s + c.nominal, 0);
    const cashflowKeluar = allCashflows.filter((c) => c.tipe === "keluar").reduce((s, c) => s + c.nominal, 0);
    const piutangAktif = allTransactions.filter((tx) => tx.sisaTagihan > 0).reduce((s, tx) => s + tx.sisaTagihan, 0);
    const todayTx = allTransactions.filter((tx) => tx.tanggal.slice(0, 10) === todayStr);
    const totalHariIni = todayTx.reduce((s, tx) => s + tx.totalBruto, 0);
    const piutangDueSoon = allPiutang.filter((p) => {
      if (p.status !== "AKTIF") return false;
      const diff = parseISO(p.jatuhTempo).getTime() - now.getTime();
      return diff <= 3 * 24 * 60 * 60 * 1000 && diff >= 0;
    });

    return { totalSaldo, cashflowMasuk, cashflowKeluar, labaBersih: cashflowMasuk - cashflowKeluar, piutangAktif, totalHariIni, piutangDueSoon, jumlahTransaksi: allTransactions.length };
  }, [allTransactions, allCashflows, allWallets, allPiutang]);

  const chartData = useMemo(() => {
    const days = 7;
    const now = new Date();
    return Array.from({ length: days }, (_, i) => {
      const d = subDays(now, days - 1 - i);
      const dayStr = format(d, "yyyy-MM-dd");
      const label = format(d, "EEE", { locale: idLocale });
      const masuk = allCashflows.filter((c) => c.tipe === "masuk" && c.createdAt.slice(0, 10) === dayStr).reduce((s, c) => s + c.nominal, 0);
      const keluar = allCashflows.filter((c) => c.tipe === "keluar" && c.createdAt.slice(0, 10) === dayStr).reduce((s, c) => s + c.nominal, 0);
      return { name: label, Masuk: masuk, Keluar: keluar };
    });
  }, [allCashflows]);

  const recentTx = useMemo(() => {
    return [...allTransactions].sort((a, b) => b.tanggal.localeCompare(a.tanggal)).slice(0, 5);
  }, [allTransactions]);

  const notifCount = stats.piutangDueSoon.length;

  return (
    <div className="flex flex-col gap-4 pt-2 pb-4 animate-fade-in">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <p className="text-[10px] text-slate-400 font-bold">{getGreeting()}</p>
          <h1 className="text-xl font-heading font-extrabold tracking-tight">
            <span className="gradient-text">MMCBANK</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowNotif(!showNotif)} className="relative w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center scale-press">
            <Bell className="w-5 h-5 text-slate-500" />
            {notifCount > 0 && <span className="absolute -top-1 -right-1 badge-alert">{notifCount}</span>}
          </button>
          <button onClick={() => router.push("/profile")} className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#008CEB] to-[#00C9A7] flex items-center justify-center text-white text-sm font-extrabold overflow-hidden shadow-md scale-press">
            {currentUser?.fotoUrl ? (
              <img src={currentUser.fotoUrl} alt="Profil" className="w-full h-full object-cover" />
            ) : (
              currentUser?.nama?.charAt(0)?.toUpperCase() || "👤"
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showNotif && notifCount > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="premium-card p-4 border-amber-300/40 dark:border-amber-700/40">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-heading font-extrabold">Notifikasi</span>
              </div>
              {stats.piutangDueSoon.length > 0 && <p className="text-[11px] py-1 flex items-center gap-2"><span className="badge-alert">{stats.piutangDueSoon.length}</span> piutang jatuh tempo</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="premium-card p-4 bg-gradient-to-br from-[#008CEB]/10 to-[#00C9A7]/10 dark:from-[#008CEB]/5 dark:to-[#00C9A7]/5 animate-slide-up" style={{ animationDelay: "50ms", animationFillMode: "backwards" }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#008CEB]/20 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-[#008CEB]" />
            </div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Saldo Semua Buku</span>
          </div>
        </div>
        <p className="text-xl font-heading font-extrabold text-[#008CEB] dark:text-[#4DA3E0] tracking-tight">Rp{stats.totalSaldo.toLocaleString()}</p>
      </div>

      <div className="animate-slide-up" style={{ animationDelay: "100ms", animationFillMode: "backwards" }}>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-[#008CEB]" />
          <span className="text-xs font-heading font-extrabold">Pilih Buku</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {MAIN_BOOKS.map((book, i) => (
            <button
              key={book.slug}
              onClick={() => router.push(book.route)}
              className="premium-card premium-card-glow p-4 text-left scale-press animate-slide-up"
              style={{ animationDelay: `${120 + i * 60}ms`, animationFillMode: "backwards" }}
            >
              <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${book.color} flex items-center justify-center shadow-md mb-2`}>
                {book.icon}
              </div>
              <p className="text-xs font-heading font-extrabold">{book.label}</p>
              <p className="text-[9px] text-slate-400 mt-0.5">{book.desc}</p>
              <span className="text-[9px] text-[#008CEB] mt-2 block flex items-center gap-0.5">Buka <ChevronRight className="w-3 h-3" /></span>
            </button>
          ))}
        </div>
      </div>

      <div className="premium-card premium-card-glow p-4 animate-slide-up" style={{ animationDelay: "350ms", animationFillMode: "backwards" }}>
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-[#008CEB]" />
          <span className="text-xs font-heading font-extrabold">Cashflow Global 7 Hari</span>
        </div>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gMasuk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gKeluar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(0)}jt` : v >= 1000 ? `${(v / 1000).toFixed(0)}rb` : String(v)} />
              <Tooltip content={<MiniCashflowTooltip />} />
              <Area type="monotone" dataKey="Masuk" stroke="#22c55e" strokeWidth={2} fill="url(#gMasuk)" />
              <Area type="monotone" dataKey="Keluar" stroke="#f43f5e" strokeWidth={2} fill="url(#gKeluar)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="premium-card premium-card-glow p-4 animate-slide-up" style={{ animationDelay: "400ms", animationFillMode: "backwards" }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[10px] font-heading font-extrabold text-slate-400 uppercase tracking-wider">Riwayat Terakhir</h3>
        </div>
        {recentTx.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">Belum ada transaksi</div>
        ) : (
          <div className="space-y-2">
            {recentTx.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-zinc-900/50 rounded-lg px-2 -mx-2 transition-all">
                <div className="min-w-0">
                  <p className="text-xs font-heading font-bold line-clamp-1">{tx.customerNama}</p>
                  <p className="text-[9px] text-slate-400 font-medium">{tx.items.length} item</p>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="text-xs font-heading font-extrabold text-[#008CEB]">Rp{tx.totalBruto.toLocaleString()}</p>
                  <span className={`inline-block text-[8px] px-2 py-0.5 rounded-full font-bold mt-0.5 ${tx.sisaTagihan === 0 ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"}`}>
                    {tx.sisaTagihan === 0 ? "LUNAS" : "PIUTANG"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 animate-slide-up" style={{ animationDelay: "450ms", animationFillMode: "backwards" }}>
        <div className="premium-card p-4 flex flex-col gap-1.5 border-emerald-200/40 dark:border-emerald-900/30">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 pulse-dot" />
            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Pemasukan</span>
          </div>
          <p className="text-sm font-heading font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">Rp{stats.cashflowMasuk.toLocaleString()}</p>
        </div>
        <div className="premium-card p-4 flex flex-col gap-1.5 border-rose-200/40 dark:border-rose-900/30">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500 pulse-dot" />
            <span className="text-[9px] text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider">Pengeluaran</span>
          </div>
          <p className="text-sm font-heading font-extrabold text-rose-600 dark:text-rose-400 tracking-tight">Rp{stats.cashflowKeluar.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
