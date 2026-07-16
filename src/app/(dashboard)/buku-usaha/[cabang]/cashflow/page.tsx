"use client";

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type BookOrBranch, type Cashflow } from "@/lib/db-v4";
import {
  ArrowLeft, Plus, TrendingUp, TrendingDown, Wallet,
  X, Save,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const BRANCH_MAP: Record<string, BookOrBranch> = {
  percetakan: "usaha-percetakan",
  laptop: "usaha-laptop",
  gadget: "usaha-gadget",
  warkop: "usaha-warkop",
  kelontong: "usaha-kelontong",
  konveksi: "usaha-konveksi",
  "toko-pakaian": "usaha-toko-pakaian",
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
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-extrabold tracking-tight">Cashflow</h1>
        <button
          onClick={() => setShowModal(true)}
          className="p-2 bg-gradient-to-r from-[#7B61FF] to-[#FF5C00] text-white rounded-full shadow-md"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="premium-card p-3 text-center space-y-1">
          <TrendingUp className="w-4 h-4 text-emerald-500 mx-auto" />
          <span className="text-[9px] font-bold text-slate-400 block">Masuk</span>
          <p className="text-[11px] font-extrabold text-emerald-600">
            Rp{stats.masuk.toLocaleString()}
          </p>
        </div>
        <div className="premium-card p-3 text-center space-y-1">
          <TrendingDown className="w-4 h-4 text-rose-500 mx-auto" />
          <span className="text-[9px] font-bold text-slate-400 block">Keluar</span>
          <p className="text-[11px] font-extrabold text-rose-600">
            Rp{stats.keluar.toLocaleString()}
          </p>
        </div>
        <div className="premium-card p-3 text-center space-y-1">
          <Wallet className="w-4 h-4 text-[#7B61FF] mx-auto" />
          <span className="text-[9px] font-bold text-slate-400 block">Selisih</span>
          <p className={`text-[11px] font-extrabold ${stats.selisih >= 0 ? "text-[#7B61FF]" : "text-rose-600"}`}>
            Rp{stats.selisih.toLocaleString()}
          </p>
        </div>
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
          filtered.map((cf) => {
            const tanggal = cf.createdAt ? new Date(cf.createdAt) : new Date();
            return (
              <div key={cf.id} className="premium-card p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    cf.tipe === "masuk" ? "bg-emerald-50" : "bg-rose-50"
                  }`}>
                    {cf.tipe === "masuk" ? (
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-rose-500" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold line-clamp-1">{cf.catatan}</h4>
                    <p className="text-[9px] text-slate-400">
                      {tanggal.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-extrabold ${cf.tipe === "masuk" ? "text-emerald-600" : "text-rose-600"}`}>
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
                    <TrendingUp className="w-4 h-4" /> Pemasukan
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
                    <TrendingDown className="w-4 h-4" /> Pengeluaran
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
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#7B61FF] to-[#FF5C00] text-white font-extrabold text-xs shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
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
