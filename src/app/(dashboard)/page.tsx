"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "@/hooks/useLiveQuery";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { format, subDays, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { db } from "@/lib/db-v4";
import { useSessionStore } from "@/store/useSessionStore";
import {
  Bell, Settings, Wallet, TrendingUp, TrendingDown, ShoppingCart,
  Clock, BarChart3, BookOpen, User, Home, Building2, ChevronRight,
  DollarSign, Package, Users, Truck, ArrowRightLeft, ClipboardList,
  Layers, BanknoteIcon, CreditCard, AlertTriangle, ShoppingBag,
  FileText, PieChart, Inbox, Sun, Moon, ArrowUpRight, ArrowDownRight,
  Plus, Eye, EyeOff, RefreshCw,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface BookCard {
  slug: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  route: string;
}

const MAIN_BOOKS: BookCard[] = [
  { slug: "pribadi", label: "Buku Pribadi", desc: "Keuangan pribadi", icon: <User className="w-5 h-5 text-white" />, color: "from-emerald-500 to-emerald-600", route: "/buku-pribadi" },
  { slug: "keluarga", label: "Buku Keluarga", desc: "Keuangan keluarga", icon: <Home className="w-5 h-5 text-white" />, color: "from-amber-400 to-amber-500", route: "/buku-keluarga" },
  { slug: "usaha", label: "Buku Usaha", desc: "Unit usaha & bisnis", icon: <Building2 className="w-5 h-5 text-white" />, color: "from-slate-500 to-slate-600", route: "/buku-bisnis" },
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
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-4 py-3 shadow-elevated">
      <p className="text-[10px] text-[var(--color-text-secondary)] font-bold mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-[11px] font-extrabold flex items-center gap-1.5" style={{ color: p.color }}>
          {p.name === "Masuk" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          Rp{Number(p.value).toLocaleString()}
        </p>
      ))}
    </div>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as any } },
};

