"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { 
  DollarSign, TrendingUp, TrendingDown, AlertTriangle, ShoppingCart, Package,
  Users, Truck, Wallet, ArrowRightLeft, FileText, Bell, Clock, ShoppingBag,
  BarChart3, CreditCard, ChevronRight, PieChart,
  ClipboardList, Layers, BanknoteIcon,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";

interface PerBranchItem {
  branch: string; label: string; pendapatan: number; labaBersih: number;
  cashMasuk: number; cashKeluar: number; piutang: number;
  jumlahProduk: number; stokMenipis: number; jumlahTransaksi: number;
}
interface TodayData { todayPendapatan: number; todayPengeluaran: number; todayLaba: number; }
interface Activity { id: string; tipe: string; desc: string; nominal: number; tanggal: string; }
interface Notifications { piutangDueSoon: number; stokHabis: number; stokMenipis: number; backupDone: boolean; }

interface Props {
  dashData: { totalPendapatan: number; totalTransaksi: number; totalPelanggan: number; totalProduk: number; stokMenipisCount: number; piutangAktifCount: number; totalPiutang: number; perBranch: PerBranchItem[]; };
  last7Days: Array<{ date: string; pemasukan: number; pengeluaran: number; }>;
  branchRevenue: Array<{ name: string; revenue: number; }>;
  todayData: TodayData;
  saldoKas: number;
  totalHutang: number;
  recentActivity: Activity[];
  notifications: Notifications;
  currentUser: { nama: string; fotoUrl?: string } | null;
  allTransactions: any[];
  allCashflows: any[];
  allPiutang: any[];
  allInventory: any[];
  allWallets: any[];
  allCustomers: any[];
}

