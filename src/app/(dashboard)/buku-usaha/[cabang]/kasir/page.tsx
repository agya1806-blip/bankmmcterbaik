"use client";

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import {
  db,
  type BookOrBranch,
  type DbInventoryItem,
  type DbCustomer,
} from "@/lib/db-v4";
import {
  executeTransactionPipelineV4,
  type PosCartItem,
  type PipelineResultV4,
} from "@/engine/transaction-pipeline-v4";
import {
  ArrowLeft, ShoppingBag, Search, Plus, Minus, Trash2,
  CreditCard, Sparkles, Sliders, X, CirclePlus,
  Banknote, Wallet, Smartphone, QrCode,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const BRANCH_MAP: Record<string, BookOrBranch> = {
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
  spesifikasi: string;
}

const PAYMENT_METHODS = [
  { key: "CASH" as const, label: "Tunai", icon: Banknote, color: "from-emerald-500 to-teal-500" },
  { key: "TRANSFER" as const, label: "Transfer", icon: Wallet, color: "from-blue-500 to-indigo-500" },
  { key: "DEPOSIT" as const, label: "Deposit", icon: Smartphone, color: "from-purple-500 to-pink-500" },
  { key: "QRIS" as const, label: "QRIS", icon: QrCode, color: "from-orange-500 to-red-500" },
];

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

  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedWalletId, setSelectedWalletId] = useState("");
  const [catatan, setCatatan] = useState("");
  const [dpDibayar, setDpDibayar] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "DEPOSIT" | "TRANSFER" | "QRIS">("CASH");
  const [isProcessing, setIsProcessing] = useState(false);

  const [activeSpecItem, setActiveSpecItem] = useState<CartItem | null>(null);
  const [specInput1, setSpecInput1] = useState("");
  const [specInput2, setSpecInput2] = useState("");
  const [specInput3, setSpecInput3] = useState("");

  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [newProdName, setNewProdName] = useState("");
  const [newProdHargaJual, setNewProdHargaJual] = useState(0);
  const [newProdHargaModal, setNewProdHargaModal] = useState(0);
  const [newProdStok, setNewProdStok] = useState(10);

  const filteredProducts = useMemo(() => {
    return products.filter((p) =>
      p.nama.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const totalBruto = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.qty * item.hargaSatuan, 0);
  }, [cart]);

  const currentCustomer = useMemo(() => {
    if (!selectedCustomerId) return null;
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  const currentWallet = useMemo(() => {
    if (!selectedWalletId) return null;
    return wallets.find((w) => w.id === selectedWalletId) || null;
  }, [wallets, selectedWalletId]);

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

  const removeItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

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
        item.id === activeSpecItem.id
          ? { ...item, spesifikasi: formattedSpec }
          : item
      )
    );
    setActiveSpecItem(null);
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName) return;

    const newId = crypto.randomUUID();
    await db.inventory.add({
      id: newId,
      bookOrBranchId,
      sku: `SKU-${Date.now()}`,
      nama: newProdName,
      kategori: 'Umum',
      stok: newProdStok,
      stokMin: 2,
      hargaJual: newProdHargaJual,
      hargaModal: newProdHargaModal,
      satuan: 'pcs',
      catatan: '',
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
        spesifikasi: "",
      },
    ]);

    setNewProdName("");
    setNewProdHargaJual(0);
    setNewProdHargaModal(0);
    setNewProdStok(10);
    setShowQuickAdd(false);
  };

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
        spesifikasi: item.spesifikasi,
      }));

      const res: PipelineResultV4 = await executeTransactionPipelineV4({
        id: invId,
        bookOrBranchId,
        items,
        totalBruto,
        dpDibayar,
        paymentMethod,
        walletIdTarget: selectedWalletId,
        customerNama: currentCustomer?.nama || "Pelanggan Umum",
        customerWA: currentCustomer?.noWA || "",
        catatan,
      });

      if (res.ok) {
        alert(`Transaksi Berhasil! No Invoice: ${res.invoiceNumber}`);
        setCart([]);
        setDpDibayar(0);
        setSelectedCustomerId("");
        setSelectedWalletId("");
        setCatatan("");
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

  return (
    <div className="flex-1 flex flex-col pt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => router.push("/buku-usaha")}
          className="p-2 bg-white dark:bg-[#131527] rounded-full shadow-md"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-extrabold tracking-tight capitalize">
          Kasir {cabangSlug}
        </h1>
        <button
          onClick={() => setShowQuickAdd(true)}
          className="p-2 bg-gradient-to-r from-[#7B61FF] to-[#FF5C00] text-white rounded-full shadow-md"
        >
          <CirclePlus className="w-5 h-5" />
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute inset-y-0 left-0 flex items-center pl-3 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Cari produk..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white dark:bg-[#131527] border border-slate-200/60 dark:border-slate-800/60 focus:outline-none text-sm shadow-inner"
        />
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 gap-2 max-h-[180px] overflow-y-auto mb-4 pr-1">
        {filteredProducts.map((prod) => (
          <button
            key={prod.id}
            onClick={() => addToCart(prod)}
            disabled={prod.stok <= 0}
            className="flex flex-col justify-between p-3 text-left rounded-2xl bg-white dark:bg-[#131527] border border-slate-200/60 dark:border-slate-800/60 active:scale-95 transition-transform disabled:opacity-40"
          >
            <span className="text-xs font-bold line-clamp-1">{prod.nama}</span>
            <div className="flex items-center justify-between w-full mt-2">
              <span className="text-[11px] text-[#7B61FF] font-semibold">
                Rp{prod.hargaJual.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                Stok: {prod.stok}
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

      {/* Cart */}
      <div className="flex-1 overflow-y-auto max-h-[220px] space-y-3 mb-4 pr-1">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Keranjang ({cart.length})
        </h3>
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <ShoppingBag className="w-10 h-10 mb-2 stroke-[1.5]" />
            <span className="text-xs">Keranjang masih kosong</span>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.id} className="premium-card p-3 flex flex-col gap-2">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-extrabold line-clamp-1">
                    {item.namaItem}
                  </h4>
                  {item.spesifikasi && (
                    <p className="text-[10px] text-indigo-500 font-medium mt-0.5 truncate">
                      {item.spesifikasi}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-rose-500 p-1 shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between mt-1">
                <input
                  type="number"
                  value={item.hargaSatuan}
                  onChange={(e) =>
                    updateCartItemHarga(item.id, Number(e.target.value))
                  }
                  className="w-24 bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded-lg text-xs font-bold text-[#7B61FF] focus:outline-none"
                />

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => updateQty(item.id, -1)}
                    className="p-1 bg-slate-100 dark:bg-zinc-800 rounded-full"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-extrabold min-w-[20px] text-center">
                    {item.qty}
                  </span>
                  <button
                    onClick={() => updateQty(item.id, 1)}
                    className="p-1 bg-slate-100 dark:bg-zinc-800 rounded-full"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => openSpecModal(item)}
                    className="p-1 bg-gradient-to-r from-[#7B61FF] to-[#FF5C00] text-white rounded-full ml-1"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Checkout Area */}
      <div className="premium-card p-4 space-y-3">
        {/* Total */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Subtotal</span>
          <span className="font-bold">Rp{totalBruto.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between text-xs border-t border-slate-200 dark:border-slate-800 pt-2">
          <span className="font-extrabold">TOTAL</span>
          <span className="text-base font-extrabold text-[#7B61FF]">
            Rp{totalBruto.toLocaleString()}
          </span>
        </div>

        {/* DP */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">DP Dibayar</span>
          <input
            type="number"
            value={dpDibayar || ""}
            onChange={(e) => setDpDibayar(Number(e.target.value))}
            placeholder="0"
            className="w-24 text-right bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded-lg text-xs font-bold focus:outline-none"
          />
        </div>

        {/* Wallet */}
        <select
          value={selectedWalletId}
          onChange={(e) => setSelectedWalletId(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none font-bold border-none"
        >
          <option value="">Pilih Dompet</option>
          {wallets.map((w) => (
            <option key={w.id} value={w.id}>
              {w.namaDompet} (Rp{w.saldo.toLocaleString()})
            </option>
          ))}
        </select>

        {/* Customer */}
        <select
          value={selectedCustomerId}
          onChange={(e) => setSelectedCustomerId(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none font-bold border-none"
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
          className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none font-bold border-none"
        />

        {/* Checkout */}
        <button
          onClick={handleCheckout}
          disabled={cart.length === 0 || isProcessing}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#7B61FF] to-[#FF5C00] text-white font-extrabold text-sm shadow-lg shadow-indigo-500/20 hover:opacity-95 active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isProcessing ? (
            <Sparkles className="w-4 h-4 animate-spin" />
          ) : (
            <CreditCard className="w-4 h-4" />
          )}
          {isProcessing ? "Memproses..." : "Selesaikan Transaksi"}
        </button>
      </div>

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
                <h3 className="text-sm font-extrabold">
                  Spesifikasi Produksi
                </h3>
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
                <h3 className="text-xs font-extrabold tracking-tight">
                  Tambah Produk Cepat
                </h3>
                <button
                  onClick={() => setShowQuickAdd(false)}
                  className="p-1 rounded-full bg-slate-100 dark:bg-zinc-800"
                >
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
                    placeholder="Kaos Polos Hitam"
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none"
                    required
                  />
                </div>
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
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#7B61FF] to-[#FF5C00] text-white font-extrabold shadow-md active:scale-[0.98] transition-all"
                >
                  Simpan & Masuk Keranjang
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
