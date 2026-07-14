"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  Printer, Ruler, BookOpen, Package, CheckCircle2, Clock,
  AlertTriangle, ArrowRight, FileText, BarChart3, Trash2,
  QrCode, Plus,
  Search, Image, FileSpreadsheet, MessageSquare,
} from "lucide-react";
import toast from "react-hot-toast";

/* ─── Types ─── */
type ModeCetak = "meteran" | "buku";
type StatusAntrean = "antrean-desain" | "proses-cetak" | "finishing" | "selesai";

interface BahanMeteran {
  id: string;
  label: string;
  hargaModal: number;
  hargaJual: number;
}

interface KertasIsi {
  id: string;
  label: string;
  hargaModal: number;
}

interface CoverOption {
  id: string;
  label: string;
  hargaModal: number;
}

interface JilidOption {
  id: string;
  label: string;
  biaya: number;
}

interface OrderMeteran {
  bahan: string;
  panjang: number;
  lebar: number;
  qty: number;
  hargaJualPerMeter: number;
  hargaModalPerMeter: number;
  hasil: KalkulasiMeteran;
}

interface KalkulasiMeteran {
  luasTotal: number;
  wasteMargin: number;
  totalHPP: number;
  totalJual: number;
  labaKotor: number;
}

interface OrderBuku {
  jumlahHalaman: number;
  kertasIsi: string;
  cetakIsi: "warna" | "hitam-putih";
  kertasCover: string;
  laminasiCover: "glossy" | "doff" | "none";
  jenisJilid: string;
  qty: number;
  hargaJualPerHalaman: number;
  hargaModalKertasPerLembar: number;
  hargaModalCover: number;
  biayaLaminasi: number;
  biayaJilid: number;
  hasil: KalkulasiBuku;
}

interface KalkulasiBuku {
  hppIsi: number;
  hppCover: number;
  hppJilid: number;
  totalHPPSatuan: number;
  totalHPPGlobal: number;
  totalJualSatuan: number;
  totalJualGlobal: number;
  labaKotorSatuan: number;
  labaKotorGlobal: number;
}

interface ProductionItem {
  id: string;
  tanggal: string;
  customer: string;
  deskripsi: string;
  tipe: ModeCetak;
  spesifikasi: string;
  totalHPP: number;
  totalJual: number;
  status: StatusAntrean;
  wasteAkumulasi: number;
  createdAt: string;
}

/* ─── Static Data ─── */
const BAHAN_METERAN: BahanMeteran[] = [
  { id: "banner-flexi-280", label: "Banner Flexi 280g", hargaModal: 25000, hargaJual: 45000 },
  { id: "korchin", label: "Korchin", hargaModal: 18000, hargaJual: 35000 },
  { id: "albatros", label: "Albatros", hargaModal: 22000, hargaJual: 40000 },
  { id: "stiker-ritrama", label: "Stiker Ritrama", hargaModal: 30000, hargaJual: 55000 },
];

const KERTAS_ISI_LIST: KertasIsi[] = [
  { id: "hvs-80", label: "HVS 80g", hargaModal: 150 },
  { id: "ap-150", label: "Art Paper 150g", hargaModal: 350 },
];

const COVER_LIST: CoverOption[] = [
  { id: "ac-260", label: "Art Carton 260g", hargaModal: 2000 },
  { id: "ac-310", label: "Art Carton 310g", hargaModal: 3000 },
  { id: "hardcover", label: "Hardcover", hargaModal: 8000 },
];

const JILID_LIST: JilidOption[] = [
  { id: "staples", label: "Staples", biaya: 1000 },
  { id: "spiral", label: "Spiral", biaya: 5000 },
  { id: "lem-panas", label: "Lem Panas (Perfect Binding)", biaya: 4000 },
];

const STATUS_OPTIONS: { value: StatusAntrean; label: string; color: string }[] = [
  { value: "antrean-desain", label: "Antrean Desain", color: "text-amber-500 bg-amber-500/10" },
  { value: "proses-cetak", label: "Proses Cetak", color: "text-blue-500 bg-blue-500/10" },
  { value: "finishing", label: "Finishing", color: "text-violet-500 bg-violet-500/10" },
  { value: "selesai", label: "Selesai", color: "text-emerald-500 bg-emerald-500/10" },
];

const STATUS_TRANSITIONS: Record<StatusAntrean, StatusAntrean> = {
  "antrean-desain": "proses-cetak",
  "proses-cetak": "finishing",
  "finishing": "selesai",
  "selesai": "selesai",
};

const FORMAT_RUPIAH = (n: number) => `IDR ${n.toLocaleString("id-ID")}`;

