"use client";
import React from "react";
import { Plus } from "lucide-react";

interface ProductCategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  categories: string[];
}

export function ProductCategorySelect({ value, onChange, categories }: ProductCategorySelectProps) {
  const [isCustom, setIsCustom] = React.useState(false);
  const [customValue, setCustomValue] = React.useState("");

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === "__custom__") {
      setIsCustom(true);
      return;
    }
    onChange(e.target.value);
  };

  const handleCustomSave = () => {
    if (customValue.trim()) {
      onChange(customValue.trim());
      setIsCustom(false);
      setCustomValue("");
    }
  };

  if (isCustom) {
    return (
      <div>
        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Kategori</label>
        <div className="flex items-center gap-2 mt-1">
          <input
            type="text"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            className="flex-1 input-premium"
            placeholder="Nama kategori baru"
            autoFocus
          />
          <button
            type="button"
            onClick={handleCustomSave}
            className="px-3 py-2.5 rounded-xl bg-[#008CEB] text-white text-[10px] font-bold"
          >
            Simpan
          </button>
          <button
            type="button"
            onClick={() => setIsCustom(false)}
            className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-400 text-[10px] font-bold"
          >
            Batal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Kategori</label>
      <div className="flex items-center gap-2 mt-1">
        <select
          value={value}
          onChange={handleSelectChange}
          className="flex-1 input-premium appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%238B9DB5%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right_8px_center] bg-no-repeat pr-8"
        >
          <option value="">Semua Kategori</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
          <option value="__custom__">+ Tambah Baru</option>
        </select>
      </div>
    </div>
  );
}
