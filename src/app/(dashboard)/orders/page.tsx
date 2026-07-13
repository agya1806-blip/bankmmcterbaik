"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useWorkspaceStore } from "@/engines/workspace/workspace-store";
import { useOrderStore } from "@/engines/business/order-store";
import { useBusinessStore } from "@/store/useBusinessStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search, Plus, Minus, Trash2, ShoppingCart, Image, UploadCloud, Phone
} from "lucide-react";
import type { Customer, Product } from "@/lib/db";
import {
  exportToPNG, exportToPDF, sendWhatsAppReceipt, exportToExcel, pesananKeSheet,
} from "@/utils/exporter";
import toast from "react-hot-toast";

interface CartItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export default function POSPage() {
  const { activeWorkspace } = useWorkspaceStore();
  const { addOrder, loadOrders } = useOrderStore();
  const { fashionSKUs } = useBusinessStore();
  const receiptRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerQuery, setCustomerQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [bayar, setBayar] = useState(0);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [catatan, setCatatan] = useState("");
  const [mounted, setMounted] = useState(false);

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

  const pilihCustomer = (c: Customer) => {
    setSelectedCustomer(c);
    setCustomerQuery(c.name);
    setShowCustomerDropdown(false);
  };

  const tambahItem = (desc: string, price: number) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.description === desc);
      if (existing) {
        return prev.map((i) =>
          i.description === desc ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unitPrice } : i
        );
      }
      return [...prev, { id: crypto.randomUUID(), description: desc, quantity: 1, unitPrice: price, total: price }];
    });
  };

  const ubahQty = (id: string, qty: number) => {
    if (qty < 1) return;
    setCart((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: qty, total: qty * i.unitPrice } : i)));
  };

  const hapusItem = (id: string) => setCart((prev) => prev.filter((i) => i.id !== id));

  const subtotal = cart.reduce((s, i) => s + i.total, 0);
  const totalBayar = Math.max(0, subtotal - discount);
  const kembalian = Math.max(0, bayar - totalBayar);

  const simpanOrder = useCallback(async () => {
    if (!activeWorkspace || cart.length === 0) return;
    await addOrder({
      workspaceId: activeWorkspace.id,
      type: "umum",
      status: "baru",
      paymentStatus: totalBayar <= 0 ? "Belum Lunas" : bayar >= totalBayar ? "Lunas" : "DP",
      customerId: selectedCustomer?.id || "",
      customerName: selectedCustomer?.name || "Umum",
      customerPhone: selectedCustomer?.phone || "",
      customerAddress: selectedCustomer?.address || "",
      items: cart.map((i) => ({ id: i.id, description: i.description, quantity: i.quantity, unitPrice: i.unitPrice, total: i.total })),
      subtotal, discount, total: totalBayar,
      dp: bayar < totalBayar ? bayar : totalBayar,
      remaining: Math.max(0, totalBayar - bayar),
      walletId: "",
      specs: {},
      notes: catatan,
      date: new Date().toISOString().slice(0, 10),
      dueDate: new Date().toISOString().slice(0, 10),
    });
    setCart([]);
    setDiscount(0);
    setBayar(0);
    setCatatan("");
    toast.success("Pesanan tersimpan");
  }, [activeWorkspace, cart, discount, totalBayar, bayar, catatan, selectedCustomer, addOrder, subtotal]);

  const handleQR = useCallback((file: File) => {
    if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) { toast.error("Hanya PNG/JPG"); return; }
    const reader = new FileReader();
    reader.onload = (e) => setQrImage(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  if (!mounted) return <div className="min-h-[60vh]" />;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-heading">POS Kasir</h1>
          <p className="text-sm text-muted-foreground/60">Pembayaran & Pesanan Cepat</p>
        </div>
        <ShoppingCart className="size-6 text-muted-foreground/40" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Product Grid + Cart */}
        <div className="lg:col-span-3 space-y-5">

          {/* Customer Autocomplete */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <Label className="text-xs font-medium">Pelanggan</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                <Input
                  value={customerQuery}
                  onChange={(e) => { setCustomerQuery(e.target.value); setShowCustomerDropdown(true); }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                  placeholder="Cari nama / no. telepon..."
                  className="pl-9"
                />
                {showCustomerDropdown && filteredCustomers.length > 0 && (
                  <div className="absolute z-20 top-full mt-1 w-full bg-card border border-border/50 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    {filteredCustomers.map((c) => (
                      <button key={c.id} onMouseDown={() => pilihCustomer(c)}
                        className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors flex justify-between"
                      >
                        <span className="font-medium">{c.name}</span>
                        <span className="text-muted-foreground/60 text-xs">{c.phone}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedCustomer && (
                <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg">
                  <span>{selectedCustomer.name} — {selectedCustomer.phone}</span>
                  <button onClick={() => { setSelectedCustomer(null); setCustomerQuery(""); }} className="text-red-500 hover:underline">Hapus</button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Grid */}
          <Card>
            <CardContent className="p-4">
              <Label className="text-xs font-medium mb-3 block">Item Cepat</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {products.map((p) => (
                  <button key={p.id} onClick={() => tambahItem(p.name, p.price)}
                    className="flex flex-col items-center p-3 rounded-xl border border-border/40 hover:border-emerald-400/50 hover:bg-muted/30 transition-all active:scale-95"
                  >
                    <span className="text-sm font-medium text-center leading-tight">{p.name}</span>
                    <span className="text-xs font-bold text-emerald-600 mt-1">{activeWorkspace?.currency} {p.price.toLocaleString()}</span>
                  </button>
                ))}
                {fashionSKUs.map((s) => (
                  <button key={s.id} onClick={() => tambahItem(`${s.productName} (${s.color}/${s.size})`, s.price)}
                    className="flex flex-col items-center p-3 rounded-xl border border-border/40 hover:border-emerald-400/50 hover:bg-muted/30 transition-all active:scale-95"
                  >
                    <span className="text-sm font-medium text-center leading-tight">{s.productName}</span>
                    <span className="text-xs text-muted-foreground">{s.color}/{s.size}</span>
                    <span className="text-xs font-bold text-emerald-600 mt-1">{activeWorkspace?.currency} {s.price.toLocaleString()}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cart */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Keranjang ({cart.length})</Label>
                {cart.length > 0 && (
                  <button onClick={() => setCart([])} className="text-xs text-red-500 hover:underline">Kosongkan</button>
                )}
              </div>
              {cart.length === 0 ? (
                <p className="text-sm text-muted-foreground/60 text-center py-6">Belum ada item</p>
              ) : (
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.description}</p>
                        <p className="text-[10px] text-muted-foreground/60">{activeWorkspace?.currency} {item.unitPrice.toLocaleString()} × {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => ubahQty(item.id, item.quantity - 1)} className="size-6 flex items-center justify-center rounded-md bg-muted/50 hover:bg-muted text-xs"><Minus className="size-3" /></button>
                        <span className="text-xs font-semibold w-6 text-center">{item.quantity}</span>
                        <button onClick={() => ubahQty(item.id, item.quantity + 1)} className="size-6 flex items-center justify-center rounded-md bg-muted/50 hover:bg-muted text-xs"><Plus className="size-3" /></button>
                      </div>
                      <span className="text-xs font-bold w-20 text-right">{activeWorkspace?.currency} {item.total.toLocaleString()}</span>
                      <button onClick={() => hapusItem(item.id)} className="size-6 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md"><Trash2 className="size-3" /></button>
                    </div>
                  ))}
                </div>
              )}
              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between text-sm"><span>Subtotal</span><span className="font-semibold">{activeWorkspace?.currency} {subtotal.toLocaleString()}</span></div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs shrink-0">Diskon</Label>
                  <Input type="number" value={discount || ""} onChange={(e) => setDiscount(Number(e.target.value))} className="h-8 text-xs w-28" />
                </div>
                <div className="flex justify-between text-sm font-bold border-t pt-2"><span>Total</span><span className="text-emerald-600">{activeWorkspace?.currency} {totalBayar.toLocaleString()}</span></div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs shrink-0">Bayar</Label>
                  <Input type="number" value={bayar || ""} onChange={(e) => setBayar(Number(e.target.value))} className="h-8 text-xs w-28" />
                  {bayar > 0 && <span className="text-xs text-muted-foreground">Kembali: <strong className="text-green-600">{activeWorkspace?.currency} {kembalian.toLocaleString()}</strong></span>}
                </div>
                <Input value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Catatan pesanan..." className="h-8 text-xs" />
                <Button className="w-full" size="sm" onClick={simpanOrder} disabled={cart.length === 0}>
                  <ShoppingCart className="size-3.5" /> Simpan Pesanan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Receipt Preview + Exports */}
        <div className="lg:col-span-2 space-y-5">

          {/* QRIS Upload */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <Label className="text-xs font-medium">Upload Bukti QRIS</Label>
              {qrImage ? (
                <div className="flex flex-col items-center">
                  <img src={qrImage} alt="QRIS upload" className="w-32 h-32 object-contain rounded-xl border" />
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => setQrImage(null)}>Ganti</Button>
                </div>
              ) : (
                <div onClick={() => fileRef.current?.click()} className="flex flex-col items-center py-6 border-2 border-dashed rounded-xl cursor-pointer hover:border-blue-400/50 hover:bg-muted/30 transition-colors">
                  <UploadCloud className="size-8 text-muted-foreground/40 mb-2" />
                  <p className="text-xs text-muted-foreground/60">Klik untuk upload</p>
                  <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleQR(f); }} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Receipt Preview */}
          <Card>
            <CardContent className="p-0">
              <div id="receipt-preview" ref={receiptRef} className="bg-white text-black p-5 rounded-xl space-y-2 text-xs font-mono">
                <div className="text-center border-b border-dashed border-gray-300 pb-3">
                  <p className="text-sm font-bold">{activeWorkspace?.businessProfile?.name || "MUGHIS BANK"}</p>
                  <p className="text-[10px] text-gray-500">{activeWorkspace?.businessProfile?.address || ""}</p>
                  <p className="text-[10px] text-gray-500">{new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                </div>
                <div className="border-b border-dashed border-gray-300 pb-2">
                  <p>Pelanggan: {selectedCustomer?.name || "Umum"}</p>
                  {selectedCustomer?.phone && <p>Telp: {selectedCustomer.phone}</p>}
                </div>
                <div className="border-b border-dashed border-gray-300 pb-2 space-y-1">
                  <div className="flex justify-between font-bold text-[10px] text-gray-500">
                    <span className="flex-1">Item</span>
                    <span className="w-12 text-right">Qty</span>
                    <span className="w-16 text-right">Harga</span>
                    <span className="w-16 text-right">Total</span>
                  </div>
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span className="flex-1 truncate">{item.description}</span>
                      <span className="w-12 text-right">{item.quantity}</span>
                      <span className="w-16 text-right">{item.unitPrice.toLocaleString()}</span>
                      <span className="w-16 text-right font-semibold">{item.total.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between"><span>Subtotal</span><span>{subtotal.toLocaleString()}</span></div>
                  {discount > 0 && <div className="flex justify-between"><span>Diskon</span><span>-{discount.toLocaleString()}</span></div>}
                  <div className="flex justify-between font-bold text-sm border-t border-gray-300 pt-1">
                    <span>Total</span><span>{totalBayar.toLocaleString()}</span>
                  </div>
                  {bayar > 0 && (
                    <>
                      <div className="flex justify-between"><span>Bayar</span><span>{bayar.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span>Kembali</span><span className="text-green-700">{kembalian.toLocaleString()}</span></div>
                    </>
                  )}
                </div>
                <div className="text-center border-t border-dashed border-gray-300 pt-3 text-[10px] text-gray-400">
                  <p>Terima kasih atas kunjungan Anda</p>
                  <p>MUGHIS BANK v3 — Kasir</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Buttons */}
          <div className="grid grid-cols-4 gap-2">
            <button onClick={() => exportToPNG("receipt-preview", "struk.png")}
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-lg shadow-amber-500/30 hover:scale-[1.02] active:scale-95 transition-all">
              <Image className="size-5" />
              <span className="text-[10px] font-medium">PNG</span>
            </button>
            <button onClick={() => exportToPDF("receipt-preview", "thermal", "struk.pdf")}
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30 hover:scale-[1.02] active:scale-95 transition-all">
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" /><path d="M9 9h1" /><path d="M9 13h6" /><path d="M9 17h6" /></svg>
              <span className="text-[10px] font-medium">PDF</span>
            </button>
            <button onClick={() => {
              if (!selectedCustomer?.phone) { toast.error("Nomor WA pelanggan tidak tersedia"); return; }
              sendWhatsAppReceipt(selectedCustomer.phone, {
                id: crypto.randomUUID(), total: totalBayar, dp: bayar, remaining: Math.max(0, totalBayar - bayar),
                status: bayar >= totalBayar ? "Lunas" : "DP", items: cart,
              });
            }}
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 hover:scale-[1.02] active:scale-95 transition-all">
              <Phone className="size-5" />
              <span className="text-[10px] font-medium">WA</span>
            </button>
            <button onClick={async () => {
              if (!activeWorkspace) return;
              const { getOrdersByWorkspace } = await import("@/lib/db");
              const all = await getOrdersByWorkspace(activeWorkspace.id);
              const data = pesananKeSheet(all);
              exportToExcel(data, "Pesanan", "laporan-pesanan.xlsx");
              toast.success("File Excel terunduh");
            }}
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 hover:scale-[1.02] active:scale-95 transition-all">
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="16" y2="17" /></svg>
              <span className="text-[10px] font-medium">Excel</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
