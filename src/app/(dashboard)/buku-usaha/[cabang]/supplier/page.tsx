"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type UnitId, BRANCH_MAP } from "@/lib/db-v4";
import { ArrowLeft, Plus, Search, Pencil, Trash2, Phone, MapPin, Building2 } from "lucide-react";
import { showToast } from "@/lib/toast";

export default function SupplierPage() {
  const params = useParams();
  const router = useRouter();
  const cabangSlug = (params?.cabang as string) || "";
  const bookOrBranchId: UnitId = BRANCH_MAP[cabangSlug] || "usaha-warkop";

  const suppliers = useLiveQuery(
    () => db.suppliers.where("bookOrBranchId").equals(bookOrBranchId).toArray(),
    [bookOrBranchId]
  ) || [];

  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nama, setNama] = useState("");
  const [kontak, setKontak] = useState("");
  const [alamat, setAlamat] = useState("");
  const [catatan, setCatatan] = useState("");

  const resetForm = () => {
    setEditingId(null); setNama(""); setKontak(""); setAlamat(""); setCatatan("");
  };

  const handleSave = async () => {
    if (!nama.trim()) return showToast.error("Nama supplier wajib diisi!");
    try {
      if (editingId) {
        await db.suppliers.update(editingId, {
          nama: nama.trim(),
          kontak: kontak.trim(),
          alamat: alamat.trim(),
          catatan: catatan.trim(),
        });
        showToast.success("Supplier berhasil diperbarui");
      } else {
        await db.suppliers.add({
          id: crypto.randomUUID(),
          bookOrBranchId,
          unitId: bookOrBranchId,
          nama: nama.trim(),
          kontak: kontak.trim(),
          alamat: alamat.trim(),
          catatan: catatan.trim(),
          createdAt: new Date().toISOString(),
        });
        showToast.success("Supplier berhasil ditambahkan");
      }
      resetForm();
    } catch { showToast.error("Gagal menyimpan supplier"); }
  };

  const handleEdit = (s: typeof suppliers[0]) => {
    setEditingId(s.id); setNama(s.nama); setKontak(s.kontak); setAlamat(s.alamat); setCatatan(s.catatan);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus supplier ini?")) return;
    try {
      await db.suppliers.delete(id);
      showToast.success("Supplier berhasil dihapus");
      if (editingId === id) resetForm();
    } catch { showToast.error("Gagal menghapus supplier"); }
  };

  const filtered = searchQuery
    ? suppliers.filter((s) =>
        s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.kontak.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.alamat.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : suppliers;

  return (
    <div className="flex flex-col gap-4 pt-2 pb-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <button onClick={() => router.push(`/buku-usaha/${cabangSlug}`)} className="p-2 bg-white dark:bg-[#131527] rounded-full shadow-md active:scale-95 transition-transform">
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-heading font-extrabold tracking-tight flex items-center gap-2 justify-center">
            <Building2 className="w-5 h-5 text-[#008CEB]" />
            Supplier
          </h1>
        </div>
        <div className="w-10 h-10" />
      </div>

      <div className="premium-card p-4 bg-gradient-to-br from-[#008CEB]/10 to-[#00C9A7]/10 dark:from-[#008CEB]/5 dark:to-[#00C9A7]/5">
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="w-4 h-4 text-[#008CEB]" />
          <span className="text-[10px] text-slate-400 font-bold uppercase">Total Supplier</span>
        </div>
        <p className="text-xl font-heading font-extrabold text-[#008CEB] dark:text-[#4DA3E0] tracking-tight">{suppliers.length}</p>
      </div>

      <div className="premium-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-[#008CEB]/10 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-[#008CEB]" />
          </div>
          <span className="text-xs font-heading font-extrabold">{editingId ? "Edit Supplier" : "Tambah Supplier"}</span>
          {editingId && (
            <button onClick={resetForm} className="ml-auto text-[10px] text-slate-400 font-bold px-2 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800">Batal</button>
          )}
        </div>
        <div className="space-y-3 text-xs">
          <input type="text" placeholder="Nama supplier *" value={nama}
            onChange={(e) => setNama(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none font-bold" />
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-slate-400 shrink-0" />
            <input type="text" placeholder="Kontak (telepon/WA)" value={kontak}
              onChange={(e) => setKontak(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none font-medium" />
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-2" />
            <textarea placeholder="Alamat" value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none font-medium resize-none text-xs" rows={2} />
          </div>
          <input type="text" placeholder="Catatan (opsional)" value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none" />
          <button onClick={handleSave}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#008CEB] to-[#00C9A7] text-white font-bold text-xs active:scale-[0.98] transition-transform">
            {editingId ? "Update Supplier" : "Simpan Supplier"}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Cari supplier..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs font-medium focus:outline-none" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs animate-fade-in">
            <Building2 className="w-6 h-6 mx-auto mb-2 opacity-40" />
            {searchQuery ? "Tidak ada supplier yang cocok" : "Belum ada supplier. Isi form di atas untuk menambah."}
          </div>
        ) : (
          filtered.map((s) => (
            <div key={s.id} className="premium-card p-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#008CEB]/10 flex items-center justify-center text-[#008CEB] shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-heading font-bold">{s.nama}</p>
                  {s.kontak && (
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" /> {s.kontak}
                    </p>
                  )}
                  {s.alamat && (
                    <p className="text-[10px] text-slate-400 flex items-start gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 shrink-0 mt-0.5" /> {s.alamat}
                    </p>
                  )}
                  {s.catatan && <p className="text-[9px] text-slate-400 italic mt-1">{s.catatan}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => handleEdit(s)} className="p-1.5 text-slate-400 hover:text-[#008CEB]">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(s.id)} className="p-1.5 text-slate-400 hover:text-rose-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
