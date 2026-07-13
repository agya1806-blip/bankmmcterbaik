"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Search, Users, UserPlus, Plus, Pencil, Trash2, Mail, Phone } from "lucide-react";
import type { Customer } from "@/lib/db";
import toast from "react-hot-toast";

interface CustomersListProps {
  workspaceId: string;
}

export default function CustomersList({ workspaceId }: CustomersListProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Customer | null>(null);
  const [cName, setCName] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cAddress, setCAddress] = useState("");
  const [cNotes, setCNotes] = useState("");

  const loadCustomers = useCallback(async () => {
    const db = await import("@/lib/db");
    const data = await db.getCustomersByWorkspace(workspaceId);
    setCustomers(data);
  }, [workspaceId]);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q);
  });

  const resetForm = () => { setCName(""); setCEmail(""); setCPhone(""); setCAddress(""); setCNotes(""); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const db = await import("@/lib/db");
    if (editTarget) {
      await db.updateCustomer({ ...editTarget, name: cName, email: cEmail, phone: cPhone, address: cAddress, notes: cNotes });
      toast.success("Pelanggan diperbarui");
    } else {
      await db.createCustomer({
        id: crypto.randomUUID(), workspaceId, name: cName, email: cEmail,
        phone: cPhone, address: cAddress, notes: cNotes, createdAt: Date.now(),
      });
      toast.success("Pelanggan ditambahkan");
    }
    setOpen(false); setEditTarget(null); resetForm();
    loadCustomers();
  };

  const handleEdit = (c: Customer) => {
    setEditTarget(c); setCName(c.name); setCEmail(c.email);
    setCPhone(c.phone); setCAddress(c.address); setCNotes(c.notes); setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus pelanggan ini?")) return;
    const db = await import("@/lib/db");
    await db.deleteCustomer(id);
    loadCustomers();
    toast.success("Pelanggan dihapus");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari pelanggan..." className="pl-10 h-11" />
        </div>
        <Button size="sm" onClick={() => { setEditTarget(null); resetForm(); setOpen(true); }}>
          <UserPlus className="size-3.5" /> Tambah
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="floating-card p-10 text-center">
          <Users className="size-12 mx-auto text-muted-foreground/20 mb-3" />
          <p className="text-sm text-muted-foreground/50 mb-1">
            {search ? "Pelanggan tidak ditemukan" : "Belum ada pelanggan"}
          </p>
          {!search && (
            <Button variant="outline" size="sm" className="mt-2" onClick={() => { setOpen(true); }}>
              <Plus className="size-3.5" /> Tambah Pelanggan
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <div key={c.id}
              className="floating-card p-4 flex items-center justify-between hover:shadow-md transition-all">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="flex items-center justify-center size-12 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 text-blue-600 dark:text-blue-400 font-bold text-lg shrink-0 border border-blue-200/30 dark:border-blue-800/30">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{c.name}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5">
                    {c.phone && (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                        <Phone className="size-3" /> {c.phone}
                      </span>
                    )}
                    {c.email && (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60 truncate max-w-[200px]">
                        <Mail className="size-3" /> {c.email}
                      </span>
                    )}
                  </div>
                  {c.address && (
                    <p className="text-[10px] text-muted-foreground/40 mt-0.5 truncate">{c.address}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-1 shrink-0 ml-3">
                <Button variant="ghost" size="sm" className="size-9 p-0 rounded-xl" onClick={() => handleEdit(c)}>
                  <Pencil className="size-3.5" />
                </Button>
                <Button variant="ghost" size="sm" className="size-9 p-0 rounded-xl text-muted-foreground/50 hover:text-red-500 hover:bg-red-500/10" onClick={() => handleDelete(c.id)}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={(o) => { if (!o) { setOpen(false); setEditTarget(null); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editTarget ? "Edit Pelanggan" : "Tambah Pelanggan"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Nama</Label>
              <Input value={cName} onChange={(e) => setCName(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Email</Label>
                <Input type="email" value={cEmail} onChange={(e) => setCEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Telepon</Label>
                <Input value={cPhone} onChange={(e) => setCPhone(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Alamat</Label>
              <Input value={cAddress} onChange={(e) => setCAddress(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Catatan</Label>
              <Input value={cNotes} onChange={(e) => setCNotes(e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="submit">{editTarget ? "Simpan" : "Tambah"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
