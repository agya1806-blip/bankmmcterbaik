"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLiveQuery } from "@/hooks/useLiveQuery";
import { db, type UnitId } from "@/lib/db-v4";
import { ArrowLeft, Wallet, Save, Pencil, Trash2, DollarSign, Landmark, Smartphone } from "lucide-react";

const BRANCH_MAP: Record<string, UnitId> = {
  pribadi: "pribadi", keluarga: "keluarga",
  percetakan: "usaha-percetakan", laptop: "usaha-laptop", gadget: "usaha-gadget",
  warkop: "usaha-warkop", konveksi: "usaha-konveksi", kelontong: "usaha-kelontong",
  "toko-pakaian": "usaha-toko-pakaian",
};

export default function DompetPage() {
  const params = useParams();
  const router = useRouter();
  const cabangSlug = (params?.cabang as string) || "";
  const bookOrBranchId: UnitId = BRANCH_MAP[cabangSlug] || "usaha-warkop";

  const wallets = useLiveQuery(() => db.wallets.where("bookOrBranchId").equals(bookOrBranchId).toArray(), [bookOrBranchId]) || [];

  const [editingWallet, setEditingWallet] = useState<string | null>(null);
  const [walletName, setWalletName] = useState("");
  const [walletTipe, setWalletTipe] = useState<"KasTunai" | "Bank" | "EWallet">("KasTunai");
  const [walletSaldo, setWalletSaldo] = useState(0);
  const [walletCatatan, setWalletCatatan] = useState("");
  const [walletNomorRekening, setWalletNomorRekening] = useState("");
  const [walletAtasNama, setWalletAtasNama] = useState("");
  const [walletNamaBank, setWalletNamaBank] = useState("");

  const resetForm = () => {
    setEditingWallet(null); setWalletName(""); setWalletSaldo(0); setWalletCatatan(""); setWalletTipe("KasTunai");
    setWalletNomorRekening(""); setWalletAtasNama(""); setWalletNamaBank("");
  };

  const handleSave = async () => {
    if (!walletName.trim()) return alert("Nama dompet wajib diisi!");
    const bankData = walletTipe === "Bank" ? { nomorRekening: walletNomorRekening.trim() || undefined, atasNama: walletAtasNama.trim() || undefined, namaBank: walletNamaBank.trim() || undefined } : {};
    if (editingWallet) {
      await db.wallets.update(editingWallet, { namaDompet: walletName.trim(), tipe: walletTipe, saldo: walletSaldo, catatan: walletCatatan, ...bankData });
    } else {
      await db.wallets.add({
        id: crypto.randomUUID(), bookOrBranchId, unitId: bookOrBranchId,
        namaDompet: walletName.trim(), saldo: walletSaldo, tipe: walletTipe,
        catatan: walletCatatan, isActive: true, createdAt: new Date().toISOString(), ...bankData,
      });
    }
    resetForm();
  };

  const handleEdit = (w: typeof wallets[0]) => {
    setEditingWallet(w.id); setWalletName(w.namaDompet); setWalletTipe(w.tipe); setWalletSaldo(w.saldo); setWalletCatatan(w.catatan);
    setWalletNomorRekening(w.nomorRekening || ""); setWalletAtasNama(w.atasNama || ""); setWalletNamaBank(w.namaBank || "");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus dompet ini?")) return;
    await db.wallets.delete(id);
    if (editingWallet === id) resetForm();
  };

  const tipeIcons: Record<string, React.ReactNode> = {
    Bank: <Landmark className="w-4 h-4" />,
    EWallet: <Smartphone className="w-4 h-4" />,
    KasTunai: <DollarSign className="w-4 h-4" />,
  };

  const totalSaldo = wallets.reduce((s, w) => s + w.saldo, 0);
  const isEditing = !!editingWallet;

  return (
    <div className="flex flex-col gap-4 pt-2 pb-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <button onClick={() => router.push(`/buku-usaha/${cabangSlug}`)} className="p-2 bg-white dark:bg-[#131527] rounded-full shadow-md active:scale-95 transition-transform">
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-heading font-extrabold tracking-tight flex items-center gap-2 justify-center">
            <Wallet className="w-5 h-5 text-[#008CEB]" />
            Dompet
          </h1>
        </div>
        <div className="w-10 h-10" />
      </div>

      {/* Total Saldo Card */}
      <div className="premium-card p-4 bg-gradient-to-br from-[#008CEB]/10 to-[#00C9A7]/10 dark:from-[#008CEB]/5 dark:to-[#00C9A7]/5">
        <div className="flex items-center gap-2 mb-1">
          <Wallet className="w-4 h-4 text-[#008CEB]" />
          <span className="text-[10px] text-slate-400 font-bold uppercase">Total Saldo</span>
        </div>
        <p className="text-xl font-heading font-extrabold text-[#008CEB] dark:text-[#4DA3E0] tracking-tight">Rp{totalSaldo.toLocaleString()}</p>
        <p className="text-[9px] text-slate-400 mt-1">{wallets.length} dompet aktif</p>
      </div>

      {/* Form Inline — selalu terlihat */}
      <div className="premium-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-[#008CEB]/10 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-[#008CEB]" />
          </div>
          <span className="text-xs font-heading font-extrabold">{isEditing ? "Edit Dompet" : "Tambah Dompet"}</span>
          {isEditing && (
            <button onClick={resetForm} className="ml-auto text-[10px] text-slate-400 font-bold px-2 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800">Batal</button>
          )}
        </div>
        <div className="space-y-3 text-xs">
          <input type="text" placeholder="Nama dompet (contoh: Kas, BCA, Dana)" value={walletName}
            onChange={(e) => setWalletName(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none font-bold" />
          <div className="grid grid-cols-3 gap-2">
            {(["KasTunai", "Bank", "EWallet"] as const).map((t) => (
              <button key={t} onClick={() => setWalletTipe(t)}
                className={`py-2 rounded-xl text-[10px] font-bold flex flex-col items-center gap-1 transition-all ${walletTipe === t ? "bg-[#008CEB] text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-400"}`}>
                {t === "KasTunai" ? <DollarSign className="w-4 h-4" /> : t === "Bank" ? <Landmark className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                {t === "KasTunai" ? "Kas" : t === "Bank" ? "Bank" : "E-Wallet"}
              </button>
            ))}
          </div>
          {walletTipe === "Bank" && <>
            <input type="text" placeholder="Nama Bank (contoh: BCA, Mandiri)" value={walletNamaBank}
              onChange={(e) => setWalletNamaBank(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none font-bold" />
            <input type="text" placeholder="Atas Nama" value={walletAtasNama}
              onChange={(e) => setWalletAtasNama(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none font-bold" />
            <input type="text" placeholder="Nomor Rekening" value={walletNomorRekening}
              onChange={(e) => setWalletNomorRekening(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none font-bold" />
          </>}
          <input type="number" placeholder="Saldo awal (Rp)" value={walletSaldo || ""}
            onChange={(e) => setWalletSaldo(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none font-bold" />
          <input type="text" placeholder="Catatan (opsional)" value={walletCatatan}
            onChange={(e) => setWalletCatatan(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none" />
          <button onClick={handleSave}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#008CEB] to-[#00C9A7] text-white font-bold text-xs active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5">
            <Save className="w-4 h-4" /> {isEditing ? "Update Dompet" : "Simpan Dompet"}
          </button>
        </div>
      </div>

      {/* Daftar Dompet */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 mb-1">
          <Wallet className="w-4 h-4 text-[#008CEB]" />
          <span className="text-xs font-heading font-extrabold">Daftar Dompet</span>
          <span className="text-[10px] text-slate-400 ml-auto">({wallets.length})</span>
        </div>
        {wallets.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">Belum ada dompet. Isi form di atas untuk menambah.</div>
        ) : (
          wallets.map((w) => (
            <div key={w.id} className="premium-card p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#008CEB]/10 flex items-center justify-center text-[#008CEB]">
                {tipeIcons[w.tipe] || <Wallet className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-heading font-bold truncate">{w.namaDompet}</p>
                {w.tipe === "Bank" && w.namaBank ? (
                  <p className="text-[9px] text-slate-400">{w.namaBank}{w.atasNama ? ` · ${w.atasNama}` : ""}{w.nomorRekening ? ` · ${w.nomorRekening}` : ""}</p>
                ) : (
                  <p className="text-[9px] text-slate-400">{w.tipe}{w.catatan ? ` · ${w.catatan}` : ""}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-heading font-extrabold text-[#008CEB]">Rp{w.saldo.toLocaleString()}</p>
                <div className="flex gap-1 mt-0.5 justify-end">
                  <button onClick={() => handleEdit(w)} className="p-0.5 text-slate-400 hover:text-[#008CEB]">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(w.id)} className="p-0.5 text-slate-400 hover:text-rose-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
