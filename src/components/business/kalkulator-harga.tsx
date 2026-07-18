"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Ruler, Smartphone, Monitor, Coffee, Shirt, AlertTriangle, Calculator } from "lucide-react";


export interface KalkulatorHargaProps {
  onResult: (hargaJual: number) => void;
  onClose: () => void;
  hargaModal?: number;
}

export default function KalkulatorHarga({ onResult, onClose, hargaModal }: KalkulatorHargaProps) {
  return <SimplePriceCalc onClose={onClose} onResult={onResult} hargaModal={hargaModal} />;
}

/* ─── Simple Price Calculator (Modal + Margin) ─── */
function SimplePriceCalc({ onClose, onResult, hargaModal: initModal }: {
  onClose: () => void;
  onResult: (hargaJual: number) => void;
  hargaModal?: number;
}) {
  const [modal, setModal] = useState(initModal || 0);
  const [margin, setMargin] = useState(30);

  const hasil = Math.round(modal * (1 + margin / 100));

  return (
    <ModalWrapper onClose={onClose} title="Kalkulator Harga" icon={<Calculator className="w-5 h-5 text-[#008CEB]" />}>
      <div className="space-y-3 text-xs">
        <InputRow label="Harga Modal (HPP)" value={modal} onChange={setModal} suffix="Rp" />
        <InputRow label="Margin Keuntungan" value={margin} onChange={setMargin} suffix="%" />

        <div className="bg-slate-50 dark:bg-zinc-900 p-3 rounded-xl space-y-1">
          <p className="text-[10px] text-slate-400">Harga Jual ({margin}% margin)</p>
          <p className="text-lg font-extrabold text-[#008CEB]">Rp{hasil.toLocaleString()}</p>
        </div>

        <button onClick={() => { onResult(hasil); onClose(); }}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#008CEB] to-[#00C9A7] text-white font-extrabold text-xs active:scale-[0.98] transition-transform">
          Gunakan Harga Ini
        </button>
      </div>
    </ModalWrapper>
  );
}

function ModalWrapper({ children, onClose, title, icon }: { children: React.ReactNode; onClose: () => void; title: string; icon: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center backdrop-blur-sm">
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 250 }}
        className="w-full max-w-md bg-white dark:bg-[#131527] rounded-t-[32px] p-5 pb-8 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-[#131527] z-10">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="text-sm font-extrabold">{title}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full bg-slate-100 dark:bg-zinc-800">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

function InputRow({ label, value, onChange, placeholder, type = "number", suffix }: {
  label: string; value: number | string; onChange: (v: number) => void; placeholder?: string; type?: string; suffix?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type={type}
          value={value || ""}
          onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value as unknown as number)}
          placeholder={placeholder || "0"}
          className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none font-medium"
        />
        {suffix && <span className="text-[10px] text-slate-400 font-bold shrink-0">{suffix}</span>}
      </div>
    </div>
  );
}

