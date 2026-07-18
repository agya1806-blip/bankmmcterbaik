"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type UnitId, BRANCH_MAP, branchPrefix } from "@/lib/db-v4";
import { ArrowLeft, Plus, Search, ClipboardList, Trash2, Send, CheckCircle, XCircle, X, Save } from "lucide-react";
import { showToast } from "@/lib/toast";

export default function PurchaseOrderPage() {
  const params = useParams();
  const router = useRouter();
  const cabangSlug = (params?.cabang as string) || "";
  const bookOrBranchId: UnitId = BRANCH_MAP[cabangSlug] || "usaha-warkop";

  const orders = useLiveQuery(
    () => db.purchaseOrders.where("bookOrBranchId").equals(bookOrBranchId).reverse().toArray(),
    [bookOrBranchId]
  ) || [];

  const suppliers = useLiveQuery(
    () => db.suppliers.where("bookOrBranchId").equals(bookOrBranchId).toArray(),
    [bookOrBranchId]
  ) || [];

  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [supplierId, setSupplierId] = useState("");
  const [supplierNama, setSupplierNama] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [items, setItems] = useState<{ id: string; namaItem: string; qty: number; harga: number; subtotal: number }[]>([]);
  const [catatan, setCatatan] = useState("");

  const generatePoNumber = async () => {
    const prefix = branchPrefix(bookOrBranchId);
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const dateStr = `${y}${m}${d}`;
    const dayCount = orders.filter((o) => o.createdAt.slice(0, 10) === now.toISOString().slice(0, 10)).length;
    return `PO/${prefix}/${dateStr}/${String(dayCount + 1).padStart(3, "0")}`;
  };

  const openForm = async () => {
    setSupplierId(""); setSupplierNama(""); setCatatan(""); setItems([]);
    setPoNumber(await generatePoNumber());
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false); setSupplierId(""); setSupplierNama(""); setPoNumber(""); setItems([]); setCatatan("");
  };

  const addItemRow = () => {
    setItems([...items, { id: crypto.randomUUID(), namaItem: "", qty: 1, harga: 0, subtotal: 0 }]);
  };

  const removeItemRow = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const updateItem = (id: string, field: string, value: string | number) => {
    setItems(items.map((i) => {
      if (i.id !== id) return i;
      const updated = { ...i, [field]: value };
      if (field === "qty" || field === "harga") {
        updated.subtotal = (field === "qty" ? Number(value) : i.qty) * (field === "harga" ? Number(value) : i.harga);
      }
      return updated;
    }));
  };

  const total = items.reduce((sum, i) => sum + i.subtotal, 0);

  const handleSave = async () => {
    if (!supplierId) return showToast.error("Pilih supplier!");
    if (items.length === 0 || items.some((i) => !i.namaItem.trim())) return showToast.error("Isi semua item!");
    try {
      await db.purchaseOrders.add({
        id: crypto.randomUUID(),
        bookOrBranchId,
        unitId: bookOrBranchId,
        poNumber,
        supplierId,
        supplierNama,
        items: items.map(({ id, namaItem, qty, harga, subtotal }) => ({ id, namaItem: namaItem.trim(), qty, harga, subtotal })),
        total,
        status: "draft",
        catatan: catatan.trim(),
        createdAt: new Date().toISOString(),
      });
      showToast.success("PO berhasil dibuat");
      resetForm();
    } catch { showToast.error("Gagal menyimpan PO"); }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const po = orders.find((o) => o.id === id);
    if (!po) return;
    const label = { draft: "draft", dikirim: "dikirim", diterima: "diterima", selesai: "selesai", batal: "batal" }[newStatus] || "";
    if (!confirm(`${label === "batal" ? "Batalkan" : `Ubah status ke "${label}"`} PO ${po.poNumber}?`)) return;
    try {
      await db.transaction("rw", db.purchaseOrders, db.inventory, db.inventoryMutations, async () => {
        await db.purchaseOrders.update(id, { status: newStatus as any });

        if (newStatus === "diterima") {
          for (const item of po.items) {
            const matching = await db.inventory
              .where("bookOrBranchId").equals(bookOrBranchId)
              .filter((inv) => inv.nama.toLowerCase() === item.namaItem.toLowerCase())
              .toArray();
            for (const inv of matching) {
              const stokSebelum = inv.stok;
              const stokSesudah = inv.stok + item.qty;
              await db.inventory.update(inv.id, { stok: stokSesudah, updatedAt: new Date().toISOString() });
              await db.inventoryMutations.add({
                id: crypto.randomUUID(),
                bookOrBranchId,
                itemId: inv.id,
                tipe: "masuk",
                qty: item.qty,
                stokSebelum,
                stokSesudah,
                alasan: `PO: ${po.poNumber}`,
                createdAt: new Date().toISOString(),
              });
            }
          }
        }
      });
      showToast.success(`PO ${label === "batal" ? "dibatalkan" : `status → ${label}`}`);
    } catch { showToast.error("Gagal mengubah status"); }
  };

  const filtered = orders.filter((o) => {
    const matchSearch = !searchQuery || o.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) || o.supplierNama.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      draft: { label: "Draft", color: "bg-slate-100 dark:bg-slate-800 text-slate-500" },
      dikirim: { label: "Dikirim", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600" },
      diterima: { label: "Diterima", color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600" },
      selesai: { label: "Selesai", color: "bg-green-100 dark:bg-green-900/30 text-green-600" },
      batal: { label: "Batal", color: "bg-rose-100 dark:bg-rose-900/30 text-rose-500" },
    };
    const m = map[status] || map.draft;
    return <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${m.color}`}>{m.label}</span>;
  };

  const statusActions = (po: typeof orders[0]) => {
    const actions: { label: string; status: string; icon: React.ReactNode; color: string }[] = [];
    if (po.status === "draft") {
      actions.push({ label: "Kirim", status: "dikirim", icon: <Send className="w-3.5 h-3.5" />, color: "text-blue-600 bg-blue-500/10" });
      actions.push({ label: "Batal", status: "batal", icon: <XCircle className="w-3.5 h-3.5" />, color: "text-rose-600 bg-rose-500/10" });
    } else if (po.status === "dikirim") {
      actions.push({ label: "Terima", status: "diterima", icon: <CheckCircle className="w-3.5 h-3.5" />, color: "text-emerald-600 bg-emerald-500/10" });
      actions.push({ label: "Batal", status: "batal", icon: <XCircle className="w-3.5 h-3.5" />, color: "text-rose-600 bg-rose-500/10" });
    } else if (po.status === "diterima") {
      actions.push({ label: "Selesai", status: "selesai", icon: <CheckCircle className="w-3.5 h-3.5" />, color: "text-green-600 bg-green-500/10" });
    }
    return actions;
  };

  return (
    <div className="flex flex-col gap-4 pt-2 pb-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <button onClick={() => router.push(`/buku-usaha/${cabangSlug}`)} className="p-2 bg-white dark:bg-[#131527] rounded-full shadow-md active:scale-95 transition-transform">
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-heading font-extrabold tracking-tight flex items-center gap-2 justify-center">
            <ClipboardList className="w-5 h-5 text-[#008CEB]" />
            Pembelian (PO)
          </h1>
        </div>
        <button onClick={openForm} className="p-2 bg-gradient-to-r from-[#008CEB] to-[#00C9A7] text-white rounded-full shadow-md active:scale-95 transition-transform">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="premium-card p-4 bg-gradient-to-br from-[#008CEB]/10 to-[#00C9A7]/10 dark:from-[#008CEB]/5 dark:to-[#00C9A7]/5">
        <div className="flex items-center gap-2 mb-1">
          <ClipboardList className="w-4 h-4 text-[#008CEB]" />
          <span className="text-[10px] text-slate-400 font-bold uppercase">Total PO</span>
        </div>
        <p className="text-xl font-heading font-extrabold text-[#008CEB] dark:text-[#4DA3E0] tracking-tight">{orders.length}</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Cari PO..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs font-medium focus:outline-none" />
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {["all", "draft", "dikirim", "diterima", "selesai", "batal"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${statusFilter === s ? "bg-[#008CEB] text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-500"}`}>
            {s === "all" ? "Semua" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 overflow-y-auto py-4" onClick={() => { if (confirm("Tutup form? Data yang belum disimpan akan hilang.")) resetForm(); }}>
          <div className="bg-white dark:bg-[#131527] rounded-2xl p-5 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-heading font-extrabold">Buat PO Baru</h2>
              <button onClick={resetForm} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 mb-1 block">Nomor PO</label>
                <input type="text" value={poNumber} readOnly
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 font-mono text-[11px] font-bold focus:outline-none" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 mb-1 block">Supplier</label>
                <select value={supplierId} onChange={(e) => {
                  const id = e.target.value;
                  setSupplierId(id);
                  const sup = suppliers.find((s) => s.id === id);
                  setSupplierNama(sup?.nama || "");
                }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 font-bold focus:outline-none">
                  <option value="">-- Pilih Supplier --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.nama}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold text-slate-400">Item</label>
                  <button onClick={addItemRow} className="text-[10px] font-bold text-[#008CEB] flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Tambah Item
                  </button>
                </div>
                <div className="space-y-2">
                  {items.length === 0 && (
                    <p className="text-center text-[10px] text-slate-400 py-3">Belum ada item. Klik "Tambah Item".</p>
                  )}
                  {items.map((item, idx) => (
                    <div key={item.id} className="bg-slate-50 dark:bg-zinc-800/50 rounded-xl p-2.5 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-slate-400 w-4">{idx + 1}.</span>
                        <input type="text" placeholder="Nama item" value={item.namaItem}
                          onChange={(e) => updateItem(item.id, "namaItem", e.target.value)}
                          className="flex-1 px-2 py-1.5 rounded-lg bg-white dark:bg-zinc-800 font-bold text-[11px] focus:outline-none" />
                        <button onClick={() => removeItemRow(item.id)} className="p-1 text-rose-400 hover:text-rose-600">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <div>
                          <label className="text-[8px] text-slate-400 font-bold">Qty</label>
                          <input type="number" min={1} value={item.qty || ""}
                            onChange={(e) => updateItem(item.id, "qty", Number(e.target.value))}
                            className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-zinc-800 font-bold text-[11px] focus:outline-none" />
                        </div>
                        <div>
                          <label className="text-[8px] text-slate-400 font-bold">Harga</label>
                          <input type="number" min={0} value={item.harga || ""}
                            onChange={(e) => updateItem(item.id, "harga", Number(e.target.value))}
                            className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-zinc-800 font-bold text-[11px] focus:outline-none" />
                        </div>
                        <div>
                          <label className="text-[8px] text-slate-400 font-bold">Subtotal</label>
                          <div className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-zinc-800 font-bold text-[11px] text-[#008CEB]">
                            Rp{item.subtotal.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center bg-slate-100 dark:bg-zinc-800 rounded-xl px-3 py-2.5">
                <span className="text-xs font-bold text-slate-500">Total</span>
                <span className="text-sm font-heading font-extrabold text-[#008CEB]">Rp{total.toLocaleString()}</span>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 mb-1 block">Catatan</label>
                <textarea placeholder="Catatan (opsional)" value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none resize-none text-xs" rows={2} />
              </div>

              <button onClick={handleSave}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#008CEB] to-[#00C9A7] text-white font-bold text-xs active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5">
                <Save className="w-4 h-4" /> Simpan PO
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs animate-fade-in">
            <ClipboardList className="w-6 h-6 mx-auto mb-2 opacity-40" />
            {searchQuery || statusFilter !== "all" ? "Tidak ada PO yang cocok" : "Belum ada PO. Klik + untuk membuat."}
          </div>
        ) : (
          filtered.map((po) => (
            <div key={po.id} className="premium-card p-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#008CEB]/10 flex items-center justify-center text-[#008CEB] shrink-0">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-heading font-bold">{po.poNumber}</p>
                    {statusBadge(po.status)}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">{po.supplierNama}</p>
                  <p className="text-[10px] text-slate-400">{po.items.length} item</p>
                  {po.catatan && <p className="text-[9px] text-slate-400 italic mt-0.5">{po.catatan}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-heading font-extrabold text-[#008CEB]">Rp{po.total.toLocaleString()}</p>
                  <p className="text-[8px] text-slate-400 mt-0.5">{new Date(po.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</p>
                </div>
              </div>
              {statusActions(po).length > 0 && (
                <div className="flex gap-1.5 mt-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                  {statusActions(po).map((a) => (
                    <button key={a.status} onClick={() => updateStatus(po.id, a.status)}
                      className={`text-[9px] font-bold px-2.5 py-1 rounded-lg ${a.color} active:scale-95 transition-transform flex items-center gap-1`}>
                      {a.icon} {a.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
