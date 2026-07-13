"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hitungKonveksi } from "@/store/useBusinessStore";
import { Plus, Calculator, Shirt } from "lucide-react";
import toast from "react-hot-toast";

interface KonveksiFormProps {
  currency: string;
  onAddToCart: (desc: string, price: number) => void;
}

const UKURAN = ["S", "M", "L", "XL", "XXL", "3XL"] as const;
const WARNA = [
  "Hitam", "Putih", "Merah", "Biru", "Hijau",
  "Kuning", "Abu", "Coklat", "Navy", "Burgundy",
] as const;

export default function KonveksiForm({ currency, onAddToCart }: KonveksiFormProps) {
  const [kProduct, setKProduct] = useState("");
  const [kColor, setKColor] = useState<string>("Hitam");
  const [kSize, setKSize] = useState<string>("M");
  const [kPrice, setKPrice] = useState(0);
  const [kStock, setKStock] = useState(0);
  const [kBerat, setKBerat] = useState(0);
  const [kHargaKain, setKHargaKain] = useState(0);
  const [kCmt, setKCmt] = useState(0);
  const [kSablon, setKSablon] = useState(0);
  const [kWastage, setKWastage] = useState(5);
  const [kKonvResult, setKKonvResult] = useState<{
    totalCost: number;
    hargaJual: number;
    margin: number;
    rincian: { bahan: number; cmt: number; sablon: number; wastage: number };
  } | null>(null);

  const tambahKeCart = () => {
    if (!kProduct || !kPrice) return;
    onAddToCart(`${kProduct} (${kColor}/${kSize})`, kPrice);
    toast.success("Produk konveksi ditambahkan");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <Shirt className="size-5 text-fuchsia-500" />
        <span className="text-xs font-medium text-muted-foreground/70">Produk & Biaya Konveksi</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Nama Produk</Label>
          <Input value={kProduct} onChange={(e) => setKProduct(e.target.value)} placeholder="cth: Kaos Polos" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Ukuran</Label>
          <select value={kSize} onChange={(e) => setKSize(e.target.value)} className="input-premium">
            {UKURAN.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Warna</Label>
          <select value={kColor} onChange={(e) => setKColor(e.target.value)} className="input-premium">
            {WARNA.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Harga Jual</Label>
          <Input type="number" value={kPrice || ""} onChange={(e) => setKPrice(Number(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Stok</Label>
          <Input type="number" value={kStock || ""} onChange={(e) => setKStock(Number(e.target.value))} />
        </div>
      </div>

      <div className="floating-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Calculator className="size-4 text-muted-foreground/60" />
          <Label className="text-xs font-semibold">Kalkulator Biaya Produksi</Label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground/60">Berat Kain (Kg)</Label>
            <Input type="number" value={kBerat || ""} onChange={(e) => setKBerat(Number(e.target.value))} className="h-9 text-xs" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground/60">Harga Kain/Kg</Label>
            <Input type="number" value={kHargaKain || ""} onChange={(e) => setKHargaKain(Number(e.target.value))} className="h-9 text-xs" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground/60">CMT Jahit</Label>
            <Input type="number" value={kCmt || ""} onChange={(e) => setKCmt(Number(e.target.value))} className="h-9 text-xs" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground/60">Sablon/Bordir</Label>
            <Input type="number" value={kSablon || ""} onChange={(e) => setKSablon(Number(e.target.value))} className="h-9 text-xs" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground/60">Wastage %</Label>
            <Input type="number" value={kWastage} onChange={(e) => setKWastage(Number(e.target.value))} className="h-9 text-xs" />
          </div>
          <div className="flex items-end">
            <Button size="sm" variant="secondary" onClick={() => {
              if (kBerat > 0) setKKonvResult(hitungKonveksi(kBerat, kHargaKain, kCmt, kSablon, kWastage));
            }}><Calculator className="size-3" /> Hitung</Button>
          </div>
        </div>

        {kKonvResult && (
          <div className="bg-gradient-to-br from-fuchsia-50/50 to-fuchsia-100/20 dark:from-fuchsia-950/20 dark:to-fuchsia-900/5 border border-fuchsia-200/30 dark:border-fuchsia-800/30 rounded-xl p-3 space-y-2 animate-scale-in">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <span className="text-muted-foreground/60">Bahan</span>
              <span className="text-right font-medium">{currency} {kKonvResult.rincian.bahan.toLocaleString()}</span>
              <span className="text-muted-foreground/60">CMT Jahit</span>
              <span className="text-right font-medium">{currency} {kKonvResult.rincian.cmt.toLocaleString()}</span>
              <span className="text-muted-foreground/60">Sablon</span>
              <span className="text-right font-medium">{currency} {kKonvResult.rincian.sablon.toLocaleString()}</span>
              <span className="text-muted-foreground/60">Wastage</span>
              <span className="text-right font-medium">{currency} {kKonvResult.rincian.wastage.toLocaleString()}</span>
            </div>
            <div className="border-t border-fuchsia-200/30 dark:border-fuchsia-800/30 pt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground/60">Total Modal</span>
                <span className="font-semibold">{currency} {kKonvResult.totalCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs font-medium">Harga Jual Ideal</span>
                <span className="text-sm font-bold font-heading text-fuchsia-600 dark:text-fuchsia-400">
                  {currency} {kKonvResult.hargaJual.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground/50">Margin</span>
                <span className="text-xs font-medium text-emerald-600">+{currency} {kKonvResult.margin.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <Button size="sm" className="w-full" disabled={!kProduct || !kPrice} onClick={tambahKeCart}>
        <Plus className="size-3.5" /> Tambah ke Keranjang
      </Button>
    </div>
  );
}
