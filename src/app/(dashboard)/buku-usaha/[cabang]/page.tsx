"use client";

import React, { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLiveQuery } from "@/hooks/useLiveQuery";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { db, type UnitId, BRANCH_MAP, BRANCH_LABELS, BRANCH_COLORS } from "@/lib/db-v4";
import { useSessionStore } from "@/store/useSessionStore";
import {
  ChevronLeft, Bell, AlertTriangle, Clock, Wallet, Target,
  TrendingUp, TrendingDown, ShoppingCart, Tag, Calendar, FileText,
  BarChart3, Trophy, Receipt, Package, Users, ArrowRight, Zap, Settings,
  Heart, ArrowLeftRight, Truck, ClipboardList, Repeat,
} from "lucide-react";


const TARGET_PENJUALAN = 10_000_000;

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

export default function CabangDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useSessionStore();
  const cabangSlug = (params?.cabang as string) || "";
  const bookOrBranchId = BRANCH_MAP[cabangSlug] || "usaha-warkop";
  const [showNotif, setShowNotif] = useState(false);

  const transactions = useLiveQuery(() => db.transactions.where("bookOrBranchId").equals(bookOrBranchId).toArray(), [bookOrBranchId]) || [];
  const inventory = useLiveQuery(() => db.inventory.where("bookOrBranchId").equals(bookOrBranchId).toArray(), [bookOrBranchId]) || [];
  const cashflows = useLiveQuery(() => db.cashflows.where("bookOrBranchId").equals(bookOrBranchId).toArray(), [bookOrBranchId]) || [];
  const wallets = useLiveQuery(() => db.wallets.where("bookOrBranchId").equals(bookOrBranchId).toArray(), [bookOrBranchId]) || [];
  const piutangList = useLiveQuery(() => db.piutang.where("bookOrBranchId").equals(bookOrBranchId).toArray(), [bookOrBranchId]) || [];

  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subDays(monthStart, 1));
    const lastMonthEnd = endOfMonth(subDays(monthStart, 1));

    const todayTx = transactions.filter((tx) => tx.tanggal.slice(0, 10) === todayStr);
    const monthTx = transactions.filter((tx) => {
      const d = parseISO(tx.tanggal);
      return isWithinInterval(d, { start: monthStart, end: monthEnd });
    });
    const lastMonthTx = transactions.filter((tx) => {
      const d = parseISO(tx.tanggal);
      return isWithinInterval(d, { start: lastMonthStart, end: lastMonthEnd });
    });

    const totalHariIni = todayTx.reduce((sum, tx) => sum + tx.totalBruto, 0);
    const totalBulanIni = monthTx.reduce((sum, tx) => sum + tx.totalBruto, 0);
    const totalBulanLalu = lastMonthTx.reduce((sum, tx) => sum + tx.totalBruto, 0);
    const piutangAktif = transactions.filter((tx) => tx.sisaTagihan > 0).reduce((sum, tx) => sum + tx.sisaTagihan, 0);
    const stokMenipis = inventory.filter((item) => item.stok <= item.stokMin);
    const stokHabis = inventory.filter((item) => item.stok === 0);
    const cashflowMasuk = cashflows.filter((c) => c.tipe === "masuk").reduce((sum, c) => sum + c.nominal, 0);
    const cashflowKeluar = cashflows.filter((c) => c.tipe === "keluar").reduce((sum, c) => sum + c.nominal, 0);
    const totalSaldo = wallets.reduce((sum, w) => sum + w.saldo, 0);
    const piutangDueSoon = piutangList.filter((p) => {
      if (p.status !== "AKTIF") return false;
      const diff = parseISO(p.jatuhTempo).getTime() - now.getTime();
      return diff <= 3 * 24 * 60 * 60 * 1000 && diff >= 0;
    });
    const persentasePerubahan = totalBulanLalu > 0 ? Math.round(((totalBulanIni - totalBulanLalu) / totalBulanLalu) * 100) : totalBulanIni > 0 ? 100 : 0;

    return {
      totalHariIni, totalBulanIni, totalBulanLalu, jumlahTransaksi: transactions.length,
      jumlahTransaksiBulan: monthTx.length, piutangAktif, stokMenipis, stokMenipisCount: stokMenipis.length,
      stokHabisCount: stokHabis.length, cashflowMasuk, cashflowKeluar, labaBersih: cashflowMasuk - cashflowKeluar,
      totalSaldo, piutangDueSoon, persentasePerubahan,
    };
  }, [transactions, inventory, cashflows, wallets, piutangList]);

  const chartData = useMemo(() => {
    const days = 7;
    const now = new Date();
    return Array.from({ length: days }, (_, i) => {
      const d = subDays(now, days - 1 - i);
      const dayStr = format(d, "yyyy-MM-dd");
      const label = format(d, "EEE", { locale: idLocale });
      const masuk = cashflows.filter((c) => c.tipe === "masuk" && c.createdAt.slice(0, 10) === dayStr).reduce((sum, c) => sum + c.nominal, 0);
      const keluar = cashflows.filter((c) => c.tipe === "keluar" && c.createdAt.slice(0, 10) === dayStr).reduce((sum, c) => sum + c.nominal, 0);
      return { name: label, Masuk: masuk, Keluar: keluar };
    });
  }, [cashflows]);

  const topProduk = useMemo(() => {
    const countMap: Record<string, { qty: number; total: number }> = {};
    transactions.forEach((tx) => tx.items.forEach((item) => {
      if (!countMap[item.namaItem]) countMap[item.namaItem] = { qty: 0, total: 0 };
      countMap[item.namaItem].qty += item.qty;
      countMap[item.namaItem].total += item.subtotal;
    }));
    return Object.entries(countMap).map(([nama, data]) => ({ nama, ...data })).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [transactions]);

  const recentTx = useMemo(() => [...transactions].sort((a, b) => b.tanggal.localeCompare(a.tanggal)).slice(0, 5), [transactions]);
  const todayStr = new Date().toISOString().slice(0, 10);
  const notifCount = stats.stokMenipisCount + stats.piutangDueSoon.length;

  return (
    <div className="flex flex-col gap-4 pt-2 pb-4 animate-fade-in">
      <div className="flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/buku-usaha")} className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center scale-press">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-[10px] text-slate-400 font-bold">{getGreeting()}</p>
            <h1 className="text-xl font-heading font-extrabold tracking-tight">{BRANCH_LABELS[cabangSlug] || cabangSlug}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowNotif(!showNotif)} className="relative w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center scale-press">
            <Bell className="w-5 h-5 text-slate-500" />
            {notifCount > 0 && <span className="absolute -top-1 -right-1 badge-alert">{notifCount}</span>}
          </button>
          <button onClick={() => router.push("/profile")} className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${BRANCH_COLORS[cabangSlug] || "from-[#008CEB] to-[#00C9A7]"} flex items-center justify-center text-white text-sm font-extrabold shadow-lg shadow-[#008CEB]/20 overflow-hidden scale-press`}>
            {currentUser?.fotoUrl ? (
              <img src={currentUser.fotoUrl} alt="Profil" className="w-full h-full object-cover" />
            ) : (
              currentUser?.nama?.charAt(0)?.toUpperCase() || "?"
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
              {stats.stokMenipisCount > 0 && (
                <button onClick={() => { router.push(`/buku-usaha/${cabangSlug}/inventory`); setShowNotif(false); }} className="flex items-center gap-2 w-full text-left py-1.5 text-[11px] font-medium hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg px-2 -mx-2 transition-all">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{stats.stokMenipisCount} produk stok menipis</span>
                </button>
              )}
              {stats.stokHabisCount > 0 && (
                <button onClick={() => { router.push(`/buku-usaha/${cabangSlug}/inventory`); setShowNotif(false); }} className="flex items-center gap-2 w-full text-left py-1.5 text-[11px] font-medium hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg px-2 -mx-2 transition-all">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{stats.stokHabisCount} produk stok habis</span>
                </button>
              )}
              {stats.piutangDueSoon.length > 0 && (
                <button onClick={() => { router.push(`/buku-usaha/${cabangSlug}/transaksi`); setShowNotif(false); }} className="flex items-center gap-2 w-full text-left py-1.5 text-[11px] font-medium hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg px-2 -mx-2 transition-all">
                  <Clock className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>{stats.piutangDueSoon.length} piutang jatuh tempo 3 hari</span>
                </button>
              )}
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
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Saldo</span>
          </div>
          <span className="text-[9px] text-slate-400 font-bold">{wallets.length} dompet</span>
        </div>
        <p className="text-xl font-heading font-extrabold text-[#008CEB] dark:text-[#4DA3E0] tracking-tight">Rp{stats.totalSaldo.toLocaleString()}</p>
      </div>

      <div className="premium-card premium-card-glow p-4 animate-slide-up" style={{ animationDelay: "100ms", animationFillMode: "backwards" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[#008CEB]" />
            <span className="text-xs font-heading font-extrabold">Target Bulanan</span>
          </div>
          <span className="text-[10px] text-slate-400 font-bold">{format(new Date(), "MMM yyyy", { locale: idLocale })}</span>
        </div>
        {(() => {
          const pct = Math.min((stats.totalBulanIni / TARGET_PENJUALAN) * 100, 100);
          return (
            <>
              <div className="flex items-end justify-between mb-2">
                <p className="text-lg font-heading font-extrabold tracking-tight">Rp{stats.totalBulanIni.toLocaleString()}</p>
                <p className="text-[10px] text-slate-400 font-bold">/ Rp{(TARGET_PENJUALAN / 1_000_000).toFixed(0)}jt</p>
              </div>
              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#008CEB] to-[#00C9A7] transition-all duration-1000 ease-out" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[9px] text-slate-400 font-bold">{Math.round(pct)}% tercapai</span>
                <span className="text-[9px] text-slate-400 font-bold">Sisa Rp{Math.max(TARGET_PENJUALAN - stats.totalBulanIni, 0).toLocaleString()}</span>
              </div>
            </>
          );
        })()}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Hari Ini", value: `Rp${stats.totalHariIni.toLocaleString()}`, color: "emerald", icon: <TrendingUp className="w-4 h-4" />, key: "hariini" },
          { label: "Total Tx", value: String(stats.jumlahTransaksi), color: "blue", icon: <ShoppingCart className="w-4 h-4" />, key: "totaltx" },
          { label: "Piutang", value: `Rp${stats.piutangAktif.toLocaleString()}`, color: "amber", icon: <Clock className="w-4 h-4" />, key: "piutang" },
          { label: "Laba Bersih", value: `Rp${stats.labaBersih.toLocaleString()}`, color: stats.labaBersih >= 0 ? "emerald" : "rose", icon: stats.labaBersih >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />, key: "laba" },
        ].map((s, i) => (
          <div key={s.key} className="premium-card premium-card-glow p-4 flex flex-col gap-1 animate-slide-up" style={{ animationDelay: `${150 + i * 60}ms`, animationFillMode: "backwards" }}>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-7 h-7 rounded-lg bg-${s.color}-100 dark:bg-${s.color}-900/30 flex items-center justify-center`}>
                {s.icon}
              </div>
            </div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{s.label}</span>
            <span className={`text-sm font-heading font-extrabold tracking-tight text-${s.color}-600 dark:text-${s.color}-400`}>{s.value}</span>
          </div>
        ))}
      </div>

      <div className="premium-card premium-card-glow p-4 animate-slide-up" style={{ animationDelay: "350ms", animationFillMode: "backwards" }}>
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-[#008CEB]" />
          <span className="text-xs font-heading font-extrabold">Performa Bulanan</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#E8F5FD] dark:bg-[#008CEB]/10 p-3 rounded-xl">
            <span className="text-[9px] text-[#008CEB] font-bold uppercase flex items-center gap-1"><FileText className="w-3 h-3" /> Bulan Ini</span>
            <p className="text-sm font-heading font-extrabold text-[#008CEB] mt-1 tracking-tight">Rp{stats.totalBulanIni.toLocaleString()}</p>
            <p className="text-[9px] text-slate-400 font-bold mt-0.5">{stats.jumlahTransaksiBulan} transaksi</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
            <span className="text-[9px] text-slate-500 font-bold uppercase flex items-center gap-1"><FileText className="w-3 h-3" /> Bulan Lalu</span>
            <p className="text-sm font-heading font-extrabold text-slate-600 dark:text-slate-300 mt-1 tracking-tight">Rp{stats.totalBulanLalu.toLocaleString()}</p>
            <p className="text-[9px] text-slate-400 font-bold mt-0.5">{stats.persentasePerubahan >= 0 ? "+" : ""}{stats.persentasePerubahan}% vs sebelumnya</p>
          </div>
        </div>
      </div>

      <div className="premium-card premium-card-glow p-4 animate-slide-up" style={{ animationDelay: "400ms", animationFillMode: "backwards" }}>
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-[#008CEB]" />
          <span className="text-xs font-heading font-extrabold">Cashflow 7 Hari</span>
        </div>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradMasuk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradKeluar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(0)}jt` : v >= 1000 ? `${(v / 1000).toFixed(0)}rb` : String(v)} />
              <Tooltip content={<MiniCashflowTooltip />} />
              <Area type="monotone" dataKey="Masuk" stroke="#22c55e" strokeWidth={2} fill="url(#gradMasuk)" />
              <Area type="monotone" dataKey="Keluar" stroke="#f43f5e" strokeWidth={2} fill="url(#gradKeluar)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {stats.stokMenipisCount > 0 && (
        <div className="premium-card p-4 border-amber-300/50 dark:border-amber-700/50 animate-slide-up" style={{ animationDelay: "450ms", animationFillMode: "backwards" }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <span className="text-xs font-heading font-extrabold text-amber-600 dark:text-amber-400">Stok Menipis</span>
              <span className="badge-alert ml-2">{stats.stokMenipisCount}</span>
            </div>
          </div>
          <div className="space-y-2">
            {stats.stokMenipis.slice(0, 3).map((item) => (
              <div key={item.id} className="flex justify-between items-center text-[11px] font-medium bg-amber-50/50 dark:bg-amber-950/20 p-2 rounded-xl">
                <span className="line-clamp-1 font-bold">{item.nama}</span>
                <span className="text-rose-500 font-extrabold shrink-0 ml-2 bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded-lg text-[10px]">{item.stok === 0 ? "HABIS" : `${item.stok} tersisa`}</span>
              </div>
            ))}
          </div>
          {stats.stokMenipisCount > 3 && (
            <button onClick={() => router.push(`/buku-usaha/${cabangSlug}/inventory`)} className="mt-3 w-full py-2 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1 hover:bg-amber-100 dark:hover:bg-amber-950/40 transition-all">
              Lihat Semua <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-4 gap-2.5">
        {[
          { label: "Kasir", slug: "kasir", icon: <ShoppingCart className="w-5 h-5 text-white" />, color: "from-[#008CEB] to-[#00C9A7]", badge: 0 },
          { label: "Barang", slug: "inventory", icon: <Package className="w-5 h-5 text-white" />, color: "from-blue-500 to-indigo-500", badge: stats.stokMenipisCount },
          { label: "CRM", slug: "pelanggan", icon: <Users className="w-5 h-5 text-white" />, color: "from-emerald-400 to-teal-500", badge: 0 },
          { label: "Cashflow", slug: "cashflow", icon: <Wallet className="w-5 h-5 text-white" />, color: "from-amber-400 to-orange-500", badge: 0 },
          { label: "Anggaran", slug: "budget", icon: <TrendingDown className="w-5 h-5 text-white" />, color: "from-emerald-400 to-teal-500", badge: 0 },
          { label: "Transaksi", slug: "transaksi", icon: <Receipt className="w-5 h-5 text-white" />, color: "from-pink-400 to-rose-500", badge: 0 },
          { label: "Dompet", slug: "dompet", icon: <Wallet className="w-5 h-5 text-white" />, color: "from-cyan-400 to-teal-500", badge: 0 },
          { label: "Laporan", slug: "laporan", icon: <BarChart3 className="w-5 h-5 text-white" />, color: "from-purple-400 to-violet-500", badge: 0 },
          { label: "Sedekah", slug: "sedekah", icon: <Heart className="w-5 h-5 text-white" />, color: "from-emerald-500 to-green-600", badge: 0 },
          { label: "Transaksi Berulang", slug: "recurring", icon: <Repeat className="w-5 h-5 text-white" />, color: "from-cyan-400 to-teal-500", badge: 0 },
          { label: "Transfer", slug: "transfer", icon: <ArrowLeftRight className="w-5 h-5 text-white" />, color: "from-violet-400 to-purple-500", badge: 0 },
          { label: "Supplier", slug: "supplier", icon: <Truck className="w-5 h-5 text-white" />, color: "from-orange-400 to-amber-500", badge: 0 },
          { label: "Pembelian (PO)", slug: "purchase-order", icon: <ClipboardList className="w-5 h-5 text-white" />, color: "from-sky-400 to-blue-500", badge: 0 },
          { label: "Label", slug: "label", icon: <Tag className="w-5 h-5 text-white" />, color: "from-pink-400 to-rose-500", badge: 0 },
          { label: "Users", slug: "users", icon: <Users className="w-5 h-5 text-white" />, color: "from-teal-400 to-cyan-500", badge: 0 },
          { label: "Pengaturan", slug: "pengaturan", icon: <Settings className="w-5 h-5 text-white" />, color: "from-slate-400 to-slate-500", badge: 0 },
        ].map((btn, i) => (
          <button key={btn.slug} onClick={() => router.push(`/buku-usaha/${cabangSlug}/${btn.slug}`)} className="premium-card premium-card-glow p-3 flex flex-col items-center gap-1.5 scale-press animate-slide-up relative" style={{ animationDelay: `${500 + i * 60}ms`, animationFillMode: "backwards" }}>
            {btn.badge > 0 && <span className="absolute top-1.5 right-1.5 badge-alert">{btn.badge}</span>}
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${btn.color} flex items-center justify-center text-white shadow-md transition-transform duration-300 hover:scale-110`}>
              {btn.icon}
            </div>
            <span className="text-[10px] font-heading font-bold text-slate-600 dark:text-slate-300">{btn.label}</span>
          </button>
        ))}
      </div>

      {topProduk.length > 0 && (
        <div className="premium-card premium-card-glow p-4 animate-slide-up" style={{ animationDelay: "600ms", animationFillMode: "backwards" }}>
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-heading font-extrabold">Produk Terlaris</span>
          </div>
          <div className="space-y-2">
            {topProduk.map((p, i) => (
              <div key={p.nama} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-extrabold ${i === 0 ? "bg-amber-100 text-amber-600" : i === 1 ? "bg-slate-100 text-slate-500" : i === 2 ? "bg-orange-100 text-orange-600" : "bg-slate-50 text-slate-400"}`}>{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-heading font-bold line-clamp-1">{p.nama}</p>
                  <p className="text-[9px] text-slate-400">{p.qty} terjual</p>
                </div>
                <p className="text-[11px] font-heading font-extrabold text-[#008CEB] shrink-0">Rp{p.total.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="premium-card premium-card-glow p-4 animate-slide-up" style={{ animationDelay: "650ms", animationFillMode: "backwards" }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[10px] font-heading font-extrabold text-slate-400 uppercase tracking-wider">Riwayat Terakhir</h3>
          <button onClick={() => router.push(`/buku-usaha/${cabangSlug}/transaksi`)} className="text-[10px] font-bold text-[#008CEB] flex items-center gap-1 hover:gap-1.5 transition-all">
            Lihat semua <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        {recentTx.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs animate-fade-in">Belum ada transaksi</div>
        ) : (
          <div className="space-y-2">
            {recentTx.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-zinc-900/50 rounded-lg px-2 -mx-2 transition-all">
                <div className="min-w-0">
                  <p className="text-xs font-heading font-bold line-clamp-1">{tx.customerNama}</p>
                  <p className="text-[9px] text-slate-400 font-medium">{tx.items.length} item {tx.tanggal.slice(0, 10) === todayStr ? "Hari ini" : format(parseISO(tx.tanggal), "dd MMM", { locale: idLocale })}</p>
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

      <div className="grid grid-cols-2 gap-3 animate-slide-up" style={{ animationDelay: "700ms", animationFillMode: "backwards" }}>
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
