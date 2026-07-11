"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/engines/identity/auth-store";
import { useWorkspaceStore } from "@/engines/workspace/workspace-store";
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
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  getWorkspaceSettings,
  saveWorkspaceSettings,
  getAccountsByWorkspace,
  getCategoriesByWorkspace,
  getTransactionsByWorkspace,
  getBudgetsByWorkspace,
  getCustomersByWorkspace,
  getSuppliersByWorkspace,
  getInventoryItemsByWorkspace,
  getPaymentMethodsByWorkspace,
  getProductsByWorkspace,
  getOrdersByWorkspace,
  getBranchesByWorkspace,
  createAccount,
  createCategory,
  createTransaction,
  createCustomer,
  createProduct,
  createOrder,
  createSupplier,
  createBudget,
  createInventoryItem,
  createBranch,
  createPaymentMethod,
  deletePaymentMethod,
} from "@/lib/db";
import { useRecurringStore } from "@/engines/financial/recurring-store";
import { useTranslation } from "@/lib/i18n";
import { Trash2 } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, isLoading: authLoading, updateProfile, error, clearError } = useAuthStore();
  const {
    workspaces,
    activeWorkspace,
    activeWorkspaceRole,
    isLoading: wsLoading,
    loadWorkspaces,
    updateWorkspace,
    deleteWorkspace,
    regenerateInviteCode,
    toggleConnection,
  } = useWorkspaceStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [language, setLanguage] = useState("id");
  const [wsName, setWsName] = useState("");
  const [wsDescription, setWsDescription] = useState("");
  const [wsCurrency, setWsCurrency] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [businessWhatsapp, setBusinessWhatsapp] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [pinValue, setPinValue] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [pinError, setPinError] = useState("");
  const [branches, setBranches] = useState<import("@/lib/db").Branch[]>([]);
  const [branchName, setBranchName] = useState("");
  const [branchAddress, setBranchAddress] = useState("");
  const [paymentMethods, setPaymentMethods] = useState<import("@/lib/db").PaymentMethod[]>([]);
  const [pmName, setPmName] = useState("");
  const [invoiceTypes, setInvoiceTypes] = useState<string[]>(["print", "laptop", "handphone", "tiktok", "umum"]);
  const [shortcuts, setShortcuts] = useState<{label:string;enabled:boolean;href:string}[]>([
    { label: "Catat Keuangan", enabled: true, href: "/transactions" },
    { label: "Faktur", enabled: true, href: "/invoices" },
    { label: "Laporan", enabled: false, href: "/reports" },
    { label: "Pesanan", enabled: true, href: "/orders" },
    { label: "Pelanggan", enabled: false, href: "/customers" },
    { label: "Inventaris", enabled: false, href: "/inventory" },
  ]);
  const { rules: recurringRules, loadRules: loadRecurringRules, removeRule: removeRecurringRule } = useRecurringStore();

  useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setProfileEmail(user.email);
      loadWorkspaces(user.id);
    }
  }, [user]);

  useEffect(() => {
    const loadSettings = async () => {
      if (!activeWorkspace) return;
      const s = await getWorkspaceSettings(activeWorkspace.id);
      if (s) {
        setTheme(s.theme);
        setLanguage(s.language);
      }
      setWsName(activeWorkspace.name);
      setWsDescription(activeWorkspace.description);
      setWsCurrency(activeWorkspace.currency);
      const pmData = await getPaymentMethodsByWorkspace(activeWorkspace.id);
      setPaymentMethods(pmData);
      loadRecurringRules(activeWorkspace.id);
      const loadBranches = async () => {
        if (!activeWorkspace) return;
        const { getBranchesByWorkspace } = await import("@/lib/db");
        const data = await getBranchesByWorkspace(activeWorkspace.id);
        setBranches(data);
      };
      loadBranches();
    };
    loadSettings();
  }, [activeWorkspace]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    setBusinessName(localStorage.getItem("mmcbank-business-name") || "");
    setBusinessWhatsapp(localStorage.getItem("mmcbank-business-wa") || "");
    setBusinessAddress(localStorage.getItem("mmcbank-business-address") || "");
    const savedTypes = localStorage.getItem("mmcbank-invoice-types");
    if (savedTypes) try { setInvoiceTypes(JSON.parse(savedTypes)); } catch {}
    const savedShortcuts = localStorage.getItem("mmcbank-shortcuts");
    if (savedShortcuts) try { setShortcuts(JSON.parse(savedShortcuts)); } catch {}
  }, []);

  const handleSaveGlobal = async () => {
    if (!activeWorkspace) return;
    await saveWorkspaceSettings({
      workspaceId: activeWorkspace.id,
      theme,
      language,
    });
  };

  const handleUpdateWorkspace = async () => {
    if (!activeWorkspace) return;
    await updateWorkspace(activeWorkspace.id, {
      name: wsName,
      description: wsDescription,
      currency: wsCurrency,
    });
  };

  const handleRegenerateCode = async () => {
    if (!activeWorkspace) return;
    setRegenerating(true);
    await regenerateInviteCode(activeWorkspace.id);
    setRegenerating(false);
  };

  const handleDeleteWorkspace = async () => {
    if (!activeWorkspace) return;
    await deleteWorkspace(activeWorkspace.id);
    setShowDeleteDialog(false);
    router.push("/workspaces");
  };

  const handleExport = async () => {
    if (!activeWorkspace) return;
    setExporting(true);
    try {
      const [accounts, categories, transactions, budgets, customers, suppliers, inventory, paymentMethods, products, orders, branches] =
        await Promise.all([
          getAccountsByWorkspace(activeWorkspace.id),
          getCategoriesByWorkspace(activeWorkspace.id),
          getTransactionsByWorkspace(activeWorkspace.id),
          getBudgetsByWorkspace(activeWorkspace.id),
          getCustomersByWorkspace(activeWorkspace.id),
          getSuppliersByWorkspace(activeWorkspace.id),
          getInventoryItemsByWorkspace(activeWorkspace.id),
          getPaymentMethodsByWorkspace(activeWorkspace.id),
          getProductsByWorkspace(activeWorkspace.id),
          getOrdersByWorkspace(activeWorkspace.id),
          getBranchesByWorkspace(activeWorkspace.id),
        ]);

      const data = {
        workspace: activeWorkspace,
        settings: await getWorkspaceSettings(activeWorkspace.id),
        businessProfile: {
          name: localStorage.getItem("mmcbank-business-name") || "",
          whatsapp: localStorage.getItem("mmcbank-business-wa") || "",
          address: localStorage.getItem("mmcbank-business-address") || "",
        },
        accounts,
        categories,
        transactions,
        budgets,
        customers,
        suppliers,
        inventory,
        paymentMethods,
        invoices,
        products,
        orders,
        branches,
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mmcbank-${activeWorkspace.name}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const safeDate = (v: unknown): string => {
    if (typeof v === "string") {
      if (v.includes("T")) return v.split("T")[0];
      if (v.match(/^\d{4}-\d{2}-\d{2}/)) return v.slice(0, 10);
      return new Date().toISOString().split("T")[0];
    }
    if (typeof v === "number" && !Number.isNaN(v)) {
      return new Date(v).toISOString().split("T")[0];
    }
    if (v instanceof Date && !Number.isNaN(v.getTime())) {
      return v.toISOString().split("T")[0];
    }
    return new Date().toISOString().split("T")[0];
  };

  const importMughisLegacy = async (data: Record<string, unknown>) => {
    if (!activeWorkspace) return;
    const wsId = activeWorkspace.id;

    // 1. Save business settings
    const oldSettings = data.mughis_settings as Record<string, string> | undefined;
    if (oldSettings) {
      if (oldSettings.businessName) localStorage.setItem("mmcbank-business-name", oldSettings.businessName);
      if (oldSettings.whatsapp) localStorage.setItem("mmcbank-business-wa", oldSettings.whatsapp);
      if (oldSettings.address) localStorage.setItem("mmcbank-business-address", oldSettings.address);
      setBusinessName(oldSettings.businessName || "");
      setBusinessWhatsapp(oldSettings.whatsapp || "");
      setBusinessAddress(oldSettings.address || "");
    }

    // 2. Create categories from all unique transaction categories
    const oldTxData = (data.mughis_transactions as Record<string, unknown>[]) || [];
    const oldInvoiceData = (data.mughis_invoices as Record<string, unknown>[]) || [];
    const incomeCats = new Set<string>();
    const expenseCats = new Set<string>();
    oldTxData.forEach((tx: Record<string, unknown>) => {
      const cat = tx.category as string;
      if (!cat) return;
      if ((tx.type as string) === "expense") expenseCats.add(cat);
      else incomeCats.add(cat);
    });
    const catMap = new Map<string, string>();
    for (const name of incomeCats) {
      const id = crypto.randomUUID();
      await createCategory({ id, workspaceId: wsId, name, type: "income", color: "#10b981", createdAt: Date.now() });
      catMap.set(name, id);
    }
    for (const name of expenseCats) {
      const id = crypto.randomUUID();
      await createCategory({ id, workspaceId: wsId, name, type: "expense", color: "#ef4444", createdAt: Date.now() });
      if (!catMap.has(name)) catMap.set(name, id);
    }

    // 3. Create accounts from wallets
    const oldWallets = (data.mughis_wallets as Record<string, unknown>[]) || [];
    const walletIdMap = new Map<string, string>();
    for (const w of oldWallets) {
      const id = crypto.randomUUID();
      walletIdMap.set(w.id as string, id);
      await createAccount({
        id, workspaceId: wsId, name: w.name as string,
        type: "custom", balance: (w.balance as number) || 0,
        currency: activeWorkspace.currency, createdAt: Date.now(),
      });
    }

    // 4. Create customers
    const oldCustomers = (data.mughis_customers as Record<string, unknown>[]) || [];
    const customerIdMap = new Map<string, string>();
    for (const c of oldCustomers) {
      const id = crypto.randomUUID();
      customerIdMap.set(c.id as string, id);
      await createCustomer({
        id, workspaceId: wsId, name: c.name as string,
        email: "", phone: (c.phone as string) || "",
        address: (c.address as string) || "",
        notes: (c.note as string) || "", createdAt: Date.now(),
      });
    }

    // 5. Create transactions from mughis_transactions
    for (const tx of oldTxData) {
      const accId = walletIdMap.get(tx.walletId as string) || walletIdMap.values().next().value || "";
      await createTransaction({
        id: crypto.randomUUID(), workspaceId: wsId,
        type: (tx.type as "income" | "expense") || "income",
        amount: Math.abs(tx.amount as number) || 0,
        accountId: accId, categoryId: catMap.get(tx.category as string) || "",
        description: (tx.description as string) || "",
        date: safeDate(tx.date),
        createdAt: (tx.createdAt as number) || Date.now(),
      });
    }

    // 6. Create transactions from debts
    const oldDebts = (data.mughis_debts as Record<string, unknown>[]) || [];
    for (const d of oldDebts) {
      const accId = walletIdMap.get(d.walletId as string) || walletIdMap.values().next().value || "";
      await createTransaction({
        id: crypto.randomUUID(), workspaceId: wsId,
        type: "debt", amount: Math.abs(d.amount as number) || 0,
        accountId: accId, description: (d.description as string) || "",
        date: safeDate(d.date),
        createdAt: (d.createdAt as number) || Date.now(),
      });
    }

    // 7. Create transactions from receivables
    const oldReceivables = (data.mughis_receivables as Record<string, unknown>[]) || [];
    for (const r of oldReceivables) {
      const accId = walletIdMap.get(r.walletId as string) || walletIdMap.values().next().value || "";
      await createTransaction({
        id: crypto.randomUUID(), workspaceId: wsId,
        type: "receivable", amount: Math.abs(r.amount as number) || 0,
        accountId: accId, description: (r.description as string) || "",
        date: safeDate(r.date),
        createdAt: (r.createdAt as number) || Date.now(),
      });
    }

    // 8. Create products
    const oldProducts = (data.mughis_products as Record<string, unknown>[]) || [];
    for (const p of oldProducts) {
      await createProduct({
        id: crypto.randomUUID(), workspaceId: wsId,
        name: p.name as string,
        type: (p.type as "service" | "goods") || "service",
        category: (p.category as string) || "",
        price: (p.price as number) || 0,
        unit: "", stock: 0, description: "", createdAt: Date.now(),
      });
    }

    // 9. Create orders from invoices
    const typeMap: Record<string, "print" | "laptop" | "handphone" | "tiktok" | "umum"> = {
      print: "print", laptop: "laptop", handphone: "handphone", tiktok: "tiktok", umum: "umum",
    };
    for (const inv of oldInvoiceData) {
      const oldItems = (inv.items as Record<string, unknown>[]) || [];
      const items = oldItems.map((it) => ({
        id: crypto.randomUUID(), description: it.name as string || it.description as string || "",
        quantity: (it.qty as number) || 1,
        unitPrice: (it.price as number) || 0,
        total: (it.total as number) || ((it.qty as number) || 1) * ((it.price as number) || 0),
      }));
      const total = (inv.total as number) || items.reduce((s, i) => s + i.total, 0);
      const dp = (inv.dp as number) || 0;
      const remaining = total - dp;
      const oldStatus = (inv.status as string) || "";
      const paymentStatus: "Belum Lunas" | "DP" | "Lunas" | "Batal" =
        oldStatus === "Lunas" ? "Lunas" : oldStatus === "DP" ? "DP" : oldStatus === "Batal" ? "Batal" : "Belum Lunas";
      const orderStatus: "baru" | "proses" | "selesai" | "batal" =
        oldStatus === "Lunas" ? "selesai" : oldStatus === "DP" ? "proses" : oldStatus === "Batal" ? "batal" : "baru";
      const invType = (inv.type as string) || "umum";
      const oldSpecs = (inv.specs as Record<string, unknown>) || {};
      const specs: Record<string, string> = {};
      for (const [k, v] of Object.entries(oldSpecs)) {
        if (typeof v === "string" || typeof v === "number") specs[k] = String(v);
      }
      await createOrder({
        id: crypto.randomUUID(), workspaceId: wsId,
        number: (inv.number as string) || "",
        type: typeMap[invType] || "umum",
        status: orderStatus,
        paymentStatus,
        customerId: customerIdMap.get(inv.customerId as string) || "",
        customerName: (inv.customerName as string) || "",
        customerPhone: (inv.customerPhone as string) || "",
        customerAddress: (inv.customerAddress as string) || "",
        items, subtotal: total, discount: 0, total,
        dp, remaining,
        walletId: (inv.walletId as string) || "",
        specs,
        notes: (inv.note as string) || (inv.notes as string) || "",
        date: safeDate(inv.date),
        dueDate: "", createdAt: Date.now(),
      });
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeWorkspace) return;
    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Detect old Mughis Bank format (localStorage keys)
      if (data.mughis_wallets) {
        await importMughisLegacy(data);
      } else {
        // New format
        if (data.workspace) {
          await updateWorkspace(activeWorkspace.id, {
            name: data.workspace.name,
            description: data.workspace.description,
            currency: data.workspace.currency,
          });
          setWsName(data.workspace.name);
          setWsDescription(data.workspace.description);
          setWsCurrency(data.workspace.currency);
        }
        if (data.businessProfile) {
          const bp = data.businessProfile;
          if (bp.name) localStorage.setItem("mmcbank-business-name", bp.name);
          if (bp.whatsapp) localStorage.setItem("mmcbank-business-wa", bp.whatsapp);
          if (bp.address) localStorage.setItem("mmcbank-business-address", bp.address);
        }
        if (Array.isArray(data.accounts)) for (const x of data.accounts) await createAccount(x);
        if (Array.isArray(data.categories)) for (const x of data.categories) await createCategory(x);
        if (Array.isArray(data.transactions)) for (const x of data.transactions) await createTransaction(x);
        if (Array.isArray(data.customers)) for (const x of data.customers) await createCustomer(x);
        if (Array.isArray(data.suppliers)) for (const x of data.suppliers) await createSupplier(x);
        if (Array.isArray(data.products)) for (const x of data.products) await createProduct(x);
        if (Array.isArray(data.orders)) {
          for (const x of data.orders) {
            const dp = x.dp || 0;
            await createOrder({
              ...x,
              paymentStatus: x.paymentStatus || (dp > 0 ? (dp >= (x.total || 0) ? "Lunas" : "DP") : "Belum Lunas"),
              customerName: x.customerName || x.customerId || "",
              customerPhone: x.customerPhone || "",
              customerAddress: x.customerAddress || "",
              walletId: x.walletId || "",
              specs: x.specs || {},
            });
          }
        }
        if (Array.isArray(data.budgets)) for (const x of data.budgets) await createBudget(x);
        if (Array.isArray(data.inventory)) for (const x of data.inventory) await createInventoryItem(x);
        if (Array.isArray(data.branches)) for (const x of data.branches) await createBranch(x);
      }
    } catch (err) {
      console.error("Import failed:", err);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveBusiness = () => {
    localStorage.setItem("mmcbank-business-name", businessName);
    localStorage.setItem("mmcbank-business-wa", businessWhatsapp);
    localStorage.setItem("mmcbank-business-address", businessAddress);
  };

  const handleSavePin = async () => {
    if (pinValue.length !== 6) {
      setPinError(t("pin.pinTooShort"));
      return;
    }
    if (pinValue !== pinConfirm) {
      setPinError(t("pin.pinMismatch"));
      return;
    }
    if (!user) return;
    const { savePinLock } = await import("@/lib/db");
    await savePinLock({ userId: user.id, pin: pinValue, createdAt: Date.now() });
    setPinValue("");
    setPinConfirm("");
    setPinError("");
  };

  const handleRemovePin = async () => {
    if (!user) return;
    const { deletePinLock } = await import("@/lib/db");
    await deletePinLock(user.id);
    setPinValue("");
    setPinConfirm("");
    setPinError("");
  };

  const handleAddBranch = async () => {
    if (!activeWorkspace || !branchName.trim()) return;
    const { createBranch } = await import("@/lib/db");
    await createBranch({
      id: crypto.randomUUID(),
      workspaceId: activeWorkspace.id,
      name: branchName,
      address: branchAddress,
      createdAt: Date.now(),
    });
    setBranchName("");
    setBranchAddress("");
    const { getBranchesByWorkspace } = await import("@/lib/db");
    const data = await getBranchesByWorkspace(activeWorkspace.id);
    setBranches(data);
  };

  const removeBranch = async (id: string) => {
    const { deleteBranch } = await import("@/lib/db");
    await deleteBranch(id);
    setBranches((prev) => prev.filter((b) => b.id !== id));
  };

  const handleAddPm = async () => {
    if (!activeWorkspace || !pmName.trim()) return;
    const pm: import("@/lib/db").PaymentMethod = {
      id: crypto.randomUUID(),
      workspaceId: activeWorkspace.id,
      name: pmName,
      createdAt: Date.now(),
    };
    await createPaymentMethod(pm);
    setPaymentMethods((prev) => [...prev, pm]);
    setPmName("");
  };

  const removePaymentMethod = async (id: string) => {
    await deletePaymentMethod(id);
    setPaymentMethods((prev) => prev.filter((pm) => pm.id !== id));
  };

  const toggleShortcut = (i: number, v: boolean) => {
    setShortcuts((prev) => {
      const updated = prev.map((s, idx) => (idx === i ? { ...s, enabled: v } : s));
      localStorage.setItem("mmcbank-shortcuts", JSON.stringify(updated));
      return updated;
    });
  };

  if (authLoading || wsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">{t("loading")}</p>
      </div>
    );
  }

  if (!user || !activeWorkspace) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5 rounded-2xl p-6">
          <h2 className="text-lg font-semibold">{t("settings.title")}</h2>
          <p className="text-sm text-muted-foreground mb-4">{t("settings.noWorkspace")}</p>
          <Button onClick={() => router.push("/")}>{t("settings.goToDashboard")}</Button>
        </div>
      </div>
    );
  }

  const SETTINGS_TABS = [
    { id: "profile", label: "Profil & Keamanan", icon: "👤" },
    { id: "workspace", label: "Ruang Kerja", icon: "🏢" },
    { id: "display", label: "Tampilan", icon: "🎨" },
    { id: "system", label: "Sistem", icon: "⚙️" },
    { id: "data", label: "Data", icon: "💾" },
  ] as const;
  const [activeTab, setActiveTab] = useState<string>("profile");

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold">{t("settings.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("settings.description")}</p>
      </div>

      <div className="flex gap-2 p-1 bg-muted/60 rounded-xl overflow-x-auto">
        {SETTINGS_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {activeTab === "profile" && (
          <>
            <div className="bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5 rounded-2xl p-6">
              <h3 className="text-base font-semibold">{t("settings.profile")}</h3>
              <p className="text-xs text-muted-foreground mb-4">{t("settings.profileDesc")}</p>
              {error && <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive mb-4">{error}</div>}
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">{t("settings.name")}</Label>
                  <Input value={profileName} onChange={(e) => setProfileName(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">{t("settings.email")}</Label>
                  <Input type="email" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">{t("settings.currentPassword")}</Label>
                  <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="mt-1" placeholder={t("settings.passwordPlaceholder")} />
                </div>
                <div>
                  <Label className="text-xs">{t("settings.newPassword")}</Label>
                  <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1" placeholder={t("settings.passwordPlaceholder")} />
                </div>
                <Button size="sm" disabled={profileSaving} onClick={async () => {
                  setProfileSaving(true);
                  clearError();
                  const updates: { name?: string; email?: string; currentPassword?: string; newPassword?: string } = {};
                  if (profileName !== user?.name) updates.name = profileName;
                  if (profileEmail !== user?.email) updates.email = profileEmail;
                  if (currentPassword && newPassword) {
                    updates.currentPassword = currentPassword;
                    updates.newPassword = newPassword;
                  }
                  if (Object.keys(updates).length > 0) {
                    await updateProfile(updates);
                  }
                  setCurrentPassword("");
                  setNewPassword("");
                  setProfileSaving(false);
                }}>
                  {profileSaving ? t("settings.saving") : t("settings.saveProfile")}
                </Button>
              </div>
            </div>

            <div className="bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5 rounded-2xl p-6">
              <h3 className="text-base font-semibold">{t("pin.title")}</h3>
              <p className="text-xs text-muted-foreground mb-4">{t("pin.description")}</p>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">{t("pin.enterPin")}</Label>
                  <Input type="password" maxLength={6} inputMode="numeric" value={pinValue} onChange={(e) => setPinValue(e.target.value.replace(/\D/g, "").slice(0, 6))} className="mt-1" placeholder="******" />
                </div>
                <div>
                  <Label className="text-xs">{t("pin.confirmPin")}</Label>
                  <Input type="password" maxLength={6} inputMode="numeric" value={pinConfirm} onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 6))} className="mt-1" placeholder="******" />
                </div>
                {pinError && <p className="text-sm text-destructive">{pinError}</p>}
                <div className="flex gap-2">
                  <Button onClick={handleSavePin} size="sm">{t("pin.setPin")}</Button>
                  <Button variant="outline" onClick={handleRemovePin} size="sm">{t("pin.removePin")}</Button>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "workspace" && (
          <>
            <div className="bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5 rounded-2xl p-6">
              <h3 className="text-base font-semibold">{t("settings.workspaceSettings")}</h3>
              <p className="text-xs text-muted-foreground mb-4">{t("settings.workspaceDesc")}</p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 mb-2">
                  <span className="text-2xl">{activeWorkspace.icon}</span>
                  <div>
                    <p className="text-sm font-semibold">{({ pribadi: "Buku Pribadi", usaha: "Buku Usaha", modal: "Buku Modal", toko: "Toko Online", hutang: "Buku Hutang" } as Record<string, string>)[activeWorkspace.type] || activeWorkspace.type}</p>
                    <p className="text-xs text-muted-foreground/60">Tipe Buku</p>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">{t("settings.workspaceName")}</Label>
                  <Input value={wsName} onChange={(e) => setWsName(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">{t("settings.descriptionLabel")}</Label>
                  <Input value={wsDescription} onChange={(e) => setWsDescription(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">{t("settings.currency")}</Label>
                  <Input value={wsCurrency} onChange={(e) => setWsCurrency(e.target.value)} className="mt-1" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs">{t("settings.inviteCode")}</Label>
                    <p className="font-mono text-sm text-muted-foreground">{activeWorkspace.inviteCode}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleRegenerateCode} disabled={regenerating}>
                    {t("settings.regenerate")}
                  </Button>
                </div>
                <Button onClick={handleUpdateWorkspace} size="sm">{t("settings.updateWorkspace")}</Button>
              </div>
            </div>

            <div className="bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5 rounded-2xl p-6">
              <h3 className="text-base font-semibold">Koneksi Buku</h3>
              <p className="text-xs text-muted-foreground mb-4">Hubungkan buku ini dengan buku lain untuk berbagi data</p>
              <div className="space-y-2">
                {workspaces.filter((w) => w.id !== activeWorkspace.id).length === 0 && (
                  <p className="text-sm text-muted-foreground/60">Belum ada buku lain untuk dikoneksikan</p>
                )}
                {workspaces.filter((w) => w.id !== activeWorkspace.id).map((w) => {
                  const connected = (activeWorkspace.connectedWorkspaces || []).includes(w.id);
                  return (
                    <div key={w.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{w.icon}</span>
                        <div>
                          <p className="text-sm font-medium">{w.name}</p>
                          <p className="text-xs text-muted-foreground/60">{({ pribadi: "Buku Pribadi", usaha: "Buku Usaha", modal: "Buku Modal", toko: "Toko Online", hutang: "Buku Hutang" } as Record<string, string>)[w.type] || w.type}</p>
                        </div>
                      </div>
                      <Switch
                        checked={connected}
                        onCheckedChange={() => toggleConnection(activeWorkspace.id, w.id)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5 rounded-2xl p-6">
              <h3 className="text-base font-semibold">{t("business.title")}</h3>
              <p className="text-xs text-muted-foreground mb-4">{t("business.title")}</p>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">{t("business.name")}</Label>
                  <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="mt-1" placeholder="Nama usaha Anda" />
                </div>
                <div>
                  <Label className="text-xs">{t("business.whatsapp")}</Label>
                  <Input value={businessWhatsapp} onChange={(e) => setBusinessWhatsapp(e.target.value)} className="mt-1" placeholder="08xxxxxxxxxx" />
                </div>
                <div>
                  <Label className="text-xs">{t("business.address")}</Label>
                  <Input value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} className="mt-1" placeholder="Alamat lengkap usaha" />
                </div>
                <Button onClick={handleSaveBusiness} size="sm">{t("business.save")}</Button>
              </div>
            </div>

            <div className="bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5 rounded-2xl p-6">
              <h3 className="text-base font-semibold">{t("branches.title")}</h3>
              <p className="text-xs text-muted-foreground mb-4">{t("branches.title")}</p>
              <div className="space-y-3">
                {branches.map((b) => (
                  <div key={b.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                    <div>
                      <p className="text-sm font-medium">{b.name}</p>
                      {b.address && <p className="text-xs text-muted-foreground">{b.address}</p>}
                    </div>
                    <Button variant="ghost" size="icon-xs" onClick={() => removeBranch(b.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input value={branchName} onChange={(e) => setBranchName(e.target.value)} placeholder={t("branches.name")} />
                  <Input value={branchAddress} onChange={(e) => setBranchAddress(e.target.value)} placeholder={t("branches.address")} />
                  <Button onClick={handleAddBranch} size="sm">{t("branches.add")}</Button>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "display" && (
          <div className="bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5 rounded-2xl p-6">
            <h3 className="text-base font-semibold">{t("settings.globalSettings")}</h3>
            <p className="text-xs text-muted-foreground mb-4">{t("settings.globalDesc")}</p>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>{t("settings.darkMode")}</Label>
                  <p className="text-xs text-muted-foreground">{t("settings.darkModeDesc")}</p>
                </div>
                <Switch checked={theme === "dark"} onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>{t("settings.language")}</Label>
                  <p className="text-xs text-muted-foreground">{t("settings.languageDesc")}</p>
                </div>
                <Select value={language} onValueChange={(v) => v && setLanguage(v)}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="id">Indonesia</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSaveGlobal} size="sm">{t("settings.saveSettings")}</Button>
            </div>
          </div>
        )}

        {activeTab === "system" && (
          <>
            <div className="bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5 rounded-2xl p-6">
              <h3 className="text-base font-semibold">Metode Pembayaran</h3>
              <p className="text-xs text-muted-foreground mb-4">Kelola metode pembayaran untuk faktur</p>
              <div className="space-y-3">
                {paymentMethods.map((pm) => (
                  <div key={pm.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                    <span className="text-sm font-medium">{pm.name}</span>
                    <Button variant="ghost" size="icon-xs" onClick={() => removePaymentMethod(pm.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input value={pmName} onChange={(e) => setPmName(e.target.value)} placeholder="Nama metode bayar" />
                  <Button onClick={handleAddPm} size="sm">Tambah</Button>
                </div>
              </div>
            </div>

            <div className="bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5 rounded-2xl p-6">
              <h3 className="text-base font-semibold">Tipe Pesanan</h3>
              <p className="text-xs text-muted-foreground mb-4">Tipe pesanan yang tersedia</p>
              <div className="flex flex-wrap gap-2">
                {invoiceTypes.map((t, i) => (
                  <span key={i} className="inline-flex items-center rounded-full bg-muted/60 px-3 py-1 text-sm font-medium">{t}</span>
                ))}
              </div>
            </div>

            <div className="bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5 rounded-2xl p-6">
              <h3 className="text-base font-semibold">Shortcut Cepat</h3>
              <p className="text-xs text-muted-foreground mb-4">Pilih menu yang tampil di quick menu dashboard</p>
              <div className="space-y-3">
                {shortcuts.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                    <span className="text-sm font-medium">{s.label}</span>
                    <Switch checked={s.enabled} onCheckedChange={(v) => toggleShortcut(i, v)} />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5 rounded-2xl p-6">
              <h3 className="text-base font-semibold">Transaksi Berulang</h3>
              <p className="text-xs text-muted-foreground mb-4">Kelola transaksi otomatis bulanan</p>
              <div id="recurringList">
                {recurringRules.length === 0 && <p className="text-sm text-muted-foreground">Belum ada aturan transaksi berulang</p>}
                {recurringRules.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 mb-2">
                    <div>
                      <p className="text-sm font-medium">{r.description}</p>
                      <p className="text-xs text-muted-foreground">{r.type} · Rp{r.amount.toLocaleString()} · {r.frequency}</p>
                    </div>
                    <Button variant="ghost" size="icon-xs" onClick={() => removeRecurringRule(r.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === "data" && (
          <>
            <div className="bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5 rounded-2xl p-6">
              <h3 className="text-base font-semibold">{t("settings.dataManagement")}</h3>
              <p className="text-xs text-muted-foreground mb-4">{t("settings.dataDesc")}</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" onClick={handleExport} disabled={exporting}>
                  {exporting ? t("settings.exporting") : t("settings.exportData")}
                </Button>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importing}>
                  {importing ? t("settings.importing") : t("settings.importData")}
                </Button>
                <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
              </div>
            </div>

            <div className="bg-card/80 backdrop-blur-sm border-red-500/30 rounded-2xl p-6">
              <h3 className="text-base font-semibold text-destructive">{t("settings.dangerZone")}</h3>
              <p className="text-xs text-muted-foreground mb-4">{t("settings.dangerDesc")}</p>
              <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} disabled={activeWorkspaceRole !== "admin"}>
                {t("settings.deleteWorkspace")}
              </Button>
              {activeWorkspaceRole !== "admin" && (
                <p className="text-xs text-muted-foreground mt-2">{t("settings.onlyAdmin")}</p>
              )}
            </div>

            <div className="bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5 rounded-2xl p-6">
              <h3 className="text-base font-semibold">Tentang</h3>
              <p className="text-sm text-muted-foreground mb-2">MUGHIS BANK — Sistem Operasi Keuangan</p>
              <p className="text-xs text-muted-foreground">Versi 2.0.0 · Next.js + IndexedDB</p>
              <p className="text-xs text-muted-foreground mt-2">Dibuat untuk pengusaha Indonesia</p>
            </div>
          </>
        )}
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("settings.deleteDialogTitle")}</DialogTitle>
            <DialogDescription>{t("settings.deleteDialogDesc").replace("{name}", activeWorkspace.name)}</DialogDescription>
          </DialogHeader>
          <Input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder={t("settings.deleteConfirmPlaceholder")} />
          <DialogFooter>
            <Button variant="destructive" onClick={handleDeleteWorkspace} disabled={deleteConfirm !== activeWorkspace.name}>
              {t("settings.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
