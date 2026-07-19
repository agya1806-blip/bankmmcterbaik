"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type UnitId, BRANCH_MAP } from "@/lib/db-v4";
import { ArrowLeft, Trash2 } from "lucide-react";
import { showToast } from "@/lib/toast";

const PREDEFINED_COLORS = [
  "#EF4444", "#F97316", "#EAB308", "#22C55E",
  "#14B8A6", "#06B6D4", "#3B82F6", "#6366F1",
  "#8B5CF6", "#A855F7", "#EC4899", "#78716C",
];

export default function LabelPage() {
  const params = useParams();
  const router = useRouter();
  const cabangSlug = (params?.cabang as string) || "";
  const bookOrBranchId = BRANCH_MAP[cabangSlug] || "usaha-percetakan";

  const labels = useLiveQuery(
    () => db.labels.where("bookOrBranchId").equals(bookOrBranchId).toArray(),
    [bookOrBranchId]
  ) || [];

  const [nama, setNama] = useState("");
  const [warna, setWarna] = useState(PREDEFINED_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const resetForm = () => { setNama(""); setWarna(PREDEFINED_COLORS[0]); setEditingId(null); };

  const handleSubmit = async () => {
    if (!nama.trim()) return showToast.error("Nama label harus diisi");
    try {
      if (editingId) {
        await db.labels.update(editingId, { label: nama.trim(), warna });
        showToast.success("Label berhasil diperbarui");
      } else {
        await db.labels.add({
          id: crypto.randomUUID(),
          bookOrBranchId,
          label: nama.trim(),
          warna,
          createdAt: new Date().toISOString(),
        });
        showToast.success("Label berhasil ditambahkan");
      }
      resetForm();
    } catch { showToast.error("Gagal menyimpan label"); }
  };

  const handleEdit = (label: { id: string; label: string; warna: string }) => {
    setNama(label.label);
    setWarna(label.warna);
    setEditingId(label.id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus label ini?")) return;
    try {
      await db.labelTags.where("labelId").equals(id).delete();
      await db.labels.delete(id);
      showToast.success("Label berhasil dihapus");
    } catch { showToast.error("Gagal menghapus label"); }
  };

  return (
    <div className="flex-1 flex flex-col pt-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => router.push(`/buku-bisnis/${cabangSlug}`)}
          className="p-2 bg-white dark:bg-[#131527] rounded-full shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-lg font-heading font-extrabold tracking-tight capitalize">Atur Label</h1>
        <div className="w-9 h-9" />
      </div>

      <div className="premium-card p-4 mb-4 space-y-3">
        <input
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          placeholder="Nama label..."
          className="w-full px-3 py-2 bg-slate-100 dark:bg-zinc-800 rounded-xl text-sm font-medium outline-none"
        />
        <div className="grid grid-cols-6 gap-2">
          {PREDEFINED_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setWarna(c)}
              className={`w-full aspect-square rounded-xl border-2 transition-all ${
                warna === c ? "border-black dark:border-white scale-110" : "border-transparent"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            className="flex-1 py-2 bg-[#008CEB] text-white text-xs font-bold rounded-xl active:scale-95 transition-transform"
          >
            {editingId ? "Perbarui Label" : "Tambah Label"}
          </button>
          {editingId && (
            <button
              onClick={resetForm}
              className="py-2 px-4 bg-slate-100 dark:bg-zinc-800 text-xs font-bold rounded-xl active:scale-95 transition-transform"
            >
              Batal
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 max-h-[500px] pr-1">
        {labels.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-xs">Belum ada label.</div>
        )}
        {labels.map((label) => (
          <div
            key={label.id}
            onClick={() => handleEdit(label)}
            className="premium-card p-3 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-5 h-5 rounded-full border border-slate-200 dark:border-slate-700"
                style={{ backgroundColor: label.warna }}
              />
              <span className="text-sm font-bold">{label.label}</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(label.id); }}
              className="p-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl active:scale-90 transition-all"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
