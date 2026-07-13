"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Printer, Ruler, BookOpen, Plus, Minus, ArrowLeft, Search,
  CheckCircle2, CreditCard, User, Phone, DollarSign, FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import InvoicePercetakanView, {
  OrderInvoiceData, InvoiceItem,
} from "../../components/InvoicePercetakanView";
import { useBusinessStore } from "@/store/useBusinessStore";

/* ─── Types ─── */
type ModeCetak = "meteran" | "buku";

interface BahanMeteran {
  id: string; label: string; hargaModal: number; hargaJual: number;
}

interface KalkulasiMeteran {
  luasTotal: number; wasteMargin: number; totalHPP: number; totalJual: number; labaKotor: number;
}

interface KalkulasiBuku {
  hppIsi: number; hppCover: number; hppJilid: number;
  totalHPPSatuan: number; totalHPPGlobal: number;
  totalJualSatuan: number; totalJualGlobal: number;
  labaKotorSatuan: number; labaKotorGlobal: number;
}

/* ─── Static ─── */
const BAHAN_METERAN: BahanMeteran[] = [
  { id: "banner-flexi-280", label: "Banner Flexi 280g", hargaModal: 25000, hargaJual: 45000 },
  { id: "korchin", label: "Korchin", hargaModal: 18000, hargaJual: 35000 },
  { id: "albatros", label: "Albatros", hargaModal: 22000, hargaJual: 40000 },
  { id: "stiker-ritrama", label: "Stiker Ritrama", hargaModal: 30000, hargaJual: 55000 },
];

const KERTAS_ISI = [
  { id: "hvs-70", label: "HVS 70gr", hargaModal: 120 },
  { id: "hvs-80", label: "HVS 80gr", hargaModal: 150 },
  { id: "ap-150", label: "Art Paper 150g", hargaModal: 350 },
];

const COVER_LIST = [
  { id: "ac-260", label: "Art Carton 260gr", hargaModal: 2000 },
  { id: "ac-310", label: "Art Carton 310gr", hargaModal: 3000 },
  { id: "hardcover", label: "Hardcover", hargaModal: 8000 },
];

const JILID_LIST = [
  { id: "staples", label: "Staples", biaya: 1000 },
  { id: "spiral", label: "Spiral (Ring)", biaya: 5000 },
  { id: "lem-panas", label: "Lem Panas (Perfect Binding)", biaya: 4000 },
];

