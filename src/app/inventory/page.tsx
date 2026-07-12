"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/engines/identity/auth-store";
import { useWorkspaceStore } from "@/engines/workspace/workspace-store";
import { useInventoryStore } from "@/engines/inventory/inventory-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusIcon, PencilIcon, Trash2Icon, PackageIcon, ArrowDownIcon, ArrowUpIcon, ClipboardListIcon } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function InventoryPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuthStore();
  const { activeWorkspace, loadWorkspaces } = useWorkspaceStore();
  const {
    items, mutations, isLoading, error,
    loadItems, loadMutations, addItem, editItem, removeItem,
    stockIn, stockOut, stockOpname, clearError,
  } = useInventoryStore();

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<{ id: string; name: string; sku: string; category: string; unit: string; price: number } | null>(null);
  const [opnameTarget, setOpnameTarget] = useState<{ id: string; name: string; stock: number } | null>(null);

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [stock, setStock] = useState("0");
  const [price, setPrice] = useState("0");
  const [mutationQty, setMutationQty] = useState("1");
  const [mutationNote, setMutationNote] = useState("");
  const [opnameStock, setOpnameStock] = useState("0");
  const [opnameNote, setOpnameNote] = useState("");
  const [stockActionItem, setStockActionItem] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) loadWorkspaces(user.id);
  }, [user, loadWorkspaces]);

  useEffect(() => {
    if (activeWorkspace) {
      loadItems(activeWorkspace.id);
      loadMutations(activeWorkspace.id);
    }
  }, [activeWorkspace, loadItems, loadMutations]);

  const itemMap = useMemo(() => {
    const map = new Map<string, string>();
    items.forEach((i) => map.set(i.id, i.name));
    return map;
  }, [items]);

  if (authLoading) return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">{t("loading")}</p></div>;
  if (!user || !activeWorkspace) return null;

  function resetForm() {
    setName(""); setSku(""); setCategory(""); setUnit("pcs"); setStock("0"); setPrice("0");
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!activeWorkspace) return;
    try {
      await addItem({
        workspaceId: activeWorkspace.id, name, sku, category, unit,
        stock: parseInt(stock) || 0, price: parseFloat(price) || 0,
      });
    } finally {
      setAddOpen(false);
      resetForm();
    }
  }

  function openEdit(i: typeof items[0]) {
    setEditTarget({ id: i.id, name: i.name, sku: i.sku, category: i.category, unit: i.unit, price: i.price });
    setName(i.name); setSku(i.sku); setCategory(i.category); setUnit(i.unit); setPrice(String(i.price));
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    try {
      await editItem(editTarget.id, { name, sku, category, unit, price: parseFloat(price) || 0 });
    } finally {
      setEditTarget(null); resetForm();
    }
  }

  async function handleStockIn(e: React.FormEvent) {
    e.preventDefault();
    if (!activeWorkspace || !stockActionItem) return;
    try {
      await stockIn(stockActionItem, parseInt(mutationQty) || 1, mutationNote, activeWorkspace.id);
    } finally {
      setStockActionItem(null); setMutationQty("1"); setMutationNote("");
    }
  }

  async function handleStockOut(e: React.FormEvent) {
    e.preventDefault();
    if (!activeWorkspace || !stockActionItem) return;
    try {
      await stockOut(stockActionItem, parseInt(mutationQty) || 1, mutationNote, activeWorkspace.id);
    } finally {
      setStockActionItem(null); setMutationQty("1"); setMutationNote("");
    }
  }

  function openOpname(i: typeof items[0]) {
    setOpnameTarget({ id: i.id, name: i.name, stock: i.stock });
    setOpnameStock(String(i.stock));
    setOpnameNote("");
  }

  async function handleOpname(e: React.FormEvent) {
    e.preventDefault();
    if (!activeWorkspace || !opnameTarget) return;
    try {
      await stockOpname(opnameTarget.id, parseInt(opnameStock) || 0, opnameNote, activeWorkspace.id);
    } finally {
      setOpnameTarget(null);
    }
  }

  const itemFormFields = (
    <>
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("inventory.name")}</label>
        <Input value={name} onChange={(e) => { setName(e.target.value); if (error) clearError(); }} required />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">SKU</label>
        <Input value={sku} onChange={(e) => setSku(e.target.value)} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("inventory.category")}</label>
        <Input value={category} onChange={(e) => setCategory(e.target.value)} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("inventory.unit")}</label>
        <Select value={unit} onValueChange={(v) => v && setUnit(v)}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pcs">{t("inventory.pieces")}</SelectItem>
            <SelectItem value="kg">{t("inventory.kilogram")}</SelectItem>
            <SelectItem value="g">{t("inventory.gram")}</SelectItem>
            <SelectItem value="l">{t("inventory.liter")}</SelectItem>
            <SelectItem value="m">{t("inventory.meter")}</SelectItem>
            <SelectItem value="box">{t("inventory.box")}</SelectItem>
            <SelectItem value="pack">{t("inventory.pack")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {!editTarget && (
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("inventory.initialStock")}</label>
          <Input type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} />
        </div>
      )}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("inventory.unitPrice")}</label>
        <Input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />
      </div>
    </>
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("inventory.title")}</h1>
          <p className="text-sm text-muted-foreground">{items.length} items · {items.reduce((s, i) => s + i.stock, 0)} total stock</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen} trigger={<Button><PlusIcon className="size-4" /> {t("inventory.add")}</Button>}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("inventory.add")}</DialogTitle>
              <DialogDescription>Add a new product or material</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAdd}>
              <div className="space-y-4 py-4">
                {error && <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
                {itemFormFields}
              </div>
              <DialogFooter><Button type="submit" disabled={isLoading}>{isLoading ? t("inventory.adding") : t("inventory.add")}</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) setEditTarget(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("inventory.edit")}</DialogTitle><DialogDescription>Update item details</DialogDescription></DialogHeader>
          <form onSubmit={handleEdit}>
            <div className="space-y-4 py-4">{itemFormFields}</div>
            <DialogFooter><Button type="submit">{t("inventory.save")}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!stockActionItem} onOpenChange={(o) => { if (!o) setStockActionItem(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Stock In / Out</DialogTitle><DialogDescription>Record stock movement</DialogDescription></DialogHeader>
          <Tabs defaultValue="in">
            <TabsList><TabsTrigger value="in">{t("inventory.stockIn")}</TabsTrigger><TabsTrigger value="out">{t("inventory.stockOut")}</TabsTrigger></TabsList>
            <TabsContent value="in">
              <form onSubmit={handleStockIn}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("inventory.quantityToAdd")}</label>
                    <Input type="number" min="1" value={mutationQty} onChange={(e) => setMutationQty(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("inventory.note")}</label>
                    <Input value={mutationNote} onChange={(e) => setMutationNote(e.target.value)} />
                  </div>
                </div>
                <DialogFooter><Button type="submit" disabled={isLoading}>{isLoading ? t("inventory.processing") : t("inventory.stockIn")}</Button></DialogFooter>
              </form>
            </TabsContent>
            <TabsContent value="out">
              <form onSubmit={handleStockOut}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("inventory.quantityToRemove")}</label>
                    <Input type="number" min="1" value={mutationQty} onChange={(e) => setMutationQty(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("inventory.note")}</label>
                    <Input value={mutationNote} onChange={(e) => setMutationNote(e.target.value)} />
                  </div>
                </div>
                <DialogFooter><Button type="submit" disabled={isLoading}>{isLoading ? t("inventory.processing") : t("inventory.stockOut")}</Button></DialogFooter>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={!!opnameTarget} onOpenChange={(o) => { if (!o) setOpnameTarget(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("inventory.stockOpname")}</DialogTitle><DialogDescription>Adjust stock for {opnameTarget?.name}</DialogDescription></DialogHeader>
          <form onSubmit={handleOpname}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("inventory.currentStock")}</label>
                <p className="text-sm font-bold">{opnameTarget?.stock}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("inventory.newStock")}</label>
                <Input type="number" min="0" value={opnameStock} onChange={(e) => setOpnameStock(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("inventory.note")}</label>
                <Input value={opnameNote} onChange={(e) => setOpnameNote(e.target.value)} />
              </div>
            </div>
            <DialogFooter><Button type="submit" disabled={isLoading}>{isLoading ? t("inventory.savingOpname") : t("inventory.save")}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {items.length === 0 && !isLoading && (
        <Card className="premium-card">
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
              <PackageIcon className="size-8 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">{t("inventory.empty")}</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="premium-card p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                  <PackageIcon className="size-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.sku && `${item.sku} · `}{item.category} · {item.unit}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className={`text-lg font-semibold ${item.stock <= 0 ? "text-destructive" : item.stock < 10 ? "text-orange-500" : ""}`}>
                    {item.stock} {item.unit}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activeWorkspace.currency} {item.price.toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon-xs" onClick={() => { setStockActionItem(item.id); }}>
                    <ArrowDownIcon className="size-3" />
                  </Button>
                  <Button variant="ghost" size="icon-xs" onClick={() => { setStockActionItem(item.id); }}>
                    <ArrowUpIcon className="size-3" />
                  </Button>
                  <Button variant="ghost" size="icon-xs" onClick={() => openOpname(item)}>
                    <ClipboardListIcon className="size-3" />
                  </Button>
                  <Button variant="ghost" size="icon-xs" onClick={() => openEdit(item)}>
                    <PencilIcon className="size-3" />
                  </Button>
                  <Button variant="ghost" size="icon-xs" onClick={() => removeItem(item.id)}>
                    <Trash2Icon className="size-3 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {mutations.length > 0 && (
        <section>
          <h3 className="mb-3 text-lg font-semibold">{t("inventory.mutations")}</h3>
          <div className="space-y-2">
            {mutations.sort((a, b) => b.createdAt - a.createdAt).slice(0, 20).map((m) => (
              <div key={m.id} className="premium-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex size-9 items-center justify-center rounded-full ${
                      m.type === "in" ? "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400" :
                      m.type === "out" ? "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400" : "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    }`}>
                      {m.type === "in" ? <ArrowDownIcon className="size-4" /> :
                       m.type === "out" ? <ArrowUpIcon className="size-4" /> :
                       <ClipboardListIcon className="size-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium capitalize">{m.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {itemMap.get(m.itemId) || "Unknown"} · {m.note}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">
                      {m.stockBefore} → {m.stockAfter}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(m.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
