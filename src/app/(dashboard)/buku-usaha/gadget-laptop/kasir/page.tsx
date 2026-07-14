"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Smartphone, Laptop, ArrowLeft, Search, DollarSign,
  User, CheckCircle2, Shield, Box, X, RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import InvoiceGadgetLaptopView, { GadgetOrderInvoiceData } from "../../components/InvoiceGadgetLaptopView";
import { useProfilUsahaStore } from "../../percetakan/store/useProfilUsahaStore";
import { useBusinessStore } from "@/store/useBusinessStore";
import { KasirSkeleton } from "@/components/ui/skeleton";
import QrisDisplay from "@/components/qris-display";

/* ─── Types ─── */
interface ProdukKatalog {
  id: string;
  brand: string;
  tipe: string;
  kategori: "hp" | "laptop" | "tablet" | "aksesoris";
  hargaJual: number;
  hargaModal: number;
}

interface TradeInState {
  aktif: boolean;
  namaUnit: string;
  imeiSn: string;
  nilaiTaksir: number;
}

/* ─── Mock Katalog ─── */
const KATALOG: ProdukKatalog[] = [
  { id: "P-001", brand: "iPhone", tipe: "15 Pro Max 256GB", kategori: "hp", hargaJual: 22500000, hargaModal: 18000000 },
  { id: "P-002", brand: "Samsung", tipe: "Galaxy S24 Ultra", kategori: "hp", hargaJual: 20000000, hargaModal: 16000000 },
  { id: "P-003", brand: "Xiaomi", tipe: "Redmi Note 13 Pro", kategori: "hp", hargaJual: 3800000, hargaModal: 2800000 },
  { id: "P-004", brand: "Apple", tipe: "MacBook Air M3", kategori: "laptop", hargaJual: 18500000, hargaModal: 14500000 },
  { id: "P-005", brand: "Lenovo", tipe: "ThinkPad X1 Carbon", kategori: "laptop", hargaJual: 11000000, hargaModal: 8500000 },
  { id: "P-006", brand: "ASUS", tipe: "ROG Zephyrus G14", kategori: "laptop", hargaJual: 18000000, hargaModal: 14000000 },
  { id: "P-007", brand: "Samsung", tipe: "Galaxy Tab S9", kategori: "tablet", hargaJual: 9500000, hargaModal: 7500000 },
  { id: "P-008", brand: "Samsung", tipe: "Galaxy A55", kategori: "hp", hargaJual: 3800000, hargaModal: 2800000 },
  { id: "P-009", brand: "Samsung", tipe: "Galaxy Buds3 Pro", kategori: "aksesoris", hargaJual: 2500000, hargaModal: 1800000 },
];

const CUSTOMER_DUMMY = [
  { nama: "Ahmad Fauzi", wa: "085211112222" },
  { nama: "Siti Nurhaliza", wa: "085233334444" },
  { nama: "Budi Santoso", wa: "085255556666" },
  { nama: "Walk-in Customer", wa: "" },
];

const GARANSI_OPTIONS = [
  { value: "1-bulan", label: "1 Bulan" },
  { value: "3-bulan", label: "3 Bulan" },
  { value: "6-bulan", label: "6 Bulan" },
  { value: "1-tahun", label: "1 Tahun" },
  { value: "2-tahun", label: "2 Tahun" },
];