const CUSTOMER_DUMMY = [
  { nama: "Toko Buku Alea", wa: "0852777111222" },
  { nama: "CV Karya Mandiri", wa: "0852777333444" },
  { nama: "UD Sinar Abadi", wa: "0852777555666" },
  { nama: "Yayasan Al-Falah", wa: "0852777777888" },
  { nama: "Walk-in Customer", wa: "" },
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

function hitungBuku(halaman: number, modalKertas: number, modalCover: number, biayaLaminasi: number, biayaJilid: number, qty: number, hargaJualHal: number): KalkulasiBuku {
  const hppIsi = halaman * modalKertas;
  const hppCover = modalCover + biayaLaminasi;
  const hppJilid = biayaJilid;
  const totalHPPSatuan = hppIsi + hppCover + hppJilid;
  const totalHPPGlobal = totalHPPSatuan * qty;
  const totalJualSatuan = (hargaJualHal * halaman) + modalCover + biayaLaminasi + biayaJilid;
  const totalJualGlobal = totalJualSatuan * qty;
  return {
    hppIsi, hppCover, hppJilid, totalHPPSatuan, totalHPPGlobal,
    totalJualSatuan, totalJualGlobal,
    labaKotorSatuan: totalJualSatuan - totalHPPSatuan,
    labaKotorGlobal: totalJualGlobal - totalHPPGlobal,
  };
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

  /* Buku */
  const [bHalaman, setBHalaman] = useState(50);
  const [bKertasIsi, setBKertasIsi] = useState(KERTAS_ISI[0].id);
  const [bCetakIsi, setBCetakIsi] = useState<"warna" | "hitam-putih">("hitam-putih");
  const [bKertasCover, setBKertasCover] = useState(COVER_LIST[0].id);
  const [bLaminasi, setBLaminasi] = useState<"none" | "glossy" | "doff">("none");
  const [bJilid, setBJilid] = useState(JILID_LIST[0].id);
  const [bQty, setBQty] = useState(1);
  const [bHargaJualHal, setBHargaJualHal] = useState(500);

  /* Customer */
  const [cariCustomer, setCariCustomer] = useState("");
  const [customerNama, setCustomerNama] = useState("");
  const [customerWA, setCustomerWA] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  /* DP */
  const [dp, setDP] = useState("");

  /* Generated invoice ID */
  const [invoiceId, setInvoiceId] = useState("");
  const [showInvoice, setShowInvoice] = useState(false);
  const { wallets, tambahSaldoWallet, kurangiSaldoWallet } = useBusinessStore();
  const [walletPenerimaanId, setWalletPenerimaanId] = useState(wallets[0]?.id || "wallet-kas");
  const [walletModalId, setWalletModalId] = useState(wallets[1]?.id || "wallet-bsi");

  /* Sync harga bahan */
  useEffect(() => {
    const b = BAHAN_METERAN.find((x) => x.id === mBahan);
    if (b) { setMHargaJual(b.hargaJual); setMHargaModal(b.hargaModal); }
  }, [mBahan]);

  useEffect(() => {
    const k = KERTAS_ISI.find((x) => x.id === bKertasIsi);
    if (k) setBHargaJualHal(k.hargaModal * 4 || 500);
  }, [bKertasIsi]);

  useEffect(() => { setMounted(true); }, []);

  /* Kalkulasi */
  const bahanTerpilih = useMemo(() => BAHAN_METERAN.find((b) => b.id === mBahan) || BAHAN_METERAN[0], [mBahan]);

  const hasilMeteran = useMemo<KalkulasiMeteran>(
    () => hitungMeteran(bahanTerpilih, mPanjang, mLebar, mQty, mHargaJual, mHargaModal),
    [bahanTerpilih, mPanjang, mLebar, mQty, mHargaJual, mHargaModal]
  );

  const kertasTerpilih = useMemo(() => KERTAS_ISI.find((k) => k.id === bKertasIsi) || KERTAS_ISI[0], [bKertasIsi]);
  const coverTerpilih = useMemo(() => COVER_LIST.find((c) => c.id === bKertasCover) || COVER_LIST[0], [bKertasCover]);
  const jilidTerpilih = useMemo(() => JILID_LIST.find((j) => j.id === bJilid) || JILID_LIST[0], [bJilid]);
  const biayaLaminasi = useMemo(() => bLaminasi === "glossy" ? 1500 : bLaminasi === "doff" ? 2000 : 0, [bLaminasi]);
  const hargaModalKertas = useMemo(() => kertasTerpilih.hargaModal * (bCetakIsi === "warna" ? 2.5 : 1), [kertasTerpilih, bCetakIsi]);

  const hasilBuku = useMemo<KalkulasiBuku>(
    () => hitungBuku(bHalaman, hargaModalKertas, coverTerpilih.hargaModal, biayaLaminasi, jilidTerpilih.biaya, bQty, bHargaJualHal),
    [bHalaman, hargaModalKertas, coverTerpilih.hargaModal, biayaLaminasi, jilidTerpilih.biaya, bQty, bHargaJualHal]
  );

  const totalJual = mode === "meteran" ? hasilMeteran.totalJual : hasilBuku.totalJualGlobal;
  const dpNumber = parseInt(dp.replace(/\D/g, ""), 10) || 0;
  const sisa = Math.max(totalJual - dpNumber, 0);

  /* Customer filter */
  const filteredCustomers = useMemo(() => {
    if (!cariCustomer) return CUSTOMER_DUMMY;
    const q = cariCustomer.toLowerCase();
    return CUSTOMER_DUMMY.filter((c) => c.nama.toLowerCase().includes(q));
  }, [cariCustomer]);

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

    let deskripsi = "";
    let spesifikasi = "";
    let ukuran = "";
    let ukuranJadi = "";
    let kertasIsi = "";
    let cover = "";
    let laminasi = "";
    const wrapping = "Ya";
    let jilid = "";

    if (mode === "meteran") {
      deskripsi = `${bahanTerpilih.label} (${mPanjang}m x ${mLebar}m) x ${mQty} Pcs`;
      spesifikasi = `Bahan: ${bahanTerpilih.label} | ${mPanjang}m x ${mLebar}m x ${mQty} lembar`;
      ukuran = `${mPanjang} x ${mLebar} m`;
      ukuranJadi = `${mPanjang * 100} x ${mLebar * 100} cm`;
      kertasIsi = bahanTerpilih.label;
      cover = "-";
      laminasi = "-";
      jilid = "-";
    } else {
      const kertasLabel = kertasTerpilih.label;
      const coverLabel = coverTerpilih.label;
      const jilidLabel = jilidTerpilih.label;
      deskripsi = `Cetak Buku ${bHalaman} hlm - ${kertasLabel} - ${jilidLabel} x ${bQty} Eks`;
      spesifikasi = `Hal: ${bHalaman} | Kertas: ${kertasLabel} | Cetak: ${bCetakIsi === "warna" ? "Warna" : "Hitam Putih"}`;
      ukuran = "A5";
      ukuranJadi = "21 x 29.7 cm";
      kertasIsi = kertasLabel;
      cover = coverLabel;
      laminasi = bLaminasi === "none" ? "Tidak" : bLaminasi === "glossy" ? "Glossy" : "Doff";
      jilid = jilidLabel;
    }

    const items: InvoiceItem[] = [
      {
        no: 1,
        item: deskripsi,
        qty: mode === "meteran" ? mQty : bQty,
        harga: Math.round(totalJual / (mode === "meteran" ? mQty : bQty)),
        jumlah: Math.round(totalJual),
      },
    ];

    /* ─── Tampilkan invoice ─── */
    setShowInvoice(true);
    toast.success(`Transaksi ${id} berhasil disimpan`);

    /* Update wallet: kurangi modal dari wallet modal, tambah pembayaran ke wallet penerimaan */
    const hpp = mode === "meteran" ? Math.round(hasilMeteran.totalHPP) : Math.round(hasilBuku.totalHPPGlobal);
    if (hpp > 0) kurangiSaldoWallet(walletModalId, hpp);
    if (dpNumber > 0) tambahSaldoWallet(walletPenerimaanId, dpNumber);

    /* scroll to invoice */
    setTimeout(() => {
      const el = document.getElementById("invoice-print-area");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
  }, [customerNama, totalJual, invoiceId, mode, bahanTerpilih, mPanjang, mLebar, mQty,
      bHalaman, kertasTerpilih, bCetakIsi, coverTerpilih, bLaminasi, jilidTerpilih, bQty, dpNumber]);

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

    if (mode === "meteran") {
      deskripsi = `${bahanTerpilih.label} (${mPanjang}m x ${mLebar}m) x ${mQty} Pcs`;
      spesifikasi = `Bahan: ${bahanTerpilih.label} | ${mPanjang}m x ${mLebar}m x ${mQty} lembar`;
      ukuran = `${mPanjang} x ${mLebar} m`;
      ukuranJadi = `${mPanjang * 100} x ${mLebar * 100} cm`;
      kertasIsi = bahanTerpilih.label;
      cover = "-";
      laminasi = "-";
      jilid = "-";
    } else {
      kertasIsi = kertasTerpilih.label;
      cover = coverTerpilih.label;
      laminasi = bLaminasi === "none" ? "Tidak" : bLaminasi === "glossy" ? "Glossy" : "Doff";
      jilid = jilidTerpilih.label;
      deskripsi = `Cetak Buku ${bHalaman} hlm - ${kertasIsi} - ${jilid} x ${bQty} Eks`;
      spesifikasi = `Hal: ${bHalaman} | Kertas: ${kertasIsi} | Cetak: ${bCetakIsi === "warna" ? "Warna" : "Hitam Putih"}`;
      ukuran = "A5";
      ukuranJadi = "21 x 29.7 cm";
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
      items: [
        { no: 1, item: deskripsi, qty: mode === "meteran" ? mQty : bQty, harga: Math.round(totalJual / (mode === "meteran" ? mQty : bQty)), jumlah: Math.round(totalJual) },
      ],
      total: Math.round(totalJual),
      dp: dpNumber,
      sisa: Math.round(sisa),
      pembayaran: "Transfer Bank / Tunai",
      rekeningBank: "Bank Aceh Syariah",
      rekeningNomor: "010-01-123456-7",
      rekeningAtasNama: "Mughis Group",
    };
  }, [mode, bahanTerpilih, mPanjang, mLebar, mQty, bHalaman, kertasTerpilih,
      bCetakIsi, coverTerpilih, bLaminasi, jilidTerpilih, bQty, invoiceId, customerNama,
      customerWA, totalJual, dpNumber, sisa]);

  if (!mounted) return <div className="min-h-[60vh]" />;

  /* ─── RENDER (50:50 Split-Screen) ─── */
  return (
    <div className="pb-24 animate-fade-in">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-4">
        {/* ═══ SISI KIRI: FORM INPUT ═══ */}
        <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-10rem)] pr-1">
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
                  onClick={() => setMode(opt.value)}
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
              <div className="grid grid-cols-4 gap-2">
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
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
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

          {/* ─── FORM BUKU ─── */}
          {mode === "buku" && (
            <div className="floating-card p-5 space-y-4">
              <p className="text-xs font-semibold flex items-center gap-1.5">
                <BookOpen className="size-3.5 text-indigo-500" /> Kalkulator Cetak Buku
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-muted-foreground/50">Jumlah Halaman</label>
                  <input type="number" min={1} value={bHalaman} onChange={(e) => setBHalaman(parseInt(e.target.value) || 1)} className="input-premium w-full text-[10px]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-muted-foreground/50">Qty (Eks)</label>
                  <input type="number" min={1} value={bQty} onChange={(e) => setBQty(parseInt(e.target.value) || 1)} className="input-premium w-full text-[10px]" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-muted-foreground/50">Jenis Kertas Isi</label>
                <select value={bKertasIsi} onChange={(e) => setBKertasIsi(e.target.value)} className="input-premium w-full text-[10px]">
                  {KERTAS_ISI.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-muted-foreground/50">Tipe Cetak Isi</label>
                <div className="flex gap-2">
                  {(["hitam-putih", "warna"] as const).map((t) => (
                    <button key={t} onClick={() => setBCetakIsi(t)}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                        bCetakIsi === t
                          ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20"
                          : "bg-muted/30 text-muted-foreground/50 hover:bg-muted/50"
                      }`}
                    >{t === "hitam-putih" ? "Hitam Putih" : "Warna"}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-muted-foreground/50">Kertas Cover</label>
                  <select value={bKertasCover} onChange={(e) => setBKertasCover(e.target.value)} className="input-premium w-full text-[10px]">
                    {COVER_LIST.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-muted-foreground/50">Laminasi Cover</label>
                  <select value={bLaminasi} onChange={(e) => setBLaminasi(e.target.value as any)} className="input-premium w-full text-[10px]">
                    <option value="none">Tanpa Laminasi</option>
                    <option value="glossy">Glossy (+Rp1.500)</option>
                    <option value="doff">Doff (+Rp2.000)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-muted-foreground/50">Jenis Jilid</label>
                  <select value={bJilid} onChange={(e) => setBJilid(e.target.value)} className="input-premium w-full text-[10px]">
                    {JILID_LIST.map((j) => <option key={j.id} value={j.id}>{j.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-muted-foreground/50">Harga Jual/Halaman</label>
                  <input type="number" value={bHargaJualHal} onChange={(e) => setBHargaJualHal(parseInt(e.target.value) || 0)} className="input-premium w-full text-[10px] tabular-nums" />
                </div>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/20 p-4 space-y-1.5">
                <p className="text-[10px] font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider">Hasil Kalkulasi</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                  <div className="flex justify-between"><span className="text-muted-foreground/60">HPP Isi</span><span className="font-semibold tabular-nums">{formatRupiah(Math.round(hasilBuku.hppIsi))}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground/60">HPP Cover</span><span className="font-semibold tabular-nums">{formatRupiah(Math.round(hasilBuku.hppCover))}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground/60">HPP Jilid</span><span className="font-semibold tabular-nums">{formatRupiah(Math.round(hasilBuku.hppJilid))}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground/60">HPP/Satuan</span><span className="font-semibold tabular-nums text-rose-500">{formatRupiah(Math.round(hasilBuku.totalHPPSatuan))}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground/60">Jual/Satuan</span><span className="font-semibold tabular-nums text-emerald-600">{formatRupiah(Math.round(hasilBuku.totalJualSatuan))}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground/60">Total HPP Global</span><span className="font-semibold tabular-nums text-rose-500">{formatRupiah(Math.round(hasilBuku.totalHPPGlobal))}</span></div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-1.5 border-t border-violet-500/20">
                  <div className="flex justify-between"><span className="text-[10px] font-semibold">Total Jual Global</span><span className="text-xs font-bold font-heading tabular-nums text-emerald-600">{formatRupiah(Math.round(hasilBuku.totalJualGlobal))}</span></div>
                  <div className="flex justify-between"><span className="text-[10px] font-semibold">Laba Kotor</span><span className={`text-xs font-bold font-heading tabular-nums ${hasilBuku.labaKotorGlobal >= 0 ? "text-emerald-600" : "text-rose-500"}`}>{hasilBuku.labaKotorGlobal >= 0 ? "+" : ""}{formatRupiah(Math.round(hasilBuku.labaKotorGlobal))}</span></div>
                </div>
              </div>
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
          <div className="grid grid-cols-2 gap-2 pt-1">
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
          <div className="grid grid-cols-3 gap-3 pt-1">
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

          {/* ─── SIMPAN ─── */}
          <button onClick={handleSimpan}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="size-4" /> {showInvoice ? "Update & Cetak Ulang" : "Simpan Transaksi & Cetak Nota"}
          </button>
        </div>

        {/* ═══ SISI KANAN: LIVE PREVIEW INVOICE ═══ */}
        <div className="overflow-y-auto max-h-[calc(100vh-10rem)] pr-1">
          <div className="sticky top-0">
            {customerNama && totalJual > 0 ? (
              <InvoicePercetakanView data={invoiceData} preview={!showInvoice} noRef="MUGHIS BANK v3 — POS Kasir Percetakan" />
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
    </div>
  );
}
