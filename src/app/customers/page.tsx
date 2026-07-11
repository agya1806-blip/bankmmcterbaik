"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/engines/identity/auth-store";
import { useWorkspaceStore } from "@/engines/workspace/workspace-store";
import { useCRMStore } from "@/engines/business/crm-store";
import { createCustomer } from "@/lib/db";
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
import { PlusIcon, PencilIcon, Trash2Icon, ExternalLinkIcon, User, Search, Upload } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function CustomersPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuthStore();
  const { activeWorkspace, loadWorkspaces } = useWorkspaceStore();
  const {
    customers, isLoading, error,
    loadCustomers, addCustomer, editCustomer, removeCustomer, clearError,
  } = useCRMStore();

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<{ id: string; name: string; email: string; phone: string; address: string; notes: string } | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [search, setSearch] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) loadWorkspaces(user.id);
  }, [user, loadWorkspaces]);

  useEffect(() => {
    if (activeWorkspace) loadCustomers(activeWorkspace.id);
  }, [activeWorkspace, loadCustomers]);

  if (authLoading) return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">{t("loading")}</p></div>;
  if (!user || !activeWorkspace) return null;

  function resetForm() {
    setName(""); setEmail(""); setPhone(""); setAddress(""); setNotes("");
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!activeWorkspace) return;
    await addCustomer({
      workspaceId: activeWorkspace.id, name, email, phone, address, notes,
    });
    setAddOpen(false);
    resetForm();
  }

  function parseVCF(text: string): { name: string; phone: string }[] {
    const contacts: { name: string; phone: string }[] = [];
    const blocks = text.split("BEGIN:VCARD");
    for (const block of blocks) {
      if (!block.includes("END:VCARD")) continue;
      const vcard = block.split("END:VCARD")[0];
      const fnMatch = vcard.match(/FN:(.+)/);
      const telMatch = vcard.match(/TEL[^:]*:(.+)/);
      const name = fnMatch ? fnMatch[1].trim() : "";
      const phone = telMatch ? telMatch[1].trim() : "";
      if (name || phone) contacts.push({ name, phone });
    }
    return contacts;
  }

  function parseCSV(text: string): { name: string; phone: string }[] {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const nameIdx = headers.findIndex((h) => ["name", "nama", "customer", "contact"].includes(h));
    const phoneIdx = headers.findIndex((h) => ["phone", "telepon", "telp", "tel", "no", "number", "mobile"].includes(h));
    if (nameIdx === -1 && phoneIdx === -1) return [];
    const contacts: { name: string; phone: string }[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/^"(.*)"$/, "$1"));
      const name = nameIdx >= 0 && values[nameIdx] ? values[nameIdx] : "";
      const phone = phoneIdx >= 0 && values[phoneIdx] ? values[phoneIdx] : "";
      if (name || phone) contacts.push({ name, phone });
    }
    return contacts;
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !activeWorkspace) return;
    setImporting(true);
    setImportResult("");
    try {
      const text = await file.text();
      const contacts = file.name.endsWith(".vcf") ? parseVCF(text) : parseCSV(text);
      if (contacts.length === 0) {
        setImportResult("Tidak ada kontak ditemukan");
        setImporting(false);
        return;
      }
      for (const contact of contacts) {
        await createCustomer({
          id: crypto.randomUUID(),
          workspaceId: activeWorkspace.id,
          name: contact.name,
          email: "",
          phone: contact.phone,
          address: "",
          notes: "Import dari kontak",
          createdAt: Date.now(),
        });
      }
      await loadCustomers(activeWorkspace.id);
      setImportResult(`${contacts.length} kontak berhasil diimport`);
    } catch {
      setImportResult("Gagal mengimport kontak");
    } finally {
      setImporting(false);
      if (e.target) e.target.value = "";
    }
  }

  function openEdit(c: typeof customers[0]) {
    setEditTarget({ id: c.id, name: c.name, email: c.email, phone: c.phone, address: c.address, notes: c.notes });
    setName(c.name); setEmail(c.email); setPhone(c.phone); setAddress(c.address); setNotes(c.notes);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    await editCustomer(editTarget.id, { name, email, phone, address, notes });
    setEditTarget(null);
    resetForm();
  }

  const formFields = (
    <>
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("customers.name")}</label>
        <Input value={name} onChange={(e) => { setName(e.target.value); if (error) clearError(); }} required />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("customers.email")}</label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("customers.phone")}</label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("customers.address")}</label>
        <Input value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("customers.notes")}</label>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
    </>
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("customers.title")}</h1>
          <p className="text-muted-foreground">{customers.length} {t("customers.title")}</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen} trigger={<Button><PlusIcon className="size-4" /> {t("customers.add")}</Button>}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("customers.add")}</DialogTitle>
              <DialogDescription>{t("customers.add")}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAdd}>
              <div className="space-y-4 py-4">
                {error && <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
                {formFields}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>{isLoading ? t("customers.adding") : t("customers.add")}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) setEditTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("customers.edit")}</DialogTitle>
            <DialogDescription>{t("customers.edit")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit}>
            <div className="space-y-4 py-4">{formFields}</div>
            <DialogFooter><Button type="submit">{t("customers.save")}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={t("customers.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card/60 border-white/10 dark:border-white/5 focus-visible:ring-primary/30"
          />
        </div>
        <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importing}>
          <Upload className="size-4" />
          {importing ? "Mengimport..." : "Import Kontak"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".vcf,.csv"
          onChange={handleImport}
          className="hidden"
        />
      </div>

      {importResult && (
        <div className="rounded-lg bg-primary/10 px-4 py-2 text-sm text-primary">
          {importResult}
        </div>
      )}

      {(() => {
        const filtered = search
          ? customers.filter((c) =>
              c.name.toLowerCase().includes(search.toLowerCase()) ||
              c.email.toLowerCase().includes(search.toLowerCase()) ||
              c.phone.toLowerCase().includes(search.toLowerCase())
            )
          : customers;
        return (
          <>
            {filtered.length === 0 && !isLoading && (
              <div className="bg-card/80 backdrop-blur-sm border border-white/10 dark:border-white/5 rounded-2xl p-12 text-center">
                <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                  <User className="size-6 text-primary" />
                </div>
                <p className="text-muted-foreground">
                  {search ? t("customers.noResults") : t("customers.empty")}
                </p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {filtered.map((c) => (
                <div
                  key={c.id}
                  className="bg-card/80 backdrop-blur-sm border border-white/10 dark:border-white/5 rounded-2xl p-5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                        <User className="size-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{c.name}</p>
                        <p className="text-sm text-muted-foreground">{c.email || c.phone || t("customers.noContact")}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon-xs" onClick={() => openEdit(c)}>
                        <PencilIcon className="size-3" />
                      </Button>
                      <Button variant="ghost" size="icon-xs" onClick={() => removeCustomer(c.id)}>
                        <Trash2Icon className="size-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={() => router.push(`/customers/${c.id}`)}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ExternalLinkIcon className="size-3" /> {t("customers.viewTransactions")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        );
      })()}
    </div>
  );
}
