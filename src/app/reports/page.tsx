"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/engines/identity/auth-store";
import { useWorkspaceStore } from "@/engines/workspace/workspace-store";
import { useFinancialStore } from "@/engines/financial/financial-store";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";

const PIE_COLORS = ["#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

function periodDateRange(period: string) {
  const d = new Date();
  if (period === "daily") return { from: format(d, "yyyy-MM-dd"), to: format(d, "yyyy-MM-dd") };
  if (period === "weekly") return { from: format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd"), to: format(endOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd") };
  if (period === "monthly") return { from: format(startOfMonth(d), "yyyy-MM-dd"), to: format(endOfMonth(d), "yyyy-MM-dd") };
  return { from: format(startOfYear(d), "yyyy-MM-dd"), to: format(endOfYear(d), "yyyy-MM-dd") };
}

export default function ReportsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const { activeWorkspace, loadWorkspaces } = useWorkspaceStore();
  const {
    accounts, categories, transactions,
    isLoading,
    loadAccounts, loadCategories, loadTransactions,
  } = useFinancialStore();

  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly" | "yearly">("monthly");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterAccountId, setFilterAccountId] = useState("all");
  const [filterCategoryId, setFilterCategoryId] = useState("all");

  useEffect(() => {
    const range = periodDateRange(period);
    setFromDate(range.from);
    setToDate(range.to);
  }, [period]);

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
    }
  }, [activeWorkspace, loadAccounts, loadCategories, loadTransactions]);

  const accountMap = useMemo(() => {
    const map = new Map<string, string>();
    accounts.forEach((a) => map.set(a.id, a.name));
    return map;
  }, [accounts]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  const filteredTransactions = useMemo(() => {
    let result = [...transactions];
    if (fromDate) result = result.filter((t) => t.date >= fromDate);
    if (toDate) result = result.filter((t) => t.date <= toDate);
    if (filterAccountId !== "all") {
      result = result.filter((t) => t.accountId === filterAccountId || t.toAccountId === filterAccountId);
    }
    if (filterCategoryId !== "all") {
      result = result.filter((t) => t.categoryId === filterCategoryId);
    }
    return result.sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, fromDate, toDate, filterAccountId, filterCategoryId]);

  const summary = useMemo(() => {
    const income = filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);
    const expense = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);
    return {
      totalIncome: income,
      totalExpense: expense,
      netProfit: income - expense,
      count: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  const barChartData = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>();
    const periodKey = (date: string) => {
      if (period === "daily") return date;
      if (period === "weekly") return format(startOfWeek(new Date(date), { weekStartsOn: 1 }), "MMM d");
      if (period === "monthly") return date.slice(0, 7);
      return date.slice(0, 4);
    };
    filteredTransactions.forEach((tx) => {
      if (tx.type === "transfer" || tx.type === "debt" || tx.type === "receivable") return;
      const key = periodKey(tx.date);
      if (!map.has(key)) map.set(key, { income: 0, expense: 0 });
      const entry = map.get(key)!;
      if (tx.type === "income") entry.income += tx.amount;
      if (tx.type === "expense") entry.expense += tx.amount;
    });
    return Array.from(map.entries())
      .map(([label, data]) => ({ label, ...data }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [filteredTransactions, period]);

  const pieChartData = useMemo(() => {
    const map = new Map<string, number>();
    filteredTransactions
      .filter((t) => t.type === "expense" && t.categoryId)
      .forEach((tx) => {
        map.set(tx.categoryId!, (map.get(tx.categoryId!) || 0) + tx.amount);
      });
    return Array.from(map.entries())
      .map(([categoryId, value]) => ({
        name: categoryMap.get(categoryId) || "Unknown",
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions, categoryMap]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">{t("reports.loading")}</p>
      </div>
    );
  }

  if (!user || !activeWorkspace) return null;

  function handleExportJSON() {
    const blob = new Blob([JSON.stringify(filteredTransactions, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${fromDate}-to-${toDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const typeColorMap: Record<string, string> = {
    income: "bg-emerald-100/80 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
    expense: "bg-red-100/80 dark:bg-red-900/30 text-red-600 dark:text-red-400",
    transfer: "bg-blue-100/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    debt: "bg-orange-100/80 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
    receivable: "bg-purple-100/80 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">{t("reports.title")}</h1>
          <p className="text-sm text-muted-foreground/60 mt-0.5">{t("reports.description")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportJSON}>
            <Download className="size-4" /> {t("reports.exportPdf")}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportJSON}>
            <FileSpreadsheet className="size-4" /> {t("reports.exportExcel")}
          </Button>
        </div>
      </div>

      {/* Period Tabs */}
      <div className="flex flex-wrap gap-2">
        {(["daily", "weekly", "monthly", "yearly"] as const).map((p) => (
          <Button
            key={p}
            variant={period === p ? "primary" : "outline"}
            size="sm"
            onClick={() => setPeriod(p)}
          >
            {t(`reports.${p}`)}
          </Button>
        ))}
      </div>

      {/* Date Range + Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">{t("reports.from")}</label>
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-40" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">{t("reports.to")}</label>
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-40" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">{t("accounts.title")}</label>
          <Select value={filterAccountId} onValueChange={(v) => v && setFilterAccountId(v)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("reports.all")}</SelectItem>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">{t("categories.title")}</label>
          <Select value={filterCategoryId} onValueChange={(v) => v && setFilterCategoryId(v)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("reports.all")}</SelectItem>
              {categories.map((c) => (
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
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600">
                <TrendingUp className="size-5 text-white" />
              </div>
            </div>
            <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider mb-1">{t("reports.totalIncome")}</p>
            <p className="text-xl font-bold font-heading text-emerald-600">
              {activeWorkspace.currency} {summary.totalIncome.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600">
                <TrendingDown className="size-5 text-white" />
              </div>
            </div>
            <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider mb-1">{t("reports.totalExpense")}</p>
            <p className="text-xl font-bold font-heading text-red-500">
              {activeWorkspace.currency} {summary.totalExpense.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600">
                <DollarSign className="size-5 text-white" />
              </div>
            </div>
            <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider mb-1">{t("reports.netProfit")}</p>
            <p className={`text-xl font-bold font-heading ${summary.netProfit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              {summary.netProfit >= 0 ? "+" : "-"}{activeWorkspace.currency} {Math.abs(summary.netProfit).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
                <BarChart3 className="size-5 text-white" />
              </div>
            </div>
            <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider mb-1">{t("reports.totalTransactions")}</p>
            <p className="text-xl font-bold font-heading text-foreground">{summary.count}</p>
          </CardContent>
        </Card>
      </div>

      {/* Loading / Empty / Charts */}
      {isLoading ? (
        <div className="bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5 rounded-2xl p-5 text-center">
          <p className="text-muted-foreground">{t("reports.loading")}</p>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5 rounded-2xl py-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="size-14 rounded-2xl bg-muted/50 flex items-center justify-center">
              <BarChart3 className="size-6 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground/60">{t("reports.noData")}</p>
          </div>
        </div>
      ) : (
        <>
          {/* Bar Chart */}
          {barChartData.length > 0 && (
            <div className="bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold font-heading">{t("reports.income")} vs {t("reports.expense")}</h3>
                  <p className="text-xs text-muted-foreground/60">{fromDate} - {toDate}</p>
                </div>
                <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
                  <BarChart3 className="size-5 text-white" />
                </div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData}>
                    <XAxis dataKey="label" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="income" fill="#22c55e" name={t("reports.income")} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" fill="#ef4444" name={t("reports.expense")} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Pie Chart */}
          {pieChartData.length > 0 && (
            <div className="bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold font-heading">{t("reports.expense")} by {t("categories.title")}</h3>
                  <p className="text-xs text-muted-foreground/60">{fromDate} - {toDate}</p>
                </div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {pieChartData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Transaction List */}
          <div className="space-y-3">
            <h3 className="text-base font-bold font-heading">{t("reports.title")}</h3>
            {filteredTransactions.map((tx) => (
              <Card key={tx.id} className="bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5">
                <div className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${typeColorMap[tx.type] || ""}`}>
                        <DollarSign className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs capitalize">{t("transactions." + tx.type)}</Badge>
                          {tx.categoryId && (
                            <span className="text-xs text-muted-foreground">
                              &middot; {categoryMap.get(tx.categoryId) || ""}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-foreground truncate">
                          {tx.description || accountMap.get(tx.accountId) || ""}
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
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
