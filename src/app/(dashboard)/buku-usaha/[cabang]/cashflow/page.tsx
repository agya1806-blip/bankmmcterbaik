"use client";

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLiveQuery } from "@/hooks/useLiveQuery";
import { db, type BookOrBranch, type Cashflow } from "@/lib/db-v4";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, TrendingUp, TrendingDown, Wallet, X, Save } from "lucide-react";

const BRANCH_MAP: Record<string, BookOrBranch> = {
  pribadi: "pribadi",
  keluarga: "keluarga",
  percetakan: "usaha-percetakan",
  laptop: "usaha-laptop",
  gadget: "usaha-gadget",
  warkop: "usaha-warkop",
  konveksi: "usaha-konveksi",
};

export default function CashflowPage() {
  const params = useParams();
  const router = useRouter();
  const cabangSlug = (params?.cabang as string) || "";
  const bookOrBranchId: BookOrBranch = BRANCH_MAP[cabangSlug] || "usaha-warkop";

  const cashflows =
    useLiveQuery(
      () => db.cashflows.where("bookOrBranchId").equals(bookOrBranchId).reverse().toArray(),
      [bookOrBranchId]
    ) || [];

  const [showModal, setShowModal] = useState(false);
  const [tipe, setTipe] = useState<"masuk" | "keluar">("masuk");
  const [nominal, setNominal] = useState(0);
  const [catatan, setCatatan] = useState("");
  const [kategori, setKategori] = useState("Umum");
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nominal <= 0) return alert("Nominal harus lebih dari 0!");
    if (!catatan.trim()) return alert("Catatan wajib diisi!");

    await db.cashflows.add({
      id: crypto.randomUUID(),
      bookOrBranchId,
      tipe,
      kategori,
      nominal,
      saldoSebelum: 0,
      saldoSesudah: 0,
      walletId: "",
      walletNama: "",
      referensiId: "",
      referensiTipe: "adjustment",
      catatan: catatan.trim(),
      createdAt: new Date().toISOString(),
    });

    setShowModal(false);
    setNominal(0);
    setCatatan("");
  };

  return (
    <div className="flex-1 flex flex-col pt-4 space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push(`/buku-usaha/${cabangSlug}`)}
          className="p-2 bg-white dark:bg-[#131527] rounded-full shadow-md"
        >
          <span className="text-sm">◀️</span>
        </button>
        <h1 className="text-lg font-extrabold tracking-tight">Cashflow</h1>
        <button
          onClick={() => setShowModal(true)}
          className="p-2 bg-gradient-to-r from-[#008CEB] to-[#00C9A7] text-white rounded-full shadow-md"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {[
          { label: "Masuk", value: stats.masuk, color: "emerald", iconNode: <TrendingUp className="w-5 h-5" /> },
          { label: "Keluar", value: stats.keluar, color: "rose", iconNode: <TrendingDown className="w-5 h-5" /> },
          { label: "Selisih", value: stats.selisih, color: stats.selisih >= 0 ? "indigo" : "rose", iconNode: <Wallet className="w-5 h-5" /> },
        ].map((s, i) => {
          return (
            <div key={s.label} className="premium-card premium-card-glow p-3 text-center space-y-1.5 animate-slide-up" style={{ animationDelay: `${i * 80}ms`, animationFillMode: "backwards" }}>
              <div className={`w-7 h-7 rounded-lg bg-${s.color}-100 dark:bg-${s.color}-900/30 flex items-center justify-center mx-auto`}>
                {s.iconNode}
              </div>
              <span className="text-[9px] font-heading font-bold text-slate-400 block uppercase tracking-wider">{s.label}</span>
              <p className={`text-[11px] font-heading font-extrabold text-${s.color}-600 dark:text-${s.color}-400`}>
                Rp{s.value.toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex gap-1">
        {(["all", "masuk", "keluar"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilterType(f)}
            className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
              filterType === f
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "bg-slate-100 dark:bg-zinc-800 text-slate-400"
            }`}
          >
            {f === "all" ? "Semua" : f === "masuk" ? "Pemasukan" : "Pengeluaran"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 max-h-[350px] pr-1">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            {cashflows.length === 0 ? "Belum ada cashflow. Tap + untuk menambah." : "Tidak ada data."}
          </div>
        ) : (
          filtered.map((cf, i) => {
            const tanggal = cf.createdAt ? new Date(cf.createdAt) : new Date();
            return (
              <div key={cf.id} className="premium-card premium-card-glow p-3 flex items-center justify-between animate-slide-up" style={{ animationDelay: `${i * 50}ms`, animationFillMode: "backwards" }}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    cf.tipe === "masuk" ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-rose-50 dark:bg-rose-950/30"
                  }`}>
                    {cf.tipe === "masuk" ? (
                      <span className="text-emerald-500"><TrendingUp className="w-5 h-5" /></span>
                    ) : (
                      <span className="text-rose-500"><TrendingDown className="w-5 h-5" /></span>
                    )}
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

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center backdrop-blur-sm">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="w-full max-w-md bg-white dark:bg-[#131527] rounded-t-[32px] p-5 pb-8 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-extrabold">Tambah Cashflow</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded-full bg-slate-100 dark:bg-zinc-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipe("masuk")}
                    className={`py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                      tipe === "masuk"
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-100 dark:bg-zinc-800 text-slate-400"
                    }`}
                  >
                    <TrendingUp className="w-5 h-5" /> Pemasukan
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipe("keluar")}
                    className={`py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                      tipe === "keluar"
                        ? "bg-rose-500 text-white"
                        : "bg-slate-100 dark:bg-zinc-800 text-slate-400"
                    }`}
                  >
                    <TrendingDown className="w-5 h-5" /> Pengeluaran
                  </button>
                </div>

                <div>
                  <label className="block mb-1 font-bold text-slate-400">Nominal (Rp)</label>
                  <input
                    type="number"
                    value={nominal || ""}
                    onChange={(e) => setNominal(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none text-sm font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 font-bold text-slate-400">Kategori</label>
                  <select
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none font-bold"
                  >
                    {["Umum", "Operasional", "Gaji", "Sewa", "Listrik", "Bahan Baku", "Lainnya"].map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 font-bold text-slate-400">Catatan</label>
                  <input
                    type="text"
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    placeholder="Contoh: Beli bahan baku, Bayar listrik..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#008CEB] to-[#00C9A7] text-white font-extrabold text-xs shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Simpan
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
