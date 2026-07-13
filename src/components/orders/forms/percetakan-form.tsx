"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  hitungCetakMeteran,
  hitungCetakBuku,
  type PrintingType,
} from "@/store/useBusinessStore";
import { Plus, Ruler, BookOpen } from "lucide-react";
import toast from "react-hot-toast";

const KERTAS_OPTIONS = [
  { label: "HVS 70gr", value: 70 },
  { label: "HVS 80gr", value: 85 },
  { label: "Art Paper", value: 150 },
  { label: "BC Paper", value: 200 },
];

const COVER_OPTIONS = [
  { label: "Tanpa Cover", value: 0 },
  { label: "Soft Cover", value: 5000 },
  { label: "Hard Cover", value: 15000 },
  { label: "Jilid Spiral", value: 8000 },
];

const JILID_OPTIONS = [
  { label: "Lem Panas", value: 3000 },
  { label: "Spiral Kawat", value: 5000 },
  { label: "Spiral Plastik", value: 4000 },
  { label: "Ring Binder", value: 7000 },
];

interface PercetakanFormProps {
  currency: string;
  onAddToCart: (desc: string, price: number) => void;
}

export default function PercetakanForm({ currency, onAddToCart }: PercetakanFormProps) {
  const [cetakType, setCetakType] = useState<PrintingType>("meteran");

  const [cP, setCP] = useState(0);
  const [cL, setCL] = useState(0);
  const [cQty, setCQty] = useState(1);
  const [cModal, setCModal] = useState(0);

  const [cHalaman, setCHalaman] = useState(0);
  const [cKertas, setCKertas] = useState(70);
  const [cCover, setCCover] = useState(0);
  const [cJilid, setCJilid] = useState(0);

  const cetakResult = useMemo(() => {
    if (cetakType === "meteran") {
      return cP > 0 && cL > 0 && cModal > 0
        ? hitungCetakMeteran(cP, cL, cQty, cModal)
        : null;
    }
    return cHalaman > 0
      ? hitungCetakBuku(cHalaman, cKertas, 100, cCover, cJilid, cQty)
      : null;
  }, [cetakType, cP, cL, cQty, cModal, cHalaman, cKertas, cCover, cJilid]);

  const tambahKeCart = () => {
    if (!cetakResult) return;
    const label =
      cetakType === "meteran"
        ? `Cetak Meteran ${cP}x${cL}cm x${cQty}`
        : `Cetak Buku ${cHalaman}hlm x${cQty}`;
    onAddToCart(label, cetakResult.hargaJual);
    toast.success("Item percetakan ditambahkan");
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-1 bg-muted/60 rounded-xl w-fit">
        <button
          onClick={() => setCetakType("meteran")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            cetakType === "meteran"
              ? "bg-white dark:bg-card shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Ruler className="size-3.5" /> Cetak Meteran
        </button>
        <button
          onClick={() => setCetakType("buku")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            cetakType === "buku"
              ? "bg-white dark:bg-card shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookOpen className="size-3.5" /> Cetak Buku
        </button>
      </div>

      {cetakType === "meteran" ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Panjang (cm)</Label>
            <Input type="number" value={cP || ""} onChange={(e) => setCP(Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Lebar (cm)</Label>
            <Input type="number" value={cL || ""} onChange={(e) => setCL(Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Qty</Label>
            <Input type="number" value={cQty} onChange={(e) => setCQty(Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Modal/cm&sup2;</Label>
            <Input type="number" value={cModal || ""} onChange={(e) => setCModal(Number(e.target.value))} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Jumlah Halaman</Label>
            <Input type="number" value={cHalaman || ""} onChange={(e) => setCHalaman(Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Jenis Kertas</Label>
            <select value={cKertas} onChange={(e) => setCKertas(Number(e.target.value))}
              className="input-premium">
              {KERTAS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Opsi Cover</Label>
            <select value={cCover} onChange={(e) => setCCover(Number(e.target.value))}
              className="input-premium">
              {COVER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Tipe Jilid</Label>
            <select value={cJilid} onChange={(e) => setCJilid(Number(e.target.value))}
              className="input-premium">
              {JILID_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Qty</Label>
            <Input type="number" value={cQty} onChange={(e) => setCQty(Number(e.target.value))} />
          </div>
        </div>
      )}

      {cetakResult && (
        <div className="bg-gradient-to-br from-emerald-50/80 to-emerald-100/30 dark:from-emerald-950/20 dark:to-emerald-900/10 border border-emerald-200/40 dark:border-emerald-800/30 rounded-2xl p-4 space-y-2 animate-scale-in">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground/70">Modal Produksi (+5% waste)</span>
            <span className="text-sm font-bold">{currency} {cetakResult.totalCost.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between border-t border-emerald-200/30 dark:border-emerald-800/30 pt-2">
            <span className="text-xs font-medium text-muted-foreground/70">Harga Jual</span>
            <span className="text-lg font-bold font-heading text-emerald-600 dark:text-emerald-400">
              {currency} {cetakResult.hargaJual.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-muted-foreground/50">Margin</span>
            <span className="text-xs font-medium text-emerald-600/70 dark:text-emerald-400/70">
              +{currency} {cetakResult.margin.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      <Button size="sm" className="w-full" disabled={!cetakResult} onClick={tambahKeCart}>
        <Plus className="size-3.5" /> Tambah ke Keranjang
      </Button>
    </div>
  );
}
