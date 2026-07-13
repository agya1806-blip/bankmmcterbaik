"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBusinessStore, hitungCetakMeteran, hitungCetakBuku, hitungTukarTambah, hitungKonveksi } from "@/store/useBusinessStore";
import { useWorkspaceStore } from "@/engines/workspace/workspace-store";
import {
  Printer, Smartphone, Monitor, Coffee, Shirt, Plus, AlertTriangle, Calculator
} from "lucide-react";
import toast from "react-hot-toast";

type UnitId = "percetakan" | "gadget" | "laptop" | "kedai_kopi" | "konveksi";

const UNITS: { id: UnitId; label: string; icon: typeof Printer; color: string; desc: string }[] = [
  { id: "percetakan", label: "Percetakan", icon: Printer, color: "from-violet-500 to-violet-600", desc: "Cetak meteran & buku" },
  { id: "gadget", label: "Gadget", icon: Smartphone, color: "from-cyan-500 to-cyan-600", desc: "HP, IMEI, garansi" },
  { id: "laptop", label: "Laptop & PC", icon: Monitor, color: "from-emerald-500 to-teal-500", desc: "Rakitan, SN, bundling" },
  { id: "kedai_kopi", label: "Kedai Kopi", icon: Coffee, color: "from-amber-500 to-orange-500", desc: "POS kasir, stok BOM" },
  { id: "konveksi", label: "Konveksi", icon: Shirt, color: "from-fuchsia-500 to-pink-500", desc: "SKU warna/ukuran, kain" },
];

function PercetakanPanel() {
  const { addPrintingJob } = useBusinessStore();
  const [type, setType] = useState<"meteran" | "buku">("meteran");
  const [p, setP] = useState(0); const [l, setL] = useState(0); const [qty, setQty] = useState(1);
  const [modal, setModal] = useState(0);
  const [halaman, setHalaman] = useState(0); const [kertas, setKertas] = useState(2);
  const [cover, setCover] = useState(0); const [jilid, setJilid] = useState(0);
  const { activeWorkspace } = useWorkspaceStore();

  const result = useMemo(() => {
    if (type === "meteran") return p > 0 && l > 0 && modal > 0 ? hitungCetakMeteran(p, l, qty, modal) : null;
    return halaman > 0 ? hitungCetakBuku(halaman, kertas, cover, jilid, qty) : null;
  }, [type, p, l, qty, modal, halaman, kertas, cover, jilid]);

  const simpan = () => {
    if (!activeWorkspace) return;
    addPrintingJob({
      id: crypto.randomUUID(), type,
      panjang: p, lebar: l, qty, pages: halaman, coverCost: cover, jilidCost: jilid,
      totalCost: result?.totalCost ?? 0, hargaJual: result?.hargaJual ?? 0,
    });
    toast.success("Job cetak tersimpan");
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button size="sm" variant={type === "meteran" ? "default" : "outline"} onClick={() => setType("meteran")}>Meteran</Button>
        <Button size="sm" variant={type === "buku" ? "default" : "outline"} onClick={() => setType("buku")}>Buku</Button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {type === "meteran" ? (
          <>
            <div><Label className="text-xs">P (cm)</Label><Input type="number" value={p || ""} onChange={(e) => setP(Number(e.target.value))} /></div>
            <div><Label className="text-xs">L (cm)</Label><Input type="number" value={l || ""} onChange={(e) => setL(Number(e.target.value))} /></div>
            <div><Label className="text-xs">Qty</Label><Input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} /></div>
            <div><Label className="text-xs">Modal/cm²</Label><Input type="number" value={modal || ""} onChange={(e) => setModal(Number(e.target.value))} /></div>
          </>
        ) : (
          <>
            <div><Label className="text-xs">Halaman</Label><Input type="number" value={halaman || ""} onChange={(e) => setHalaman(Number(e.target.value))} /></div>
            <div><Label className="text-xs">Kertas/lembar</Label><Input type="number" value={kertas} onChange={(e) => setKertas(Number(e.target.value))} /></div>
            <div><Label className="text-xs">Cover</Label><Input type="number" value={cover || ""} onChange={(e) => setCover(Number(e.target.value))} /></div>
            <div><Label className="text-xs">Jilid</Label><Input type="number" value={jilid || ""} onChange={(e) => setJilid(Number(e.target.value))} /></div>
            <div><Label className="text-xs">Qty</Label><Input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} /></div>
          </>
        )}
      </div>
      {result && (
        <div className="p-3 bg-muted/40 rounded-xl space-y-1 text-sm">
          <p>Modal: <strong>{activeWorkspace?.currency} {result.totalCost.toLocaleString()}</strong></p>
          <p>Harga Jual: <strong className="text-emerald-600">{activeWorkspace?.currency} {result.hargaJual.toLocaleString()}</strong></p>
        </div>
      )}
      <Button size="sm" onClick={simpan}><Plus className="size-3" /> Simpan Job</Button>
    </div>
  );
}

