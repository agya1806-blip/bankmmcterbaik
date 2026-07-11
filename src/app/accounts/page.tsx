"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/engines/identity/auth-store";
import { useWorkspaceStore } from "@/engines/workspace/workspace-store";
import { useFinancialStore } from "@/engines/financial/financial-store";
import { useTranslation } from "@/lib/i18n";
import type { Account } from "@/lib/db";
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
import { Badge } from "@/components/ui/badge";
import { PencilIcon, Trash2Icon, Plus, Wallet, Landmark, Smartphone, CreditCard } from "lucide-react";

const ACCOUNT_TYPES = [
  { value: "bank", labelKey: "accounts.bank" },
  { value: "cash", labelKey: "accounts.cash" },
  { value: "ewallet", labelKey: "accounts.ewallet" },
  { value: "qris", labelKey: "accounts.qris" },
  { value: "custom", labelKey: "accounts.custom" },
] as const;

const TYPE_BADGE_VARIANT: Record<string, "default" | "success" | "secondary" | "warning" | "outline"> = {
  bank: "default",
  cash: "success",
  ewallet: "secondary",
  qris: "warning",
  custom: "outline",
};

const TYPE_ICON: Record<string, React.ElementType> = {
  bank: Landmark,
  cash: Wallet,
  ewallet: Smartphone,
  qris: CreditCard,
  custom: Wallet,
};

export default function AccountsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const { activeWorkspace, loadWorkspaces } = useWorkspaceStore();
  const {
    accounts,
    isLoading,
    error,
    loadAccounts,
    addAccount,
    editAccount,
    removeAccount,
    clearError,
  } = useFinancialStore();

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<{ id: string; name: string; type: string; balance: number; currency: string } | null>(null);
  const [accountsTab, setAccountsTab] = useState<"grid" | "list">("grid");

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const [name, setName] = useState("");
  const [type, setType] = useState<string>("bank");
  const [balance, setBalance] = useState("");
  const [currency, setCurrency] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) loadWorkspaces(user.id);
  }, [user, loadWorkspaces]);

  useEffect(() => {
    if (activeWorkspace) {
      loadAccounts(activeWorkspace.id);
      setCurrency(activeWorkspace.currency);
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
    setName("");
    setType("bank");
    setBalance("");
    if (activeWorkspace) setCurrency(activeWorkspace.currency);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!activeWorkspace) return;
    await addAccount({
      workspaceId: activeWorkspace.id,
      name,
      type: type as Account["type"],
      balance: parseFloat(balance) || 0,
      currency,
    });
    setAddOpen(false);
    resetForm();
  }

  function openEdit(acc: typeof accounts[0]) {
    setEditTarget({ id: acc.id, name: acc.name, type: acc.type, balance: acc.balance, currency: acc.currency });
    setName(acc.name);
    setType(acc.type);
    setBalance(String(acc.balance));
    setCurrency(acc.currency);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    await editAccount(editTarget.id, {
      name,
      type: type as Account["type"],
      balance: parseFloat(balance) || 0,
      currency,
    });
    setEditTarget(null);
    resetForm();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">{t("accounts.title")}</h1>
          <p className="text-sm text-muted-foreground/60 mt-0.5">
            {t("accounts.description")}
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen} trigger={<Button><Plus className="size-4" /> {t("accounts.add")}</Button>}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("accounts.add")}</DialogTitle>
              <DialogDescription>{t("accounts.add")}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAdd}>
              <div className="space-y-4 py-4">
                {error && (
                  <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("accounts.name")}</label>
                  <Input value={name} onChange={(e) => { setName(e.target.value); if (error) clearError(); }} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("accounts.type")}</label>
                  <Select value={type} onValueChange={(v) => v && setType(v)}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ACCOUNT_TYPES.map((at) => (
                        <SelectItem key={at.value} value={at.value}>{t(at.labelKey)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("accounts.balance")}</label>
                  <Input type="number" step="0.01" value={balance} onChange={(e) => setBalance(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("accounts.currency")}</label>
                  <Input value={currency} onChange={(e) => setCurrency(e.target.value)} required />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? t("accounts.adding") : t("accounts.add")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setAccountsTab("grid")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
            accountsTab === "grid"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Akun Saya
        </button>
        <button
          onClick={() => setAccountsTab("list")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
            accountsTab === "list"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Semua Akun
        </button>
      </div>

      <div className="mb-6">
        <Card className="bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t("wallets.totalBalance")}</span>
              <span className="text-xl font-bold font-heading">{activeWorkspace.currency} {totalBalance.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) setEditTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("accounts.edit")}</DialogTitle>
            <DialogDescription>{t("accounts.edit")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("accounts.name")}</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("accounts.type")}</label>
                <Select value={type} onValueChange={(v) => v && setType(v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map((at) => (
                      <SelectItem key={at.value} value={at.value}>{t(at.labelKey)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("accounts.balance")}</label>
                <Input type="number" step="0.01" value={balance} onChange={(e) => setBalance(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("accounts.currency")}</label>
                <Input value={currency} onChange={(e) => setCurrency(e.target.value)} required />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">{t("accounts.save")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {accounts.length === 0 && !isLoading ? (
        <Card className="bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground/60">{t("accounts.empty")}</p>
          </CardContent>
        </Card>
      ) : accountsTab === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {accounts.map((acc) => {
            const IconComponent = TYPE_ICON[acc.type] ?? Wallet;
            return (
              <div key={acc.id} className="premium-card p-4 rounded-xl border border-white/10 dark:border-white/5 bg-card/80 backdrop-blur-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className="size-10 rounded-lg bg-muted flex items-center justify-center">
                    <IconComponent className="size-5" />
                  </div>
                  <Button variant="ghost" size="icon-sm" onClick={() => {
                    if (confirm(t("accounts.deleteConfirm"))) {
                      removeAccount(acc.id);
                    }
                  }}>
                    <Trash2Icon className="size-4 text-destructive" />
                  </Button>
                </div>
                <p className="font-medium text-sm text-foreground mb-1">{acc.name}</p>
                <p className="text-lg font-bold font-heading mb-2">{acc.currency} {acc.balance.toLocaleString()}</p>
                <Badge variant={TYPE_BADGE_VARIANT[acc.type] ?? "default"} className="capitalize text-[10px] px-2 py-0.5">
                  {t("accounts." + acc.type)}
                </Badge>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((acc) => (
            <Card key={acc.id} className="bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-bold">{acc.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={TYPE_BADGE_VARIANT[acc.type] ?? "default"} className="capitalize text-[10px] px-2 py-0.5">
                        {t("accounts." + acc.type)}
                      </Badge>
                      <span className="text-xs text-muted-foreground/60">{acc.currency}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold font-heading">
                      {acc.currency} {acc.balance.toLocaleString()}
                    </span>
                    <Button variant="ghost" size="icon-sm" onClick={() => openEdit(acc)}>
                      <PencilIcon className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => {
                      if (confirm(t("accounts.deleteConfirm"))) {
                        removeAccount(acc.id);
                      }
                    }}>
                      <Trash2Icon className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
