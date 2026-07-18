"use client";

import React from "react";
import { Wallet, Landmark, Smartphone, DollarSign, Save, Pencil, Trash2, Building } from "lucide-react";
import { BOOK_LABELS, POS_UNITS, type UnitId } from "@/lib/db-v4";

interface Props {
  allWallets: any[];
  walletName: string;
  setWalletName: (v: string) => void;
  walletTipe: "KasTunai" | "Bank" | "EWallet";
  setWalletTipe: (v: "KasTunai" | "Bank" | "EWallet") => void;
  walletSaldo: number;
  setWalletSaldo: (v: number) => void;
  walletCatatan: string;
  setWalletCatatan: (v: string) => void;
  walletUnit: UnitId;
  setWalletUnit: (v: UnitId) => void;
  editingWallet: string | null;
  setEditingWallet: (v: string | null) => void;
  handleSaveWallet: () => void;
  handleEditWallet: (w: any) => void;
  handleDeleteWallet: (id: string) => void;
}

export default function GlobalDompetTab({
  allWallets,
  walletName, setWalletName,
  walletTipe, setWalletTipe,
  walletSaldo, setWalletSaldo,
  walletCatatan, setWalletCatatan,
  walletUnit, setWalletUnit,
  editingWallet, setEditingWallet,
  handleSaveWallet, handleEditWallet, handleDeleteWallet,
}: Props) {
  return (
    <div className="space-y-3 animate-fade-in">
      <div className="premium-card p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#008CEB] to-[#00C9A7] flex items-center justify-center text-white shadow-md">
            <span className="text-sm"><Wallet className="w-5 h-5" /></span>
          </div>
          <div>
            <span className="text-xs font-bold">{editingWallet ? "Edit Dompet" : "Tambah Dompet"}</span>
            <p className="text-[10px] text-slate-400">Bank, E-Wallet, Kas Tunai</p>
          </div>
        </div>
        <div className="space-y-2">
          <select value={walletUnit} onChange={(e) => setWalletUnit(e.target.value as UnitId)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none">
            {POS_UNITS.map((u) => <option key={u} value={u}>{BOOK_LABELS[u]}</option>)}
          </select>
          <input type="text" placeholder="Nama dompet (contoh: BCA, Dana, Kas)" value={walletName}
            onChange={(e) => setWalletName(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none" />
          <div className="grid grid-cols-3 gap-2">
            {(["KasTunai", "Bank", "EWallet"] as const).map((t) => (
              <button key={t} onClick={() => setWalletTipe(t)}
                className={`py-2 rounded-xl text-[10px] font-bold transition-all ${walletTipe === t ? "bg-[#008CEB] text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-400"}`}>
                {t === "KasTunai" ? <><Landmark className="w-5 h-5" /><span className="mt-1 block">Kas Tunai</span></> : t === "Bank" ? <><Building className="w-5 h-5" /><span className="mt-1 block">Bank</span></> : <><Smartphone className="w-5 h-5" /><span className="mt-1 block">E-Wallet</span></>}
              </button>
            ))}
          </div>
          <input type="number" placeholder="Saldo awal (Rp)" value={walletSaldo || ""}
            onChange={(e) => setWalletSaldo(Number(e.target.value))}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none font-bold" />
          <input type="text" placeholder="Catatan (opsional)" value={walletCatatan}
            onChange={(e) => setWalletCatatan(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none" />
          <div className="flex gap-2">
            <button onClick={handleSaveWallet}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#008CEB] to-[#00C9A7] text-white font-bold text-xs active:scale-[0.98] flex items-center justify-center gap-1.5">
              <span className="text-sm"><Save className="w-5 h-5" /></span>
              {editingWallet ? "Update" : "Simpan"}
            </button>
            {editingWallet && (
              <button onClick={() => { setEditingWallet(null); setWalletName(""); setWalletSaldo(0); setWalletCatatan(""); }}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-400 text-xs font-bold">
                Batal
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="premium-card p-3 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <Wallet className="w-4 h-4 text-[#008CEB]" />
          <span className="text-xs font-bold">Semua Dompet</span>
          <span className="text-[10px] text-slate-400 ml-auto">({allWallets.length})</span>
        </div>
        {allWallets.length === 0 ? (
          <p className="text-[10px] text-slate-400 py-4 text-center">Belum ada dompet. Tambahkan dompet di atas.</p>
        ) : (
          <div className="space-y-1.5">
            {allWallets.map((w: any) => {
              const tipeIcons: Record<string, React.ReactNode> = {
                Bank: <Landmark className="w-4 h-4" />,
                EWallet: <Smartphone className="w-4 h-4" />,
                KasTunai: <DollarSign className="w-4 h-4" />,
              };
              return (
                <div key={w.id} className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/50 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#008CEB]/10 flex items-center justify-center text-[#008CEB]">
                    {tipeIcons[w.tipe] || <Wallet className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold truncate">{w.namaDompet}</p>
                    <p className="text-[9px] text-slate-400">{w.tipe} {w.catatan && `· ${w.catatan}`}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-extrabold text-[#008CEB]">Rp{w.saldo.toLocaleString()}</p>
                    <div className="flex gap-1 mt-0.5">
                      <button onClick={() => handleEditWallet(w)} className="p-0.5 text-slate-400 hover:text-[#008CEB]">
                        <span className="text-[10px]"><Pencil className="w-5 h-5" /></span>
                      </button>
                      <button onClick={() => handleDeleteWallet(w.id)} className="p-0.5 text-slate-400 hover:text-rose-500">
                        <span className="text-[10px]"><Trash2 className="w-5 h-5" /></span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