function GadgetPanel() {
  const { addGadgetItem } = useBusinessStore();
  const [imei1, setImei1] = useState(""); const [imei2, setImei2] = useState("");
  const [model, setModel] = useState(""); const [hpp, setHpp] = useState(0); const [price, setPrice] = useState(0);
  const [warranty, setWarranty] = useState("");
  const [tukar, setTukar] = useState(0); const [tukarResult, setTukarResult] = useState<{ bayar: number; hppBekas: number } | null>(null);
  const { activeWorkspace } = useWorkspaceStore();

  const simpan = () => {
    if (!activeWorkspace) return;
    addGadgetItem({
      id: crypto.randomUUID(),
      imei1, imei2: imei2 || undefined, model, warrantyEnd: warranty,
      hpp, price, tukarTambahValue: tukar || undefined,
    });
    toast.success("Unit gadget tersimpan");
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Label className="text-xs">IMEI 1</Label><Input value={imei1} onChange={(e) => setImei1(e.target.value)} /></div>
        <div className="col-span-2"><Label className="text-xs">IMEI 2 (optional)</Label><Input value={imei2} onChange={(e) => setImei2(e.target.value)} /></div>
        <div className="col-span-2"><Label className="text-xs">Model</Label><Input value={model} onChange={(e) => setModel(e.target.value)} /></div>
        <div><Label className="text-xs">Garansi s/d</Label><Input type="date" value={warranty} onChange={(e) => setWarranty(e.target.value)} /></div>
        <div><Label className="text-xs">HPP</Label><Input type="number" value={hpp || ""} onChange={(e) => setHpp(Number(e.target.value))} /></div>
        <div><Label className="text-xs">Harga Jual</Label><Input type="number" value={price || ""} onChange={(e) => setPrice(Number(e.target.value))} /></div>
      </div>
      <div className="border-t pt-3">
        <Label className="text-xs">Tukar Tambah — Taksiran Bekas</Label>
        <div className="flex gap-2 mt-1">
          <Input type="number" value={tukar || ""} onChange={(e) => setTukar(Number(e.target.value))} placeholder="Nilai taksiran" />
          <Button size="sm" variant="secondary" onClick={() => setTukarResult(hitungTukarTambah(price || 0, tukar))}>
            <Calculator className="size-3" /> Hitung
          </Button>
        </div>
        {tukarResult && (
          <p className="text-xs mt-2 text-muted-foreground">Bayar: {activeWorkspace?.currency} {tukarResult.bayar.toLocaleString()} | HPP Bekas: {activeWorkspace?.currency} {tukarResult.hppBekas.toLocaleString()}</p>
        )}
      </div>
      <Button size="sm" onClick={simpan}><Plus className="size-3" /> Simpan Unit</Button>
    </div>
  );
}

