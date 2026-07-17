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
  Clock, Calendar, FileText, BarChart3, Store, ChevronRight,
  Printer, Smartphone, Monitor, Coffee, Shirt,
} from "lucide-react";

interface BranchInfo {
  slug: string;
  label: string;
  color: string;
  icon: React.ReactNode;
  bookId: BookOrBranch;
}

const BRANCHES: BranchInfo[] = [
  { slug: "pribadi", label: "Buku Pribadi", color: "from-slate-500 to-slate-600", icon: <FileText className="w-5 h-5 text-white" />, bookId: "pribadi" },
  { slug: "keluarga", label: "Buku Keluarga", color: "from-rose-400 to-rose-500", icon: <Store className="w-5 h-5 text-white" />, bookId: "keluarga" },
  { slug: "percetakan", label: "Percetakan", color: "from-blue-500 to-blue-600", icon: <Printer className="w-5 h-5 text-white" />, bookId: "usaha-percetakan" },
  { slug: "gadget", label: "Gadget", color: "from-indigo-500 to-indigo-600", icon: <Smartphone className="w-5 h-5 text-white" />, bookId: "usaha-gadget" },
  { slug: "laptop", label: "Komputer & Laptop", color: "from-violet-500 to-purple-600", icon: <Monitor className="w-5 h-5 text-white" />, bookId: "usaha-laptop" },
  { slug: "warkop", label: "Kedai Kopi", color: "from-orange-400 to-orange-500", icon: <Coffee className="w-5 h-5 text-white" />, bookId: "usaha-warkop" },
  { slug: "konveksi", label: "Fashion & Konveksi", color: "from-pink-400 to-pink-500", icon: <Shirt className="w-5 h-5 text-white" />, bookId: "usaha-konveksi" },
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
  const { currentUser, setBranch } = useSessionStore();
  const [showNotif, setShowNotif] = useState(false);

  const allTransactions = useLiveQuery(() => db.transactions.toArray()) || [];
  const allInventory = useLiveQuery(() => db.inventory.toArray()) || [];
  const allCashflows = useLiveQuery(() => db.cashflows.toArray()) || [];
  const allWallets = useLiveQuery(() => db.wallets.toArray()) || [];
  const allCustomers = useLiveQuery(() => db.customers.toArray()) || [];
  const allPiutang = useLiveQuery(() => db.piutang.toArray()) || [];

  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const todayTx = allTransactions.filter((tx) => tx.tanggal.slice(0, 10) === todayStr);
    const monthTx = allTransactions.filter((tx) => {
      const d = parseISO(tx.tanggal);
      return d >= monthStart && d <= monthEnd;
    });
    const lastMonthTx = allTransactions.filter((tx) => {
      const d = parseISO(tx.tanggal);
      return d >= lastMonthStart && d <= lastMonthEnd;
    });

    const totalHariIni = todayTx.reduce((s, tx) => s + tx.totalBruto, 0);
    const totalBulanIni = monthTx.reduce((s, tx) => s + tx.totalBruto, 0);
    const totalBulanLalu = lastMonthTx.reduce((s, tx) => s + tx.totalBruto, 0);
    const piutangAktif = allTransactions.filter((tx) => tx.sisaTagihan > 0).reduce((s, tx) => s + tx.sisaTagihan, 0);
    const stokMenipis = allInventory.filter((item) => item.stok <= item.stokMin);
    const stokHabis = allInventory.filter((item) => item.stok === 0);
    const cashflowMasuk = allCashflows.filter((c) => c.tipe === "masuk").reduce((s, c) => s + c.nominal, 0);
    const cashflowKeluar = allCashflows.filter((c) => c.tipe === "keluar").reduce((s, c) => s + c.nominal, 0);
    const totalSaldo = allWallets.reduce((s, w) => s + w.saldo, 0);
    const persentasePerubahan = totalBulanLalu > 0 ? Math.round(((totalBulanIni - totalBulanLalu) / totalBulanLalu) * 100) : totalBulanIni > 0 ? 100 : 0;

    const piutangDueSoon = allPiutang.filter((p) => {
      if (p.status !== "AKTIF") return false;
      const diff = parseISO(p.jatuhTempo).getTime() - now.getTime();
      return diff <= 3 * 24 * 60 * 60 * 1000 && diff >= 0;
    });

    return {
      totalHariIni, totalBulanIni, totalBulanLalu, jumlahTransaksi: allTransactions.length,
      piutangAktif, stokMenipisCount: stokMenipis.length, stokHabisCount: stokHabis.length,
      cashflowMasuk, cashflowKeluar, labaBersih: cashflowMasuk - cashflowKeluar,
      totalSaldo, piutangDueSoon, persentasePerubahan, jumlahPelanggan: allCustomers.length,
    };
  }, [allTransactions, allInventory, allCashflows, allWallets, allCustomers, allPiutang]);

  const branchStats = useMemo(() => {
    return BRANCHES.map((b) => {
      const txs = allTransactions.filter((tx) => tx.bookOrBranchId === b.bookId);
      const cf = allCashflows.filter((c) => c.bookOrBranchId === b.bookId);
      const inv = allInventory.filter((i) => i.bookOrBranchId === b.bookId);
      const wallets = allWallets.filter((w) => w.bookOrBranchId === b.bookId);

      const totalPenjualan = txs.reduce((s, tx) => s + tx.totalBruto, 0);
      const masuk = cf.filter((c) => c.tipe === "masuk").reduce((s, c) => s + c.nominal, 0);
      const keluar = cf.filter((c) => c.tipe === "keluar").reduce((s, c) => s + c.nominal, 0);
      const saldo = wallets.reduce((s, w) => s + w.saldo, 0);
      const stokMenipis = inv.filter((i) => i.stok <= i.stokMin).length;
      const piutang = txs.filter((tx) => tx.sisaTagihan > 0).reduce((s, tx) => s + tx.sisaTagihan, 0);

      return { ...b, totalPenjualan, masuk, keluar, saldo, stokMenipis, piutang, jumlahTx: txs.length };
    });
  }, [allTransactions, allCashflows, allInventory, allWallets]);

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

  const notifCount = stats.stokMenipisCount + stats.stokHabisCount + stats.piutangDueSoon.length;

  const handleSelectBranch = (slug: string) => {
    setBranch(slug);
    router.push(`/buku-usaha/${slug}`);
  };

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
          <button onClick={() => router.push("/buku-global")} className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center scale-press">
            <Settings className="w-5 h-5 text-slate-500" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showNotif && notifCount > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="premium-card p-4 border-amber-300/40 dark:border-amber-700/40">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-heading font-extrabold">Notifikasi Global</span>
              </div>
              {stats.stokMenipisCount > 0 && <p className="text-[11px] py-1 flex items-center gap-2"><span className="badge-alert">{stats.stokMenipisCount}</span> produk stok menipis</p>}
              {stats.stokHabisCount > 0 && <p className="text-[11px] py-1 flex items-center gap-2"><span className="badge-alert">{stats.stokHabisCount}</span> produk stok habis</p>}
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
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Saldo Semua Cabang</span>
          </div>
        </div>
        <p className="text-xl font-heading font-extrabold text-[#008CEB] dark:text-[#4DA3E0] tracking-tight">Rp{stats.totalSaldo.toLocaleString()}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Hari Ini", value: `Rp${stats.totalHariIni.toLocaleString()}`, color: "emerald", icon: <TrendingUp className="w-4 h-4" /> },
          { label: "Total Transaksi", value: String(stats.jumlahTransaksi), color: "blue", icon: <ShoppingCart className="w-4 h-4" /> },
          { label: "Piutang Aktif", value: `Rp${stats.piutangAktif.toLocaleString()}`, color: "amber", icon: <Clock className="w-4 h-4" /> },
          { label: "Laba Bersih", value: `Rp${stats.labaBersih.toLocaleString()}`, color: stats.labaBersih >= 0 ? "emerald" : "rose", icon: stats.labaBersih >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" /> },
        ].map((s, i) => (
          <div key={s.label} className="premium-card premium-card-glow p-4 flex flex-col gap-1 animate-slide-up" style={{ animationDelay: `${100 + i * 60}ms`, animationFillMode: "backwards" }}>
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

      <div className="animate-slide-up" style={{ animationDelay: "450ms", animationFillMode: "backwards" }}>
        <div className="flex items-center gap-2 mb-3">
          <Store className="w-4 h-4 text-[#008CEB]" />
          <span className="text-xs font-heading font-extrabold">Unit Usaha</span>
          <span className="text-[9px] text-slate-400 font-bold ml-auto">{BRANCHES.length} buku</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {branchStats.map((b, i) => (
            <button
              key={b.slug}
              onClick={() => handleSelectBranch(b.slug)}
              className="premium-card premium-card-glow p-3 text-left scale-press animate-slide-up"
              style={{ animationDelay: `${480 + i * 60}ms`, animationFillMode: "backwards" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${b.color} flex items-center justify-center text-lg shadow-md`}>{b.icon}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-heading font-bold line-clamp-1">{b.label}</p>
                  <p className="text-[9px] text-slate-400">{b.jumlahTx} transaksi</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg px-2 py-1">
                  <p className="text-[8px] text-emerald-600 font-bold">Masuk</p>
                  <p className="text-[10px] font-heading font-extrabold text-emerald-600 dark:text-emerald-400">Rp{(b.masuk / 1000).toFixed(0)}rb</p>
                </div>
                <div className="bg-rose-50 dark:bg-rose-950/20 rounded-lg px-2 py-1">
                  <p className="text-[8px] text-rose-600 font-bold">Keluar</p>
                  <p className="text-[10px] font-heading font-extrabold text-rose-600 dark:text-rose-400">Rp{(b.keluar / 1000).toFixed(0)}rb</p>
                </div>
              </div>
              {(b.stokMenipis > 0 || b.piutang > 0) && (
                <div className="flex gap-1.5 mt-1.5">
                  {b.stokMenipis > 0 && <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 font-bold">{b.stokMenipis} stok tipis</span>}
                  {b.piutang > 0 && <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 font-bold">piutang</span>}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="premium-card premium-card-glow p-4 animate-slide-up" style={{ animationDelay: "700ms", animationFillMode: "backwards" }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[10px] font-heading font-extrabold text-slate-400 uppercase tracking-wider">Riwayat Terakhir (Global)</h3>
        </div>
        {recentTx.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">Belum ada transaksi</div>
        ) : (
          <div className="space-y-2">
            {recentTx.map((tx) => {
              const branch = BRANCHES.find((b) => b.bookId === tx.bookOrBranchId);
              return (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-zinc-900/50 rounded-lg px-2 -mx-2 transition-all">
                  <div className="min-w-0">
                    <p className="text-xs font-heading font-bold line-clamp-1">{tx.customerNama}</p>
                    <p className="text-[9px] text-slate-400 font-medium">{tx.items.length} item {branch && <span className={`inline-block px-1 py-0 rounded text-[8px] font-bold bg-gradient-to-r ${branch.color} text-white ml-1`}>{branch.label}</span>}</p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-xs font-heading font-extrabold text-[#008CEB]">Rp{tx.totalBruto.toLocaleString()}</p>
                    <span className={`inline-block text-[8px] px-2 py-0.5 rounded-full font-bold mt-0.5 ${tx.sisaTagihan === 0 ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"}`}>
                      {tx.sisaTagihan === 0 ? "LUNAS" : "PIUTANG"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 animate-slide-up" style={{ animationDelay: "750ms", animationFillMode: "backwards" }}>
        <div className="premium-card p-4 flex flex-col gap-1.5 border-emerald-200/40 dark:border-emerald-900/30">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 pulse-dot" />
            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Total Pemasukan</span>
          </div>
          <p className="text-sm font-heading font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">Rp{stats.cashflowMasuk.toLocaleString()}</p>
        </div>
        <div className="premium-card p-4 flex flex-col gap-1.5 border-rose-200/40 dark:border-rose-900/30">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500 pulse-dot" />
            <span className="text-[9px] text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider">Total Pengeluaran</span>
          </div>
          <p className="text-sm font-heading font-extrabold text-rose-600 dark:text-rose-400 tracking-tight">Rp{stats.cashflowKeluar.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
