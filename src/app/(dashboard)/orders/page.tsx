"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useWorkspaceStore } from "@/engines/workspace/workspace-store";
import { useOrderStore } from "@/engines/business/order-store";
import { useBusinessStore, hitungCetakMeteran, hitungCetakBuku, hitungTukarTambah, hitungKonveksi } from "@/store/useBusinessStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search, Plus, Minus, Trash2, ShoppingCart, Image, UploadCloud, Phone,
  Printer, Smartphone, Monitor, Coffee, Shirt, Calculator, AlertTriangle
} from "lucide-react";
import type { Customer, Product } from "@/lib/db";
import {
  exportToPNG, exportToPDF, sendWhatsAppReceipt, exportToExcel, pesananKeSheet,
} from "@/utils/exporter";
import toast from "react-hot-toast";

type BizUnit = "percetakan" | "gadget" | "laptop" | "kedai_kopi" | "konveksi";

const BIZ_UNITS: { id: BizUnit; label: string; icon: typeof Printer; color: string }[] = [
  { id: "percetakan", label: "Percetakan", icon: Printer, color: "from-violet-500 to-violet-600" },
  { id: "gadget", label: "Gadget", icon: Smartphone, color: "from-cyan-500 to-cyan-600" },
  { id: "laptop", label: "Laptop/PC", icon: Monitor, color: "from-emerald-500 to-teal-500" },
  { id: "kedai_kopi", label: "Kedai Kopi", icon: Coffee, color: "from-amber-500 to-orange-500" },
  { id: "konveksi", label: "Konveksi", icon: Shirt, color: "from-fuchsia-500 to-pink-500" },
];

interface CartItem {
  id: string; description: string; quantity: number; unitPrice: number; total: number; bizUnit: BizUnit;
}

/* ─── Menu Kopi & BOM ─── */
const COFFEE_MENU = [
  { name: "Espresso", price: 15000, bom: { coffee: 18, milk: 0 } },
  { name: "Kopi Susu", price: 18000, bom: { coffee: 14, milk: 120 } },
  { name: "Latte", price: 22000, bom: { coffee: 16, milk: 200 } },
  { name: "Cappuccino", price: 20000, bom: { coffee: 16, milk: 150 } },
  { name: "Americano", price: 15000, bom: { coffee: 18, milk: 0 } },
  { name: "Mocca", price: 25000, bom: { coffee: 16, milk: 180 } },
  { name: "Matcha Latte", price: 24000, bom: { coffee: 0, milk: 200 } },
  { name: "Red Velvet", price: 26000, bom: { coffee: 0, milk: 200 } },
];

/* ─── Kertas & Jilid Options ─── */
const KERTAS_OPTIONS = [
  { label: "HVS 70gr", value: 70 }, { label: "HVS 80gr", value: 85 },
  { label: "Art Paper", value: 150 }, { label: "BC Paper", value: 200 },
];
const COVER_OPTIONS = [
  { label: "Tanpa Cover", value: 0 }, { label: "Soft Cover", value: 5000 },
  { label: "Hard Cover", value: 15000 }, { label: "Jilid Spiral", value: 8000 },
];
const JILID_OPTIONS = [
  { label: "Lem Panas", value: 3000 }, { label: "Spiral Kawat", value: 5000 },
  { label: "Spiral Plastik", value: 4000 }, { label: "Ring Binder", value: 7000 },
];