function generateId() {
  const d = new Date();
  const ds = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `NOTA-GADGET-${ds}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatRupiah(n: number) {
  return `IDR ${n.toLocaleString("id-ID")}`;
}

export default function KasirGadgetLaptop() {
  const router = useRouter();
  const { profil } = useProfilUsahaStore();
  const { wallets, tambahSaldoWallet, kurangiSaldoWallet } = useBusinessStore();
  const [walletPenerimaanId, setWalletPenerimaanId] = useState(wallets[0]?.id || "wallet-kas");
  const [walletModalId, setWalletModalId] = useState(wallets[1]?.id || "wallet-bsi");
  const [mounted, setMounted] = useState(false);

  /* ─── Search & Selected Product ─── */
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProdukKatalog | null>(null);

  /* ─── Unit Detail ─── */
  const [imeiSn, setImeiSn] = useState("");
  const [kondisi, setKondisi] = useState<"baru" | "second">("baru");
  const [garansi, setGaransi] = useState("1-tahun");

  /* ─── Customer ─── */
  const [cariCustomer, setCariCustomer] = useState("");
  const [customerNama, setCustomerNama] = useState("");
  const [customerWA, setCustomerWA] = useState("");
  const [showCustDropdown, setShowCustDropdown] = useState(false);

  /* ─── Trade-In ─── */
  const [tradeIn, setTradeIn] = useState<TradeInState>({
    aktif: false, namaUnit: "", imeiSn: "", nilaiTaksir: 0,
  });

  /* ─── DP ─── */
  const [dp, setDP] = useState("");

  /* ─── Invoice ─── */
  const [invoiceId, setInvoiceId] = useState("");
  const [showInvoice, setShowInvoice] = useState(false);

  useEffect(() => setMounted(true), []);

  /* ─── Filter produk ─── */
  const filteredProducts = useMemo(() => {
    if (!search) return KATALOG;
    const q = search.toLowerCase();
    return KATALOG.filter(
      (p) =>
        p.brand.toLowerCase().includes(q) ||
        p.tipe.toLowerCase().includes(q) ||
        p.kategori.toLowerCase().includes(q)
    );
  }, [search]);

  const filteredCustomers = useMemo(() => {
    if (!cariCustomer) return CUSTOMER_DUMMY;
    const q = cariCustomer.toLowerCase();
    return CUSTOMER_DUMMY.filter((c) => c.nama.toLowerCase().includes(q));
  }, [cariCustomer]);

  const pilihProduk = useCallback((p: ProdukKatalog) => {
    setSelectedProduct(p);
    setSearch(`${p.brand} ${p.tipe}`);
    setShowDropdown(false);
    if (!imeiSn) setImeiSn(`IMEI-${Date.now().toString().slice(-8)}`);
  }, [imeiSn]);

  const pilihCustomer = useCallback((nama: string, wa: string) => {
    setCustomerNama(nama);
    setCustomerWA(wa);
    setCariCustomer(nama);
    setShowCustDropdown(false);
  }, []);

  /* ─── Kalkulasi ─── */
  const subtotal = selectedProduct ? selectedProduct.hargaJual : 0;
  const potonganTradeIn = tradeIn.aktif ? tradeIn.nilaiTaksir : 0;
  const total = Math.max(subtotal - potonganTradeIn, 0);
  const dpNumber = parseInt(dp.replace(/\D/g, ""), 10) || 0;
  const sisa = Math.max(total - dpNumber, 0);

  const resetForm = useCallback(() => {
    setSelectedProduct(null);
    setSearch("");
    setImeiSn("");
    setKondisi("baru");
    setGaransi("1-tahun");
    setTradeIn({ aktif: false, namaUnit: "", imeiSn: "", nilaiTaksir: 0 });
    setDP("");
    setInvoiceId("");
  }, []);

  /* ─── Simpan & Generate Invoice ─── */
  const handleSimpan = useCallback(() => {
    if (!selectedProduct) { toast.error("Pilih produk terlebih dahulu"); return; }
    if (!imeiSn.trim()) { toast.error("IMEI/SN wajib diisi"); return; }
    if (!customerNama) { toast.error("Isi nama pelanggan"); return; }

    const id = invoiceId || generateId();
    setInvoiceId(id);

    /* push unit bekas ke stok gudang sebagai second dengan HPP senilai taksiran (simulasi) */
    if (tradeIn.aktif && tradeIn.nilaiTaksir > 0) {
      toast.success(`Unit bekas ${tradeIn.namaUnit} masuk gudang sebagai stok Second (HPP: ${formatRupiah(tradeIn.nilaiTaksir)})`);
    }

    setShowInvoice(true);
    toast.success(`Transaksi ${id} berhasil disimpan`);
    /* Update wallet */
    if (selectedProduct.hargaModal > 0) kurangiSaldoWallet(walletModalId, selectedProduct.hargaModal);
    if (dpNumber > 0) tambahSaldoWallet(walletPenerimaanId, dpNumber);
    setTimeout(() => {
      const el = document.getElementById("invoice-print-area");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
  }, [selectedProduct, imeiSn, customerNama, invoiceId, tradeIn, dpNumber,
      kurangiSaldoWallet, tambahSaldoWallet, walletModalId, walletPenerimaanId]);

  const garansiLabel = GARANSI_OPTIONS.find((g) => g.value === garansi)?.label || garansi;
  const statusBayar: "lunas" | "piutang" = sisa <= 0 ? "lunas" : "piutang";

  const invoiceData = useMemo<GadgetOrderInvoiceData | null>(() => {
    if (!selectedProduct) return null;
    const id = invoiceId || generateId();
    return {
      id,
      tanggal: todayISO(),
      customer: customerNama,
      noWA: customerWA,
      kategori: `${selectedProduct.kategori.toUpperCase()} — Gadget & Laptop`,
      statusBayar,
      statusLabel: statusBayar === "lunas" ? "LUNAS" : `SISA ${formatRupiah(sisa)}`,
      statusColor: statusBayar === "lunas"
        ? "text-emerald-700 bg-emerald-100"
        : "text-amber-700 bg-amber-100",
      items: [
        {
          no: 1,
          item: `${selectedProduct.brand} ${selectedProduct.tipe}`,
          spesifikasi: `Kondisi: ${kondisi === "baru" ? "Baru (BNIB)" : "Second/Bekas"} | Kategori: ${selectedProduct.kategori}`,
          imeiSn: imeiSn,
          garansi: garansiLabel,
          qty: 1,
          harga: selectedProduct.hargaJual,
          jumlah: selectedProduct.hargaJual,
        },
      ],
      tradeIn: {
        aktif: tradeIn.aktif,
        unitBekas: tradeIn.namaUnit,
        imeiSnBekas: tradeIn.imeiSn,
        nilaiTaksir: tradeIn.nilaiTaksir,
      },
      subtotal,
      potonganTradeIn,
      total,
      dp: dpNumber,
      sisa,
      pembayaran: statusBayar === "lunas" ? "Tunai / Transfer" : "Piutang (Sisa Tagihan)",
      rekeningBank: "Bank Aceh Syariah",
      rekeningNomor: "010-01-123456-7",
      rekeningAtasNama: profil.nama || "Mughis Group",
    };
  }, [selectedProduct, customerNama, customerWA, invoiceId, kondisi, garansi,
      garansiLabel, statusBayar, tradeIn, subtotal, potonganTradeIn, total, dpNumber, sisa, profil.nama,
      imeiSn]);

  if (!mounted) return <KasirSkeleton />;

  return (
    <div className="pb-20 animate-fade-in">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between max-w-full px-4 mb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/buku-usaha/gadget-laptop/dashboard")}
            className="size-9 rounded-xl bg-muted/30 flex items-center justify-center hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="size-4 text-muted-foreground" />
          </button>
          <div className="size-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Smartphone className="size-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold font-heading">POS Kasir Gadget & Laptop</h2>
            <p className="text-[10px] text-muted-foreground/60">Split Screen — Live Preview</p>
          </div>
        </div>
        {showInvoice && (
          <button onClick={() => { setShowInvoice(false); resetForm(); }}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" /> Baru Lagi
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-4">
        {/* ═══ SISI KIRI: FORM ═══ */}
        <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-10rem)] pr-1">
          {/* ─── SEARCH PRODUK ─── */}
          <div className="floating-card p-4 space-y-3">
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <Box className="size-3.5 text-cyan-500" /> Cari Produk
            </p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                placeholder="Cari brand, tipe, atau kategori..."
                className="input-premium w-full text-xs pl-10"
              />
            </div>
            {showDropdown && filteredProducts.length > 0 && (
              <div className="rounded-xl bg-card border border-border/60 shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    onMouseDown={() => pilihProduk(p)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-xs hover:bg-muted/30 transition-colors text-left"
                  >
                    <div className={`size-7 rounded-lg flex items-center justify-center ${
                      p.kategori === "hp" ? "bg-cyan-500/10 text-cyan-600" :
                      p.kategori === "laptop" ? "bg-blue-500/10 text-blue-600" :
                      p.kategori === "tablet" ? "bg-violet-500/10 text-violet-600" :
                      "bg-gray-500/10 text-gray-600"
                    }`}>
                      {p.kategori === "hp" ? <Smartphone className="size-3.5" /> :
                       p.kategori === "laptop" ? <Laptop className="size-3.5" /> :
                       <Box className="size-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{p.brand} {p.tipe}</p>
                      <p className="text-[9px] text-muted-foreground/50 capitalize">{p.kategori}</p>
                    </div>
                    <span className="text-[10px] font-semibold tabular-nums text-emerald-600">{formatRupiah(p.hargaJual)}</span>
                  </button>
                ))}
              </div>
            )}
            {selectedProduct && (
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-500/20">
                <div className="size-8 rounded-lg bg-cyan-500/10 text-cyan-600 flex items-center justify-center">
                  <CheckCircle2 className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">{selectedProduct.brand} {selectedProduct.tipe}</p>
                  <p className="text-[9px] text-muted-foreground/50 capitalize">{selectedProduct.kategori}</p>
                </div>
                <span className="text-xs font-bold tabular-nums text-emerald-600">{formatRupiah(selectedProduct.hargaJual)}</span>
                <button onClick={() => { setSelectedProduct(null); setSearch(""); }}
                  className="size-6 rounded-lg flex items-center justify-center hover:bg-rose-500/10 text-muted-foreground/40 hover:text-rose-500 transition-colors"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* ─── DETAIL UNIT ─── */}
          {selectedProduct && (
            <div className="floating-card p-4 space-y-4">
              <p className="text-xs font-semibold flex items-center gap-1.5">
                <Shield className="size-3.5 text-cyan-500" /> Detail Unit
              </p>
              <div className="space-y-1">
                <label className="text-[9px] text-muted-foreground/50">IMEI / Serial Number *</label>
                <input
                  type="text"
                  value={imeiSn}
                  onChange={(e) => setImeiSn(e.target.value)}
                  placeholder="cth: 356789012345678"
                  className="input-premium w-full text-xs tabular-nums"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-muted-foreground/50">Kondisi</label>
                  <div className="flex gap-2">
                    {(["baru", "second"] as const).map((k) => (
                      <button key={k} onClick={() => setKondisi(k)}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                          kondisi === k
                            ? k === "baru"
                              ? "bg-emerald-500 text-white shadow-md"
                              : "bg-amber-500 text-white shadow-md"
                            : "bg-muted/30 text-muted-foreground/50 hover:bg-muted/50"
                        }`}
                      >{k === "baru" ? "Baru (BNIB)" : "Second"}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-muted-foreground/50">Garansi Toko</label>
                  <select value={garansi} onChange={(e) => setGaransi(e.target.value)} className="input-premium w-full text-[10px]">
                    {GARANSI_OPTIONS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ─── TRADE-IN ─── */}
          {selectedProduct && (
            <div className="floating-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold flex items-center gap-1.5">
                  <RefreshCw className="size-3.5 text-amber-500" /> Tukar Tambah (Trade-In)
                </p>
                <button
                  onClick={() => setTradeIn((prev) => ({ ...prev, aktif: !prev.aktif }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    tradeIn.aktif ? "bg-amber-500" : "bg-muted/50"
                  }`}
                >
                  <span className={`inline-block size-5 rounded-full bg-white shadow-sm transition-transform ${
                    tradeIn.aktif ? "translate-x-6" : "translate-x-0.5"
                  }`} />
                </button>
              </div>
              {tradeIn.aktif && (
                <div className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[9px] text-muted-foreground/50">Nama Unit Bekas Pelanggan</label>
                    <input type="text" value={tradeIn.namaUnit} onChange={(e) => setTradeIn((p) => ({ ...p, namaUnit: e.target.value }))}
                      placeholder="cth: iPhone 11 64GB" className="input-premium w-full text-[10px]" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] text-muted-foreground/50">IMEI/SN Unit Bekas</label>
                      <input type="text" value={tradeIn.imeiSn} onChange={(e) => setTradeIn((p) => ({ ...p, imeiSn: e.target.value }))}
                        placeholder="cth: 356789012345679" className="input-premium w-full text-[10px] tabular-nums" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-muted-foreground/50">Nilai Taksiran</label>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/40">Rp</span>
                        <input type="text" inputMode="numeric" value={tradeIn.nilaiTaksir || ""}
                          onChange={(e) => setTradeIn((p) => ({ ...p, nilaiTaksir: parseInt(e.target.value.replace(/\D/g, "")) || 0 }))}
                          placeholder="0" className="input-premium w-full text-[10px] pl-8 tabular-nums" />
                      </div>
                    </div>
                  </div>
                  {tradeIn.nilaiTaksir > 0 && (
                    <div className="rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-500/20 p-2.5 flex items-center justify-between text-[10px]">
                      <span className="font-medium">Potongan Tukar Tambah</span>
                      <span className="font-bold text-red-600 tabular-nums">- {formatRupiah(tradeIn.nilaiTaksir)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ─── CUSTOMER ─── */}
          {selectedProduct && (
            <div className="floating-card p-4 space-y-3">
              <p className="text-xs font-semibold flex items-center gap-1.5">
                <User className="size-3.5 text-cyan-500" /> Data Pelanggan
              </p>
              <div className="relative">
                <label className="text-[9px] text-muted-foreground/50">Nama Pelanggan</label>
                <div className="relative mt-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/40" />
                  <input type="text" value={cariCustomer}
                    onChange={(e) => { setCariCustomer(e.target.value); setShowCustDropdown(true); }}
                    onFocus={() => setShowCustDropdown(true)}
                    onBlur={() => setTimeout(() => setShowCustDropdown(false), 200)}
                    placeholder="Cari pelanggan..." className="input-premium w-full text-xs pl-8" />
                </div>
                {showCustDropdown && filteredCustomers.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full rounded-xl bg-card border border-border/60 shadow-2xl overflow-hidden">
                    {filteredCustomers.map((c) => (
                      <button key={c.nama} onMouseDown={() => pilihCustomer(c.nama, c.wa)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-xs hover:bg-muted/30 transition-colors text-left"
                      >
                        <div className="size-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                          <User className="size-3.5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">{c.nama}</p>
                          {c.wa && <p className="text-[9px] text-muted-foreground/50">{c.wa}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {customerNama && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-500/20">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  <span className="text-[10px] font-medium flex-1">{customerNama}</span>
                  {customerWA && <span className="text-[9px] text-muted-foreground/50">{customerWA}</span>}
                </div>
              )}
            </div>
          )}

          {/* ─── DP & SISA ─── */}
          {selectedProduct && (
            <div className="floating-card p-4 space-y-3">
              <p className="text-xs font-semibold flex items-center gap-1.5">
                <DollarSign className="size-3.5 text-emerald-500" /> Pembayaran
              </p>
              <div className="space-y-1">
                <label className="text-[9px] text-muted-foreground/50">DP / Bayar</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/50">Rp</span>
                  <input type="text" inputMode="numeric" value={dp}
                    onChange={(e) => setDP(e.target.value.replace(/\D/g, ""))}
                    placeholder="0" className="input-premium w-full text-xs pl-10 tabular-nums" />
                </div>
              </div>
          {/* Pilih Dompet */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div>
                  <p className="text-[9px] text-muted-foreground/50">Subtotal</p>
                  <p className="text-xs font-bold font-heading tabular-nums">{formatRupiah(subtotal)}</p>
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground/50">Trade-In</p>
                  <p className="text-xs font-bold font-heading tabular-nums text-red-500">- {formatRupiah(potonganTradeIn)}</p>
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground/50">Total</p>
                  <p className="text-sm font-bold font-heading tabular-nums text-emerald-600">{formatRupiah(total)}</p>
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground/50">Sisa</p>
                  <p className={`text-sm font-bold font-heading tabular-nums ${sisa > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                    {sisa > 0 ? formatRupiah(sisa) : "LUNAS"}
                  </p>
                </div>
              </div>
              {total > 0 && (
                <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${dpNumber >= total ? "bg-emerald-500" : "bg-gradient-to-r from-amber-400 to-amber-500"}`}
                    style={{ width: `${Math.min((dpNumber / total) * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {/* ─── SIMPAN ─── */}
          {selectedProduct && (
            <button onClick={handleSimpan}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="size-4" /> {showInvoice ? "Update & Cetak Ulang" : "Simpan &amp; Generate Invoice"}
            </button>
          )}
        </div>

        {/* ═══ SISI KANAN: LIVE PREVIEW INVOICE ═══ */}
        <div className="overflow-y-auto max-h-[calc(100vh-10rem)] pr-1">
          <div className="sticky top-0">
            {selectedProduct && customerNama ? (
              <InvoiceGadgetLaptopView data={invoiceData!} preview={!showInvoice} noRef="MUGHIS BANK v3 — POS Kasir Gadget" />
            ) : (
              <div className="floating-card p-8 text-center min-h-[60vh] flex flex-col items-center justify-center">
                <Smartphone className="size-12 text-muted-foreground/20 mb-3" />
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