function LaptopPanel() {
  const { addLaptopBuild } = useBusinessStore();
  const [sn, setSn] = useState(""); const [parts, setParts] = useState<{ name: string; price: number }[]>([]);
  const [partName, setPartName] = useState(""); const [partPrice, setPartPrice] = useState(0);
  const [price, setPrice] = useState(0); const [invNo, setInvNo] = useState("");
  const { activeWorkspace } = useWorkspaceStore();

  const totalHpp = parts.reduce((s, p) => s + p.price, 0);

  const addPart = () => {
    if (!partName) return;
    setParts([...parts, { name: partName, price: partPrice }]);
    setPartName(""); setPartPrice(0);
  };

  const simpan = () => {
    if (!activeWorkspace) return;
    addLaptopBuild({
      id: crypto.randomUUID(),
      sn, parts, totalHpp, price, invoiceNumber: invNo,
    });
    toast.success("Build PC tersimpan");
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Label className="text-xs">Serial Number (SN)</Label><Input value={sn} onChange={(e) => setSn(e.target.value)} /></div>
      </div>
      <div>
        <Label className="text-xs">Komponen Rakitan</Label>
        <div className="flex gap-2 mt-1">
          <Input value={partName} onChange={(e) => setPartName(e.target.value)} placeholder="Nama part" className="flex-1" />
          <Input type="number" value={partPrice || ""} onChange={(e) => setPartPrice(Number(e.target.value))} placeholder="Harga" className="w-24" />
          <Button size="sm" variant="secondary" onClick={addPart}><Plus className="size-3" /></Button>
        </div>
        {parts.length > 0 && (
          <div className="mt-2 space-y-1">
            {parts.map((p, i) => (
              <div key={i} className="flex justify-between text-xs p-1.5 bg-muted/30 rounded-lg">
                <span>{p.name}</span>
                <span className="font-medium">{activeWorkspace?.currency} {p.price.toLocaleString()}</span>
              </div>
            ))}
            <p className="text-xs font-medium text-right">Total HPP: {activeWorkspace?.currency} {totalHpp.toLocaleString()}</p>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs">Harga Jual</Label><Input type="number" value={price || ""} onChange={(e) => setPrice(Number(e.target.value))} /></div>
        <div><Label className="text-xs">No. Invoice</Label><Input value={invNo} onChange={(e) => setInvNo(e.target.value)} /></div>
      </div>
      <Button size="sm" onClick={simpan} disabled={!sn}><Plus className="size-3" /> Simpan Build</Button>
    </div>
  );
}

function KedaiKopiPanel() {
  const { coffeeIngredients, addCoffeeIngredient, reduceStock } = useBusinessStore();
  const [name, setName] = useState(""); const [stock, setStock] = useState(0); const [minStock, setMinStock] = useState(0);
  const [sellName, setSellName] = useState(""); const [sellGram, setSellGram] = useState(0);

  const addIng = () => {
    if (!name) return;
    addCoffeeIngredient({ id: crypto.randomUUID(), name, stockGram: stock, minStockThreshold: minStock });
    setName(""); setStock(0); setMinStock(0);
    toast.success("Bahan baku ditambahkan");
  };

  const sell = () => {
    if (!sellName || !sellGram) return;
    const found = coffeeIngredients.find((c) => c.name.toLowerCase() === sellName.toLowerCase());
    if (!found) { toast.error("Bahan tidak ditemukan"); return; }
    const ok = reduceStock(found.id, sellGram);
    if (!ok) { toast.error("Stok tidak mencukupi"); return; }
    toast.success(`Stok ${found.name} berkurang ${sellGram}g`);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2"><Label className="text-xs">Nama Bahan</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div><Label className="text-xs">Stok (g)</Label><Input type="number" value={stock || ""} onChange={(e) => setStock(Number(e.target.value))} /></div>
        <div><Label className="text-xs">Min. Stok (g)</Label><Input type="number" value={minStock || ""} onChange={(e) => setMinStock(Number(e.target.value))} /></div>
        <Button size="sm" onClick={addIng} className="col-span-3"><Plus className="size-3" /> Tambah Bahan</Button>
      </div>
      {coffeeIngredients.length > 0 && (
        <>
          <div className="border-t pt-3">
            <Label className="text-xs">Jual Menu (kurangi stok)</Label>
            <div className="flex gap-2 mt-1">
              <Input value={sellName} onChange={(e) => setSellName(e.target.value)} placeholder="Nama bahan" className="flex-1" />
              <Input type="number" value={sellGram || ""} onChange={(e) => setSellGram(Number(e.target.value))} placeholder="Gram" className="w-20" />
              <Button size="sm" onClick={sell}>Pakai</Button>
            </div>
          </div>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {coffeeIngredients.map((c) => {
              const low = c.stockGram < c.minStockThreshold;
              return (
                <div key={c.id} className={`flex justify-between items-center p-2 rounded-lg text-xs ${low ? "bg-red-50 dark:bg-red-950/20" : "bg-muted/30"}`}>
                  <span>{c.name}</span>
                  <span className={`font-medium ${low ? "text-red-600" : ""}`}>{c.stockGram}g {low && <AlertTriangle className="inline size-3 text-red-500" />}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function KonveksiPanel() {
  const { addFashionSKU } = useBusinessStore();
  const [productName, setProductName] = useState(""); const [color, setColor] = useState("");
  const [size, setSize] = useState(""); const [price, setPrice] = useState(0); const [stock, setStock] = useState(0);
  const [berat, setBerat] = useState(0); const [hargaKain, setHargaKain] = useState(0);
  const [cmt, setCmt] = useState(0); const [sablon, setSablon] = useState(0); const [wastage, setWastage] = useState(5);
  const [konvResult, setKonvResult] = useState<{ totalCost: number; hargaJual: number } | null>(null);
  const { activeWorkspace } = useWorkspaceStore();

  const addSku = () => {
    if (!productName) return;
    addFashionSKU({ id: crypto.randomUUID(), productName, color, size, price, stock });
    toast.success("SKU ditambahkan");
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Label className="text-xs">Nama Produk</Label><Input value={productName} onChange={(e) => setProductName(e.target.value)} /></div>
        <div><Label className="text-xs">Warna</Label><Input value={color} onChange={(e) => setColor(e.target.value)} /></div>
        <div><Label className="text-xs">Ukuran</Label><Input value={size} onChange={(e) => setSize(e.target.value)} /></div>
        <div><Label className="text-xs">Harga Jual</Label><Input type="number" value={price || ""} onChange={(e) => setPrice(Number(e.target.value))} /></div>
        <div><Label className="text-xs">Stok</Label><Input type="number" value={stock || ""} onChange={(e) => setStock(Number(e.target.value))} /></div>
        <Button size="sm" onClick={addSku} className="col-span-2"><Plus className="size-3" /> Tambah SKU</Button>
      </div>
      <div className="border-t pt-3">
        <Label className="text-xs">Kalkulator Biaya Konveksi</Label>
        <div className="grid grid-cols-3 gap-2 mt-1">
          <div><Label className="text-[10px]">Berat Kain (kg)</Label><Input type="number" value={berat || ""} onChange={(e) => setBerat(Number(e.target.value))} /></div>
          <div><Label className="text-[10px]">Harga/kg</Label><Input type="number" value={hargaKain || ""} onChange={(e) => setHargaKain(Number(e.target.value))} /></div>
          <div><Label className="text-[10px]">CMT Jahit</Label><Input type="number" value={cmt || ""} onChange={(e) => setCmt(Number(e.target.value))} /></div>
          <div><Label className="text-[10px]">Sablon</Label><Input type="number" value={sablon || ""} onChange={(e) => setSablon(Number(e.target.value))} /></div>
          <div><Label className="text-[10px]">Wastage %</Label><Input type="number" value={wastage} onChange={(e) => setWastage(Number(e.target.value))} /></div>
          <div className="flex items-end">
            <Button size="sm" variant="secondary" onClick={() => setKonvResult(hitungKonveksi(berat, hargaKain, cmt, sablon, wastage))}><Calculator className="size-3" /> Hitung</Button>
          </div>
        </div>
        {konvResult && (
          <p className="text-xs mt-2 text-muted-foreground">Modal: {activeWorkspace?.currency} {konvResult.totalCost.toLocaleString()} | Jual: <strong className="text-emerald-600">{activeWorkspace?.currency} {konvResult.hargaJual.toLocaleString()}</strong></p>
        )}
      </div>
    </div>
  );
}

export default function BukuUsahaPage() {
  const [activeUnit, setActiveUnit] = useState<UnitId>("percetakan");

  const panel: Record<UnitId, React.ReactNode> = {
    percetakan: <PercetakanPanel />,
    gadget: <GadgetPanel />,
    laptop: <LaptopPanel />,
    kedai_kopi: <KedaiKopiPanel />,
    konveksi: <KonveksiPanel />,
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div>
        <h1 className="text-xl font-bold font-heading">Buku Usaha Hub</h1>
        <p className="text-sm text-muted-foreground/60">Kelola 5 lini bisnis dalam satu atap</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {UNITS.map((u) => {
          const Icon = u.icon;
          return (
            <button key={u.id} onClick={() => setActiveUnit(u.id)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                activeUnit === u.id
                  ? `bg-gradient-to-br ${u.color} text-white shadow-lg scale-[1.02] border-transparent`
                  : "bg-card/60 hover:bg-card border-border/40"
              }`}
            >
              <Icon className="size-7" />
              <span className="text-xs font-semibold">{u.label}</span>
            </button>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-5">
          {panel[activeUnit]}
        </CardContent>
      </Card>
    </div>
  );
}
