"use client";

import { useEffect, useState, useCallback } from "react";
import { db, type BookOrBranch, type ProductionStatus } from "@/lib/db-v4";
import { Clock, CheckCircle2, Settings2 } from "lucide-react";
import toast from "react-hot-toast";

const STATUS_FLOW: { key: ProductionStatus; label: string; color: string; next: ProductionStatus | null }[] = [
  { key: "antre", label: "Antrean", color: "text-amber-400", next: "diproduksi" },
  { key: "diproduksi", label: "Sedang Diproduksi", color: "text-blue-400", next: "selesai" },
  { key: "selesai", label: "Selesai", color: "text-emerald-400", next: null },
];

interface Props {
  branch: BookOrBranch;
  transactionId: string;
  invoiceNumber: string;
  currentStatus?: ProductionStatus;
  onStatusChange?: (newStatus: ProductionStatus) => void;
}

export default function ProductionTracker({ branch, transactionId, invoiceNumber, currentStatus, onStatusChange }: Props) {
  const [status, setStatus] = useState<ProductionStatus>(currentStatus || "antre");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (currentStatus) setStatus(currentStatus);
    else {
      (async () => {
        const existing = await db.productions.where("transactionId").equals(transactionId).first();
        if (existing) setStatus(existing.status);
      })();
    }
  }, [currentStatus, transactionId]);

  const advance = useCallback(async () => {
    const currentIdx = STATUS_FLOW.findIndex((s) => s.key === status);
    if (currentIdx === -1 || currentIdx >= STATUS_FLOW.length - 1) return;
    const next = STATUS_FLOW[currentIdx + 1];
    setUpdating(true);
    try {
      const existing = await db.productions.where("transactionId").equals(transactionId).first();
      if (existing) {
        await db.productions.update(existing.id, { status: next.key, updatedAt: new Date().toISOString() });
      } else {
        await db.productions.add({
          id: crypto.randomUUID(),
          bookOrBranchId: branch,
          transactionId,
          invoiceNumber,
          status: next.key,
          catatan: "",
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        });
      }
      setStatus(next.key);
      onStatusChange?.(next.key);
      toast.success(`${invoiceNumber} ➔ ${next.label}`);
    } catch { toast.error("Gagal update status"); }
    finally { setUpdating(false); }
  }, [status, branch, transactionId, invoiceNumber, onStatusChange]);

  const currentIdx = STATUS_FLOW.findIndex((s) => s.key === status);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Settings2 className="size-3.5 text-indigo-400" />
        <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Status Produksi</span>
      </div>
      <div className="flex items-center gap-1.5">
        {STATUS_FLOW.map((s, i) => {
          const isActive = i <= currentIdx;
          const isCurrent = s.key === status;
          return (
            <div key={s.key} className="flex items-center gap-1.5 flex-1">
              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-medium transition-all ${
                isCurrent ? `bg-slate-800 border ${s.color.replace("text", "border")}/30` : isActive ? "bg-slate-800/50" : "bg-slate-800/20 opacity-40"
              }`}>
                {isActive ? <CheckCircle2 className={`size-2.5 ${s.color}`} /> : <Clock className="size-2.5 text-slate-600" />}
                <span className={isCurrent ? s.color : "text-slate-500"}>{s.label}</span>
              </div>
              {i < STATUS_FLOW.length - 1 && <div className={`flex-1 h-px ${i < currentIdx ? "bg-emerald-500/50" : "bg-slate-700"}`} />}
            </div>
          );
        })}
      </div>
      {currentIdx < STATUS_FLOW.length - 1 && (
        <button onClick={advance} disabled={updating}
          className="text-[9px] text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50">
          {updating ? "..." : `Tandai ${STATUS_FLOW[currentIdx + 1]?.label || "Selesai"}`}
        </button>
      )}
    </div>
  );
}
