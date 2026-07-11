"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/engines/identity/auth-store";
import { useWorkspaceStore } from "@/engines/workspace/workspace-store";
import { useOrderStore } from "@/engines/business/order-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus, Search, ShoppingCart, Phone, CheckCircle, XCircle, Trash2, Edit2,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const ORDER_TYPES = [
  { value: "print", labelKey: "orders.print" },
  { value: "laptop", labelKey: "orders.laptop" },
  { value: "handphone", labelKey: "orders.handphone" },
  { value: "tiktok", labelKey: "orders.tiktok" },
  { value: "umum", labelKey: "orders.umum" },
];

const ORDER_STATUSES = ["all", "baru", "proses", "selesai", "batal"] as const;

const STATUS_STYLES: Record<string, string> = {
  baru: "bg-blue-100/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  proses: "bg-amber-100/80 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  selesai: "bg-emerald-100/80 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
  batal: "bg-red-100/80 dark:bg-red-900/30 text-red-600 dark:text-red-400",
};

function generateItemId(): string {
  return crypto.randomUUID();
}

export default function OrdersPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuthStore();
  const { activeWorkspace, loadWorkspaces } = useWorkspaceStore();
  const {
    orders, isLoading, error,
    loadOrders, addOrder, editOrder, removeOrder, clearError,
  } = useOrderStore();

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<{ id: string } | null>(null);
  const [type, setType] = useState<string>("print");
  const [customerName, setCustomerName] = useState("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split("T")[0]);
  const [items, setItems] = useState<Array<{ id: string; description: string; quantity: number; unitPrice: number; total: number }>>([
    { id: generateItemId(), description: "", quantity: 1, unitPrice: 0, total: 0 },
  ]);
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [discount, setDiscount] = useState("0");
  const [dp, setDp] = useState("0");
  const [notes, setNotes] = useState("");
  const [specs, setSpecs] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) loadWorkspaces(user.id);
  }, [user, loadWorkspaces]);

  useEffect(() => {
    if (activeWorkspace) loadOrders(activeWorkspace.id);
  }, [activeWorkspace, loadOrders]);

  const subtotal = useMemo(() =>
    items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0),
  [items]);

  const total = Math.max(0, subtotal - (parseFloat(discount) || 0));

  const remaining = total - (parseFloat(dp) || 0);

  function updateItem(id: string, field: string, value: string | number) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: field === "description" ? value : Number(value) || 0 };
        updated.total = updated.quantity * updated.unitPrice;
        return updated;
      })
    );
  }

  function addItem() {
    setItems((prev) => [...prev, { id: generateItemId(), description: "", quantity: 1, unitPrice: 0, total: 0 }]);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  if (authLoading) return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">{t("loading")}</p></div>;
  if (!user || !activeWorkspace) return null;

  function resetForm() {
    setType("print");
    setCustomerName("");
    setCustomerPhone("");
    setCustomerAddress("");
    setOrderDate(new Date().toISOString().split("T")[0]);
    setItems([{ id: generateItemId(), description: "", quantity: 1, unitPrice: 0, total: 0 }]);
    setDiscount("0");
    setDp("0");
    setNotes("");
    setSpecs({});
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!activeWorkspace) return;
    await addOrder({
      workspaceId: activeWorkspace.id,
      type: type as "print" | "laptop" | "handphone" | "tiktok" | "umum",
      status: "baru",
      paymentStatus: parseFloat(dp) > 0 ? (parseFloat(dp) >= total ? "Lunas" : "DP") : "Belum Lunas",
      customerId: customerName,
      customerName,
      customerPhone,
      customerAddress,
      items: items.filter((i) => i.description),
      subtotal,
      discount: parseFloat(discount) || 0,
      total,
      dp: parseFloat(dp) || 0,
      remaining,
      walletId: "",
      specs,
      notes,
      date: orderDate,
      dueDate: orderDate,
    });
    setAddOpen(false);
    resetForm();
  }

  function openEdit(o: typeof orders[0]) {
    setEditTarget({ id: o.id });
    setType(o.type);
    setCustomerName(o.customerName || o.customerId);
    setCustomerPhone(o.customerPhone || "");
    setCustomerAddress(o.customerAddress || "");
    setOrderDate(o.date);
    setItems(o.items.length > 0 ? o.items : [{ id: generateItemId(), description: "", quantity: 1, unitPrice: 0, total: 0 }]);
    setDiscount(String(o.discount));
    setDp(String(o.dp));
    setNotes(o.notes);
    setSpecs(o.specs || {});
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    await editOrder(editTarget.id, {
      type: type as "print" | "laptop" | "handphone" | "tiktok" | "umum",
      paymentStatus: parseFloat(dp) > 0 ? (parseFloat(dp) >= total ? "Lunas" : "DP") : "Belum Lunas",
      customerId: customerName,
      customerName,
      customerPhone,
      customerAddress,
      items: items.filter((i) => i.description),
      subtotal,
      discount: parseFloat(discount) || 0,
      total,
      dp: parseFloat(dp) || 0,
      remaining,
      walletId: "",
      specs,
      notes,
      date: orderDate,
      dueDate: orderDate,
    });
    setEditTarget(null);
    resetForm();
  }

  function buildWhatsAppUrl(order: typeof orders[0]) {
    const phone = order.customerId.replace(/[^0-9]/g, "");
    const text = encodeURIComponent(
      `*${t("orders.invoice")} #${order.number}*\n` +
      `${t("orders.status")}: ${t("orders." + order.status)}\n` +
      `${t("orders.total")}: ${activeWorkspace.currency} ${order.total.toLocaleString()}\n` +
      `${t("orders.dp")}: ${activeWorkspace.currency} ${order.dp.toLocaleString()}\n` +
      `${t("orders.remaining")}: ${activeWorkspace.currency} ${order.remaining.toLocaleString()}\n` +
      `${t("orders.notes")}: ${order.notes || "-"}`
    );
    return `https://wa.me/${phone}?text=${text}`;
  }

  const filteredOrders = useMemo(() => {
    let result = [...orders];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((o) =>
        o.number.toLowerCase().includes(q) ||
        o.customerId.toLowerCase().includes(q)
      );
    }
    if (typeFilter !== "all") {
      result = result.filter((o) => o.type === typeFilter);
    }
    if (statusFilter !== "all") {
      result = result.filter((o) => o.status === statusFilter);
    }
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orders, search, typeFilter, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length, baru: 0, proses: 0, selesai: 0, batal: 0 };
    orders.forEach((o) => { counts[o.status] = (counts[o.status] || 0) + 1; });
    return counts;
  }, [orders]);

  const orderFormContent = (
    <div className="space-y-4 py-4">
      {error && <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
      <div className="space-y-2">
        <Label>{t("orders.type")}</Label>
        <Select value={type} onValueChange={(v) => { setType(v); setSpecs({}); }}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ORDER_TYPES.map((ot) => (
              <SelectItem key={ot.value} value={ot.value}>{t(ot.labelKey)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>{t("orders.customerName")}</Label>
        <Input value={customerName} onChange={(e) => { setCustomerName(e.target.value); if (error) clearError(); }} required />
      </div>
      <div className="space-y-2">
        <Label>No. HP</Label>
        <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="08xxxxxxxxxx" />
      </div>
      <div className="space-y-2">
        <Label>Alamat</Label>
        <Input value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="Alamat pelanggan" />
      </div>
      <div className="space-y-2">
        <Label>{t("orders.date")}</Label>
        <Input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} required />
      </div>

      {type === "print" && (
        <div className="rounded-xl border border-border/50 bg-muted/30 p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Spesifikasi Buku</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label className="text-xs">Ukuran Buku</Label><Input value={specs.bookSize || ""} onChange={(e) => setSpecs((s) => ({ ...s, bookSize: e.target.value }))} placeholder="A4, A5" /></div>
            <div className="space-y-1"><Label className="text-xs">Jilid</Label><select className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm" value={specs.binding || "Lem Panas"} onChange={(e) => setSpecs((s) => ({ ...s, binding: e.target.value }))}><option>Lem Panas</option><option>Spiral</option></select></div>
            <div className="space-y-1"><Label className="text-xs">Ukuran Jadi</Label><Input value={specs.finalSize || ""} onChange={(e) => setSpecs((s) => ({ ...s, finalSize: e.target.value }))} placeholder="21 x 29.7 cm" /></div>
            <div className="space-y-1"><Label className="text-xs">Kertas Isi</Label><Input value={specs.paperType || ""} onChange={(e) => setSpecs((s) => ({ ...s, paperType: e.target.value }))} placeholder="HVS 70gr" /></div>
            <div className="space-y-1"><Label className="text-xs">Kertas Cover</Label><Input value={specs.coverType || ""} onChange={(e) => setSpecs((s) => ({ ...s, coverType: e.target.value }))} placeholder="Art Carton 260gr" /></div>
            <div className="space-y-1"><Label className="text-xs">Laminating</Label><select className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm" value={specs.laminating || "Tidak"} onChange={(e) => setSpecs((s) => ({ ...s, laminating: e.target.value }))}><option>Tidak</option><option>Glossy</option><option>Doff</option></select></div>
            <div className="space-y-1"><Label className="text-xs">Wrapping</Label><select className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm" value={specs.wrapping || "Tidak"} onChange={(e) => setSpecs((s) => ({ ...s, wrapping: e.target.value }))}><option>Tidak</option><option>Ya</option></select></div>
          </div>
        </div>
      )}

      {type === "laptop" && (
        <div className="rounded-xl border border-border/50 bg-muted/30 p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Spesifikasi Laptop</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1"><Label className="text-xs">Nama Laptop</Label><Input value={specs.laptopName || ""} onChange={(e) => setSpecs((s) => ({ ...s, laptopName: e.target.value }))} placeholder="ASUS VivoBook" /></div>
            <div className="space-y-1"><Label className="text-xs">Processor</Label><Input value={specs.processor || ""} onChange={(e) => setSpecs((s) => ({ ...s, processor: e.target.value }))} placeholder="Intel Core i5" /></div>
            <div className="space-y-1"><Label className="text-xs">RAM</Label><Input value={specs.ram || ""} onChange={(e) => setSpecs((s) => ({ ...s, ram: e.target.value }))} placeholder="8GB DDR4" /></div>
            <div className="space-y-1"><Label className="text-xs">Storage</Label><Input value={specs.storage || ""} onChange={(e) => setSpecs((s) => ({ ...s, storage: e.target.value }))} placeholder="256GB SSD" /></div>
            <div className="space-y-1"><Label className="text-xs">Layar</Label><Input value={specs.screen || ""} onChange={(e) => setSpecs((s) => ({ ...s, screen: e.target.value }))} placeholder="14 inch" /></div>
            <div className="space-y-1"><Label className="text-xs">Kondisi</Label><select className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm" value={specs.condition || "Baik"} onChange={(e) => setSpecs((s) => ({ ...s, condition: e.target.value }))}><option>Like New</option><option>Baik</option><option>Cukup</option></select></div>
            <div className="space-y-1"><Label className="text-xs">Garansi</Label><Input value={specs.warranty || ""} onChange={(e) => setSpecs((s) => ({ ...s, warranty: e.target.value }))} placeholder="1 Bulan" /></div>
          </div>
        </div>
      )}

      {type === "handphone" && (
        <div className="rounded-xl border border-border/50 bg-muted/30 p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Spesifikasi Handphone</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1"><Label className="text-xs">Nama HP</Label><Input value={specs.handphoneName || ""} onChange={(e) => setSpecs((s) => ({ ...s, handphoneName: e.target.value }))} placeholder="Samsung Galaxy" /></div>
            <div className="space-y-1"><Label className="text-xs">Storage</Label><Input value={specs.storage || ""} onChange={(e) => setSpecs((s) => ({ ...s, storage: e.target.value }))} placeholder="128GB" /></div>
            <div className="space-y-1"><Label className="text-xs">Warna</Label><Input value={specs.color || ""} onChange={(e) => setSpecs((s) => ({ ...s, color: e.target.value }))} placeholder="Hitam" /></div>
            <div className="space-y-1"><Label className="text-xs">Kondisi</Label><select className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm" value={specs.condition || "Baik"} onChange={(e) => setSpecs((s) => ({ ...s, condition: e.target.value }))}><option>Like New</option><option>Baik</option><option>Cukup</option></select></div>
          </div>
        </div>
      )}

      {type === "tiktok" && (
        <div className="rounded-xl border border-border/50 bg-muted/30 p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Layanan TikTok</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label className="text-xs">Niche</Label><Input value={specs.niche || ""} onChange={(e) => setSpecs((s) => ({ ...s, niche: e.target.value }))} placeholder="Fashion, Gaming, dll" /></div>
            <div className="space-y-1"><Label className="text-xs">Jenis Layanan</Label><Input value={specs.serviceType || ""} onChange={(e) => setSpecs((s) => ({ ...s, serviceType: e.target.value }))} placeholder="Edit video, Konten" /></div>
          </div>
        </div>
      )}

      {type === "umum" && (
        <div className="rounded-xl border border-border/50 bg-muted/30 p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Keterangan Umum</p>
          <div className="space-y-3">
            <div className="space-y-1"><Label className="text-xs">Jenis Transaksi</Label><Input value={specs.umumType || ""} onChange={(e) => setSpecs((s) => ({ ...s, umumType: e.target.value }))} placeholder="Penjualan, Jasa" /></div>
            <div className="space-y-1"><Label className="text-xs">Keterangan</Label><textarea className="flex h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={specs.umumDesc || ""} onChange={(e) => setSpecs((s) => ({ ...s, umumDesc: e.target.value }))} placeholder="Keterangan detail" /></div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>{t("orders.items")}</Label>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="size-3" /> {t("orders.addItem")}
          </Button>
        </div>
        {items.map((item, idx) => (
          <div key={item.id} className="rounded-xl border border-border/50 bg-muted/30 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{t("orders.itemNumber")} {idx + 1}</span>
              {items.length > 1 && (
                <Button type="button" variant="ghost" size="icon-xs" onClick={() => removeItem(item.id)}>
                  <XCircle className="size-3 text-destructive" />
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <Input
                placeholder={t("orders.itemDescription")}
                value={item.description}
                onChange={(e) => updateItem(item.id, "description", e.target.value)}
              />
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">{t("orders.qty")}</Label>
                  <Input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(item.id, "quantity", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("orders.unitPrice")}</Label>
                  <Input type="number" min="0" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(item.id, "unitPrice", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("orders.total")}</Label>
                  <div className="flex h-9 items-center rounded-lg border border-border/50 bg-background px-3 text-sm font-medium">
                    {activeWorkspace.currency} {item.total.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-xl bg-muted/30 p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("orders.subtotal")}</span>
          <span className="font-medium">{activeWorkspace.currency} {subtotal.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">{t("orders.discount")}</span>
          <Input type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} className="w-32 h-8 text-right" />
        </div>
        <div className="flex justify-between text-sm font-bold">
          <span>{t("orders.total")}</span>
          <span>{activeWorkspace.currency} {total.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/50">
          <span className="text-sm text-muted-foreground">{t("orders.dp")}</span>
          <Input type="number" min="0" step="0.01" value={dp} onChange={(e) => setDp(e.target.value)} className="w-32 h-8 text-right" />
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("orders.remaining")}</span>
          <span className="font-medium text-destructive">{activeWorkspace.currency} {Math.max(0, remaining).toLocaleString()}</span>
        </div>
      </div>
      <div className="space-y-2">
        <Label>{t("orders.notes")}</Label>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("orders.title")}</h1>
          <p className="text-muted-foreground">{orders.length} {t("orders.title")}</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen} trigger={<Button><Plus className="size-4" /> {t("orders.add")}</Button>}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("orders.add")}</DialogTitle>
              <DialogDescription>{t("orders.add")}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAdd}>
              {orderFormContent}
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>{isLoading ? t("orders.adding") : t("orders.add")}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) setEditTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("orders.edit")}</DialogTitle>
            <DialogDescription>{t("orders.edit")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit}>
            {orderFormContent}
            <DialogFooter><Button type="submit">{t("orders.save")}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {ORDER_STATUSES.map((status) => (
          <Card key={status} size="sm" className="text-center cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all" onClick={() => setStatusFilter(status === "all" ? "all" : status)}>
            <CardContent>
              <p className="text-xs text-muted-foreground">{t(status === "all" ? "orders.all" : `orders.${status}`)}</p>
              <p className={`text-lg font-bold mt-1 ${status !== "all" ? STATUS_STYLES[status]?.split(" ")[2] : ""}`}>{statusCounts[status]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={t("orders.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card/60 border-white/10 dark:border-white/5 focus-visible:ring-primary/30"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {["all", ...ORDER_TYPES.map((ot) => ot.value)].map((tval) => (
            <button
              key={tval}
              onClick={() => setTypeFilter(tval)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                typeFilter === tval
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {t(tval === "all" ? "orders.all" : `orders.${tval}`)}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {ORDER_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {t(s === "all" ? "orders.all" : `orders.${s}`)}
            </button>
          ))}
        </div>
      </div>

      {filteredOrders.length === 0 && !isLoading && (
        <div className="bg-card/80 backdrop-blur-sm border border-white/10 dark:border-white/5 rounded-2xl p-12 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
            <ShoppingCart className="size-6 text-primary" />
          </div>
          <p className="text-muted-foreground">
            {search || typeFilter !== "all" || statusFilter !== "all" ? t("orders.noResults") : t("orders.empty")}
          </p>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t("orders.loading")}</p>
        </div>
      )}

      <div className="space-y-3">
        {filteredOrders.map((o) => (
          <div
            key={o.id}
            className="bg-card/80 backdrop-blur-sm border border-white/10 dark:border-white/5 rounded-2xl p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                  <ShoppingCart className="size-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{o.number}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="size-3" />
                    <span className="truncate">{o.customerId}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[o.status] || "bg-gray-100/80 dark:bg-gray-900/30 text-gray-600"}`}>
                  {t("orders." + o.status)}
                </span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="text-muted-foreground">{t("orders." + o.type)}</span>
              <span className="text-muted-foreground">{new Date(o.date).toLocaleDateString()}</span>
              <span className="font-bold">{activeWorkspace.currency} {o.total.toLocaleString()}</span>
              {o.dp > 0 && (
                <span className="text-muted-foreground">
                  {t("orders.dp")}: {activeWorkspace.currency} {o.dp.toLocaleString()}
                </span>
              )}
              {o.remaining > 0 && o.status !== "selesai" && (
                <span className="text-destructive">
                  {t("orders.remaining")}: {activeWorkspace.currency} {o.remaining.toLocaleString()}
                </span>
              )}
            </div>
            <div className="mt-3 flex items-center gap-1">
              <Button variant="ghost" size="icon-xs" onClick={() => openEdit(o)}>
                <Edit2 className="size-3" />
              </Button>
              <Button variant="ghost" size="icon-xs" onClick={() => removeOrder(o.id)}>
                <Trash2 className="size-3 text-destructive" />
              </Button>
              {o.status !== "selesai" && (
                <Button variant="ghost" size="icon-xs" onClick={() => editOrder(o.id, { status: "selesai" })}>
                  <CheckCircle className="size-3 text-emerald-500" />
                </Button>
              )}
              <a
                href={buildWhatsAppUrl(o)}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Phone className="size-3" /> {t("orders.whatsapp")}
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
