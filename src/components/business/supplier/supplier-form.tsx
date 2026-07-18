"use client";
import React, { useState, useEffect } from "react";
import { Phone, MapPin, Building2 } from "lucide-react";
import type { DbSupplier } from "@/lib/db-v4";

interface SupplierFormProps {
  editingSupplier: DbSupplier | null;
  onSave: (data: { nama: string; kontak: string; alamat: string; catatan: string }) => void;
  onCancel: () => void;
}

export function SupplierForm({ editingSupplier, onSave, onCancel }: SupplierFormProps) {
  const [nama, setNama] = useState("");
  const [kontak, setKontak] = useState("");
  const [alamat, setAlamat] = useState("");
  const [catatan, setCatatan] = useState("");

  useEffect(() => {
    if (editingSupplier) {
      setNama(editingSupplier.nama);
      setKontak(editingSupplier.kontak);
      setAlamat(editingSupplier.alamat);
      setCatatan(editingSupplier.catatan);
    } else {
      setNama("");
      setKontak("");
      setAlamat("");
      setCatatan("");
    }
  }, [editingSupplier]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;
    onSave({ nama: nama.trim(), kontak: kontak.trim(), alamat: alamat.trim(), catatan: catatan.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="premium-card p-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-[#008CEB]/10 flex items-center justify-center">
          <Building2 className="w-4 h-4 text-[#008CEB]" />
        </div>
        <span className="text-xs font-heading font-extrabold">
          {editingSupplier ? "Edit Supplier" : "Tambah Supplier"}
        </span>
        {editingSupplier && (
          <button
            type="button"
            onClick={onCancel}
            className="ml-auto text-[10px] text-slate-400 font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
          >
            Batal
          </button>
        )}
      </div>
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Nama supplier *"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          className="w-full input-premium font-bold"
          required
          autoFocus
        />
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Kontak (telepon/WA)"
            value={kontak}
            onChange={(e) => setKontak(e.target.value)}
            className="w-full input-premium"
          />
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-2" />
          <textarea
            placeholder="Alamat"
            value={alamat}
            onChange={(e) => setAlamat(e.target.value)}
            className="w-full input-premium resize-none"
            rows={2}
          />
        </div>
        <input
          type="text"
          placeholder="Catatan (opsional)"
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          className="w-full input-premium"
        />
        <button
          type="submit"
          className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-[#008CEB] to-[#00C9A7] text-white font-bold text-xs shadow-lg shadow-[#008CEB]/20 scale-press"
        >
          {editingSupplier ? "Perbarui Supplier" : "Simpan Supplier"}
        </button>
      </div>
    </form>
  );
}
