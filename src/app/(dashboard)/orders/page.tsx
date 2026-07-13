"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useWorkspaceStore } from "@/engines/workspace/workspace-store";
import { useOrderStore } from "@/engines/business/order-store";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import CustomerSelector from "@/components/orders/customer-selector";
import PercetakanForm from "@/components/orders/forms/percetakan-form";
import GadgetForm from "@/components/orders/forms/gadget-form";
import LaptopForm from "@/components/orders/forms/laptop-form";
import KedaiKopiForm from "@/components/orders/forms/kedai-kopi-form";
import KonveksiForm from "@/components/orders/forms/konveksi-form";
import PosCart, { type CartItem } from "@/components/orders/pos-cart";
import ReceiptPreview from "@/components/orders/receipt-preview";
import ExportButtons from "@/components/orders/export-buttons";
import type { Customer } from "@/lib/db";
import {
  ShoppingCart, UploadCloud, Printer, Smartphone,
  Monitor, Coffee, Shirt
} from "lucide-react";
import toast from "react-hot-toast";

type BizUnit = "percetakan" | "gadget" | "laptop" | "kedai_kopi" | "konveksi";

const BIZ_UNITS: { id: BizUnit; label: string; icon: typeof Printer; color: string }[] = [
  { id: "percetakan", label: "Percetakan", icon: Printer, color: "from-violet-500 to-violet-600" },
  { id: "gadget", label: "Gadget", icon: Smartphone, color: "from-cyan-500 to-cyan-600" },
  { id: "laptop", label: "Laptop/PC", icon: Monitor, color: "from-emerald-500 to-teal-500" },
  { id: "kedai_kopi", label: "Kedai Kopi", icon: Coffee, color: "from-amber-500 to-orange-500" },
  { id: "konveksi", label: "Konveksi", icon: Shirt, color: "from-fuchsia-500 to-pink-500" },
];

