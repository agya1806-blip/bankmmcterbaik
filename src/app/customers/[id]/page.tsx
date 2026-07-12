"use client";

import { useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/engines/identity/auth-store";
import { useWorkspaceStore } from "@/engines/workspace/workspace-store";
import { useFinancialStore } from "@/engines/financial/financial-store";
import { useCRMStore } from "@/engines/business/crm-store";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuthStore();
  const { activeWorkspace, loadWorkspaces } = useWorkspaceStore();
  const { transactions, loadTransactions } = useFinancialStore();
  const { customers, loadCustomers } = useCRMStore();

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) loadWorkspaces(user.id);
  }, [user, loadWorkspaces]);

  useEffect(() => {
    if (activeWorkspace) {
      loadCustomers(activeWorkspace.id);
      loadTransactions(activeWorkspace.id);
    }
  }, [activeWorkspace, loadCustomers, loadTransactions]);

  const customer = useMemo(
    () => customers.find((c) => c.id === params.id),
    [customers, params.id]
  );

  const customerTxs = useMemo(
    () => transactions
      .filter((t) => t.description.toLowerCase().includes(customer?.name.toLowerCase() || ""))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [transactions, customer]
  );

  if (authLoading) return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">{t("loading")}</p></div>;
  if (!user || !activeWorkspace) return null;

  if (!customer) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
        <p className="text-muted-foreground">{t("customers.notFound")}</p>
        <Button variant="outline" onClick={() => router.push("/customers")}>{t("customers.back")}</Button>
      </div>
    );
  }

  const glassCard = "bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5 rounded-2xl p-6";

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.push("/customers")}>
          {t("customers.back")}
        </Button>
        <h1 className="text-2xl font-bold">{customer.name}</h1>
      </div>

      <div className={glassCard}>
        <h2 className="text-lg font-bold mb-4">{customer.name}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">{t("customers.email")}</p>
            <p className="text-sm">{customer.email || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("customers.phone")}</p>
            <p className="text-sm">{customer.phone || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("customers.address")}</p>
            <p className="text-sm">{customer.address || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("customers.notes")}</p>
            <p className="text-sm">{customer.notes || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("customers.customerSince")}</p>
            <p className="text-sm">{new Date(customer.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold mb-4">{t("customers.transactionHistory")}</h2>
        {customerTxs.length === 0 ? (
          <div className={glassCard + " text-center text-muted-foreground"}>
            {t("customers.noTransactions")}
          </div>
        ) : (
          <div className="space-y-3">
            {customerTxs.map((tx) => {
              const isPositive = tx.type === "income" || tx.type === "receivable";
              return (
                <div key={tx.id} className="bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5 rounded-2xl p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    isPositive ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                  }`}>
                    {isPositive ? "+" : "-"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium capitalize">{tx.type}</p>
                    <p className="text-xs text-muted-foreground truncate">{tx.description} · {new Date(tx.date).toLocaleDateString()}</p>
                  </div>
                  <p className={`text-sm font-semibold whitespace-nowrap ${isPositive ? "text-green-600" : "text-red-600"}`}>
                    {isPositive ? "+" : "-"}
                    {activeWorkspace.currency} {tx.amount.toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
