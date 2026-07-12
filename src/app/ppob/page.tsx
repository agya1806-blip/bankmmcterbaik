"use client";

import { useEffect, useState } from "react";
import { useWorkspaceStore } from "@/engines/workspace/workspace-store";
import { usePpobStore } from "@/engines/ppob/ppob-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, Zap, Wifi, Gamepad2, Wallet, Droplets,
  HeartPulse, Tv, CreditCard, ArrowLeft, Phone,
  X, RefreshCw, History, Smartphone
} from "lucide-react";
import toast from "react-hot-toast";

const DEFAULT_CATEGORIES = [
  { id: "pulsa", name: "Pulsa", icon: "Smartphone", provider: "Telkomsel, Indosat, XL, Tri, Smartfren" },
  { id: "paket-data", name: "Paket Data", icon: "Wifi", provider: "Telkomsel, Indosat, XL, Tri, Smartfren" },
  { id: "token-listrik", name: "Token Listrik", icon: "Zap", provider: "PLN" },
  { id: "ewallet", name: "E-Wallet", icon: "Wallet", provider: "GoPay, OVO, DANA, LinkAja, ShopeePay" },
  { id: "voucher-game", name: "Voucher Game", icon: "Gamepad2", provider: "Mobile Legends, FF, PUBG, Steam" },
  { id: "tagihan-listrik", name: "Tagihan Listrik", icon: "Zap", provider: "PLN" },
  { id: "bpjs", name: "BPJS", icon: "HeartPulse", provider: "BPJS Kesehatan" },
  { id: "pdam", name: "PDAM", icon: "Droplets", provider: "PDAM" },
  { id: "telkom", name: "Telkom & Internet", icon: "Tv", provider: "Telkom, Indihome, Biznet, First Media" },
  { id: "tagihan-lain", name: "Tagihan Lainnya", icon: "CreditCard", provider: "Angsuran, E-Samsat, Pendidikan" },
];

