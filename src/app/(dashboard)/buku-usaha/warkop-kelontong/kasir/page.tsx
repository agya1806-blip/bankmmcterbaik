"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Coffee, ShoppingBag, Pizza, Utensils, Plus, Minus, Trash2,
  ArrowLeft, CheckCircle2, DollarSign, Timer, User, Receipt,
  Search, X, Package, Wheat, Milk, Cigarette,
} from "lucide-react";
import toast from "react-hot-toast";
import BillWarkopKelontongView, {
  BillData, BillItem,
} from "../../components/BillWarkopKelontongView";
import { useProfilUsahaStore } from "../../percetakan/store/useProfilUsahaStore";
import { useBusinessStore } from "@/store/useBusinessStore";

/* ─── Types ─── */
type KategoriMenu = "makanan" | "minuman" | "kelontong" | "rokok";
type TipeOrder = "dine-in" | "take-away";

interface MenuItem {
  id: string;
  nama: string;
  harga: number;
  kategori: KategoriMenu;
  icon: React.ElementType;
  grad: string;
  stok: number;
  resep?: { bahanId: string; qty: number }[];
}

interface CartEntry {
  menu: MenuItem;
  qty: number;
}

interface BahanBaku {
  id: string;
  nama: string;
  stok: number;
  satuan: string;
}

/* ─── Mock Menu ─── */
const MENU_LIST: MenuItem[] = [
  { id: "M-001", nama: "Kopi Hitam", harga: 8000, kategori: "minuman", icon: Coffee, grad: "from-amber-700 to-amber-900", stok: 50, resep: [{ bahanId: "B-001", qty: 10 }] },
  { id: "M-002", nama: "Kopi Susu", harga: 12000, kategori: "minuman", icon: Coffee, grad: "from-amber-500 to-amber-700", stok: 50, resep: [{ bahanId: "B-001", qty: 10 }, { bahanId: "B-002", qty: 30 }] },
  { id: "M-003", nama: "Es Kopi Gula Aren", harga: 15000, kategori: "minuman", icon: Coffee, grad: "from-amber-600 to-amber-800", stok: 40, resep: [{ bahanId: "B-001", qty: 12 }, { bahanId: "B-003", qty: 15 }] },
  { id: "M-004", nama: "Teh Manis", harga: 5000, kategori: "minuman", icon: Coffee, grad: "from-yellow-500 to-yellow-600", stok: 60, resep: [{ bahanId: "B-003", qty: 10 }] },
  { id: "M-005", nama: "Es Jeruk", harga: 7000, kategori: "minuman", icon: Coffee, grad: "from-orange-400 to-orange-500", stok: 30, resep: [] },
  { id: "M-006", nama: "Air Mineral", harga: 4000, kategori: "minuman", icon: Coffee, grad: "from-blue-400 to-blue-500", stok: 20, resep: [] },
  { id: "M-101", nama: "Mie Goreng", harga: 12000, kategori: "makanan", icon: Utensils, grad: "from-orange-500 to-red-500", stok: 15, resep: [{ bahanId: "B-004", qty: 1 }] },
  { id: "M-102", nama: "Mie Kuah", harga: 12000, kategori: "makanan", icon: Utensils, grad: "from-yellow-500 to-orange-500", stok: 12, resep: [{ bahanId: "B-004", qty: 1 }] },
  { id: "M-103", nama: "Nasi Goreng", harga: 15000, kategori: "makanan", icon: Utensils, grad: "from-red-500 to-red-600", stok: 10, resep: [] },
  { id: "M-104", nama: "Indomie Telur", harga: 10000, kategori: "makanan", icon: Utensils, grad: "from-amber-500 to-orange-500", stok: 20, resep: [{ bahanId: "B-004", qty: 1 }] },
  { id: "M-201", nama: "Roti Bakar", harga: 8000, kategori: "makanan", icon: Utensils, grad: "from-yellow-600 to-amber-600", stok: 8, resep: [] },
  { id: "M-202", nama: "Pisang Goreng", harga: 7000, kategori: "makanan", icon: Utensils, grad: "from-yellow-400 to-amber-500", stok: 10, resep: [] },
  { id: "K-001", nama: "Minyak Goreng 1L", harga: 18000, kategori: "kelontong", icon: Package, grad: "from-green-500 to-green-600", stok: 3, resep: [] },
  { id: "K-002", nama: "Gula Pasir 1kg", harga: 16000, kategori: "kelontong", icon: Package, grad: "from-white to-gray-200", stok: 5, resep: [] },
  { id: "K-003", nama: "Mie Instan (karton)", harga: 110000, kategori: "kelontong", icon: Package, grad: "from-red-500 to-red-600", stok: 2, resep: [] },
  { id: "K-004", nama: "Air Galon", harga: 20000, kategori: "kelontong", icon: Package, grad: "from-blue-400 to-blue-500", stok: 4, resep: [] },
  { id: "R-001", nama: "Rokok Filter A", harga: 28000, kategori: "rokok", icon: Package, grad: "from-gray-600 to-gray-800", stok: 10, resep: [] },
  { id: "R-002", nama: "Rokok Filter B", harga: 22000, kategori: "rokok", icon: Package, grad: "from-gray-500 to-gray-700", stok: 8, resep: [] },
  { id: "R-003", nama: "Rokok Mild", harga: 25000, kategori: "rokok", icon: Package, grad: "from-blue-600 to-blue-800", stok: 6, resep: [] },
];

