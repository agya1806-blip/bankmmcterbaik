"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "@/hooks/useLiveQuery";
import { db, type UnitId } from "@/lib/db-v4";
import { TrendingUp, TrendingDown, Wallet, Save, ArrowLeft, Plus, X } from "lucide-react";
import { showToast } from "@/lib/toast";

const BOOK_ID: UnitId = "keluarga";

export default function BukuKeluargaCashflowPage() {
  const router = useRouter();

  const cashflows = useLiveQuery(() => db.cashflows.where("bookOrBranchId").equals(BOOK_ID).reverse().toArray(), []) || [];
  const wallets = useLiveQuery(() => db.wallets.where("bookOrBranchId").equals(BOOK_ID).filter(w => w.isActive).toArray(), []) || [];

  const [showForm, setShowForm] = useState(false);
  const [tipe, setTipe] = useState<"masuk" | "keluar">("masuk");
  const [nominal, setNominal] = useState(0);
  const [catatan, setCatatan] = useState("");
  const [kategori, setKategori] = useState("Umum");
  const [walletId, setWalletId] = useState("");
  const [filterType, setFilterType] = useState<"all" | "masuk" | "keluar">("all");

  const filtered = useMemo(() => {
    if (filterType === "all") return cashflows;
    return cashflows.filter((c) => c.tipe === filterType);
  }, [cashflows, filterType]);

  const stats = useMemo(() => {
    const masuk = cashflows.filter((c) => c.tipe === "masuk").reduce((s, c) => s + c.nominal, 0);
    const keluar = cashflows.filter((c) => c.tipe === "keluar").reduce((s, c) => s + c.nominal, 0);
    return { masuk, keluar, selisih: masuk - keluar };
  }, [cashflows]);

  const resetForm = () => { setTipe("masuk"); setNominal(0); setCatatan(""); setKategori("Umum"); setWalletId(""); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nominal <= 0) return showToast.error("Nominal harus lebih dari 0!");
    if (!catatan.trim()) return showToast.error("Catatan wajib diisi!");

    const selectedWallet = wallets.find(w => w.id === walletId);
    const saldoSebelum = selectedWallet?.saldo ?? 0;
    const saldoSesudah = tipe === "masuk" ? saldoSebelum + nominal : saldoSebelum - nominal;

    await db.cashflows.add({
      id: crypto.randomUUID(),
      bookOrBranchId: BOOK_ID,
      unitId: BOOK_ID,
      tipe, kategori, nominal, saldoSebelum, saldoSesudah,
      walletId: walletId || "",
      walletNama: selectedWallet?.namaDompet ?? "",
      referensiId: "",
      referensiTipe: "adjustment",
      catatan: catatan.trim(),
      createdAt: new Date().toISOString(),
    });

    if (walletId && selectedWallet) {
      await db.wallets.update(walletId, { saldo: saldoSesudah });
    }

    resetForm();
    setShowForm(false);
  };

  return (
    <div className="flex flex-col gap-4 pt-2 pb-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <button onClick={() => router.push("/buku-keluarga")} className="p-2 bg-white dark:bg-[#131527] rounded-full shadow-md active:scale-95 transition-transform">
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </button>
        <h1 className="text-lg font-heading font-extrabold tracking-tight">Cashflow Keluarga</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="p-2 bg-gradient-to-r from-rose-400 to-pink-500 text-white rounded-full shadow-md active:scale-95 transition-transform">
          {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </button>
      </div>

      {showForm && (
        <div className="premium-card p-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="w-4 h-4 text-rose-500" />
            <span className="text-xs font-heading font-extrabold">Catat Cashflow</span>
          </div>
          <form onSubmit={handleSave} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setTipe("masuk")}
                className={`py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${tipe === "masuk" ? "bg-emerald-500 text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-400"}`}>
                <TrendingUp className="w-4 h-4" /> Pemasukan
              </button>
              <button type="button" onClick={() => setTipe("keluar")}
                className={`py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${tipe === "keluar" ? "bg-rose-500 text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-400"}`}>
                <TrendingDown className="w-4 h-4" /> Pengeluaran
              </button>
            </div>
            <div>
              <label className="block mb-1 font-bold text-slate-400">Nominal (Rp)</label>
              <input type="number" value={nominal || ""} onChange={(e) => setNominal(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none text-sm font-bold" required />
            </div>
            <div>
              <label className="block mb-1 font-bold text-slate-400">Kategori</label>
              <select value={kategori} onChange={(e) => setKategori(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none font-bold">
                {["Umum", "Makanan", "Transport", "Belanja", "Tagihan", "Sekolah", "Kesehatan", "Lainnya"].map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 font-bold text-slate-400">Dompet</label>
              <select value={walletId} onChange={(e) => setWalletId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none font-bold">
                <option value="">Pilih dompet...</option>
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>{w.namaDompet} (Rp{w.saldo.toLocaleString()})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 font-bold text-slate-400">Catatan</label>
              <input type="text" value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Contoh: Belanja bulanan, Uang jajan..." className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none" required />
            </div>
            <button type="submit" className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-400 to-pink-500 text-white font-extrabold text-xs shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2">
              <Save className="w-4 h-4" /> Simpan
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2.5">
        {[
          { label: "Masuk", value: stats.masuk, color: "emerald", iconNode: <TrendingUp className="w-5 h-5" /> },
          { label: "Keluar", value: stats.keluar, color: "rose", iconNode: <TrendingDown className="w-5 h-5" /> },
          { label: "Selisih", value: stats.selisih, color: stats.selisih >= 0 ? "indigo" : "rose", iconNode: <Wallet className="w-5 h-5" /> },
        ].map((s, i) => (
          <div key={s.label} className="premium-card premium-card-glow p-3 text-center space-y-1.5 animate-slide-up" style={{ animationDelay: `${i * 80}ms`, animationFillMode: "backwards" }}>
            <div className={`w-7 h-7 rounded-lg bg-${s.color}-100 dark:bg-${s.color}-900/30 flex items-center justify-center mx-auto`}>{s.iconNode}</div>
            <span className="text-[9px] font-heading font-bold text-slate-400 block uppercase tracking-wider">{s.label}</span>
            <p className={`text-[11px] font-heading font-extrabold text-${s.color}-600 dark:text-${s.color}-400`}>Rp{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1">
        {(["all", "masuk", "keluar"] as const).map((f) => (
          <button key={f} onClick={() => setFilterType(f)}
            className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold transition-all ${filterType === f ? "bg-black text-white dark:bg-white dark:text-black" : "bg-slate-100 dark:bg-zinc-800 text-slate-400"}`}>
            {f === "all" ? "Semua" : f === "masuk" ? "Pemasukan" : "Pengeluaran"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 max-h-[350px] pr-1">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">{cashflows.length === 0 ? "Belum ada cashflow. Tap + untuk menambah." : "Tidak ada data."}</div>
        ) : (
          filtered.map((cf, i) => {
            const tanggal = cf.createdAt ? new Date(cf.createdAt) : new Date();
            return (
              <div key={cf.id} className="premium-card premium-card-glow p-3 flex items-center justify-between animate-slide-up" style={{ animationDelay: `${i * 50}ms`, animationFillMode: "backwards" }}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${cf.tipe === "masuk" ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-rose-50 dark:bg-rose-950/30"}`}>
                    {cf.tipe === "masuk" ? <TrendingUp className="w-5 h-5 text-emerald-500" /> : <TrendingDown className="w-5 h-5 text-rose-500" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-heading font-extrabold line-clamp-1">{cf.catatan}</h4>
                    <p className="text-[9px] text-slate-400 font-medium">
                      {tanggal.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-heading font-extrabold tabular-nums ${cf.tipe === "masuk" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                  {cf.tipe === "masuk" ? "+" : "-"}Rp{cf.nominal.toLocaleString()}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
