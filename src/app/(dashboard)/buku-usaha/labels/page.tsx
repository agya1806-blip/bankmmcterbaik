"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Tag, Plus, X, Check } from "lucide-react";
import toast from "react-hot-toast";
import { useBusinessStore } from "@/store/useBusinessStore";

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#10b981",
  "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280",
];

export default function LabelsPage() {
  const router = useRouter();
  const labels = useBusinessStore((s) => s.transaksiLabels);
  const tags = useBusinessStore((s) => s.transaksiTags);
  const addLabel = useBusinessStore((s) => s.addTransaksiLabel);
  const updateLabel = useBusinessStore((s) => s.updateTransaksiLabel);
  const deleteLabel = useBusinessStore((s) => s.deleteTransaksiLabel);

  const [showForm, setShowForm] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[3]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editColor, setEditColor] = useState("");

  const handleAdd = () => {
    const trimmed = newLabel.trim();
    if (!trimmed) return toast.error("Nama label harus diisi");
    if (labels.some((l) => l.label.toLowerCase() === trimmed.toLowerCase())) {
      return toast.error("Label sudah ada");
    }
    addLabel({ label: trimmed, warna: newColor });
    setNewLabel("");
    setNewColor(PRESET_COLORS[3]);
    setShowForm(false);
    toast.success(`Label "${trimmed}" ditambahkan`);
  };

  const startEdit = (id: string, label: string, warna: string) => {
    setEditingId(id);
    setEditLabel(label);
    setEditColor(warna);
  };

  const saveEdit = (id: string) => {
    const trimmed = editLabel.trim();
    if (!trimmed) return toast.error("Nama label harus diisi");
    const exists = labels.some(
      (l) => l.id !== id && l.label.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) return toast.error("Label sudah ada");
    updateLabel(id, { label: trimmed, warna: editColor });
    setEditingId(null);
    toast.success("Label diperbarui");
  };

  const handleDelete = (id: string, label: string) => {
    deleteLabel(id);
    toast.success(`Label "${label}" dihapus`);
  };

  const countTagged = (labelId: string) =>
    tags.filter((t) => t.labelId === labelId).length;

  return (
    <div className="max-w-2xl mx-auto pb-20 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/buku-usaha")}
            className="size-9 rounded-xl bg-white/90 dark:bg-[#131527]/90 backdrop-blur-md flex items-center justify-center hover:bg-white/70 dark:hover:bg-[#131527]/70 transition-all active:scale-[0.97] border border-slate-200/60 dark:border-slate-800/60"
          >
            <ArrowLeft className="size-4 text-muted-foreground" />
          </button>
          <div className="size-11 rounded-2xl bg-gradient-to-br from-[#7B61FF] to-[#FF5C00] flex items-center justify-center shadow-lg shadow-[#7B61FF]/20">
            <Tag className="size-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold font-heading">Kategori & Label</h2>
            <p className="text-[10px] text-muted-foreground/60">
              {labels.length} label &mdash; {tags.length} tagging
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-gradient px-3 py-2 text-[10px] font-bold flex items-center gap-1.5"
        >
          <Plus className="size-3.5" /> Label Baru
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="premium-card p-4 space-y-3 border border-slate-200/60 dark:border-slate-800/60">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Nama label..."
            className="input-premium w-full text-xs"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            autoFocus
          />
          <div className="flex items-center gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setNewColor(c)}
                className={`size-7 rounded-full border-2 transition-all ${
                  newColor === c ? "border-foreground scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="btn-gradient flex-1 px-3 py-2 text-[10px] font-bold"
            >
              Simpan
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="btn-ghost px-3 py-2 text-[10px] font-medium"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Grid */}
      {labels.length === 0 ? (
        <div className="premium-card p-8 text-center border border-slate-200/60 dark:border-slate-800/60">
          <Tag className="size-12 mx-auto text-muted-foreground/20" />
          <p className="text-sm text-muted-foreground/40 mt-3">Belum ada label</p>
          <p className="text-[10px] text-muted-foreground/30 mt-1">
            Buat label pertama untuk mulai mengkategorikan transaksi
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {labels.map((l) => (
            <div
              key={l.id}
              className="premium-card p-4 border border-slate-200/60 dark:border-slate-800/60 hover:shadow-lg transition-shadow"
            >
              {editingId === l.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    className="input-premium w-full text-xs"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && saveEdit(l.id)}
                  />
                  <div className="flex items-center gap-2">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setEditColor(c)}
                        className={`size-6 rounded-full border-2 transition-all ${
                          editColor === c ? "border-foreground scale-110" : "border-transparent"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(l.id)}
                      className="btn-gradient flex-1 px-2 py-1.5 text-[10px] font-bold flex items-center justify-center gap-1"
                    >
                      <Check className="size-3" /> Simpan
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="btn-ghost px-2 py-1.5 text-[10px] font-medium"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="size-4 rounded"
                        style={{ backgroundColor: l.warna }}
                      />
                      <div>
                        <p className="text-sm font-semibold">{l.label}</p>
                        <p className="text-[9px] text-muted-foreground/40">
                          {countTagged(l.id)} transaksi ditandai
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(l.id, l.label, l.warna)}
                        className="size-7 rounded-lg bg-white/90 dark:bg-[#131527]/90 backdrop-blur-md flex items-center justify-center hover:bg-white/70 dark:hover:bg-[#131527]/70 transition-all active:scale-[0.97] border border-slate-200/60 dark:border-slate-800/60"
                      >
                        <Check className="size-3 text-muted-foreground/50" />
                      </button>
                      <button
                        onClick={() => handleDelete(l.id, l.label)}
                        className="size-7 rounded-lg bg-white/90 dark:bg-[#131527]/90 backdrop-blur-md flex items-center justify-center hover:bg-red-500/10 transition-all active:scale-[0.97] border border-slate-200/60 dark:border-slate-800/60"
                      >
                        <X className="size-3 text-red-400" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 text-[9px] text-muted-foreground/30">
                    {l.warna}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