export default function POSPage() {
  const { activeWorkspace } = useWorkspaceStore();
  const { addOrder, loadOrders } = useOrderStore();
  const receiptRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [mounted, setMounted] = useState(false);
  const [bizUnit, setBizUnit] = useState<BizUnit>("percetakan");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [bayar, setBayar] = useState(0);
  const [catatan, setCatatan] = useState("");
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (activeWorkspace) loadOrders(activeWorkspace.id);
  }, [activeWorkspace, loadOrders]);

  const subtotal = cart.reduce((s, i) => s + i.total, 0);
  const totalBayar = Math.max(0, subtotal - discount);
  const kembalian = Math.max(0, bayar - totalBayar);

  const addToCart = (desc: string, price: number) => {
    setCart((p) => {
      const e = p.find((i) => i.description === desc);
      if (e) return p.map((i) =>
        i.id === e.id ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unitPrice } : i
      );
      return [...p, { id: crypto.randomUUID(), description: desc, quantity: 1, unitPrice: price, total: price }];
    });
  };

  const simpanOrder = useCallback(async () => {
    if (!activeWorkspace || cart.length === 0 || saving) return;
    setSaving(true);
    try {
      await addOrder({
        workspaceId: activeWorkspace.id, type: "umum", status: "baru",
        paymentStatus: totalBayar <= 0 ? "Belum Lunas" : bayar >= totalBayar ? "Lunas" : "DP",
        customerId: selectedCustomer?.id || "", customerName: selectedCustomer?.name || "Umum",
        customerPhone: selectedCustomer?.phone || "", customerAddress: selectedCustomer?.address || "",
        items: cart.map((i) => ({ id: i.id, description: i.description, quantity: i.quantity, unitPrice: i.unitPrice, total: i.total })),
        subtotal, discount, total: totalBayar,
        dp: bayar < totalBayar ? bayar : totalBayar, remaining: Math.max(0, totalBayar - bayar),
        walletId: "", specs: {}, notes: catatan,
        date: new Date().toISOString().slice(0, 10), dueDate: new Date().toISOString().slice(0, 10),
      });
      setCart([]); setDiscount(0); setBayar(0); setCatatan("");
      toast.success("Pesanan tersimpan");
    } finally {
      setSaving(false);
    }
  }, [activeWorkspace, cart, discount, totalBayar, bayar, catatan, selectedCustomer, addOrder, subtotal, saving]);

  const handleQR = useCallback((file: File) => {
    if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) { toast.error("Hanya PNG/JPG"); return; }
    const reader = new FileReader();
    reader.onload = (e) => setQrImage(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  if (!mounted) return <div className="min-h-[60vh]" />;
  if (!activeWorkspace) return null;

  const FormComponent = () => {
    const props = { currency: activeWorkspace.currency, onAddToCart: addToCart };
    switch (bizUnit) {
      case "percetakan": return <PercetakanForm {...props} />;
      case "gadget": return <GadgetForm {...props} />;
      case "laptop": return <LaptopForm {...props} />;
      case "kedai_kopi": return <KedaiKopiForm {...props} />;
      case "konveksi": return <KonveksiForm {...props} />;
    }
  };

  const currentUnit = BIZ_UNITS.find((u) => u.id === bizUnit);
  const Icon = currentUnit?.icon || ShoppingCart;

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-heading">POS Kasir</h1>
          <p className="text-sm text-muted-foreground/60">Pembayaran & Pesanan — Multi Unit Bisnis</p>
        </div>
        <ShoppingCart className="size-6 text-muted-foreground/40" />
      </div>

      <div className="flex gap-2 p-1 bg-muted/60 rounded-xl overflow-x-auto">
        {BIZ_UNITS.map((u) => {
          const Ico = u.icon;
          return (
            <button key={u.id} onClick={() => setBizUnit(u.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                bizUnit === u.id ? `bg-gradient-to-br ${u.color} text-white shadow-sm` : "text-muted-foreground hover:text-foreground"
              }`}
            ><Ico className="size-4" /> {u.label}</button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-5">
          <CustomerSelector
            workspaceId={activeWorkspace.id}
            value={selectedCustomer}
            onChange={setSelectedCustomer}
          />

          <Card>
            <CardContent className="p-4">
              <Label className="text-xs font-medium mb-3 block flex items-center gap-2">
                <Icon className="size-4" /> {currentUnit?.label || "Form"}
              </Label>
              <FormComponent />
            </CardContent>
          </Card>

          <PosCart
            items={cart}
            currency={activeWorkspace.currency}
            discount={discount}
            bayar={bayar}
            catatan={catatan}
            subtotal={subtotal}
            totalBayar={totalBayar}
            kembalian={kembalian}
            onUpdateQty={(id, q) => {
              if (q < 1) return;
              setCart((p) => p.map((i) => i.id === id ? { ...i, quantity: q, total: q * i.unitPrice } : i));
            }}
            onRemoveItem={(id) => setCart((p) => p.filter((i) => i.id !== id))}
            onClearCart={() => setCart([])}
            onDiscountChange={setDiscount}
            onBayarChange={setBayar}
            onCatatanChange={setCatatan}
            onSave={simpanOrder}
            saving={saving}
          />
        </div>

        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardContent className="p-4 space-y-3">
              <Label className="text-xs font-medium">Upload Bukti QRIS</Label>
              {qrImage ? (
                <div className="flex flex-col items-center">
                  <img src={qrImage} alt="QRIS" className="w-32 h-32 object-contain rounded-xl border" />
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => setQrImage(null)}>Ganti</Button>
                </div>
              ) : (
                <div onClick={() => fileRef.current?.click()}
                  className="flex flex-col items-center py-6 border-2 border-dashed rounded-xl cursor-pointer hover:border-blue-400/50 hover:bg-muted/30 transition-colors"
                >
                  <UploadCloud className="size-8 text-muted-foreground/40 mb-2" />
                  <p className="text-xs text-muted-foreground/60">Klik untuk upload</p>
                  <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleQR(f); }} />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <ReceiptPreview
                ref={receiptRef}
                businessName={activeWorkspace.businessProfile?.name || "MUGHIS BANK"}
                businessAddress={activeWorkspace.businessProfile?.address || ""}
                customerName={selectedCustomer?.name || "Umum"}
                customerPhone={selectedCustomer?.phone || ""}
                items={cart}
                subtotal={subtotal}
                discount={discount}
                totalBayar={totalBayar}
                bayar={bayar}
                kembalian={kembalian}
              />
            </CardContent>
          </Card>

          <ExportButtons
            customerPhone={selectedCustomer?.phone || ""}
            totalBayar={totalBayar}
            bayar={bayar}
            kembalian={kembalian}
            cart={cart}
            workspaceId={activeWorkspace.id}
          />
        </div>
      </div>
    </div>
  );
}
