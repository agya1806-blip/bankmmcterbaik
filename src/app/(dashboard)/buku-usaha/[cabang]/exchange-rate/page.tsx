"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLiveQuery } from "@/hooks/useLiveQuery";
import { db, type MataUang, BRANCH_MAP } from "@/lib/db-v4";
import { ArrowLeft, DollarSign, Save, RefreshCw } from "lucide-react";
import { showToast } from "@/lib/toast";
import { formatCurrency, CURRENCY_NAMES } from "@/lib/currency";

export default function ExchangeRatePage() {
  return <ExchangeRateContent />;
}

function ExchangeRateContent() {
  const params = useParams();
  const router = useRouter();
  const cabangSlug = (params?.cabang as string) || "";

  const rates = useLiveQuery(() => db.exchangeRates.toArray(), []) || [];

  const [editPair, setEditPair] = useState<string | null>(null);
  const [editRate, setEditRate] = useState(0);

  const pairs: { from: MataUang; to: MataUang; label: string }[] = [
    { from: "USD", to: "IDR", label: "USD ke IDR" },
    { from: "IDR", to: "USD", label: "IDR ke USD" },
  ];

  const getRate = (from: MataUang, to: MataUang) => {
    const r = rates.find((r) => r.from === from && r.to === to);
    return r?.rate ?? (from === "USD" && to === "IDR" ? 16500 : from === "IDR" && to === "USD" ? 1 / 16500 : 1);
  };

  const handleSave = async (from: MataUang, to: MataUang) => {
    if (editRate <= 0) return showToast.error("Rate harus lebih dari 0!");
    const existing = rates.find((r) => r.from === from && r.to === to);
    if (existing) {
      await db.exchangeRates.update(existing.id, { rate: editRate, updatedAt: new Date().toISOString() });
    } else {
      await db.exchangeRates.add({
        id: crypto.randomUUID(),
        from,
        to,
        rate: editRate,
        updatedAt: new Date().toISOString(),
      });
    }
    setEditPair(null);
    showToast.success("Kurs berhasil diperbarui!");
  };

  return (
    <div className="flex flex-col gap-4 pt-2 pb-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <button onClick={() => router.push(`/buku-usaha/${cabangSlug}`)} className="p-2 bg-white dark:bg-[#131527] rounded-full shadow-md active:scale-95 transition-transform">
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </button>
        <h1 className="text-lg font-heading font-extrabold tracking-tight flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-[#008CEB]" />
          Kurs Valuta
        </h1>
        <div className="w-10 h-10" />
      </div>

      <div className="premium-card p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/5 dark:to-teal-500/5">
        <p className="text-[10px] text-slate-400 font-bold mb-2">
          Atur kurs mata uang untuk konversi USD ke IDR dan sebaliknya.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {pairs.map((pair) => {
          const rate = getRate(pair.from, pair.to);
          const isEditing = editPair === `${pair.from}-${pair.to}`;
          return (
            <div key={pair.label} className="premium-card p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#008CEB]/10 flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 text-[#008CEB]" />
                  </div>
                  <span className="text-xs font-heading font-extrabold">{pair.label}</span>
                </div>
                <button onClick={() => {
                  setEditPair(isEditing ? null : `${pair.from}-${pair.to}`);
                  setEditRate(rate);
                }} className="text-[10px] text-[#008CEB] font-bold px-2 py-1 rounded-lg bg-[#008CEB]/10 active:scale-95 transition-transform">
                  {isEditing ? "Batal" : "Ubah"}
                </button>
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  <input type="number" step="any" value={editRate || ""}
                    onChange={(e) => setEditRate(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none font-bold text-sm" />
                  <button onClick={() => handleSave(pair.from, pair.to)}
                    className="w-full py-2 rounded-xl bg-gradient-to-r from-[#008CEB] to-[#00C9A7] text-white font-bold text-xs active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5">
                    <Save className="w-4 h-4" /> Simpan Kurs
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-heading font-extrabold text-[#008CEB] tracking-tight">{rate.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</p>
                  <p className="text-[9px] text-slate-400 mt-1">
                    1 {CURRENCY_NAMES[pair.from]} = {formatCurrency(rate, pair.to)} (tanpa {CURRENCY_NAMES[pair.to]})
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
