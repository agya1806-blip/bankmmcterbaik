"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hitungTukarTambah } from "@/store/useBusinessStore";
import { Plus, Calculator, Smartphone, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

interface GadgetFormProps {
  currency: string;
  onAddToCart: (desc: string, price: number) => void;
}

export default function GadgetForm({ currency, onAddToCart }: GadgetFormProps) {
  const [gImei1, setGImei1] = useState("");
  const [gImei2, setGImei2] = useState("");
  const [gModel, setGModel] = useState("");
  const [gHpp, setGHpp] = useState(0);
  const [gPrice, setGPrice] = useState(0);
  const [gWarranty, setGWarranty] = useState("");
  const [tukarMode, setTukarMode] = useState(false);
  const [gTukar, setGTukar] = useState(0);
  const [gTukarResult, setGTukarResult] = useState<{
    bayar: number;
    hppBekas: number;
    diskonSelisih: number;
  } | null>(null);

  const tambahKeCart = () => {
    if (!gImei1 || !gPrice) return;
    const label = `${gModel || "HP"} [IMEI: ${gImei1.slice(0, 8)}...]${
      tukarMode && gTukarResult
        ? ` (TT: ${gTukarResult.bayar.toLocaleString()})`
        : ""
    }`;
    const harga = tukarMode && gTukarResult ? gTukarResult.bayar : gPrice;
    onAddToCart(label, harga);
    toast.success("Item gadget ditambahkan");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <Smartphone className="size-5 text-cyan-500" />
        <span className="text-xs font-medium text-muted-foreground/70">Data HP / Gadget</span>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground">IMEI 1 <span className="text-red-500">*</span></Label>
        <Input value={gImei1} onChange={(e) => setGImei1(e.target.value)} placeholder="Masukkan IMEI utama" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground">IMEI 2 (opsional)</Label>
        <Input value={gImei2} onChange={(e) => setGImei2(e.target.value)} placeholder="IMEI kedua (dual SIM)" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground">Model / Tipe</Label>
        <Input value={gModel} onChange={(e) => setGModel(e.target.value)} placeholder="cth: iPhone 14 Pro Max" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Harga Modal</Label>
          <Input type="number" value={gHpp || ""} onChange={(e) => setGHpp(Number(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Harga Jual</Label>
          <Input type="number" value={gPrice || ""} onChange={(e) => setGPrice(Number(e.target.value))} />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Masa Garansi s/d</Label>
          <Input type="date" value={gWarranty} onChange={(e) => setGWarranty(e.target.value)}
            className="input-premium uppercase text-xs tracking-wider" />
        </div>
      </div>

      <label className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/40 cursor-pointer hover:bg-muted/50 transition-colors">
        <div className={`relative flex items-center justify-center size-5 rounded-md border-2 transition-all ${
          tukarMode ? "bg-cyan-500 border-cyan-500" : "border-muted-foreground/30"
        }`}>
          {tukarMode && (
            <svg className="size-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
          )}
          <input type="checkbox" checked={tukarMode} onChange={(e) => setTukarMode(e.target.checked)} className="sr-only" />
        </div>
        <div className="flex items-center gap-2">
          <RefreshCw className="size-4 text-cyan-500" />
          <span className="text-sm font-medium">Mode Tukar Tambah</span>
        </div>
      </label>

      {tukarMode && (
        <div className="bg-gradient-to-br from-cyan-50/50 to-cyan-100/20 dark:from-cyan-950/20 dark:to-cyan-900/5 border border-cyan-200/40 dark:border-cyan-800/30 rounded-2xl p-4 space-y-3 animate-scale-in">
          <div className="flex items-center gap-2">
            <RefreshCw className="size-4 text-cyan-500" />
            <span className="text-xs font-semibold text-cyan-700 dark:text-cyan-400">Kalkulator Tukar Tambah</span>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Taksiran Unit Bekas</Label>
            <Input type="number" value={gTukar || ""} onChange={(e) => setGTukar(Number(e.target.value))} placeholder="Nilai taksiran" />
          </div>
          <Button size="sm" variant="secondary" onClick={() => {
            if (gPrice > 0) {
              const r = hitungTukarTambah(gPrice, gTukar);
              setGTukarResult(r);
              toast.success(`Bayar: ${r.bayar.toLocaleString()}, HPP Bekas: ${r.hppBekas.toLocaleString()}`);
            }
          }}>
            <Calculator className="size-3" /> Hitung Tukar Tambah
          </Button>
          {gTukarResult && (
            <div className="bg-white/50 dark:bg-card/50 rounded-xl p-3 space-y-1.5 text-sm animate-scale-in">
              <div className="flex justify-between"><span className="text-muted-foreground/70">Yang Harus Dibayar</span><span className="font-bold text-cyan-600">{currency} {gTukarResult.bayar.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground/70">HPP Unit Bekas</span><span>{currency} {gTukarResult.hppBekas.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground/70">Diskon / Selisih</span><span className="text-emerald-600">-{currency} {gTukarResult.diskonSelisih.toLocaleString()}</span></div>
            </div>
          )}
        </div>
      )}

      <Button size="sm" className="w-full" disabled={!gImei1 || !gPrice} onClick={tambahKeCart}>
        <Plus className="size-3.5" /> Tambah ke Keranjang
      </Button>
    </div>
  );
}
