"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import {
  Plus, Minus, Trash2, ArrowLeft, CheckCircle2, Package,
  Search, Store, Grid3X3, ShoppingBag,
  Printer, Monitor, Smartphone, Shirt, Tag, Pencil,
  Settings, CreditCard, AlertTriangle,
  X, Check, Bell,
} from "lucide-react";
import toast from "react-hot-toast";
import { useBusinessStore } from "@/store/useBusinessStore";
import { KasirSkeleton } from "@/components/ui/skeleton";
import {
  db, type DbInventoryItem, type DbTransactionItem, type BookOrBranch,
} from "@/lib/db-v4";
import { executeTransactionPipelineV4, type PipelineInputV4 } from "@/engine/transaction-pipeline-v4";
import { branchPrefix } from "@/lib/db-v4";
import ProductSearchModal from "@/components/product-search-modal";
import SpesifikasiModal from "@/components/spesifikasi-modal";
import QuickAddProductModal from "@/components/quick-add-product-modal";

type PaymentMethod = "LUNAS" | "DP" | "PIUTANG";
type QuickAddVariant = "warkop" | "kelontong" | "general";

function getQuickAddVariant(branch: BookOrBranch): QuickAddVariant {
  if (branch === "usaha-warkop") return "warkop";
  if (branch === "usaha-kelontong") return "kelontong";
  return "general";
}

