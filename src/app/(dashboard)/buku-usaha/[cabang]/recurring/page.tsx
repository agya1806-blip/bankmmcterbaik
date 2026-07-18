"use client";
import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, BRANCH_MAP, BRANCH_LABELS, type UnitId, type RecurringFrequency } from "@/lib/db-v4";
import { useLiveQuery } from "@/hooks/useLiveQuery";
import { ArrowLeft, Plus, Search, ToggleLeft, ToggleRight, Trash2, Pencil, Calendar, Repeat, Wallet } from "lucide-react";
import { showToast } from "@/lib/toast";

const FREQ_LABELS: Record<RecurringFrequency, string> = {
  daily: "Setiap Hari",
  weekly: "Setiap Minggu",
  monthly: "Setiap Bulan",
  yearly: "Setiap Tahun",
};

interface FormData {
  nama: string;
  tipe: "pemasukan" | "pengeluaran";
  jumlah: number;
  kategori: string;
  catatan: string;
  frequency: RecurringFrequency;
  dayOfWeek: number;
  dayOfMonth: number;
  startDate: string;
  endDate: string;
  walletId: string;
}

const emptyForm: FormData = {
  nama: "",
  tipe: "pemasukan",
  jumlah: 0,
  kategori: "",
  catatan: "",
  frequency: "monthly",
  dayOfWeek: 0,
  dayOfMonth: 1,
  startDate: new Date().toISOString().slice(0, 10),
  endDate: "",
  walletId: "",
};