export default function DashboardUtamaPage() {
  const router = useRouter();
  const { currentUser } = useSessionStore();
  const [showNotif, setShowNotif] = useState(false);
  const [showSaldo, setShowSaldo] = useState(true);

  useEffect(() => {
    if (!currentUser) router.replace("/login");
  }, [currentUser, router]);

  const allTransactions = useLiveQuery(() => db.transactions.toArray()) || [];
  const allCashflows = useLiveQuery(() => db.cashflows.toArray()) || [];
  const allWallets = useLiveQuery(() => db.wallets.toArray()) || [];
  const allPiutang = useLiveQuery(() => db.piutang.toArray()) || [];
  const allInventory = useLiveQuery(() => db.inventory.toArray()) || [];
  const allCustomers = useLiveQuery(() => db.customers.toArray()) || [];

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
    const stokHabis = allInventory.filter((i) => i.stok === 0).length;
    const stokMenipis = allInventory.filter((i) => i.stok <= i.stokMin && i.stok > 0).length;
    return { totalSaldo, cashflowMasuk, cashflowKeluar, labaBersih: cashflowMasuk - cashflowKeluar, piutangAktif, totalHariIni, piutangDueSoon, jumlahTransaksi: allTransactions.length, stokHabis, stokMenipis };
  }, [allTransactions, allCashflows, allWallets, allPiutang, allInventory]);

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

  const notifCount = stats.piutangDueSoon.length + stats.stokHabis + stats.stokMenipis;

  const quickActions = useMemo(() => [
    { label: "Transaksi Baru", icon: <Plus className="w-5 h-5" />, color: "from-emerald-500 to-emerald-600", onClick: () => router.push("/buku-bisnis") },
    { label: "Produk Baru", icon: <Package className="w-5 h-5" />, color: "from-amber-400 to-amber-500", onClick: () => router.push("/buku-bisnis") },
    { label: "Pelanggan", icon: <Users className="w-5 h-5" />, color: "from-blue-500 to-blue-600", onClick: () => router.push("/buku-bisnis") },
    { label: "Laporan", icon: <FileText className="w-5 h-5" />, color: "from-violet-500 to-violet-600", onClick: () => router.push("/buku-bisnis") },
  ], [router]);

  const today = new Date();
  const formattedDate = format(today, "EEEE, d MMMM yyyy", { locale: idLocale });

  if (!currentUser) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[var(--color-bg)]">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex-1 flex flex-col gap-4 pb-8"
    >

      {/* ───── HEADER ───── */}
      <motion.div variants={itemVariants} className="flex items-center justify-between pt-2">
        <div>
          <p className="text-[10px] text-[var(--color-text-secondary)] font-bold uppercase tracking-[0.08em]">{formattedDate}</p>
          <h1 className="text-xl font-heading font-extrabold tracking-tight mt-0.5">
            {getGreeting()}, <span className="gradient-text">{currentUser?.nama || "Admin"}</span>
          </h1>
        </div>
        <div className="flex items-center gap-2.5">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowNotif(!showNotif)}
            className="relative w-10 h-10 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center shadow-soft"
          >
            <Bell className="w-4.5 h-4.5 text-[var(--color-text-secondary)]" />
            {notifCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[8px] font-extrabold flex items-center justify-center shadow-md">
                {notifCount > 9 ? "9+" : notifCount}
              </span>
            )}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/profile")}
            className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-sm font-extrabold overflow-hidden shadow-md shadow-emerald-500/20"
          >
            {currentUser?.fotoUrl ? (
              <img src={currentUser.fotoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              currentUser?.nama?.charAt(0)?.toUpperCase() || <User className="w-5 h-5" />
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* ───── NOTIFICATION CENTER ───── */}
      <AnimatePresence>
        {showNotif && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-amber-300/40 dark:border-amber-700/40">
              <CardHeader title="Notifikasi" />
              <CardContent>
                {notifCount === 0 ? (
                  <div className="flex flex-col items-center py-4 text-[var(--color-text-secondary)]">
                    <Bell className="w-6 h-6 mb-1 opacity-50" />
                    <p className="text-xs font-medium">Semua dalam keadaan baik</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {stats.piutangDueSoon.length > 0 && (
                      <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 flex items-center gap-3">
                        <CreditCard className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="text-xs font-medium"><strong>{stats.piutangDueSoon.length}</strong> piutang akan jatuh tempo</span>
                      </div>
                    )}
                    {stats.stokHabis > 0 && (
                      <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/20 flex items-center gap-3">
                        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                        <span className="text-xs font-medium"><strong>{stats.stokHabis}</strong> produk telah habis</span>
                      </div>
                    )}
                    {stats.stokMenipis > 0 && (
                      <div className="p-3 rounded-2xl bg-orange-50 dark:bg-orange-950/20 flex items-center gap-3">
                        <Package className="w-4 h-4 text-orange-500 shrink-0" />
                        <span className="text-xs font-medium"><strong>{stats.stokMenipis}</strong> produk hampir habis</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ───── SALDO CARD ───── */}
      <motion.div variants={itemVariants}>
        <div className="card-modern p-6 bg-gradient-to-br from-emerald-600 via-emerald-600 to-emerald-700 border-emerald-500 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/70">Total Saldo</p>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowSaldo(!showSaldo)}
                className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm"
              >
                {showSaldo ? <EyeOff className="w-4 h-4 text-white/70" /> : <Eye className="w-4 h-4 text-white/70" />}
              </motion.button>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[11px] font-bold text-white/50">Rp</span>
              <span className="text-3xl font-heading font-extrabold tracking-tight tabular-nums">
                {showSaldo ? stats.totalSaldo.toLocaleString() : "••••••••"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <div className="flex items-center gap-1 bg-white/10 rounded-xl px-3 py-1.5 backdrop-blur-sm">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-200" />
                <span className="font-bold text-emerald-200">Rp{stats.cashflowMasuk.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1 bg-white/10 rounded-xl px-3 py-1.5 backdrop-blur-sm">
                <TrendingDown className="w-3.5 h-3.5 text-red-200" />
                <span className="font-bold text-red-200">Rp{stats.cashflowKeluar.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ───── QUICK STATS ───── */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Kas", value: allWallets.filter(w => w.tipe === "KasTunai" || w.tipe === "EWallet").reduce((s, w) => s + w.saldo, 0), icon: <Wallet className="w-4.5 h-4.5" />, color: "emerald" },
          { label: "Total Bank", value: allWallets.filter(w => w.tipe === "Bank").reduce((s, w) => s + w.saldo, 0), icon: <BanknoteIcon className="w-4.5 h-4.5" />, color: "blue" },
          { label: "Piutang", value: stats.piutangAktif, icon: <CreditCard className="w-4.5 h-4.5" />, color: "gold" },
          { label: "Laba Bersih", value: Math.abs(stats.labaBersih), icon: <TrendingUp className="w-4.5 h-4.5" />, color: "rose" },
        ].map((item, idx) => (
          <StatCard
            key={idx}
            label={item.label}
            value={`Rp${item.value.toLocaleString()}`}
            icon={item.icon}
            variant={item.color as any}
          />
        ))}
      </motion.div>

      {/* ───── CHART ───── */}
      <motion.div variants={itemVariants}>
        <SectionHeader title="Grafik Cashflow 7 Hari" />
        <div className="card-modern p-5 mt-3">
          {chartData.every((d) => d.Masuk === 0 && d.Keluar === 0) ? (
            <div className="h-48 flex flex-col items-center justify-center text-[var(--color-text-secondary)]">
              <BarChart3 className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-xs font-medium">Belum ada data cashflow</p>
            </div>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gMasuk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gKeluar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EF4444" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gMasukGlow" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0} />
                      <stop offset="50%" stopColor="#10B981" stopOpacity={0.08} />
                      <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#94A3B8", fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#94A3B8", fontWeight: 600 }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}jt` : v >= 1000 ? `${(v / 1000).toFixed(0)}rb` : String(v)} />
                  <Tooltip content={<MiniCashflowTooltip />} cursor={{ stroke: "#94A3B8", strokeWidth: 1, strokeDasharray: "4 4" }} />
                  <Area type="monotone" dataKey="Masuk" stroke="#10B981" strokeWidth={2.5} fill="url(#gMasuk)" dot={false} activeDot={{ r: 5, fill: "#10B981", stroke: "white", strokeWidth: 2 }} />
                  <Area type="monotone" dataKey="Keluar" stroke="#EF4444" strokeWidth={2.5} fill="url(#gKeluar)" dot={false} activeDot={{ r: 5, fill: "#EF4444", stroke: "white", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </motion.div>

      {/* ───── BOOK SUMMARY ───── */}
      <motion.div variants={itemVariants}>
        <SectionHeader title="Buku Keuangan" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
          {MAIN_BOOKS.map((book, idx) => (
            <motion.button
              key={book.slug}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(book.route)}
              className="card-modern p-5 text-left flex flex-col gap-3 hover-lift"
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${book.color} flex items-center justify-center text-white shadow-md`}>
                {book.icon}
              </div>
              <div>
                <p className="text-sm font-bold">{book.label}</p>
                <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">{book.desc}</p>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-[var(--color-border)]">
                <span className="text-xs text-[var(--color-text-secondary)] font-medium">
                  {book.slug === "pribadi" && `${allCustomers.length} pelanggan`}
                  {book.slug === "keluarga" && `${allTransactions.length} transaksi`}
                  {book.slug === "usaha" && `${allInventory.length} produk`}
                </span>
                <ChevronRight className="w-4 h-4 text-[var(--color-text-secondary)]" />
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ───── RECENT ACTIVITY + QUICK ACTIONS ───── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Transactions */}
        <div className="lg:col-span-2">
          <SectionHeader title="Transaksi Terbaru" onSeeAll={() => router.push("/buku-bisnis")} />
          <div className="card-modern mt-3 divide-y divide-[var(--color-border)]">
            {recentTx.length === 0 ? (
              <div className="p-5">
                <EmptyState icon={<Inbox className="w-6 h-6" />} title="Belum ada transaksi" description="Transaksi akan muncul di sini" />
              </div>
            ) : (
              recentTx.map((tx, idx) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 } as any}
                  className="flex items-center justify-between px-5 py-3.5 first:pt-4 last:pb-4"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tx.sisaTagihan === 0 ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500" : "bg-amber-50 dark:bg-amber-900/20 text-amber-500"}`}>
                      <ShoppingCart className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate">{tx.customerNama}</p>
                      <p className="text-[10px] text-[var(--color-text-secondary)]">
                        {tx.items.length} item &middot; {new Date(tx.tanggal).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">Rp{tx.totalBruto.toLocaleString()}</p>
                    <Badge variant={tx.sisaTagihan === 0 ? "success" : "warning"}>
                      {tx.sisaTagihan === 0 ? "LUNAS" : "PIUTANG"}
                    </Badge>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <SectionHeader title="Aksi Cepat" />
          <div className="grid grid-cols-2 gap-2.5 mt-3">
            {quickActions.map((a) => (
              <motion.button
                key={a.label}
                whileTap={{ scale: 0.95 }}
                onClick={a.onClick}
                className="card-modern p-4 flex flex-col items-center gap-2.5"
              >
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${a.color} flex items-center justify-center text-white shadow-md`}>
                  {a.icon}
                </div>
                <span className="text-[10px] font-bold text-center leading-tight">{a.label}</span>
              </motion.button>
            ))}
          </div>

          {/* Mini Info Card */}
          <div className="card-modern p-4 mt-3 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10 border-amber-200/50 dark:border-amber-800/30">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-white shadow-md shrink-0">
                <PieChart className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300">Ringkasan Bisnis</p>
                <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-0.5 leading-relaxed">
                  {stats.jumlahTransaksi} transaksi &middot; {allCustomers.length} pelanggan &middot; {allInventory.length} produk
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
