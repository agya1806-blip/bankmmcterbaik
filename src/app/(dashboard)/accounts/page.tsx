"use client";

import { useEffect, useState, useCallback } from "react";
import { useWorkspaceStore } from "@/engines/workspace/workspace-store";
import { useFinancialStore } from "@/engines/financial/financial-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Wallet, Landmark, Smartphone, CreditCard,
  Pencil, Trash2, Search, Users, UserPlus,
} from "lucide-react";
import type { Account, Customer } from "@/lib/db";
import toast from "react-hot-toast";

const ACCOUNT_TYPES = [
  { value: "bank", label: "Bank", icon: Landmark },
  { value: "cash", label: "Tunai", icon: Wallet },
  { value: "ewallet", label: "E-Wallet", icon: Smartphone },
  { value: "qris", label: "QRIS", icon: CreditCard },
  { value: "custom", label: "Lainnya", icon: Wallet },
] as const;

type TabId = "accounts" | "customers";

export default function AccountsPage() {
  const { activeWorkspace } = useWorkspaceStore();
  const { accounts, loadAccounts, addAccount, editAccount, removeAccount } = useFinancialStore();
  const [activeTab, setActiveTab] = useState<TabId>("accounts");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => { if (activeWorkspace) loadAccounts(activeWorkspace.id); }, [activeWorkspace, loadAccounts]);

  /* ─── Account State ─── */
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Account | null>(null);
  const [accName, setAccName] = useState("");
  const [accType, setAccType] = useState<string>("bank");
  const [accBalance, setAccBalance] = useState("");
  const [accCurrency, setAccCurrency] = useState("");

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  const resetAccForm = () => { setAccName(""); setAccType("bank"); setAccBalance(""); setAccCurrency(activeWorkspace?.currency || "IDR"); };
  const openEdit = (a: Account) => { setEditTarget(a); setAccName(a.name); setAccType(a.type); setAccBalance(String(a.balance)); setAccCurrency(a.currency); };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace) return;
    await addAccount({ workspaceId: activeWorkspace.id, name: accName, type: accType as Account["type"], balance: parseFloat(accBalance) || 0, currency: accCurrency });
    setAddOpen(false); resetAccForm(); toast.success("Akun ditambahkan");
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    await editAccount(editTarget.id, { name: accName, type: accType as Account["type"], balance: parseFloat(accBalance) || 0, currency: accCurrency });
    setEditTarget(null); resetAccForm(); toast.success("Akun diperbarui");
  };

  /* ─── Customer State ─── */
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [custSearch, setCustSearch] = useState("");
  const [custOpen, setCustOpen] = useState(false);
  const [editCust, setEditCust] = useState<Customer | null>(null);
  const [cName, setCName] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cAddress, setCAddress] = useState("");
  const [cNotes, setCNotes] = useState("");

  const loadCustomers = useCallback(async () => {
    if (!activeWorkspace) return;
    const db = await import("@/lib/db");
    const data = await db.getCustomersByWorkspace(activeWorkspace.id);
    setCustomers(data);
  }, [activeWorkspace]);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  const filteredCustomers = customers.filter((c) => {
    const q = custSearch.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q);
  });

  const resetCustForm = () => { setCName(""); setCEmail(""); setCPhone(""); setCAddress(""); setCNotes(""); };

  const handleCustSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace) return;
    const db = await import("@/lib/db");
    if (editCust) {
      await db.updateCustomer({ ...editCust, name: cName, email: cEmail, phone: cPhone, address: cAddress, notes: cNotes });
      toast.success("Pelanggan diperbarui");
    } else {
      await db.createCustomer({ id: crypto.randomUUID(), workspaceId: activeWorkspace.id, name: cName, email: cEmail, phone: cPhone, address: cAddress, notes: cNotes, createdAt: Date.now() });
      toast.success("Pelanggan ditambahkan");
    }
    setCustOpen(false); setEditCust(null); resetCustForm();
    loadCustomers();
  };

  const handleCustEdit = (c: Customer) => {
    setEditCust(c); setCName(c.name); setCEmail(c.email); setCPhone(c.phone); setCAddress(c.address); setCNotes(c.notes); setCustOpen(true);
  };

  const handleCustDelete = async (id: string) => {
    if (!confirm("Hapus pelanggan ini?")) return;
    const db = await import("@/lib/db");
    await db.deleteCustomer(id);
    loadCustomers();
    toast.success("Pelanggan dihapus");
  };

  if (!mounted) return <div className="min-h-[60vh]" />;
  if (!activeWorkspace) return null;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-heading">Akun & Pelanggan</h1>
          <p className="text-sm text-muted-foreground/60">Kelola saldo, rekening, dan database pelanggan</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-muted/60 rounded-xl w-fit">
        <button onClick={() => setActiveTab("accounts")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "accounts" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
          <Wallet className="size-4 inline mr-1.5" />Akun
        </button>
        <button onClick={() => setActiveTab("customers")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "customers" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
          <Users className="size-4 inline mr-1.5" />Pelanggan
        </button>
      </div>

      {/* ───── ACCOUNTS TAB ───── */}
      {activeTab === "accounts" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="premium-stat">
              <p className="premium-stat-label">Total Saldo</p>
              <p className="premium-stat-value">{activeWorkspace.currency} {totalBalance.toLocaleString()}</p>
            </div>
            <Button size="sm" onClick={() => { resetAccForm(); setAddOpen(true); }}><Plus className="size-3.5" /> Tambah Akun</Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {accounts.map((a) => {
              const typeDef = ACCOUNT_TYPES.find((t) => t.value === a.type);
              const Icon = typeDef?.icon || Wallet;
              return (
                <div key={a.id} className="premium-card p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{a.name}</p>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{typeDef?.label || a.type}</Badge>
                      </div>
                    </div>
                  </div>
                  <p className="text-lg font-bold font-heading">{a.currency} {a.balance.toLocaleString()}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(a)}><Pencil className="size-3" /> Edit</Button>
                    <Button variant="outline" size="sm" className="flex-1 text-red-500 hover:text-red-600" onClick={async () => { if (confirm("Hapus akun?")) { await removeAccount(a.id); toast.success("Akun dihapus"); } }}><Trash2 className="size-3" /> Hapus</Button>
                  </div>
                </div>
              );
            })}
            {accounts.length === 0 && (
              <div className="col-span-full premium-card p-6 text-center">
                <Wallet className="size-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground/60">Belum ada akun</p>
              </div>
            )}
          </div>

          {/* Account Add Dialog */}
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogContent>
              <DialogHeader><DialogTitle>Tambah Akun</DialogTitle></DialogHeader>
              <form onSubmit={handleAdd} className="space-y-3">
                <div><Label className="text-xs">Nama Akun</Label><Input value={accName} onChange={(e) => setAccName(e.target.value)} required /></div>
                <div><Label className="text-xs">Tipe</Label>
                  <Select value={accType} onValueChange={(v) => v && setAccType(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ACCOUNT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Saldo Awal</Label><Input type="number" value={accBalance} onChange={(e) => setAccBalance(e.target.value)} /></div>
                <div><Label className="text-xs">Mata Uang</Label><Input value={accCurrency} onChange={(e) => setAccCurrency(e.target.value)} /></div>
                <DialogFooter><Button type="submit">Simpan</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Account Edit Dialog */}
          <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) setEditTarget(null); }}>
            <DialogContent>
              <DialogHeader><DialogTitle>Edit Akun</DialogTitle></DialogHeader>
              <form onSubmit={handleEdit} className="space-y-3">
                <div><Label className="text-xs">Nama Akun</Label><Input value={accName} onChange={(e) => setAccName(e.target.value)} required /></div>
                <div><Label className="text-xs">Tipe</Label>
                  <Select value={accType} onValueChange={(v) => v && setAccType(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ACCOUNT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Saldo</Label><Input type="number" value={accBalance} onChange={(e) => setAccBalance(e.target.value)} /></div>
                <div><Label className="text-xs">Mata Uang</Label><Input value={accCurrency} onChange={(e) => setAccCurrency(e.target.value)} /></div>
                <DialogFooter><Button type="submit">Simpan</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* ───── CUSTOMERS TAB ───── */}
      {activeTab === "customers" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
              <Input value={custSearch} onChange={(e) => setCustSearch(e.target.value)} placeholder="Cari pelanggan..." className="pl-9" />
            </div>
            <Button size="sm" onClick={() => { setEditCust(null); resetCustForm(); setCustOpen(true); }}><UserPlus className="size-3.5" /> Tambah</Button>
          </div>

          {filteredCustomers.length === 0 ? (
            <div className="premium-card p-8 text-center">
              <Users className="size-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground/60 mb-1">{custSearch ? "Pelanggan tidak ditemukan" : "Belum ada pelanggan"}</p>
              {!custSearch && <Button variant="outline" size="sm" onClick={() => { setCustOpen(true); }}><Plus className="size-3.5" /> Tambah Pelanggan</Button>}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCustomers.map((c) => (
                <div key={c.id} className="premium-card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-sm shrink-0">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{c.name}</p>
                      <div className="flex gap-3 text-[10px] text-muted-foreground/60">
                        {c.phone && <span>{c.phone}</span>}
                        {c.email && <span className="truncate">{c.email}</span>}
                      </div>
                      {c.address && <p className="text-[10px] text-muted-foreground/40 truncate">{c.address}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" className="size-8 p-0" onClick={() => handleCustEdit(c)}><Pencil className="size-3.5" /></Button>
                    <Button variant="ghost" size="sm" className="size-8 p-0 text-red-500" onClick={() => handleCustDelete(c.id)}><Trash2 className="size-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Customer Add/Edit Dialog */}
          <Dialog open={custOpen} onOpenChange={(o) => { if (!o) { setCustOpen(false); setEditCust(null); } }}>
            <DialogContent>
              <DialogHeader><DialogTitle>{editCust ? "Edit Pelanggan" : "Tambah Pelanggan"}</DialogTitle></DialogHeader>
              <form onSubmit={handleCustSave} className="space-y-3">
                <div><Label className="text-xs">Nama</Label><Input value={cName} onChange={(e) => setCName(e.target.value)} required /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Email</Label><Input type="email" value={cEmail} onChange={(e) => setCEmail(e.target.value)} /></div>
                  <div><Label className="text-xs">Telepon</Label><Input value={cPhone} onChange={(e) => setCPhone(e.target.value)} /></div>
                </div>
                <div><Label className="text-xs">Alamat</Label><Input value={cAddress} onChange={(e) => setCAddress(e.target.value)} /></div>
                <div><Label className="text-xs">Catatan</Label><Input value={cNotes} onChange={(e) => setCNotes(e.target.value)} /></div>
                <DialogFooter><Button type="submit">{editCust ? "Simpan" : "Tambah"}</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
