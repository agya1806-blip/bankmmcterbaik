"use client";

import React, { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, BRANCH_MAP, BRANCH_LABELS, type UnitId, type ProductionStatus } from "@/lib/db-v4";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, Search } from "lucide-react";
import { showToast } from "@/lib/toast";

export default function ProduksiPage() {
  const params = useParams();
  const router = useRouter();
  const cabangSlug = params.cabang as string;
  const unitId = BRANCH_MAP[cabangSlug] as UnitId;
  const branchLabel = BRANCH_LABELS[cabangSlug] ?? cabangSlug;

  const allProductions = useLiveQuery(
    () => db.productions.where("unitId").equals(unitId).toArray(),
    [unitId]
  ) || [];

  const allTransactions = useLiveQuery(
    () => db.transactions.where("unitId").equals(unitId).toArray(),
    [unitId]
  ) || [];

  const [filter, setFilter] = useState("semua");
  const [search, setSearch] = useState("");

  const txMap = useMemo(() => {
    const m = new Map<string, typeof allTransactions[0]>();
    for (const tx of allTransactions) {
      m.set(tx.id, tx);
    }
    return m;
  }, [allTransactions]);

  const productionWithItems = useMemo(() => {
    return allProductions.map((p) => {
      const tx = txMap.get(p.transactionId);
      const items = tx?.items ?? [];
      const namaItem = items.length > 0 ? items.map((i) => i.namaItem).join(", ") : p.invoiceNumber;
      const qty = items.reduce((sum, i) => sum + i.qty, 0);
      return { ...p, namaItem, qty };
    });
  }, [allProductions, txMap]);

  const filteredProductions = useMemo(() => {
    let data = productionWithItems;
    if (filter !== "semua") {
      data = data.filter((p) => p.status === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((p) => p.namaItem.toLowerCase().includes(q));
    }
    return data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [productionWithItems, filter, search]);

  const updateStatus = async (id: string, currentStatus: ProductionStatus) => {
    const next: Record<ProductionStatus, ProductionStatus | null> = {
      antre: "diproduksi", diproduksi: "selesai", selesai: null,
    };
    const newStatus = next[currentStatus];
    if (!newStatus) return;
    await db.productions.update(id, { status: newStatus, updatedAt: new Date().toISOString() });
    showToast.success(`Status produksi diubah ke ${newStatus}`);
  };

  return (
    <div className="flex-1 flex flex-col pt-4 space-y-4 p-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push(`/buku-bisnis/${cabangSlug}`)}
          className="p-2 bg-white dark:bg-[#131527] rounded-full shadow-md active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </button>
        <h1 className="font-bold text-lg">Produksi</h1>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["semua", "antre", "diproduksi", "selesai"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filter === f
                ? "bg-[#7B61FF] text-white"
                : "bg-white dark:bg-[#131527] text-slate-500"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Cari item produksi..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-sm outline-none"
        />
      </div>

      {/* Production list */}
      {filteredProductions.length === 0 && (
        <p className="text-center text-slate-400 text-sm py-8">Tidak ada produksi</p>
      )}
      {filteredProductions.map((p) => (
        <div key={p.id} className="premium-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">{p.namaItem}</span>
            <StatusBadge status={p.status} />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Qty: {p.qty}</span>
            <span>{new Date(p.createdAt).toLocaleDateString("id-ID")}</span>
          </div>
          {p.catatan && <p className="text-xs text-slate-400">{p.catatan}</p>}
          {p.status !== "selesai" && (
            <button
              onClick={() => updateStatus(p.id, p.status)}
              className={`w-full py-2 rounded-xl text-xs font-semibold active:scale-[0.98] transition-transform ${
                p.status === "antre"
                  ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                  : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
              }`}
            >
              {p.status === "antre" ? "Mulai Produksi" : "Tandai Selesai"}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: ProductionStatus }) {
  const colors: Record<ProductionStatus, string> = {
    antre: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    diproduksi: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    selesai: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  };
  const labels: Record<ProductionStatus, string> = {
    antre: "Antre", diproduksi: "Diproduksi", selesai: "Selesai",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${colors[status]}`}>
      {labels[status]}
    </span>
  );
}
