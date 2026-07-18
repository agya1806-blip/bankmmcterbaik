"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLiveQuery } from "@/hooks/useLiveQuery";
import { db, type UnitId, BRANCH_MAP } from "@/lib/db-v4";
import { ArrowLeft, ArrowRightLeft, Send, AlertCircle } from "lucide-react";
import { showToast } from "@/lib/toast";

export default function TransferPage() {
  const params = useParams();
  const router = useRouter();
  const cabangSlug = (params?.cabang as string) || "";
  const bookOrBranchId: UnitId = BRANCH_MAP[cabangSlug] || "usaha-warkop";

  const wallets = useLiveQuery(() => db.wallets.where("bookOrBranchId").equals(bookOrBranchId).toArray(), [bookOrBranchId]) || [];
  const mutations = useLiveQuery(() => db.walletMutations.where("bookOrBranchId").equals(bookOrBranchId).toArray(), [bookOrBranchId]) || [];

  const [dariWalletId, setDariWalletId] = useState("");
  const [keWalletId, setKeWalletId] = useState("");
  const [nominal, setNominal] = useState(0);
  const [alasan, setAlasan] = useState("");
  const [loading, setLoading] = useState(false);

  const activeWallets = wallets.filter((w) => w.isActive);
  const walletMap = new Map(wallets.map((w) => [w.id, w]));
  const selectedFromWallet = walletMap.get(dariWalletId);

  const errors: string[] = [];
  if (!dariWalletId) errors.push("Pilih dompet asal");
  if (!keWalletId) errors.push("Pilih dompet tujuan");
  if (dariWalletId && keWalletId && dariWalletId === keWalletId) errors.push("Dompet asal dan tujuan harus berbeda");
  if (nominal <= 0) errors.push("Nominal harus lebih dari 0");
  if (selectedFromWallet && nominal > selectedFromWallet.saldo) errors.push("Saldo dompet asal tidak mencukupi");

  const isValid = errors.length === 0 && dariWalletId && keWalletId && nominal > 0;

  const handleSubmit = async () => {
    if (!isValid) return;
    const dariWallet = walletMap.get(dariWalletId);
    const keWallet = walletMap.get(keWalletId);
    if (!dariWallet || !keWallet) return showToast.error("Dompet tidak ditemukan");
    if (dariWallet.saldo < nominal) return showToast.error("Saldo dompet asal tidak mencukupi!");
    if (!confirm(`Transfer Rp${nominal.toLocaleString()} dari ${dariWallet.namaDompet} ke ${keWallet.namaDompet}?${alasan ? `\nAlasan: ${alasan}` : ""}`)) return;
    setLoading(true);
    try {
      await db.transaction("rw", db.wallets, db.walletMutations, async () => {
        const dariWallet = await db.wallets.get(dariWalletId);
        const keWallet = await db.wallets.get(keWalletId);
        if (!dariWallet || !keWallet) throw new Error("Dompet tidak ditemukan");
        if (dariWallet.saldo < nominal) throw new Error("Saldo tidak mencukupi");
        await db.wallets.update(dariWalletId, { saldo: dariWallet.saldo - nominal });
        await db.wallets.update(keWalletId, { saldo: keWallet.saldo + nominal });
        await db.walletMutations.add({
          id: crypto.randomUUID(),
          bookOrBranchId,
          dariWalletId,
          keWalletId,
          nominal,
          alasan: alasan.trim(),
          createdAt: new Date().toISOString(),
        });
      });
      showToast.success("Transfer berhasil!");
      setDariWalletId("");
      setKeWalletId("");
      setNominal(0);
      setAlasan("");
    } catch (err: any) {
      showToast.error(err.message || "Transfer gagal");
    } finally {
      setLoading(false);
    }
  };

  const recentMutations = [...mutations]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 20);

  return (
    <div className="flex flex-col gap-4 pt-2 pb-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.push(`/buku-usaha/${cabangSlug}`)} className="p-2 bg-white dark:bg-[#131527] rounded-full shadow-md active:scale-95 transition-transform">
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-heading font-extrabold tracking-tight flex items-center gap-2 justify-center">
            <ArrowRightLeft className="w-5 h-5 text-[#008CEB]" />
            Transfer Dompet
          </h1>
        </div>
        <div className="w-10 h-10" />
      </div>

      {/* Form Card */}
      <div className="premium-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-[#008CEB]/10 flex items-center justify-center">
            <ArrowRightLeft className="w-4 h-4 text-[#008CEB]" />
          </div>
          <span className="text-xs font-heading font-extrabold">Form Transfer</span>
        </div>
        <div className="space-y-3 text-xs">
          {/* From Wallet */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 mb-1 block">Dompet Asal</label>
            <select value={dariWalletId} onChange={(e) => { setDariWalletId(e.target.value); if (e.target.value === keWalletId) setKeWalletId(""); }}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none font-bold appearance-none">
              <option value="">Pilih dompet asal</option>
              {activeWallets.map((w) => (
                <option key={w.id} value={w.id}>Rp{w.saldo.toLocaleString()} &mdash; {w.namaDompet}</option>
              ))}
            </select>
          </div>
          {/* To Wallet */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 mb-1 block">Dompet Tujuan</label>
            <select value={keWalletId} onChange={(e) => setKeWalletId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none font-bold appearance-none">
              <option value="">Pilih dompet tujuan</option>
              {activeWallets
                .filter((w) => w.id !== dariWalletId)
                .map((w) => (
                  <option key={w.id} value={w.id}>Rp{w.saldo.toLocaleString()} &mdash; {w.namaDompet}</option>
                ))}
            </select>
          </div>
          {/* Amount */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 mb-1 block">Nominal (Rp)</label>
            <div className="flex gap-2">
              <input type="number" placeholder="0" value={nominal || ""}
                onChange={(e) => setNominal(Number(e.target.value))}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none font-bold" />
              <button onClick={() => setNominal(selectedFromWallet?.saldo || 0)}
                className="text-[9px] text-[#008CEB] font-bold px-3 py-1 rounded-lg bg-[#008CEB]/10 active:scale-95 transition-transform shrink-0">
                Max
              </button>
            </div>
          </div>
          {/* Reason */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 mb-1 block">Alasan / Catatan</label>
            <input type="text" placeholder="Catatan transfer (opsional)" value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none" />
          </div>
          {/* Errors */}
          {errors.length > 0 && (
            <div className="space-y-1">
              {errors.map((e, i) => (
                <p key={i} className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {e}
                </p>
              ))}
            </div>
          )}
          {/* Submit */}
          <button onClick={handleSubmit} disabled={!isValid || loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#008CEB] to-[#00C9A7] text-white font-bold text-xs active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed">
            <Send className="w-4 h-4" /> {loading ? "Memproses..." : "Transfer"}
          </button>
        </div>
      </div>

      {/* Recent Transfers */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 mb-1">
          <ArrowRightLeft className="w-4 h-4 text-[#008CEB]" />
          <span className="text-xs font-heading font-extrabold">Transfer Terbaru</span>
          <span className="text-[10px] text-slate-400 ml-auto">({mutations.length})</span>
        </div>
        {recentMutations.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs animate-fade-in"><ArrowRightLeft className="w-6 h-6 mx-auto mb-2 opacity-40" />Belum ada transfer dompet.</div>
        ) : (
          recentMutations.map((m) => {
            const dari = walletMap.get(m.dariWalletId);
            const ke = walletMap.get(m.keWalletId);
            return (
              <div key={m.id} className="premium-card p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#008CEB]/10 flex items-center justify-center text-[#008CEB]">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-heading font-bold">
                    {dari?.namaDompet || "?"} &rarr; {ke?.namaDompet || "?"}
                  </p>
                  <p className="text-[9px] text-slate-400">
                    {m.alasan || "Tanpa catatan"}
                    <span className="mx-1">&middot;</span>
                    {new Date(m.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-heading font-extrabold text-[#008CEB]">Rp{m.nominal.toLocaleString()}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
