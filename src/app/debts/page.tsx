"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import { useAuthStore } from "@/engines/identity/auth-store";
import { useWorkspaceStore } from "@/engines/workspace/workspace-store";
import { useFinancialStore } from "@/engines/financial/financial-store";
import { createTransaction } from "@/lib/db";
import type { Transaction } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
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
import { Plus, ArrowUpRight, ArrowDownRight, Search, User, Calendar, Trash2 } from "lucide-react";

export default function DebtsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const { activeWorkspace, loadWorkspaces } = useWorkspaceStore();
  const {
    accounts, transactions, isLoading,
    loadAccounts, loadTransactions, removeTransaction,
  } = useFinancialStore();

  const [tab, setTab] = useState<"debt" | "receivable">("debt");
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formDesc, setFormDesc] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) loadWorkspaces(user.id);
  }, [user, loadWorkspaces]);

  useEffect(() => {
    if (activeWorkspace) {
      loadAccounts(activeWorkspace.id);
      loadTransactions(activeWorkspace.id);
    }
  }, [activeWorkspace, loadAccounts, loadTransactions]);

  const filtered = useMemo(() => {
    let result = transactions.filter((t) => t.type === tab);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((t) => t.description.toLowerCase().includes(q));
    }
    result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return result;
  }, [transactions, tab, search]);

  const totalAmount = useMemo(() => filtered.reduce((s, t) => s + t.amount, 0), [filtered]);

  function resetForm() {
    setFormName("");
    setFormAmount("");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormDesc("");
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!activeWorkspace || !formName || !formAmount) return;
    const defaultAccount = accounts[0];
    if (!defaultAccount) return;
    await createTransaction({
      id: crypto.randomUUID(),
      workspaceId: activeWorkspace.id,
      type: tab,
      amount: parseFloat(formAmount) || 0,
      accountId: defaultAccount.id,
      description: formDesc ? `${formName} - ${formDesc}` : formName,
      date: formDate,
      createdAt: Date.now(),
    });
    await loadTransactions(activeWorkspace.id);
    setAddOpen(false);
    resetForm();
  }

  async function handleDelete(tx: Transaction) {
    if (!confirm(t("transactions.deleteConfirm"))) return;
    await removeTransaction(tx.id);
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">{t("loading")}</p>
      </div>
    );
  }

  if (!user || !activeWorkspace) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">{t("nav.debts")}</h1>
          <p className="text-sm text-muted-foreground/60 mt-0.5">{t("transactions.desc")}</p>
        </div>
        <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); if (open) resetForm(); }} trigger={<Button><Plus className="size-4" /> {t("transactions.add")}</Button>}>
          <DialogContent className="sm:max-w-md bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5">
            <DialogHeader>
              <DialogTitle>{t("transactions.add")}</DialogTitle>
              <DialogDescription>{t("transactions.add")}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAdd}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("customers.name")}</label>
                  <Input value={formName} onChange={(e) => setFormName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("transactions.amount")}</label>
                  <Input type="number" step="0.01" min="0" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("transactions.date")}</label>
                  <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("transactions.description")}</label>
                  <Input value={formDesc} onChange={(e) => setFormDesc(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? t("transactions.saving") : t("transactions.save")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        <Button variant={tab === "debt" ? "default" : "outline"} onClick={() => setTab("debt")}>
          <ArrowUpRight className="size-4" /> {t("transactions.debt")}
        </Button>
        <Button variant={tab === "receivable" ? "default" : "outline"} onClick={() => setTab("receivable")}>
          <ArrowDownRight className="size-4" /> {t("transactions.receivable")}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {tab === "debt" ? t("transactions.debt") : t("transactions.receivable")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeWorkspace.currency} {totalAmount.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">{filtered.length} {t("transactions.description")}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {tab === "debt" ? t("transactions.receivable") : t("transactions.debt")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {activeWorkspace.currency} {transactions.filter((t) => t.type === (tab === "debt" ? "receivable" : "debt")).reduce((s, t) => s + t.amount, 0).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{transactions.filter((t) => t.type === (tab === "debt" ? "receivable" : "debt")).length} {t("transactions.description")}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1 flex-1 min-w-[200px]">
          <label className="text-xs text-muted-foreground">{t("transactions.search")}</label>
          <Input placeholder={t("transactions.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {filtered.length === 0 && !isLoading && (
        <Card className="bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5">
          <CardContent className="py-8 text-center text-muted-foreground">
            {t("transactions.empty")}
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {filtered.map((tx) => (
          <Card key={tx.id} className="bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5">
            <div className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                    tab === "debt"
                      ? "bg-orange-100/80 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
                      : "bg-purple-100/80 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                  }`}>
                    <User className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-foreground truncate">{tx.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-xs">{t("transactions." + tx.type)}</Badge>
                      <Calendar className="size-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{new Date(tx.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="shrink-0 text-right flex items-center gap-3">
                  <p className={`text-sm font-semibold ${tab === "receivable" ? "text-emerald-600" : "text-red-600"}`}>
                    {tab === "receivable" ? "+" : "-"}{activeWorkspace.currency} {tx.amount.toLocaleString()}
                  </p>
                  <Button variant="ghost" size="icon-xs" onClick={() => handleDelete(tx)}>
                    <Trash2 className="size-3 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