/* ─── Percetakan Calculator ─── */
function PrintingCalc({ onClose, onResult }: { onClose: () => void; onResult: (n: string, h: number, s: string) => void }) {
  const [tipe, setTipe] = useState<"meteran" | "buku">("meteran");
  const [panjang, setPanjang] = useState(0);
  const [lebar, setLebar] = useState(0);
  const [qty, setQty] = useState(1);
  const [hargaModal, setHargaModal] = useState(0);
  const [margin, setMargin] = useState(30);
  const [halaman, setHalaman] = useState(0);
  const [kertasPerLembar, setKertasPerLembar] = useState(1);
  const [hargaKertas, setHargaKertas] = useState(0);
  const [hargaCover, setHargaCover] = useState(0);
  const [hargaJilid, setHargaJilid] = useState(0);

  const wasteMultiplier = 1.05;
  const hasil = tipe === "meteran"
    ? Math.round(panjang * lebar * qty * hargaModal * wasteMultiplier * (1 + margin / 100))
    : Math.round(((halaman * kertasPerLembar * hargaKertas) + hargaCover + hargaJilid) * qty * wasteMultiplier * (1 + margin / 100));

  const spec = tipe === "meteran"
    ? `Cetak Meteran | ${panjang}x${lebar}cm x${qty} | Modal: ${hargaModal} + Waste 5%`
    : `Cetak Buku | ${halaman}hlm x${kertasPerLembar} kertas | Cover+Jilid`;

  return (
    <ModalWrapper onClose={onClose} title="Kalkulator Percetakan" icon={<Ruler className="w-5 h-5 text-blue-500" />}>
      <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-zinc-800 p-1 rounded-2xl">
        <button onClick={() => setTipe("meteran")} className={`py-2 rounded-xl text-[10px] font-bold transition-all ${tipe === "meteran" ? "bg-white dark:bg-[#131527] shadow-sm" : "text-slate-400"}`}>Cetak Meteran</button>
        <button onClick={() => setTipe("buku")} className={`py-2 rounded-xl text-[10px] font-bold transition-all ${tipe === "buku" ? "bg-white dark:bg-[#131527] shadow-sm" : "text-slate-400"}`}>Cetak Buku</button>
      </div>

      {tipe === "meteran" ? (
        <div className="grid grid-cols-2 gap-3 text-xs">
          <InputRow label="Panjang (cm)" value={panjang} onChange={setPanjang} />
          <InputRow label="Lebar (cm)" value={lebar} onChange={setLebar} />
          <InputRow label="Qty" value={qty} onChange={setQty} />
          <InputRow label="Harga Modal" value={hargaModal} onChange={setHargaModal} suffix="Rp" />
        </div>
      ) : (
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <InputRow label="Jumlah Halaman" value={halaman} onChange={setHalaman} />
            <InputRow label="Kertas/Lembar" value={kertasPerLembar} onChange={setKertasPerLembar} />
            <InputRow label="Harga Kertas" value={hargaKertas} onChange={setHargaKertas} suffix="Rp" />
            <InputRow label="Qty Buku" value={qty} onChange={setQty} />
          </div>
          <InputRow label="Harga Cover" value={hargaCover} onChange={setHargaCover} suffix="Rp" />
          <InputRow label="Harga Jilid" value={hargaJilid} onChange={setHargaJilid} suffix="Rp" />
        </div>
      )}

      <InputRow label="Margin Laba (%)" value={margin} onChange={setMargin} suffix="%" />

      <div className="bg-slate-50 dark:bg-zinc-900 p-3 rounded-xl space-y-1">
        <p className="text-[10px] text-slate-400">Estimasi Harga Jual <span className="text-amber-500">(+5% waste + {margin}% margin)</span></p>
        <p className="text-lg font-extrabold text-[#008CEB]">Rp{hasil.toLocaleString()}</p>
      </div>

      <button onClick={() => { onResult(`Cetak ${tipe === "meteran" ? "Meteran" : "Buku"}`, hasil, spec); onClose(); }}
        className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#008CEB] to-[#00C9A7] text-white font-extrabold text-xs active:scale-[0.98] transition-transform">
        Tambahkan ke Keranjang
      </button>
    </ModalWrapper>
  );
}

