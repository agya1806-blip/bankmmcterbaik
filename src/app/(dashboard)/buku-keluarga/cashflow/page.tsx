"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "@/hooks/useLiveQuery";
import { db, type UnitId, type DbCashflow } from "@/lib/db-v4";
import { TrendingUp, TrendingDown, Wallet, Save, ArrowLeft, Plus, X, Pencil, Trash2 } from "lucide-react";
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
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [editingCashflow, setEditingCashflow] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = cashflows;
    if (filterType !== "all") items = items.filter((c) => c.tipe === filterType);
    if (dateFrom || dateTo) {
      items = items.filter((item) => {
        const tgl = item.createdAt?.substring(0, 10) || "";
        if (dateFrom && tgl < dateFrom) return false;
        if (dateTo && tgl > dateTo) return false;
        return true;
      });
    }
    return items;
  }, [cashflows, filterType, dateFrom, dateTo]);

  const stats = useMemo(() => {
    const masuk = cashflows.filter((c) => c.tipe === "masuk").reduce((s, c) => s + c.nominal, 0);
    const keluar = cashflows.filter((c) => c.tipe === "keluar").reduce((s, c) => s + c.nominal, 0);
    return { masuk, keluar, selisih: masuk - keluar };
  }, [cashflows]);

  const totalPemasukan = filtered.filter(i => i.tipe === "masuk").reduce((s, i) => s + i.nominal, 0);
  const totalPengeluaran = filtered.filter(i => i.tipe === "keluar").reduce((s, i) => s + i.nominal, 0);
  const neto = totalPemasukan - totalPengeluaran;

  const resetForm = () => { setTipe("masuk"); setNominal(0); setCatatan(""); setKategori("Umum"); setWalletId(""); setEditingCashflow(null); };

  const handleEdit = (cf: DbCashflow) => {
    setEditingCashflow(cf.id);
    setTipe(cf.tipe);
    setNominal(cf.nominal);
    setCatatan(cf.catatan);
    setKategori(cf.kategori);
    setWalletId(cf.walletId);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus cashflow ini?")) return;
    await db.cashflows.delete(id);
    showToast.success("Cashflow dihapus");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nominal <= 0) return showToast.error("Nominal harus lebih dari 0!");
    if (!catatan.trim()) return showToast.error("Catatan wajib diisi!");

    const selectedWallet = wallets.find(w => w.id === walletId);
    const saldoSebelum = selectedWallet?.saldo ?? 0;
    const saldoSesudah = tipe === "masuk" ? saldoSebelum + nominal : saldoSebelum - nominal;

    if (editingCashflow) {
      await db.cashflows.update(editingCashflow, {
        tipe, kategori, nominal, saldoSebelum, saldoSesudah,
        walletId: walletId || "",
        walletNama: selectedWallet?.namaDompet ?? "",
        catatan: catatan.trim(),
      });
    } else {
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
    }

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
            <span className="text-xs font-heading font-extrabold">{editingCashflow ? "Edit Cashflow" : "Catat Cashflow"}</span>
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
              <Save className="w-4 h-4" /> {editingCashflow ? "Update" : "Simpan"}
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

      <div className="flex gap-2">
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
          className="flex-1 input-premium text-[10px]" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
          className="flex-1 input-premium text-[10px]" />
        {(dateFrom || dateTo) && (
          <button onClick={() => { setDateFrom(""); setDateTo(""); }}
            className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-zinc-800 text-[10px] font-bold">
            Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="premium-card p-2 text-center">
          <p className="text-[8px] text-slate-400 font-bold">Pemasukan</p>
          <p className="text-xs font-bold text-emerald-500">Rp{totalPemasukan.toLocaleString()}</p>
        </div>
        <div className="premium-card p-2 text-center">
          <p className="text-[8px] text-slate-400 font-bold">Pengeluaran</p>
          <p className="text-xs font-bold text-rose-500">Rp{totalPengeluaran.toLocaleString()}</p>
        </div>
        <div className="premium-card p-2 text-center">
          <p className="text-[8px] text-slate-400 font-bold">Neto</p>
          <p className={`text-xs font-bold ${neto >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            Rp{neto.toLocaleString()}
          </p>
        </div>
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
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-heading font-extrabold tabular-nums ${cf.tipe === "masuk" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                    {cf.tipe === "masuk" ? "+" : "-"}Rp{cf.nominal.toLocaleString()}
                  </span>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(cf)} className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors">
                      <Pencil className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                    <button onClick={() => handleDelete(cf.id)} className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                      <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
