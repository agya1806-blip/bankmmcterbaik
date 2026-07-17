"use client";

import React, { useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLiveQuery } from "@/hooks/useLiveQuery";
import {
  db,
  type BookOrBranch,
  type DbInventoryItem,
  type DbCustomer,
  type DbTransaction,
} from "@/lib/db-v4";
import {
  executeTransactionPipelineV4,
  type PosCartItem,
  type PipelineResultV4,
} from "@/engine/transaction-pipeline-v4";

import KalkulatorHarga from "@/components/business/kalkulator-harga";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Calculator,
  Plus,
  Search,
  Trash2,
  ShoppingBag,
  AlertTriangle,
  Zap,
  ChevronDown,
  X,
  Image,
  Upload,
  Banknote,
  Wallet,
  Smartphone,
  QrCode,
  FileText,
  Settings,
  Tag,
  Receipt,
  Minus,
  CreditCard,
} from "lucide-react";

const BRANCH_MAP: Record<string, BookOrBranch> = {
  pribadi: "pribadi",
  keluarga: "keluarga",
  percetakan: "usaha-percetakan",
  laptop: "usaha-laptop",
  gadget: "usaha-gadget",
  warkop: "usaha-warkop",
  kelontong: "usaha-kelontong",
  konveksi: "usaha-konveksi",
  "toko-pakaian": "usaha-toko-pakaian",
};

interface CartItem {
  id: string;
  namaItem: string;
  qty: number;
  hargaSatuan: number;
  diskonPersen: number;
  spesifikasi: string;
}

const PAYMENT_METHODS = [
  { key: "CASH" as const, label: "Tunai", icon: <Banknote className="w-4 h-4" />, color: "from-emerald-500 to-teal-500" },
  { key: "TRANSFER" as const, label: "Transfer", icon: <Wallet className="w-4 h-4" />, color: "from-blue-500 to-indigo-500" },
  { key: "DEPOSIT" as const, label: "Deposit", icon: <Smartphone className="w-4 h-4" />, color: "from-purple-500 to-pink-500" },
  { key: "QRIS" as const, label: "QRIS", icon: <Smartphone className="w-4 h-4" />, color: "from-orange-500 to-red-500" },
];

const PPN_RATE = 11;

