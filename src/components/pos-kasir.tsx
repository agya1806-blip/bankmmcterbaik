"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Minus, Trash2, ArrowLeft, CheckCircle2, Package,
  Search, Store, Grid3X3, ShoppingBag, Coffee,
  Printer, Monitor, Smartphone, Shirt, Tag, Pencil,
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

function getBranchIcon(branch: BookOrBranch, className?: string) {
  const cls = className || "size-4";
  switch (branch) {
    case "usaha-warkop": return <Coffee className={cls} />;
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

export default function PosKasir({ branchConfig, backHref }: PosKasirProps) {
  const { bookOrBranchId, title, subtitle, icon, inventoryQuery = [] } = branchConfig;
  const router = useRouter();
  const { wallets, setLastKasirUnit } = useBusinessStore();
  const [mounted, setMounted] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [inventoryLinks, setInventoryLinks] = useState<{ itemId: string; qtyDipotong: number }[]>([]);
  const [specModal, setSpecModal] = useState<{ index: number; open: boolean }>({ index: -1, open: false });
  const [customerNama, setCustomerNama] = useState("");
  const [customerWA, setCustomerWA] = useState("");
  const [walletId, setWalletId] = useState(wallets[0]?.id || "wallet-kas");
  const [invoiceId, setInvoiceId] = useState("");
  const [showBill, setShowBill] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [inventory, setInventory] = useState<DbInventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [loadingInv, setLoadingInv] = useState(false);

  useEffect(() => setMounted(true), []);

  const loadInventory = useCallback(async () => {
    if (inventoryQuery && inventoryQuery.length > 0) {
      setInventory(inventoryQuery);
      return;
    }
    setLoadingInv(true);
    try {
      const items = await db.inventory.where("bookOrBranchId").equals(bookOrBranchId).toArray();
      setInventory(items);
    } catch {
      setInventory([]);
    } finally {
      setLoadingInv(false);
    }
  }, [inventoryQuery, bookOrBranchId]);

  useEffect(() => { loadInventory(); }, [loadInventory]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    inventory.forEach((i) => { if (i.kategori) cats.add(i.kategori); });
    return Array.from(cats).sort();
  }, [inventory]);

  const filteredInventory = useMemo(() => {
    let result = inventory;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((i) => i.nama.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q));
    }
    if (activeCategory) {
      result = result.filter((i) => i.kategori === activeCategory);
    }
    return result;
  }, [inventory, searchQuery, activeCategory]);

  const total = useMemo(() => cart.reduce((s, e) => s + e.harga * e.qty, 0), [cart]);

  const addToCart = (item: DbInventoryItem) => {
    if (item.stok > 0 && item.stok <= item.stokMin) {
      toast(`${item.nama} tersisa ${item.stok} ${item.satuan}`, { icon: "\u26A0\uFE0F" });
    }
    setCart((prev) => {
      const ex = prev.find((e) => e.itemId === item.id);
      if (ex) return prev.map((e) => e.itemId === item.id ? { ...e, qty: e.qty + 1 } : e);
      return [...prev, { nama: item.nama, harga: item.hargaJual, qty: 1, itemId: item.id }];
    });
    setInventoryLinks((prev) => {
      const ex = prev.find((l) => l.itemId === item.id);
      if (ex) return prev.map((l) => l.itemId === item.id ? { ...l, qtyDipotong: l.qtyDipotong + 1 } : l);
      return [...prev, { itemId: item.id, qtyDipotong: 1 }];
    });
    toast.success(`${item.nama} ditambahkan`);
  };

  const updateCartPrice = (index: number, newHarga: number) => {
    setCart((prev) => prev.map((item, j) => j === index ? { ...item, harga: newHarga } : item));
  };

  const selectProduct = useCallback((item: { id: string; nama: string; hargaJual: number; qty: number }) => {
    setCart((prev) => {
      const ex = prev.find((e) => e.itemId === item.id);
      if (ex) return prev.map((e) => e.itemId === item.id ? { ...e, qty: e.qty + item.qty } : e);
      return [...prev, { nama: item.nama, harga: item.hargaJual, qty: item.qty, itemId: item.id }];
    });
    setInventoryLinks((prev) => {
      const ex = prev.find((l) => l.itemId === item.id);
      if (ex) return prev.map((l) => l.itemId === item.id ? { ...l, qtyDipotong: l.qtyDipotong + item.qty } : l);
      return [...prev, { itemId: item.id, qtyDipotong: item.qty }];
    });
    setShowProductSearch(false);
    toast.success(`${item.nama} ditambahkan`);
  }, []);

  const bayar = useCallback(async () => {
    if (cart.length === 0) { toast.error("Keranjang kosong"); return; }
    setIsProcessing(true);
    try {
      const invId = generateId(bookOrBranchId);

      const items: DbTransactionItem[] = cart.map((e) => ({
        id: crypto.randomUUID(),
        namaItem: e.nama,
        qty: e.qty,
        hargaSatuan: e.harga,
        subtotal: e.harga * e.qty,
        spesifikasi: e.spesifikasi || "",
      }));

      const payload: PipelineInputV4 = {
        id: invId,
        bookOrBranchId,
        invoiceNumber: invId,
        tanggal: new Date().toISOString().slice(0, 10),
        items,
        totalBruto: total,
        dpDibayar: total,
        walletIdTarget: walletId,
        customerNama: customerNama.trim(),
        customerWA: customerWA,
        inventoryLinks: inventoryLinks.length > 0 ? inventoryLinks : undefined,
      };

      const result = await executeTransactionPipelineV4(payload);

      if (!result.ok) {
        toast.error(result.error || "Gagal memproses pembayaran");
        return;
      }

      setInvoiceId(invId);
      setLastKasirUnit(bookOrBranchId);
      toast.success("Pembayaran berhasil!");
      setShowBill(true);
    } catch {
      toast.error("Gagal memproses pembayaran");
    } finally {
      setIsProcessing(false);
    }
  }, [cart, total, walletId, bookOrBranchId, setLastKasirUnit, inventoryLinks, customerNama, customerWA]);

  const resetCart = useCallback(() => {
    setCart([]);
    setInventoryLinks([]);
    setShowBill(false);
    loadInventory();
  }, [loadInventory]);

  if (!mounted) return <KasirSkeleton />;

  return (
    <div className="min-h-screen bg-[#F8F9FD] dark:bg-[#0B0C16]">
      <div className="max-w-2xl mx-auto pb-24 space-y-4 animate-fade-in px-3 sm:px-0 pt-4">
        {!showBill ? (
          <>
            {/* ─── Header ─── */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(backHref || "/buku-usaha")}
                className="size-10 rounded-xl bg-white dark:bg-slate-800/80 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200/60 dark:border-slate-800/60"
              >
                <ArrowLeft className="size-5 text-slate-500 dark:text-slate-300" />
              </button>
              <div className="size-11 rounded-2xl bg-gradient-to-br from-[#7B61FF] to-[#FF5C00] flex items-center justify-center shadow-xl shadow-[#7B61FF]/20">
                <div className="size-5 text-white">{icon}</div>
              </div>
              <div>
                <h1 className="text-base font-bold font-heading text-slate-900 dark:text-white">{title}</h1>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{subtitle}</p>
              </div>
            </div>

            {/* ─── Tombol Tambah Produk Baru (selalu tampak) ─── */}
            <button
              onClick={() => setShowQuickAdd(true)}
              className="btn-gradient w-full py-3.5 rounded-2xl text-sm gap-2"
            >
              <Plus className="size-4" />
              Tambah Menu/Produk Baru
            </button>

            {/* ─── Search & Category Filters ─── */}
            <div className="premium-card p-4 space-y-3 bg-white/90 backdrop-blur-md dark:bg-[#131527]/90 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari produk..."
                  className="w-full h-10 pl-8 pr-3 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#7B61FF]/30"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setActiveCategory("")}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                    !activeCategory
                      ? "bg-[#7B61FF]/20 text-[#7B61FF]"
                      : "bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <Grid3X3 className="size-3 inline mr-1" />Semua
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(activeCategory === cat ? "" : cat)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                      activeCategory === cat
                        ? "bg-[#7B61FF]/20 text-[#7B61FF]"
                        : "bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* ─── Inventory Grid / Empty State ─── */}
            {loadingInv ? (
              <div className="premium-card p-6 text-center space-y-3 bg-white/90 backdrop-blur-md dark:bg-[#131527]/90 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl">
                <div className="animate-spin size-6 border-2 border-[#7B61FF] border-t-transparent rounded-full mx-auto" />
                <p className="text-xs text-slate-500 dark:text-slate-400">Memuat produk...</p>
              </div>
            ) : inventory.length === 0 ? (
              <div className="premium-card p-8 text-center space-y-3 bg-white/90 backdrop-blur-md dark:bg-[#131527]/90 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl">
                <Store className="size-10 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-sm font-bold text-slate-900 dark:text-white">Belum ada produk</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Tambah produk sekarang agar bisa dijual</p>
              </div>
            ) : filteredInventory.length === 0 ? (
              <div className="premium-card p-6 text-center bg-white/90 backdrop-blur-md dark:bg-[#131527]/90 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl">
                <p className="text-xs text-slate-500 dark:text-slate-400">Tidak ada produk yang cocok</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {filteredInventory.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className="premium-card p-3 text-center space-y-1.5 bg-white/90 backdrop-blur-md dark:bg-[#131527]/90 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-200"
                  >
                    <div className="size-10 rounded-xl bg-gradient-to-br from-[#7B61FF]/20 to-[#FF5C00]/10 flex items-center justify-center mx-auto">
                      {getBranchIcon(bookOrBranchId, "size-4 text-[#7B61FF]")}
                    </div>
                    <p className="text-sm font-semibold leading-tight line-clamp-2 text-slate-900 dark:text-white">{item.nama}</p>
                    <p className="text-xs font-bold text-[#FF5C00]">{formatRupiah(item.hargaJual)}</p>
                    {item.stok > 0 && (
                      <p className="text-[9px] text-slate-400 dark:text-slate-500">{item.stok} {item.satuan}</p>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* ─── Customer Info ─── */}
            <div className="premium-card p-4 space-y-2 bg-white/90 backdrop-blur-md dark:bg-[#131527]/90 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customerNama}
                  onChange={(e) => setCustomerNama(e.target.value)}
                  placeholder="Nama pelanggan (opsional)"
                  className="flex-1 h-10 px-3 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#7B61FF]/30"
                />
                <input
                  type="text"
                  inputMode="tel"
                  value={customerWA}
                  onChange={(e) => setCustomerWA(e.target.value.replace(/\D/g, ""))}
                  placeholder="No. WA"
                  className="w-28 h-10 px-3 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#7B61FF]/30"
                />
              </div>
            </div>

            {/* ─── Cart ─── */}
            {cart.length > 0 && (
              <div className="premium-card p-4 space-y-2 bg-white/90 backdrop-blur-md dark:bg-[#131527]/90 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Keranjang ({cart.length})</p>
                  <button
                    onClick={() => { setCart([]); setInventoryLinks([]); }}
                    className="text-[10px] text-rose-500/70 hover:text-rose-500"
                  >
                    Hapus Semua
                  </button>
                </div>
                {cart.map((e, i) => (
                  <div key={i} className="flex items-start justify-between gap-2 py-2 border-b border-slate-100 dark:border-slate-800/40 last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-slate-900 dark:text-white truncate">{e.nama}</span>
                        {e.itemId && <span className="text-[9px] text-indigo-500/60 dark:text-indigo-400/60 shrink-0">(stok)</span>}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <button
                          onClick={() => setSpecModal({ index: i, open: true })}
                          className="text-xs text-slate-400 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors flex items-center gap-0.5"
                        >
                          <Pencil className="size-2.5" />
                          {e.spesifikasi ? (
                            <span className="italic text-xs text-slate-500 dark:text-slate-400 truncate max-w-[150px]">{e.spesifikasi}</span>
                          ) : (
                            "Atur Spesifikasi"
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setCart((p) => p.map((x, j) => j === i ? { ...x, qty: Math.max(1, x.qty - 1) } : x));
                          if (e.itemId) {
                            setInventoryLinks((p) =>
                              p.map((l) =>
                                l.itemId === e.itemId ? { ...l, qtyDipotong: Math.max(1, l.qtyDipotong - 1) } : l
                              )
                            );
                          }
                        }}
                        className="size-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-400"
                      >
                        <Minus className="size-3" />
                      </button>
                      <span className="text-sm font-bold w-6 text-center tabular-nums text-slate-900 dark:text-white">{e.qty}</span>
                      <button
                        onClick={() => setCart((p) => p.map((x, j) => j === i ? { ...x, qty: x.qty + 1 } : x))}
                        className="size-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-400"
                      >
                        <Plus className="size-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={e.harga}
                        onChange={(e) => {
                          const val = parseInt(e.target.value.replace(/\D/g, ""), 10) || 0;
                          updateCartPrice(i, val);
                        }}
                        className="w-20 h-8 px-1.5 text-xs font-bold text-right tabular-nums rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7B61FF]/30"
                      />
                      <button
                        onClick={() => {
                          setCart((p) => p.filter((_, j) => j !== i));
                          if (e.itemId) setInventoryLinks((p) => p.filter((l) => l.itemId !== e.itemId));
                        }}
                        className="size-7 rounded-lg bg-rose-500/10 flex items-center justify-center hover:bg-rose-500/20 transition-colors"
                      >
                        <Trash2 className="size-3 text-rose-500" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-bold border-t border-slate-200 dark:border-slate-800 pt-3 mt-1">
                  <span className="text-slate-700 dark:text-slate-300">Total</span>
                  <span className="text-[#FF5C00] tabular-nums">{formatRupiah(total)}</span>
                </div>
              </div>
            )}

            {/* ─── Wallet Selector & Action Buttons ─── */}
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1">
                <label className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Dompet Penerimaan</label>
                <select
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#7B61FF]/30"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>{w.namaDompet}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setShowQuickAdd(true)}
                className="h-10 px-3 rounded-xl bg-[#7B61FF]/20 text-[#7B61FF] hover:bg-[#7B61FF]/30 transition-colors text-xs font-medium flex items-center gap-1 shrink-0"
              >
                <Plus className="size-3.5" />Menu
              </button>
              <button
                onClick={() => setShowProductSearch(true)}
                className="h-10 px-3 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/30 transition-colors text-xs font-medium flex items-center gap-1 shrink-0"
              >
                <Package className="size-3.5" />Cari
              </button>
            </div>

            {/* ─── Pay Button ─── */}
            <button
              onClick={bayar}
              disabled={isProcessing || cart.length === 0}
              className="btn-gradient w-full py-4 rounded-2xl text-sm gap-2 disabled:opacity-30"
            >
              {isProcessing ? "Memproses..." : `Bayar ${formatRupiah(total)}`}
            </button>

            {/* ─── Modals ─── */}
            <ProductSearchModal
              isOpen={showProductSearch}
              onClose={() => setShowProductSearch(false)}
              onSelect={selectProduct}
              bookOrBranchId={bookOrBranchId}
            />

            <QuickAddProductModal
              open={showQuickAdd}
              onOpenChange={setShowQuickAdd}
              branch={bookOrBranchId}
              variant={getQuickAddVariant(bookOrBranchId)}
              onSaved={loadInventory}
            />

            <SpesifikasiModal
              open={specModal.open && specModal.index >= 0}
              onOpenChange={(o) => setSpecModal((prev) => ({ ...prev, open: o }))}
              branch={bookOrBranchId}
              existingSpesifikasi={specModal.index >= 0 && cart[specModal.index]?.spesifikasi || ""}
              onSave={(formatted) => {
                if (specModal.index >= 0) {
                  setCart((prev) => prev.map((item, j) => j === specModal.index ? { ...item, spesifikasi: formatted } : item));
                }
              }}
            />
          </>
        ) : (
          /* ─── Success Screen ─── */
          <div className="premium-card p-6 space-y-4 text-center bg-white/90 backdrop-blur-md dark:bg-[#131527]/90 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl">
            <div className="size-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="size-8 text-emerald-500" />
            </div>
            <p className="text-lg font-bold font-heading text-slate-900 dark:text-white">Pembayaran Berhasil!</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">No. {invoiceId}</p>
            <p className="text-sm font-bold text-[#FF5C00]">{formatRupiah(total)}</p>
            {customerWA && (
              <p className="text-[10px] text-emerald-600/60 dark:text-emerald-400/60">Poin loyalitas otomatis ditambahkan</p>
            )}
            <button
              onClick={resetCart}
              className="btn-gradient w-full py-4 rounded-2xl text-sm gap-2"
            >
              <Plus className="size-4" />Transaksi Baru
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
