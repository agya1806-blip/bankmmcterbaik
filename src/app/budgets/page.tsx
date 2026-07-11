"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/engines/identity/auth-store";
import { useWorkspaceStore } from "@/engines/workspace/workspace-store";
import { useFinancialStore } from "@/engines/financial/financial-store";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { PlusIcon, PencilIcon, Trash2Icon, TrendingUpIcon, TrendingDownIcon, PiggyBankIcon } from "lucide-react";

export default function BudgetsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const { activeWorkspace, loadWorkspaces } = useWorkspaceStore();
  const {
    categories, transactions, budgets,
    isLoading, error,
    loadAccounts, loadCategories, loadTransactions, loadBudgets,
    addBudget, editBudget, removeBudget, clearError,
  } = useFinancialStore();

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<{ id: string; categoryId: string; amount: number; period: string; startDate: string } | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState<string>("monthly");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) loadWorkspaces(user.id);
  }, [user, loadWorkspaces]);

  useEffect(() => {
    if (activeWorkspace) {
      loadAccounts(activeWorkspace.id);
      loadCategories(activeWorkspace.id);
      loadTransactions(activeWorkspace.id);
      loadBudgets(activeWorkspace.id);
    }
  }, [activeWorkspace, loadAccounts, loadCategories, loadTransactions, loadBudgets]);

  const expenseCategories = useMemo(() => categories.filter((c) => c.type === "expense"), [categories]);

  const categoryNameMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  const categoryColorMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.color));
    return map;
  }, [categories]);

  const cashFlowData = useMemo(() => {
    const monthlyMap = new Map<string, { income: number; expense: number }>();
    transactions.forEach((tx) => {
      if (tx.type === "transfer" || tx.type === "debt" || tx.type === "receivable") return;
      const month = typeof tx.date === "string" ? tx.date.slice(0, 7) : new Date(tx.date).toISOString().slice(0, 7);
      if (!monthlyMap.has(month)) monthlyMap.set(month, { income: 0, expense: 0 });
      const entry = monthlyMap.get(month)!;
      if (tx.type === "income") entry.income += tx.amount;
      if (tx.type === "expense") entry.expense += tx.amount;
    });
    return Array.from(monthlyMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [transactions]);

  const profitLoss = useMemo(() => {
    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);
    return { income: totalIncome, expense: totalExpense, profit: totalIncome - totalExpense };
  }, [transactions]);

  const budgetVsActual = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return budgets.map((b) => {
      const actual = transactions
        .filter((t) => t.categoryId === b.categoryId && t.type === "expense" && (typeof t.date === "string" ? t.date.startsWith(currentMonth) : new Date(t.date).toISOString().startsWith(currentMonth)))
        .reduce((s, t) => s + t.amount, 0);
      return {
        ...b,
        categoryName: categoryNameMap.get(b.categoryId) || "Unknown",
        color: categoryColorMap.get(b.categoryId) || "#888",
        actual,
        remaining: b.amount - actual,
        percentage: b.amount > 0 ? Math.min((actual / b.amount) * 100, 100) : 0,
      };
    });
  }, [budgets, transactions, categoryNameMap, categoryColorMap]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">{t("loading")}</p>
      </div>
    );
  }

  if (!user || !activeWorkspace) return null;

  function resetForm() {
    setCategoryId(expenseCategories[0]?.id || "");
    setAmount("");
    setPeriod("monthly");
    setStartDate(new Date().toISOString().split("T")[0]);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!activeWorkspace) return;
    await addBudget({
      workspaceId: activeWorkspace.id,
      categoryId,
      amount: parseFloat(amount) || 0,
      period: period as "monthly" | "yearly",
      startDate,
    });
    setAddOpen(false);
    resetForm();
  }

  function openEdit(b: typeof budgets[0]) {
    setEditTarget({ id: b.id, categoryId: b.categoryId, amount: b.amount, period: b.period, startDate: b.startDate });
    setCategoryId(b.categoryId);
    setAmount(String(b.amount));
    setPeriod(b.period);
    setStartDate(b.startDate);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    await editBudget(editTarget.id, {
      amount: parseFloat(amount) || 0,
      period: period as "monthly" | "yearly",
      startDate,
    });
    setEditTarget(null);
    resetForm();
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">{t("budgets.title")}</h1>
          <p className="text-sm text-muted-foreground/60 mt-0.5">{t("budgets.description")}</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen} trigger={<Button><PlusIcon className="size-4" /> {t("budgets.add")}</Button>}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("budgets.add")}</DialogTitle>
                <DialogDescription>{t("budgets.add")}</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAdd}>
                <div className="space-y-4 py-4">
                  {error && <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("budgets.category")}</label>
                    <Select value={categoryId} onValueChange={(v) => v && setCategoryId(v)}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {expenseCategories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            <span className="flex items-center gap-2">
                              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                              {c.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("budgets.amount")}</label>
                    <Input type="number" step="0.01" min="0" value={amount}
                      onChange={(e) => { setAmount(e.target.value); if (error) clearError(); }} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("budgets.period")}</label>
                    <Select value={period} onValueChange={(v) => v && setPeriod(v)}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">{t("budgets.monthly")}</SelectItem>
                        <SelectItem value="yearly">{t("budgets.yearly")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("budgets.startDate")}</label>
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isLoading}>{isLoading ? t("budgets.adding") : t("budgets.add")}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5 rounded-2xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600">
                <TrendingUpIcon className="size-5 text-white" />
              </div>
            </div>
            <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider mb-1">{t("budgets.totalIncome")}</p>
            <p className="text-xl font-bold font-heading text-foreground">
              {activeWorkspace.currency} {profitLoss.income.toLocaleString()}
            </p>
          </div>
          <div className="bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5 rounded-2xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600">
                <TrendingDownIcon className="size-5 text-white" />
              </div>
            </div>
            <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider mb-1">{t("budgets.totalExpense")}</p>
            <p className="text-xl font-bold font-heading text-foreground">
              {activeWorkspace.currency} {profitLoss.expense.toLocaleString()}
            </p>
          </div>
          <div className="bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5 rounded-2xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600">
                <PiggyBankIcon className="size-5 text-white" />
              </div>
            </div>
            <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider mb-1">
              {profitLoss.profit >= 0 ? t("budgets.profit") : t("budgets.loss")}
            </p>
            <p className={`text-xl font-bold font-heading ${profitLoss.profit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              {activeWorkspace.currency} {Math.abs(profitLoss.profit).toLocaleString()}
            </p>
          </div>
        </div>

        {cashFlowData.length > 0 && (
          <div className="bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold font-heading">{t("budgets.cashFlow")}</h3>
                <p className="text-xs text-muted-foreground/60">{t("budgets.cashFlowSub")}</p>
              </div>
              <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
                <TrendingUpIcon className="size-5 text-white" />
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashFlowData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="income" fill="#22c55e" name={t("budgets.income")} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" fill="#ef4444" name={t("budgets.expense")} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {budgetVsActual.length > 0 && (
          <section>
            <h3 className="mb-4 text-lg font-bold font-heading">{t("budgets.budgetVsActual")}</h3>
            <div className="space-y-3">
              {budgetVsActual.map((b) => {
                const pct = b.amount > 0 ? (b.actual / b.amount) * 100 : 0;
                const barGradient = pct > 100
                  ? "from-red-500 to-red-400"
                  : pct >= 80
                  ? "from-amber-500 to-amber-400"
                  : "from-emerald-500 to-emerald-400";
                return (
                  <div key={b.id} className="bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                        <div className="min-w-0">
                          <p className="text-sm font-bold font-heading text-foreground truncate">{b.categoryName}</p>
                          <p className="text-xs text-muted-foreground/60">{t("budgets." + b.period)} {t("budgets.period")}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground/70 whitespace-nowrap">
                          {activeWorkspace.currency} {b.actual.toLocaleString()} / {b.amount.toLocaleString()}
                        </span>
                        <span className={`text-xs font-semibold whitespace-nowrap ${
                          b.remaining >= 0 ? "text-emerald-600" : "text-red-500"
                        }`}>
                          {b.remaining >= 0 ? t("budgets.remaining") : t("budgets.overspent")}
                        </span>
                        <Button variant="ghost" size="icon-xs" onClick={() => openEdit(b)}>
                          <PencilIcon className="size-3" />
                        </Button>
                        <Button variant="ghost" size="icon-xs" onClick={() => removeBudget(b.id)}>
                          <Trash2Icon className="size-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${barGradient} transition-all duration-500`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) setEditTarget(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("budgets.edit")}</DialogTitle>
              <DialogDescription>{t("budgets.edit")}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEdit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("budgets.amount")}</label>
                  <Input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("budgets.period")}</label>
                  <Select value={period} onValueChange={(v) => v && setPeriod(v)}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">{t("budgets.monthly")}</SelectItem>
                      <SelectItem value="yearly">{t("budgets.yearly")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("budgets.startDate")}</label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">{t("budgets.save")}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {budgetVsActual.length === 0 && cashFlowData.length === 0 && (
          <div className="bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5 rounded-2xl py-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="size-14 rounded-2xl bg-muted/50 flex items-center justify-center">
                <PiggyBankIcon className="size-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground/60">{t("budgets.empty")}</p>
            </div>
          </div>
        )}
      </div>
  );
}
