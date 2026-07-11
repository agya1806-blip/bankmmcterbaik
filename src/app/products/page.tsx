"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/engines/identity/auth-store";
import { useWorkspaceStore } from "@/engines/workspace/workspace-store";
import { useProductStore } from "@/engines/business/product-store";
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
import { Plus, Search, Edit2, Trash2, Tag } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const PRODUCT_TYPES = [
  { value: "service", labelKey: "products.service" },
  { value: "goods", labelKey: "products.goods" },
];

export default function ProductsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuthStore();
  const { activeWorkspace, loadWorkspaces } = useWorkspaceStore();
  const {
    products, isLoading, error,
    loadProducts, addProduct, editProduct, removeProduct, clearError,
  } = useProductStore();

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<{ id: string; name: string; type: "service" | "goods"; category: string; price: number; unit: string; stock: number; description: string } | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<"service" | "goods">("goods");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("");
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) loadWorkspaces(user.id);
  }, [user, loadWorkspaces]);

  useEffect(() => {
    if (activeWorkspace) loadProducts(activeWorkspace.id);
  }, [activeWorkspace, loadProducts]);

  if (authLoading) return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">{t("loading")}</p></div>;
  if (!user || !activeWorkspace) return null;

  function resetForm() {
    setName(""); setType("goods"); setCategory(""); setPrice(""); setUnit(""); setStock(""); setDescription("");
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!activeWorkspace) return;
    await addProduct({
      workspaceId: activeWorkspace.id,
      name,
      type,
      category,
      price: parseFloat(price) || 0,
      unit,
      stock: parseInt(stock) || 0,
      description,
    });
    setAddOpen(false);
    resetForm();
  }

  function openEdit(p: typeof products[0]) {
    setEditTarget({ id: p.id, name: p.name, type: p.type, category: p.category, price: p.price, unit: p.unit, stock: p.stock, description: p.description });
    setName(p.name); setType(p.type); setCategory(p.category); setPrice(String(p.price)); setUnit(p.unit); setStock(String(p.stock)); setDescription(p.description);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    await editProduct(editTarget.id, {
      name, type, category,
      price: parseFloat(price) || 0,
      unit,
      stock: parseInt(stock) || 0,
      description,
    });
    setEditTarget(null);
    resetForm();
  }

  const formFields = (
    <>
      <div className="space-y-2">
        <Label>{t("products.name")}</Label>
        <Input value={name} onChange={(e) => { setName(e.target.value); if (error) clearError(); }} required />
      </div>
      <div className="space-y-2">
        <Label>{t("products.type")}</Label>
        <Select value={type} onValueChange={(v) => setType(v as "service" | "goods")}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {PRODUCT_TYPES.map((pt) => (
              <SelectItem key={pt.value} value={pt.value}>{t(pt.labelKey)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>{t("products.category")}</Label>
        <Input value={category} onChange={(e) => setCategory(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t("products.price")}</Label>
          <Input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>{t("products.unit")}</Label>
          <Input value={unit} onChange={(e) => setUnit(e.target.value)} />
        </div>
      </div>
      {type === "goods" && (
        <div className="space-y-2">
          <Label>{t("products.stock")}</Label>
          <Input type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} />
        </div>
      )}
      <div className="space-y-2">
        <Label>{t("products.description")}</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
    </>
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("products.title")}</h1>
          <p className="text-muted-foreground">{products.length} {t("products.title")}</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen} trigger={<Button><Plus className="size-4" /> {t("products.add")}</Button>}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("products.add")}</DialogTitle>
              <DialogDescription>{t("products.add")}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAdd}>
              <div className="space-y-4 py-4">
                {error && <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
                {formFields}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>{isLoading ? t("products.adding") : t("products.add")}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) setEditTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("products.edit")}</DialogTitle>
            <DialogDescription>{t("products.edit")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit}>
            <div className="space-y-4 py-4">{formFields}</div>
            <DialogFooter><Button type="submit">{t("products.save")}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder={t("products.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-card/60 border-white/10 dark:border-white/5 focus-visible:ring-primary/30"
        />
      </div>

      {(() => {
        const filtered = search
          ? products.filter((p) =>
              p.name.toLowerCase().includes(search.toLowerCase()) ||
              p.category.toLowerCase().includes(search.toLowerCase())
            )
          : products;
        return (
          <>
            {filtered.length === 0 && !isLoading && (
              <div className="bg-card/80 backdrop-blur-sm border border-white/10 dark:border-white/5 rounded-2xl p-12 text-center">
                <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                  <Tag className="size-6 text-primary" />
                </div>
                <p className="text-muted-foreground">
                  {search ? t("products.noResults") : t("products.empty")}
                </p>
              </div>
            )}

            {isLoading && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{t("products.loading")}</p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {filtered.map((p) => (
                <div
                  key={p.id}
                  className="bg-card/80 backdrop-blur-sm border border-white/10 dark:border-white/5 rounded-2xl p-5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                        <Tag className="size-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{p.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {t(PRODUCT_TYPES.find((pt) => pt.value === p.type)?.labelKey || p.type)}
                          {p.category ? ` · ${p.category}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon-xs" onClick={() => openEdit(p)}>
                        <Edit2 className="size-3" />
                      </Button>
                      <Button variant="ghost" size="icon-xs" onClick={() => removeProduct(p.id)}>
                        <Trash2 className="size-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="font-bold text-primary">{activeWorkspace.currency} {p.price.toLocaleString()}</span>
                    {p.type === "goods" && (
                      <span className="text-muted-foreground">{t("products.stock")}: {p.stock} {p.unit}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        );
      })()}
    </div>
  );
}