/* ─── Gadget Calculator ─── */
function GadgetCalc({ onClose, onResult }: { onClose: () => void; onResult: (n: string, h: number, s: string) => void }) {
  const [namaUnit, setNamaUnit] = useState("");
  const [imei1, setImei1] = useState("");
  const [imei2, setImei2] = useState("");
  const [hargaBaru, setHargaBaru] = useState(0);
  const [hargaModal, setHargaModal] = useState(0);
  const [garansiToko, setGaransiToko] = useState(12);
  const [garansiDistributor, setGaransiDistributor] = useState(12);
  const [tradeIn, setTradeIn] = useState(false);
  const [hargaTaksir, setHargaTaksir] = useState(0);

  const hasil = tradeIn ? Math.max(0, hargaBaru - hargaTaksir) : hargaBaru;

  const specParts = [
    `IMEI1: ${imei1 || "-"}`,
    `IMEI2: ${imei2 || "-"}`,
    `Garansi Toko: ${garansiToko}bln`,
    `Garansi Distributor: ${garansiDistributor}bln`,
    tradeIn ? `Tukar Tambah: -Rp${hargaTaksir.toLocaleString()}` : "",
  ].filter(Boolean).join(" | ");

  return (
    <ModalWrapper onClose={onClose} title="Kalkulator Gadget" icon={<Smartphone className="w-5 h-5 text-indigo-500" />}>
      <div className="space-y-3 text-xs">
        <InputRow label="Nama Unit" value={namaUnit} onChange={(v) => setNamaUnit(String(v))} type="text" placeholder="iPhone 14 Pro Max" />
        <div className="grid grid-cols-2 gap-3">
          <InputRow label="IMEI 1" value={imei1} onChange={(v) => setImei1(String(v))} type="text" placeholder="IMEI-1" />
          <InputRow label="IMEI 2" value={imei2} onChange={(v) => setImei2(String(v))} type="text" placeholder="IMEI-2" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <InputRow label="Harga Jual Baru" value={hargaBaru} onChange={setHargaBaru} suffix="Rp" />
          <InputRow label="Harga Modal" value={hargaModal} onChange={setHargaModal} suffix="Rp" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <InputRow label="Garansi Toko (bln)" value={garansiToko} onChange={setGaransiToko} suffix="bln" />
          <InputRow label="Garansi Distributor" value={garansiDistributor} onChange={setGaransiDistributor} suffix="bln" />
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="tradein" checked={tradeIn} onChange={(e) => setTradeIn(e.target.checked)} className="w-4 h-4 accent-[#008CEB]" />
          <label htmlFor="tradein" className="text-[10px] font-bold text-slate-400">Tukar Tambah (Trade-in)</label>
        </div>

        {tradeIn && (
          <div className="pl-4 border-l-2 border-[#008CEB]/30 space-y-3">
            <InputRow label="Harga Taksir Unit Lama" value={hargaTaksir} onChange={setHargaTaksir} suffix="Rp" />
            <p className="text-[9px] text-amber-500 font-medium">Unit bekas otomatis menjadi stok HPP baru senilai Rp{hargaTaksir.toLocaleString()}</p>
          </div>
        )}

        <div className="bg-slate-50 dark:bg-zinc-900 p-3 rounded-xl space-y-1">
          <p className="text-[10px] text-slate-400">Harga Jual <span className="text-amber-500">{tradeIn ? "(setelah tukar tambah)" : ""}</span></p>
          <p className="text-lg font-extrabold text-[#008CEB]">Rp{hasil.toLocaleString()}</p>
          <p className="text-[9px] text-slate-400">HPP: Rp{hargaModal.toLocaleString()}</p>
        </div>
      </div>

      <button onClick={() => { onResult(namaUnit || "Unit Gadget", hasil, specParts); onClose(); }}
        className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#008CEB] to-[#00C9A7] text-white font-extrabold text-xs active:scale-[0.98] transition-transform">
        Tambahkan ke Keranjang
      </button>
    </ModalWrapper>
  );
}

