"use client";

import { useBusinessStore } from "@/store/useBusinessStore";

interface Props {
  selected: string[];
  onToggle: (labelId: string) => void;
}

export default function LabelPicker({ selected, onToggle }: Props) {
  const labels = useBusinessStore((s) => s.transaksiLabels);

  if (labels.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {labels.map((l) => {
        const isSelected = selected.includes(l.id);
        return (
          <button
            key={l.id}
            onClick={() => onToggle(l.id)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all"
            style={
              isSelected
                ? {
                    backgroundColor: l.warna,
                    borderColor: l.warna,
                    color: "#fff",
                  }
                : {
                    backgroundColor: "transparent",
                    borderColor: l.warna + "50",
                    color: l.warna,
                  }
            }
          >
            {isSelected ? null : (
              <span className="size-1.5 rounded-full" style={{ backgroundColor: l.warna }} />
            )}
            {l.label}
          </button>
        );
      })}
    </div>
  );
}
