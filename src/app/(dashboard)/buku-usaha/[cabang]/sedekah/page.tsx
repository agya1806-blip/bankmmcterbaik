"use client";
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLiveQuery } from "@/hooks/useLiveQuery";
import { db, type UnitId, BRANCH_MAP, BRANCH_LABELS } from "@/lib/db-v4";
import { showToast } from "@/lib/toast";
import { ArrowLeft, Heart, HandCoins, DollarSign, PiggyBank, Gift, Save, BadgePercent } from "lucide-react";
import { RoleGuard } from "@/components/layout/role-guard";

const balanceTypes = [
  { key: "zakatMal" as const, label: "Zakat Mal", icon: <BadgePercent className="w-5 h-5" />, color: "emerald" },
  { key: "zakatFitrah" as const, label: "Zakat Fitrah", icon: <HandCoins className="w-5 h-5" />, color: "blue" },
  { key: "infakTerikat" as const, label: "Infak Terikat", icon: <Gift className="w-5 h-5" />, color: "purple" },
  { key: "sedekahSubuh" as const, label: "Sedekah Subuh", icon: <Heart className="w-5 h-5" />, color: "rose" },
];

export default function SedekahPage() {
  return <RoleGuard requiredRole="admin"><SedekahPageContent /></RoleGuard>;
}

function SedekahPageContent() {
  const params = useParams();
  const router = useRouter();
  const cabangSlug = (params?.cabang as string) || "";
  const bookOrBranchId: UnitId = BRANCH_MAP[cabangSlug] || "usaha-warkop";

  const sedekahBalancesArr = useLiveQuery(() =>
    db.sedekahBalances.where("bookOrBranchId").equals(bookOrBranchId).toArray()
  , [bookOrBranchId]) || [];

  const sedekahTransactions = useLiveQuery(() =>
    db.transactions.where("bookOrBranchId").equals(bookOrBranchId).filter(tx => tx.sedekahNominal > 0).reverse().toArray()
  , [bookOrBranchId]);

  const [formValues, setFormValues] = useState({ zakatMal: 0, zakatFitrah: 0, infakTerikat: 0, sedekahSubuh: 0 });
  const [loading, setLoading] = useState(false);

  const balance = sedekahBalancesArr[0] || { zakatMal: 0, zakatFitrah: 0, infakTerikat: 0, sedekahSubuh: 0 };
  const txList = sedekahTransactions || [];

  const handleChange = (key: string, value: string) => {
    setFormValues(prev => ({ ...prev, [key]: Math.max(0, Number(value) || 0) }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const total = formValues.zakatMal + formValues.zakatFitrah + formValues.infakTerikat + formValues.sedekahSubuh;
    if (total <= 0) return showToast.error("Masukkan minimal satu nominal");

    setLoading(true);
    try {
      const existing = sedekahBalancesArr[0];
      if (existing) {
        await db.sedekahBalances.update(existing.id, {
          zakatMal: (existing.zakatMal || 0) + formValues.zakatMal,
          zakatFitrah: (existing.zakatFitrah || 0) + formValues.zakatFitrah,
          infakTerikat: (existing.infakTerikat || 0) + formValues.infakTerikat,
          sedekahSubuh: (existing.sedekahSubuh || 0) + formValues.sedekahSubuh,
        });
      } else {
        await db.sedekahBalances.add({
          id: crypto.randomUUID(),
          bookOrBranchId,
          ...formValues,
        });
      }
      setFormValues({ zakatMal: 0, zakatFitrah: 0, infakTerikat: 0, sedekahSubuh: 0 });
      showToast.success("Sedekah berhasil dicatat");
    } catch {
      showToast.error("Gagal menyimpan sedekah");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 pt-2 pb-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <button onClick={() => router.push(`/buku-usaha/${cabangSlug}`)} className="p-2 bg-white dark:bg-[#131527] rounded-full shadow-md active:scale-95 transition-transform">
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-heading font-extrabold tracking-tight">Sedekah</h1>
          <p className="text-[9px] text-slate-400 font-bold -mt-0.5">{BRANCH_LABELS[cabangSlug] || cabangSlug}</p>
        </div>
        <div className="w-10" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {balanceTypes.map((bt, i) => {
          const val = balance[bt.key];
          return (
            <div key={bt.key} className="premium-card premium-card-glow p-4 animate-slide-up flex flex-col gap-2" style={{ animationDelay: `${i * 80}ms`, animationFillMode: "backwards" }}>
              <div className={`w-9 h-9 rounded-xl bg-${bt.color}-100 dark:bg-${bt.color}-900/30 flex items-center justify-center`}>
                {bt.icon}
              </div>
              <span className="text-[10px] font-heading font-bold text-slate-400 uppercase tracking-wider">{bt.label}</span>
              <p className={`text-sm font-heading font-extrabold text-${bt.color}-600 dark:text-${bt.color}-400 tracking-tight`}>
                Rp{val.toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>

      <div className="premium-card p-4 animate-fade-in">
        <div className="flex items-center gap-2 mb-3">
          <Heart className="w-4 h-4 text-[#008CEB]" />
          <span className="text-xs font-heading font-extrabold">Tambah Saldo Sedekah</span>
        </div>
        <form onSubmit={handleSave} className="space-y-3 text-xs">
          {balanceTypes.map((bt) => (
            <div key={bt.key}>
              <label className="block mb-1 font-bold text-slate-400">{bt.label} (Rp)</label>
              <input
                type="number"
                value={formValues[bt.key] || ""}
                onChange={(e) => handleChange(bt.key, e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none text-sm font-bold"
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#008CEB] to-[#00C9A7] text-white font-extrabold text-xs shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {loading ? "Menyimpan..." : "Simpan"}
          </button>
        </form>
      </div>

      <div className="premium-card premium-card-glow p-4 animate-fade-in">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="w-4 h-4 text-[#008CEB]" />
          <span className="text-xs font-heading font-extrabold">Riwayat Sedekah</span>
        </div>
        {txList.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs animate-fade-in"><Heart className="w-6 h-6 mx-auto mb-2 opacity-40" />Belum ada riwayat sedekah</div>
        ) : (
          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {txList.map((tx, i) => {
              const tgl = new Date(tx.tanggal);
              return (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0 animate-slide-up" style={{ animationDelay: `${i * 40}ms`, animationFillMode: "backwards" }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                      <Heart className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-xs font-heading font-bold line-clamp-1">{tx.customerNama || "Tanpa nama"}</p>
                      <p className="text-[9px] text-slate-400 font-medium">
                        {tgl.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        {tx.invoiceNumber ? ` · ${tx.invoiceNumber}` : ""}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-heading font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    Rp{tx.sedekahNominal.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
