"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Printer, Ruler, BookOpen, ArrowLeft, Search,
  CheckCircle2, User, DollarSign, Trash2, Save,
  Smartphone, Coffee, Shirt,
} from "lucide-react";
import toast from "react-hot-toast";
import InvoicePercetakanView, {
  OrderInvoiceData, InvoiceItem,
} from "../../components/InvoicePercetakanView";
import { useBusinessStore } from "@/store/useBusinessStore";
import { useProfilUsahaStore } from "../store/useProfilUsahaStore";
import { KasirSkeleton } from "@/components/ui/skeleton";
import QuickOrder from "@/components/quick-order";
import QrisDisplay from "@/components/qris-display";
import { hapticLight, hapticMedium, hapticSuccess } from "@/lib/haptic";

/* ─── Types ─── */
type ModeCetak = "meteran" | "buku";

interface BahanMeteran {
  id: string; label: string; hargaModal: number; hargaJual: number;
}

interface KalkulasiMeteran {
  luasTotal: number; wasteMargin: number; totalHPP: number; totalJual: number; labaKotor: number;
}

/* ─── Static ─── */
const BAHAN_METERAN: BahanMeteran[] = [
  { id: "banner-flexi-280", label: "Banner Flexi 280g", hargaModal: 25000, hargaJual: 45000 },
  { id: "korchin", label: "Korchin", hargaModal: 18000, hargaJual: 35000 },
  { id: "albatros", label: "Albatros", hargaModal: 22000, hargaJual: 40000 },
  { id: "stiker-ritrama", label: "Stiker Ritrama", hargaModal: 30000, hargaJual: 55000 },
];