/* ─── Laptop/Komputer Calculator ─── */
function LaptopCalc({ onClose, onResult }: { onClose: () => void; onResult: (n: string, h: number, s: string) => void }) {
  interface Part { nama: string; sn: string; harga: number; }
  const [parts, setParts] = useState<Part[]>([]);
  const [partNama, setPartNama] = useState("");
  const [partSn, setPartSn] = useState("");
  const [partHarga, setPartHarga] = useState(0);
  const [margin, setMargin] = useState(25);

  const totalHpp = parts.reduce((s, p) => s + p.harga, 0);
  const hasil = Math.round(totalHpp * (1 + margin / 100));

  const addPart = () => {
    if (!partNama) return;
    setParts([...parts, { nama: partNama, sn: partSn || "-", harga: partHarga }]);
    setPartNama("");
    setPartSn("");
    setPartHarga(0);
  };

  const removePart = (i: number) => setParts(parts.filter((_, idx) => idx !== i));

  const specParts = parts.map((p) => `${p.nama} (SN:${p.sn}) - Rp${p.harga.toLocaleString()}`).join(" | ");

  return (
    <ModalWrapper onClose={onClose} title="Kalkulator Komputer Rakitan" icon={<Monitor className="w-5 h-5 text-violet-500" />}>
      <div className="space-y-3 text-xs">
        <div className="bg-amber-50 dark:bg-amber-950/20 p-2 rounded-xl text-[9px] text-amber-600 font-medium">
          Masukkan part PC rakitan satu per satu dengan SN-nya
        </div>

        <div className="grid grid-cols-1 gap-2">
          <InputRow label="Nama Part" value={partNama} onChange={(v) => setPartNama(String(v))} type="text" placeholder="Motherboard, CPU, RAM..." />
          <div className="grid grid-cols-2 gap-2">
            <InputRow label="Serial Number" value={partSn} onChange={(v) => setPartSn(String(v))} type="text" placeholder="SN-XXXX" />
            <InputRow label="Harga Part" value={partHarga} onChange={setPartHarga} suffix="Rp" />
          </div>
          <button onClick={addPart} className="py-2 rounded-xl bg-[#008CEB] text-white text-[10px] font-bold active:scale-[0.98] transition-transform">Tambah Part</button>
        </div>

        {parts.length > 0 && (
          <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
            {parts.map((p, i) => (
              <div key={i} className="flex items-center justify-between bg-slate-50 dark:bg-zinc-900 p-2 rounded-lg">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold truncate">{p.nama}</p>
                  <p className="text-[8px] text-slate-400">SN: {p.sn}</p>
                </div>
                <span className="text-[10px] font-bold text-[#008CEB] shrink-0 ml-2">Rp{p.harga.toLocaleString()}</span>
                <button onClick={() => removePart(i)} className="text-rose-500 ml-1 p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <InputRow label="Margin Laba (%)" value={margin} onChange={setMargin} suffix="%" />

        <div className="bg-slate-50 dark:bg-zinc-900 p-3 rounded-xl space-y-1">
          <p className="text-[10px] text-slate-400">Total HPP Komponen: Rp{totalHpp.toLocaleString()}</p>
          <p className="text-lg font-extrabold text-[#008CEB]">Rp{hasil.toLocaleString()}</p>
        </div>
      </div>

      <button onClick={() => { onResult(`PC Rakitan (${parts.length} part)`, hasil, specParts); onClose(); }}
        disabled={parts.length === 0}
        className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#008CEB] to-[#00C9A7] text-white font-extrabold text-xs active:scale-[0.98] transition-transform disabled:opacity-50">
        Tambahkan ke Keranjang
      </button>
    </ModalWrapper>
  );
}

/* ─── Kedai Kopi Calculator ─── */
function CafeCalc({ onClose, onResult }: { onClose: () => void; onResult: (n: string, h: number, s: string) => void }) {
  const [namaMenu, setNamaMenu] = useState("");
  const [hargaJual, setHargaJual] = useState(0);
  const [bahan, setBahan] = useState<{ nama: string; gramasi: number; hargaPerGram: number }[]>([]);
  const [bahanNama, setBahanNama] = useState("");
  const [bahanGramasi, setBahanGramasi] = useState(0);
  const [bahanHarga, setBahanHarga] = useState(0);

  const totalHppBahan = bahan.reduce((s, b) => s + b.gramasi * b.hargaPerGram, 0);
  const hasil = Math.max(hargaJual, Math.round(totalHppBahan * 2.5));

  const addBahan = () => {
    if (!bahanNama) return;
    setBahan([...bahan, { nama: bahanNama, gramasi: bahanGramasi, hargaPerGram: bahanHarga }]);
    setBahanNama("");
    setBahanGramasi(0);
    setBahanHarga(0);
  };
  const removeBahan = (i: number) => setBahan(bahan.filter((_, idx) => idx !== i));

  const specBahan = bahan.map((b) => `${b.nama} (${b.gramasi}g)`).join(", ");
  const isLowMargin = hargaJual > 0 && hasil > hargaJual * 1.5;

  return (
    <ModalWrapper onClose={onClose} title="Kalkulator Menu Kedai Kopi" icon={<Coffee className="w-5 h-5 text-orange-500" />}>
      <div className="space-y-3 text-xs">
        <InputRow label="Nama Menu" value={namaMenu} onChange={(v) => setNamaMenu(String(v))} type="text" placeholder="Es Kopi Susu" />
        <InputRow label="Harga Jual Ideal" value={hargaJual} onChange={setHargaJual} suffix="Rp" />

        <div className="bg-amber-50 dark:bg-amber-950/20 p-2 rounded-xl text-[9px] text-amber-600 font-medium">
          Masukkan BOM (Bill of Materials) resep
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-1">
            <InputRow label="Bahan" value={bahanNama} onChange={(v) => setBahanNama(String(v))} type="text" placeholder="Kopi" />
          </div>
          <InputRow label="Gramasi (g)" value={bahanGramasi} onChange={setBahanGramasi} suffix="g" />
          <InputRow label="Harga/g" value={bahanHarga} onChange={setBahanHarga} suffix="Rp" />
        </div>
        <button onClick={addBahan} className="py-2 rounded-xl bg-orange-500 text-white text-[10px] font-bold active:scale-[0.98] transition-transform">Tambah Bahan</button>

        {bahan.length > 0 && (
          <div className="space-y-1 max-h-[80px] overflow-y-auto">
            {bahan.map((b, i) => (
              <div key={i} className="flex items-center justify-between bg-slate-50 dark:bg-zinc-900 p-1.5 rounded-lg">
                <span className="text-[10px] font-bold">{b.nama} ({b.gramasi}g)</span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-slate-400">Rp{(b.gramasi * b.hargaPerGram).toLocaleString()}</span>
                  <button onClick={() => removeBahan(i)} className="text-rose-500"><X className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-slate-50 dark:bg-zinc-900 p-3 rounded-xl space-y-1">
          <p className="text-[10px] text-slate-400">Total HPP Bahan: Rp{totalHppBahan.toLocaleString()}</p>
          {isLowMargin && (
            <p className="text-[9px] text-rose-500 font-medium flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Margin rendah! Harga jual minimal: Rp{Math.round(totalHppBahan * 2.5).toLocaleString()}</p>
          )}
          <p className="text-lg font-extrabold text-[#008CEB]">Rp{Math.max(hargaJual, hasil).toLocaleString()}</p>
        </div>
      </div>

      <button onClick={() => { onResult(namaMenu || "Menu Kopi", hasil, `BOM: ${specBahan || "-"}`); onClose(); }}
        disabled={!namaMenu}
        className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#008CEB] to-[#00C9A7] text-white font-extrabold text-xs active:scale-[0.98] transition-transform disabled:opacity-50">
        Tambahkan ke Keranjang
      </button>
    </ModalWrapper>
  );
}

/* ─── Fashion & Konveksi Calculator ─── */
function FashionCalc({ onClose, onResult }: { onClose: () => void; onResult: (n: string, h: number, s: string) => void }) {
  const [tipe, setTipe] = useState<"retail" | "konveksi">("retail");
  const [nama, setNama] = useState("");
  const [warnaArr, setWarnaArr] = useState<string[]>([]);
  const [warnaInput, setWarnaInput] = useState("");
  const [ukuranArr, setUkuranArr] = useState<string[]>([]);
  const [ukuranInput, setUkuranInput] = useState("");
  const [hargaPerSku, setHargaPerSku] = useState(0);
  const [modalPerSku, setModalPerSku] = useState(0);
  // konveksi
  const [beratKain, setBeratKain] = useState(0);
  const [hargaKainPerKg, setHargaKainPerKg] = useState(0);
  const [upahCmt, setUpahCmt] = useState(0);
  const [biayaSablon, setBiayaSablon] = useState(0);
  const [qtyProduksi, setQtyProduksi] = useState(1);

  const addWarna = () => { if (warnaInput && !warnaArr.includes(warnaInput)) { setWarnaArr([...warnaArr, warnaInput]); setWarnaInput(""); } };
  const addUkuran = () => { if (ukuranInput && !ukuranArr.includes(ukuranInput)) { setUkuranArr([...ukuranArr, ukuranInput]); setUkuranInput(""); } };

  const totalSku = Math.max(1, warnaArr.length * ukuranArr.length);
  const wastageCost = 0.05;
  const biayaKain = beratKain * hargaKainPerKg * (1 + wastageCost);
  const totalHppKonveksi = biayaKain + upahCmt + biayaSablon;
  const hasilKonveksi = Math.round(totalHppKonveksi * qtyProduksi * 1.3);
  const hasilPerUnit = qtyProduksi > 0 ? Math.round(hasilKonveksi / qtyProduksi) : 0;

  return (
    <ModalWrapper onClose={onClose} title="Kalkulator Fashion & Konveksi" icon={<Shirt className="w-5 h-5 text-pink-500" />}>
      <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-zinc-800 p-1 rounded-2xl mb-3">
        <button onClick={() => setTipe("retail")} className={`py-2 rounded-xl text-[10px] font-bold transition-all ${tipe === "retail" ? "bg-white dark:bg-[#131527] shadow-sm" : "text-slate-400"}`}>Retail SKU</button>
        <button onClick={() => setTipe("konveksi")} className={`py-2 rounded-xl text-[10px] font-bold transition-all ${tipe === "konveksi" ? "bg-white dark:bg-[#131527] shadow-sm" : "text-slate-400"}`}>Proyek Konveksi</button>
      </div>

      {tipe === "retail" ? (
        <div className="space-y-3 text-xs">
          <InputRow label="Nama Produk" value={nama} onChange={(v) => setNama(String(v))} type="text" placeholder="Kaos Polos" />
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Warna</label>
            <div className="flex gap-2">
              <input type="text" value={warnaInput} onChange={(e) => setWarnaInput(e.target.value)} placeholder="Hitam" className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none" />
              <button onClick={addWarna} className="px-3 py-2 rounded-xl bg-[#008CEB] text-white text-[10px] font-bold">+</button>
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {warnaArr.map((w, i) => (
                <span key={i} className="text-[9px] bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                  {w} <button onClick={() => setWarnaArr(warnaArr.filter((_, idx) => idx !== i))} className="text-rose-500"><X className="w-4 h-4" /></button>
                </span>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Ukuran</label>
            <div className="flex gap-2">
              <input type="text" value={ukuranInput} onChange={(e) => setUkuranInput(e.target.value)} placeholder="M" className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none" />
              <button onClick={addUkuran} className="px-3 py-2 rounded-xl bg-[#008CEB] text-white text-[10px] font-bold">+</button>
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {ukuranArr.map((u, i) => (
                <span key={i} className="text-[9px] bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                  {u} <button onClick={() => setUkuranArr(ukuranArr.filter((_, idx) => idx !== i))} className="text-rose-500"><X className="w-4 h-4" /></button>
                </span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InputRow label="Harga Jual/SKU" value={hargaPerSku} onChange={setHargaPerSku} suffix="Rp" />
            <InputRow label="Modal/SKU" value={modalPerSku} onChange={setModalPerSku} suffix="Rp" />
          </div>
          <div className="bg-slate-50 dark:bg-zinc-900 p-3 rounded-xl">
            <p className="text-[10px] text-slate-400">Total SKU Matrix: {totalSku} ({warnaArr.length} warna x {ukuranArr.length} ukuran)</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3 text-xs">
          <InputRow label="Nama Proyek" value={nama} onChange={(v) => setNama(String(v))} type="text" placeholder="Kaos Class of 2024" />
          <div className="grid grid-cols-2 gap-3">
            <InputRow label="Berat Kain (Kg)" value={beratKain} onChange={setBeratKain} suffix="kg" />
            <InputRow label="Harga Kain/Kg" value={hargaKainPerKg} onChange={setHargaKainPerKg} suffix="Rp" />
            <InputRow label="Upah CMT" value={upahCmt} onChange={setUpahCmt} suffix="Rp" />
            <InputRow label="Biaya Sablon" value={biayaSablon} onChange={setBiayaSablon} suffix="Rp" />
          </div>
          <InputRow label="Qty Produksi" value={qtyProduksi} onChange={setQtyProduksi} suffix="pcs" />
          <div className="bg-slate-50 dark:bg-zinc-900 p-3 rounded-xl space-y-1">
            <p className="text-[9px] text-slate-400">Biaya Kain (+5% waste): Rp{Math.round(biayaKain).toLocaleString()}</p>
            <p className="text-[9px] text-slate-400">Total HPP Produksi: Rp{Math.round(totalHppKonveksi).toLocaleString()}</p>
            <p className="text-[10px] text-slate-400">Harga Jual Total (x{qtyProduksi} +30% margin)</p>
            <p className="text-lg font-extrabold text-[#008CEB]">Rp{hasilKonveksi.toLocaleString()}</p>
            <p className="text-[9px] text-slate-400">Per unit: Rp{hasilPerUnit.toLocaleString()}</p>
          </div>
        </div>
      )}

      <button onClick={() => {
        if (tipe === "retail") {
          onResult(nama || "Produk Retail", hargaPerSku, `SKU Matrix: ${warnaArr.join("/")} x ${ukuranArr.join("/")} | Modal: Rp${modalPerSku.toLocaleString()}`);
        } else {
          onResult(`Proyek: ${nama || "Konveksi"}`, hasilKonveksi, `Kain ${beratKain}kg+5% waste, CMT: Rp${upahCmt}, Sablon: Rp${biayaSablon}`);
        }
        onClose();
      }}
        disabled={!nama}
        className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#008CEB] to-[#00C9A7] text-white font-extrabold text-xs active:scale-[0.98] transition-transform disabled:opacity-50">
        Tambahkan ke Keranjang
      </button>
    </ModalWrapper>
  );
}
