"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/engines/identity/auth-store";
import { useWorkspaceStore } from "@/engines/workspace/workspace-store";
import { useCRMStore } from "@/engines/business/crm-store";
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
import { PlusIcon, PencilIcon, Trash2Icon, StoreIcon } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function SuppliersPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuthStore();
  const { activeWorkspace, loadWorkspaces } = useWorkspaceStore();
  const {
    suppliers, isLoading, error,
    loadSuppliers, addSupplier, editSupplier, removeSupplier, clearError,
  } = useCRMStore();

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<{ id: string; name: string; email: string; phone: string; address: string; notes: string } | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) loadWorkspaces(user.id);
  }, [user, loadWorkspaces]);

  useEffect(() => {
    if (activeWorkspace) loadSuppliers(activeWorkspace.id);
  }, [activeWorkspace, loadSuppliers]);

  if (authLoading) return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">{t("loading")}</p></div>;
  if (!user || !activeWorkspace) return null;

  function resetForm() {
    setName(""); setEmail(""); setPhone(""); setAddress(""); setNotes("");
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!activeWorkspace) return;
    try {
      await addSupplier({
        workspaceId: activeWorkspace.id, name, email, phone, address, notes,
      });
    } finally {
      setAddOpen(false);
      resetForm();
    }
  }

  function openEdit(s: typeof suppliers[0]) {
    setEditTarget({ id: s.id, name: s.name, email: s.email, phone: s.phone, address: s.address, notes: s.notes });
    setName(s.name); setEmail(s.email); setPhone(s.phone); setAddress(s.address); setNotes(s.notes);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    try {
      await editSupplier(editTarget.id, { name, email, phone, address, notes });
    } finally {
      setEditTarget(null);
      resetForm();
    }
  }

  const formFields = (
    <>
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("suppliers.name")}</label>
        <Input value={name} onChange={(e) => { setName(e.target.value); if (error) clearError(); }} required />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("suppliers.email")}</label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("suppliers.phone")}</label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("suppliers.address")}</label>
        <Input value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("suppliers.notes")}</label>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
    </>
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">{t("suppliers.title")}</h1>
          <p className="text-sm text-muted-foreground/60 mt-0.5">{suppliers.length} {t("suppliers.title")}</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen} trigger={<Button><PlusIcon className="size-4" /> {t("suppliers.add")}</Button>}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("suppliers.add")}</DialogTitle>
              <DialogDescription>{t("suppliers.add")}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAdd}>
              <div className="space-y-4 py-4">
                {error && <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
                {formFields}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>{isLoading ? t("suppliers.adding") : t("suppliers.add")}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) setEditTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("suppliers.edit")}</DialogTitle>
            <DialogDescription>{t("suppliers.edit")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit}>
            <div className="space-y-4 py-4">{formFields}</div>
            <DialogFooter><Button type="submit">{t("suppliers.save")}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {suppliers.length === 0 && !isLoading && (
        <div className="bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5 rounded-2xl p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center size-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
              <StoreIcon className="size-7 text-white" />
            </div>
          </div>
          <p className="text-muted-foreground">{t("suppliers.empty")}</p>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t("suppliers.loadingSuppliers")}</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {suppliers.map((s) => (
          <div key={s.id} className="bg-card/80 backdrop-blur-sm border-white/10 dark:border-white/5 rounded-2xl p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shrink-0">
                  <StoreIcon className="size-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{s.name}</p>
                  <p className="text-sm text-muted-foreground">{s.email || s.phone || t("suppliers.noContact")}</p>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon-xs" onClick={() => openEdit(s)}>
                  <PencilIcon className="size-3" />
                </Button>
                <Button variant="ghost" size="icon-xs" onClick={() => removeSupplier(s.id)}>
                  <Trash2Icon className="size-3 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