function generateId() {
  return `INV/${new Date().getFullYear()}/PRT/${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatRupiah(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

/* ─── Kalkulator ─── */
function hitungMeteran(bahan: BahanMeteran, panjang: number, lebar: number, qty: number, hargaJual: number, hargaModal: number): KalkulasiMeteran {
  const luasTotal = panjang * lebar * qty;
  const wasteMargin = luasTotal * 0.05;
  const totalHPP = (luasTotal + wasteMargin) * hargaModal;
  const totalJual = luasTotal * hargaJual;
  return { luasTotal, wasteMargin, totalHPP, totalJual, labaKotor: totalJual - totalHPP };
}

export default function KasirPercetakan() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  /* Mode */
  const [mode, setMode] = useState<ModeCetak>("meteran");

  /* Meteran */
  const [mBahan, setMBahan] = useState(BAHAN_METERAN[0].id);
  const [mPanjang, setMPanjang] = useState(2);
  const [mLebar, setMLebar] = useState(1);
  const [mQty, setMQty] = useState(1);
  const [mHargaJual, setMHargaJual] = useState(BAHAN_METERAN[0].hargaJual);
  const [mHargaModal, setMHargaModal] = useState(BAHAN_METERAN[0].hargaModal);

  /* Buku — manual price input */
  const [bHalaman, setBHalaman] = useState(50);
  const [bQty, setBQty] = useState(1);
  const [bHargaSatuan, setBHargaSatuan] = useState("");

  /* Customer */
  const [cariCustomer, setCariCustomer] = useState("");
  const [customerNama, setCustomerNama] = useState("");
  const [customerWA, setCustomerWA] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  /* DP */
  const [dp, setDP] = useState("");

  /* Cart items from quick orders */
  const [cartItems, setCartItems] = useState<{ desc: string; price: number }[]>([]);

  /* Generated invoice ID */
  const [invoiceId, setInvoiceId] = useState("");
  const [showInvoice, setShowInvoice] = useState(false);
  const { wallets, tambahSaldoWallet, kurangiSaldoWallet, addCustomerRecord, recordCustomerTransaction, getCustomerByWA, addQuickOrder, setLastKasirUnit } = useBusinessStore();
  const { profil } = useProfilUsahaStore();
  const [walletPenerimaanId, setWalletPenerimaanId] = useState(wallets[0]?.id || "wallet-kas");
  const [walletModalId, setWalletModalId] = useState(wallets[1]?.id || "wallet-bsi");

  /* Sync harga bahan */
  useEffect(() => {
    const b = BAHAN_METERAN.find((x) => x.id === mBahan);
    if (b) { setMHargaJual(b.hargaJual); setMHargaModal(b.hargaModal); }
  }, [mBahan]);

  useEffect(() => { setMounted(true); setLastKasirUnit("percetakan"); }, [setLastKasirUnit]);

  /* Kalkulasi */
  const bahanTerpilih = useMemo(() => BAHAN_METERAN.find((b) => b.id === mBahan) || BAHAN_METERAN[0], [mBahan]);

  const hasilMeteran = useMemo<KalkulasiMeteran>(
    () => hitungMeteran(bahanTerpilih, mPanjang, mLebar, mQty, mHargaJual, mHargaModal),
    [bahanTerpilih, mPanjang, mLebar, mQty, mHargaJual, mHargaModal]
  );

  const bHarga = parseInt(bHargaSatuan.replace(/\D/g, ""), 10) || 0;

  const totalJual = mode === "meteran" ? hasilMeteran.totalJual : bHarga * bQty;
  const dpNumber = parseInt(dp.replace(/\D/g, ""), 10) || 0;
  const sisa = Math.max(totalJual - dpNumber, 0);

  /* Customer filter — cari dari store + dummy fallback */
  const storedCustomers = useBusinessStore((s) => s.customers);
  const filteredCustomers = useMemo(() => {
    const all = storedCustomers.map((c) => ({ nama: c.nama, wa: c.noWA }));
    if (!cariCustomer) return all;
    const q = cariCustomer.toLowerCase();
    return all.filter((c) => c.nama.toLowerCase().includes(q) || c.wa.includes(q));
  }, [cariCustomer, storedCustomers]);

  const pilihCustomer = useCallback((nama: string, wa: string) => {
    setCustomerNama(nama);
    setCustomerWA(wa);
    setCariCustomer(nama);
    setShowCustomerDropdown(false);
  }, []);

  /* Simpan & cetak */
  const handleSimpan = useCallback(() => {
    if (!customerNama) { toast.error("Isi nama pelanggan"); return; }
    if (totalJual <= 0) { toast.error("Total jual harus lebih dari 0"); return; }

    const id = invoiceId || generateId();
    setInvoiceId(id);

    /* ─── Catat pelanggan ─── */
    if (customerWA) {
      let cust = getCustomerByWA(customerWA);
      if (!cust) {
        const custId = addCustomerRecord({ nama: customerNama, noWA: customerWA });
        cust = { id: custId, nama: customerNama, noWA: customerWA, totalTransaksi: 0, totalBelanja: 0, poin: 0, terakhirTransaksi: "", createdAt: "" };
      }
      recordCustomerTransaction(cust.id, {
        customerId: cust.id,
        unit: "percetakan",
        invoiceId: id,
        total: Math.round(totalJual),
        tanggal: todayISO(),
        items: mode === "meteran"
          ? `${bahanTerpilih.label} ${mPanjang}x${mLebar}m x${mQty}`
          : `Buku ${bHalaman}hlm x${bQty}`,
      });
    }

    /* ─── Tampilkan invoice ─── */
    setShowInvoice(true);
    toast.success(`Transaksi ${id} berhasil disimpan`);

    /* Update wallet */
    if (mode === "meteran") {
      const hpp = Math.round(hasilMeteran.totalHPP);
      if (hpp > 0) kurangiSaldoWallet(walletModalId, hpp);
    }
    if (dpNumber > 0) tambahSaldoWallet(walletPenerimaanId, dpNumber);

    /* scroll to invoice */
    setTimeout(() => {
      const el = document.getElementById("invoice-print-area");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
  }, [customerNama, totalJual, invoiceId, mode, bahanTerpilih, mPanjang, mLebar, mQty,
      bHalaman, bQty, dpNumber, hasilMeteran,
      kurangiSaldoWallet, tambahSaldoWallet, walletModalId, walletPenerimaanId,
      addCustomerRecord, customerWA, getCustomerByWA, recordCustomerTransaction]);

  const resetForm = useCallback(() => {
    setMode("meteran");
    setMBahan(BAHAN_METERAN[0].id);
    setMPanjang(2); setMLebar(1); setMQty(1);
    setMHargaJual(BAHAN_METERAN[0].hargaJual);
    setMHargaModal(BAHAN_METERAN[0].hargaModal);
    setBHalaman(50); setBQty(1); setBHargaSatuan("");
    setCariCustomer(""); setCustomerNama(""); setCustomerWA("");
    setShowCustomerDropdown(false); setDP(""); setCartItems([]);
    setInvoiceId(""); setShowInvoice(false);
  }, []);

  /* Payment methods from store */
  const paymentMethods = useBusinessStore((s) => s.paymentMethods);
  const enabledPayments = paymentMethods.filter((pm) => pm.isEnabled);
  const defaultPayment = enabledPayments[0];

  /* Invoice data — always computed for live preview */
  const invoiceData = useMemo<OrderInvoiceData>(() => {
    let deskripsi = "";
    let spesifikasi = "";
    let ukuran = "";
    let ukuranJadi = "";
    let kertasIsi = "";
    let cover = "";
    let laminasi = "";
    const wrapping = "Ya";
    let jilid = "";

    const items: InvoiceItem[] = [];
    let no = 1;

    if (mode === "meteran") {
      deskripsi = `${bahanTerpilih.label} (${mPanjang}m x ${mLebar}m) x ${mQty} Pcs`;
      spesifikasi = `Bahan: ${bahanTerpilih.label} | ${mPanjang}m x ${mLebar}m x ${mQty} lembar`;
      ukuran = `${mPanjang} x ${mLebar} m`;
      ukuranJadi = `${mPanjang * 100} x ${mLebar * 100} cm`;
      kertasIsi = bahanTerpilih.label;
      cover = "-";
      laminasi = "-";
      jilid = "-";

      items.push({
        no: no++,
        item: `Cetak ${bahanTerpilih.label}`,
        qty: mQty,
        harga: Math.round(hasilMeteran.totalHPP / mQty),
        jumlah: Math.round(hasilMeteran.totalHPP),
      });
      if (cartItems.length > 0) {
        cartItems.forEach((ci) => {
          items.push({ no: no++, item: ci.desc, qty: 1, harga: ci.price, jumlah: ci.price });
        });
      }
    } else {
      kertasIsi = "-";
      cover = "-";
      laminasi = "-";
      jilid = "-";
      deskripsi = `Cetak Buku ${bHalaman} hlm x ${bQty} Eks`;
      spesifikasi = `Hal: ${bHalaman} | Qty: ${bQty} eks`;
      ukuran = "A5";
      ukuranJadi = "21 x 29.7 cm";

      if (bHarga > 0) items.push({ no: no++, item: `Cetak Buku ${bHalaman} hlm`, qty: bQty, harga: bHarga, jumlah: bHarga * bQty });
      if (cartItems.length > 0) {
        cartItems.forEach((ci) => {
          items.push({ no: no++, item: ci.desc, qty: 1, harga: ci.price, jumlah: ci.price });
        });
      }
    }

    return {
      id: invoiceId || generateId(),
      tanggal: todayISO(),
      customer: customerNama,
      noWA: customerWA,
      kategori: mode === "meteran" ? "Cetak Meteran" : "Cetak Buku",
      status: "proses-cetak",
      statusLabel: "DIPROSES",
      statusColor: "text-amber-700 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300",
      deskripsi,
      spesifikasi,
      ukuran,
      ukuranJadi,
      kertasIsi,
      cover,
      laminasi,
      wrapping,
      jilid,
      items,
      total: Math.round(totalJual),
      dp: dpNumber,
      sisa: Math.round(sisa),
      pembayaran: defaultPayment ? `${defaultPayment.namaMetode} — ${defaultPayment.accountNo}` : "Transfer Bank / Tunai",
      rekeningBank: defaultPayment?.bankName || "Bank",
      rekeningNomor: defaultPayment?.accountNo || "",
      rekeningAtasNama: defaultPayment?.accountName || profil?.nama || "",
    };
  }, [mode, bahanTerpilih, mPanjang, mLebar, mQty, bHalaman, bQty, bHarga,
      invoiceId, customerNama, customerWA, totalJual, dpNumber, sisa, hasilMeteran,
      cartItems, defaultPayment, profil]);

  if (!mounted) return <KasirSkeleton />;

  /* ─── RENDER (50:50 Split-Screen) ─── */
  return (
    <div className="pb-20 animate-fade-in">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between max-w-full px-4 mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/buku-usaha/percetakan/dashboard")}
            className="size-9 rounded-xl bg-muted/30 flex items-center justify-center hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="size-4 text-muted-foreground" />
          </button>
          <div className="size-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Printer className="size-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold font-heading">POS Kasir Percetakan</h2>
            <p className="text-[10px] text-muted-foreground/60">Split Screen — Live Preview</p>
          </div>
        </div>
        {showInvoice && (
          <button onClick={() => { setShowInvoice(false); setInvoiceId(""); setDP(""); }}
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
          const active = u.id === "percetakan";
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
        {/* ═══ SISI KIRI: FORM INPUT ═══ */}
        <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-10rem)] pr-1">
          {/* ─── Quick Order Templates ─── */}
          <QuickOrder
            unit="percetakan"
            onSelect={(items) => {
              hapticLight();
              setCartItems((prev) => [...prev, ...items]);
              toast.success(`${items.length} item ditambahkan dari template`);
            }}
          />

          {/* ─── Cart Items ─── */}
          {cartItems.length > 0 && (
            <div className="floating-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold">Keranjang ({cartItems.length})</p>
                <button onClick={() => { hapticMedium(); setCartItems([]); }} className="text-[10px] text-red-500 hover:text-red-600 flex items-center gap-1">
                  <Trash2 className="size-3" /> Hapus Semua
                </button>
              </div>
              {cartItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-[10px] py-1.5 border-b border-border/20 last:border-0">
                  <span className="flex-1 truncate mr-2">{item.desc}</span>
                  <span className="font-semibold tabular-nums text-emerald-600 shrink-0">Rp {item.price.toLocaleString("id-ID")}</span>
                </div>
              ))}
            </div>
          )}

          {/* ─── Toggle Mode ─── */}
          <div className="flex gap-2">
            {([
              { value: "meteran", label: "Cetak Meteran", icon: Ruler },
              { value: "buku", label: "Cetak Buku / Dokumen", icon: BookOpen },
            ] as const).map((opt) => {
              const Ico = opt.icon;
              const aktif = mode === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => { hapticLight(); setMode(opt.value); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    aktif
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20"
                      : "bg-muted/30 text-muted-foreground/60 hover:bg-muted/50"
                  }`}
                >
                  <Ico className="size-4" />
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* ─── FORM METERAN ─── */}
          {mode === "meteran" && (
            <div className="floating-card p-5 space-y-4">
              <p className="text-xs font-semibold flex items-center gap-1.5">
                <Ruler className="size-3.5 text-indigo-500" /> Kalkulator Meteran
              </p>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Bahan</label>
                <select value={mBahan} onChange={(e) => setMBahan(e.target.value)} className="input-premium w-full text-xs">
                  {BAHAN_METERAN.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] text-muted-foreground/50">Panjang (m)</label>
                  <input type="number" min={0.1} step={0.1} value={mPanjang} onChange={(e) => setMPanjang(parseFloat(e.target.value) || 0)} className="input-premium w-full text-[10px]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-muted-foreground/50">Lebar (m)</label>
                  <input type="number" min={0.1} step={0.1} value={mLebar} onChange={(e) => setMLebar(parseFloat(e.target.value) || 0)} className="input-premium w-full text-[10px]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-muted-foreground/50">Qty (lbr)</label>
                  <input type="number" min={1} value={mQty} onChange={(e) => setMQty(parseInt(e.target.value) || 1)} className="input-premium w-full text-[10px]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-muted-foreground/50">Harga Jual/m</label>
                  <input type="number" value={mHargaJual} onChange={(e) => setMHargaJual(parseInt(e.target.value) || 0)} className="input-premium w-full text-[10px] tabular-nums" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-muted-foreground/50">Harga Modal/m</label>
                <input type="number" value={mHargaModal} onChange={(e) => setMHargaModal(parseInt(e.target.value) || 0)} className="input-premium w-full text-[10px] tabular-nums" />
              </div>
              {/* Hasil */}
              <div className="rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 p-4 space-y-1.5">
                <p className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Hasil Kalkulasi</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                  <div className="flex justify-between"><span className="text-muted-foreground/60">Luas Total</span><span className="font-semibold tabular-nums">{hasilMeteran.luasTotal.toFixed(2)} m²</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground/60">Safety Waste (5%)</span><span className="font-semibold tabular-nums text-amber-500">{hasilMeteran.wasteMargin.toFixed(3)} m²</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground/60">Total HPP</span><span className="font-semibold tabular-nums text-rose-500">{formatRupiah(Math.round(hasilMeteran.totalHPP))}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground/60">Total Jual</span><span className="font-semibold tabular-nums text-emerald-600">{formatRupiah(Math.round(hasilMeteran.totalJual))}</span></div>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-indigo-500/20">
                  <span className="text-[10px] font-semibold">Laba Kotor</span>
                  <span className={`text-xs font-bold font-heading tabular-nums ${hasilMeteran.labaKotor >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                    {hasilMeteran.labaKotor >= 0 ? "+" : ""}{formatRupiah(Math.round(hasilMeteran.labaKotor))}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ─── FORM BUKU (manual price input) ─── */}
          {mode === "buku" && (
            <div className="floating-card p-5 space-y-4">
              <p className="text-xs font-semibold flex items-center gap-1.5">
                <BookOpen className="size-3.5 text-indigo-500" /> Cetak Buku / Dokumen
              </p>
              <p className="text-[10px] text-muted-foreground/40">Masukkan harga satuan secara manual</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-muted-foreground/50">Jumlah Halaman</label>
                  <input type="number" min={1} value={bHalaman} onChange={(e) => setBHalaman(parseInt(e.target.value) || 1)} className="input-premium w-full text-[10px]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-muted-foreground/50">Qty (Eks)</label>
                  <input type="number" min={1} value={bQty} onChange={(e) => setBQty(parseInt(e.target.value) || 1)} className="input-premium w-full text-[10px]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-muted-foreground/50">Harga per Buku (Rp)</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/40">Rp</span>
                    <input type="text" inputMode="numeric" value={bHargaSatuan} onChange={(e) => setBHargaSatuan(e.target.value.replace(/\D/g, ""))} placeholder="0" className="input-premium w-full text-[10px] pl-8 tabular-nums" />
                  </div>
                </div>
              </div>
              {bHarga > 0 && (
                <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground/60">Total ({bQty} eks × Rp {bHarga.toLocaleString("id-ID")})</span>
                    <span className="text-lg font-bold font-heading tabular-nums text-emerald-600">{formatRupiah(bHarga * bQty)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── CUSTOMER ─── */}
          <div className="floating-card p-4 space-y-4">
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <User className="size-3.5 text-indigo-500" /> Data Pelanggan
            </p>
            <div className="relative">
              <label className="text-[9px] text-muted-foreground/50">Nama Pelanggan</label>
              <div className="relative mt-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/40" />
                <input type="text" value={cariCustomer} onChange={(e) => { setCariCustomer(e.target.value); setShowCustomerDropdown(true); }}
                  onFocus={() => setShowCustomerDropdown(true)} onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                  placeholder="Cari pelanggan..." className="input-premium w-full text-xs pl-8" />
              </div>
              {showCustomerDropdown && filteredCustomers.length > 0 && (
                <div className="absolute z-20 mt-1 w-full rounded-xl bg-card border border-border/60 shadow-2xl overflow-hidden">
                  {filteredCustomers.map((c) => (
                    <button key={c.nama} onMouseDown={() => pilihCustomer(c.nama, c.wa)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-xs hover:bg-muted/30 transition-colors text-left">
                      <div className="size-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center"><User className="size-3.5 text-white" /></div>
                      <div><p className="font-medium">{c.nama}</p>{c.wa && <p className="text-[9px] text-muted-foreground/50">{c.wa}</p>}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {customerNama && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-500/20">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                <span className="text-[10px] font-medium flex-1">{customerNama}</span>
                {customerWA && <span className="text-[9px] text-muted-foreground/50">{customerWA}</span>}
              </div>
            )}
          </div>

          {/* ─── DP & SISA ─── */}
          <div className="floating-card p-4 space-y-3">
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <DollarSign className="size-3.5 text-emerald-500" /> Pembayaran
            </p>
            <div className="space-y-1">
              <label className="text-[9px] text-muted-foreground/50">DP Dibayar</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/50">Rp</span>
                <input type="text" inputMode="numeric" value={dp} onChange={(e) => setDP(e.target.value.replace(/\D/g, ""))} placeholder="0" className="input-premium w-full text-xs pl-10 tabular-nums" />
              </div>
            </div>
          {/* ─── Pilih Dompet ─── */}
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
              <div><p className="text-[9px] text-muted-foreground/50">Total Tagihan</p><p className="text-sm font-bold font-heading tabular-nums text-emerald-600">{formatRupiah(Math.round(totalJual))}</p></div>
              <div><p className="text-[9px] text-muted-foreground/50">DP</p><p className="text-sm font-bold font-heading tabular-nums text-blue-600">{formatRupiah(dpNumber)}</p></div>
              <div><p className="text-[9px] text-muted-foreground/50">Sisa Tagihan</p><p className={`text-sm font-bold font-heading tabular-nums ${sisa > 0 ? "text-rose-600" : "text-emerald-600"}`}>{formatRupiah(Math.round(sisa))}</p></div>
            </div>
            {totalJual > 0 && (
              <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${dpNumber >= totalJual ? "bg-emerald-500" : "bg-gradient-to-r from-amber-400 to-amber-500"}`}
                  style={{ width: `${Math.min((dpNumber / totalJual) * 100, 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* ─── Simpan sebagai Template ─── */}
          {totalJual > 0 && (
            <button
              onClick={() => {
                const label = prompt("Nama template pesanan cepat:");
                if (!label?.trim()) return;
                const desc = mode === "meteran"
                  ? `${bahanTerpilih.label} ${mPanjang}x${mLebar}m x${mQty}`
                  : `Buku ${bHalaman}hlm x${bQty}`;
                addQuickOrder({ unit: "percetakan", label: label.trim(), items: [{ desc, price: Math.round(totalJual) }] });
                toast.success(`Template "${label.trim()}" disimpan`);
              }}
              className="w-full py-2.5 rounded-xl border border-dashed border-muted-foreground/20 text-muted-foreground/50 hover:text-indigo-500 hover:border-indigo-500/30 text-[10px] font-medium transition-all flex items-center justify-center gap-2"
            >
              <Save className="size-3.5" /> Simpan sebagai Template Cepat
            </button>
          )}

          {/* ─── SIMPAN ─── */}
          <button onClick={() => { hapticSuccess(); handleSimpan(); }}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="size-4" /> {showInvoice ? "Update & Cetak Ulang" : "Simpan Transaksi & Cetak Nota"}
          </button>
        </div>

        {/* ═══ SISI KANAN: LIVE PREVIEW INVOICE ═══ */}
        <div className="overflow-y-auto max-h-[calc(100vh-10rem)] pr-1">
          <div className="sticky top-0">
            {customerNama && totalJual > 0 ? (
              <>
                <InvoicePercetakanView data={invoiceData} preview={!showInvoice} noRef="MUGHIS BANK v3 — POS Kasir Percetakan" />
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
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
                      >
                        Transaksi Baru
                      </button>
                      <button onClick={() => window.print()}
                        className="flex-1 py-2.5 rounded-xl bg-muted/50 text-muted-foreground text-xs font-bold hover:bg-muted/80 transition-colors"
                      >
                        Cetak Nota
                      </button>
                      <button onClick={() => {
                        const msg = encodeURIComponent(`Terima kasih ${customerNama}!\n\nTransaksi: ${invoiceId}\nTotal: ${formatRupiah(Math.round(totalJual))}\nSisa: ${formatRupiah(Math.round(sisa))}`);
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
                <Printer className="size-12 text-muted-foreground/20 mb-3" />
                <p className="text-xs text-muted-foreground/40">Isi data pelanggan dan detail cetakan</p>
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
