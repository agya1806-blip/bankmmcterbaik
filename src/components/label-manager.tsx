"use client";

import { useState } from "react";
import { X, Plus, Tag } from "lucide-react";
import toast from "react-hot-toast";
import { useBusinessStore } from "@/store/useBusinessStore";

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#10b981",
  "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280",
];

interface Props {
  onChange?: () => void;
}

export default function LabelManager({ onChange }: Props) {
  const labels = useBusinessStore((s) => s.transaksiLabels);
  const addLabel = useBusinessStore((s) => s.addTransaksiLabel);
  const deleteLabel = useBusinessStore((s) => s.deleteTransaksiLabel);

  const [showForm, setShowForm] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[3]);

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
    onChange?.();
    toast.success(`Label "${trimmed}" ditambahkan`);
  };

  const handleDelete = (id: string, label: string) => {
    deleteLabel(id);
    onChange?.();
    toast.success(`Label "${label}" dihapus`);
  };

  if (labels.length === 0) {
    return (
      <div className="floating-card p-4 text-center">
        <Tag className="size-8 mx-auto text-muted-foreground/20" />
        <p className="text-xs text-muted-foreground/40 mt-2">Belum ada label</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {labels.map((l) => (
          <div
            key={l.id}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold border"
            style={{
              backgroundColor: l.warna + "18",
              borderColor: l.warna + "40",
              color: l.warna,
            }}
          >
            <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: l.warna }} />
            {l.label}
            <button
              onClick={() => handleDelete(l.id, l.label)}
              className="ml-0.5 hover:opacity-60 transition-opacity"
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
      </div>

      {showForm ? (
        <div className="floating-card p-3 space-y-3">
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
                className={`size-6 rounded-full border-2 transition-all ${
                  newColor === c ? "border-foreground scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-white text-[10px] font-bold hover:shadow-lg transition-all"
            >
              Simpan
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-3 py-2 rounded-lg bg-muted/30 text-[10px] font-medium text-muted-foreground hover:bg-muted/50 transition-all"
            >
              Batal
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          <Plus className="size-3" /> Tambah Label
        </button>
      )}
    </div>
  );
}
