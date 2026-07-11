"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/engines/identity/auth-store";
import { useWorkspaceStore } from "@/engines/workspace/workspace-store";
import { useFinancialStore } from "@/engines/financial/financial-store";
import { useRecurringStore } from "@/engines/financial/recurring-store";
import { useTranslation } from "@/lib/i18n";
import { validateAmount } from "@/lib/validation";
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ArrowDownIcon, ArrowUpIcon, ArrowLeftRightIcon, ArrowRightLeftIcon, BanknoteIcon, PlusIcon, EditIcon, Trash2Icon, Repeat } from "lucide-react";

const TX_TYPES = [
  { value: "income", icon: ArrowDownIcon, color: "bg-emerald-100/80 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" },
  { value: "expense", icon: ArrowUpIcon, color: "bg-red-100/80 dark:bg-red-900/30 text-red-600 dark:text-red-400" },
  { value: "transfer", icon: ArrowLeftRightIcon, color: "bg-blue-100/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" },
  { value: "debt", icon: ArrowRightLeftIcon, color: "bg-orange-100/80 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400" },
  { value: "receivable", icon: BanknoteIcon, color: "bg-purple-100/80 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" },
] as const;

export default function TransactionsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const { activeWorkspace, loadWorkspaces } = useWorkspaceStore();
  const {
    accounts, categories, transactions,
    isLoading, error,
    loadAccounts, loadCategories, loadTransactions,
    addTransaction, editTransaction, removeTransaction, clearError,
  } = useFinancialStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<string | null>(null);
  const [type, setType] = useState<string>("expense");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const {
    rules: recurringRules, loadRules: loadRecurringRules,
    addRule: addRecurringRule, removeRule: removeRecurringRule,
    toggleRule: toggleRecurringRule,
  } = useRecurringStore();

  const [search, setSearch] = useState("");
  const [showRecurring, setShowRecurring] = useState(false);
  const [recurType, setRecurType] = useState<string>("expense");
  const [recurAmount, setRecurAmount] = useState("");
  const [recurAccountId, setRecurAccountId] = useState("");
  const [recurCategoryId, setRecurCategoryId] = useState("");
  const [recurDesc, setRecurDesc] = useState("");
  const [recurFreq, setRecurFreq] = useState<string>("monthly");
  const [recurInterval, setRecurInterval] = useState("1");
  const [recurStart, setRecurStart] = useState(new Date().toISOString().split("T")[0]);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterAccount, setFilterAccount] = useState<string>("all");

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
      loadRecurringRules(activeWorkspace.id);
    }
  }, [activeWorkspace, loadAccounts, loadCategories, loadTransactions, loadRecurringRules]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  const accountMap = useMemo(() => {
    const map = new Map<string, string>();
    accounts.forEach((a) => map.set(a.id, a.name));
    return map;
  }, [accounts]);

  const filteredTxs = useMemo(() => {
    let result = [...transactions];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((t) =>
        t.description.toLowerCase().includes(q) ||
        t.amount.toString().includes(q) ||
        accountMap.get(t.accountId)?.toLowerCase().includes(q) ||
        categoryMap.get(t.categoryId || "")?.toLowerCase().includes(q)
      );
    }
    if (filterType !== "all") result = result.filter((t) => t.type === filterType);
    if (filterAccount !== "all") result = result.filter((t) => t.accountId === filterAccount || t.toAccountId === filterAccount);
    result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return result;
  }, [transactions, search, filterType, filterAccount, accountMap, categoryMap]);

  const showCategory = type === "income" || type === "expense";
  const showToAccount = type === "transfer";
  const filteredCategories = categories.filter((c) => c.type === (type === "income" ? "income" : "expense"));

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">{t("loading")}</p>
      </div>
    );
  }

  if (!user || !activeWorkspace) return null;

  function resetForm() {
    setType("expense");
    setAmount("");
    setAccountId("");
    setToAccountId("");
    setCategoryId("");
    setDescription("");
    setDate(new Date().toISOString().split("T")[0]);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!activeWorkspace) return;
    const amountErr = validateAmount(amount);
    if (amountErr) { alert(amountErr); return; }
    if (!accountId) { alert(t("transactions.selectAccount")); return; }
    if (editingTx) {
      await editTransaction(editingTx, {
        type: type as Transaction["type"],
        amount: parseFloat(amount) || 0,
        accountId,
        toAccountId: type === "transfer" ? toAccountId : undefined,
        categoryId: (type === "income" || type === "expense") ? categoryId : undefined,
        description,
        date,
      });
    } else {
      await addTransaction({
        workspaceId: activeWorkspace.id,
        type: type as Transaction["type"],
        amount: parseFloat(amount) || 0,
        accountId,
        toAccountId: type === "transfer" ? toAccountId : undefined,
        categoryId: (type === "income" || type === "expense") ? categoryId : undefined,
        description,
        date,
      });
    }
    setDialogOpen(false);
    setEditingTx(null);
    resetForm();
  }

  function openEdit(tx: Transaction) {
    setEditingTx(tx.id);
    setType(tx.type);
    setAmount(String(tx.amount));
    setAccountId(tx.accountId);
    setToAccountId(tx.toAccountId || "");
    setCategoryId(tx.categoryId || "");
    setDescription(tx.description);
    setDate(tx.date);
    setDialogOpen(true);
  }

  async function handleDelete(tx: Transaction) {
    if (!confirm(t("transactions.deleteConfirm"))) return;
    await removeTransaction(tx.id);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">{t("transactions.title")}</h1>
          <p className="text-sm text-muted-foreground/60 mt-0.5">{t("transactions.description")}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (open) { setEditingTx(null); resetForm(); } }} trigger={<Button><PlusIcon className="size-4" /> {t("transactions.add")}</Button>}>
          <DialogContent className="sm:max-w-md bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5">
            <DialogHeader>
              <DialogTitle>{editingTx ? t("transactions.edit") : t("transactions.add")}</DialogTitle>
              <DialogDescription>{editingTx ? t("transactions.edit") : t("transactions.add")}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAdd}>
              <div className="space-y-4 py-4">
                {error && (
                  <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("transactions.type")}</label>
                  <Select value={type} onValueChange={(v) => v && setType(v)}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TX_TYPES.map((txType) => (
                        <SelectItem key={txType.value} value={txType.value}>{t("transactions." + txType.value)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("transactions.amount")}</label>
                  <Input type="number" step="0.01" min="0" value={amount}
                    onChange={(e) => { setAmount(e.target.value); if (error) clearError(); }} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {type === "transfer" ? t("transactions.fromAccount") : t("transactions.account")}
                  </label>
                  <Select value={accountId} onValueChange={(v) => v && setAccountId(v)}>
                    <SelectTrigger className="w-full"><SelectValue placeholder={t("transactions.selectAccount")} /></SelectTrigger>
                    <SelectContent>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.name} ({a.currency} {a.balance})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {showToAccount && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("transactions.toAccount")}</label>
                    <Select value={toAccountId} onValueChange={(v) => v && setToAccountId(v)}>
                      <SelectTrigger className="w-full"><SelectValue placeholder={t("transactions.selectAccount")} /></SelectTrigger>
                      <SelectContent>
                        {accounts.filter((a) => a.id !== accountId).map((a) => (
                          <SelectItem key={a.id} value={a.id}>{a.name} ({a.currency})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {showCategory && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("transactions.category")}</label>
                    <Select value={categoryId} onValueChange={(v) => v && setCategoryId(v)}>
                      <SelectTrigger className="w-full"><SelectValue placeholder={t("transactions.selectCategory")} /></SelectTrigger>
                      <SelectContent>
                        {filteredCategories.map((c) => (
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
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("transactions.description")}</label>
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("transactions.date")}</label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? t("transactions.saving") : editingTx ? t("transactions.update") : t("transactions.save")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1 flex-1 min-w-[200px]">
          <label className="text-xs text-muted-foreground">{t("transactions.search")}</label>
          <Input placeholder={t("transactions.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">{t("transactions.type")}</label>
          <Select value={filterType} onValueChange={(v) => v && setFilterType(v)}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("transactions.all")}</SelectItem>
              {TX_TYPES.map((txType) => (
                <SelectItem key={txType.value} value={txType.value}>{t("transactions." + txType.value)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">{t("transactions.account")}</label>
          <Select value={filterAccount} onValueChange={(v) => v && setFilterAccount(v)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("transactions.all")}</SelectItem>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Empty State */}
      {filteredTxs.length === 0 && !isLoading && (
        <Card className="bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5">
          <CardContent className="py-8 text-center text-muted-foreground">
            {t("transactions.empty")}
          </CardContent>
        </Card>
      )}

      {/* Recurring Toggle */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setShowRecurring(!showRecurring)}>
          <Repeat className="size-3" /> {t("transactions.recurringRules")} ({recurringRules.length})
        </Button>
      </div>

      {/* Recurring Rules Card */}
      {showRecurring && (
        <Card className="bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5">
          <CardHeader>
            <CardTitle className="text-base">{t("transactions.recurringRules")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recurringRules.length === 0 && (
              <p className="text-sm text-muted-foreground">{t("transactions.noResults")}</p>
            )}
            {recurringRules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{rule.description} ({t("transactions." + rule.type)})</p>
                  <p className="text-xs text-muted-foreground">
                    {activeWorkspace.currency} {rule.amount} &middot; {t("transactions.interval")} {rule.interval} ({t("transactions." + rule.frequency)}) &middot; {rule.nextDate}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon-xs" onClick={() => toggleRecurringRule(rule.id)}>
                    <span className={`size-2 rounded-full ${rule.active ? 'bg-green-500' : 'bg-gray-300'}`} />
                  </Button>
                  <Button variant="ghost" size="icon-xs" onClick={() => removeRecurringRule(rule.id)}>
                    <Trash2Icon className="size-3 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            <div className="border-t pt-4 space-y-3">
              <p className="text-sm font-medium">{t("transactions.addRule")}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <select className="rounded-lg border border-input bg-transparent px-2 py-1 text-sm" value={recurType} onChange={(e) => setRecurType(e.target.value)}>
                  <option value="income">{t("transactions.income")}</option>
                  <option value="expense">{t("transactions.expense")}</option>
                  <option value="transfer">{t("transactions.transfer")}</option>
                </select>
                <Input placeholder={t("transactions.amount")} type="number" step="0.01" value={recurAmount} onChange={(e) => setRecurAmount(e.target.value)} />
                <select className="rounded-lg border border-input bg-transparent px-2 py-1 text-sm" value={recurAccountId} onChange={(e) => setRecurAccountId(e.target.value)}>
                  <option value="">{t("transactions.account")}</option>
                  {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <select className="rounded-lg border border-input bg-transparent px-2 py-1 text-sm" value={recurCategoryId} onChange={(e) => setRecurCategoryId(e.target.value)}>
                  <option value="">{t("transactions.category")}</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <Input placeholder={t("transactions.description")} value={recurDesc} onChange={(e) => setRecurDesc(e.target.value)} />
                <select className="rounded-lg border border-input bg-transparent px-2 py-1 text-sm" value={recurFreq} onChange={(e) => setRecurFreq(e.target.value)}>
                  <option value="daily">{t("transactions.daily")}</option>
                  <option value="weekly">{t("transactions.weekly")}</option>
                  <option value="monthly">{t("transactions.monthly")}</option>
                  <option value="yearly">{t("transactions.yearly")}</option>
                </select>
                <Input placeholder={t("transactions.interval")} type="number" min="1" value={recurInterval} onChange={(e) => setRecurInterval(e.target.value)} />
                <Input type="date" value={recurStart} onChange={(e) => setRecurStart(e.target.value)} />
              </div>
              <Button size="sm" onClick={async () => {
                if (!activeWorkspace || !recurAmount || !recurAccountId) return;
                await addRecurringRule({
                  workspaceId: activeWorkspace.id,
                  type: recurType as "income" | "expense" | "transfer",
                  amount: parseFloat(recurAmount),
                  accountId: recurAccountId,
                  categoryId: recurCategoryId || undefined,
                  description: recurDesc,
                  frequency: recurFreq as "daily" | "weekly" | "monthly" | "yearly",
                  interval: parseInt(recurInterval) || 1,
                  startDate: recurStart,
                });
                setRecurAmount(""); setRecurDesc(""); setRecurCategoryId("");
              }}>
                {t("transactions.addRule")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction List */}
      <div className="space-y-3">
        {filteredTxs.map((tx) => {
          const txType = TX_TYPES.find((t) => t.value === tx.type);
          const Icon = txType?.icon;
          return (
            <Card key={tx.id} className="bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5">
              <div className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    {Icon && (
                      <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${txType?.color}`}>
                        <Icon className="size-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs capitalize">{t("transactions." + tx.type)}</Badge>
                        {tx.categoryId && (
                          <span className="text-xs text-muted-foreground">
                            &middot; {categoryMap.get(tx.categoryId) || t("transactions.category")}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-foreground truncate">
                        {tx.description || accountMap.get(tx.accountId) || t("transactions.description")}
                        {tx.toAccountId && ` → ${accountMap.get(tx.toAccountId) || "Unknown"}`}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`text-sm font-semibold ${
                      tx.type === "income" || tx.type === "receivable" ? "text-emerald-600" :
                      tx.type === "expense" || tx.type === "debt" ? "text-red-600" : ""
                    }`}>
                      {tx.type === "income" || tx.type === "receivable" ? "+" : ""}
                      {tx.type === "expense" || tx.type === "debt" ? "-" : ""}
                      {activeWorkspace.currency} {tx.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button variant="ghost" size="icon-xs" onClick={() => openEdit(tx)}>
                      <EditIcon className="size-3" />
                    </Button>
                    <Button variant="ghost" size="icon-xs" onClick={() => handleDelete(tx)}>
                      <Trash2Icon className="size-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
