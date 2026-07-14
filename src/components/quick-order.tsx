"use client";

import { useState } from "react";
import { X, ChevronDown, ChevronRight, Package } from "lucide-react";
import toast from "react-hot-toast";
import { useBusinessStore } from "@/store/useBusinessStore";
import type { BizUnit } from "@/store/useBusinessStore";

interface Props {
  unit: BizUnit;
  onSelect: (items: { desc: string; price: number }[]) => void;
}

export default function QuickOrder({ unit, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const quickOrders = useBusinessStore((s) => s.quickOrders);
  const deleteQuickOrder = useBusinessStore((s) => s.deleteQuickOrder);
  const orders = quickOrders.filter((q) => q.unit === unit);

  return (
    <div className="floating-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-2">
          <Package className="size-4 text-indigo-500" />
          Pesanan Cepat ({orders.length})
        </span>
        {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-2">
          {orders.length === 0 && (
            <p className="text-[10px] text-muted-foreground/50 text-center py-2">
              Belum ada template. Simpan pesanan sering sebagai template cepat.
            </p>
          )}
          {orders.map((q) => (
            <div key={q.id} className="flex items-center gap-2">
              <button
                onClick={() => onSelect(q.items)}
                className="flex-1 text-left text-[10px] font-medium px-3 py-2 rounded-lg bg-muted/30 hover:bg-muted/60 hover:scale-[1.01] active:scale-[0.99] transition-all border border-border/30"
              >
                {q.label}
              </button>
              <button
                onClick={() => { deleteQuickOrder(q.id); toast.success("Template dihapus"); }}
                className="size-7 flex items-center justify-center rounded-lg text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
