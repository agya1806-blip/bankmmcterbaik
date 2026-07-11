"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/engines/identity/auth-store";
import { useWorkspaceStore, WORKSPACE_TYPES } from "@/engines/workspace/workspace-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { useTranslation } from "@/lib/i18n";
import type { WorkspaceType } from "@/lib/db";

const getIcon = (type: WorkspaceType) => WORKSPACE_TYPES.find((w) => w.type === type)?.icon || "📒";

export default function WorkspacesPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuthStore();
  const { workspaces, activeWorkspace, isLoading, error, loadWorkspaces, selectWorkspace, createWorkspace, clearError } = useWorkspaceStore();

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<WorkspaceType>("pribadi");
  const [newCurrency, setNewCurrency] = useState("IDR");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) loadWorkspaces(user.id);
  }, [user, loadWorkspaces]);

  if (authLoading) return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">{t("loading")}</p></div>;
  if (!user) return null;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    try {
      await createWorkspace({ name: newName, description: WORKSPACE_TYPES.find((w) => w.type === newType)?.desc || "", currency: newCurrency, icon: getIcon(newType), type: newType }, user.id);
      setCreateOpen(false);
      setNewName("");
      setNewType("pribadi");
      setNewCurrency("IDR");
      router.push("/");
    } catch { setCreateOpen(false); }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Buku Saya</h1>
          <p className="text-sm text-muted-foreground">Kelola semua buku keuangan Anda</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><span className="text-lg">+</span> Buku Baru</Button>
      </div>

      <div className="space-y-3">
        {workspaces.length === 0 && !isLoading && (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="size-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-3 text-2xl">📚</div>
            <p className="text-sm font-medium text-foreground/80 mb-1">Belum ada buku</p>
            <p className="text-xs text-muted-foreground/60 mb-4">Buat buku pertama Anda</p>
            <Button onClick={() => setCreateOpen(true)}>Buat Buku Baru</Button>
          </div>
        )}

        {workspaces.map((ws) => {
          const typeInfo = WORKSPACE_TYPES.find((w) => w.type === ws.type);
          return (
            <div
              key={ws.id}
              className={`floating-card p-4 cursor-pointer hover:shadow-md transition-all ${activeWorkspace?.id === ws.id ? "ring-2 ring-emerald-500/50" : ""}`}
              onClick={() => { selectWorkspace(ws.id); router.push("/"); }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center size-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 text-xl">
                    {ws.icon}
                  </div>
                  <div>
                    <p className="font-semibold">{ws.name}</p>
                    <p className="text-xs text-muted-foreground">{typeInfo?.label || ws.type} &middot; {ws.currency}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">{ws.currency}</span>
                  {activeWorkspace?.id === ws.id && <span className="text-xs font-medium text-emerald-600">Aktif</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buat Buku Baru</DialogTitle>
            <DialogDescription>Pilih jenis buku yang sesuai dengan kebutuhan Anda</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="space-y-4 py-4">
              {error && <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama Buku</label>
                <Input placeholder="Nama buku..." value={newName} onChange={(e) => { setNewName(e.target.value); if (error) clearError(); }} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Jenis Buku</label>
                <div className="grid grid-cols-1 gap-2">
                  {WORKSPACE_TYPES.map((wt) => (
                    <button
                      key={wt.type}
                      type="button"
                      onClick={() => setNewType(wt.type)}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                        newType === wt.type ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10" : "border-border/50 hover:border-muted-foreground/30"
                      }`}
                    >
                      <span className="text-2xl">{wt.icon}</span>
                      <div>
                        <p className="text-sm font-semibold">{wt.label}</p>
                        <p className="text-xs text-muted-foreground/70">{wt.desc}</p>
                      </div>
                      {newType === wt.type && <span className="ml-auto text-emerald-500 text-xs font-medium">Dipilih</span>}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Mata Uang</label>
                <Select value={newCurrency} onValueChange={(v) => v && setNewCurrency(v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IDR">IDR - Rupiah</SelectItem>
                    <SelectItem value="USD">USD - Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="SGD">SGD - Dollar Singapore</SelectItem>
                    <SelectItem value="MYR">MYR - Ringgit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading || !newName}>
                {isLoading ? "Membuat..." : "Buat Buku"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
