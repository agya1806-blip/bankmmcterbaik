"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/engines/identity/auth-store";
import { useWorkspaceStore } from "@/engines/workspace/workspace-store";
import { useFinancialStore } from "@/engines/financial/financial-store";
import { useOrderStore } from "@/engines/business/order-store";
import {
  Search, Bell, ChevronDown, ArrowUpRight, ArrowDownRight,
  TrendingUp, TrendingDown, Wallet, ShoppingCart,
  User, Plus, QrCode, Users,
  Activity, Building2, LayoutDashboard
} from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { activeWorkspace, workspaces, loadWorkspaces, selectWorkspace } = useWorkspaceStore();
  const { accounts, transactions, loadAccounts, loadCategories, loadTransactions } = useFinancialStore();
  const { orders, loadOrders } = useOrderStore();

  const [navTab, setNavTab] = useState<"beranda" | "aktivitas" | "manajemen" | "profil">("beranda");
  const [showWs, setShowWs] = useState(false);
  const [allData, setAllData] = useState({
    customers: [] as any[],
    products: [] as any[],
    suppliers: [] as any[],
    qrisPm: [] as any[],
  });

  useEffect(() => {
    if (user) {
      loadWorkspaces(user.id);
    }
  }, [user, loadWorkspaces]);

  useEffect(() => {
    if (activeWorkspace) {
      loadAccounts(activeWorkspace.id);
      loadCategories(activeWorkspace.id);
      loadTransactions(activeWorkspace.id);
      loadOrders(activeWorkspace.id);
      import("@/lib/db").then((db) => {
        db.getCustomersByWorkspace(activeWorkspace.id).then((c: any[]) => setAllData(p => ({ ...p, customers: c })));
        db.getProductsByWorkspace(activeWorkspace.id).then((p: any[]) => setAllData(s => ({ ...s, products: p })));
        db.getQrisPaymentsByWorkspace(activeWorkspace.id).then((q: any[]) => setAllData(s => ({ ...s, qrisPm: q })));
        db.getSuppliersByWorkspace(activeWorkspace.id).then((s: any[]) => setAllData(p => ({ ...p, suppliers: s })));
      });
    }
  }, [activeWorkspace, loadAccounts, loadCategories, loadTransactions, loadOrders]);

  if (!user) return null;

  const currency = activeWorkspace?.currency || "IDR";
  const balance = accounts.reduce((s, a) => s + a.balance, 0);
  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const orderCount = orders.length;
  const customerCount = allData.customers.length;
  const productCount = allData.products.length;
  const qrisCollect = allData.qrisPm.filter((p: any) => p.status === "paid").reduce((s: number, p: any) => s + p.amount, 0);

  const recentTx = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()).slice(0, 3);

  const wsTypeLabel = (t: string) => ({ pribadi: "Buku Pribadi", usaha: "Buku Usaha", hutang: "Buku Hutang", modal: "Buku Modal", toko: "Toko Online" }[t] || t);

  const initials = user.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  const activeLabel = activeWorkspace ? wsTypeLabel(activeWorkspace.type) : "Pilih Buku";
  const activeName = activeWorkspace?.name || "Dashboard";

  const bottomNav = [
    { id: "beranda", icon: LayoutDashboard, label: "Beranda" },
    { id: "aktivitas", icon: Activity, label: "Aktivitas" },
    { id: "manajemen", icon: Building2, label: "Manajemen" },
    { id: "profil", icon: User, label: "Profil" },
  ] as const;

  function renderActivityLog() {
    const items = [
      ...recentTx.map((tx) => ({
        id: tx.id,
        icon: tx.type === "income" ? ArrowUpRight : ArrowDownRight,
        iconBg: tx.type === "income" ? "text-emerald-400" : "text-red-400",
        desc: tx.description || (tx.type === "income" ? "Pemasukan" : "Pengeluaran"),
        source: activeWorkspace?.name || "",
        nominal: tx.type === "income" ? `+${currency} ${tx.amount.toLocaleString()}` : `-${currency} ${tx.amount.toLocaleString()}`,
        status: "Sukses",
        statusDot: "success",
      })),
      ...recentOrders.map((o) => ({
        id: o.id,
        icon: ShoppingCart,
        iconBg: "text-blue-400",
        desc: `Pesanan #${o.number || o.id.slice(0, 8)}`,
        source: activeWorkspace?.name || "",
        nominal: `${currency} ${o.total.toLocaleString()}`,
        status: o.paymentStatus === "Lunas" ? "Sukses" : o.paymentStatus === "DP" ? "Diproses" : "Menunggu",
        statusDot: o.paymentStatus === "Lunas" ? "success" : o.paymentStatus === "DP" ? "warning" : "info",
      })),
    ].slice(0, 5);

    return items.map((item, i) => (
      <div key={item.id}>
        <div className="flex items-center gap-3 py-3">
          <div className={`flex items-center justify-center size-9 rounded-xl bg-white/[0.04] ${item.iconBg}`}>
            <item.icon className="size-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white/90 truncate">{item.desc}</p>
            <p className="text-[11px] text-white/40 truncate">{item.source}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-white/90">{item.nominal}</p>
            <div className="flex items-center gap-1.5 justify-end">
              <span className={`luxury-status-dot luxury-status-dot-${item.statusDot}`} />
              <span className="text-[10px] text-white/50">{item.status}</span>
            </div>
          </div>
        </div>
        {i < items.length - 1 && <div className="luxury-divider" />}
      </div>
    ));
  }

  if (workspaces.length === 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[hsl(220,18%,6%)] z-50">
        <div className="text-center max-w-sm px-6">
          <div className="flex items-center justify-center size-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white font-bold text-2xl mx-auto mb-4 shadow-xl shadow-amber-500/20 luxury-border-gradient">M</div>
          <h2 className="text-xl font-bold font-heading text-white mb-2 luxury-heading">Selamat Datang</h2>
          <p className="text-sm text-white/50 mb-6">Buat buku pertama Anda untuk memulai</p>
          <button onClick={() => router.push("/workspaces")} className="luxury-pill text-white bg-amber-600/20 border-amber-500/30 hover:bg-amber-600/30">
            <Plus className="size-4" /> Buat Buku Baru
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(220,18%,6%)] text-white/90 pb-24">
      {/* Floating Header */}
      <div className="luxury-floating-header">
        <div className="luxury-floating-header-inner">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white font-bold text-sm shadow-lg shadow-amber-500/20">M</div>
            <div className="relative">
              <button onClick={() => setShowWs(!showWs)} className="flex items-center gap-2 text-left">
                <div>
                  <p className="text-xs text-white/50 leading-tight">{activeLabel}</p>
                  <p className="text-sm font-semibold text-white leading-tight truncate max-w-[120px]">{activeName}</p>
                </div>
                <ChevronDown className="size-3.5 text-white/40" />
              </button>
              {showWs && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowWs(false)} />
                  <div className="absolute top-full left-0 mt-2 z-50 w-64 rounded-2xl overflow-hidden border border-white/[0.06] shadow-2xl" style={{ background: 'hsl(220 18% 9% / 0.98)', backdropFilter: 'blur(24px)' }}>
                    <div className="p-2 space-y-1">
                      {workspaces.map((ws) => (
                        <button
                          key={ws.id}
                          onClick={() => { selectWorkspace(ws.id, user.id); setShowWs(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${ws.id === activeWorkspace?.id ? 'bg-amber-500/10 text-amber-400' : 'text-white/70 hover:text-white hover:bg-white/[0.04]'}`}
                        >
                          <span className="text-lg">{ws.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{ws.name}</p>
                            <p className="text-[10px] text-white/40">{wsTypeLabel(ws.type)}</p>
                          </div>
                          {ws.id === activeWorkspace?.id && <div className="size-1.5 rounded-full bg-amber-500 shadow-[0_0_6px_hsl(42_60%_58%/0.4)]" />}
                        </button>
                      ))}
                    </div>
                    <div className="border-t border-white/[0.06] p-2">
                      <button onClick={() => { setShowWs(false); router.push("/workspaces"); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:text-white hover:bg-white/[0.04] text-sm transition-all">
                        <Plus className="size-4" /> Kelola Buku
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className="flex items-center justify-center size-9 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.04] transition-all"><Search className="size-[18px]" /></button>
            <button className="flex items-center justify-center size-9 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.04] transition-all relative">
              <Bell className="size-[18px]" />
              <span className="absolute top-2 right-2 size-1.5 rounded-full bg-amber-500 shadow-[0_0_6px_hsl(42_60%_58%/0.5)]" />
            </button>
            <div className="w-px h-6 bg-white/[0.06] mx-1" />
            <div className="flex items-center justify-center size-9 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-white text-xs font-bold shadow-lg shadow-amber-500/20 ring-2 ring-white/[0.08]">
              {initials}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20 px-4 max-w-lg mx-auto space-y-5">
        {/* Welcome Banner */}
        <div className="space-y-1 pt-2">
          <h1 className="luxury-heading text-2xl text-white">
            Selamat datang kembali,<br />
            <span className="text-amber-400/90">{user.name || "Pengguna"}</span>
          </h1>
          <p className="text-sm text-white/40">Seluruh sistem operasional berjalan optimal. Berikut ringkasan performa finansial Anda hari ini.</p>
        </div>

        {/* Global Balance Card */}
        <div className="luxury-card luxury-card-gold p-5 luxury-border-gradient">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-amber-300/70 uppercase tracking-wider">Total Saldo Konsolidasi</p>
            <span className="luxury-sparkline luxury-sparkline-up">
              <TrendingUp className="size-3" /> 5% dari bulan lalu
            </span>
          </div>
          <p className="luxury-heading text-3xl text-amber-200/90 mb-4">{currency} {balance.toLocaleString()}</p>
          <div className="flex gap-3">
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.06] transition-all active:scale-[0.98]">
              <ArrowUpRight className="size-4" /> Transfer Dana
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.06] transition-all active:scale-[0.98]">
              <Building2 className="size-4" /> Kelola Workspace
            </button>
          </div>
        </div>

        {/* Revenue vs Expenses */}
        <div className="grid grid-cols-2 gap-3">
          <div className="luxury-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center justify-center size-7 rounded-lg bg-emerald-500/10"><TrendingUp className="size-3.5 text-emerald-400" /></div>
              <p className="text-xs text-white/50">Total Pendapatan</p>
            </div>
            <p className="text-lg font-bold font-heading text-emerald-400">{currency} {totalIncome.toLocaleString()}</p>
            <span className="luxury-sparkline luxury-sparkline-up mt-1"><ArrowUpRight className="size-3" /> Aktif</span>
          </div>
          <div className="luxury-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center justify-center size-7 rounded-lg bg-red-500/10"><TrendingDown className="size-3.5 text-red-400" /></div>
              <p className="text-xs text-white/50">Total Pengeluaran</p>
            </div>
            <p className="text-lg font-bold font-heading text-red-400">{currency} {totalExpense.toLocaleString()}</p>
            <span className="luxury-sparkline luxury-sparkline-down mt-1"><ArrowDownRight className="size-3" /> {totalExpense > 0 ? `${Math.round((totalExpense / (totalIncome || 1)) * 100)}%` : "0%"}</span>
          </div>
        </div>

        {/* Active Workspaces */}
        <div className="luxury-card p-5">
          <p className="text-sm font-semibold text-white/90 mb-4">Workspace Aktif</p>
          <div className="space-y-4">
            {workspaces.slice(0, 3).map((ws, i) => {
              const pct = Math.min(100, ((i + 1) * 33));
              return (
                <div key={ws.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{ws.icon}</span>
                      <p className="text-sm font-medium text-white/80 truncate max-w-[140px]">{ws.name}</p>
                    </div>
                    <p className="text-xs text-white/40">{wsTypeLabel(ws.type)}</p>
                  </div>
                  <div className="luxury-progress">
                    <div className="luxury-progress-bar" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          {workspaces.length > 3 && (
            <button onClick={() => router.push("/workspaces")} className="w-full mt-4 text-center text-xs text-amber-400/70 hover:text-amber-400 transition-colors">
              +{workspaces.length - 3} workspace lainnya
            </button>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="luxury-card p-3 text-center"><p className="text-[10px] text-white/40 mb-1">Pesanan</p><p className="text-lg font-bold font-heading text-white/90">{orderCount}</p></div>
          <div className="luxury-card p-3 text-center"><p className="text-[10px] text-white/40 mb-1">Pelanggan</p><p className="text-lg font-bold font-heading text-white/90">{customerCount}</p></div>
          <div className="luxury-card p-3 text-center"><p className="text-[10px] text-white/40 mb-1">Produk</p><p className="text-lg font-bold font-heading text-white/90">{productCount}</p></div>
          <div className="luxury-card p-3 text-center"><p className="text-[10px] text-white/40 mb-1">QRIS</p><p className="text-lg font-bold font-heading text-white/90">{currency} {qrisCollect.toLocaleString()}</p></div>
        </div>

        {/* Activity Log */}
        <div className="luxury-card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-white/90">Aktivitas Terbaru</p>
            <button onClick={() => router.push("/transactions")} className="text-xs text-amber-400/70 hover:text-amber-400 transition-colors">Lihat Semua</button>
          </div>
          <div className="flex items-center gap-4 pb-2 mb-1 text-[10px] text-white/30 font-medium uppercase tracking-wider border-b border-white/[0.04]">
            <span className="w-16 shrink-0">ID</span>
            <span className="flex-1">Deskripsi / Log</span>
            <span className="w-20 text-right shrink-0">Nominal</span>
            <span className="w-16 text-right shrink-0">Status</span>
          </div>
          {recentTx.length === 0 && recentOrders.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-white/30 mb-3">Belum ada aktivitas</p>
              <button onClick={() => router.push("/transactions")} className="luxury-pill text-xs text-white/70 bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.08]">
                <Plus className="size-3" /> Tambah Transaksi
              </button>
            </div>
          ) : renderActivityLog()}
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => router.push("/orders")} className="luxury-card p-4 flex items-center gap-3 text-left active:scale-[0.98]">
            <div className="flex items-center justify-center size-10 rounded-xl bg-blue-500/10 text-blue-400"><ShoppingCart className="size-5" /></div>
            <div><p className="text-sm font-semibold text-white/90">Pesanan</p><p className="text-[10px] text-white/40">{orderCount} aktif</p></div>
          </button>
          <button onClick={() => router.push("/qris")} className="luxury-card p-4 flex items-center gap-3 text-left active:scale-[0.98]">
            <div className="flex items-center justify-center size-10 rounded-xl bg-emerald-500/10 text-emerald-400"><QrCode className="size-5" /></div>
            <div><p className="text-sm font-semibold text-white/90">QRIS</p><p className="text-[10px] text-white/40">{currency} {qrisCollect.toLocaleString()}</p></div>
          </button>
          <button onClick={() => router.push("/accounts")} className="luxury-card p-4 flex items-center gap-3 text-left active:scale-[0.98]">
            <div className="flex items-center justify-center size-10 rounded-xl bg-amber-500/10 text-amber-400"><Wallet className="size-5" /></div>
            <div><p className="text-sm font-semibold text-white/90">Akun</p><p className="text-[10px] text-white/40">{accounts.length} terdaftar</p></div>
          </button>
          <button onClick={() => router.push("/customers")} className="luxury-card p-4 flex items-center gap-3 text-left active:scale-[0.98]">
            <div className="flex items-center justify-center size-10 rounded-xl bg-violet-500/10 text-violet-400"><Users className="size-5" /></div>
            <div><p className="text-sm font-semibold text-white/90">Pelanggan</p><p className="text-[10px] text-white/40">{customerCount} kontak</p></div>
          </button>
        </div>
      </div>

      {/* Luxury Bottom Navigation */}
      <div className="luxury-master-footer">
        <div className="luxury-master-footer-inner">
          {bottomNav.map((item) => {
            const isActive = navTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setNavTab(item.id);
                  if (item.id === "aktivitas") router.push("/transactions");
                  else if (item.id === "manajemen") router.push("/workspaces");
                  else if (item.id === "profil") router.push("/settings");
                }}
                className={`luxury-footer-item ${isActive ? "luxury-footer-item-active" : ""}`}
              >
                <item.icon className={`luxury-footer-icon ${isActive ? "luxury-footer-icon-active" : "luxury-footer-icon-inactive"}`} />
                <span className={`luxury-footer-label ${isActive ? "luxury-footer-label-active" : "luxury-footer-label-inactive"}`}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