/* ─── Mock Bahan Baku ─── */
const BAHAN_BAKU: BahanBaku[] = [
  { id: "B-001", nama: "Biji Kopi", stok: 500, satuan: "gr" },
  { id: "B-002", nama: "Susu UHT", stok: 1000, satuan: "ml" },
  { id: "B-003", nama: "Sirup Gula", stok: 800, satuan: "ml" },
  { id: "B-004", nama: "Mie Instan (ecer)", stok: 25, satuan: "pcs" },
];

const KATEGORI_LIST: { key: KategoriMenu; label: string; icon: React.ElementType }[] = [
  { key: "minuman", label: "Minuman", icon: Coffee },
  { key: "makanan", label: "Makanan", icon: Utensils },
  { key: "kelontong", label: "Kelontong", icon: ShoppingBag },
  { key: "rokok", label: "Rokok", icon: Package },
];

function generateId() {
  const d = new Date();
  const ds = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `WKP-${ds}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
}

function formatRupiah(n: number) {
  return `IDR ${n.toLocaleString("id-ID")}`;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export default function KasirWarkopKelontong() {
  const router = useRouter();
  const { profil } = useProfilUsahaStore();
  const { wallets, tambahSaldoWallet, kurangiSaldoWallet } = useBusinessStore();
  const [walletPenerimaanId, setWalletPenerimaanId] = useState(wallets[0]?.id || "wallet-kas");
  const [walletModalId, setWalletModalId] = useState(wallets[1]?.id || "wallet-bsi");
  const [mounted, setMounted] = useState(false);

  /* ─── State ─── */
  const [activeKategori, setActiveKategori] = useState<KategoriMenu>("minuman");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [noMeja, setNoMeja] = useState("");
  const [pelanggan, setPelanggan] = useState("");
  const [tipeOrder, setTipeOrder] = useState<TipeOrder>("dine-in");
  const [bahan, setBahan] = useState<BahanBaku[]>(BAHAN_BAKU);
  const [showBill, setShowBill] = useState(false);
  const [billData, setBillData] = useState<BillData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => setMounted(true), []);

  /* ─── Filter Menu ─── */
  const menuFiltered = useMemo(() => {
    let items = MENU_LIST.filter((m) => m.kategori === activeKategori);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((m) => m.nama.toLowerCase().includes(q));
    }
    return items;
  }, [activeKategori, search]);

  /* ─── Cart Ops ─── */
  const addToCart = useCallback((menu: MenuItem) => {
    setCart((prev) => {
      const exist = prev.find((c) => c.menu.id === menu.id);
      if (exist) return prev.map((c) => c.menu.id === menu.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { menu, qty: 1 }];
    });
  }, []);

  const updateQty = useCallback((id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => c.menu.id === id ? { ...c, qty: Math.max(c.qty + delta, 1) } : c)
        .filter((c) => c.qty > 0)
    );
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => prev.filter((c) => c.menu.id !== id));
  }, []);

  /* ─── Kalkulasi ─── */
  const subtotal = useMemo(() => cart.reduce((s, c) => s + c.menu.harga * c.qty, 0), [cart]);
  const itemCount = useMemo(() => cart.reduce((s, c) => s + c.qty, 0), [cart]);

  /* ─── Pembayaran Cepat ─── */
  const [bayarManual, setBayarManual] = useState("");
  const bayar = parseInt(bayarManual.replace(/\D/g, ""), 10) || 0;
  const kembalian = bayar >= subtotal ? bayar - subtotal : 0;

  const presetBayar = useCallback((nominal: number) => {
    setBayarManual(String(nominal));
  }, []);

  /* ─── Live Preview Bill Data ─── */
  const liveBillData = useMemo<BillData | null>(() => {
    if (cart.length === 0) return null;
    const now = new Date();
    const jam = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
    const items: BillItem[] = cart.map((c) => ({
      nama: c.menu.nama,
      qty: c.qty,
      hargaSatuan: c.menu.harga,
      jumlah: c.menu.harga * c.qty,
    }));
    return {
      id: generateId(),
      tanggal: now.toISOString().slice(0, 10),
      jam,
      noMeja: tipeOrder === "dine-in" ? noMeja || "-" : "-",
      pelanggan: pelanggan || noMeja || "-",
      tipe: tipeOrder,
      kasir: "Admin",
      items,
      total: subtotal,
      tunai: bayar,
      kembalian,
      metodeBayar: bayar >= subtotal ? `Tunai — Kembali ${formatRupiah(kembalian)}` : "Piutang",
    };
  }, [cart, subtotal, bayar, kembalian, noMeja, pelanggan, tipeOrder]);

  /* ─── Simpan Transaksi ─── */
  const handleSimpan = useCallback(async () => {
    if (cart.length === 0) { toast.error("Keranjang masih kosong"); return; }
    if (bayar < subtotal) { toast.error("Jumlah bayar kurang"); return; }

    setLoading(true);

    /* BOM: Kurangi stok bahan baku berdasarkan resep */
    const newBahan = [...bahan];
    for (const entry of cart) {
      if (entry.menu.resep) {
        for (const r of entry.menu.resep) {
          const idx = newBahan.findIndex((b) => b.id === r.bahanId);
          if (idx >= 0) {
            newBahan[idx] = { ...newBahan[idx], stok: Math.max(newBahan[idx].stok - r.qty * entry.qty, 0) };
          }
        }
      }
    }
    setBahan(newBahan);

    if (!liveBillData) { toast.error("Data bill tidak valid"); setLoading(false); return; }

    setBillData(liveBillData);
    setShowBill(true);
    /* Update wallet: kurangi modal (estimasi 60% dari subtotal sebagai HPP) */
    const estimasiHPP = Math.round(subtotal * 0.6);
    if (estimasiHPP > 0) kurangiSaldoWallet(walletModalId, estimasiHPP);
    if (bayar > 0) tambahSaldoWallet(walletPenerimaanId, bayar);
    setLoading(false);
    toast.success(`Bill ${liveBillData.id} berhasil dicetak`);
  }, [cart, bayar, subtotal, kembalian, bahan, noMeja, pelanggan, tipeOrder, liveBillData]);

  const resetForm = useCallback(() => {
    setCart([]);
    setNoMeja("");
    setPelanggan("");
    setBayarManual("");
    setShowBill(false);
    setBillData(null);
  }, []);

  if (!mounted) return <div className="min-h-[60vh]" />;

  return (
    <div className="pb-24 animate-fade-in">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between max-w-full px-4 mb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/buku-usaha/warkop-kelontong/dashboard")}
            className="size-9 rounded-xl bg-muted/30 flex items-center justify-center hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="size-4 text-muted-foreground" />
          </button>
          <div className="size-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Coffee className="size-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold font-heading">POS Kasir Menu</h2>
            <p className="text-[10px] text-muted-foreground/60">Split Screen — Live Preview Bill</p>
          </div>
        </div>
        {showBill && (
          <button onClick={resetForm}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" /> Baru Lagi
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-4">
        {/* ═══════════════ SISI KIRI: KATALOG ═══════════════ */}
        <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-10rem)] pr-1">
          {/* Search + Kategori tabs */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/40" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari menu..." className="input-premium w-full text-xs pl-8" />
            </div>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {KATEGORI_LIST.map((kat) => {
              const Ico = kat.icon;
              const aktif = activeKategori === kat.key;
              return (
                <button key={kat.key} onClick={() => { setActiveKategori(kat.key); setSearch(""); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-semibold whitespace-nowrap transition-all ${
                    aktif
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/20"
                      : "bg-muted/30 text-muted-foreground/60 hover:bg-muted/50"
                  }`}
                >
                  <Ico className="size-3.5" />
                  {kat.label}
                </button>
              );
            })}
          </div>

          {/* Grid Menu */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {menuFiltered.map((m) => {
              const Ico = m.icon;
              const inCart = cart.find((c) => c.menu.id === m.id);
              const habis = m.stok <= 0;
              return (
                <button key={m.id} onClick={() => !habis && addToCart(m)}
                  disabled={habis}
                  className={`group relative rounded-xl p-3 text-left transition-all duration-200 ${
                    habis
                      ? "opacity-40 cursor-not-allowed bg-muted/20"
                      : inCart
                      ? "bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-2 border-emerald-500/40 shadow-md"
                      : "floating-card hover:shadow-md hover:-translate-y-0.5 active:scale-[0.97]"
                  }`}
                >
                  <div className={`size-10 rounded-xl bg-gradient-to-br ${m.grad} flex items-center justify-center mb-2 shadow-md group-hover:scale-105 transition-transform`}>
                    <Ico className="size-5 text-white" />
                  </div>
                  <p className="text-xs font-semibold truncate leading-tight">{m.nama}</p>
                  <p className="text-[10px] font-bold tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">{formatRupiah(m.harga)}</p>
                  {inCart && (
                    <div className="absolute top-2 right-2 size-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold shadow-md">
                      {inCart.qty}
                    </div>
                  )}
                  {habis && (
                    <div className="absolute inset-0 rounded-xl flex items-center justify-center">
                      <span className="text-[9px] font-semibold text-rose-500 bg-background/60 backdrop-blur-sm px-2 py-0.5 rounded-full">Habis</span>
                    </div>
                  )}
                </button>
              );
            })}
            {menuFiltered.length === 0 && (
              <div className="col-span-full text-center py-6">
                <Coffee className="size-8 mx-auto text-muted-foreground/20" />
                <p className="text-xs text-muted-foreground/40 mt-2">Tidak ada menu</p>
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════ SISI KANAN: KERANJANG ═══════════════ */}
        <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-10rem)] pr-1">
          {/* ─── Tipe Order ─── */}
          <div className="floating-card p-3 space-y-2">
            <div className="flex gap-2">
              {(["dine-in", "take-away"] as const).map((t) => (
                <button key={t} onClick={() => setTipeOrder(t)}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                    tipeOrder === t
                      ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                      : "bg-muted/30 text-muted-foreground/50 hover:bg-muted/50"
                  }`}
                >{t === "dine-in" ? "Dine In" : "Take Away"}</button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" value={noMeja} onChange={(e) => setNoMeja(e.target.value)}
                placeholder="No Meja" className="input-premium text-[10px]" />
              <input type="text" value={pelanggan} onChange={(e) => setPelanggan(e.target.value)}
                placeholder="Nama Pelanggan" className="input-premium text-[10px]" />
            </div>
          </div>

          {/* ─── Keranjang ─── */}
          <div className="floating-card p-3 space-y-2 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold flex items-center gap-1.5">
                <ShoppingBag className="size-3.5 text-emerald-500" /> Keranjang
              </p>
              <span className="text-[10px] text-muted-foreground/50">{itemCount} item</span>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-1 min-h-[100px]">
              {cart.length === 0 ? (
                <p className="text-[10px] text-muted-foreground/30 py-4 text-center">
                  Klik menu di samping untuk mulai
                </p>
              ) : (
                cart.map((c) => (
                  <div key={c.menu.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors group"
                  >
                    <div className={`size-8 rounded-lg bg-gradient-to-br ${c.menu.grad} flex items-center justify-center shrink-0`}>
                      <c.menu.icon className="size-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-medium truncate">{c.menu.nama}</p>
                      <p className="text-[9px] font-semibold tabular-nums text-emerald-600">{formatRupiah(c.menu.harga * c.qty)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQty(c.menu.id, -1)}
                        className="size-6 rounded-lg bg-muted/50 flex items-center justify-center hover:bg-muted/80 text-muted-foreground/60 transition-colors"
                      >
                        <Minus className="size-3" />
                      </button>
                      <span className="w-5 text-center text-[10px] font-bold tabular-nums">{c.qty}</span>
                      <button onClick={() => updateQty(c.menu.id, 1)}
                        className="size-6 rounded-lg bg-muted/50 flex items-center justify-center hover:bg-emerald-500/10 hover:text-emerald-600 text-muted-foreground/60 transition-colors"
                      >
                        <Plus className="size-3" />
                      </button>
                      <button onClick={() => removeFromCart(c.menu.id)}
                        className="size-6 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 text-muted-foreground/40 hover:text-rose-500 transition-all"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Total */}
            <div className="flex justify-between items-center pt-2 border-t border-border/30">
              <span className="text-xs font-semibold">Total</span>
              <span className="text-base font-bold font-heading tabular-nums text-emerald-600">{formatRupiah(subtotal)}</span>
            </div>
          </div>

          {/* ─── Pembayaran Cepat ─── */}
          <div className="floating-card p-3 space-y-2">
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <DollarSign className="size-3.5 text-emerald-500" /> Pembayaran Cepat
            </p>

            <div className="grid grid-cols-3 gap-1.5">
              <button onClick={() => presetBayar(10000)}
                className="py-1.5 rounded-lg bg-muted/30 text-[10px] font-semibold hover:bg-muted/50 transition-colors">Rp10k</button>
              <button onClick={() => presetBayar(20000)}
                className="py-1.5 rounded-lg bg-muted/30 text-[10px] font-semibold hover:bg-muted/50 transition-colors">Rp20k</button>
              <button onClick={() => presetBayar(50000)}
                className="py-1.5 rounded-lg bg-muted/30 text-[10px] font-semibold hover:bg-muted/50 transition-colors">Rp50k</button>
              <button onClick={() => presetBayar(100000)}
                className="py-1.5 rounded-lg bg-muted/30 text-[10px] font-semibold hover:bg-muted/50 transition-colors">Rp100k</button>
              <button onClick={() => presetBayar(subtotal)}
                className="py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 text-[10px] font-semibold hover:bg-emerald-500/20 transition-colors">Uang Pas</button>
              <button onClick={() => setBayarManual("")}
                className="py-1.5 rounded-lg bg-rose-500/10 text-rose-500 text-[10px] font-semibold hover:bg-rose-500/20 transition-colors">Hapus</button>
            </div>

            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/50">Rp</span>
              <input type="text" inputMode="numeric" value={bayarManual}
                onChange={(e) => setBayarManual(e.target.value.replace(/\D/g, ""))}
                placeholder="0" className="input-premium w-full text-xs pl-9 tabular-nums" />
            </div>

          {/* Pilih Dompet */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[9px] text-muted-foreground/50">Terima Pembayaran Ke</label>
              <select value={walletPenerimaanId} onChange={(e) => setWalletPenerimaanId(e.target.value)} className="input-premium w-full text-[10px]">
                {wallets.map((w) => <option key={w.id} value={w.id}>{w.namaDompet} ({w.tipe})</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-muted-foreground/50">Ambil Modal Dari</label>
              <select value={walletModalId} onChange={(e) => setWalletModalId(e.target.value)} className="input-premium w-full text-[10px]">
                {wallets.map((w) => <option key={w.id} value={w.id}>{w.namaDompet} ({w.tipe})</option>)}
              </select>
            </div>
          </div>
            <div className="grid grid-cols-2 gap-3 text-[10px]">
              <div>
                <p className="text-muted-foreground/50">Total</p>
                <p className="text-sm font-bold font-heading tabular-nums">{formatRupiah(subtotal)}</p>
              </div>
              <div>
                <p className="text-muted-foreground/50">Kembalian</p>
                <p className={`text-sm font-bold font-heading tabular-nums ${kembalian > 0 ? "text-emerald-600" : "text-rose-500"}`}>
                  {kembalian > 0 ? formatRupiah(kembalian) : "Kurang"}
                </p>
              </div>
            </div>

            <button onClick={handleSimpan} disabled={loading || cart.length === 0 || bayar < subtotal}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? "Menyimpan..." : <>
                <Receipt className="size-4" /> Cetak Faktur / Bill
              </>}
            </button>
          </div>

          {/* ─── Bahan Baku Status ─── */}
          <div className="floating-card p-3 space-y-1.5">
            <p className="text-[10px] font-semibold flex items-center gap-1 text-muted-foreground/60">
              <Wheat className="size-3 text-amber-500" /> Stok Bahan Baku
            </p>
            {bahan.filter((b) => b.stok < 200).map((b) => (
              <div key={b.id} className="flex items-center justify-between text-[9px]">
                <span className="text-muted-foreground/60">{b.nama}</span>
                <span className={`font-semibold tabular-nums ${b.stok < 50 ? "text-rose-500" : "text-amber-500"}`}>
                  {b.stok} {b.satuan}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ SISI KANAN: LIVE PREVIEW BILL ═══ */}
        <div className="overflow-y-auto max-h-[calc(100vh-10rem)] pr-1">
          <div className="sticky top-0">
            {cart.length > 0 ? (
              <BillWarkopKelontongView data={liveBillData!} preview={!showBill} noRef="MUGHIS BANK v3 — Warkop & Kelontong" />
            ) : (
              <div className="floating-card p-8 text-center min-h-[60vh] flex flex-col items-center justify-center">
                <Coffee className="size-12 text-muted-foreground/20 mb-3" />
                <p className="text-xs text-muted-foreground/40">Klik menu di kiri untuk memulai transaksi</p>
                <p className="text-[10px] text-muted-foreground/30 mt-1">Bill preview akan muncul di sini secara real-time</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
