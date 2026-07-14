"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Shirt, ArrowLeft, Search, Plus, Minus, Trash2, DollarSign,
  User, CheckCircle2, Ruler, Layers, Package, ShoppingBag, X,
  Printer, Smartphone, Coffee,
} from "lucide-react";
import toast from "react-hot-toast";
import InvoicePakaianKonveksiView, {
  FashionInvoiceData, FashionInvoiceItem,
} from "../../components/InvoicePakaianKonveksiView";
import { useProfilUsahaStore } from "../../percetakan/store/useProfilUsahaStore";
import { useBusinessStore } from "@/store/useBusinessStore";
import { KasirSkeleton } from "@/components/ui/skeleton";
import QrisDisplay from "@/components/qris-display";

/* ─── Types ─── */
type ModeKasir = "ready" | "custom";

interface ProdukFashion {
  id: string;
  nama: string;
  kategori: string;
  varian: { warna: string; ukuran: string; stok: number }[];
  harga: number;
}

interface CartReadyItem {
  produk: ProdukFashion;
  warna: string;
  ukuran: string;
  qty: number;
  harga: number;
}

interface KalkulasiKonveksi {
  totalModalBahan: number;
  wastageCost: number;
  totalHPP: number;
  totalJual: number;
  labaKotor: number;
}

/* ─── Mock ─── */
const PRODUK_FASHION: ProdukFashion[] = [
  { id: "F-001", nama: "Kaos Polos Hitam", kategori: "Kaos", harga: 85000, varian: [{ warna: "Hitam", ukuran: "S", stok: 5 }, { warna: "Hitam", ukuran: "M", stok: 8 }, { warna: "Hitam", ukuran: "L", stok: 2 }, { warna: "Hitam", ukuran: "XL", stok: 1 }] },
  { id: "F-002", nama: "Kaos Polos Putih", kategori: "Kaos", harga: 85000, varian: [{ warna: "Putih", ukuran: "L", stok: 12 }, { warna: "Putih", ukuran: "XL", stok: 0 }] },
  { id: "F-003", nama: "Kemeja Flanel Merah", kategori: "Kemeja", harga: 145000, varian: [{ warna: "Merah", ukuran: "M", stok: 3 }, { warna: "Merah", ukuran: "L", stok: 1 }] },
  { id: "F-004", nama: "Kemeja Flanel Biru", kategori: "Kemeja", harga: 145000, varian: [{ warna: "Biru", ukuran: "L", stok: 4 }, { warna: "Biru", ukuran: "XL", stok: 2 }] },
  { id: "F-005", nama: "Jaket Hoodie Abu", kategori: "Jaket", harga: 185000, varian: [{ warna: "Abu-abu", ukuran: "L", stok: 4 }, { warna: "Abu-abu", ukuran: "XL", stok: 2 }] },
  { id: "F-006", nama: "Celana Chino Khaki", kategori: "Celana", harga: 125000, varian: [{ warna: "Khaki", ukuran: "M", stok: 6 }, { warna: "Khaki", ukuran: "L", stok: 3 }] },
];

const WARNA_LIST = ["Hitam", "Putih", "Merah", "Biru", "Abu-abu", "Khaki", "Hijau Army", "Maroon"];

const CUSTOMER_DUMMY = [
  { nama: "Toko Batik Jaya", wa: "085211112222" },
  { nama: "CV Seragam Kita", wa: "085233334444" },
  { nama: "Walk-in Customer", wa: "" },
];

