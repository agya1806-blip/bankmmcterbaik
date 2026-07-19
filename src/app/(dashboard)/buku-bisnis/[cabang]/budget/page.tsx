"use client";
import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, BRANCH_MAP, BRANCH_LABELS, type UnitId } from "@/lib/db-v4";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, Plus, Search, Trash2, Pencil, TrendingDown, AlertTriangle, CheckCircle2, X, Save } from "lucide-react";
import { showToast } from "@/lib/toast";

function getMonths(back: number): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = back; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toISOString().slice(0, 7));
  }
  return months;
}

export default function BudgetPage() {
  const params = useParams();
  const router = useRouter();
  const cabangSlug = (params?.cabang as string) || "";
  const bookOrBranchId: UnitId = BRANCH_MAP[cabangSlug] || "usaha-warkop";

  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedPeriod, setSelectedPeriod] = useState(currentMonth);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formKategori, setFormKategori] = useState("");
  const [formJumlah, setFormJumlah] = useState(0);

  const cashflows = useLiveQuery(() => db.cashflows.where("bookOrBranchId").equals(bookOrBranchId).toArray(), [bookOrBranchId]) || [];
  const budgets = useLiveQuery(() => db.budgets.where({ bookOrBranchId, periode: selectedPeriod }).toArray(), [bookOrBranchId, selectedPeriod]) || [];

  const expenseCategories = useMemo(() => {
    const cats = new Set<string>();
    for (const cf of cashflows) {
      if (cf.tipe === "keluar") cats.add(cf.kategori);
    }
    return Array.from(cats).sort();
  }, [cashflows]);

  const existingCategories = useMemo(() => new Set(budgets.map(b => b.kategori)), [budgets]);
  const availableCategories = useMemo(() => expenseCategories.filter(c => !existingCategories.has(c)), [expenseCategories, existingCategories]);

  const actualSpending = useMemo(() => {
    const map = new Map<string, number>();
    for (const cf of cashflows) {
      if (cf.tipe === "keluar" && cf.createdAt.startsWith(selectedPeriod)) {
        map.set(cf.kategori, (map.get(cf.kategori) || 0) + cf.nominal);
      }
    }
    return map;
  }, [cashflows, selectedPeriod]);

  const totalBudget = budgets.reduce((s, b) => s + b.jumlah, 0);
  const totalActual = budgets.reduce((s, b) => s + (actualSpending.get(b.kategori) || 0), 0);

  const months = useMemo(() => getMonths(11), []);

  const openAdd = () => {
    setEditId(null);
    setFormKategori(availableCategories[0] || "");
    setFormJumlah(0);
    setShowModal(true);
  };

  const openEdit = (b: typeof budgets[0]) => {
    setEditId(b.id);
    setFormKategori(b.kategori);
    setFormJumlah(b.jumlah);
    setShowModal(true);
  };

  const resetModal = () => {
    setShowModal(false);
    setEditId(null);
    setFormKategori("");
    setFormJumlah(0);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formJumlah <= 0) return showToast.error("Jumlah harus lebih dari 0!");

    if (editId) {
      await db.budgets.update(editId, { jumlah: formJumlah });
      showToast.success("Budget diupdate");
    } else {
      if (!formKategori) return showToast.error("Pilih kategori!");
      await db.budgets.add({
        id: crypto.randomUUID(),
        bookOrBranchId,
        unitId: bookOrBranchId,
        kategori: formKategori,
        jumlah: formJumlah,
        periode: selectedPeriod,
        createdAt: new Date().toISOString(),
      });
      showToast.success("Budget ditambahkan");
    }
    resetModal();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus budget ini?")) return;
    await db.budgets.delete(id);
    showToast.success("Budget dihapus");
  };

  return (
    <div className="flex flex-col gap-4 pt-2 pb-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <button onClick={() => router.push(`/buku-bisnis/${cabangSlug}`)} className="p-2 bg-white dark:bg-[#131527] rounded-full shadow-md active:scale-95 transition-transform">
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </button>
        <h1 className="text-lg font-heading font-extrabold tracking-tight">Anggaran</h1>
        <button onClick={openAdd} disabled={availableCategories.length === 0}
          className="p-2 bg-gradient-to-r from-[#008CEB] to-[#00C9A7] text-white rounded-full shadow-md active:scale-95 transition-transform disabled:opacity-40">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="premium-card p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/5 dark:to-teal-500/5">
        <div className="flex items-center gap-2 mb-1">
          <TrendingDown className="w-4 h-4 text-emerald-500" />
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ringkasan Anggaran</span>
        </div>
        <div className="flex items-end justify-between mt-1">
          <div>
            <p className="text-[9px] text-slate-400 font-bold">Total Budget</p>
            <p className="text-lg font-heading font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">Rp{totalBudget.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-slate-400 font-bold">Total Realisasi</p>
            <p className="text-lg font-heading font-extrabold text-slate-700 dark:text-slate-300 tracking-tight">Rp{totalActual.toLocaleString()}</p>
          </div>
        </div>
        {totalBudget > 0 && (
          <div className="mt-2">
            <div className="w-full h-2 bg-slate-100 dark:bg-[#0B0C16] rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${(totalActual / totalBudget) * 100 < 80 ? "bg-emerald-500" : (totalActual / totalBudget) * 100 < 100 ? "bg-amber-500" : "bg-rose-500"}`}
                style={{ width: `${Math.min(100, (totalActual / totalBudget) * 100)}%` }} />
            </div>
            <div className="flex justify-between mt-1 text-[9px] text-slate-400 font-bold">
              <span>{((totalActual / totalBudget) * 100).toFixed(0)}% terpakai</span>
              <span>Sisa Rp{(totalBudget - totalActual).toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {months.map((m) => {
          const active = m === selectedPeriod;
          const d = new Date(m + "-01");
          const label = d.toLocaleDateString("id-ID", { month: "short", year: "numeric" });
          return (
            <button key={m} onClick={() => setSelectedPeriod(m)}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${active ? "bg-black text-white dark:bg-white dark:text-black" : "bg-slate-100 dark:bg-zinc-800 text-slate-400"}`}>
              {label}
            </button>
          );
        })}
      </div>

      {budgets.length === 0 && (
        <div className="text-center py-12 text-slate-400 text-xs animate-fade-in">
          <TrendingDown className="w-8 h-8 mx-auto mb-2 opacity-40" />
          Belum ada anggaran. Tap + untuk menambah.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {budgets.map((b) => {
          const actual = actualSpending.get(b.kategori) || 0;
          const remaining = b.jumlah - actual;
          const pct = b.jumlah > 0 ? Math.min(100, (actual / b.jumlah) * 100) : 0;
          const color = pct < 80 ? "emerald" : pct < 100 ? "amber" : "rose";

          return (
            <div key={b.id} className="bg-white dark:bg-[#1a1b2e] rounded-xl p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{b.kategori}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(b)}><Pencil className="w-4 h-4 text-slate-400" /></button>
                  <button onClick={() => handleDelete(b.id)}><Trash2 className="w-4 h-4 text-rose-400" /></button>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Budget: Rp {b.jumlah.toLocaleString()}</span>
                <span>Realisasi: Rp {actual.toLocaleString()}</span>
                <span>Sisa: Rp {remaining.toLocaleString()}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-[#0B0C16] rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${color === "emerald" ? "bg-emerald-500" : color === "amber" ? "bg-amber-500" : "bg-rose-500"}`}
                  style={{ width: `${pct}%` }} />
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold flex items-center gap-1 ${color === "emerald" ? "text-emerald-500" : color === "amber" ? "text-amber-500" : "text-rose-500"}`}>
                  {color === "emerald" ? <CheckCircle2 className="w-3 h-3" /> : color === "amber" ? <AlertTriangle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                  {color === "emerald" ? "On Track" : color === "amber" ? "Hati-hati" : "Over Budget"}
                </span>
                <span className="text-[10px] text-slate-400">{pct.toFixed(0)}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={resetModal}>
          <div className="bg-white dark:bg-[#1a1b2e] rounded-2xl p-5 w-[90%] max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-heading font-extrabold">{editId ? "Edit Anggaran" : "Tambah Anggaran"}</h3>
                <button type="button" onClick={resetModal} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {!editId && (
                <div>
                  <label className="block mb-1 text-[11px] font-bold text-slate-400">Kategori</label>
                  <select value={formKategori} onChange={(e) => setFormKategori(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none text-sm font-bold" required>
                    <option value="">Pilih kategori</option>
                    {availableCategories.map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block mb-1 text-[11px] font-bold text-slate-400">Jumlah (Rp)</label>
                <input type="number" value={formJumlah || ""} onChange={(e) => setFormJumlah(Number(e.target.value))} className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none text-sm font-bold" required min={1} />
              </div>
              <div className="text-[10px] text-slate-400 font-bold">
                Periode: {new Date(selectedPeriod + "-01").toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
              </div>
              <button type="submit" className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#008CEB] to-[#00C9A7] text-white font-extrabold text-xs shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> {editId ? "Update" : "Simpan"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
