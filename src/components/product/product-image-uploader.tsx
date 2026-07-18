"use client";
import React from "react";
import { Camera, X } from "lucide-react";
import { showToast } from "@/lib/toast";

interface ProductImageUploaderProps {
  fotoUrl: string;
  onFotoChange: (url: string) => void;
}

export function ProductImageUploader({ fotoUrl, onFotoChange }: ProductImageUploaderProps) {
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) return showToast.error("Maks 500KB");
    const reader = new FileReader();
    reader.onload = () => onFotoChange(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-1">
      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Foto Produk</label>
      <div className="flex items-center gap-3">
        {fotoUrl && (
          <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
            <img src={fotoUrl} alt="Preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onFotoChange("")}
              className="absolute top-0 right-0 bg-rose-500 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
        <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0F1926] cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-xs font-medium text-slate-500">
          <Camera className="w-4 h-4" />
          {fotoUrl ? "Ganti Foto" : "Pilih Foto"}
          <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        </label>
      </div>
    </div>
  );
}
