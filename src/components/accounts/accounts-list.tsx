"use client";

import { useState, useEffect } from "react";
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
import { Plus, Wallet, Landmark, Smartphone, CreditCard, Pencil, Trash2, Banknote } from "lucide-react";
import type { Account } from "@/lib/db";
import toast from "react-hot-toast";

const ACCOUNT_TYPES = [
  { value: "bank", label: "Bank", icon: Landmark, color: "from-blue-500 to-blue-600" },
  { value: "cash", label: "Tunai", icon: Wallet, color: "from-emerald-500 to-emerald-600" },
  { value: "ewallet", label: "E-Wallet", icon: Smartphone, color: "from-purple-500 to-purple-600" },
  { value: "qris", label: "QRIS", icon: CreditCard, color: "from-cyan-500 to-cyan-600" },
  { value: "custom", label: "Lainnya", icon: Banknote, color: "from-amber-500 to-amber-600" },
] as const;

interface AccountsListProps {
  workspaceId: string;
  currency: string;
}

export default function AccountsList({ workspaceId, currency }: AccountsListProps) {
  const { accounts, loadAccounts, addAccount, editAccount, removeAccount } = useFinancialStore();
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Account | null>(null);
  const [accName, setAccName] = useState("");
  const [accType, setAccType] = useState<string>("bank");
  const [accBalance, setAccBalance] = useState("");
  const [accCurrency, setAccCurrency] = useState(currency || "IDR");

  useEffect(() => { loadAccounts(workspaceId); }, [workspaceId, loadAccounts]);

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  const resetForm = () => { setAccName(""); setAccType("bank"); setAccBalance(""); setAccCurrency("IDR"); };
  const openEdit = (a: Account) => { setEditTarget(a); setAccName(a.name); setAccType(a.type); setAccBalance(String(a.balance)); setAccCurrency(a.currency); };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await addAccount({ workspaceId, name: accName, type: accType as Account["type"], balance: parseFloat(accBalance) || 0, currency: accCurrency });
    setAddOpen(false); resetForm(); toast.success("Akun ditambahkan");
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    await editAccount(editTarget.id, { name: accName, type: accType as Account["type"], balance: parseFloat(accBalance) || 0, currency: accCurrency });
    setEditTarget(null); resetForm(); toast.success("Akun diperbarui");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="floating-card p-4 flex-1 max-w-xs">
          <p className="text-xs text-muted-foreground/70 font-medium">Total Saldo</p>
          <p className="text-2xl font-bold font-heading text-emerald-600 dark:text-emerald-400 tabular-nums">
            {currency} {totalBalance.toLocaleString()}
          </p>
        </div>
        <Button size="sm" onClick={() => { resetForm(); setAddOpen(true); }}>
          <Plus className="size-3.5" /> Tambah Akun
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {accounts.map((a) => {
          const typeDef = ACCOUNT_TYPES.find((t) => t.value === a.type);
          const Icon = typeDef?.icon || Wallet;
          const gradColor = typeDef?.color || "from-emerald-500 to-emerald-600";
          return (
            <div key={a.id} className="floating-card p-4 space-y-3 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center size-11 rounded-2xl bg-gradient-to-br ${gradColor} text-white shadow-lg`}>
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{a.name}</p>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 mt-0.5">
                      {typeDef?.label || a.type}
                    </Badge>
                  </div>
                </div>
              </div>
              <p className="text-xl font-bold font-heading tabular-nums">{a.currency} {a.balance.toLocaleString()}</p>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(a)}>
                  <Pencil className="size-3" /> Edit
                </Button>
                <Button variant="outline" size="sm" className="flex-1 text-red-500 hover:text-red-600 border-red-200/50 hover:border-red-300/50"
                  onClick={async () => { if (confirm("Hapus akun ini?")) { await removeAccount(a.id); toast.success("Akun dihapus"); } }}>
                  <Trash2 className="size-3" /> Hapus
                </Button>
              </div>
            </div>
          );
        })}
        {accounts.length === 0 && (
          <div className="col-span-full floating-card p-8 text-center">
            <Wallet className="size-10 mx-auto text-muted-foreground/20 mb-3" />
            <p className="text-sm text-muted-foreground/50">Belum ada akun</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => { resetForm(); setAddOpen(true); }}>
              <Plus className="size-3" /> Tambah Akun
            </Button>
          </div>
        )}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tambah Akun</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Nama Akun</Label>
              <Input value={accName} onChange={(e) => setAccName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Tipe</Label>
              <Select value={accType} onValueChange={(v) => v && setAccType(v)}>
                <SelectTrigger className="w-full h-11"><SelectValue /></SelectTrigger>
                <SelectContent>{ACCOUNT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Saldo Awal</Label>
              <Input type="number" value={accBalance} onChange={(e) => setAccBalance(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Mata Uang</Label>
              <Input value={accCurrency} onChange={(e) => setAccCurrency(e.target.value)} />
            </div>
            <DialogFooter><Button type="submit">Simpan</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) setEditTarget(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Akun</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Nama Akun</Label>
              <Input value={accName} onChange={(e) => setAccName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Tipe</Label>
              <Select value={accType} onValueChange={(v) => v && setAccType(v)}>
                <SelectTrigger className="w-full h-11"><SelectValue /></SelectTrigger>
                <SelectContent>{ACCOUNT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Saldo</Label>
              <Input type="number" value={accBalance} onChange={(e) => setAccBalance(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Mata Uang</Label>
              <Input value={accCurrency} onChange={(e) => setAccCurrency(e.target.value)} />
            </div>
            <DialogFooter><Button type="submit">Simpan</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