export default function GlobalKpiCards({ dashData, last7Days, branchRevenue, todayData, saldoKas, totalHutang, recentActivity, notifications, currentUser }: Props) {
  const router = useRouter();
  const today = new Date();

  const quickActions = useMemo(() => [
    { label: "Transaksi Baru", icon: <ShoppingCart className="w-5 h-5" />, color: "from-blue-500 to-blue-600", onClick: () => router.push("/buku-usaha/usaha") },
    { label: "Produk Baru", icon: <Package className="w-5 h-5" />, color: "from-emerald-500 to-emerald-600", onClick: () => router.push("/buku-usaha/usaha") },
    { label: "Pelanggan Baru", icon: <Users className="w-5 h-5" />, color: "from-violet-500 to-violet-600", onClick: () => router.push("/buku-usaha/usaha") },
    { label: "Supplier Baru", icon: <Truck className="w-5 h-5" />, color: "from-amber-500 to-amber-600", onClick: () => alert("Fitur supplier segera hadir") },
    { label: "Cashflow", icon: <Wallet className="w-5 h-5" />, color: "from-cyan-500 to-cyan-600", onClick: () => router.push("/buku-usaha/usaha") },
    { label: "Transfer", icon: <ArrowRightLeft className="w-5 h-5" />, color: "from-rose-500 to-rose-600", onClick: () => alert("Fitur transfer segera hadir") },
    { label: "Purchase Order", icon: <ClipboardList className="w-5 h-5" />, color: "from-orange-500 to-orange-600", onClick: () => alert("Purchase order segera hadir") },
    { label: "Produksi Baru", icon: <Layers className="w-5 h-5" />, color: "from-purple-500 to-purple-600", onClick: () => router.push("/buku-usaha/usaha") },
  ], [router]);

  const shortcutModules = useMemo(() => [
    { label: "Kasir", icon: <BanknoteIcon className="w-5 h-5" />, color: "from-blue-500 to-blue-600", desc: "Proses transaksi penjualan", path: "/buku-usaha/usaha" },
    { label: "Inventory", icon: <Package className="w-5 h-5" />, color: "from-emerald-500 to-emerald-600", desc: "Manajemen stok barang", path: "/buku-usaha/usaha" },
    { label: "Customer", icon: <Users className="w-5 h-5" />, color: "from-violet-500 to-violet-600", desc: "Daftar & riwayat pelanggan", path: "/buku-usaha/usaha" },
    { label: "Supplier", icon: <Truck className="w-5 h-5" />, color: "from-amber-500 to-amber-600", desc: "Manajemen supplier", path: "" },
    { label: "Produksi", icon: <Layers className="w-5 h-5" />, color: "from-purple-500 to-purple-600", desc: "Manajemen produksi", path: "/buku-usaha/usaha" },
    { label: "Keuangan", icon: <BarChart3 className="w-5 h-5" />, color: "from-rose-500 to-rose-600", desc: "Ringkasan & cashflow", path: "/buku-usaha" },
    { label: "Laporan", icon: <FileText className="w-5 h-5" />, color: "from-cyan-500 to-cyan-600", desc: "Laporan penjualan", path: "/buku-usaha/usaha" },
  ], []);

  const handleShortcut = (path: string, label: string) => {
    if (!path) { alert(`${label} segera hadir`); return; }
    router.push(path);
  };

  const kpiItems = [
    { label: "Pendapatan Hari Ini", value: todayData.todayPendapatan, icon: <DollarSign className="w-5 h-5" />, color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600", format: "currency" },
    { label: "Pengeluaran Hari Ini", value: todayData.todayPengeluaran, icon: <TrendingDown className="w-5 h-5" />, color: "bg-rose-100 dark:bg-rose-900/30 text-rose-500", format: "currency" },
    { label: "Laba Hari Ini", value: Math.abs(todayData.todayLaba), icon: todayData.todayLaba >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />, color: todayData.todayLaba >= 0 ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600" : "bg-rose-100 dark:bg-rose-900/30 text-rose-500", format: "currency", suffix: todayData.todayLaba < 0 ? " (rugi)" : "" },
    { label: "Saldo Kas", value: saldoKas, icon: <BanknoteIcon className="w-5 h-5" />, color: "bg-blue-100 dark:bg-blue-900/30 text-[#008CEB]", format: "currency" },
    { label: "Total Piutang", value: dashData.totalPiutang, icon: <CreditCard className="w-5 h-5" />, color: "bg-amber-100 dark:bg-amber-900/30 text-amber-600", format: "currency", count: dashData.piutangAktifCount },
    { label: "Total Hutang", value: totalHutang, icon: <CreditCard className="w-5 h-5" />, color: "bg-orange-100 dark:bg-orange-900/30 text-orange-600", format: "currency" },
    { label: "Jumlah Transaksi", value: dashData.totalTransaksi, icon: <ShoppingCart className="w-5 h-5" />, color: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600", format: "number" },
    { label: "Produk Hampir Habis", value: dashData.stokMenipisCount, icon: <AlertTriangle className="w-5 h-5" />, color: "bg-red-100 dark:bg-red-900/30 text-red-600", format: "number", warning: true },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-8">

      {/* ───── 1. WELCOME ───── */}
      <div className="flex items-start justify-between px-1">
        <div className="space-y-1">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            {format(today, "EEEE", { locale: idLocale })}
          </p>
          <h1 className="text-2xl font-heading font-extrabold tracking-tight">
            Selamat {today.getHours() < 12 ? "pagi" : today.getHours() < 18 ? "siang" : "malam"}, {currentUser?.nama || "Admin"}
          </h1>
          <p className="text-[11px] text-slate-400">
            {format(today, "d MMMM yyyy", { locale: idLocale })}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Total {dashData.totalTransaksi} transaksi &middot; {dashData.totalPelanggan} pelanggan
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#008CEB] to-[#00C9A7] flex items-center justify-center text-white text-lg font-extrabold overflow-hidden shadow-md shrink-0">
          {currentUser?.fotoUrl ? (
            <img src={currentUser.fotoUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            currentUser?.nama?.charAt(0)?.toUpperCase() || "?"
          )}
        </div>
      </div>

      {/* ───── 2. QUICK ACTIONS ───── */}
      <div>
        <h2 className="text-xs font-bold mb-3 text-slate-700 dark:text-slate-300 px-1">Aksi Cepat</h2>
        <div className="grid grid-cols-4 gap-2 px-1">
          {quickActions.map((a) => (
            <button key={a.label} onClick={a.onClick}
              className="flex flex-col items-center gap-1 p-2.5 rounded-2xl bg-white dark:bg-[#1a1b2e] shadow-sm border border-slate-100 dark:border-slate-800 active:scale-95 transition-all">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center text-white shadow-sm`}>
                {a.icon}
              </div>
              <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 text-center leading-tight">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ───── 3. KPI Cards ───── */}
      <div>
        <h2 className="text-xs font-bold mb-3 text-slate-700 dark:text-slate-300 px-1">Ringkasan</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 px-1">
          {kpiItems.map((item, idx) => {
            const colorClasses = item.color || "bg-slate-100 dark:bg-zinc-800 text-slate-500";
            const formattedValue = item.format === "number"
              ? item.value.toLocaleString()
              : `Rp${item.value.toLocaleString()}${item.suffix || ""}`;
            return (
              <div key={idx} className="bg-white dark:bg-[#1a1b2e] rounded-2xl p-3 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col gap-1">
                <div className={`w-7 h-7 rounded-xl ${colorClasses} flex items-center justify-center`}>
                  {item.icon}
                </div>
                <span className="text-[9px] text-slate-400 font-bold uppercase">{item.label}</span>
                <p className="text-sm font-heading font-extrabold">{formattedValue}</p>
                {item.count != null && <span className="text-[9px] text-slate-400">{item.count} aktif</span>}
                {item.warning && item.value > 0 && <span className="text-[9px] text-red-500">Butuh perhatian</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* ───── 4. CHARTS ───── */}
      <div className="px-1">
        <h2 className="text-xs font-bold mb-3 text-slate-700 dark:text-slate-300">Grafik</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white dark:bg-[#1a1b2e] rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-bold">Pendapatan 7 Hari</span>
            </div>
            {last7Days.every((d) => d.pemasukan === 0 && d.pengeluaran === 0) ? (
              <div className="h-[200px] flex flex-col items-center justify-center text-slate-400">
                <BarChart3 className="w-8 h-8 mb-2 text-slate-300" />
                <p className="text-xs">Belum ada data</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={last7Days}>
                  <defs>
                    <linearGradient id="colorPendapatan" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="pemasukan" stroke="#10b981" fill="url(#colorPendapatan)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white dark:bg-[#1a1b2e] rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <PieChart className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-bold">Cashflow Bulanan</span>
            </div>
            <div className="h-[200px] flex flex-col items-center justify-center text-slate-400">
              <BarChart3 className="w-8 h-8 mb-2 text-slate-300" />
              <p className="text-xs">Belum tersedia</p>
              <p className="text-[9px] text-slate-500 mt-1">Segera hadir</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1a1b2e] rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <ShoppingBag className="w-4 h-4 text-violet-500" />
              <span className="text-xs font-bold">Penjualan per Cabang</span>
            </div>
            {branchRevenue.length === 0 ? (
              <div className="h-[200px] flex flex-col items-center justify-center text-slate-400">
                <BarChart3 className="w-8 h-8 mb-2 text-slate-300" />
                <p className="text-xs">Belum ada data</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={branchRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Pendapatan" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ───── 5. RECENT ACTIVITY ───── */}
      <div className="px-1">
        <h2 className="text-xs font-bold mb-3 text-slate-700 dark:text-slate-300">Aktivitas Terbaru</h2>
        <div className="bg-white dark:bg-[#1a1b2e] rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
          {recentActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <Clock className="w-8 h-8 mb-2 text-slate-300" />
              <p className="text-xs">Belum ada aktivitas</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentActivity.map((act) => {
                const isIncome = act.tipe === "Pemasukan" || act.tipe === "CREATE";
                const isOutcome = act.tipe === "Pengeluaran";
                const isWarning = act.tipe === "DELETE" || act.tipe === "BATAL";
                const chipColor = isIncome ? "bg-emerald-100 text-emerald-700" : isOutcome ? "bg-rose-100 text-rose-700" : isWarning ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700";
                return (
                  <div key={act.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className={`inline-block text-[8px] px-1.5 py-0.5 rounded font-bold ${chipColor} shrink-0`}>{act.tipe}</span>
                    <p className="text-[11px] flex-1 min-w-0 truncate">{act.desc}</p>
                    <div className="text-right shrink-0 flex gap-2 items-center">
                      {act.nominal > 0 && <span className="text-[10px] font-bold">Rp{act.nominal.toLocaleString()}</span>}
                      <span className="text-[9px] text-slate-400">{new Date(act.tanggal).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ───── 6. NOTIFICATION CENTER ───── */}
      <div className="px-1">
        <h2 className="text-xs font-bold mb-3 text-slate-700 dark:text-slate-300">Notifikasi</h2>
        <div className="bg-white dark:bg-[#1a1b2e] rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
          {(notifications.piutangDueSoon === 0 && notifications.stokHabis === 0 && notifications.stokMenipis === 0) ? (
            <div className="flex flex-col items-center py-6 text-slate-400">
              <Bell className="w-8 h-8 mb-2 text-slate-300" />
              <p className="text-xs">Semua dalam keadaan baik</p>
              <p className="text-[9px] text-slate-500 mt-1">Nantinya akan ada notifikasi piutang & stok</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.piutangDueSoon > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 flex items-center gap-3">
                  <CreditCard className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-xs"><strong>{notifications.piutangDueSoon}</strong> piutang akan jatuh tempo</span>
                </div>
              )}
              {notifications.stokHabis > 0 && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                  <span className="text-xs"><strong>{notifications.stokHabis}</strong> produk telah habis</span>
                </div>
              )}
              {notifications.stokMenipis > 0 && (
                <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/20 flex items-center gap-3">
                  <Package className="w-4 h-4 text-orange-500 shrink-0" />
                  <span className="text-xs"><strong>{notifications.stokMenipis}</strong> produk hampir habis</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ───── 7. SHORTCUT MODULE ───── */}
      <div className="px-1">
        <h2 className="text-xs font-bold mb-3 text-slate-700 dark:text-slate-300">Modul</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {shortcutModules.map((mod) => (
            <button key={mod.label} onClick={() => handleShortcut(mod.path, mod.label)}
              className="bg-white dark:bg-[#1a1b2e] rounded-2xl p-3 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-3 active:scale-[0.98] transition-all text-left">
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

    </div>
  );
}