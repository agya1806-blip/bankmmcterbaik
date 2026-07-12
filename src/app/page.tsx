"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/engines/identity/auth-store";
import { useWorkspaceStore } from "@/engines/workspace/workspace-store";
import { useFinancialStore } from "@/engines/financial/financial-store";
import { useOrderStore } from "@/engines/business/order-store";
import { Button } from "@/components/ui/button";
import {
  QrCode, Plus, ArrowUpRight, ArrowDownRight,
  ShoppingCart, TrendingUp, TrendingDown, Wallet, PieChart,
  ArrowLeftRight, Users, CalendarDays, BarChart3, Package,
  ChevronRight
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import { getBusinessConfig } from "@/config/business-types";
import type { BusinessSubType } from "@/lib/db";
import { WorkspaceIcon } from "@/components/workspace-icon";

const datePrefix = (d: string | number | Date | undefined): string =>
  typeof d === "string" ? d.slice(0, 7) : d ? new Date(d).toISOString().slice(0, 7) : "";

function QuickActions({ type, router }: { type: string; router: ReturnType<typeof useRouter> }) {
  const actions: { href: string; icon: React.FC<{ className?: string }>; label: string; color: string }[] = [];

  if (type === "usaha" || type === "toko") {
    actions.push(
      { href: "/qris", icon: QrCode, label: "QRIS", color: "from-blue-500 to-blue-600" },
      { href: "/orders", icon: ShoppingCart, label: "Pesanan", color: "from-rose-500 to-rose-600" },
      { href: "/products", icon: Package, label: "Produk", color: "from-violet-500 to-violet-600" },
      { href: "/transactions", icon: Plus, label: "Catat", color: "from-emerald-500 to-emerald-600" },
    );
  } else if (type === "pribadi") {
    actions.push(
      { href: "/transactions", icon: Plus, label: "Catat", color: "from-emerald-500 to-emerald-600" },
      { href: "/accounts", icon: Wallet, label: "Akun", color: "from-blue-500 to-blue-600" },
      { href: "/budgets", icon: PieChart, label: "Anggaran", color: "from-violet-500 to-violet-600" },
    );
  } else if (type === "hutang") {
    actions.push(
      { href: "/debts", icon: ArrowLeftRight, label: "Hutang", color: "from-orange-500 to-orange-600" },
      { href: "/customers", icon: Users, label: "Kontak", color: "from-blue-500 to-blue-600" },
      { href: "/calendar", icon: CalendarDays, label: "Jadwal", color: "from-violet-500 to-violet-600" },
    );
  } else if (type === "modal") {
    actions.push(
      { href: "/transactions", icon: Plus, label: "Transaksi", color: "from-emerald-500 to-emerald-600" },
      { href: "/accounts", icon: Wallet, label: "Akun", color: "from-blue-500 to-blue-600" },
      { href: "/reports", icon: BarChart3, label: "Laporan", color: "from-violet-500 to-violet-600" },
    );
  }

  return (
    <div>
      <h2 className="text-sm font-semibold mb-3">Aksi Cepat</h2>
      <div className="grid grid-cols-5 gap-2">
        {actions.map((action) => (
          <button
            key={action.href}
            onClick={() => router.push(action.href)}
            className="premium-card p-3 flex flex-col items-center gap-1.5 hover:shadow-md transition-all active:scale-95"
          >
            <div className={`flex items-center justify-center size-12 rounded-xl bg-gradient-to-br ${action.color} shadow-lg`}>
              <action.icon className="size-5 text-white" />
            </div>
            <span className="text-xs font-medium text-center leading-tight">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function PribadiDashboard({ ws, currency }: { ws: { id: string; name: string; currency: string }; currency: string }) {
  const router = useRouter();
  const { accounts, transactions, budgets, loadAccounts, loadCategories, loadTransactions, loadBudgets } = useFinancialStore();

  useEffect(() => {
    if (ws) {
      loadAccounts(ws.id);
      loadCategories(ws.id);
      loadTransactions(ws.id);
      loadBudgets(ws.id);
    }
  }, [ws, loadAccounts, loadCategories, loadTransactions, loadBudgets]);

  const balance = accounts.reduce((s, a) => s + a.balance, 0);
  const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const netP = income - expense;
  const recent = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); return d.toISOString().slice(0, 7); }).reverse();
  const chartData = months.map((m) => ({ month: m.slice(5), income: transactions.filter((t) => t.type === "income" && datePrefix(t.date) === m).reduce((s, t) => s + t.amount, 0), expense: transactions.filter((t) => t.type === "expense" && datePrefix(t.date) === m).reduce((s, t) => s + t.amount, 0) }));

  return (
    <div className="space-y-5 animate-fade-in max-w-lg mx-auto pb-24">
      <div className="hero-gradient">
        <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">Total Saldo</p>
        <p className="text-3xl font-bold font-heading text-white mb-2">{currency} {balance.toLocaleString()}</p>
        <div className="flex gap-4">
          <span className="flex items-center gap-1 text-white/80 text-xs"><TrendingUp className="size-3.5 text-emerald-300" /> {currency} {income.toLocaleString()}</span>
          <span className="flex items-center gap-1 text-white/80 text-xs"><TrendingDown className="size-3.5 text-red-300" /> {currency} {expense.toLocaleString()}</span>
        </div>
      </div>
      <QuickActions type="pribadi" router={router} />
      <div className="grid grid-cols-2 gap-3">
        <div className="premium-stat"><p className="premium-stat-label">Laba Bersih</p><p className={`premium-stat-value ${netP >= 0 ? "text-emerald-600" : "text-red-500"}`}>{currency} {Math.abs(netP).toLocaleString()}</p></div>
        <div className="premium-stat"><p className="premium-stat-label">Anggaran Aktif</p><p className="premium-stat-value">{budgets.length}</p></div>
      </div>
      {chartData.some((d) => d.income > 0 || d.expense > 0) && (
        <div className="premium-card p-4">
          <p className="text-sm font-semibold mb-3">Arus Kas 6 Bulan</p>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} />
              <Bar dataKey="income" fill="#10b981" name="Pemasukan" radius={[3, 3, 0, 0]} />
              <Bar dataKey="expense" fill="#ef4444" name="Pengeluaran" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <div>
        <div className="flex items-center justify-between mb-3"><h2 className="text-sm font-semibold">Transaksi Terbaru</h2><button onClick={() => router.push("/transactions")} className="text-xs font-medium text-emerald-600">Lihat Semua</button></div>
        {recent.length === 0 ? (
          <div className="premium-card p-6 text-center">
            <p className="text-sm text-muted-foreground/60 mb-3">Belum ada transaksi</p>
            <Button variant="outline" size="sm" onClick={() => router.push("/transactions")}><Plus className="size-3.5" /> Tambah</Button>
          </div>
        ) : (
          <div className="space-y-1">
            {recent.map((tx) => (
              <div key={tx.id} className="premium-card p-3 flex items-center justify-between cursor-pointer active:scale-[0.99]" onClick={() => router.push("/transactions")}>
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`flex items-center justify-center size-8 rounded-lg shrink-0 ${tx.type === "income" ? "bg-emerald-100 dark:bg-emerald-900/20" : "bg-red-100 dark:bg-red-900/20"}`}>
                    {tx.type === "income" ? <ArrowUpRight className="size-3.5 text-emerald-600" /> : <ArrowDownRight className="size-3.5 text-red-500" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{tx.description || tx.type}</p>
                    <p className="text-[10px] text-muted-foreground/60">{new Date(tx.date).toLocaleDateString("id-ID")}</p>
                  </div>
                </div>
                <span className={`text-sm font-semibold whitespace-nowrap ml-2 ${tx.type === "income" ? "text-emerald-600" : "text-red-500"}`}>
                  {tx.type === "income" ? "+" : "-"}{currency} {tx.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UsahaDashboard({ ws, currency }: { ws: { id: string; name: string; currency: string; businessSubType?: BusinessSubType }; currency: string }) {
  const router = useRouter();
  const bizConfig = getBusinessConfig(ws.businessSubType);
  const { transactions, loadTransactions } = useFinancialStore();
  const { orders, loadOrders } = useOrderStore();
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [supplierCount, setSupplierCount] = useState(0);

  useEffect(() => {
    if (ws) {
      loadTransactions(ws.id); loadOrders(ws.id);
      import("@/lib/db").then((db) => {
        db.getCustomersByWorkspace(ws.id).then(setCustomers);
        db.getProductsByWorkspace(ws.id).then(setProducts);
        db.getInventoryItemsByWorkspace(ws.id).then(setInventory);
        db.getSuppliersByWorkspace(ws.id).then((s: any[]) => setSupplierCount(s.length));
      });
    }
  }, [ws, loadTransactions, loadOrders]);

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);

  const modalProduk = transactions.filter((t) => t.type === "expense" && t.costCategory === "modal_produk").reduce((s, t) => s + t.amount, 0);
  const gajiKaryawan = transactions.filter((t) => t.type === "expense" && t.costCategory === "gaji_karyawan").reduce((s, t) => s + t.amount, 0);
  const biayaOperasional = transactions.filter((t) => t.type === "expense" && t.costCategory === "biaya_operasional").reduce((s, t) => s + t.amount, 0);
  const biayaTransportasi = transactions.filter((t) => t.type === "expense" && t.costCategory === "biaya_transportasi").reduce((s, t) => s + t.amount, 0);
  const totalModal = modalProduk + gajiKaryawan + biayaOperasional + biayaTransportasi;
  const labaBersihUsaha = totalIncome - totalModal;

  const baru = orders.filter((o) => o.status === "baru").length;
  const proses = orders.filter((o) => o.status === "proses").length;
  const selesai = orders.filter((o) => o.status === "selesai").length;
  const totalRevenue = orders.filter((o) => o.paymentStatus === "Lunas").reduce((s, o) => s + o.total, 0);
  const lowStock = inventory.filter((i: any) => i.stock !== undefined && i.stock <= 2).length;
  const recent = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  const topSales = [...orders].filter((o) => o.paymentStatus === "Lunas").sort((a, b) => b.total - a.total).slice(0, 5);

  const widgets = bizConfig.dashboard;

  return (
    <div className="space-y-5 animate-fade-in max-w-lg mx-auto pb-24">
      {/* Hero: Laba Bersih Usaha */}
      <div className="hero-gradient" style={{ background: "linear-gradient(135deg, hsl(160 84% 39%), hsl(160 70% 25%))" }}>
        <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">{bizConfig.icon} {bizConfig.label}</p>
        <p className="text-3xl font-bold font-heading text-white mb-2">{currency} {labaBersihUsaha.toLocaleString()}</p>
        <p className="text-white/50 text-xs mb-3">Laba Bersih Usaha</p>
        <div className="flex gap-4">
          <span className="flex items-center gap-1 text-white/80 text-xs"><TrendingUp className="size-3.5 text-emerald-300" /> {currency} {totalIncome.toLocaleString()}</span>
          <span className="flex items-center gap-1 text-white/80 text-xs"><TrendingDown className="size-3.5 text-red-300" /> {currency} {totalModal.toLocaleString()}</span>
        </div>
      </div>

      {/* Aksi Cepat */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Aksi Cepat</h2>
        <div className="grid grid-cols-4 gap-2">
          <button onClick={() => router.push("/qris")} className="premium-card p-3 flex flex-col items-center gap-1.5 hover:shadow-md active:scale-95"><div className="flex items-center justify-center size-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg"><QrCode className="size-5 text-white" /></div><span className="text-xs font-medium text-center">QRIS</span></button>
          <button onClick={() => router.push("/orders")} className="premium-card p-3 flex flex-col items-center gap-1.5 hover:shadow-md active:scale-95"><div className="flex items-center justify-center size-12 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg"><ShoppingCart className="size-5 text-white" /></div><span className="text-xs font-medium text-center">Pesanan</span></button>
          <button onClick={() => router.push("/products")} className="premium-card p-3 flex flex-col items-center gap-1.5 hover:shadow-md active:scale-95"><div className="flex items-center justify-center size-12 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 shadow-lg"><Package className="size-5 text-white" /></div><span className="text-xs font-medium text-center">Produk</span></button>
          <button onClick={() => router.push("/transactions")} className="premium-card p-3 flex flex-col items-center gap-1.5 hover:shadow-md active:scale-95"><div className="flex items-center justify-center size-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg"><Plus className="size-5 text-white" /></div><span className="text-xs font-medium text-center">Catat</span></button>
        </div>
      </div>

      {/* Ringkasan Bisnis */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Ringkasan Bisnis</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="premium-stat"><p className="premium-stat-label">Pendapatan Kotor</p><p className="premium-stat-value text-emerald-600">{currency} {totalIncome.toLocaleString()}</p></div>
          <div className="premium-stat"><p className="premium-stat-label">Total Modal</p><p className="premium-stat-value text-red-500">{currency} {totalModal.toLocaleString()}</p></div>
          <div className="premium-stat"><p className="premium-stat-label">Laba Bersih Usaha</p><p className={`premium-stat-value ${labaBersihUsaha >= 0 ? "text-emerald-600" : "text-red-500"}`}>{currency} {Math.abs(labaBersihUsaha).toLocaleString()}</p></div>
          <div className="premium-stat"><p className="premium-stat-label">Revenue Pesanan</p><p className="premium-stat-value text-blue-600">{currency} {totalRevenue.toLocaleString()}</p></div>
        </div>
      </div>

      {/* Rincian Biaya Modal */}
      {totalModal > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3">Rincian Biaya Modal</h2>
          <div className="space-y-1">
            <div className="premium-card p-3 flex justify-between items-center"><span className="text-xs font-medium text-muted-foreground">Modal Produk</span><span className="text-sm font-semibold">{currency} {modalProduk.toLocaleString()}</span></div>
            <div className="premium-card p-3 flex justify-between items-center"><span className="text-xs font-medium text-muted-foreground">Gaji Karyawan</span><span className="text-sm font-semibold">{currency} {gajiKaryawan.toLocaleString()}</span></div>
            <div className="premium-card p-3 flex justify-between items-center"><span className="text-xs font-medium text-muted-foreground">Biaya Operasional</span><span className="text-sm font-semibold">{currency} {biayaOperasional.toLocaleString()}</span></div>
            <div className="premium-card p-3 flex justify-between items-center"><span className="text-xs font-medium text-muted-foreground">Biaya Transportasi</span><span className="text-sm font-semibold">{currency} {biayaTransportasi.toLocaleString()}</span></div>
          </div>
        </div>
      )}

      {/* Pesanan */}
      <div>
        <div className="flex items-center justify-between mb-3"><h2 className="text-sm font-semibold">Pesanan</h2><button onClick={() => router.push("/orders")} className="text-xs font-medium text-emerald-600">Kelola</button></div>
        <div className="grid grid-cols-4 gap-2">
          <div className="premium-card p-3 text-center"><p className="premium-stat-label">Baru</p><p className="text-lg font-bold font-heading text-blue-600">{baru}</p></div>
          <div className="premium-card p-3 text-center"><p className="premium-stat-label">Proses</p><p className="text-lg font-bold font-heading text-amber-600">{proses}</p></div>
          <div className="premium-card p-3 text-center"><p className="premium-stat-label">Selesai</p><p className="text-lg font-bold font-heading text-emerald-600">{selesai}</p></div>
          <div className="premium-card p-3 text-center"><p className="premium-stat-label">Pelanggan</p><p className="text-lg font-bold font-heading">{customers.length}</p></div>
        </div>
      </div>

      {/* Info Bisnis */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Info Bisnis</h2>
        <div className="grid grid-cols-3 gap-2">
          <div onClick={() => router.push("/products")} className="premium-card p-3 text-center cursor-pointer hover:shadow-md active:scale-95"><p className="premium-stat-label">Produk</p><p className="text-lg font-bold font-heading">{products.length}</p></div>
          <div onClick={() => router.push("/inventory")} className="premium-card p-3 text-center cursor-pointer hover:shadow-md active:scale-95"><p className="premium-stat-label">Stok</p><p className="text-lg font-bold font-heading">{inventory.length}</p>{lowStock > 0 && <p className="text-[8px] text-red-500 font-medium">{lowStock} hampir habis</p>}</div>
          <div onClick={() => router.push("/suppliers")} className="premium-card p-3 text-center cursor-pointer hover:shadow-md active:scale-95"><p className="premium-stat-label">Supplier</p><p className="text-lg font-bold font-heading">{supplierCount}</p></div>
        </div>
      </div>

      {/* Produk Terlaris (Kedai Kopi / Warung) */}
      {widgets.includes("top_products") && topSales.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3">Produk Terlaris</h2>
          <div className="space-y-1">
            {topSales.map((o, i) => (
              <div key={o.id} className="premium-card p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground/40 w-5">#{i + 1}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{o.customerName || `Pesanan #${o.number}`}</p>
                    <p className="text-[10px] text-muted-foreground/60">{o.items?.length || 0} item</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-emerald-600">{currency} {o.total.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaksi Terbaru */}
      <div>
        <div className="flex items-center justify-between mb-3"><h2 className="text-sm font-semibold">Transaksi Terbaru</h2><button onClick={() => router.push("/transactions")} className="text-xs font-medium text-emerald-600">Lihat Semua</button></div>
        {recent.length === 0 ? (
          <div className="premium-card p-6 text-center"><p className="text-sm text-muted-foreground/60">Belum ada transaksi</p><Button variant="outline" size="sm" className="mt-3" onClick={() => router.push("/transactions")}><Plus className="size-3.5" /> Tambah</Button></div>
        ) : (
          <div className="space-y-1">
            {recent.map((tx) => (
              <div key={tx.id} className="premium-card p-3 flex items-center justify-between cursor-pointer active:scale-[0.99]" onClick={() => router.push("/transactions")}>
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`flex items-center justify-center size-8 rounded-lg shrink-0 ${tx.type === "income" ? "bg-emerald-100 dark:bg-emerald-900/20" : "bg-red-100 dark:bg-red-900/20"}`}>
                    {tx.type === "income" ? <ArrowUpRight className="size-3.5 text-emerald-600" /> : <ArrowDownRight className="size-3.5 text-red-500" />}
                  </div>
                  <div className="min-w-0"><p className="text-sm font-medium truncate">{tx.description || tx.type}</p><p className="text-[10px] text-muted-foreground/60">{new Date(tx.date).toLocaleDateString("id-ID")}</p></div>
                </div>
                <span className={`text-sm font-semibold whitespace-nowrap ml-2 ${tx.type === "income" ? "text-emerald-600" : "text-red-500"}`}>{tx.type === "income" ? "+" : "-"}{currency} {tx.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HutangDashboard({ ws, currency }: { ws: { id: string; name: string; currency: string }; currency: string }) {
  const router = useRouter();
  const { transactions, loadTransactions } = useFinancialStore();
  useEffect(() => { if (ws) loadTransactions(ws.id); }, [ws, loadTransactions]);
  const debts = transactions.filter((t) => t.type === "debt");
  const receivables = transactions.filter((t) => t.type === "receivable");
  const totalDebt = debts.reduce((s, t) => s + t.amount, 0);
  const totalReceivable = receivables.reduce((s, t) => s + t.amount, 0);
  return (
    <div className="space-y-5 animate-fade-in max-w-lg mx-auto pb-24">
      <div className="hero-gradient" style={{background: "linear-gradient(135deg, hsl(24 95% 53%), hsl(0 72% 51%))"}}>
        <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">Buku Hutang</p>
        <p className="text-3xl font-bold font-heading text-white mb-2">{currency} {totalDebt.toLocaleString()}</p>
        <p className="text-white/60 text-xs">Total Hutang</p>
      </div>
      <QuickActions type="hutang" router={router} />
      <div className="grid grid-cols-2 gap-3">
        <div className="premium-stat"><p className="premium-stat-label">Hutang</p><p className="premium-stat-value text-red-500">{currency} {totalDebt.toLocaleString()}</p></div>
        <div className="premium-stat"><p className="premium-stat-label">Piutang</p><p className="premium-stat-value text-blue-600">{currency} {totalReceivable.toLocaleString()}</p></div>
      </div>
    </div>
  );
}

function ModalDashboard({ ws, currency }: { ws: { id: string; name: string; currency: string }; currency: string }) {
  const router = useRouter();
  const { accounts, transactions, loadAccounts, loadTransactions } = useFinancialStore();
  useEffect(() => { if (ws) { loadAccounts(ws.id); loadTransactions(ws.id); } }, [ws, loadAccounts, loadTransactions]);
  const balance = accounts.reduce((s, a) => s + a.balance, 0);
  const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  return (
    <div className="space-y-5 animate-fade-in max-w-lg mx-auto pb-24">
      <div className="hero-gradient" style={{background: "linear-gradient(135deg, hsl(270 67% 47%), hsl(300 60% 40%))"}}>
        <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">Buku Modal</p>
        <p className="text-3xl font-bold font-heading text-white mb-2">{currency} {balance.toLocaleString()}</p>
        <p className="text-white/60 text-xs">Total Modal</p>
      </div>
      <QuickActions type="modal" router={router} />
      <div className="grid grid-cols-2 gap-3">
        <div className="premium-stat"><p className="premium-stat-label">Pemasukan</p><p className="premium-stat-value text-emerald-600">{currency} {income.toLocaleString()}</p></div>
        <div className="premium-stat"><p className="premium-stat-label">Pengeluaran</p><p className="premium-stat-value text-red-500">{currency} {expense.toLocaleString()}</p></div>
      </div>
    </div>
  );
}

function TokoDashboard({ ws, currency }: { ws: { id: string; name: string; currency: string }; currency: string }) {
  const router = useRouter();
  const { orders, loadOrders } = useOrderStore();
  useEffect(() => { if (ws) loadOrders(ws.id); }, [ws, loadOrders]);
  const activeOrders = orders.filter((o) => o.status === "baru" || o.status === "proses").length;
  const completedOrders = orders.filter((o) => o.status === "selesai").length;
  const totalRevenue = orders.filter((o) => o.paymentStatus === "Lunas").reduce((s, o) => s + o.total, 0);
  return (
    <div className="space-y-5 animate-fade-in max-w-lg mx-auto pb-24">
      <div className="hero-gradient" style={{background: "linear-gradient(135deg, hsl(200 100% 40%), hsl(190 100% 35%))"}}>
        <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">Toko Online</p>
        <p className="text-3xl font-bold font-heading text-white mb-2">{currency} {totalRevenue.toLocaleString()}</p>
        <p className="text-white/60 text-xs">Total Pendapatan</p>
      </div>
      <QuickActions type="toko" router={router} />
      <div className="grid grid-cols-3 gap-3">
        <div className="premium-card p-4 text-center"><p className="premium-stat-label">Pesanan Baru</p><p className="text-xl font-bold font-heading mt-1">{activeOrders}</p></div>
        <div className="premium-card p-4 text-center"><p className="premium-stat-label">Selesai</p><p className="text-xl font-bold font-heading text-emerald-600 mt-1">{completedOrders}</p></div>
        <div className="premium-card p-4 text-center"><p className="premium-stat-label">Revenue</p><p className="text-sm font-bold font-heading mt-1">{currency} {totalRevenue.toLocaleString()}</p></div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { activeWorkspace, workspaces, loadWorkspaces, selectWorkspace } = useWorkspaceStore();

  useEffect(() => { if (user) loadWorkspaces(user.id); }, [user, loadWorkspaces]);

  if (!user) return null;

  if (workspaces.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <div className="flex items-center justify-center size-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-bold text-2xl mx-auto mb-4 shadow-xl shadow-emerald-500/20">M</div>
          <h2 className="text-xl font-bold font-heading mb-2">Selamat Datang!</h2>
          <p className="text-sm text-muted-foreground/70 mb-6">Buat buku pertama Anda untuk memulai</p>
          <Button onClick={() => router.push("/workspaces")}><Plus className="size-4" /> Buat Buku Baru</Button>
        </div>
      </div>
    );
  }

  if (!activeWorkspace) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <h2 className="text-xl font-bold font-heading mb-2">Pilih Buku</h2>
          <p className="text-sm text-muted-foreground/70 mb-6">Pilih buku untuk melihat dashboard</p>
          <div className="space-y-2">
            {workspaces.map((ws) => (
              <button key={ws.id} onClick={() => selectWorkspace(ws.id, user.id)} className="w-full flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors text-left">
                <WorkspaceIcon type={ws.type} className="size-6" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{ws.name}</p>
                  <p className="text-xs text-muted-foreground/60">{[{v:"pribadi",l:"Buku Pribadi"},{v:"usaha",l:"Buku Usaha"},{v:"modal",l:"Buku Modal"},{v:"toko",l:"Toko Online"},{v:"hutang",l:"Buku Hutang"}].find(x=>x.v===ws.type)?.l||ws.type}</p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground/40" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currency = activeWorkspace.currency || "IDR";

  const dashboards: Record<string, React.FC<{ ws: { id: string; name: string; currency: string; businessSubType?: BusinessSubType }; currency: string }>> = {
    pribadi: PribadiDashboard,
    usaha: UsahaDashboard,
    hutang: HutangDashboard,
    modal: ModalDashboard,
    toko: TokoDashboard,
  };

  const DashboardComponent = dashboards[activeWorkspace.type] || PribadiDashboard;
  return <DashboardComponent ws={activeWorkspace} currency={currency} />;
}