const DEFAULT_PRODUCTS: Record<string, { name: string; buyPrice: number; sellPrice: number }[]> = {
  pulsa: [
    { name: "Pulsa 5.000", buyPrice: 5200, sellPrice: 5500 },
    { name: "Pulsa 10.000", buyPrice: 10200, sellPrice: 10500 },
    { name: "Pulsa 15.000", buyPrice: 15200, sellPrice: 15500 },
    { name: "Pulsa 20.000", buyPrice: 20200, sellPrice: 20500 },
    { name: "Pulsa 25.000", buyPrice: 25200, sellPrice: 25500 },
    { name: "Pulsa 30.000", buyPrice: 30200, sellPrice: 30500 },
    { name: "Pulsa 50.000", buyPrice: 50200, sellPrice: 50500 },
    { name: "Pulsa 100.000", buyPrice: 100200, sellPrice: 100500 },
  ],
  "paket-data": [
    { name: "Telkomsel 1GB", buyPrice: 15000, sellPrice: 17000 },
    { name: "Telkomsel 3GB", buyPrice: 35000, sellPrice: 37000 },
    { name: "Telkomsel 5GB", buyPrice: 50000, sellPrice: 52000 },
    { name: "Telkomsel 10GB", buyPrice: 75000, sellPrice: 77000 },
    { name: "Indosat 2GB", buyPrice: 12000, sellPrice: 14000 },
    { name: "Indosat 5GB", buyPrice: 25000, sellPrice: 27000 },
    { name: "Indosat 10GB", buyPrice: 45000, sellPrice: 47000 },
    { name: "XL 2GB", buyPrice: 13000, sellPrice: 15000 },
    { name: "XL 5GB", buyPrice: 27000, sellPrice: 29000 },
    { name: "XL 10GB", buyPrice: 47000, sellPrice: 49000 },
    { name: "Tri 2GB", buyPrice: 10000, sellPrice: 12000 },
    { name: "Tri 5GB", buyPrice: 22000, sellPrice: 24000 },
    { name: "Smartfren 3GB", buyPrice: 20000, sellPrice: 22000 },
    { name: "Smartfren 10GB", buyPrice: 40000, sellPrice: 42000 },
  ],
  "token-listrik": [
    { name: "Token PLN 20.000", buyPrice: 19500, sellPrice: 20000 },
    { name: "Token PLN 50.000", buyPrice: 49000, sellPrice: 50000 },
    { name: "Token PLN 100.000", buyPrice: 98000, sellPrice: 100000 },
    { name: "Token PLN 200.000", buyPrice: 196000, sellPrice: 200000 },
    { name: "Token PLN 500.000", buyPrice: 490000, sellPrice: 500000 },
    { name: "Token PLN 1.000.000", buyPrice: 980000, sellPrice: 1000000 },
  ],
  ewallet: [
    { name: "GoPay 10.000", buyPrice: 9800, sellPrice: 10000 },
    { name: "GoPay 25.000", buyPrice: 24500, sellPrice: 25000 },
    { name: "GoPay 50.000", buyPrice: 49000, sellPrice: 50000 },
    { name: "OVO 10.000", buyPrice: 9800, sellPrice: 10000 },
    { name: "OVO 25.000", buyPrice: 24500, sellPrice: 25000 },
    { name: "OVO 50.000", buyPrice: 49000, sellPrice: 50000 },
    { name: "DANA 10.000", buyPrice: 9800, sellPrice: 10000 },
    { name: "DANA 25.000", buyPrice: 24500, sellPrice: 25000 },
    { name: "DANA 50.000", buyPrice: 49000, sellPrice: 50000 },
    { name: "ShopeePay 10.000", buyPrice: 9800, sellPrice: 10000 },
    { name: "ShopeePay 25.000", buyPrice: 24500, sellPrice: 25000 },
    { name: "ShopeePay 50.000", buyPrice: 49000, sellPrice: 50000 },
  ],
  "voucher-game": [
    { name: "ML 86 Diamonds", buyPrice: 17000, sellPrice: 19000 },
    { name: "ML 170 Diamonds", buyPrice: 33000, sellPrice: 35000 },
    { name: "ML 340 Diamonds", buyPrice: 65000, sellPrice: 67000 },
    { name: "FF 70 Diamonds", buyPrice: 7000, sellPrice: 9000 },
    { name: "FF 140 Diamonds", buyPrice: 13000, sellPrice: 15000 },
    { name: "FF 355 Diamonds", buyPrice: 32000, sellPrice: 34000 },
    { name: "PUBG 60 UC", buyPrice: 9000, sellPrice: 11000 },
    { name: "PUBG 300 UC", buyPrice: 42000, sellPrice: 44000 },
    { name: "PUBG 600 UC", buyPrice: 83000, sellPrice: 85000 },
    { name: "Steam Wallet 50.000", buyPrice: 48000, sellPrice: 50000 },
    { name: "Steam Wallet 100.000", buyPrice: 95000, sellPrice: 100000 },
  ],
  "tagihan-listrik": [
    { name: "PLN Pascabayar", buyPrice: 0, sellPrice: 0 },
  ],
  bpjs: [
    { name: "BPJS Kesehatan Kelas 1", buyPrice: 80000, sellPrice: 85000 },
    { name: "BPJS Kesehatan Kelas 2", buyPrice: 51000, sellPrice: 55000 },
    { name: "BPJS Kesehatan Kelas 3", buyPrice: 25000, sellPrice: 30000 },
  ],
  pdam: [
    { name: "PDAM", buyPrice: 0, sellPrice: 0 },
  ],
  telkom: [
    { name: "Indihome 10Mbps", buyPrice: 250000, sellPrice: 260000 },
    { name: "Indihome 20Mbps", buyPrice: 350000, sellPrice: 365000 },
    { name: "Biznet 10Mbps", buyPrice: 220000, sellPrice: 235000 },
    { name: "First Media 10Mbps", buyPrice: 300000, sellPrice: 315000 },
  ],
  "tagihan-lain": [
    { name: "Angsuran Kredit", buyPrice: 0, sellPrice: 0 },
    { name: "E-Samsat", buyPrice: 0, sellPrice: 0 },
    { name: "Pendidikan", buyPrice: 0, sellPrice: 0 },
  ],
};

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Smartphone, Wifi, Zap, Wallet, Gamepad2, Droplets, HeartPulse, Tv, Phone, CreditCard,
};

