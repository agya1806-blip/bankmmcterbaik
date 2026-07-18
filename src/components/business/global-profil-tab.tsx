"use client";

import React, { useEffect } from "react";
import { UserCircle, Save, Building } from "lucide-react";

interface Props {
  currentUser: any;
  allWallets: any[];
  profileNama: string;
  setProfileNama: (v: string) => void;
  profileNoHP: string;
  setProfileNoHP: (v: string) => void;
  profileAlamat: string;
  setProfileAlamat: (v: string) => void;
  handleSaveProfile: () => void;
  handleLoadProfile: () => void;
}

export default function GlobalProfilTab({
  currentUser,
  allWallets,
  profileNama, setProfileNama,
  profileNoHP, setProfileNoHP,
  profileAlamat, setProfileAlamat,
  handleSaveProfile, handleLoadProfile,
}: Props) {
  useEffect(() => {
    handleLoadProfile();
  }, [handleLoadProfile]);

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="premium-card p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#008CEB] to-[#00C9A7] flex items-center justify-center text-white shadow-md">
            <span className="text-xl"><UserCircle className="w-5 h-5" /></span>
          </div>
          <div>
            <span className="text-xs font-bold">Profil Pengguna</span>
            <p className="text-[10px] text-slate-400">Kelola informasi akun</p>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">Nama Lengkap</label>
            <input type="text" placeholder="Nama Anda" value={profileNama}
              onChange={(e) => setProfileNama(e.target.value)}
              className="w-full px-3 py-2.5 text-xs rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none" />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">No. HP / WhatsApp</label>
            <input type="tel" placeholder="08xxxxxxxxxx" value={profileNoHP}
              onChange={(e) => setProfileNoHP(e.target.value)}
              className="w-full px-3 py-2.5 text-xs rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none" />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">Alamat</label>
            <input type="text" placeholder="Alamat lengkap" value={profileAlamat}
              onChange={(e) => setProfileAlamat(e.target.value)}
              className="w-full px-3 py-2.5 text-xs rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none" />
          </div>
          <button onClick={handleSaveProfile}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#008CEB] to-[#00C9A7] text-white font-bold text-xs active:scale-[0.98] flex items-center justify-center gap-2">
            <span className="text-sm"><Save className="w-5 h-5" /></span> Simpan Profil
          </button>
        </div>
      </div>

      <div className="premium-card p-4">
        <div className="flex items-center gap-2 mb-2">
          <Building className="w-4 h-4 text-[#008CEB]" />
          <span className="text-xs font-bold">Informasi Akun</span>
        </div>
        <div className="space-y-2 text-[11px]">
          <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 font-medium">Username</span>
            <span className="font-extrabold">{currentUser?.nama}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 font-medium">Tipe Lisensi</span>
            <span className="font-extrabold text-[#008CEB]">FREE</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 font-medium">Cabang Aktif</span>
            <span className="font-extrabold">2</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-slate-400 font-medium">Total Dompet</span>
            <span className="font-extrabold">{allWallets.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