function generateId(branch: BookOrBranch) {
  const prefix = branchPrefix(branch);
  const d = new Date();
  const ds = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `${prefix}-${ds}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
}

function formatRupiah(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function getBranchIcon(branch: BookOrBranch, cls = "size-4") {
  switch (branch) {
    case "usaha-warkop": return <ShoppingBag className={cls} />;
    case "usaha-kelontong": return <ShoppingBag className={cls} />;
    case "usaha-percetakan": return <Printer className={cls} />;
    case "usaha-laptop": return <Monitor className={cls} />;
    case "usaha-gadget": return <Smartphone className={cls} />;
    case "usaha-konveksi": return <Shirt className={cls} />;
    case "usaha-toko-pakaian": return <Tag className={cls} />;
    default: return <Package className={cls} />;
  }
}

interface BranchConfig {
  bookOrBranchId: BookOrBranch;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  inventoryQuery?: DbInventoryItem[];
}

interface CartItem {
  nama: string;
  harga: number;
  qty: number;
  itemId?: string;
  spesifikasi?: string;
}

interface PosKasirProps {
  branchConfig: BranchConfig;
  backHref?: string;
}

const GL = "rgba(255,255,255,0.9)";
const WB: React.CSSProperties = { WebkitBackdropFilter: "blur(12px)" };

const swipeV = {
  enter: (d: number) => ({ x: d > 0 ? 200 : -200, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? -200 : 200, opacity: 0 }),
};
const cartPop = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { type: "spring" as const, damping: 20, stiffness: 400 } },
  exit: { scale: 0.95, opacity: 0, transition: { duration: 0.15 } },
};

const PAYMENT_CONFIG: Record<PaymentMethod, { label: string; icon: React.ReactNode }> = {
  LUNAS: { label: "Lunas", icon: <Check className="size-3.5" /> },
  DP: { label: "Uang Muka", icon: <CreditCard className="size-3.5" /> },
  PIUTANG: { label: "Piutang / Bon", icon: <AlertTriangle className="size-3.5" /> },
};

export default function PosKasir({ branchConfig, backHref }: PosKasirProps) {
  const { bookOrBranchId, title, subtitle, icon, inventoryQuery = [] } = branchConfig;
  const router = useRouter();
  const { setLastKasirUnit } = useBusinessStore();
  const [mounted, setMounted] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [inventoryLinks, setInventoryLinks] = useState<{ itemId: string; qtyDipotong: number }[]>([]);
  const [specModal, setSpecModal] = useState<{ index: number; open: boolean }>({ index: -1, open: false });
  const [customerNama, setCustomerNama] = useState("");
  const [customerWA, setCustomerWA] = useState("");
  const [walletId, setWalletId] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [showBill, setShowBill] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [inventory, setInventory] = useState<DbInventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [loadingInv, setLoadingInv] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("LUNAS");
  const [dpAmount, setDpAmount] = useState("");
  const [dbWallets, setDbWallets] = useState<{ id: string; bookOrBranchId: BookOrBranch; namaDompet: string; saldo: number; tipe: string; isActive: boolean }[]>([]);
  const balanceSwipeX = useMotionValue(0);
  const balanceViewIdx = useTransform(balanceSwipeX, [-80, 0, 80], [1, 0, 2]);
  const [balanceView, setBalanceView] = useState(0);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const unsub = balanceViewIdx.on("change", (v) => {
      const r = Math.round(v);
      if (r >= 0 && r <= 2) setBalanceView(r);
    });
    return unsub;
  }, [balanceViewIdx]);

  const loadInventory = useCallback(async () => {
    if (inventoryQuery?.length) { setInventory(inventoryQuery); return; }
    setLoadingInv(true);
    try {
      const items = await db.inventory.where("bookOrBranchId").equals(bookOrBranchId).toArray();
      setInventory(items);
    } catch { setInventory([]); }
    finally { setLoadingInv(false); }
  }, [inventoryQuery, bookOrBranchId]);

  const loadWallets = useCallback(async () => {
    try {
      const all = await db.wallets.where("bookOrBranchId").equals(bookOrBranchId).toArray();
      setDbWallets(all);
    } catch { setDbWallets([]); }
  }, [bookOrBranchId]);

  useEffect(() => { loadInventory(); loadWallets(); }, [loadInventory, loadWallets]);

  const branchWallets = useMemo(
    () => dbWallets.filter((w) => w.isActive),
    [dbWallets]
  );

  useEffect(() => {
    if (branchWallets.length > 0 && !walletId) setWalletId(branchWallets[0].id);
  }, [branchWallets, walletId]);
  const mainWallet = useMemo(
    () => branchWallets.find((w) => w.tipe === "KasTunai") ?? branchWallets[0],
    [branchWallets]
  );

  const categories = useMemo(() => {
    const cats = new Set<string>();
    inventory.forEach((i) => { if (i.kategori) cats.add(i.kategori); });
    return Array.from(cats).sort();
  }, [inventory]);

  const filteredInventory = useMemo(() => {
    let r = inventory;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      r = r.filter((i) => i.nama.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q));
    }
    if (activeCategory) r = r.filter((i) => i.kategori === activeCategory);
    return r;
  }, [inventory, searchQuery, activeCategory]);

  const total = useMemo(() => cart.reduce((s, e) => s + e.harga * e.qty, 0), [cart]);
  const dpValue = useMemo(() => parseInt(dpAmount.replace(/\D/g, ""), 10) || 0, [dpAmount]);
  const remainingDebt = useMemo(() => Math.max(total - dpValue, 0), [total, dpValue]);

  useEffect(() => {
    if (paymentMethod === "LUNAS") setDpAmount(String(total));
    else if (paymentMethod === "DP") setDpAmount("");
    else setDpAmount("0");
  }, [paymentMethod, total]);

  const addToCart = useCallback((item: DbInventoryItem) => {
    if (item.stok > 0 && item.stok <= item.stokMin)
      toast(`${item.nama} tersisa ${item.stok} ${item.satuan}`, { icon: "\u26A0\uFE0F" });
    setCart((p) => {
      const ex = p.find((e) => e.itemId === item.id);
      if (ex) return p.map((e) => e.itemId === item.id ? { ...e, qty: e.qty + 1 } : e);
      return [...p, { nama: item.nama, harga: item.hargaJual, qty: 1, itemId: item.id }];
    });
    setInventoryLinks((p) => {
      const ex = p.find((l) => l.itemId === item.id);
      if (ex) return p.map((l) => l.itemId === item.id ? { ...l, qtyDipotong: l.qtyDipotong + 1 } : l);
      return [...p, { itemId: item.id, qtyDipotong: 1 }];
    });
    toast.success(`${item.nama} ditambahkan`);
  }, []);

  const updateCartQty = useCallback((index: number, delta: number) => {
    setCart((p) => p.map((item, j) => j === index ? { ...item, qty: Math.max(1, item.qty + delta) } : item));
    setInventoryLinks((p) => {
      const item = cart[index];
      if (!item?.itemId) return p;
      return p.map((l) => l.itemId === item.itemId ? { ...l, qtyDipotong: Math.max(1, l.qtyDipotong + delta) } : l);
    });
  }, [cart]);

  const updateCartPrice = useCallback((index: number, harga: number) => {
    setCart((p) => p.map((item, j) => j === index ? { ...item, harga } : item));
  }, []);

  const removeCartItem = useCallback((index: number) => {
    const item = cart[index];
    setCart((p) => p.filter((_, j) => j !== index));
    if (item?.itemId) setInventoryLinks((p) => p.filter((l) => l.itemId !== item.itemId));
  }, [cart]);

  const selectProduct = useCallback((item: { id: string; nama: string; hargaJual: number; qty: number }) => {
    setCart((p) => {
      const ex = p.find((e) => e.itemId === item.id);
      if (ex) return p.map((e) => e.itemId === item.id ? { ...e, qty: e.qty + item.qty } : e);
      return [...p, { nama: item.nama, harga: item.hargaJual, qty: item.qty, itemId: item.id }];
    });
    setInventoryLinks((p) => {
      const ex = p.find((l) => l.itemId === item.id);
      if (ex) return p.map((l) => l.itemId === item.id ? { ...l, qtyDipotong: l.qtyDipotong + item.qty } : l);
      return [...p, { itemId: item.id, qtyDipotong: item.qty }];
    });
    setShowProductSearch(false);
    toast.success(`${item.nama} ditambahkan`);
  }, []);

  const bayar = useCallback(async () => {
    if (cart.length === 0) { toast.error("Keranjang kosong"); return; }
    setIsProcessing(true);
    try {
      const invId = generateId(bookOrBranchId);
      const finalDp = paymentMethod === "LUNAS" ? total : paymentMethod === "DP" ? dpValue : 0;
      const items: DbTransactionItem[] = cart.map((e) => ({
        id: crypto.randomUUID(), namaItem: e.nama, qty: e.qty,
        hargaSatuan: e.harga, subtotal: e.harga * e.qty, spesifikasi: e.spesifikasi || "",
      }));
      const payload: PipelineInputV4 = {
        id: invId, bookOrBranchId, invoiceNumber: invId,
        tanggal: new Date().toISOString().slice(0, 10), items,
        totalBruto: total, dpDibayar: finalDp, walletIdTarget: walletId,
        customerNama: customerNama.trim(), customerWA,
        inventoryLinks: inventoryLinks.length > 0 ? inventoryLinks : undefined,
      };
      const result = await executeTransactionPipelineV4(payload);
      if (!result.ok) { toast.error(result.error || "Gagal memproses"); return; }
      setInvoiceId(invId);
      setLastKasirUnit(bookOrBranchId);
      toast.success("Pembayaran berhasil!");
      setShowBill(true);
    } catch { toast.error("Gagal memproses pembayaran"); }
    finally { setIsProcessing(false); }
  }, [cart, total, dpValue, paymentMethod, walletId, bookOrBranchId, setLastKasirUnit, inventoryLinks, customerNama, customerWA]);

  const resetCart = useCallback(() => {
    setCart([]); setInventoryLinks([]); setShowBill(false);
    setPaymentMethod("LUNAS"); setDpAmount(""); setCustomerNama(""); setCustomerWA("");
    loadInventory();
  }, [loadInventory]);

  if (!mounted) return <KasirSkeleton />;

  if (showBill) {
    return (
      <div className="max-w-md mx-auto w-full min-h-screen bg-[#F8F9FD] dark:bg-[#0B0C16] relative overflow-x-hidden flex flex-col" style={WB}>
        <div className="flex-1 flex items-center justify-center px-4 pb-32">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="w-full max-w-sm p-6 rounded-3xl text-center space-y-4"
            style={{ background: GL, backdropFilter: "blur(16px)", ...WB, border: "1px solid rgba(255,255,255,0.6)" }}>
            <div className="size-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="size-10 text-white" />
            </div>
            <p className="text-xl font-bold font-heading text-slate-900 dark:text-white tracking-tight">Pembayaran Berhasil!</p>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono">No. {invoiceId}</p>
            <p className="text-2xl font-bold font-heading text-[#FF5C00] tabular-nums">{formatRupiah(total)}</p>
            {paymentMethod === "DP" && (
              <p className="text-[10px] text-slate-500 dark:text-zinc-400">DP: {formatRupiah(dpValue)} &middot; Sisa: {formatRupiah(remainingDebt)}</p>
            )}
            {customerWA && <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 font-medium">Poin loyalitas otomatis ditambahkan</p>}
            <motion.button whileTap={{ scale: 0.97 }} onClick={resetCart}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#7B61FF] to-[#FF5C00] text-white text-sm font-bold shadow-lg shadow-[#7B61FF]/25 flex items-center justify-center gap-2">
              <Plus className="size-4" /> Transaksi Baru
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto w-full min-h-screen bg-[#F8F9FD] dark:bg-[#0B0C16] relative overflow-x-hidden pb-32 flex flex-col" style={WB}>
      {/* Header */}
      <div className="sticky top-0 z-30 px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-3"
        style={{ background: "rgba(248,249,253,0.85)", backdropFilter: "blur(16px)", ...WB }}>
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => router.push(backHref || "/buku-usaha")}
            className="size-10 rounded-xl flex items-center justify-center border border-slate-200/60 dark:border-slate-800/60"
            style={{ background: GL, ...WB }}>
            <ArrowLeft className="size-5 text-slate-500 dark:text-slate-300" />
          </motion.button>
          <div className="size-11 rounded-2xl bg-gradient-to-br from-[#7B61FF] to-[#6366F1] flex items-center justify-center shadow-xl shadow-[#7B61FF]/20">
            <div className="size-5 text-white">{icon}</div>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white truncate">{title}</h1>
            <p className="text-[11px] font-normal italic text-slate-400 dark:text-zinc-500">{subtitle}</p>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} className="relative size-10 rounded-xl flex items-center justify-center"
            style={{ background: GL, ...WB, border: "1px solid rgba(255,255,255,0.6)" }}>
            <Bell className="size-5 text-slate-400 dark:text-zinc-500" />
            {inventory.filter((i) => i.stok <= i.stokMin && i.stok > 0).length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 size-3 rounded-full bg-[#FF5C00] animate-pulse" />
            )}
          </motion.button>
        </div>
      </div>

      {/* Swipeable Balance Card */}
      <div className="px-4 mt-2">
        <motion.div drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.3}
          onDragEnd={(_, info) => {
            if (info.offset.x < -40) setBalanceView(Math.min(2, balanceView + 1));
            else if (info.offset.x > 40) setBalanceView(Math.max(0, balanceView - 1));
            animate(balanceSwipeX, 0);
          }}
          className="rounded-3xl p-5 overflow-hidden relative cursor-grab active:cursor-grabbing"
          style={{
            x: balanceSwipeX,
            background: balanceView === 0 ? "linear-gradient(135deg, #7B61FF, #6366F1)"
              : balanceView === 1 ? "linear-gradient(135deg, #FCD34D, #F59E0B)"
              : "linear-gradient(135deg, #10B981, #059669)", ...WB,
          }}>
          <AnimatePresence mode="wait">
            <motion.div key={balanceView}
              variants={swipeV} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }} className="relative z-10">
              {balanceView === 0 && (<>
                <p className="text-white/60 text-[10px] uppercase tracking-wider font-semibold">Saldo Kas Utama</p>
                <p className="text-2xl font-bold text-white font-heading tabular-nums mt-1">{formatRupiah(mainWallet?.saldo ?? 0)}</p>
                <p className="text-white/50 text-[10px] mt-1">{mainWallet?.namaDompet ?? "Belum ada dompet"}</p>
              </>)}
              {balanceView === 1 && (<>
                <p className="text-white/60 text-[10px] uppercase tracking-wider font-semibold">Estimasi Omzet Hari Ini</p>
                <p className="text-2xl font-bold text-white font-heading tabular-nums mt-1">{cart.length} item di keranjang</p>
                <p className="text-white/50 text-[10px] mt-1">Total: {formatRupiah(total)}</p>
              </>)}
              {balanceView === 2 && (<>
                <p className="text-white/60 text-[10px] uppercase tracking-wider font-semibold">Dompet Aktif</p>
                <p className="text-2xl font-bold text-white font-heading tabular-nums mt-1">{branchWallets.length}</p>
                <p className="text-white/50 text-[10px] mt-1">{branchWallets.map((w) => w.namaDompet).join(", ") || "Belum ada dompet"}</p>
              </>)}
            </motion.div>
          </AnimatePresence>
          <div className="absolute -top-10 -right-10 size-40 rounded-full bg-white/5 blur-2xl" />
          <div className="absolute -bottom-8 -left-8 size-32 rounded-full bg-black/10 blur-xl" />
          <div className="flex justify-center gap-1.5 mt-3 relative z-10">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`size-1.5 rounded-full transition-colors ${balanceView === i ? "bg-white" : "bg-white/30"}`} />
            ))}
          </div>
        </motion.div>
      </div>

      <div className="flex-1 px-4 mt-4 space-y-4">
        {/* Quick Add */}
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowQuickAdd(true)}
          className="w-full h-11 rounded-2xl bg-gradient-to-r from-[#7B61FF] to-[#FF5C00] text-white text-xs font-extrabold shadow-lg shadow-[#7B61FF]/25 flex items-center justify-center gap-2" style={WB}>
          <Plus className="size-4" /> Tambah Produk Baru
        </motion.button>

        {/* Search & Category */}
        <div className="rounded-3xl p-4 space-y-3" style={{ background: GL, backdropFilter: "blur(16px)", ...WB, border: "1px solid rgba(255,255,255,0.6)" }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 dark:text-zinc-500" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari produk..."
              className="w-full h-10 pl-9 pr-3 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#7B61FF]/30" />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setActiveCategory("")}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${!activeCategory
                ? "bg-[#7B61FF]/20 text-[#7B61FF]" : "bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 hover:bg-slate-200"}`}>
              <Grid3X3 className="size-3 inline mr-1" />Semua
            </button>
            {categories.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(activeCategory === cat ? "" : cat)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${activeCategory === cat
                  ? "bg-[#7B61FF]/20 text-[#7B61FF]" : "bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 hover:bg-slate-200"}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Inventory Grid */}
        {loadingInv ? (
          <div className="rounded-3xl p-6 text-center space-y-3" style={{ background: GL, backdropFilter: "blur(16px)", ...WB, border: "1px solid rgba(255,255,255,0.6)" }}>
            <div className="animate-spin size-6 border-2 border-[#7B61FF] border-t-transparent rounded-full mx-auto" />
            <p className="text-xs text-slate-500 dark:text-slate-400">Memuat produk...</p>
          </div>
        ) : inventory.length === 0 ? (
          <div className="rounded-3xl p-8 text-center space-y-3" style={{ background: GL, backdropFilter: "blur(16px)", ...WB, border: "1px solid rgba(255,255,255,0.6)" }}>
            <Store className="size-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-slate-900 dark:text-white">Belum ada produk</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Tambah produk sekarang agar bisa dijual</p>
          </div>
        ) : filteredInventory.length === 0 ? (
          <div className="rounded-3xl p-6 text-center" style={{ background: GL, backdropFilter: "blur(16px)", ...WB, border: "1px solid rgba(255,255,255,0.6)" }}>
            <p className="text-xs text-slate-500 dark:text-slate-400">Tidak ada produk yang cocok</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <AnimatePresence>
              {filteredInventory.map((item) => (
                <motion.button key={item.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }} whileTap={{ scale: 0.97 }}
                  onClick={() => addToCart(item)}
                  className="rounded-2xl p-3 text-center space-y-1.5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                  style={{ background: GL, backdropFilter: "blur(16px)", ...WB, border: "1px solid rgba(255,255,255,0.6)" }}>
                  <div className="size-10 rounded-xl bg-gradient-to-br from-[#7B61FF]/20 to-[#FF5C00]/10 flex items-center justify-center mx-auto">
                    {getBranchIcon(bookOrBranchId, "size-4 text-[#7B61FF]")}
                  </div>
                  <p className="text-sm font-semibold leading-tight line-clamp-2 text-slate-900 dark:text-white">{item.nama}</p>
                  <p className="text-xs font-bold text-[#FF5C00]">{formatRupiah(item.hargaJual)}</p>
                  {item.stok > 0 && <p className="text-[9px] text-slate-400 dark:text-slate-500">{item.stok} {item.satuan}</p>}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Customer Info */}
        <div className="rounded-3xl p-4 space-y-2" style={{ background: GL, backdropFilter: "blur(16px)", ...WB, border: "1px solid rgba(255,255,255,0.6)" }}>
          <div className="flex gap-2">
            <input type="text" value={customerNama} onChange={(e) => setCustomerNama(e.target.value)}
              placeholder="Nama pelanggan (opsional)"
              className="flex-1 h-10 px-3 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#7B61FF]/30" />
            <input type="text" inputMode="tel" value={customerWA}
              onChange={(e) => setCustomerWA(e.target.value.replace(/\D/g, ""))}
              placeholder="No. WA"
              className="w-28 h-10 px-3 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#7B61FF]/30" />
          </div>
        </div>

        {/* Cart */}
        {cart.length > 0 && (
          <div className="rounded-3xl p-4 space-y-2" style={{ background: GL, backdropFilter: "blur(16px)", ...WB, border: "1px solid rgba(255,255,255,0.6)" }}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-900 dark:text-white">Keranjang ({cart.length})</p>
              <button onClick={() => { setCart([]); setInventoryLinks([]); }} className="text-[10px] text-rose-500/70 hover:text-rose-500">Hapus Semua</button>
            </div>
            <AnimatePresence>
              {cart.map((e, i) => (
                <motion.div key={`${e.itemId}-${i}`} variants={cartPop} initial="hidden" animate="visible" exit="exit" layout
                  className="flex items-start justify-between gap-2 py-2 border-b border-slate-100 dark:border-slate-800/40 last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-slate-900 dark:text-white truncate">{e.nama}</span>
                      {e.itemId && <span className="text-[9px] text-indigo-500/60 dark:text-indigo-400/60 shrink-0">(stok)</span>}
                    </div>
                    <button onClick={() => setSpecModal({ index: i, open: true })}
                      className="text-[11px] font-normal italic text-slate-400 dark:text-zinc-500 hover:text-[#7B61FF] transition-colors flex items-center gap-0.5 mt-0.5">
                      <Pencil className="size-2.5" />
                      {e.spesifikasi ? <span className="italic truncate max-w-[150px]">{e.spesifikasi}</span> : "Atur Spesifikasi"}
                    </button>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => updateCartQty(i, -1)}
                      className="size-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-400">
                      <Minus className="size-3" />
                    </motion.button>
                    <span className="text-sm font-bold w-6 text-center tabular-nums text-slate-900 dark:text-white">{e.qty}</span>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => updateCartQty(i, 1)}
                      className="size-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-400">
                      <Plus className="size-3" />
                    </motion.button>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <input type="text" inputMode="numeric" value={e.harga}
                      onChange={(ev) => updateCartPrice(i, parseInt(ev.target.value.replace(/\D/g, ""), 10) || 0)}
                      className="w-20 h-8 px-1.5 text-xs font-bold text-right tabular-nums rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7B61FF]/30" />
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => removeCartItem(i)}
                      className="size-7 rounded-lg bg-rose-500/10 flex items-center justify-center hover:bg-rose-500/20 transition-colors">
                      <Trash2 className="size-3 text-rose-500" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div className="flex justify-between text-sm font-bold border-t border-slate-200 dark:border-slate-800 pt-3 mt-1">
              <span className="text-slate-700 dark:text-slate-300">Total</span>
              <span className="text-[#FF5C00] tabular-nums">{formatRupiah(total)}</span>
            </div>
          </div>
        )}

        {/* Payment Method */}
        <div className="rounded-3xl p-4 space-y-3" style={{ background: GL, backdropFilter: "blur(16px)", ...WB, border: "1px solid rgba(255,255,255,0.6)" }}>
          <p className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Metode Pembayaran</p>
          <div className="flex gap-2">
            {(Object.keys(PAYMENT_CONFIG) as PaymentMethod[]).map((key) => {
              const cfg = PAYMENT_CONFIG[key];
              return (
                <motion.button key={key} whileTap={{ scale: 0.95 }}
                  onClick={() => setPaymentMethod(key)}
                  className={`flex-1 h-10 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                    paymentMethod === key
                      ? "bg-gradient-to-r from-[#7B61FF] to-[#6366F1] text-white shadow-lg shadow-[#7B61FF]/20"
                      : "bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 hover:bg-slate-200"
                  }`}>
                  {cfg.icon} {cfg.label}
                </motion.button>
              );
            })}
          </div>
          {paymentMethod === "DP" && (
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">Nominal DP</label>
              <input type="number" inputMode="numeric" value={dpAmount}
                onChange={(e) => setDpAmount(e.target.value.replace(/\D/g, ""))}
                placeholder="0" className="w-full h-10 px-3 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#7B61FF]/30 tabular-nums" />
              {dpValue > 0 && (
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 tabular-nums">
                  Sisa utang: <span className="font-semibold text-rose-500">{formatRupiah(remainingDebt)}</span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Wallet Selector & Action Buttons */}
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1">
            <label className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">Dompet Penerimaan</label>
            <select value={walletId} onChange={(e) => setWalletId(e.target.value)}
              className="w-full h-10 px-3 text-xs rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#7B61FF]/30">
              {branchWallets.map((w) => (
                <option key={w.id} value={w.id}>{w.namaDompet} ({formatRupiah(w.saldo)})</option>
              ))}
              {branchWallets.length === 0 && <option value="">Belum ada dompet</option>}
            </select>
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowQuickAdd(true)}
            className="h-10 px-3 rounded-xl bg-[#7B61FF]/20 text-[#7B61FF] hover:bg-[#7B61FF]/30 transition-colors text-xs font-medium flex items-center gap-1 shrink-0">
            <Plus className="size-3.5" />Menu
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowProductSearch(true)}
            className="h-10 px-3 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/30 transition-colors text-xs font-medium flex items-center gap-1 shrink-0">
            <Package className="size-3.5" />Cari
          </motion.button>
        </div>
      </div>

      {/* Floating Pay Button */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
        style={{ background: "linear-gradient(to top, rgba(248,249,253,1) 0%, rgba(248,249,253,0.95) 70%, transparent 100%)" }}>
        <div className="max-w-md mx-auto">
          <motion.button whileTap={{ scale: 0.97 }} onClick={bayar}
            disabled={isProcessing || cart.length === 0}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#7B61FF] to-[#FF5C00] text-white text-sm font-extrabold shadow-xl shadow-[#7B61FF]/30 flex items-center justify-center gap-2 disabled:opacity-30 disabled:pointer-events-none">
            {isProcessing ? (
              <div className="animate-spin size-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                <CreditCard className="size-5" />
                {cart.length === 0 ? "Pilih Produk" : `Bayar ${formatRupiah(total)}`}
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Floating Pill Navigation */}
      <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 w-[90%] max-w-sm h-14 rounded-full px-2 flex items-center justify-between shadow-2xl border border-white/10 z-40"
        style={{ background: "rgba(0,0,0,0.95)", backdropFilter: "blur(16px)", ...WB }}>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => router.push("/buku-usaha")}
          className="flex flex-col items-center gap-0.5 px-4 py-2">
          <Settings className="size-5 text-white/60" />
          <span className="text-[9px] text-white/40 font-medium">Menu</span>
        </motion.button>
        <div className="bg-white text-black px-5 py-2.5 rounded-full flex items-center gap-2 text-xs font-extrabold shadow-md">
          <ShoppingBag className="size-4" />
          Kasir
        </div>
        <motion.button whileTap={{ scale: 0.9 }}
          onClick={() => {
            const slug = bookOrBranchId.replace("usaha-", "");
            router.push(backHref ? `${backHref}/transaksi` : `/buku-usaha/${slug}/transaksi`);
          }}
          className="flex flex-col items-center gap-0.5 px-4 py-2">
          <CreditCard className="size-5 text-white/60" />
          <span className="text-[9px] text-white/40 font-medium">Riwayat</span>
        </motion.button>
      </div>

      {/* Modals */}
      <ProductSearchModal isOpen={showProductSearch} onClose={() => setShowProductSearch(false)} onSelect={selectProduct} bookOrBranchId={bookOrBranchId} />
      <QuickAddProductModal open={showQuickAdd} onOpenChange={setShowQuickAdd} branch={bookOrBranchId} variant={getQuickAddVariant(bookOrBranchId)} onSaved={loadInventory} />
      <SpesifikasiModal open={specModal.open && specModal.index >= 0}
        onOpenChange={(o) => setSpecModal((prev) => ({ ...prev, open: o }))}
        branch={bookOrBranchId}
        existingSpesifikasi={specModal.index >= 0 && cart[specModal.index]?.spesifikasi || ""}
        onSave={(formatted) => {
          if (specModal.index >= 0) {
            setCart((prev) => prev.map((item, j) => j === specModal.index ? { ...item, spesifikasi: formatted } : item));
          }
        }}
      />
    </div>
  );
}
