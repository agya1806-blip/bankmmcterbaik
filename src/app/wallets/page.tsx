"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/engines/identity/auth-store";
import { useWorkspaceStore } from "@/engines/workspace/workspace-store";
import { useFinancialStore } from "@/engines/financial/financial-store";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Plus, Wallet, Building, Landmark, Smartphone, CreditCard, Trash2 } from "lucide-react";
import { createAccount } from "@/lib/db";

const ACCOUNT_TYPES = [
  { value: "bank", labelKey: "accounts.bank" },
  { value: "cash", labelKey: "accounts.cash" },
  { value: "ewallet", labelKey: "accounts.ewallet" },
  { value: "qris", labelKey: "accounts.qris" },
  { value: "custom", labelKey: "accounts.custom" },
] as const;

const TYPE_ICON: Record<string, React.ReactNode> = {
  bank: <Building className="size-6" />,
  cash: <Wallet className="size-6" />,
  ewallet: <Smartphone className="size-6" />,
  qris: <CreditCard className="size-6" />,
  custom: <Wallet className="size-6" />,
};

const TYPE_BADGE_VARIANT: Record<string, "default" | "success" | "secondary" | "warning" | "outline"> = {
  bank: "default",
  cash: "success",
  ewallet: "secondary",
  qris: "warning",
  custom: "outline",
};

export default function WalletsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const { activeWorkspace, loadWorkspaces } = useWorkspaceStore();
  const {
    accounts,
    isLoading,
    error,
    loadAccounts,
    removeAccount,
    clearError,
  } = useFinancialStore();

  const [addOpen, setAddOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<string>("bank");
  const [formBalance, setFormBalance] = useState("");
  const [formCurrency, setFormCurrency] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) loadWorkspaces(user.id);
  }, [user, loadWorkspaces]);

  useEffect(() => {
    if (activeWorkspace) {
      loadAccounts(activeWorkspace.id);
      setFormCurrency(activeWorkspace.currency);
    }
  }, [activeWorkspace, loadAccounts]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">{t("loading")}</p>
      </div>
    );
  }

  if (!user || !activeWorkspace) return null;

  function resetForm() {
    setFormName("");
    setFormType("bank");
    setFormBalance("");
    if (activeWorkspace) setFormCurrency(activeWorkspace.currency);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!activeWorkspace) return;
    setAddLoading(true);
    try {
      await createAccount({
        id: crypto.randomUUID(),
        workspaceId: activeWorkspace.id,
        name: formName,
        type: formType as "bank" | "cash" | "ewallet" | "qris" | "custom",
        balance: parseFloat(formBalance) || 0,
        currency: formCurrency,
        createdAt: Date.now(),
      });
      await loadAccounts(activeWorkspace.id);
      setAddOpen(false);
      resetForm();
    } catch {
      // error handled by store
    } finally {
      setAddLoading(false);
    }
  }

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">{t("wallets.title")}</h1>
          <p className="text-sm text-muted-foreground/60 mt-0.5">
            {t("wallets.description")}
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="size-4" /> {t("wallets.add")}
        </Button>
      </div>

      {accounts.length > 0 && (
        <Card className="bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5 mb-6">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground/60">{t("wallets.totalBalance")}</p>
            <p className="text-2xl font-bold font-heading">
              {activeWorkspace.currency} {totalBalance.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("wallets.add")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd}>
            <div className="space-y-4 py-4">
              {error && (
                <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
              )}
              <div className="space-y-2">
                <Label>{t("wallets.name")}</Label>
                <Input value={formName} onChange={(e) => { setFormName(e.target.value); if (error) clearError(); }} required />
              </div>
              <div className="space-y-2">
                <Label>{t("wallets.type")}</Label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {ACCOUNT_TYPES.map((at) => (
                    <option key={at.value} value={at.value}>{t(at.labelKey)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>{t("wallets.balance")}</Label>
                <Input type="number" step="0.01" value={formBalance} onChange={(e) => setFormBalance(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("wallets.currency")}</Label>
                <Input value={formCurrency} onChange={(e) => setFormCurrency(e.target.value)} required />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={addLoading}>
                {addLoading ? t("wallets.adding") : t("wallets.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {accounts.length === 0 && !isLoading && (
        <Card className="bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground/60">{t("wallets.empty")}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {accounts.map((acc) => (
          <Card key={acc.id} className="bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-lg bg-muted/60">
                  {TYPE_ICON[acc.type] ?? <Wallet className="size-6" />}
                </div>
                <Button variant="ghost" size="icon-sm" onClick={() => {
                  if (confirm(t("wallets.deleteConfirm"))) {
                    removeAccount(acc.id);
                  }
                }}>
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <CardTitle className="text-base font-bold">{acc.name}</CardTitle>
              <p className="text-lg font-bold font-heading">
                {activeWorkspace.currency} {acc.balance.toLocaleString()}
              </p>
              <Badge variant={TYPE_BADGE_VARIANT[acc.type] ?? "default"} className="capitalize text-[10px] px-2 py-0.5">
                {t("accounts." + acc.type)}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
