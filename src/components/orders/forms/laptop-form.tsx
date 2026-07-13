"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Monitor, Cpu, X } from "lucide-react";
import toast from "react-hot-toast";

interface LaptopFormProps {
  currency: string;
  onAddToCart: (desc: string, price: number) => void;
}

export default function LaptopForm({ currency, onAddToCart }: LaptopFormProps) {
  const [lSn, setLSn] = useState("");
  const [lParts, setLParts] = useState<
    { name: string; sn: string; price: number }[]
  >([]);
  const [lPartName, setLPartName] = useState("");
  const [lPartSn, setLPartSn] = useState("");
  const [lPartPrice, setLPartPrice] = useState(0);
  const [lPrice, setLPrice] = useState(0);
  const [lInvNo, setLInvNo] = useState("");

  const totalHpp = lParts.reduce((s, p) => s + p.price, 0);

  const tambahPart = () => {
    if (!lPartName) return;
    setLParts([
      ...lParts,
      { name: lPartName, sn: lPartSn, price: lPartPrice },
    ]);
    setLPartName("");
    setLPartSn("");
    setLPartPrice(0);
  };

  const hapusPart = (idx: number) => {
    setLParts(lParts.filter((_, i) => i !== idx));
  };

  const tambahKeCart = () => {
    if (!lSn || lParts.length === 0 || !lPrice) return;
    const name = `PC Rakitan [${lSn}] — ${lParts.length} part`;
    onAddToCart(name, lPrice);
    toast.success("Build PC ditambahkan");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <Monitor className="size-5 text-emerald-500" />
        <span className="text-xs font-medium text-muted-foreground/70">Rakitan Laptop / PC</span>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground">Serial Number (SN) Nota</Label>
        <Input value={lSn} onChange={(e) => setLSn(e.target.value)} placeholder="Kunci SN ke invoice" />
      </div>

      <div className="floating-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="size-4 text-muted-foreground/60" />
            <Label className="text-xs font-semibold">Komponen Rakitan</Label>
          </div>
          {lParts.length > 0 && (
            <span className="text-[10px] font-medium text-muted-foreground/50">{lParts.length} part</span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-3 space-y-1">
            <Label className="text-[10px] text-muted-foreground/60">Nama Komponen</Label>
            <Input value={lPartName} onChange={(e) => setLPartName(e.target.value)} placeholder="Prosesor, RAM, dll" className="h-9 text-xs" />
          </div>
          <div className="col-span-2 space-y-1">
            <Label className="text-[10px] text-muted-foreground/60">SN Unik</Label>
            <Input value={lPartSn} onChange={(e) => setLPartSn(e.target.value)} placeholder="Serial number" className="h-9 text-xs" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground/60">Harga</Label>
            <Input type="number" value={lPartPrice || ""} onChange={(e) => setLPartPrice(Number(e.target.value))} className="h-9 text-xs" />
          </div>
        </div>

        <Button size="sm" variant="secondary" onClick={tambahPart} disabled={!lPartName}>
          <Plus className="size-3" /> Tambah Part
        </Button>

        {lParts.length > 0 && (
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {lParts.map((p, i) => (
              <div key={i} className="group flex items-center justify-between p-2 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground/50">{p.sn ? `SN: ${p.sn}` : "No SN"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">{currency} {p.price.toLocaleString()}</span>
                  <button onClick={() => hapusPart(i)}
                    className="size-6 flex items-center justify-center rounded-lg text-muted-foreground/30 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100">
                    <X className="size-3" />
                  </button>
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center pt-2 border-t border-border/40">
              <span className="text-[10px] text-muted-foreground/50">Total HPP</span>
              <span className="text-xs font-bold">{currency} {totalHpp.toLocaleString()}</span>
            </div>
          </div>
        )}

        {lParts.length === 0 && (
          <div className="text-center py-4">
            <Cpu className="size-6 mx-auto text-muted-foreground/20 mb-1" />
            <p className="text-[10px] text-muted-foreground/40">Belum ada komponen</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Harga Jual</Label>
          <Input type="number" value={lPrice || ""} onChange={(e) => setLPrice(Number(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">No. Invoice</Label>
          <Input value={lInvNo} onChange={(e) => setLInvNo(e.target.value)} />
        </div>
      </div>

      <Button size="sm" className="w-full" disabled={!lSn || lParts.length === 0 || !lPrice} onClick={tambahKeCart}>
        <Plus className="size-3.5" /> Tambah ke Keranjang
      </Button>
    </div>
  );
}