export default function PosKasirPage() {
  const params = useParams();
  const router = useRouter();
  const cabangSlug = (params?.cabang as string) || "";
  const bookOrBranchId: BookOrBranch = BRANCH_MAP[cabangSlug] || "usaha-warkop";

  const products =
    useLiveQuery(
      () => db.inventory.where("bookOrBranchId").equals(bookOrBranchId).toArray(),
      [bookOrBranchId]
    ) || [];

  const customers =
    useLiveQuery(
      () => db.customers.where("bookOrBranchId").equals(bookOrBranchId).toArray(),
      [bookOrBranchId]
    ) || [];

  const wallets =
    useLiveQuery(
      () => db.wallets.where("bookOrBranchId").equals(bookOrBranchId).toArray(),
      [bookOrBranchId]
    ) || [];

  const recentTransactions =
    useLiveQuery(
      () =>
        db.transactions
          .where("bookOrBranchId")
          .equals(bookOrBranchId)
          .reverse()
          .limit(5)
          .toArray(),
      [bookOrBranchId]
    ) || [];

  const quickOrders =
    useLiveQuery(
      () => db.quickOrders.where("bookOrBranchId").equals(bookOrBranchId).toArray(),
      [bookOrBranchId]
    ) || [];

  // ─── Search & Filter ───
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKategori, setSelectedKategori] = useState("Semua");

  const kategoriList = useMemo(() => {
    const cats = new Set(products.map((p) => p.kategori).filter(Boolean));
    return ["Semua", ...Array.from(cats)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.nama.toLowerCase().includes(searchQuery.toLowerCase());
      const matchKategori = selectedKategori === "Semua" || p.kategori === selectedKategori;
      return matchSearch && matchKategori;
    });
  }, [products, searchQuery, selectedKategori]);

  // ─── Cart State ───
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedWalletId, setSelectedWalletId] = useState("");
  const [catatan, setCatatan] = useState("");
  const [dpDibayar, setDpDibayar] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "DEPOSIT" | "TRANSFER" | "QRIS">("CASH");
  const [isProcessing, setIsProcessing] = useState(false);

  // ─── Diskon & PPN ───
  const [diskonGlobalPersen, setDiskonGlobalPersen] = useState(0);
  const [ppnEnabled, setPpnEnabled] = useState(true);

  // ─── Spec Modal ───
  const [activeSpecItem, setActiveSpecItem] = useState<CartItem | null>(null);
  const [specInput1, setSpecInput1] = useState("");
  const [specInput2, setSpecInput2] = useState("");
  const [specInput3, setSpecInput3] = useState("");

  // ─── Modals ───
  const [showCalculator, setShowCalculator] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showQuickOrder, setShowQuickOrder] = useState(false);
  const [showRiwayat, setShowRiwayat] = useState(false);

  // ─── Quick Add ───
  const [newProdName, setNewProdName] = useState("");
  const [newProdHargaJual, setNewProdHargaJual] = useState(0);
  const [newProdHargaModal, setNewProdHargaModal] = useState(0);
  const [newProdStok, setNewProdStok] = useState(10);

  // ─── QRIS Upload ───
  const [buktiBayar, setBuktiBayar] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Cart Calculations ───
  const totalBruto = useMemo(
    () => cart.reduce((sum, item) => sum + item.qty * item.hargaSatuan, 0),
    [cart]
  );

  const totalDiskonItem = useMemo(
    () =>
      cart.reduce(
        (sum, item) => sum + item.qty * item.hargaSatuan * (item.diskonPersen / 100),
        0
      ),
    [cart]
  );

  const subtotalAfterItemDiskon = totalBruto - totalDiskonItem;

  const totalDiskonGlobal = subtotalAfterItemDiskon * (diskonGlobalPersen / 100);
  const subtotalAfterDiskon = subtotalAfterItemDiskon - totalDiskonGlobal;
  const ppnNominal = ppnEnabled ? subtotalAfterDiskon * (PPN_RATE / 100) : 0;
  const grandTotal = subtotalAfterDiskon + ppnNominal;

  const currentCustomer = useMemo(() => {
    if (!selectedCustomerId) return null;
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  // ─── Cart Actions ───
  const addToCart = (product: DbInventoryItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.qty >= product.stok) return prev;
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          namaItem: product.nama,
          qty: 1,
          hargaSatuan: product.hargaJual,
          diskonPersen: 0,
          spesifikasi: product.catatan || "",
        },
      ];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const updateCartItemHarga = (id: string, newHarga: number) => {
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, hargaSatuan: newHarga } : item))
    );
  };

  const updateCartItemDiskon = (id: string, diskon: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, diskonPersen: Math.min(100, Math.max(0, diskon)) } : item
      )
    );
  };

  const removeItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setDiskonGlobalPersen(0);
    setDpDibayar(0);
  };

  // ─── Spec Modal ───
  const openSpecModal = (item: CartItem) => {
    setActiveSpecItem(item);
    const parts = item.spesifikasi.split(" | ");
    setSpecInput1(parts[0]?.split(": ")[1] || "");
    setSpecInput2(parts[1]?.split(": ")[1] || "");
    setSpecInput3(parts[2]?.split(": ")[1] || "");
  };

  const saveSpecifications = () => {
    if (!activeSpecItem) return;

    let formattedSpec = "";
    if (cabangSlug === "percetakan" || cabangSlug === "konveksi") {
      formattedSpec = `Ukuran: ${specInput1 || "-"} | Bahan: ${specInput2 || "-"} | Finishing: ${specInput3 || "-"}`;
    } else if (cabangSlug === "laptop" || cabangSlug === "gadget") {
      if (!specInput1.trim()) {
        alert("SN / IMEI Wajib diisi untuk unit ini!");
        return;
      }
      formattedSpec = `SN/IMEI: ${specInput1} | Spek: ${specInput2 || "-"} | Kondisi: ${specInput3 || "-"}`;
    } else {
      formattedSpec = `Catatan: ${specInput1}`;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.id === activeSpecItem.id ? { ...item, spesifikasi: formattedSpec } : item
      )
    );
    setActiveSpecItem(null);
  };

  // ─── Quick Add Product ───
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName) return;

    const newId = crypto.randomUUID();
    await db.inventory.add({
      id: newId,
      bookOrBranchId,
      sku: `SKU-${Date.now()}`,
      nama: newProdName,
      kategori: "Umum",
      stok: newProdStok,
      stokMin: 2,
      hargaJual: newProdHargaJual,
      hargaModal: newProdHargaModal,
      satuan: "pcs",
      catatan: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    setCart((prev) => [
      ...prev,
      {
        id: newId,
        namaItem: newProdName,
        qty: 1,
        hargaSatuan: newProdHargaJual,
        diskonPersen: 0,
        spesifikasi: "",
      },
    ]);

    setNewProdName("");
    setNewProdHargaJual(0);
    setNewProdHargaModal(0);
    setNewProdStok(10);
    setShowQuickAdd(false);
  };

  // ─── Quick Order ───
  const applyQuickOrder = (template: { id: string; label: string; items: { desc: string; price: number }[] }) => {
    const newItems: CartItem[] = template.items.map((ti) => ({
      id: crypto.randomUUID(),
      namaItem: ti.desc,
      qty: 1,
      hargaSatuan: ti.price,
      diskonPersen: 0,
      spesifikasi: "",
    }));
    setCart((prev) => [...prev, ...newItems]);
    setShowQuickOrder(false);
  };

  // ─── QRIS Upload ───
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBuktiBayar(reader.result as string);
    reader.readAsDataURL(file);
  };

  // ─── Kalkulator Result ───
  const handleCalcResult = (namaItem: string, hargaJual: number, spesifikasi: string) => {
    setCart((prev) => [
      ...prev,
      { id: crypto.randomUUID(), namaItem, qty: 1, hargaSatuan: hargaJual, diskonPersen: 0, spesifikasi },
    ]);
  };

  // ─── Checkout ───
  const handleCheckout = async () => {
    if (cart.length === 0) return alert("Keranjang belanja kosong!");
    if (isProcessing) return;

    setIsProcessing(true);

    try {
      const invId = crypto.randomUUID();
      const items: PosCartItem[] = cart.map((item) => ({
        namaItem: item.namaItem,
        qty: item.qty,
        hargaSatuan: item.hargaSatuan,
        diskonPersen: item.diskonPersen,
        spesifikasi: item.spesifikasi,
      }));

      const res: PipelineResultV4 = await executeTransactionPipelineV4({
        id: invId,
        bookOrBranchId,
        items,
        totalBruto,
        diskonGlobalPersen,
        ppnPersen: ppnEnabled ? PPN_RATE : 0,
        dpDibayar,
        paymentMethod,
        walletIdTarget: selectedWalletId,
        customerNama: currentCustomer?.nama || "Pelanggan Umum",
        customerWA: currentCustomer?.noWA || "",
        catatan,
        buktiBayar: paymentMethod === "QRIS" ? buktiBayar : undefined,
      });

      if (res.ok) {
        alert(`Transaksi Berhasil! No Invoice: ${res.invoiceNumber}`);
        clearCart();
        setSelectedCustomerId("");
        setSelectedWalletId("");
        setCatatan("");
        setBuktiBayar("");
        setPpnEnabled(true);
      } else {
        alert(`Transaksi Gagal: ${res.error}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      alert(`Transaksi Gagal: ${message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── Format Helpers ───
  const formatRp = (n: number) => `Rp${n.toLocaleString()}`;
  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex-1 flex flex-col pt-4 gap-3">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/buku-usaha")}
          className="p-2 bg-white dark:bg-[#131527] rounded-full shadow-md active:scale-95 transition-transform"
        >
          <ChevronDown className="w-4 h-4 rotate-90" />
        </button>
        <h1 className="text-lg font-heading font-extrabold tracking-tight capitalize">
          Kasir {cabangSlug}
        </h1>
        <div className="flex gap-1.5">
          <button
            onClick={() => setShowRiwayat(true)}
            className="p-2 bg-white dark:bg-[#131527] rounded-full shadow-md active:scale-95 transition-transform"
            title="Riwayat Cepat"
          >
            <span className="text-xs text-slate-500"><Clock className="w-4 h-4" /></span>
          </button>
          <button
            onClick={() => setShowCalculator(true)}
            className="p-2 bg-emerald-500 text-white rounded-full shadow-md active:scale-95 transition-transform"
            title="Kalkulator Harga"
          >
            <Calculator className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowQuickAdd(true)}
            className="p-2 bg-gradient-to-r from-[#008CEB] to-[#00C9A7] text-white rounded-full shadow-md active:scale-95 transition-transform"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ═══ SEARCH + KATEGORI ═══ */}
      <div className="space-y-2">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-slate-400"><Search className="w-4 h-4" /></span>
          <input
            type="text"
            placeholder="Cari produk..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white dark:bg-[#131527] border border-slate-200/60 dark:border-slate-800/60 focus:outline-none text-sm shadow-inner"
          />
        </div>

        {/* Kategori Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {kategoriList.map((kat) => (
            <button
              key={kat}
              onClick={() => setSelectedKategori(kat)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                selectedKategori === kat
                  ? "bg-[#008CEB] text-white shadow-md"
                  : "bg-white dark:bg-[#131527] text-slate-400 border border-slate-200/60 dark:border-slate-800/60"
              }`}
            >
              {kat}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ PRODUCT GRID ═══ */}
      <div className="grid grid-cols-2 gap-2 max-h-[180px] overflow-y-auto pr-1">
        {filteredProducts.map((prod, i) => (
          <button
            key={prod.id}
            onClick={() => addToCart(prod)}
            disabled={prod.stok <= 0}
            className="premium-card p-2.5 text-left active:scale-[0.96] disabled:opacity-40 disabled:scale-100 animate-fade-in"
            style={{ animationDelay: `${i * 30}ms`, animationFillMode: "backwards" }}
          >
            <span className="text-[11px] font-heading font-bold line-clamp-1">{prod.nama}</span>
            <div className="flex items-center justify-between w-full mt-1.5">
              <span className="text-[10px] text-[#008CEB] font-extrabold">
                {formatRp(prod.hargaJual)}
              </span>
              <span
                className={`text-[9px] font-bold ${
                  prod.stok <= prod.stokMin ? "text-amber-500" : "text-slate-400"
                }`}
              >
                {prod.stok <= prod.stokMin && <span className="text-xs inline mr-0.5"><AlertTriangle className="w-4 h-4" /></span>}
                {prod.stok}
              </span>
            </div>
          </button>
        ))}
        {filteredProducts.length === 0 && (
          <div className="col-span-2 text-center py-6 text-slate-400 text-xs">
            Tidak ada produk ditemukan
          </div>
        )}
      </div>

      {/* ═══ QUICK ORDER BUTTON ═══ */}
      {quickOrders.length > 0 && (
        <button
          onClick={() => setShowQuickOrder(true)}
          className="w-full py-2 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 text-[10px] font-bold text-amber-600 flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
        >
           <Zap className="w-5 h-5" />
           Quick Order ({quickOrders.length} template)
        </button>
      )}

      {/* ═══ CART ═══ */}
      <div className="flex-1 overflow-y-auto max-h-[200px] space-y-2 pr-1">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Keranjang ({cart.length})
          </h3>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-[9px] text-rose-500 font-bold flex items-center gap-0.5 active:scale-95 transition-transform"
            >
              <Trash2 className="w-4 h-4" /> Kosongkan
            </button>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-slate-400">
            <span className="text-3xl mb-1.5"><ShoppingBag className="w-8 h-8" /></span>
            <span className="text-[11px]">Keranjang kosong</span>
          </div>
        ) : (
          cart.map((item, i) => {
            const product = products.find((p) => p.id === item.id);
            const isLowStock = product && product.stok <= product.stokMin;
            const isOutStock = product && product.stok <= 0;
            const subtotalItem = item.qty * item.hargaSatuan;
            const diskonItemNominal = subtotalItem * (item.diskonPersen / 100);
            const itemTotal = subtotalItem - diskonItemNominal;

            return (
              <div
                key={item.id}
                className="premium-card p-2.5 space-y-1.5 animate-slide-up"
                style={{ animationDelay: `${i * 40}ms`, animationFillMode: "backwards" }}
              >
                {/* Stok Warning */}
                {isLowStock && (
                  <div className="flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded-lg">
                    <span className="text-xs"><AlertTriangle className="w-4 h-4" /></span>
                    {isOutStock ? "STOK HABIS!" : `Stok hampir habis (${product?.stok} tersisa)`}
                  </div>
                )}

                {/* Item Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[11px] font-heading font-extrabold line-clamp-1">
                      {item.namaItem}
                    </h4>
                    {item.spesifikasi && (
                      <p className="text-[9px] text-indigo-500 font-medium mt-0.5 truncate">
                        {item.spesifikasi}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-rose-500 p-1 shrink-0 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors active:scale-90"
                  >
                    <span className="text-xs"><Trash2 className="w-4 h-4" /></span>
                  </button>
                </div>

                {/* Harga + Diskon per Item */}
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={item.hargaSatuan}
                    onChange={(e) => updateCartItemHarga(item.id, Number(e.target.value))}
                    className="w-24 input-premium text-[10px] font-extrabold text-[#008CEB] py-1"
                  />
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 rounded-lg px-1.5 py-0.5">
                    <span className="text-xs text-slate-400">%</span>
                    <input
                      type="number"
                      value={item.diskonPersen || ""}
                      onChange={(e) => updateCartItemDiskon(item.id, Number(e.target.value))}
                      placeholder="0"
                      className="w-8 text-[9px] font-bold text-center bg-transparent outline-none"
                    />
                  </div>
                  {item.diskonPersen > 0 && (
                    <span className="text-[8px] text-emerald-600 font-bold">
                      -{formatRp(diskonItemNominal)}
                    </span>
                  )}
                </div>

                {/* Qty + Spec + Subtotal */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQty(item.id, -1)}
                      className="p-1 bg-slate-100 dark:bg-zinc-800 rounded-full active:scale-90 transition-transform"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-heading font-extrabold min-w-[20px] text-center tabular-nums">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => updateQty(item.id, 1)}
                      className="p-1 bg-slate-100 dark:bg-zinc-800 rounded-full active:scale-90 transition-transform"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openSpecModal(item)}
                      className="p-1 bg-gradient-to-r from-[#008CEB] to-[#00C9A7] text-white rounded-full ml-0.5 active:scale-90 transition-transform"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-[10px] font-extrabold text-[#008CEB] tabular-nums">
                    {formatRp(itemTotal)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ═══ CHECKOUT AREA ═══ */}
      <div className="premium-card p-3 space-y-2.5">
        {/* Payment Method */}
        <div className="grid grid-cols-4 gap-1.5">
          {PAYMENT_METHODS.map((pm) => {
            const isActive = paymentMethod === pm.key;
            return (
              <button
                key={pm.key}
                onClick={() => setPaymentMethod(pm.key)}
                className={`py-1.5 rounded-xl text-[9px] font-bold transition-all flex flex-col items-center gap-0.5 ${
                  isActive
                    ? `bg-gradient-to-r ${pm.color} text-white shadow-md scale-105`
                    : "bg-slate-100 dark:bg-zinc-800 text-slate-400"
                }`}
              >
                <span>{pm.icon}</span>
                {pm.label}
              </button>
            );
          })}
        </div>

        {/* Diskon Global + PPN Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800 rounded-xl px-2.5 py-1.5">
            <Tag className="w-4 h-4" />
            <input
              type="number"
              value={diskonGlobalPersen || ""}
              onChange={(e) => setDiskonGlobalPersen(Number(e.target.value))}
              placeholder="0"
              className="w-10 text-[10px] font-bold bg-transparent outline-none text-center"
            />
            <span className="text-[9px] text-slate-400 font-bold">% Diskon</span>
          </div>
          <button
            onClick={() => setPpnEnabled(!ppnEnabled)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[9px] font-bold transition-all ${
              ppnEnabled
                ? "bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600"
                : "bg-slate-100 dark:bg-zinc-800 text-slate-400"
            }`}
          >
            %
            PPN {PPN_RATE}%
          </button>
        </div>

        {/* Rincian Harga */}
        <div className="space-y-1 text-[10px]">
          <div className="flex justify-between">
            <span className="text-slate-400">Subtotal ({cart.length} item)</span>
            <span className="font-bold tabular-nums">{formatRp(totalBruto)}</span>
          </div>
          {totalDiskonItem > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Diskon Item</span>
              <span className="font-bold tabular-nums">-{formatRp(totalDiskonItem)}</span>
            </div>
          )}
          {diskonGlobalPersen > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Diskon {diskonGlobalPersen}%</span>
              <span className="font-bold tabular-nums">-{formatRp(totalDiskonGlobal)}</span>
            </div>
          )}
          {ppnEnabled && (
            <div className="flex justify-between text-slate-500">
              <span>PPN {PPN_RATE}%</span>
              <span className="font-bold tabular-nums">+{formatRp(ppnNominal)}</span>
            </div>
          )}
        </div>

        {/* Grand Total */}
        <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-heading font-extrabold">TOTAL</span>
          <span className="text-lg font-heading font-extrabold gradient-text tracking-tight">
            {formatRp(grandTotal)}
          </span>
        </div>

        {/* DP */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-bold">DP Dibayar</span>
          <input
            type="number"
            value={dpDibayar || ""}
            onChange={(e) => setDpDibayar(Number(e.target.value))}
            placeholder="0"
            className="w-24 text-right input-premium font-bold text-[10px]"
          />
        </div>

        {/* Wallet */}
        <select
          value={selectedWalletId}
          onChange={(e) => setSelectedWalletId(e.target.value)}
          className="w-full input-premium font-bold text-[10px]"
        >
          <option value="">Pilih Dompet</option>
          {wallets.map((w) => (
            <option key={w.id} value={w.id}>
              {w.namaDompet} ({formatRp(w.saldo)})
            </option>
          ))}
        </select>

        {/* Customer */}
        <select
          value={selectedCustomerId}
          onChange={(e) => setSelectedCustomerId(e.target.value)}
          className="w-full input-premium font-bold text-[10px]"
        >
          <option value="">Pelanggan Umum</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nama} ({c.noWA})
            </option>
          ))}
        </select>

        {/* Catatan */}
        <input
          type="text"
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          placeholder="Catatan transaksi..."
          className="w-full input-premium font-bold text-[10px]"
        />

        {/* QRIS Upload */}
        {paymentMethod === "QRIS" && (
          <div>
            {buktiBayar ? (
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-100 dark:bg-zinc-800">
                <Image className="w-4 h-4" />
                <span className="text-[10px] font-bold truncate flex-1">Bukti terupload ✓</span>
                <button onClick={() => setBuktiBayar("")} className="text-[10px] text-rose-500 font-bold">
                  Hapus
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 rounded-xl border-2 border-dashed border-slate-300 dark:border-zinc-700 text-[10px] font-bold text-slate-400 flex items-center justify-center gap-1.5"
              >
                  <Upload className="w-4 h-4" /> Upload Bukti QRIS
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          </div>
        )}

        {/* Checkout Button */}
        <button
          onClick={handleCheckout}
          disabled={cart.length === 0 || isProcessing}
          className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <span className="animate-spin inline-block"><Zap className="w-4 h-4" /></span>
          ) : (
            <span><CreditCard className="w-4 h-4" /></span>
          )}
          {isProcessing ? "Memproses..." : `Bayar ${formatRp(grandTotal)}`}
        </button>
      </div>

      {/* ═══ MODALS ═══ */}

      {/* Spec Drawer */}
      <AnimatePresence>
        {activeSpecItem && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center backdrop-blur-sm">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="w-full max-w-md bg-white dark:bg-[#131527] rounded-t-[32px] p-5 pb-8 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-extrabold">Spesifikasi Produksi</h3>
                <button
                    onClick={() => setActiveSpecItem(null)}
                    className="p-1 rounded-full bg-slate-100 dark:bg-zinc-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
              </div>

              {(cabangSlug === "percetakan" || cabangSlug === "konveksi") && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block mb-1 font-bold text-slate-400">Ukuran</label>
                    <input
                      type="text"
                      placeholder="A3+, 2x1 Meter, XL"
                      value={specInput1}
                      onChange={(e) => setSpecInput1(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-bold text-slate-400">Bahan</label>
                    <input
                      type="text"
                      placeholder="Art Carton 260, Flexi Korea"
                      value={specInput2}
                      onChange={(e) => setSpecInput2(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-bold text-slate-400">Finishing</label>
                    <input
                      type="text"
                      placeholder="Laminating Glossy, Jilid Spiral"
                      value={specInput3}
                      onChange={(e) => setSpecInput3(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {(cabangSlug === "laptop" || cabangSlug === "gadget") && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block mb-1 font-bold text-slate-400">SN / IMEI (Wajib)</label>
                    <input
                      type="text"
                      placeholder="SN-821739812739"
                      value={specInput1}
                      onChange={(e) => setSpecInput1(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-bold text-slate-400">Detail Spek</label>
                    <input
                      type="text"
                      placeholder="i5-10th, RAM 8GB, SSD 256GB"
                      value={specInput2}
                      onChange={(e) => setSpecInput2(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-bold text-slate-400">Kondisi</label>
                    <select
                      value={specInput3}
                      onChange={(e) => setSpecInput3(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none font-medium"
                    >
                      <option value="Fullset Box">Fullset Box</option>
                      <option value="Unit Only">Unit Only</option>
                      <option value="Unit + Charger">Unit + Charger</option>
                    </select>
                  </div>
                </div>
              )}

              {!["percetakan", "konveksi", "laptop", "gadget"].includes(cabangSlug) && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block mb-1 font-bold text-slate-400">Catatan</label>
                    <textarea
                      rows={3}
                      placeholder="Catatan khusus transaksi..."
                      value={specInput1}
                      onChange={(e) => setSpecInput1(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={saveSpecifications}
                className="w-full py-3 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-extrabold text-xs active:scale-[0.98] transition-transform"
              >
                Terapkan Spesifikasi
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Kalkulator Harga */}
      <AnimatePresence>
        {showCalculator && (
          <KalkulatorHarga
            cabangSlug={cabangSlug}
            open={showCalculator}
            onClose={() => setShowCalculator(false)}
            onResult={handleCalcResult}
          />
        )}
      </AnimatePresence>

      {/* Quick Add Modal */}
      <AnimatePresence>
        {showQuickAdd && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-xs bg-white dark:bg-[#131527] rounded-3xl p-5 space-y-4 shadow-2xl border border-slate-100 dark:border-slate-800"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-extrabold tracking-tight">Tambah Produk Cepat</h3>
                <button onClick={() => setShowQuickAdd(false)} className="p-1 rounded-full bg-slate-100 dark:bg-zinc-800">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleQuickAdd} className="space-y-3 text-[11px] font-bold">
                <div>
                  <label className="block mb-1 text-slate-400">Nama Produk</label>
                  <input
                    type="text"
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    placeholder="Contoh: Laptop ASUS VivoBook"
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block mb-1 text-slate-400">Harga Jual (Rp)</label>
                    <input
                      type="number"
                      value={newProdHargaJual || ""}
                      onChange={(e) => setNewProdHargaJual(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-slate-400">HPP / Modal (Rp)</label>
                    <input
                      type="number"
                      value={newProdHargaModal || ""}
                      onChange={(e) => setNewProdHargaModal(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block mb-1 text-slate-400">Stok Awal</label>
                  <input
                    type="number"
                    value={newProdStok}
                    onChange={(e) => setNewProdStok(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#008CEB] to-[#00C9A7] text-white font-extrabold shadow-md active:scale-[0.98] transition-all"
                >
                  Simpan & Masuk Keranjang
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Order Modal */}
      <AnimatePresence>
        {showQuickOrder && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center backdrop-blur-sm">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="w-full max-w-md bg-white dark:bg-[#131527] rounded-t-[32px] p-5 pb-8 space-y-3 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-amber-500"><Zap className="w-5 h-5" /></span>
                  <h3 className="text-sm font-extrabold">Quick Order Templates</h3>
                </div>
                <button onClick={() => setShowQuickOrder(false)} className="p-1 rounded-full bg-slate-100 dark:bg-zinc-800">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {quickOrders.map((qo) => (
                  <button
                    key={qo.id}
                    onClick={() => applyQuickOrder(qo)}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 text-left active:scale-[0.98] transition-transform"
                  >
                    <span className="text-xs font-extrabold">{qo.label}</span>
                    <p className="text-[9px] text-slate-400 mt-0.5">
                      {qo.items.length} item • Total:{" "}
                      {formatRp(qo.items.reduce((s, ti) => s + ti.price, 0))}
                    </p>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mini Riwayat Modal */}
      <AnimatePresence>
        {showRiwayat && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center backdrop-blur-sm">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="w-full max-w-md bg-white dark:bg-[#131527] rounded-t-[32px] p-5 pb-8 space-y-3 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-indigo-500"><FileText className="w-4 h-4" /></span>
                  <h3 className="text-sm font-extrabold">5 Transaksi Terakhir</h3>
                </div>
                <button onClick={() => setShowRiwayat(false)} className="p-1 rounded-full bg-slate-100 dark:bg-zinc-800">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {recentTransactions.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">Belum ada riwayat</div>
                ) : (
                  recentTransactions.map((tx: DbTransaction) => (
                    <div key={tx.id} className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] bg-slate-200 dark:bg-zinc-700 px-2 py-0.5 rounded-md font-extrabold uppercase">
                          {tx.invoiceNumber}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            tx.status === "LUNAS"
                              ? "bg-emerald-100 text-emerald-600"
                              : "bg-amber-100 text-amber-600"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold">{tx.customerNama}</span>
                        <span className="text-[10px] font-extrabold text-[#008CEB]">
                          {formatRp(tx.grandTotal)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-slate-400">{formatTime(tx.tanggal)}</span>
                        {tx.sisaTagihan > 0 && (
                          <span className="text-[9px] text-rose-500 font-bold">
                            Sisa: {formatRp(tx.sisaTagihan)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