const CATEGORY_COLORS: Record<string, string> = {
  pulsa: "from-emerald-500 to-emerald-600",
  "paket-data": "from-blue-500 to-blue-600",
  "token-listrik": "from-amber-500 to-amber-600",
  ewallet: "from-violet-500 to-violet-600",
  "voucher-game": "from-purple-500 to-purple-600",
  "tagihan-listrik": "from-orange-500 to-orange-600",
  bpjs: "from-red-500 to-red-600",
  pdam: "from-cyan-500 to-cyan-600",
  telkom: "from-indigo-500 to-indigo-600",
  "tagihan-lain": "from-slate-500 to-slate-600",
};

interface LocalTx {
  id: string;
  categoryId: string;
  productName: string;
  customerPhone: string;
  amount: number;
  profit: number;
  status: "sukses" | "gagal" | "pending";
  createdAt: number;
}

export default function PpobPage() {
  const { activeWorkspace } = useWorkspaceStore();
  const { loadCategories, loadProducts, loadTransactions } = usePpobStore();

  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showBuyModal, setShowBuyModal] = useState<{ name: string; buyPrice: number; sellPrice: number } | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [localTx, setLocalTx] = useState<LocalTx[]>([]);
  const [activeTab, setActiveTab] = useState<"beli" | "riwayat">("beli");

  useEffect(() => {
    if (activeWorkspace) {
      loadCategories(activeWorkspace.id);
      loadProducts(activeWorkspace.id);
      loadTransactions(activeWorkspace.id);
      const saved = localStorage.getItem(`ppob_tx_${activeWorkspace.id}`);
      if (saved) setLocalTx(JSON.parse(saved));
    }
  }, [activeWorkspace, loadCategories, loadProducts, loadTransactions]);

  const saveLocalTx = (txs: LocalTx[]) => {
    if (activeWorkspace) {
      localStorage.setItem(`ppob_tx_${activeWorkspace.id}`, JSON.stringify(txs));
    }
    setLocalTx(txs);
  };

  const currentProducts = selectedCat ? DEFAULT_PRODUCTS[selectedCat] || [] : [];
  const filteredProducts = currentProducts.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalProfit = localTx.filter((t) => t.status === "sukses").reduce((s, t) => s + t.profit, 0);
  const todayTx = localTx.filter((t) => {
    const today = new Date().toDateString();
    return new Date(t.createdAt).toDateString() === today && t.status === "sukses";
  }).length;

  const handleBuy = async (product: { name: string; buyPrice: number; sellPrice: number }) => {
    if (!customerPhone || !activeWorkspace || !selectedCat) {
      toast.error("Masukkan nomor HP pelanggan");
      return;
    }
    const txId = `ppob_${Date.now()}`;
    setProcessingId(txId);
    try {
      const tx: LocalTx = {
        id: txId,
        categoryId: selectedCat,
        productName: product.name,
        customerPhone,
        amount: product.sellPrice,
        profit: product.sellPrice - product.buyPrice,
        status: "pending",
        createdAt: Date.now(),
      };
      const updated = [tx, ...localTx];
      saveLocalTx(updated);
      setShowBuyModal(null);
      toast.success(`Memproses ${product.name}...`);

      await new Promise((r) => setTimeout(r, 2000));

      tx.status = "sukses";
      saveLocalTx(updated.map((t) => (t.id === txId ? tx : t)));
      toast.success(`${product.name} berhasil! Profit: ${activeWorkspace.currency} ${(product.sellPrice - product.buyPrice).toLocaleString()}`);
    } catch {
      const failed = localTx.map((t) => (t.id === txId ? { ...t, status: "gagal" as const } : t));
      saveLocalTx(failed);
      toast.error("Transaksi gagal");
    } finally {
      setProcessingId(null);
    }
  };

  const CategoryIcon = selectedCat ? ICON_MAP[DEFAULT_CATEGORIES.find((c) => c.id === selectedCat)?.icon || "Smartphone"] : null;
  const colorClass = selectedCat ? CATEGORY_COLORS[selectedCat] || "from-emerald-500 to-emerald-600" : "from-emerald-500 to-emerald-600";

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  if (!activeWorkspace) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-muted-foreground/60">Pilih ruang kerja terlebih dahulu</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in max-w-lg mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-heading">PPOB</h1>
          <p className="text-sm text-muted-foreground/60">Produk Digital</p>
        </div>
        <div className="flex items-center justify-center size-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20">
          <Zap className="size-6 text-white" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="floating-card p-3 text-center">
          <p className="text-xs text-muted-foreground/60">Profit Hari Ini</p>
          <p className="text-sm font-bold text-emerald-600">{activeWorkspace.currency} {totalProfit.toLocaleString()}</p>
        </div>
        <div className="floating-card p-3 text-center">
          <p className="text-xs text-muted-foreground/60">Transaksi</p>
          <p className="text-sm font-bold">{todayTx}</p>
        </div>
        <div className="floating-card p-3 text-center">
          <p className="text-xs text-muted-foreground/60">Total Profit</p>
          <p className="text-sm font-bold text-emerald-600">{activeWorkspace.currency} {totalProfit.toLocaleString()}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-muted/50 rounded-xl p-1">
        <button
          onClick={() => setActiveTab("beli")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === "beli" ? "bg-white dark:bg-card shadow-sm text-foreground" : "text-muted-foreground"
          }`}
        >
          <Zap className="size-4 inline mr-1" /> Beli
        </button>
        <button
          onClick={() => setActiveTab("riwayat")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === "riwayat" ? "bg-white dark:bg-card shadow-sm text-foreground" : "text-muted-foreground"
          }`}
        >
          <History className="size-4 inline mr-1" /> Riwayat
        </button>
      </div>

      {activeTab === "beli" ? (
        <>
          {/* Customer Phone Input (always visible) */}
          <div className="floating-card p-4 space-y-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground/70 mb-1 block">No. HP Pelanggan</label>
                <Input
                  type="tel"
                  placeholder="0812xxxxxx"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground/70 mb-1 block">Nama Pelanggan</label>
                <Input
                  placeholder="Opsional"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Category Grid */}
          {!selectedCat ? (
            <div>
              <h2 className="text-sm font-semibold mb-3">Kategori</h2>
              <div className="grid grid-cols-5 gap-2">
                {DEFAULT_CATEGORIES.map((cat) => {
                  const Icon = ICON_MAP[cat.icon] || Smartphone;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCat(cat.id)}
                      className="floating-card p-3 flex flex-col items-center gap-1.5 hover:shadow-md transition-all active:scale-95"
                    >
                      <div className={`flex items-center justify-center size-12 rounded-xl bg-gradient-to-br ${CATEGORY_COLORS[cat.id] || "from-emerald-500 to-emerald-600"} shadow-lg`}>
                        <Icon className="size-5 text-white" />
                      </div>
                      <span className="text-xs font-medium text-center leading-tight">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Products in Category */
            <div>
              <div className="flex items-center gap-2 mb-3">
                <button onClick={() => { setSelectedCat(null); setSearchQuery(""); }} className="flex items-center justify-center size-11 rounded-xl hover:bg-muted/50 transition-colors">
                  <ArrowLeft className="size-5" />
                </button>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r ${colorClass} text-white`}>
                  {CategoryIcon && <CategoryIcon className="size-4" />}
                  <span className="text-sm font-semibold">{DEFAULT_CATEGORIES.find((c) => c.id === selectedCat)?.name}</span>
                </div>
                <div className="flex-1" />
                <span className="text-[10px] text-muted-foreground/60">{DEFAULT_CATEGORIES.find((c) => c.id === selectedCat)?.provider}</span>
              </div>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
                <input
                  type="text"
                  placeholder="Cari produk..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 rounded-xl bg-muted/50 border border-border/30 text-sm focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <div className="size-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
                    <Search className="size-5 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm text-muted-foreground/60">Produk tidak ditemukan</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredProducts.map((product, i) => (
                    <div
                      key={i}
                      className="floating-card p-3 flex items-center justify-between hover:shadow-md transition-all cursor-pointer active:scale-[0.99]"
                      onClick={() => {
                        if (customerPhone) setShowBuyModal(product);
                        else toast.error("Masukkan nomor HP pelanggan");
                      }}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{product.name}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-muted-foreground/60">
                            Beli: {activeWorkspace.currency} {product.buyPrice.toLocaleString()}
                          </span>
                          <span className="text-xs font-semibold text-emerald-600">
                            Jual: {activeWorkspace.currency} {product.sellPrice.toLocaleString()}
                          </span>
                          {product.sellPrice > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 font-medium">
                              +{activeWorkspace.currency} {(product.sellPrice - product.buyPrice).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button size="sm" className="shrink-0 ml-2">
                        <Zap className="size-3.5" /> Jual
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        /* Transaction History */
        <div>
          {localTx.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="size-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
                <History className="size-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-medium text-foreground/80">Belum ada transaksi</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Mulai jual produk digital sekarang</p>
            </div>
          ) : (
            <div className="space-y-2">
              {localTx.map((tx) => (
                <div key={tx.id} className="floating-card p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`status-dot ${
                        tx.status === "sukses" ? "status-dot-active" :
                        tx.status === "gagal" ? "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]" :
                        "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]"
                      }`} />
                      <p className="text-sm font-medium">{tx.productName}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      tx.status === "sukses" ? "bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600" :
                      tx.status === "gagal" ? "bg-red-50 dark:bg-red-900/10 text-red-500" :
                      "bg-amber-50 dark:bg-amber-900/10 text-amber-600"
                    }`}>
                      {tx.status === "sukses" ? "Sukses" : tx.status === "gagal" ? "Gagal" : "Proses..."}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground/60">
                    <span>{tx.customerPhone}</span>
                    <span>{formatDate(tx.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-semibold">{activeWorkspace.currency} {tx.amount.toLocaleString()}</span>
                    {tx.status === "sukses" && (
                      <span className="text-xs font-medium text-emerald-600">+{activeWorkspace.currency} {tx.profit.toLocaleString()}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Buy Confirmation Modal */}
      {showBuyModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowBuyModal(null)}>
          <div className="w-full max-w-sm bg-white dark:bg-card rounded-2xl p-6 shadow-2xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className={`flex items-center justify-center size-14 rounded-2xl bg-gradient-to-br ${colorClass} mx-auto mb-3 shadow-lg`}>
                {CategoryIcon && <CategoryIcon className="size-7 text-white" />}
              </div>
              <h3 className="text-lg font-bold font-heading">Konfirmasi Penjualan</h3>
              <p className="text-sm text-muted-foreground/60 mt-1">{showBuyModal.name}</p>
            </div>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between p-3 rounded-xl bg-muted/30">
                <span className="text-sm text-muted-foreground/70">Harga Beli</span>
                <span className="text-sm font-medium">{activeWorkspace.currency} {showBuyModal.buyPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-muted/30">
                <span className="text-sm text-muted-foreground/70">Harga Jual</span>
                <span className="text-sm font-semibold">{activeWorkspace.currency} {showBuyModal.sellPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10">
                <span className="text-sm font-medium text-emerald-600">Profit</span>
                <span className="text-sm font-bold text-emerald-600">+{activeWorkspace.currency} {(showBuyModal.sellPrice - showBuyModal.buyPrice).toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-muted/30">
                <span className="text-sm text-muted-foreground/70">No. HP</span>
                <span className="text-sm font-medium">{customerPhone}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowBuyModal(null)}>
                <X className="size-4" /> Batal
              </Button>
              <Button className="flex-1" onClick={() => handleBuy(showBuyModal)} disabled={processingId !== null}>
                {processingId ? <RefreshCw className="size-4 animate-spin" /> : <Zap className="size-4" />}
                {processingId ? "Memproses..." : "Konfirmasi"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