function generateId() {
  return `PRT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/* ─── Kalkulator Helpers ─── */
function hitungMeteran(params: Omit<OrderMeteran, "hasil">): KalkulasiMeteran {
  const luasTotal = params.panjang * params.lebar * params.qty;
  const wasteMargin = luasTotal * 0.05;
  const totalHPP = (luasTotal + wasteMargin) * params.hargaModalPerMeter;
  const totalJual = luasTotal * params.hargaJualPerMeter;
  return { luasTotal, wasteMargin, totalHPP, totalJual, labaKotor: totalJual - totalHPP };
}

function hitungBuku(params: Omit<OrderBuku, "hasil">): KalkulasiBuku {
  const hppIsi = params.jumlahHalaman * params.hargaModalKertasPerLembar;
  const hppCover = params.hargaModalCover + params.biayaLaminasi;
  const hppJilid = params.biayaJilid;
  const totalHPPSatuan = hppIsi + hppCover + hppJilid;
  const totalHPPGlobal = totalHPPSatuan * params.qty;
  const totalJualSatuan = (params.hargaJualPerHalaman * params.jumlahHalaman) + params.hargaModalCover + params.biayaLaminasi + params.biayaJilid;
  const totalJualGlobal = totalJualSatuan * params.qty;
  return {
    hppIsi, hppCover, hppJilid, totalHPPSatuan, totalHPPGlobal,
    totalJualSatuan, totalJualGlobal,
    labaKotorSatuan: totalJualSatuan - totalHPPSatuan,
    labaKotorGlobal: totalJualGlobal - totalHPPGlobal,
  };
}

/* ─── COMPONENT ─── */
export default function PercetakanForm() {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<ModeCetak>("meteran");
  const [activeTab, setActiveTab] = useState<"kalkulator" | "antrean" | "nota" | "laporan">("kalkulator");
  const [antrean, setAntrean] = useState<ProductionItem[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [searchCustomer, setSearchCustomer] = useState("");

  /* Meteran form */
  const [mBahan, setMBahan] = useState(BAHAN_METERAN[0].id);
  const [mPanjang, setMPanjang] = useState(2);
  const [mLebar, setMLebar] = useState(1);
  const [mQty, setMQty] = useState(1);
  const [mHargaJual, setMHargaJual] = useState(BAHAN_METERAN[0].hargaJual);
  const [mHargaModal, setMHargaModal] = useState(BAHAN_METERAN[0].hargaModal);

  /* Buku form */
  const [bHalaman, setBHalaman] = useState(50);
  const [bKertasIsi, setBKertasIsi] = useState(KERTAS_ISI_LIST[0].id);
  const [bCetakIsi, setBCetakIsi] = useState<"warna" | "hitam-putih">("hitam-putih");
  const [bKertasCover, setBKertasCover] = useState(COVER_LIST[0].id);
  const [bLaminasi, setBLaminasi] = useState<"glossy" | "doff" | "none">("none");
  const [bJilid, setBJilid] = useState(JILID_LIST[0].id);
  const [bQty, setBQty] = useState(1);
  const [bHargaJual, setBHargaJual] = useState(500);
  const [bHargaModalKertas, setBHargaModalKertas] = useState(KERTAS_ISI_LIST[0].hargaModal);
  const [bHargaModalCover, setBHargaModalCover] = useState(COVER_LIST[0].hargaModal);
  const [bBiayaLaminasi, setBBiayaLaminasi] = useState(0);
  const [bBiayaJilid, setBBiayaJilid] = useState(JILID_LIST[0].biaya);

  /* Nota invoice extra */
  const [noInvoice, setNoInvoice] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("tunai");

  const notaRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  /* sync bahan dropdown */
  useEffect(() => {
    const bahan = BAHAN_METERAN.find((b) => b.id === mBahan);
    if (bahan) {
      setMHargaJual(bahan.hargaJual);
      setMHargaModal(bahan.hargaModal);
    }
  }, [mBahan]);

  useEffect(() => {
    const k = KERTAS_ISI_LIST.find((x) => x.id === bKertasIsi);
    if (k) setBHargaModalKertas(k.hargaModal);
  }, [bKertasIsi]);

  useEffect(() => {
    const c = COVER_LIST.find((x) => x.id === bKertasCover);
    if (c) setBHargaModalCover(c.hargaModal);
  }, [bKertasCover]);

  useEffect(() => {
    const j = JILID_LIST.find((x) => x.id === bJilid);
    if (j) setBBiayaJilid(j.biaya);
  }, [bJilid]);

  useEffect(() => {
    setBBiayaLaminasi(bLaminasi === "none" ? 0 : bLaminasi === "glossy" ? 1500 : 2000);
  }, [bLaminasi]);

  /* kalkulasi real-time */
  const hasilMeteran = useMemo<KalkulasiMeteran>(() => {
    return hitungMeteran({
      bahan: mBahan, panjang: mPanjang, lebar: mLebar, qty: mQty,
      hargaJualPerMeter: mHargaJual, hargaModalPerMeter: mHargaModal,
    });
  }, [mBahan, mPanjang, mLebar, mQty, mHargaJual, mHargaModal]);

  const hasilBuku = useMemo<KalkulasiBuku>(() => {
    return hitungBuku({
      jumlahHalaman: bHalaman, kertasIsi: bKertasIsi, cetakIsi: bCetakIsi,
      kertasCover: bKertasCover, laminasiCover: bLaminasi, jenisJilid: bJilid,
      qty: bQty, hargaJualPerHalaman: bHargaJual,
      hargaModalKertasPerLembar: bHargaModalKertas,
      hargaModalCover: bHargaModalCover, biayaLaminasi: bBiayaLaminasi, biayaJilid: bBiayaJilid,
    });
  }, [bHalaman, bKertasIsi, bCetakIsi, bKertasCover, bLaminasi, bJilid, bQty,
      bHargaJual, bHargaModalKertas, bHargaModalCover, bBiayaLaminasi, bBiayaJilid]);

  /* simpan ke antrean */
  const simpanKeAntrean = useCallback(() => {
    const no = noInvoice || generateId();
    setNoInvoice(no);
    const customer = customerName || "Walk-in Customer";

    let desc = "";
    let spec = "";
    let totalHPP = 0;
    let totalJual = 0;
    let waste = 0;

    if (mode === "meteran") {
      const bahanLabel = BAHAN_METERAN.find((b) => b.id === mBahan)?.label || mBahan;
      desc = `${bahanLabel} (${mPanjang}m x ${mLebar}m) x ${mQty} Pcs`;
      spec = `Bahan: ${bahanLabel} | ${mPanjang}m x ${mLebar}m x ${mQty} lbr | Jual/m: ${FORMAT_RUPIAH(mHargaJual)} | Modal/m: ${FORMAT_RUPIAH(mHargaModal)}`;
      totalHPP = hasilMeteran.totalHPP;
      totalJual = hasilMeteran.totalJual;
      waste = hasilMeteran.wasteMargin;
    } else {
      const kertasLabel = KERTAS_ISI_LIST.find((k) => k.id === bKertasIsi)?.label || bKertasIsi;
      const coverLabel = COVER_LIST.find((c) => c.id === bKertasCover)?.label || bKertasCover;
      const jilidLabel = JILID_LIST.find((j) => j.id === bJilid)?.label || bJilid;
      desc = `Cetak Buku ${bHalaman} hlm - ${kertasLabel} - ${jilidLabel} x ${bQty} Eks`;
      spec = `Hal: ${bHalaman} | Kertas: ${kertasLabel} | Cetak: ${bCetakIsi === "warna" ? "Warna" : "BW"} | Cover: ${coverLabel}${bLaminasi !== "none" ? ` + Laminasi ${bLaminasi}` : ""} | Jilid: ${jilidLabel}`;
      totalHPP = hasilBuku.totalHPPGlobal;
      totalJual = hasilBuku.totalJualGlobal;
      waste = 0;
    }

    const item: ProductionItem = {
      id: no,
      tanggal: todayISO(),
      customer,
      deskripsi: desc,
      tipe: mode,
      spesifikasi: spec,
      totalHPP,
      totalJual,
      status: "antrean-desain",
      wasteAkumulasi: waste,
      createdAt: new Date().toISOString(),
    };

    setAntrean((prev) => [item, ...prev]);
    setSelectedOrderId(no);
    toast.success(`Order ${no} masuk antrean produksi`);
  }, [mode, mBahan, mPanjang, mLebar, mQty, mHargaJual, mHargaModal, hasilMeteran,
      bHalaman, bKertasIsi, bCetakIsi, bKertasCover, bLaminasi, bJilid, bQty, bHargaJual,
      bHargaModalKertas, bHargaModalCover, bBiayaLaminasi, bBiayaJilid, hasilBuku,
      noInvoice, customerName, customerPhone, paymentMethod]);

  /* update status antrean */
  const updateStatus = useCallback((id: string) => {
    setAntrean((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const next = STATUS_TRANSITIONS[item.status];
        if (next === item.status) {
          toast.success(`Order ${id} sudah selesai`);
          return item;
        }
        const label = STATUS_OPTIONS.find((s) => s.value === next)?.label || next;
        toast.success(`Order ${id} → ${label}`);
        return { ...item, status: next };
      })
    );
  }, []);

  /* hapus antrean */
  const hapusAntrean = useCallback((id: string) => {
    setAntrean((prev) => prev.filter((i) => i.id !== id));
    if (selectedOrderId === id) setSelectedOrderId(null);
    toast.success(`Order ${id} dihapus`);
  }, [selectedOrderId]);

  /* aggregated reports */
  const laporan = useMemo(() => {
    const selesai = antrean.filter((i) => i.status === "selesai");
    const totalPenjualan = selesai.reduce((s, i) => s + i.totalJual, 0);
    const totalHPPGlobal = selesai.reduce((s, i) => s + i.totalHPP, 0);
    const labaKotor = totalPenjualan - totalHPPGlobal;
    const totalWaste = antrean.reduce((s, i) => s + i.wasteAkumulasi, 0);
    const hariIni = todayISO();
    const logHariIni = selesai.filter((i) => i.tanggal === hariIni);
    return { totalPenjualan, totalHPPGlobal, labaKotor, totalWaste, logHariIni };
  }, [antrean]);

  /* selected order for nota */
  const selectedOrder = useMemo(
    () => antrean.find((i) => i.id === selectedOrderId) || null,
    [antrean, selectedOrderId]
  );

  /* filtered antrean */
  const filteredAntrean = useMemo(() => {
    if (!searchCustomer) return antrean;
    const q = searchCustomer.toLowerCase();
    return antrean.filter(
      (i) => i.customer.toLowerCase().includes(q) || i.id.toLowerCase().includes(q)
    );
  }, [antrean, searchCustomer]);

  /* ─── Export ─── */
  const exportPNG = useCallback(async () => {
    const el = document.getElementById("percetakan-form-area");
    if (!el) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const link = document.createElement("a");
      link.download = `Percetakan-${todayISO()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("PNG siap diunduh");
    } catch { toast.error("Gagal export PNG"); }
  }, []);

  const exportPDF = useCallback(() => {
    window.print();
  }, []);

  const exportXLSX = useCallback(() => {
    const header = "No Invoice,Customer,Tipe,Deskripsi,HPP,Penjualan,Status,Tanggal\n";
    const rows = antrean.map((i) =>
      `"${i.id}","${i.customer}","${i.tipe}","${i.deskripsi}",${i.totalHPP},${i.totalJual},"${i.status}","${i.tanggal}"`
    ).join("\n");
    const blob = new Blob(["\uFEFF" + header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Laporan-Percetakan-${todayISO()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("📊 File CSV laporan di-download");
  }, [antrean]);

  const exportWhatsApp = useCallback(() => {
    if (!selectedOrder) {
      toast.error("Pilih order terlebih dahulu");
      return;
    }
    const msg = `*NOTA PERCETAKAN MUGHIS BANK*
No: ${selectedOrder.id}
Tgl: ${selectedOrder.tanggal}
Customer: ${selectedOrder.customer}
Deskripsi: ${selectedOrder.deskripsi}
Total: ${FORMAT_RUPIAH(selectedOrder.totalJual)}
Status: ${STATUS_OPTIONS.find((s) => s.value === selectedOrder.status)?.label || selectedOrder.status}
${customerPhone ? `\nKonfirmasi via: wa.me/${customerPhone}` : ""}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  }, [selectedOrder, customerPhone]);

  /* ─── Render ─── */
  if (!mounted) return <div className="min-h-[60vh]" />;

  return (
    <div id="percetakan-form-area" className="space-y-5">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Printer className="size-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold font-heading">Modul Percetakan</h2>
            <p className="text-[10px] text-muted-foreground/60">Digital Printing &amp; Large Format</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          <button onClick={exportPNG} className="size-8 rounded-lg bg-muted/30 flex items-center justify-center hover:bg-muted/50 transition-colors" title="Export PNG">
            <Image className="size-3.5 text-muted-foreground/60" />
          </button>
          <button onClick={exportPDF} className="size-8 rounded-lg bg-muted/30 flex items-center justify-center hover:bg-muted/50 transition-colors" title="Cetak PDF">
            <FileText className="size-3.5 text-muted-foreground/60" />
          </button>
          <button onClick={exportXLSX} className="size-8 rounded-lg bg-muted/30 flex items-center justify-center hover:bg-muted/50 transition-colors" title="Export Excel">
            <FileSpreadsheet className="size-3.5 text-muted-foreground/60" />
          </button>
        </div>
      </div>

      {/* ─── Tab Navigation ─── */}
      <div className="flex gap-1 rounded-xl bg-muted/30 p-1">
        {([
          { key: "kalkulator", label: "Kalkulator", icon: Ruler },
          { key: "antrean", label: "Antrean", icon: Clock },
          { key: "nota", label: "Nota / Invoice", icon: FileText },
          { key: "laporan", label: "Laporan", icon: BarChart3 },
        ] as const).map((tab) => {
          const Ico = tab.icon;
          const aktif = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-semibold transition-all ${
                aktif
                  ? "bg-card text-cyan-600 dark:text-cyan-400 shadow-sm"
                  : "text-muted-foreground/50 hover:text-muted-foreground/80"
              }`}
            >
              <Ico className="size-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════ */}
      {/* TAB: KALKULATOR */}
      {/* ══════════════════════════════════════════════════ */}
      {activeTab === "kalkulator" && (
        <div className="space-y-5 animate-fade-in">
          {/* Toggle mode */}
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
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
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
                <Ruler className="size-3.5 text-cyan-500" /> Form Order Meteran
              </p>
              {/* Bahan */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Nama Bahan</label>
                <select
                  value={mBahan}
                  onChange={(e) => setMBahan(e.target.value)}
                  className="input-premium w-full text-xs"
                >
                  {BAHAN_METERAN.map((b) => (
                    <option key={b.id} value={b.id}>{b.label}</option>
                  ))}
                </select>
              </div>
              {/* Dimensi */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Panjang (m)</label>
                  <input type="number" min={0.1} step={0.1} value={mPanjang} onChange={(e) => setMPanjang(parseFloat(e.target.value) || 0)} className="input-premium w-full text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Lebar (m)</label>
                  <input type="number" min={0.1} step={0.1} value={mLebar} onChange={(e) => setMLebar(parseFloat(e.target.value) || 0)} className="input-premium w-full text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Qty (lbr)</label>
                  <input type="number" min={1} value={mQty} onChange={(e) => setMQty(parseInt(e.target.value) || 1)} className="input-premium w-full text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Harga/m</label>
                  <input type="number" min={0} value={mHargaJual} onChange={(e) => setMHargaJual(parseInt(e.target.value) || 0)} className="input-premium w-full text-xs tabular-nums" />
                </div>
              </div>
              {/* Harga Modal */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Harga Modal Bahan per Meter</label>
                <input type="number" min={0} value={mHargaModal} onChange={(e) => setMHargaModal(parseInt(e.target.value) || 0)} className="input-premium w-full text-xs tabular-nums" />
              </div>
              {/* Hasil Kalkulasi Meteran */}
              <ResultCardMeteran hasil={hasilMeteran} />
              {/* Customer & Simpan */}
              <OrderMetaForm
                noInvoice={noInvoice} setNoInvoice={setNoInvoice}
                customerName={customerName} setCustomerName={setCustomerName}
                customerPhone={customerPhone} setCustomerPhone={setCustomerPhone}
                paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod}
              />
              <button
                onClick={simpanKeAntrean}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <Plus className="size-4" /> Simpan ke Antrean Produksi
              </button>
            </div>
          )}

          {/* ─── FORM BUKU ─── */}
          {mode === "buku" && (
            <div className="floating-card p-5 space-y-4">
              <p className="text-xs font-semibold flex items-center gap-1.5">
                <BookOpen className="size-3.5 text-cyan-500" /> Form Order Buku / Dokumen
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Jumlah Halaman</label>
                  <input type="number" min={1} value={bHalaman} onChange={(e) => setBHalaman(parseInt(e.target.value) || 1)} className="input-premium w-full text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Qty (Eks)</label>
                  <input type="number" min={1} value={bQty} onChange={(e) => setBQty(parseInt(e.target.value) || 1)} className="input-premium w-full text-xs" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Jenis Kertas Isi</label>
                <select value={bKertasIsi} onChange={(e) => setBKertasIsi(e.target.value)} className="input-premium w-full text-xs">
                  {KERTAS_ISI_LIST.map((k) => (
                    <option key={k.id} value={k.id}>{k.label} (Rp{k.hargaModal}/lbr)</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Tipe Cetak Isi</label>
                <div className="flex gap-2">
                  {(["hitam-putih", "warna"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setBCetakIsi(t)}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-semibold transition-all ${
                        bCetakIsi === t
                          ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/20"
                          : "bg-muted/30 text-muted-foreground/50 hover:bg-muted/50"
                      }`}
                    >
                      {t === "hitam-putih" ? "Hitam Putih" : "Warna"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Kertas Cover</label>
                  <select value={bKertasCover} onChange={(e) => setBKertasCover(e.target.value)} className="input-premium w-full text-xs">
                    {COVER_LIST.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Laminasi Cover</label>
                  <select value={bLaminasi} onChange={(e) => setBLaminasi(e.target.value as any)} className="input-premium w-full text-xs">
                    <option value="none">Tanpa Laminasi</option>
                    <option value="glossy">Glossy (+Rp1.500)</option>
                    <option value="doff">Doff (+Rp2.000)</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Jenis Jilid</label>
                <select value={bJilid} onChange={(e) => setBJilid(e.target.value)} className="input-premium w-full text-xs">
                  {JILID_LIST.map((j) => (
                    <option key={j.id} value={j.id}>{j.label} (Rp{j.biaya})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Harga Jual Jasa per Halaman</label>
                <input type="number" min={0} value={bHargaJual} onChange={(e) => setBHargaJual(parseInt(e.target.value) || 0)} className="input-premium w-full text-xs tabular-nums" />
              </div>
              {/* Hasil Kalkulasi Buku */}
              <ResultCardBuku hasil={hasilBuku} />
              {/* Customer & Simpan */}
              <OrderMetaForm
                noInvoice={noInvoice} setNoInvoice={setNoInvoice}
                customerName={customerName} setCustomerName={setCustomerName}
                customerPhone={customerPhone} setCustomerPhone={setCustomerPhone}
                paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod}
              />
              <button
                onClick={simpanKeAntrean}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <Plus className="size-4" /> Simpan ke Antrean Produksi
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════ */}
      {/* TAB: ANTREAN PRODUKSI */}
      {/* ══════════════════════════════════════════════════ */}
      {activeTab === "antrean" && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/40" />
              <input
                type="text"
                value={searchCustomer}
                onChange={(e) => setSearchCustomer(e.target.value)}
                placeholder="Cari order / customer..."
                className="input-premium w-full text-xs pl-8"
              />
            </div>
            <span className="text-[10px] text-muted-foreground/50 shrink-0">{antrean.length} order</span>
          </div>

          {filteredAntrean.length === 0 ? (
            <div className="floating-card p-6 text-center">
              <Package className="size-8 mx-auto text-muted-foreground/20 mb-2" />
              <p className="text-xs text-muted-foreground/50">Belum ada antrean produksi</p>
              <p className="text-[10px] text-muted-foreground/30 mt-0.5">Simpan order dari tab Kalkulator</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAntrean.map((item) => {
                const st = STATUS_OPTIONS.find((s) => s.value === item.status)!;
                const isSelected = selectedOrderId === item.id;
                return (
                  <div
                    key={item.id}
                    className={`floating-card p-3.5 flex items-center gap-3 transition-all duration-200 hover:shadow-md cursor-pointer ${
                      isSelected ? "ring-1 ring-cyan-500/30" : ""
                    }`}
                    onClick={() => setSelectedOrderId(isSelected ? null : item.id)}
                  >
                    <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${
                      item.tipe === "meteran" ? "bg-cyan-500/10 text-cyan-600" : "bg-violet-500/10 text-violet-600"
                    }`}>
                      {item.tipe === "meteran" ? <Ruler className="size-4" /> : <BookOpen className="size-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold truncate">{item.id}</p>
                        <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-semibold ${st.color}`}>
                          {st.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground/60 truncate">{item.customer} — {item.deskripsi}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] text-muted-foreground/40">{item.tanggal}</span>
                        <span className="text-[9px] font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{FORMAT_RUPIAH(item.totalJual)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      {item.status !== "selesai" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); updateStatus(item.id); }}
                          className="size-7 rounded-lg bg-muted/30 flex items-center justify-center hover:bg-cyan-500/10 hover:text-cyan-600 transition-all"
                          title="Naikkan status"
                        >
                          <ArrowRight className="size-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); hapusAntrean(item.id); }}
                        className="size-7 rounded-lg bg-muted/30 flex items-center justify-center hover:bg-rose-500/10 hover:text-rose-500 transition-all"
                        title="Hapus"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════ */}
      {/* TAB: NOTA / INVOICE */}
      {/* ══════════════════════════════════════════════════ */}
      {activeTab === "nota" && (
        <div className="space-y-4 animate-fade-in">
          {!selectedOrder ? (
            <div className="floating-card p-6 text-center">
              <FileText className="size-8 mx-auto text-muted-foreground/20 mb-2" />
              <p className="text-xs text-muted-foreground/50">Pilih order dari tab Antrean</p>
              <p className="text-[10px] text-muted-foreground/30 mt-0.5">Klik salah satu order untuk melihat nota</p>
            </div>
          ) : (
            <div ref={notaRef} className="space-y-4">
              {/* ── Nota Thermal 80mm ── */}
              <div className="floating-card p-4 space-y-3 bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 border-2 border-zinc-200 dark:border-zinc-800">
                <div className="text-center border-b border-dashed border-zinc-300 dark:border-zinc-700 pb-3">
                  <p className="text-sm font-bold font-heading tracking-tight">MUGHIS BANK</p>
                  <p className="text-[8px] text-muted-foreground/60">Pusat Digital Printing &amp; Large Format</p>
                  <p className="text-[8px] text-muted-foreground/50">Jl. Raya Teknologi No. 88, Indonesia</p>
                </div>

                <div className="text-[9px] space-y-0.5 font-mono">
                  <div className="flex justify-between"><span className="text-muted-foreground/50">No</span><span className="font-semibold">{selectedOrder.id}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground/50">Tgl</span><span>{selectedOrder.tanggal}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground/50">Customer</span><span>{selectedOrder.customer}</span></div>
                  {paymentMethod && (
                    <div className="flex justify-between"><span className="text-muted-foreground/50">Bayar</span><span>{paymentMethod.toUpperCase()}</span></div>
                  )}
                </div>

                <div className="border-t border-dashed border-zinc-300 dark:border-zinc-700 pt-2">
                  <div className="grid grid-cols-[3fr_1fr_1fr_1fr] gap-1 text-[8px] font-semibold text-muted-foreground/50 uppercase tracking-wider mb-1">
                    <span>Produk</span><span className="text-right">Qty</span><span className="text-right">@</span><span className="text-right">Total</span>
                  </div>
                  <div className="grid grid-cols-[3fr_1fr_1fr_1fr] gap-1 text-[9px] font-mono border-b border-dashed border-zinc-300 dark:border-zinc-700 pb-2">
                    <span className="truncate">{selectedOrder.deskripsi}</span>
                    <span className="text-right">{selectedOrder.tipe === "meteran" ? `${mQty} lbr` : `${bQty} eks`}</span>
                    <span className="text-right tabular-nums">{FORMAT_RUPIAH(Math.round(selectedOrder.totalJual / (selectedOrder.tipe === "meteran" ? mQty : bQty)))}</span>
                    <span className="text-right font-bold tabular-nums">{FORMAT_RUPIAH(selectedOrder.totalJual)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs font-bold font-heading">
                  <span>TOTAL</span>
                  <span className="tabular-nums">{FORMAT_RUPIAH(selectedOrder.totalJual)}</span>
                </div>

                <div className="text-center pt-2 border-t border-dashed border-zinc-300 dark:border-zinc-700">
                  <div className="flex items-center justify-center gap-1 text-[8px] text-emerald-600 dark:text-emerald-400">
                    <QrCode className="size-3" />
                    <span>Scan untuk cek status produksi</span>
                  </div>
                  <p className="text-[7px] text-muted-foreground/40 mt-1">Terima kasih — MUGHIS BANK v3 Enterprise</p>
                </div>
              </div>

              {/* ── Invoice A4 Resmi ── */}
              <div className="floating-card p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-base font-bold font-heading">INVOICE</p>
                    <p className="text-[10px] text-muted-foreground/60">No: {selectedOrder.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold">MUGHIS BANK</p>
                    <p className="text-[8px] text-muted-foreground/50">Digital Printing Division</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[10px]">
                  <div>
                    <p className="text-muted-foreground/50 font-medium">Tanggal</p>
                    <p>{selectedOrder.tanggal}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground/50 font-medium">Customer</p>
                    <p>{selectedOrder.customer}{customerPhone ? ` (${customerPhone})` : ""}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground/50 font-medium">Pembayaran</p>
                    <p className="capitalize">{paymentMethod}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground/50 font-medium">Status</p>
                    <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-semibold ${STATUS_OPTIONS.find((s) => s.value === selectedOrder.status)?.color}`}>
                      {STATUS_OPTIONS.find((s) => s.value === selectedOrder.status)?.label}
                    </span>
                  </div>
                </div>

                {/* Tabel Invoice A4 */}
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left py-2 text-muted-foreground/50 font-medium w-8">No</th>
                        <th className="text-left py-2 text-muted-foreground/50 font-medium">Deskripsi Produk</th>
                        <th className="text-left py-2 text-muted-foreground/50 font-medium hidden sm:table-cell">Spesifikasi</th>
                        <th className="text-right py-2 text-muted-foreground/50 font-medium">Qty</th>
                        <th className="text-right py-2 text-muted-foreground/50 font-medium">Harga Satuan</th>
                        <th className="text-right py-2 text-muted-foreground/50 font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border/20">
                        <td className="py-2.5">1</td>
                        <td className="py-2.5 font-medium">{selectedOrder.deskripsi}</td>
                        <td className="py-2.5 text-muted-foreground/60 hidden sm:table-cell text-[9px]">{selectedOrder.spesifikasi}</td>
                        <td className="py-2.5 text-right tabular-nums">{selectedOrder.tipe === "meteran" ? `${mQty}` : `${bQty}`}</td>
                        <td className="py-2.5 text-right tabular-nums">{FORMAT_RUPIAH(Math.round(selectedOrder.totalJual / (selectedOrder.tipe === "meteran" ? mQty : bQty)))}</td>
                        <td className="py-2.5 text-right font-bold tabular-nums">{FORMAT_RUPIAH(selectedOrder.totalJual)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end">
                  <div className="w-full max-w-[14rem] space-y-1 text-[10px]">
                    <div className="flex justify-between"><span className="text-muted-foreground/60">Subtotal</span><span className="tabular-nums">{FORMAT_RUPIAH(selectedOrder.totalJual)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground/60">PPN 0%</span><span className="tabular-nums">IDR 0</span></div>
                    <div className="flex justify-between text-xs font-bold font-heading border-t border-border/40 pt-1">
                      <span>Grand Total</span>
                      <span className="tabular-nums">{FORMAT_RUPIAH(selectedOrder.totalJual)}</span>
                    </div>
                  </div>
                </div>

                {/* QR Code simulasi */}
                <div className="flex items-center justify-between pt-3 border-t border-border/30">
                  <div className="flex items-center gap-2">
                    <div className="size-10 rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-900 dark:from-zinc-200 dark:to-zinc-300 flex items-center justify-center">
                      <QrCode className="size-5 text-white dark:text-black" />
                    </div>
                    <div>
                      <p className="text-[8px] font-semibold uppercase tracking-wider">QR Status Produksi</p>
                      <p className="text-[7px] text-muted-foreground/50">Scan untuk lacak progress</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={exportWhatsApp} className="px-2.5 py-1.5 rounded-lg bg-emerald-500 text-white text-[9px] font-semibold hover:bg-emerald-600 transition-colors flex items-center gap-1">
                      <MessageSquare className="size-3" /> WA
                    </button>
                    <button onClick={exportPDF} className="px-2.5 py-1.5 rounded-lg bg-blue-500 text-white text-[9px] font-semibold hover:bg-blue-600 transition-colors flex items-center gap-1">
                      <FileText className="size-3" /> PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════ */}
      {/* TAB: LAPORAN */}
      {/* ══════════════════════════════════════════════════ */}
      {activeTab === "laporan" && (
        <div className="space-y-4 animate-fade-in">
          {/* Ringkasan Laba-Rugi */}
          <div className="floating-card p-4 space-y-3">
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <BarChart3 className="size-3.5 text-cyan-500" /> Laporan Laba-Rugi Kotor Percetakan
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <p className="text-[10px] text-muted-foreground/50">Total Penjualan</p>
                <p className="text-sm font-bold font-heading tabular-nums text-emerald-600 dark:text-emerald-400">{FORMAT_RUPIAH(laporan.totalPenjualan)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground/50">Total HPP (+Waste)</p>
                <p className="text-sm font-bold font-heading tabular-nums text-rose-500">{FORMAT_RUPIAH(laporan.totalHPPGlobal)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground/50">Laba Kotor</p>
                <p className={`text-sm font-bold font-heading tabular-nums ${
                  laporan.labaKotor >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                }`}>
                  {laporan.labaKotor >= 0 ? "+" : ""}{FORMAT_RUPIAH(laporan.labaKotor)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground/50">Margin (%)</p>
                <p className="text-sm font-bold font-heading tabular-nums">
                  {laporan.totalPenjualan > 0 ? ((laporan.labaKotor / laporan.totalPenjualan) * 100).toFixed(1) : "0.0"}%
                </p>
              </div>
            </div>
          </div>

          {/* Waste Tracker */}
          <div className="floating-card p-4 space-y-3">
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <AlertTriangle className="size-3.5 text-amber-500" /> Tracker Limbah (Waste) Bahan
            </p>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-[10px] text-muted-foreground/50">Akumulasi Waste Meteran</p>
                <p className="text-lg font-bold font-heading tabular-nums text-amber-500">{laporan.totalWaste.toFixed(2)} m²</p>
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-muted-foreground/50">Beban Penyusutan Material</p>
                <p className="text-lg font-bold font-heading tabular-nums text-rose-500">
                  {FORMAT_RUPIAH(Math.round(laporan.totalWaste * 25000))}
                </p>
              </div>
            </div>
            <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-rose-500 transition-all"
                style={{ width: `${Math.min(laporan.totalWaste / 10 * 100, 100)}%` }}
              />
            </div>
            <p className="text-[9px] text-muted-foreground/40">
              {laporan.totalWaste > 0
                ? `${laporan.totalWaste.toFixed(2)} m² material terbuang dari safety margin 5%`
                : "Belum ada data waste — jalankan produksi untuk melacak"}
            </p>
          </div>

          {/* Log Aktivitas Mesin */}
          <div className="floating-card p-4 space-y-3">
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <Clock className="size-3.5 text-cyan-500" /> Log Aktivitas Mesin — Hari Ini
            </p>
            {laporan.logHariIni.length === 0 ? (
              <p className="text-[10px] text-muted-foreground/40 py-2">Belum ada produksi selesai hari ini</p>
            ) : (
              <div className="space-y-2">
                {laporan.logHariIni.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/20">
                    <div className="size-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="size-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-medium truncate">{item.id} — {item.deskripsi}</p>
                      <p className="text-[9px] text-muted-foreground/50">{item.customer}</p>
                    </div>
                    <span className="text-[9px] font-semibold tabular-nums text-emerald-600">{FORMAT_RUPIAH(item.totalJual)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── SUB-COMPONENT: Result Card Meteran ─── */
function ResultCardMeteran({ hasil }: { hasil: KalkulasiMeteran }) {
  return (
    <div className="rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 p-4 space-y-2">
      <p className="text-[10px] font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">Hasil Kalkulasi Meteran</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-[10px]">
        <div className="flex justify-between"><span className="text-muted-foreground/60">Luas Total</span><span className="font-semibold tabular-nums">{hasil.luasTotal.toFixed(2)} m²</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground/60">Safety Waste (5%)</span><span className="font-semibold tabular-nums text-amber-500">{hasil.wasteMargin.toFixed(3)} m²</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground/60">Total HPP</span><span className="font-semibold tabular-nums text-rose-500">{FORMAT_RUPIAH(Math.round(hasil.totalHPP))}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground/60">Total Harga Jual</span><span className="font-semibold tabular-nums text-emerald-600">{FORMAT_RUPIAH(Math.round(hasil.totalJual))}</span></div>
      </div>
      <div className="flex justify-between items-center pt-2 border-t border-cyan-500/20">
        <span className="text-[10px] font-semibold">Laba Kotor</span>
        <span className={`text-xs font-bold font-heading tabular-nums ${
          hasil.labaKotor >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
        }`}>
          {hasil.labaKotor >= 0 ? "+" : ""}{FORMAT_RUPIAH(Math.round(hasil.labaKotor))}
        </span>
      </div>
    </div>
  );
}

/* ─── SUB-COMPONENT: Result Card Buku ─── */
function ResultCardBuku({ hasil }: { hasil: KalkulasiBuku }) {
  return (
    <div className="rounded-xl bg-gradient-to-br from-violet-500/10 to-blue-500/10 border border-violet-500/20 p-4 space-y-2">
      <p className="text-[10px] font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider">Hasil Kalkulasi Buku</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-[10px]">
        <div className="flex justify-between"><span className="text-muted-foreground/60">HPP Isi</span><span className="font-semibold tabular-nums">{FORMAT_RUPIAH(Math.round(hasil.hppIsi))}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground/60">HPP Cover</span><span className="font-semibold tabular-nums">{FORMAT_RUPIAH(Math.round(hasil.hppCover))}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground/60">HPP Jilid</span><span className="font-semibold tabular-nums">{FORMAT_RUPIAH(Math.round(hasil.hppJilid))}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground/60">HPP/Satuan</span><span className="font-semibold tabular-nums text-rose-500">{FORMAT_RUPIAH(Math.round(hasil.totalHPPSatuan))}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground/60">Jual/Satuan</span><span className="font-semibold tabular-nums text-emerald-600">{FORMAT_RUPIAH(Math.round(hasil.totalJualSatuan))}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground/60">Total HPP Global</span><span className="font-semibold tabular-nums text-rose-500">{FORMAT_RUPIAH(Math.round(hasil.totalHPPGlobal))}</span></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-violet-500/20">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-semibold">Total Jual Global</span>
          <span className="text-xs font-bold font-heading tabular-nums text-emerald-600">{FORMAT_RUPIAH(Math.round(hasil.totalJualGlobal))}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-semibold">Laba Kotor</span>
          <span className={`text-xs font-bold font-heading tabular-nums ${
            hasil.labaKotorGlobal >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
          }`}>
            {hasil.labaKotorGlobal >= 0 ? "+" : ""}{FORMAT_RUPIAH(Math.round(hasil.labaKotorGlobal))}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── SUB-COMPONENT: Order Meta Form ─── */
function OrderMetaForm({
  noInvoice, setNoInvoice,
  customerName, setCustomerName,
  customerPhone, setCustomerPhone,
  paymentMethod, setPaymentMethod,
}: {
  noInvoice: string; setNoInvoice: (v: string) => void;
  customerName: string; setCustomerName: (v: string) => void;
  customerPhone: string; setCustomerPhone: (v: string) => void;
  paymentMethod: string; setPaymentMethod: (v: string) => void;
}) {
  return (
    <div className="space-y-3 pt-2 border-t border-border/30">
      <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Data Order</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[9px] text-muted-foreground/50">No. Invoice</label>
          <input type="text" value={noInvoice} onChange={(e) => setNoInvoice(e.target.value)} placeholder="(Otomatis)" className="input-premium w-full text-[10px]" />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] text-muted-foreground/50">Customer</label>
          <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Walk-in Customer" className="input-premium w-full text-[10px]" />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] text-muted-foreground/50">No. HP (opsional)</label>
          <input type="text" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="0812xxxx" className="input-premium w-full text-[10px]" />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] text-muted-foreground/50">Metode Bayar</label>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="input-premium w-full text-[10px]">
            <option value="tunai">Tunai</option>
            <option value="transfer">Transfer Bank</option>
            <option value="qris">QRIS</option>
            <option value="hutang">Hutang</option>
          </select>
        </div>
      </div>
    </div>
  );
}
