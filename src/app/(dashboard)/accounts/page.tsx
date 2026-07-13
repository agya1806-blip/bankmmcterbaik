"use client";

import { useEffect, useState } from "react";
import { useWorkspaceStore } from "@/engines/workspace/workspace-store";
import AccountsList from "@/components/accounts/accounts-list";
import CustomersList from "@/components/accounts/customers-list";
import { Wallet, Users } from "lucide-react";

type TabId = "accounts" | "customers";

export default function AccountsPage() {
  const { activeWorkspace } = useWorkspaceStore();
  const [activeTab, setActiveTab] = useState<TabId>("accounts");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="min-h-[60vh]" />;
  if (!activeWorkspace) return null;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div>
        <h1 className="text-xl font-bold font-heading">Akun & Pelanggan</h1>
        <p className="text-sm text-muted-foreground/60">Kelola saldo, rekening, dan database pelanggan</p>
      </div>

      <div className="flex gap-2 p-1 bg-muted/60 rounded-xl w-fit">
        <button onClick={() => setActiveTab("accounts")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "accounts" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        ><Wallet className="size-4 inline mr-1.5" />Akun</button>
        <button onClick={() => setActiveTab("customers")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "customers" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        ><Users className="size-4 inline mr-1.5" />Pelanggan</button>
      </div>

      {activeTab === "accounts" && (
        <AccountsList workspaceId={activeWorkspace.id} currency={activeWorkspace.currency} />
      )}
      {activeTab === "customers" && (
        <CustomersList workspaceId={activeWorkspace.id} />
      )}
    </div>
  );
}
