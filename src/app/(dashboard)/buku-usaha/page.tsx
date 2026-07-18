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
  DollarSign, Package, Users, Truck, ArrowRightLeft, ClipboardList,
  Layers, BanknoteIcon, CreditCard, AlertTriangle, ShoppingBag,
  FileText, PieChart, Inbox, Sun, Moon,
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
    { label: "Transaksi Baru", icon: <ShoppingCart className="w-5 h-5" />, color: "from-blue-500 to-blue-600", onClick: () => router.push("/buku-usaha/usaha") },
    { label: "Produk Baru", icon: <Package className="w-5 h-5" />, color: "from-emerald-500 to-emerald-600", onClick: () => router.push("/buku-usaha/usaha") },
    { label: "Pelanggan Baru", icon: <Users className="w-5 h-5" />, color: "from-violet-500 to-violet-600", onClick: () => router.push("/buku-usaha/usaha") },
    { label: "Cashflow", icon: <Wallet className="w-5 h-5" />, color: "from-cyan-500 to-cyan-600", onClick: () => router.push("/buku-usaha/usaha") },
    { label: "Transfer", icon: <ArrowRightLeft className="w-5 h-5" />, color: "from-rose-500 to-rose-600", onClick: () => router.push("/buku-global") },
    { label: "Purchase Order", icon: <ClipboardList className="w-5 h-5" />, color: "from-orange-500 to-orange-600", onClick: () => alert("Purchase order segera hadir") },
    { label: "Produksi Baru", icon: <Layers className="w-5 h-5" />, color: "from-purple-500 to-purple-600", onClick: () => router.push("/buku-usaha/usaha") },
    { label: "Laporan", icon: <FileText className="w-5 h-5" />, color: "from-rose-500 to-rose-600", onClick: () => router.push("/buku-usaha/usaha") },
  ], [router]);

  const shortcutModules = useMemo(() => [
    { label: "Buku Global", icon: <BarChart3 className="w-5 h-5" />, color: "from-[#008CEB] to-[#00C9A7]", desc: "Ringkasan semua data", path: "/buku-global" },
    { label: "Buku Pribadi", icon: <User className="w-5 h-5" />, color: "from-slate-500 to-slate-600", desc: "Keuangan pribadi", path: "/buku-pribadi" },
    { label: "Buku Keluarga", icon: <Home className="w-5 h-5" />, color: "from-rose-400 to-rose-500", desc: "Keuangan keluarga", path: "/buku-keluarga" },
    { label: "Buku Usaha", icon: <Building2 className="w-5 h-5" />, color: "from-amber-400 to-orange-500", desc: "Unit usaha & bisnis", path: "/buku-usaha/usaha" },
    { label: "Kasir", icon: <BanknoteIcon className="w-5 h-5" />, color: "from-blue-500 to-blue-600", desc: "Proses transaksi penjualan", path: "/buku-usaha/usaha" },
    { label: "Inventory", icon: <Package className="w-5 h-5" />, color: "from-emerald-500 to-emerald-600", desc: "Manajemen stok barang", path: "/buku-usaha/usaha" },
    { label: "Laporan", icon: <FileText className="w-5 h-5" />, color: "from-cyan-500 to-cyan-600", desc: "Laporan penjualan", path: "/buku-usaha/usaha" },
    { label: "Pengaturan", icon: <Settings className="w-5 h-5" />, color: "from-slate-500 to-slate-600", desc: "Pengaturan & backup", path: "/buku-global" },
  ], [router]);

  const kpiItems = useMemo(() => [
    { label: "Saldo Total", value: `Rp${stats.totalSaldo.toLocaleString()}`, icon: <Wallet className="w-5 h-5" />, color: "from-[#008CEB] to-[#00C9A7]" },
    { label: "Pemasukan", value: `Rp${stats.cashflowMasuk.toLocaleString()}`, icon: <TrendingUp className="w-5 h-5" />, color: "from-emerald-500 to-emerald-600" },
    { label: "Pengeluaran", value: `Rp${stats.cashflowKeluar.toLocaleString()}`, icon: <TrendingDown className="w-5 h-5" />, color: "from-rose-500 to-rose-600" },
    { label: "Laba Bersih", value: `Rp${Math.abs(stats.labaBersih).toLocaleString()}`, icon: <DollarSign className="w-5 h-5" />, color: stats.labaBersih >= 0 ? "from-emerald-500 to-emerald-600" : "from-rose-500 to-rose-600" },
    { label: "Piutang Aktif", value: `Rp${stats.piutangAktif.toLocaleString()}`, icon: <CreditCard className="w-5 h-5" />, color: "from-amber-500 to-amber-600" },
    { label: "Transaksi", value: stats.jumlahTransaksi.toLocaleString(), icon: <ShoppingCart className="w-5 h-5" />, color: "from-indigo-500 to-indigo-600" },
    { label: "Pelanggan", value: allCustomers.length.toLocaleString(), icon: <Users className="w-5 h-5" />, color: "from-violet-500 to-violet-600" },
    { label: "Produk", value: allInventory.length.toLocaleString(), icon: <Package className="w-5 h-5" />, color: "from-teal-500 to-teal-600" },
  ], [stats, allCustomers, allInventory]);

  const today = new Date();

  return (
    <div className="flex-1 flex flex-col gap-5 pt-2 pb-8 animate-fade-in">

      {/* ───── 1. WELCOME SECTION ───── */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            {format(today, "EEEE, d MMMM yyyy", { locale: idLocale })}
          </p>
          <h1 className="text-2xl font-heading font-extrabold tracking-tight">
            {getGreeting()}, {currentUser?.nama || "Admin"}
          </h1>
          <p className="text-[11px] text-slate-400">
            {stats.jumlahTransaksi} transaksi &middot; {allCustomers.length} pelanggan &middot; {allInventory.length} produk
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowNotif(!showNotif)} className="relative w-10 h-10 rounded-2xl bg-white dark:bg-[#131527] shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-center scale-press">
            <Bell className="w-5 h-5 text-slate-500" />
            {notifCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[8px] font-bold flex items-center justify-center shadow-md">{notifCount}</span>}
          </button>
          <button onClick={() => router.push("/profile")} className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#008CEB] to-[#00C9A7] flex items-center justify-center text-white text-sm font-extrabold overflow-hidden shadow-md scale-press">
            {currentUser?.fotoUrl ? (
              <img src={currentUser.fotoUrl} alt="Profil" className="w-full h-full object-cover" />
            ) : (
              currentUser?.nama?.charAt(0)?.toUpperCase() || <User className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* ───── NOTIFICATION CENTER ───── */}
      <AnimatePresence>
        {showNotif && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <Card className="border-amber-300/40 dark:border-amber-700/40">
              <CardHeader title="Notifikasi" />
              <CardContent>
                {notifCount === 0 ? (
                  <div className="flex flex-col items-center py-4 text-slate-400">
                    <Bell className="w-6 h-6 mb-1 text-slate-300" />
                    <p className="text-xs">Semua dalam keadaan baik</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {stats.piutangDueSoon.length > 0 && (
                      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 flex items-center gap-3">
                        <CreditCard className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="text-xs"><strong>{stats.piutangDueSoon.length}</strong> piutang akan jatuh tempo</span>
                      </div>
                    )}
                    {stats.stokHabis > 0 && (
                      <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 flex items-center gap-3">
                        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                        <span className="text-xs"><strong>{stats.stokHabis}</strong> produk telah habis</span>
                      </div>
                    )}
                    {stats.stokMenipis > 0 && (
                      <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/20 flex items-center gap-3">
                        <Package className="w-4 h-4 text-orange-500 shrink-0" />
                        <span className="text-xs"><strong>{stats.stokMenipis}</strong> produk hampir habis</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ───── 2. QUICK ACTIONS ───── */}
      <SectionHeader title="Aksi Cepat" />
      <div className="grid grid-cols-4 gap-2">
        {quickActions.map((a) => (
          <button key={a.label} onClick={a.onClick}
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white dark:bg-[#131527] shadow-sm border border-slate-100 dark:border-slate-800 active:scale-95 transition-all">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center text-white shadow-sm`}>
              {a.icon}
            </div>
            <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 text-center leading-tight">{a.label}</span>
          </button>
        ))}
      </div>

      {/* ───── 3. KPI CARDS ───── */}
      <SectionHeader title="Ringkasan Keuangan" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {kpiItems.map((item, idx) => (
          <StatCard key={idx} label={item.label} value={item.value} icon={item.icon} color={item.color} />
        ))}
      </div>

      {/* ───── 4. CHARTS ───── */}
      <SectionHeader title="Grafik Cashflow 7 Hari" />
      <Card>
        <CardContent>
          {chartData.every((d) => d.Masuk === 0 && d.Keluar === 0) ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400">
              <BarChart3 className="w-8 h-8 mb-2 text-slate-300" />
              <p className="text-xs">Belum ada data cashflow</p>
            </div>
          ) : (
            <div className="h-48">
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
          )}
        </CardContent>
      </Card>

      {/* ───── 5. RECENT ACTIVITY ───── */}
      <SectionHeader title="Transaksi Terbaru" onSeeAll={() => router.push("/buku-global")} />
      <Card>
        <CardContent>
          {recentTx.length === 0 ? (
            <EmptyState icon={<Inbox className="w-6 h-6" />} title="Belum ada transaksi" description="Transaksi akan muncul di sini" />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentTx.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold line-clamp-1">{tx.customerNama}</p>
                    <p className="text-[9px] text-slate-400">{tx.items.length} item &middot; {new Date(tx.tanggal).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-xs font-extrabold text-[#008CEB]">Rp{tx.totalBruto.toLocaleString()}</p>
                    <Badge variant={tx.sisaTagihan === 0 ? "success" : "warning"}>
                      {tx.sisaTagihan === 0 ? "LUNAS" : "PIUTANG"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ───── 6. SHORTCUT MODULE ───── */}
      <SectionHeader title="Menu Cepat" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {shortcutModules.map((mod) => (
          <button key={mod.label} onClick={() => router.push(mod.path)}
            className="bg-white dark:bg-[#131527] rounded-2xl p-3 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-3 active:scale-[0.98] transition-all text-left">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${mod.color} flex items-center justify-center text-white shadow-sm shrink-0`}>
              {mod.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold">{mod.label}</p>
              <p className="text-[9px] text-slate-400 truncate">{mod.desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
