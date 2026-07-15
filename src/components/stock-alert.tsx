"use client";

import { useEffect, useState } from "react";
import { db, type BookOrBranch, BOOK_LABELS } from "@/lib/db-v4";
import { AlertTriangle, Package, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  branch?: BookOrBranch;
}

export default function StockAlert({ branch }: Props) {
  const router = useRouter();
  const [alerts, setAlerts] = useState<{ id: string; nama: string; stok: number; stokMin: number; bookOrBranchId: string }[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const items = branch
          ? await db.inventory.where("bookOrBranchId").equals(branch).toArray()
          : await db.inventory.toArray();
        const low = items.filter((i) => i.stok <= i.stokMin && i.stokMin > 0);
        setAlerts(low.slice(0, 10));
      } catch { /* silent */ }
    })();
  }, [branch]);

  if (alerts.length === 0 || dismissed) return null;

  return (
    <div className="rounded-2xl p-4 bg-gradient-to-br from-amber-500/10 to-rose-500/10 border border-amber-500/20 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-amber-500" />
          <p className="text-xs font-semibold text-amber-400">{alerts.length} item stok menipis</p>
        </div>
        <button onClick={() => setDismissed(true)} className="text-amber-400/60 hover:text-amber-400">
          <X className="size-3.5" />
        </button>
      </div>
      <div className="space-y-1">
        {alerts.map((item) => (
          <div key={item.id} className="flex items-center justify-between text-[10px] py-1 border-b border-amber-500/10 last:border-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <Package className="size-3 text-amber-400/60 shrink-0" />
              <span className="truncate">{item.nama}</span>
              {!branch && item.bookOrBranchId && (
                <span className="text-[8px] text-muted-foreground/40 shrink-0">({BOOK_LABELS[item.bookOrBranchId as BookOrBranch] || item.bookOrBranchId})</span>
              )}
            </div>
            <span className="font-semibold tabular-nums shrink-0 ml-2">
              <span className="text-rose-400">{item.stok}</span>
              <span className="text-muted-foreground/40"> / {item.stokMin}</span>
            </span>
          </div>
        ))}
      </div>
      <button onClick={() => router.push("/buku-usaha/inventory")}
        className="text-[9px] text-amber-400/60 hover:text-amber-400 transition-colors">
        Kelola Stok →
      </button>
    </div>
  );
}