export default function RecurringPage() {
  const params = useParams();
  const router = useRouter();
  const cabangSlug = (params?.cabang as string) || "";
  const bookOrBranchId = BRANCH_MAP[cabangSlug] || "usaha-warkop";

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const templates = useLiveQuery(
    () => db.recurringTemplates.where("bookOrBranchId").equals(bookOrBranchId).toArray(),
    [bookOrBranchId]
  ) || [];

  const wallets = useLiveQuery(
    () => db.wallets.where("bookOrBranchId").equals(bookOrBranchId).toArray(),
    [bookOrBranchId]
  ) || [];

  const filtered = useMemo(() => {
    if (!search) return templates;
    const q = search.toLowerCase();
    return templates.filter(t =>
      t.nama.toLowerCase().includes(q) ||
      t.kategori.toLowerCase().includes(q) ||
      t.tipe.toLowerCase().includes(q)
    );
  }, [templates, search]);

  function openCreate() {
    setEditId(null);
    setForm({
      ...emptyForm,
      walletId: wallets[0]?.id || "",
      startDate: new Date().toISOString().slice(0, 10),
    });
    setShowModal(true);
  }

  function openEdit(tmpl: typeof templates[0]) {
    setEditId(tmpl.id);
    setForm({
      nama: tmpl.nama,
      tipe: tmpl.tipe,
      jumlah: tmpl.jumlah,
      kategori: tmpl.kategori,
      catatan: tmpl.catatan,
      frequency: tmpl.frequency,
      dayOfWeek: tmpl.dayOfWeek ?? 0,
      dayOfMonth: tmpl.dayOfMonth ?? 1,
      startDate: tmpl.startDate.slice(0, 10),
      endDate: tmpl.endDate ? tmpl.endDate.slice(0, 10) : "",
      walletId: tmpl.walletId,
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.nama.trim()) { showToast.error("Nama wajib diisi"); return; }
    if (form.jumlah <= 0) { showToast.error("Jumlah harus > 0"); return; }
    if (!form.walletId) { showToast.error("Pilih dompet"); return; }

    const payload = {
      bookOrBranchId,
      unitId: bookOrBranchId,
      nama: form.nama.trim(),
      tipe: form.tipe,
      jumlah: form.jumlah,
      kategori: form.kategori,
      catatan: form.catatan,
      frequency: form.frequency,
      dayOfWeek: form.frequency === "weekly" ? form.dayOfWeek : undefined,
      dayOfMonth: form.frequency === "monthly" || form.frequency === "yearly" ? form.dayOfMonth : undefined,
      startDate: form.startDate,
      endDate: form.endDate || undefined,
      walletId: form.walletId,
    };

    try {
      if (editId) {
        await db.recurringTemplates.update(editId, payload);
        showToast.success("Template diperbarui");
      } else {
        await db.recurringTemplates.add({
          ...payload,
          id: crypto.randomUUID(),
          isActive: true,
          lastGenerated: "",
          createdAt: new Date().toISOString(),
        });
        showToast.success("Template dibuat");
      }
      setShowModal(false);
    } catch (e: any) {
      showToast.error(e?.message || "Gagal menyimpan");
    }
  }

  async function handleToggle(tmpl: typeof templates[0]) {
    await db.recurringTemplates.update(tmpl.id, { isActive: !tmpl.isActive });
    showToast.success(tmpl.isActive ? "Dinonaktifkan" : "Diaktifkan");
  }

  async function handleDelete(id: string) {
    await db.recurringTemplates.delete(id);
    setDeleteConfirm(null);
    showToast.success("Template dihapus");
  }

  return (
    <div className="flex flex-col gap-4 pt-2 pb-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push(`/buku-usaha/${cabangSlug}`)} className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center scale-press">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-heading font-extrabold tracking-tight">Transaksi Berulang</h1>
            <p className="text-[10px] text-slate-400 font-bold">{BRANCH_LABELS[cabangSlug] || cabangSlug}</p>
          </div>
        </div>
        <button onClick={openCreate} className="premium-btn text-xs flex items-center gap-1.5 px-4 py-2.5">
          <Plus className="w-4 h-4" /> Baru
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Cari template..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 text-xs rounded-2xl bg-slate-100 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-[#008CEB]/30 transition-all font-medium"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="premium-card p-8 text-center text-slate-400 text-sm">
          {search ? "Tidak ditemukan" : "Belum ada template. Klik Baru untuk membuat."}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((tmpl) => (
            <div key={tmpl.id} className="premium-card p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tmpl.tipe === "pemasukan" ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-rose-100 dark:bg-rose-900/30"}`}>
                <Repeat className={`w-5 h-5 ${tmpl.tipe === "pemasukan" ? "text-emerald-600" : "text-rose-600"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-heading font-bold line-clamp-1">{tmpl.nama}</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${tmpl.isActive ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>
                    {tmpl.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-[10px] text-slate-400 font-medium">
                  <span>Rp{tmpl.jumlah.toLocaleString()}</span>
                  <span>{FREQ_LABELS[tmpl.frequency]}</span>
                  {tmpl.kategori && <span className="truncate">{tmpl.kategori}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => handleToggle(tmpl)} className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-all">
                  {tmpl.isActive ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                </button>
                <button onClick={() => openEdit(tmpl)} className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-all">
                  <Pencil className="w-4 h-4 text-slate-500" />
                </button>
                {deleteConfirm === tmpl.id ? (
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleDelete(tmpl.id)} className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center transition-all">
                      <Trash2 className="w-4 h-4 text-rose-500" />
                    </button>
                    <button onClick={() => setDeleteConfirm(null)} className="text-[9px] font-bold text-slate-400 px-1">Batal</button>
                  </div>
                ) : (
                  <button onClick={() => setDeleteConfirm(tmpl.id)} className="w-8 h-8 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center justify-center transition-all">
                    <Trash2 className="w-4 h-4 text-slate-400 hover:text-rose-500" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="w-full sm:max-w-lg bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-2xl p-5 max-h-[85vh] overflow-y-auto animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-heading font-extrabold mb-4">{editId ? "Edit Template" : "Template Baru"}</h2>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Nama</label>
                <input type="text" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} className="w-full px-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-[#008CEB]/30 font-medium" placeholder="Nama template" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Tipe</label>
                <div className="flex gap-2">
                  {(["pemasukan", "pengeluaran"] as const).map((t) => (
                    <button key={t} onClick={() => setForm({ ...form, tipe: t })} className={`flex-1 py-2.5 text-xs font-bold rounded-xl border-2 transition-all ${form.tipe === t ? (t === "pemasukan" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" : "border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-600") : "border-transparent bg-slate-50 dark:bg-slate-800 text-slate-400"}`}>
                      {t === "pemasukan" ? "Pemasukan" : "Pengeluaran"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Jumlah (Rp)</label>
                <input type="number" value={form.jumlah || ""} onChange={(e) => setForm({ ...form, jumlah: Number(e.target.value) })} className="w-full px-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-[#008CEB]/30 font-medium" min="0" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Kategori</label>
                <input type="text" value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })} className="w-full px-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-[#008CEB]/30 font-medium" placeholder="Contoh: Listrik, Internet, dll" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Frekuensi</label>
                <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value as RecurringFrequency })} className="w-full px-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-[#008CEB]/30 font-medium">
                  <option value="daily">Setiap Hari</option>
                  <option value="weekly">Setiap Minggu</option>
                  <option value="monthly">Setiap Bulan</option>
                  <option value="yearly">Setiap Tahun</option>
                </select>
              </div>

              {form.frequency === "weekly" && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Hari</label>
                  <select value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: Number(e.target.value) })} className="w-full px-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-[#008CEB]/30 font-medium">
                    {["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].map((day, i) => (
                      <option key={i} value={i}>{day}</option>
                    ))}
                  </select>
                </div>
              )}

              {(form.frequency === "monthly" || form.frequency === "yearly") && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Tanggal</label>
                  <input type="number" value={form.dayOfMonth} onChange={(e) => setForm({ ...form, dayOfMonth: Math.min(31, Math.max(1, Number(e.target.value))) })} className="w-full px-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-[#008CEB]/30 font-medium" min="1" max="31" />
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Dompet</label>
                <select value={form.walletId} onChange={(e) => setForm({ ...form, walletId: e.target.value })} className="w-full px-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-[#008CEB]/30 font-medium">
                  <option value="">Pilih dompet</option>
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>{w.namaDompet} (Rp{w.saldo.toLocaleString()})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Mulai</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full px-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-[#008CEB]/30 font-medium" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Selesai (opsional)</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full px-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-[#008CEB]/30 font-medium" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Catatan</label>
                <textarea value={form.catatan} onChange={(e) => setForm({ ...form, catatan: e.target.value })} className="w-full px-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border-0 outline-none focus:ring-2 focus:ring-[#008CEB]/30 font-medium resize-none" rows={2} placeholder="Opsional" />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">Batal</button>
              <button onClick={handleSave} className="flex-1 premium-btn text-xs py-2.5">{editId ? "Simpan" : "Buat Template"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