export default function POSPage() {
  const { activeWorkspace } = useWorkspaceStore();
  const { addOrder, loadOrders } = useOrderStore();
  const { fashionSKUs, coffeeIngredients, addCoffeeIngredient, reduceStock } = useBusinessStore();
  const receiptRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  /* ─── State Umum ─── */
  const [mounted, setMounted] = useState(false);
  const [bizUnit, setBizUnit] = useState<BizUnit>("percetakan");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerQuery, setCustomerQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [bayar, setBayar] = useState(0);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [catatan, setCatatan] = useState("");
  const [coffeeStockName, setCoffeeStockName] = useState("");
  const [coffeeStockGram, setCoffeeStockGram] = useState(0);
  const [coffeeMinStock, setCoffeeMinStock] = useState(0);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!activeWorkspace) return;
    loadOrders(activeWorkspace.id);
    import("@/lib/db").then((db) => {
      db.getCustomersByWorkspace(activeWorkspace.id).then(setCustomers);
      db.getProductsByWorkspace(activeWorkspace.id).then(setProducts);
    });
  }, [activeWorkspace, loadOrders]);

  const filteredCustomers = useMemo(() => {
    if (!customerQuery) return customers.slice(0, 5);
    const q = customerQuery.toLowerCase();
    return customers.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)).slice(0, 8);
  }, [customers, customerQuery]);

  const subtotal = cart.reduce((s, i) => s + i.total, 0);
  const totalBayar = Math.max(0, subtotal - discount);
  const kembalian = Math.max(0, bayar - totalBayar);

  const pilihCustomer = (c: Customer) => { setSelectedCustomer(c); setCustomerQuery(c.name); setShowCustomerDropdown(false); };
  const addToCart = (desc: string, price: number, unit: BizUnit) => {
    setCart((p) => { const e = p.find((i) => i.description === desc && i.bizUnit === unit); if (e) return p.map((i) => i.id === e.id ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unitPrice } : i); return [...p, { id: crypto.randomUUID(), description: desc, quantity: 1, unitPrice: price, total: price, bizUnit: unit }]; });
  };
  const ubahQty = (id: string, q: number) => { if (q < 1) return; setCart((p) => p.map((i) => i.id === id ? { ...i, quantity: q, total: q * i.unitPrice } : i)); };
  const hapusItem = (id: string) => setCart((p) => p.filter((i) => i.id !== id));

  const simpanOrder = useCallback(async () => {
    if (!activeWorkspace || cart.length === 0) return;
    await addOrder({
      workspaceId: activeWorkspace.id, type: "umum", status: "baru",
      paymentStatus: totalBayar <= 0 ? "Belum Lunas" : bayar >= totalBayar ? "Lunas" : "DP",
      customerId: selectedCustomer?.id || "", customerName: selectedCustomer?.name || "Umum",
      customerPhone: selectedCustomer?.phone || "", customerAddress: selectedCustomer?.address || "",
      items: cart.map((i) => ({ id: i.id, description: i.description, quantity: i.quantity, unitPrice: i.unitPrice, total: i.total })),
      subtotal, discount, total: totalBayar, dp: bayar < totalBayar ? bayar : totalBayar, remaining: Math.max(0, totalBayar - bayar),
      walletId: "", specs: {}, notes: catatan, date: new Date().toISOString().slice(0, 10), dueDate: new Date().toISOString().slice(0, 10),
    });
    setCart([]); setDiscount(0); setBayar(0); setCatatan("");
    toast.success("Pesanan tersimpan");
  }, [activeWorkspace, cart, discount, totalBayar, bayar, catatan, selectedCustomer, addOrder, subtotal]);

  /* ─── State Percetakan ─── */
  const [cetakType, setCetakType] = useState<"meteran" | "buku">("meteran");
  const [cP, setCP] = useState(0); const [cL, setCL] = useState(0); const [cQty, setCQty] = useState(1);
  const [cModal, setCModal] = useState(0);
  const [cHalaman, setCHalaman] = useState(0); const [cKertas, setCKertas] = useState(70);
  const [cCover, setCCover] = useState(0); const [cJilid, setCJilid] = useState(0);
  const cetakResult = useMemo(() => {
    if (cetakType === "meteran") return cP > 0 && cL > 0 && cModal > 0 ? hitungCetakMeteran(cP, cL, cQty, cModal) : null;
    return cHalaman > 0 ? hitungCetakBuku(cHalaman, cKertas, cCover, cJilid, cQty) : null;
  }, [cetakType, cP, cL, cQty, cModal, cHalaman, cKertas, cCover, cJilid]);

  /* ─── State Gadget ─── */
  const [gImei1, setGImei1] = useState(""); const [gImei2, setGImei2] = useState("");
  const [gModel, setGModel] = useState(""); const [gHpp, setGHpp] = useState(0); const [gPrice, setGPrice] = useState(0);
  const [gWarranty, setGWarranty] = useState(""); const [tukarMode, setTukarMode] = useState(false);
  const [gTukar, setGTukar] = useState(0); const [gTukarResult, setGTukarResult] = useState<{ bayar: number; hppBekas: number } | null>(null);

  /* ─── State Laptop ─── */
  const [lSn, setLSn] = useState(""); const [lParts, setLParts] = useState<{ name: string; sn: string; price: number }[]>([]);
  const [lPartName, setLPartName] = useState(""); const [lPartSn, setLPartSn] = useState(""); const [lPartPrice, setLPartPrice] = useState(0);
  const [lPrice, setLPrice] = useState(0); const [lInvNo, setLInvNo] = useState("");
  const totalHpp = lParts.reduce((s, p) => s + p.price, 0);

  /* ─── State Kedai Kopi ─── */
  const [kopiBahan, setKopiBahan] = useState(""); const [kopiGram, setKopiGram] = useState(0);

  /* ─── State Konveksi ─── */
  const [kProduct, setKProduct] = useState(""); const [kColor, setKColor] = useState(""); const [kSize, setKSize] = useState("S");
  const [kPrice, setKPrice] = useState(0); const [kStock, setKStock] = useState(0);
  const [kBerat, setKBerat] = useState(0); const [kHargaKain, setKHargaKain] = useState(0);
  const [kCmt, setKCmt] = useState(0); const [kSablon, setKSablon] = useState(0); const [kWastage, setKWastage] = useState(5);
  const [kKonvResult, setKKonvResult] = useState<{ totalCost: number; hargaJual: number } | null>(null);

  const handleQR = useCallback((file: File) => {
    if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) { toast.error("Hanya PNG/JPG"); return; }
    const reader = new FileReader(); reader.onload = (e) => setQrImage(e.target?.result as string); reader.readAsDataURL(file);
  }, []);

  if (!mounted) return <div className="min-h-[60vh]" />;
  if (!activeWorkspace) return null;

  const renderBizForm = () => {
    switch (bizUnit) {
      /* ═══════ PERCETAKAN ═══════ */
      case "percetakan": return (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button size="sm" variant={cetakType === "meteran" ? "default" : "outline"} onClick={() => setCetakType("meteran")}>Cetak Meteran</Button>
            <Button size="sm" variant={cetakType === "buku" ? "default" : "outline"} onClick={() => setCetakType("buku")}>Cetak Buku</Button>
          </div>
          {cetakType === "meteran" ? (
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Panjang (cm)</Label><Input type="number" value={cP || ""} onChange={(e) => setCP(Number(e.target.value))} /></div>
              <div><Label className="text-xs">Lebar (cm)</Label><Input type="number" value={cL || ""} onChange={(e) => setCL(Number(e.target.value))} /></div>
              <div><Label className="text-xs">Qty</Label><Input type="number" value={cQty} onChange={(e) => setCQty(Number(e.target.value))} /></div>
              <div><Label className="text-xs">Harga Modal/cm²</Label><Input type="number" value={cModal || ""} onChange={(e) => setCModal(Number(e.target.value))} /></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2"><Label className="text-xs">Jumlah Halaman</Label><Input type="number" value={cHalaman || ""} onChange={(e) => setCHalaman(Number(e.target.value))} /></div>
              <div><Label className="text-xs">Jenis Kertas</Label><select value={cKertas} onChange={(e) => setCKertas(Number(e.target.value))} className="w-full h-10 rounded-xl border border-input bg-transparent px-3 text-sm">{KERTAS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
              <div><Label className="text-xs">Opsi Cover</Label><select value={cCover} onChange={(e) => setCCover(Number(e.target.value))} className="w-full h-10 rounded-xl border border-input bg-transparent px-3 text-sm">{COVER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
              <div><Label className="text-xs">Tipe Jilid</Label><select value={cJilid} onChange={(e) => setCJilid(Number(e.target.value))} className="w-full h-10 rounded-xl border border-input bg-transparent px-3 text-sm">{JILID_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
              <div><Label className="text-xs">Qty</Label><Input type="number" value={cQty} onChange={(e) => setCQty(Number(e.target.value))} /></div>
            </div>
          )}
          {cetakResult && <div className="p-3 bg-muted/40 rounded-xl text-sm"><p>Modal: <strong>{activeWorkspace.currency} {cetakResult.totalCost.toLocaleString()}</strong> (+5% waste)</p><p>Harga Jual: <strong className="text-emerald-600">{activeWorkspace.currency} {cetakResult.hargaJual.toLocaleString()}</strong></p></div>}
          <Button size="sm" className="w-full" disabled={!cetakResult} onClick={() => { if (cetakResult) { addToCart(`Cetak ${cetakType === "meteran" ? `Meteran ${cP}x${cL}cm x${cQty}` : `Buku ${cHalaman}hlm x${cQty}`}`, cetakResult.hargaJual, "percetakan"); toast.success("Item ditambahkan"); } }}><Plus className="size-3.5" /> Tambah ke Keranjang</Button>
        </div>
      );

      /* ═══════ GADGET ═══════ */
      case "gadget": return (
        <div className="space-y-3">
          <div><Label className="text-xs">IMEI 1 *</Label><Input value={gImei1} onChange={(e) => setGImei1(e.target.value)} placeholder="Masukkan IMEI utama" /></div>
          <div><Label className="text-xs">IMEI 2 (opsional)</Label><Input value={gImei2} onChange={(e) => setGImei2(e.target.value)} placeholder="IMEI kedua (dual SIM)" /></div>
          <div><Label className="text-xs">Model / Tipe</Label><Input value={gModel} onChange={(e) => setGModel(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Harga Modal</Label><Input type="number" value={gHpp || ""} onChange={(e) => setGHpp(Number(e.target.value))} /></div>
            <div><Label className="text-xs">Harga Jual</Label><Input type="number" value={gPrice || ""} onChange={(e) => setGPrice(Number(e.target.value))} /></div>
            <div className="col-span-2"><Label className="text-xs">Masa Garansi s/d</Label><Input type="date" value={gWarranty} onChange={(e) => setGWarranty(e.target.value)} /></div>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" checked={tukarMode} onChange={(e) => setTukarMode(e.target.checked)} className="rounded" />
              Mode Tukar Tambah
            </label>
          </div>
          {tukarMode && (
            <div className="p-3 border border-cyan-200 dark:border-cyan-800 rounded-xl space-y-2 bg-cyan-50/30 dark:bg-cyan-950/10">
              <Label className="text-xs">Taksiran Unit Bekas</Label>
              <Input type="number" value={gTukar || ""} onChange={(e) => setGTukar(Number(e.target.value))} placeholder="Nilai taksiran" />
              <Button size="sm" variant="secondary" onClick={() => { if (gPrice > 0) { const r = hitungTukarTambah(gPrice, gTukar); setGTukarResult(r); toast.success(`Bayar: ${r.bayar.toLocaleString()}, HPP Bekas: ${r.hppBekas.toLocaleString()}`); } }}><Calculator className="size-3" /> Hitung Tukar Tambah</Button>
              {gTukarResult && <p className="text-xs">Bayar: {activeWorkspace.currency} {gTukarResult.bayar.toLocaleString()} | HPP Bekas: {activeWorkspace.currency} {gTukarResult.hppBekas.toLocaleString()}</p>}
            </div>
          )}
          <Button size="sm" className="w-full" disabled={!gImei1 || !gPrice} onClick={() => { addToCart(`${gModel || "HP"} [IMEI: ${gImei1.slice(0, 8)}...]${tukarMode && gTukarResult ? ` (TT: ${gTukarResult.bayar.toLocaleString()})` : ""}`, tukarMode && gTukarResult ? gTukarResult.bayar : gPrice, "gadget"); toast.success("Item gadget ditambahkan"); }}><Plus className="size-3.5" /> Tambah ke Keranjang</Button>
        </div>
      );

      /* ═══════ LAPTOP/PC ═══════ */
      case "laptop": return (
        <div className="space-y-3">
          <div><Label className="text-xs">Serial Number (SN) Nota</Label><Input value={lSn} onChange={(e) => setLSn(e.target.value)} placeholder="Kunci SN ke invoice" /></div>
          <div className="border rounded-xl p-3 space-y-2">
            <Label className="text-xs font-semibold">Komponen Rakitan</Label>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-3"><Label className="text-[10px]">Nama Komponen</Label><Input value={lPartName} onChange={(e) => setLPartName(e.target.value)} placeholder="Prosesor, RAM, dll" /></div>
              <div className="col-span-2"><Label className="text-[10px]">SN Unik</Label><Input value={lPartSn} onChange={(e) => setLPartSn(e.target.value)} placeholder="Serial number komponen" /></div>
              <div><Label className="text-[10px]">Harga</Label><Input type="number" value={lPartPrice || ""} onChange={(e) => setLPartPrice(Number(e.target.value))} /></div>
            </div>
            <Button size="sm" variant="secondary" onClick={() => { if (!lPartName) return; setLParts([...lParts, { name: lPartName, sn: lPartSn, price: lPartPrice }]); setLPartName(""); setLPartSn(""); setLPartPrice(0); }}><Plus className="size-3" /> Tambah Part</Button>
            {lParts.length > 0 && <div className="space-y-1 max-h-28 overflow-y-auto">{lParts.map((p, i) => <div key={i} className="flex justify-between text-xs p-1.5 bg-muted/30 rounded-lg"><span>{p.name} {p.sn && `[SN: ${p.sn}]`}</span><span className="font-medium">{activeWorkspace.currency} {p.price.toLocaleString()}</span></div>)}<p className="text-xs font-bold text-right">Total HPP: {activeWorkspace.currency} {totalHpp.toLocaleString()}</p></div>}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Harga Jual</Label><Input type="number" value={lPrice || ""} onChange={(e) => setLPrice(Number(e.target.value))} /></div>
            <div><Label className="text-xs">No. Invoice</Label><Input value={lInvNo} onChange={(e) => setLInvNo(e.target.value)} /></div>
          </div>
          <Button size="sm" className="w-full" disabled={!lSn || lParts.length === 0 || !lPrice} onClick={() => { const name = `PC Rakitan [${lSn}] — ${lParts.length} part`; addToCart(name, lPrice, "laptop"); toast.success("Build PC ditambahkan"); }}><Plus className="size-3.5" /> Tambah ke Keranjang</Button>
        </div>
      );

      /* ═══════ KEDAI KOPI ═══════ */
      case "kedai_kopi": return (
        <div className="space-y-3">
          <div className="p-3 border rounded-xl space-y-2">
            <Label className="text-xs font-semibold">Stok Bahan Baku</Label>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2"><Input value={kopiBahan} onChange={(e) => setKopiBahan(e.target.value)} placeholder="Nama bahan" className="h-8 text-xs" /></div>
              <div><Input type="number" value={kopiGram || ""} onChange={(e) => setKopiGram(Number(e.target.value))} placeholder="Gram" className="h-8 text-xs" /></div>
            </div>
            <div className="flex gap-2">
              <Input type="number" value={coffeeMinStock || ""} onChange={(e) => setCoffeeMinStock(Number(e.target.value))} placeholder="Min stok" className="h-8 text-xs flex-1" />
              <Button size="sm" variant="secondary" onClick={() => { if (!kopiBahan) return; addCoffeeIngredient({ id: crypto.randomUUID(), name: kopiBahan, stockGram: kopiGram, minStockThreshold: coffeeMinStock }); setKopiBahan(""); setKopiGram(0); toast.success("Bahan ditambahkan"); }}>Tambah</Button>
            </div>
            {coffeeIngredients.length > 0 && <div className="max-h-20 overflow-y-auto space-y-0.5">{coffeeIngredients.map((c) => { const low = c.stockGram < c.minStockThreshold; return <div key={c.id} className={`flex justify-between text-xs p-1.5 rounded ${low ? "bg-red-50 dark:bg-red-950/20" : "bg-muted/30"}`}><span>{c.name}</span><span className={`font-medium ${low ? "text-red-600" : ""}`}>{c.stockGram}g {low && <AlertTriangle className="inline size-2.5" />}</span></div>; })}</div>}
          </div>
          <Label className="text-xs font-semibold">Menu Kopi</Label>
          <div className="grid grid-cols-2 gap-2">
            {COFFEE_MENU.map((item) => {
              const lowStock = item.bom.coffee > 0 && coffeeIngredients.some((c) => c.stockGram < item.bom.coffee);
              return (
                <button key={item.name} onClick={() => {
                  const ok = item.bom.coffee === 0 || coffeeIngredients.some((c) => c.stockGram >= item.bom.coffee);
                  if (!ok) { toast.error("Stok bahan tidak mencukupi"); return; }
                  if (item.bom.coffee > 0) { coffeeIngredients.forEach((c) => { if (c.name.toLowerCase().includes("kopi") || c.name.toLowerCase().includes("bean")) reduceStock(c.id, item.bom.coffee); }); }
                  addToCart(item.name, item.price, "kedai_kopi");
                  toast.success(`${item.name} ditambahkan`);
                }} className={`relative flex flex-col items-center p-3 rounded-xl border transition-all active:scale-95 ${lowStock ? "border-red-300 bg-red-50/30" : "border-border/40 hover:border-amber-400/50 hover:bg-muted/30"}`}>
                  {lowStock && <Badge variant="destructive" className="absolute -top-1.5 -right-1.5 text-[8px] px-1 py-0">Low Stock</Badge>}
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="text-xs font-bold text-amber-600 mt-1">{activeWorkspace.currency} {item.price.toLocaleString()}</span>
                </button>
              );
            })}
          </div>
        </div>
      );

      /* ═══════ KONVEKSI ═══════ */
      case "konveksi": return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2"><Label className="text-xs">Nama Produk</Label><Input value={kProduct} onChange={(e) => setKProduct(e.target.value)} /></div>
            <div><Label className="text-xs">Ukuran</Label><select value={kSize} onChange={(e) => setKSize(e.target.value)} className="w-full h-10 rounded-xl border border-input bg-transparent px-3 text-sm">{["S", "M", "L", "XL", "XXL", "3XL"].map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><Label className="text-xs">Warna</Label><select value={kColor} onChange={(e) => setKColor(e.target.value)} className="w-full h-10 rounded-xl border border-input bg-transparent px-3 text-sm">{["Hitam", "Putih", "Merah", "Biru", "Hijau", "Kuning", "Abu", "Coklat", "Navy", "Burgundy"].map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
            <div><Label className="text-xs">Harga Jual</Label><Input type="number" value={kPrice || ""} onChange={(e) => setKPrice(Number(e.target.value))} /></div>
            <div><Label className="text-xs">Stok</Label><Input type="number" value={kStock || ""} onChange={(e) => setKStock(Number(e.target.value))} /></div>
          </div>
          <div className="border rounded-xl p-3 space-y-2">
            <Label className="text-xs font-semibold">Kalkulator Biaya Konveksi Custom</Label>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-[10px]">Berat Kain (Kg)</Label><Input type="number" value={kBerat || ""} onChange={(e) => setKBerat(Number(e.target.value))} /></div>
              <div><Label className="text-[10px]">Harga Kain/Kg</Label><Input type="number" value={kHargaKain || ""} onChange={(e) => setKHargaKain(Number(e.target.value))} /></div>
              <div><Label className="text-[10px]">CMT Jahit</Label><Input type="number" value={kCmt || ""} onChange={(e) => setKCmt(Number(e.target.value))} /></div>
              <div><Label className="text-[10px]">Sablon/Bordir</Label><Input type="number" value={kSablon || ""} onChange={(e) => setKSablon(Number(e.target.value))} /></div>
              <div><Label className="text-[10px]">Wastage %</Label><Input type="number" value={kWastage} onChange={(e) => setKWastage(Number(e.target.value))} /></div>
              <div className="flex items-end"><Button size="sm" variant="secondary" onClick={() => { if (kBerat > 0) setKKonvResult(hitungKonveksi(kBerat, kHargaKain, kCmt, kSablon, kWastage)); }}><Calculator className="size-3" /> Hitung</Button></div>
            </div>
            {kKonvResult && <p className="text-xs">Modal: {activeWorkspace.currency} {kKonvResult.totalCost.toLocaleString()} | Jual: <strong className="text-emerald-600">{activeWorkspace.currency} {kKonvResult.hargaJual.toLocaleString()}</strong></p>}
          </div>
          <Button size="sm" className="w-full" disabled={!kProduct || !kPrice} onClick={() => { addToCart(`${kProduct} (${kColor}/${kSize})`, kPrice, "konveksi"); toast.success("Produk konveksi ditambahkan"); }}><Plus className="size-3.5" /> Tambah ke Keranjang</Button>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold font-heading">POS Kasir</h1><p className="text-sm text-muted-foreground/60">Pembayaran & Pesanan — Multi Unit Bisnis</p></div>
        <ShoppingCart className="size-6 text-muted-foreground/40" />
      </div>

      {/* Business Unit Selector */}
      <div className="flex gap-2 p-1 bg-muted/60 rounded-xl overflow-x-auto">
        {BIZ_UNITS.map((u) => {
          const Icon = u.icon;
          return (
            <button key={u.id} onClick={() => setBizUnit(u.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                bizUnit === u.id ? `bg-gradient-to-br ${u.color} text-white shadow-sm` : "text-muted-foreground hover:text-foreground"
              }`}
            ><Icon className="size-4" /> {u.label}</button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Customer + Business Form */}
        <div className="lg:col-span-3 space-y-5">
          {/* Customer Autocomplete */}
          <Card><CardContent className="p-4 space-y-2">
            <Label className="text-xs font-medium">Pelanggan</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
              <Input value={customerQuery} onChange={(e) => { setCustomerQuery(e.target.value); setShowCustomerDropdown(true); }} onFocus={() => setShowCustomerDropdown(true)} onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)} placeholder="Cari nama / telepon..." className="pl-9" />
              {showCustomerDropdown && filteredCustomers.length > 0 && (
                <div className="absolute z-20 top-full mt-1 w-full bg-card border border-border/50 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                  {filteredCustomers.map((c) => <button key={c.id} onMouseDown={() => pilihCustomer(c)} className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors flex justify-between"><span className="font-medium">{c.name}</span><span className="text-muted-foreground/60 text-xs">{c.phone}</span></button>)}
                </div>
              )}
            </div>
            {selectedCustomer && <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg"><span>{selectedCustomer.name} — {selectedCustomer.phone}</span><button onClick={() => { setSelectedCustomer(null); setCustomerQuery(""); }} className="text-red-500 hover:underline">Hapus</button></div>}
          </CardContent></Card>

          {/* Business-specific Form */}
          <Card><CardContent className="p-4">
            <Label className="text-xs font-medium mb-3 block flex items-center gap-2">
              {(() => { const u = BIZ_UNITS.find((b) => b.id === bizUnit); const Icon = u?.icon || ShoppingCart; return <><Icon className="size-4" /> {u?.label || "Form"}</>; })()}
            </Label>
            {renderBizForm()}
          </CardContent></Card>

          {/* Cart */}
          <Card><CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between"><Label className="text-xs font-medium">Keranjang ({cart.length})</Label>{cart.length > 0 && <button onClick={() => setCart([])} className="text-xs text-red-500 hover:underline">Kosongkan</button>}</div>
            {cart.length === 0 ? <p className="text-sm text-muted-foreground/60 text-center py-6">Belum ada item — pilih unit bisnis dan tambah produk</p> : (
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                    <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{item.description}</p><p className="text-[10px] text-muted-foreground/60">{activeWorkspace.currency} {item.unitPrice.toLocaleString()} × {item.quantity}</p></div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => ubahQty(item.id, item.quantity - 1)} className="size-6 flex items-center justify-center rounded-md bg-muted/50 hover:bg-muted text-xs"><Minus className="size-3" /></button>
                      <span className="text-xs font-semibold w-6 text-center">{item.quantity}</span>
                      <button onClick={() => ubahQty(item.id, item.quantity + 1)} className="size-6 flex items-center justify-center rounded-md bg-muted/50 hover:bg-muted text-xs"><Plus className="size-3" /></button>
                    </div>
                    <span className="text-xs font-bold w-20 text-right">{activeWorkspace.currency} {item.total.toLocaleString()}</span>
                    <button onClick={() => hapusItem(item.id)} className="size-6 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md"><Trash2 className="size-3" /></button>
                  </div>
                ))}
              </div>
            )}
            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between text-sm"><span>Subtotal</span><span className="font-semibold">{activeWorkspace.currency} {subtotal.toLocaleString()}</span></div>
              <div className="flex items-center gap-2"><Label className="text-xs shrink-0">Diskon</Label><Input type="number" value={discount || ""} onChange={(e) => setDiscount(Number(e.target.value))} className="h-8 text-xs w-28" /></div>
              <div className="flex justify-between text-sm font-bold border-t pt-2"><span>Total</span><span className="text-emerald-600">{activeWorkspace.currency} {totalBayar.toLocaleString()}</span></div>
              <div className="flex items-center gap-2"><Label className="text-xs shrink-0">Bayar</Label><Input type="number" value={bayar || ""} onChange={(e) => setBayar(Number(e.target.value))} className="h-8 text-xs w-28" />{bayar > 0 && <span className="text-xs text-muted-foreground">Kembali: <strong className="text-green-600">{activeWorkspace.currency} {kembalian.toLocaleString()}</strong></span>}</div>
              <Input value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Catatan pesanan..." className="h-8 text-xs" />
              <Button className="w-full" size="sm" onClick={simpanOrder} disabled={cart.length === 0}><ShoppingCart className="size-3.5" /> Simpan Pesanan</Button>
            </div>
          </CardContent></Card>
        </div>

        {/* Right: QRIS + Receipt + Exports */}
        <div className="lg:col-span-2 space-y-5">
          {/* QRIS Upload */}
          <Card><CardContent className="p-4 space-y-3">
            <Label className="text-xs font-medium">Upload Bukti QRIS</Label>
            {qrImage ? (
              <div className="flex flex-col items-center"><img src={qrImage} alt="QRIS" className="w-32 h-32 object-contain rounded-xl border" /><Button variant="outline" size="sm" className="mt-2" onClick={() => setQrImage(null)}>Ganti</Button></div>
            ) : (
              <div onClick={() => fileRef.current?.click()} className="flex flex-col items-center py-6 border-2 border-dashed rounded-xl cursor-pointer hover:border-blue-400/50 hover:bg-muted/30 transition-colors">
                <UploadCloud className="size-8 text-muted-foreground/40 mb-2" /><p className="text-xs text-muted-foreground/60">Klik untuk upload</p>
                <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleQR(f); }} />
              </div>
            )}
          </CardContent></Card>

          {/* Receipt Preview */}
          <Card><CardContent className="p-0">
            <div id="receipt-preview" ref={receiptRef} className="bg-white text-black p-5 rounded-xl space-y-2 text-xs font-mono">
              <div className="text-center border-b border-dashed border-gray-300 pb-3">
                <p className="text-sm font-bold">{activeWorkspace.businessProfile?.name || "MUGHIS BANK"}</p>
                <p className="text-[10px] text-gray-500">{activeWorkspace.businessProfile?.address || ""}</p>
                <p className="text-[10px] text-gray-500">{new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
              </div>
              <div className="border-b border-dashed border-gray-300 pb-2"><p>Pelanggan: {selectedCustomer?.name || "Umum"}{selectedCustomer?.phone && ` — ${selectedCustomer.phone}`}</p></div>
              <div className="border-b border-dashed border-gray-300 pb-2 space-y-1">
                <div className="flex justify-between font-bold text-[10px] text-gray-500"><span className="flex-1">Item</span><span className="w-10 text-right">Qty</span><span className="w-16 text-right">Total</span></div>
                {cart.map((item) => (<div key={item.id} className="flex justify-between"><span className="flex-1 truncate">{item.description}</span><span className="w-10 text-right">{item.quantity}</span><span className="w-16 text-right font-semibold">{item.total.toLocaleString()}</span></div>))}
              </div>
              <div className="space-y-1">
                <div className="flex justify-between"><span>Subtotal</span><span>{subtotal.toLocaleString()}</span></div>
                {discount > 0 && <div className="flex justify-between"><span>Diskon</span><span>-{discount.toLocaleString()}</span></div>}
                <div className="flex justify-between font-bold text-sm border-t border-gray-300 pt-1"><span>Total</span><span>{totalBayar.toLocaleString()}</span></div>
                {bayar > 0 && <><div className="flex justify-between"><span>Bayar</span><span>{bayar.toLocaleString()}</span></div><div className="flex justify-between"><span>Kembali</span><span className="text-green-700">{kembalian.toLocaleString()}</span></div></>}
              </div>
              <div className="text-center border-t border-dashed border-gray-300 pt-3 text-[10px] text-gray-400"><p>Terima kasih</p><p>MUGHIS BANK v3 — POS Kasir</p></div>
            </div>
          </CardContent></Card>

          {/* Export Buttons */}
          <div className="grid grid-cols-4 gap-2">
            <button onClick={() => exportToPNG("receipt-preview", "struk.png")} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-lg shadow-amber-500/30 hover:scale-[1.02] active:scale-95 transition-all"><Image className="size-5" /><span className="text-[10px] font-medium">PNG</span></button>
            <button onClick={() => exportToPDF("receipt-preview", "thermal", "struk.pdf")} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30 hover:scale-[1.02] active:scale-95 transition-all"><svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" /><path d="M9 9h1" /><path d="M9 13h6" /><path d="M9 17h6" /></svg><span className="text-[10px] font-medium">PDF</span></button>
            <button onClick={() => { if (!selectedCustomer?.phone) { toast.error("Nomor WA tidak tersedia"); return; } sendWhatsAppReceipt(selectedCustomer.phone, { id: crypto.randomUUID(), total: totalBayar, dp: bayar, remaining: Math.max(0, totalBayar - bayar), status: bayar >= totalBayar ? "Lunas" : "DP", items: cart, }); }} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 hover:scale-[1.02] active:scale-95 transition-all"><Phone className="size-5" /><span className="text-[10px] font-medium">WA</span></button>
            <button onClick={async () => { if (!activeWorkspace) return; const { getOrdersByWorkspace } = await import("@/lib/db"); const all = await getOrdersByWorkspace(activeWorkspace.id); exportToExcel(pesananKeSheet(all), "Pesanan", "laporan-pesanan.xlsx"); toast.success("Excel terunduh"); }} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 hover:scale-[1.02] active:scale-95 transition-all"><svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="16" y2="17" /></svg><span className="text-[10px] font-medium">Excel</span></button>
          </div>
        </div>
      </div>
    </div>
  );
}