function generateId() {
  const d = new Date();
  const ds = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `INV-FSH-${ds}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatRupiah(n: number) {
  return `IDR ${n.toLocaleString("id-ID")}`;
}

export default function KasirPakaianKonveksi() {
  const router = useRouter();
  const { profil } = useProfilUsahaStore();
  const { wallets, tambahSaldoWallet, kurangiSaldoWallet, setLastKasirUnit } = useBusinessStore();
  const [walletPenerimaanId, setWalletPenerimaanId] = useState(wallets[0]?.id || "wallet-kas");
  const [walletModalId, setWalletModalId] = useState(wallets[1]?.id || "wallet-bsi");
  const [mounted, setMounted] = useState(false);

  /* ─── Mode ─── */
  const [mode, setMode] = useState<ModeKasir>("ready");

  /* ─── Ready Stock ─── */
  const [searchProduk, setSearchProduk] = useState("");
  const [selectedProduk, setSelectedProduk] = useState<ProdukFashion | null>(null);
  const [selectedWarna, setSelectedWarna] = useState("");
  const [selectedUkuran, setSelectedUkuran] = useState("");
  const [cartReady, setCartReady] = useState<CartReadyItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  /* ─── Custom Konveksi ─── */
  const [customPcs, setCustomPcs] = useState(100);
  const [customKain, setCustomKain] = useState(25);
  const [customHargaKain, setCustomHargaKain] = useState(35000);
  const [customOngkosCMT, setCustomOngkosCMT] = useState(12000);
  const [customSablon, setCustomSablon] = useState(8000);
  const [customHargaJual, setCustomHargaJual] = useState(65000);
  const [customNamaProduk, setCustomNamaProduk] = useState("Kaos Combed 30s Sablon Plastisol");

  /* ─── Customer ─── */
  const [cariCustomer, setCariCustomer] = useState("");
  const [customerNama, setCustomerNama] = useState("");
  const [customerWA, setCustomerWA] = useState("");
  const [showCustDropdown, setShowCustDropdown] = useState(false);

  /* ─── DP ─── */
  const [dp, setDP] = useState("");

  /* ─── Invoice ─── */
  const [invoiceId, setInvoiceId] = useState("");
  const [showInvoice, setShowInvoice] = useState(false);

  useEffect(() => { setMounted(true); setLastKasirUnit("konveksi"); }, [setLastKasirUnit]);

  /* ─── Filter Produk ─── */
  const filteredProduk = useMemo(() => {
    if (!searchProduk) return PRODUK_FASHION;
    const q = searchProduk.toLowerCase();
    return PRODUK_FASHION.filter((p) => p.nama.toLowerCase().includes(q) || p.kategori.toLowerCase().includes(q));
  }, [searchProduk]);

  const filteredCustomers = useMemo(() => {
    if (!cariCustomer) return CUSTOMER_DUMMY;
    const q = cariCustomer.toLowerCase();
    return CUSTOMER_DUMMY.filter((c) => c.nama.toLowerCase().includes(q));
  }, [cariCustomer]);

  /* ─── Ready: Add to cart ─── */
  const addReadyToCart = useCallback(() => {
    if (!selectedProduk || !selectedWarna || !selectedUkuran) {
      toast.error("Pilih produk, warna, dan ukuran"); return;
    }
    const varian = selectedProduk.varian.find((v) => v.warna === selectedWarna && v.ukuran === selectedUkuran);
    if (!varian || varian.stok <= 0) { toast.error("Stok varian habis"); return; }
    setCartReady((prev) => {
      const exist = prev.find((c) => c.produk.id === selectedProduk.id && c.warna === selectedWarna && c.ukuran === selectedUkuran);
      if (exist) return prev.map((c) => c === exist ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { produk: selectedProduk, warna: selectedWarna, ukuran: selectedUkuran, qty: 1, harga: selectedProduk.harga }];
    });
    toast.success(`${selectedProduk.nama} (${selectedWarna}, ${selectedUkuran}) ditambahkan`);
  }, [selectedProduk, selectedWarna, selectedUkuran]);

  const updateQtyReady = useCallback((idx: number, delta: number) => {
    setCartReady((prev) =>
      prev.map((c, i) => i === idx ? { ...c, qty: Math.max(c.qty + delta, 1) } : c)
    );
  }, []);

  const removeReady = useCallback((idx: number) => {
    setCartReady((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  /* ─── Kalkulasi Konveksi ─── */
  const hasilKonveksi = useMemo<KalkulasiKonveksi>(() => {
    const totalModalBahan = customKain * customHargaKain;
    const wastageCost = totalModalBahan * 0.05;
    const totalHPP = totalModalBahan + wastageCost + ((customOngkosCMT + customSablon) * customPcs);
    const totalJual = customPcs * customHargaJual;
    const labaKotor = totalJual - totalHPP;
    return { totalModalBahan, wastageCost, totalHPP, totalJual, labaKotor };
  }, [customPcs, customKain, customHargaKain, customOngkosCMT, customSablon, customHargaJual]);

  /* ─── Total ─── */
  const subtotal = mode === "ready"
    ? cartReady.reduce((s, c) => s + c.harga * c.qty, 0)
    : hasilKonveksi.totalJual;
  const dpNumber = parseInt(dp.replace(/\D/g, ""), 10) || 0;
  const sisa = Math.max(subtotal - dpNumber, 0);

  /* ─── Simpan ─── */
  const handleSimpan = useCallback(() => {
    if (!customerNama) { toast.error("Isi nama pelanggan"); return; }
    if (mode === "ready" && cartReady.length === 0) { toast.error("Keranjang kosong"); return; }
    if (mode === "custom" && customPcs <= 0) { toast.error("Jumlah produksi harus > 0"); return; }

    const id = invoiceId || generateId();
    setInvoiceId(id);
    setShowInvoice(true);
    toast.success(`Invoice ${id} berhasil dibuat`);
    /* Update wallet */
    if (mode === "custom") {
      const hpp = Math.round(hasilKonveksi.totalHPP);
      if (hpp > 0) kurangiSaldoWallet(walletModalId, hpp);
    } else {
      const estimasiHPP = Math.round(subtotal * 0.5);
      if (estimasiHPP > 0) kurangiSaldoWallet(walletModalId, estimasiHPP);
    }
    if (dpNumber > 0) tambahSaldoWallet(walletPenerimaanId, dpNumber);
    setTimeout(() => {
      const el = document.getElementById("invoice-print-area");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
  }, [customerNama, mode, cartReady, customPcs, invoiceId, dpNumber, hasilKonveksi.totalHPP,
      kurangiSaldoWallet, subtotal, tambahSaldoWallet, walletModalId, walletPenerimaanId]);

  const lunas = sisa <= 0;

  /* ─── Invoice Data (always computed for live preview) ─── */
  const invoiceData = useMemo<FashionInvoiceData | null>(() => {
    const readyEmpty = mode === "ready" && cartReady.length === 0;
    const customEmpty = mode === "custom" && customPcs <= 0;
    if (readyEmpty || customEmpty) return null;
    const id = invoiceId || generateId();
    const items: FashionInvoiceItem[] = [];

    if (mode === "ready") {
      cartReady.forEach((c, i) => {
        items.push({
          no: i + 1,
          item: c.produk.nama,
          varian: `${c.warna}, Size: ${c.ukuran}`,
          detailProduksi: "",
          qty: c.qty,
          harga: c.harga,
          jumlah: c.harga * c.qty,
        });
      });
    } else {
      items.push({
        no: 1,
        item: customNamaProduk,
        varian: `Produksi ${customPcs} Pcs`,
        detailProduksi: `Termasuk Jasa CMT + Sablon Plastisol | Kain: ${customKain} yard @${formatRupiah(customHargaKain)} | CMT: ${formatRupiah(customOngkosCMT)}/pcs | Sablon: ${formatRupiah(customSablon)}/pcs`,
        qty: customPcs,
        harga: customHargaJual,
        jumlah: customPcs * customHargaJual,
      });
    }

    return {
      id,
      tanggal: todayISO(),
      customer: customerNama,
      noWA: customerWA,
      kategori: `${mode === "ready" ? "Fashion Ready Stock" : "Konveksi Custom"} — Pakaian & Konveksi`,
      mode,
      statusLabel: lunas ? "LUNAS" : `SISA ${formatRupiah(sisa)}`,
      statusColor: lunas
        ? "text-emerald-700 bg-emerald-100"
        : "text-amber-700 bg-amber-100",
      items,
      subtotal,
      dp: dpNumber,
      sisa,
      pembayaran: lunas ? "Tunai / Transfer" : "Piutang (Sisa Tagihan)",
      rekeningBank: "Bank Aceh Syariah",
      rekeningNomor: "010-01-123456-7",
      rekeningAtasNama: profil.nama || "",
    };
  }, [mode, cartReady, customNamaProduk, customPcs, customKain, customHargaKain,
      customOngkosCMT, customSablon, customHargaJual, customerNama, customerWA,
      invoiceId, subtotal, dpNumber, sisa, lunas, profil.nama]);

  const resetForm = useCallback(() => {
    setCartReady([]);
    setSelectedProduk(null);
    setSelectedWarna("");
    setSelectedUkuran("");
    setDP("");
    setShowInvoice(false);
    setInvoiceId("");
  }, []);

  if (!mounted) return <KasirSkeleton />;

  return (
    <div className="pb-20 animate-fade-in">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between max-w-full px-4 mb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/buku-usaha/pakaian-konveksi/dashboard")}
            className="size-9 rounded-xl bg-muted/30 flex items-center justify-center hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="size-4 text-muted-foreground" />
          </button>
          <div className="size-11 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <Shirt className="size-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold font-heading">POS Kasir Mode</h2>
            <p className="text-[10px] text-muted-foreground/60">Split Screen — Live Preview</p>
          </div>
        </div>
        {showInvoice && (
          <button onClick={resetForm}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" /> Baru Lagi
          </button>
        )}
      </div>

      {/* ─── Unit Switcher ─── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 mb-2">
        {([
          { id: "percetakan", label: "Percetakan", icon: Printer, route: "percetakan" },
          { id: "gadget-laptop", label: "Gadget", icon: Smartphone, route: "gadget-laptop" },
          { id: "warkop-kelontong", label: "Warkop", icon: Coffee, route: "warkop-kelontong" },
          { id: "pakaian-konveksi", label: "Konveksi", icon: Shirt, route: "pakaian-konveksi" },
        ] as const).map((u) => {
          const Ico = u.icon;
          const active = u.id === "pakaian-konveksi";
          return (
            <button
              key={u.id}
              onClick={() => router.push(`/buku-usaha/${u.route}/kasir`)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                active ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-sm" : "bg-muted/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Ico className="size-3.5" />
              {u.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-4">
        {/* ═══ SISI KIRI: FORM ═══ */}
        <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-10rem)] pr-1">
          {/* ─── Toggle Mode ─── */}
          <div className="flex gap-2">
            {(["ready", "custom"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  mode === m
                    ? "bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/20"
                    : "bg-muted/30 text-muted-foreground/60 hover:bg-muted/50"
                }`}
              >
                {m === "ready" ? <ShoppingBag className="size-4" /> : <Layers className="size-4" />}
                {m === "ready" ? "Ready Stock" : "Custom Konveksi"}
              </button>
            ))}
          </div>

          {/* ═══════════════ READY STOCK ═══════════════ */}
          {mode === "ready" && (
            <>
              <div className="floating-card p-4 space-y-3">
                <p className="text-xs font-semibold flex items-center gap-1.5"><Package className="size-3.5 text-rose-500" /> Cari Produk</p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
                  <input type="text" value={searchProduk} onChange={(e) => { setSearchProduk(e.target.value); setShowDropdown(true); }}
                    onFocus={() => setShowDropdown(true)} onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    placeholder="Cari produk..." className="input-premium w-full text-xs pl-10" />
                </div>
                {showDropdown && filteredProduk.length > 0 && (
                  <div className="rounded-xl bg-card border border-border/60 shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                    {filteredProduk.map((p) => (
                      <button key={p.id} onMouseDown={() => { setSelectedProduk(p); setSelectedWarna(""); setSelectedUkuran(""); setSearchProduk(p.nama); setShowDropdown(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-xs hover:bg-muted/30 transition-colors text-left"
                      >
                        <div className="size-7 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center"><Shirt className="size-3.5 text-white" /></div>
                        <div className="flex-1 min-w-0"><p className="font-medium">{p.nama}</p><p className="text-[9px] text-muted-foreground/50">{p.kategori} — {formatRupiah(p.harga)}</p></div>
                      </button>
                    ))}
                  </div>
                )}
                {selectedProduk && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-50/50 border border-rose-500/20">
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                    <span className="text-[10px] font-medium flex-1">{selectedProduk.nama}</span>
                    <span className="text-[10px] font-bold tabular-nums text-emerald-600">{formatRupiah(selectedProduk.harga)}</span>
                    <button onClick={() => { setSelectedProduk(null); setSearchProduk(""); }} className="size-6 rounded-lg flex items-center justify-center hover:bg-rose-500/10 text-muted-foreground/40 hover:text-rose-500"><X className="size-3.5" /></button>
                  </div>
                )}
              </div>

              {selectedProduk && (
                <div className="floating-card p-4 space-y-3">
                  <p className="text-xs font-semibold flex items-center gap-1.5"><Layers className="size-3.5 text-rose-500" /> Pilih Varian</p>
                  <div>
                    <label className="text-[9px] text-muted-foreground/50">Warna</label>
                    <div className="flex gap-1.5 flex-wrap mt-1">
                      {WARNA_LIST.filter((w) => selectedProduk.varian.some((v) => v.warna === w)).map((w) => (
                        <button key={w} onClick={() => { setSelectedWarna(w); setSelectedUkuran(""); }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all ${selectedWarna === w ? "border-rose-500/50 bg-rose-50 text-rose-600" : "border-border/40 text-muted-foreground/50 hover:border-muted-foreground/20"}`}
                        >{w}</button>
                      ))}
                    </div>
                  </div>
                  {selectedWarna && (
                    <div>
                      <label className="text-[9px] text-muted-foreground/50">Ukuran</label>
                      <div className="flex gap-1.5 flex-wrap mt-1">
                        {selectedProduk.varian.filter((v) => v.warna === selectedWarna).map((v) => (
                          <button key={v.ukuran} onClick={() => setSelectedUkuran(v.ukuran)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${v.stok <= 0 ? "opacity-30 cursor-not-allowed" : selectedUkuran === v.ukuran ? "border-rose-500/50 bg-rose-500 text-white shadow-md" : "border-border/40 text-muted-foreground/50 hover:border-muted-foreground/20"}`}
                            disabled={v.stok <= 0}
                          >{v.ukuran} {v.stok <= 0 ? "(Habis)" : `(${v.stok})`}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedWarna && selectedUkuran && (
                    <button onClick={addReadyToCart} className="w-full py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white text-[10px] font-bold shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2">
                      <Plus className="size-3.5" /> Tambah ke Keranjang
                    </button>
                  )}
                </div>
              )}

              <div className="floating-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold flex items-center gap-1.5"><ShoppingBag className="size-3.5 text-rose-500" /> Keranjang</p>
                  <span className="text-[10px] text-muted-foreground/50">{cartReady.length} item</span>
                </div>
                {cartReady.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground/30 py-3 text-center">Belum ada item</p>
                ) : (
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {cartReady.map((c, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors group">
                        <div className="size-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shrink-0"><Shirt className="size-4 text-white" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-medium truncate">{c.produk.nama}</p>
                          <p className="text-[8px] text-muted-foreground/50">{c.warna}, {c.ukuran}</p>
                          <p className="text-[9px] font-semibold tabular-nums text-emerald-600">{formatRupiah(c.harga * c.qty)}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => updateQtyReady(i, -1)} className="size-6 rounded-lg bg-muted/40 flex items-center justify-center hover:bg-muted/60"><Minus className="size-3 text-muted-foreground/60" /></button>
                          <span className="w-5 text-center text-[10px] font-bold tabular-nums">{c.qty}</span>
                          <button onClick={() => updateQtyReady(i, 1)} className="size-6 rounded-lg bg-muted/40 flex items-center justify-center hover:bg-emerald-500/10 hover:text-emerald-600"><Plus className="size-3 text-muted-foreground/60" /></button>
                          <button onClick={() => removeReady(i)} className="size-6 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 text-rose-500"><Trash2 className="size-3" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {cartReady.length > 0 && (
                  <div className="flex justify-between pt-2 border-t border-border/30">
                    <span className="text-xs font-semibold">Total</span>
                    <span className="text-base font-bold font-heading tabular-nums text-rose-600">{formatRupiah(subtotal)}</span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ═══════════════ CUSTOM KONVEKSI ═══════════════ */}
          {mode === "custom" && (
            <div className="floating-card p-5 space-y-4">
              <p className="text-xs font-semibold flex items-center gap-1.5"><Ruler className="size-3.5 text-rose-500" /> Kalkulator Manufaktur</p>
              <div className="space-y-1">
                <label className="text-[9px] text-muted-foreground/50">Nama Produk Custom</label>
                <input type="text" value={customNamaProduk} onChange={(e) => setCustomNamaProduk(e.target.value)} className="input-premium w-full text-xs" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-[9px] text-muted-foreground/50">Jumlah (Pcs)</label><input type="number" min={1} value={customPcs} onChange={(e) => setCustomPcs(parseInt(e.target.value) || 0)} className="input-premium w-full text-xs" /></div>
                <div className="space-y-1"><label className="text-[9px] text-muted-foreground/50">Kain (Kg/Yard)</label><input type="number" min={0} step={0.5} value={customKain} onChange={(e) => setCustomKain(parseFloat(e.target.value) || 0)} className="input-premium w-full text-xs" /></div>
                <div className="space-y-1"><label className="text-[9px] text-muted-foreground/50">Modal Kain/unit</label><div className="relative"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/40">Rp</span><input type="text" inputMode="numeric" value={customHargaKain} onChange={(e) => setCustomHargaKain(parseInt(e.target.value.replace(/\D/g, "")) || 0)} className="input-premium w-full text-xs pl-8 tabular-nums" /></div></div>
                <div className="space-y-1"><label className="text-[9px] text-muted-foreground/50">Ongkos CMT</label><div className="relative"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/40">Rp</span><input type="text" inputMode="numeric" value={customOngkosCMT} onChange={(e) => setCustomOngkosCMT(parseInt(e.target.value.replace(/\D/g, "")) || 0)} className="input-premium w-full text-xs pl-8 tabular-nums" /></div></div>
                <div className="space-y-1"><label className="text-[9px] text-muted-foreground/50">Sablon/Bordir</label><div className="relative"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/40">Rp</span><input type="text" inputMode="numeric" value={customSablon} onChange={(e) => setCustomSablon(parseInt(e.target.value.replace(/\D/g, "")) || 0)} className="input-premium w-full text-xs pl-8 tabular-nums" /></div></div>
                <div className="space-y-1"><label className="text-[9px] text-muted-foreground/50">Harga Jual/pcs</label><div className="relative"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/40">Rp</span><input type="text" inputMode="numeric" value={customHargaJual} onChange={(e) => setCustomHargaJual(parseInt(e.target.value.replace(/\D/g, "")) || 0)} className="input-premium w-full text-xs pl-8 tabular-nums" /></div></div>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-rose-500/10 to-pink-500/10 border border-rose-500/20 p-4 space-y-1.5">
                <p className="text-[10px] font-semibold text-rose-600 uppercase tracking-wider">Hasil Kalkulasi</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                  <div className="flex justify-between"><span className="text-muted-foreground/60">Modal Bahan</span><span className="font-semibold tabular-nums">{formatRupiah(Math.round(hasilKonveksi.totalModalBahan))}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground/60">Wastage 5%</span><span className="font-semibold tabular-nums text-amber-500">{formatRupiah(Math.round(hasilKonveksi.wastageCost))}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground/60">Total HPP</span><span className="font-semibold tabular-nums text-rose-500">{formatRupiah(Math.round(hasilKonveksi.totalHPP))}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground/60">Total Jual</span><span className="font-semibold tabular-nums text-emerald-600">{formatRupiah(Math.round(hasilKonveksi.totalJual))}</span></div>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-rose-500/20">
                  <span className="text-[10px] font-semibold">Laba Kotor</span>
                  <span className={`text-xs font-bold font-heading tabular-nums ${hasilKonveksi.labaKotor >= 0 ? "text-emerald-600" : "text-rose-500"}`}>{hasilKonveksi.labaKotor >= 0 ? "+" : ""}{formatRupiah(Math.round(hasilKonveksi.labaKotor))}</span>
                </div>
              </div>
            </div>
          )}

          {/* ─── CUSTOMER ─── */}
          <div className="floating-card p-4 space-y-3">
            <p className="text-xs font-semibold flex items-center gap-1.5"><User className="size-3.5 text-rose-500" /> Data Pelanggan</p>
            <div className="relative">
              <label className="text-[9px] text-muted-foreground/50">Nama Pelanggan</label>
              <div className="relative mt-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/40" />
                <input type="text" value={cariCustomer} onChange={(e) => { setCariCustomer(e.target.value); setShowCustDropdown(true); }}
                  onFocus={() => setShowCustDropdown(true)} onBlur={() => setTimeout(() => setShowCustDropdown(false), 200)}
                  placeholder="Cari pelanggan..." className="input-premium w-full text-xs pl-8" />
              </div>
              {showCustDropdown && filteredCustomers.length > 0 && (
                <div className="absolute z-20 mt-1 w-full rounded-xl bg-card border border-border/60 shadow-2xl overflow-hidden">
                  {filteredCustomers.map((c) => (
                    <button key={c.nama} onMouseDown={() => { setCustomerNama(c.nama); setCustomerWA(c.wa); setCariCustomer(c.nama); setShowCustDropdown(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-xs hover:bg-muted/30 transition-colors text-left">
                      <div className="size-7 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center"><User className="size-3.5 text-white" /></div>
                      <div><p className="font-medium">{c.nama}</p>{c.wa && <p className="text-[9px] text-muted-foreground/50">{c.wa}</p>}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {customerNama && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-50/50 border border-rose-500/20">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                <span className="text-[10px] font-medium flex-1">{customerNama}</span>
                {customerWA && <span className="text-[9px] text-muted-foreground/50">{customerWA}</span>}
              </div>
            )}
          </div>

          {/* ─── DP & SISA ─── */}
          <div className="floating-card p-4 space-y-3">
            <p className="text-xs font-semibold flex items-center gap-1.5"><DollarSign className="size-3.5 text-emerald-500" /> Pembayaran</p>
            <div className="space-y-1">
              <label className="text-[9px] text-muted-foreground/50">Uang Muka (DP)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/50">Rp</span>
                <input type="text" inputMode="numeric" value={dp} onChange={(e) => setDP(e.target.value.replace(/\D/g, ""))} placeholder="0" className="input-premium w-full text-xs pl-10 tabular-nums" />
              </div>
            </div>
          {/* Pilih Dompet */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
              <div><p className="text-[9px] text-muted-foreground/50">Total</p><p className="text-sm font-bold font-heading tabular-nums text-emerald-600">{formatRupiah(subtotal)}</p></div>
              <div><p className="text-[9px] text-muted-foreground/50">DP</p><p className="text-sm font-bold font-heading tabular-nums text-blue-600">{formatRupiah(dpNumber)}</p></div>
              <div><p className="text-[9px] text-muted-foreground/50">Sisa</p><p className={`text-sm font-bold font-heading tabular-nums ${sisa > 0 ? "text-rose-600" : "text-emerald-600"}`}>{sisa > 0 ? formatRupiah(sisa) : "LUNAS"}</p></div>
            </div>
            {subtotal > 0 && (
              <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${dpNumber >= subtotal ? "bg-emerald-500" : "bg-gradient-to-r from-amber-400 to-amber-500"}`}
                  style={{ width: `${Math.min((dpNumber / subtotal) * 100, 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* ─── SIMPAN ─── */}
          <button onClick={handleSimpan}
            disabled={(mode === "ready" && cartReady.length === 0) || (mode === "custom" && customPcs <= 0) || !customerNama}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white text-xs font-bold shadow-lg shadow-rose-500/20 hover:shadow-xl hover:shadow-rose-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="size-4" /> {showInvoice ? "Update & Cetak Ulang" : "Simpan &amp; Cetak Invoice"}
          </button>
        </div>

        {/* ═══ SISI KANAN: LIVE PREVIEW INVOICE ═══ */}
        <div className="overflow-y-auto max-h-[calc(100vh-10rem)] pr-1">
          <div className="sticky top-0">
            {invoiceData && customerNama ? (
              <>
                <InvoicePakaianKonveksiView data={invoiceData} preview={!showInvoice} noRef="MUGHIS BANK v3 — Pakaian & Konveksi" />
                {showInvoice && (
                  <>
                    <div className="mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Transaksi BERHASIL — {invoiceId}</p>
                      </div>
                    </div>
                    <div className="sticky bottom-0 mt-3 p-3 bg-background/80 backdrop-blur-md border border-border/30 rounded-xl shadow-lg flex gap-2">
                      <button onClick={resetForm}
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
                      >
                        Transaksi Baru
                      </button>
                      <button onClick={() => window.print()}
                        className="flex-1 py-2.5 rounded-xl bg-muted/50 text-muted-foreground text-xs font-bold hover:bg-muted/80 transition-colors"
                      >
                        Cetak Nota
                      </button>
                      <button onClick={() => {
                        const msg = encodeURIComponent(`Terima kasih ${customerNama}!\n\nTransaksi: ${invoiceId}\nTotal: ${formatRupiah(subtotal)}\nSisa: ${formatRupiah(sisa)}`);
                        window.open(`https://wa.me/${customerWA || "62"}?text=${msg}`, "_blank");
                      }}
                        className="flex-1 py-2.5 rounded-xl bg-green-500/10 text-green-600 text-xs font-bold hover:bg-green-500/20 transition-colors"
                      >
                        Kirim WA
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="floating-card p-8 text-center min-h-[60vh] flex flex-col items-center justify-center">
                <Shirt className="size-12 text-muted-foreground/20 mb-3" />
                <p className="text-xs text-muted-foreground/40">Pilih produk dan isi data pelanggan</p>
                <p className="text-[10px] text-muted-foreground/30 mt-1">Invoice preview akan muncul di sini secara real-time</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 mt-4">
        <QrisDisplay />
      </div>
    </div>
  );
}
