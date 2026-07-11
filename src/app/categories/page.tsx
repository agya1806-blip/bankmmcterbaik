"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/engines/identity/auth-store";
import { useWorkspaceStore } from "@/engines/workspace/workspace-store";
import { useFinancialStore } from "@/engines/financial/financial-store";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { PencilIcon, Trash2Icon, Tag } from "lucide-react";

const COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#6366f1",
];

export default function CategoriesPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const { activeWorkspace, loadWorkspaces } = useWorkspaceStore();
  const {
    categories,
    isLoading,
    error,
    loadCategories,
    addCategory,
    editCategory,
    removeCategory,
    clearError,
  } = useFinancialStore();

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<{ id: string; name: string; type: string; color: string } | null>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState<string>("expense");
  const [color, setColor] = useState(COLORS[0]);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) loadWorkspaces(user.id);
  }, [user, loadWorkspaces]);

  useEffect(() => {
    if (activeWorkspace) loadCategories(activeWorkspace.id);
  }, [activeWorkspace, loadCategories]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">{t("loading")}</p>
      </div>
    );
  }

  if (!user || !activeWorkspace) return null;

  function resetForm() {
    setName("");
    setType("expense");
    setColor(COLORS[0]);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!activeWorkspace) return;
    await addCategory({
      workspaceId: activeWorkspace.id,
      name,
      type: type as "income" | "expense",
      color,
    });
    setAddOpen(false);
    resetForm();
  }

  function openEdit(cat: typeof categories[0]) {
    setEditTarget({ id: cat.id, name: cat.name, type: cat.type, color: cat.color });
    setName(cat.name);
    setType(cat.type);
    setColor(cat.color);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    await editCategory(editTarget.id, {
      name,
      type: type as "income" | "expense",
      color,
    });
    setEditTarget(null);
    resetForm();
  }

  const incomeCats = categories.filter((c) => c.type === "income");
  const expenseCats = categories.filter((c) => c.type === "expense");

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("categories.title")}</h1>
          <p className="text-muted-foreground">
            {categories.length} {t("categories.name").toLowerCase()} &middot; {incomeCats.length} {t("categories.income").toLowerCase()} &middot; {expenseCats.length} {t("categories.expense").toLowerCase()}
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen} trigger={<Button>{t("categories.add")}</Button>}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("categories.add")}</DialogTitle>
              <DialogDescription>{t("categories.add")}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAdd}>
              <div className="space-y-4 py-4">
                {error && (
                  <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("categories.name")}</label>
                  <Input value={name} onChange={(e) => { setName(e.target.value); if (error) clearError(); }} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("categories.type")}</label>
                  <Select value={type} onValueChange={(v) => v && setType(v)}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">{t("categories.income")}</SelectItem>
                      <SelectItem value="expense">{t("categories.expense")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("categories.color")}</label>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`h-8 w-8 rounded-full border-2 transition-all ${
                          color === c ? "border-foreground scale-110" : "border-transparent"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? t("categories.adding") : t("categories.add")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) setEditTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("categories.edit")}</DialogTitle>
            <DialogDescription>{t("categories.edit")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("categories.name")}</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("categories.type")}</label>
                <Select value={type} onValueChange={(v) => v && setType(v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">{t("categories.income")}</SelectItem>
                    <SelectItem value="expense">{t("categories.expense")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("categories.color")}</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`h-8 w-8 rounded-full border-2 transition-all ${
                        color === c ? "border-foreground scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">{t("categories.save")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {categories.length === 0 && !isLoading && (
        <Card className="bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5 rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Tag className="size-10 mb-3 text-muted-foreground/50" />
            <p>{t("categories.empty")}</p>
          </CardContent>
        </Card>
      )}

      {incomeCats.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            {t("categories.income")}
          </h3>
          <div className="space-y-2">
            {incomeCats.map((cat) => (
              <Card
                key={cat.id}
                className="bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5 rounded-2xl p-4"
              >
                <CardContent className="p-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-4 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="font-medium">{cat.name}</span>
                      <Badge variant="success">{t("categories.income")}</Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon-xs" onClick={() => openEdit(cat)}>
                        <PencilIcon className="size-3" />
                      </Button>
                      <Button variant="ghost" size="icon-xs" onClick={() => removeCategory(cat.id)}>
                        <Trash2Icon className="size-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {expenseCats.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">
            {t("categories.expense")}
          </h3>
          <div className="space-y-2">
            {expenseCats.map((cat) => (
              <Card
                key={cat.id}
                className="bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5 rounded-2xl p-4"
              >
                <CardContent className="p-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-4 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="font-medium">{cat.name}</span>
                      <Badge variant="destructive">{t("categories.expense")}</Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon-xs" onClick={() => openEdit(cat)}>
                        <PencilIcon className="size-3" />
                      </Button>
                      <Button variant="ghost" size="icon-xs" onClick={() => removeCategory(cat.id)}>
                        <Trash2Icon className="size-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
