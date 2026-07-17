"use client";

import React, { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/store/useSessionStore";
import { db } from "@/lib/db-v4";

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 200;
        let w = img.width;
        let h = img.height;
        if (w > h && w > MAX) { h = (h * MAX) / w; w = MAX; }
        else if (h > MAX) { w = (w * MAX) / h; h = MAX; }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ProfilePage() {
  const router = useRouter();
  const { currentUser, updateProfile, logout } = useSessionStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const [nama, setNama] = useState(currentUser?.nama || "");
  const [showSuccess, setShowSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [showChangePin, setShowChangePin] = useState(false);
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinSuccess, setPinSuccess] = useState(false);

  const handlePhotoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    setIsUploading(true);
    try {
      const base64 = await compressImage(file);
      updateProfile({ fotoUrl: base64 });
      await db.users.update(currentUser.id, { fotoUrl: base64 });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch {
      alert("Gagal memproses gambar.");
    }
    setIsUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }, [currentUser, updateProfile]);

  const handleRemovePhoto = async () => {
    if (!currentUser) return;
    updateProfile({ fotoUrl: "" });
    await db.users.update(currentUser.id, { fotoUrl: "" });
  };

  const handleSaveName = async () => {
    if (!currentUser || !nama.trim()) return;
    if (nama.trim() === currentUser.nama) return;
    const exists = await db.users.where("nama").equals(nama.trim()).first();
    if (exists && exists.id !== currentUser.id) return alert("Username sudah digunakan!");
    await db.users.update(currentUser.id, { nama: nama.trim() });
    updateProfile({ nama: nama.trim() });
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setPinError("");
    if (newPin.length < 4) return setPinError("PIN minimal 4 digit!");
    if (newPin !== confirmPin) return setPinError("PIN konfirmasi tidak cocok!");

    const user = await db.users.get(currentUser.id);
    if (!user || user.pinHash !== oldPin) return setPinError("PIN lama salah!");

    await db.users.update(currentUser.id, { pinHash: newPin });
    setPinSuccess(true);
    setOldPin("");
    setNewPin("");
    setConfirmPin("");
    setTimeout(() => { setPinSuccess(false); setShowChangePin(false); }, 2000);
  };

  const handleLogout = () => {
    if (!confirm("Yakin ingin logout?")) return;
    logout();
    router.push("/login");
  };

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400 text-sm">
        <p>Anda belum login.</p>
        <button onClick={() => router.push("/login")} className="mt-2 text-[#008CEB] font-bold">Masuk</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pt-2 pb-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="p-2 bg-white dark:bg-[#131527] rounded-full shadow-md scale-press">
          <span className="text-sm">←</span>
        </button>
        <h1 className="text-lg font-extrabold tracking-tight">Profil Saya</h1>
        <div className="w-10" />
      </div>

      {/* Avatar Section */}
      <div className="premium-card p-6 flex flex-col items-center gap-4">
        <div className="relative group">
          <div
            className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-[#008CEB] to-[#00C9A7] flex items-center justify-center text-white text-3xl font-extrabold shadow-lg cursor-pointer"
            onClick={() => fileRef.current?.click()}
          >
            {currentUser.fotoUrl ? (
              <img src={currentUser.fotoUrl} alt="Profil" className="w-full h-full object-cover" />
            ) : (
              currentUser.nama.charAt(0).toUpperCase()
            )}
          </div>
          <div
            className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
            onClick={() => fileRef.current?.click()}
          >
            <span className="text-white text-xl">📷</span>
          </div>
          {isUploading && (
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
              <span className="text-white text-xs font-bold">...</span>
            </div>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={handlePhotoUpload}
        />

        {currentUser.fotoUrl && (
          <button onClick={handleRemovePhoto} className="text-[10px] text-rose-500 font-bold">
            Hapus Foto
          </button>
        )}

        {showSuccess && (
          <p className="text-xs text-[#00C9A7] font-bold animate-fade-in">Tersimpan!</p>
        )}
      </div>

      {/* Edit Name */}
      <div className="premium-card p-4 space-y-3">
        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Username / Nama</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            className="flex-1 h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0F1926] text-sm focus:outline-none focus:ring-2 focus:ring-[#008CEB]/40"
          />
          <button
            onClick={handleSaveName}
            disabled={nama.trim() === currentUser.nama || !nama.trim()}
            className="px-4 h-10 rounded-xl bg-[#008CEB] text-white text-xs font-bold disabled:opacity-40 active:scale-[0.97] transition-all"
          >
            Simpan
          </button>
        </div>
      </div>

      {/* Change PIN */}
      <div className="premium-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ubah PIN</label>
          <button onClick={() => setShowChangePin(!showChangePin)} className="text-[10px] text-[#008CEB] font-bold">
            {showChangePin ? "Batal" : "Ubah"}
          </button>
        </div>

        {showChangePin && (
          <form onSubmit={handleChangePin} className="flex flex-col gap-3 animate-slide-up">
            <input
              type="password"
              placeholder="PIN Lama"
              value={oldPin}
              onChange={(e) => { setOldPin(e.target.value.replace(/\D/g, "").slice(0, 6)); setPinError(""); }}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0F1926] text-sm focus:outline-none tracking-[0.3em]"
              maxLength={6}
            />
            <input
              type="password"
              placeholder="PIN Baru (4-6 digit)"
              value={newPin}
              onChange={(e) => { setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6)); setPinError(""); }}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0F1926] text-sm focus:outline-none tracking-[0.3em]"
              maxLength={6}
            />
            <input
              type="password"
              placeholder="Konfirmasi PIN Baru"
              value={confirmPin}
              onChange={(e) => { setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6)); setPinError(""); }}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0F1926] text-sm focus:outline-none tracking-[0.3em]"
              maxLength={6}
            />
            {pinError && <p className="text-xs text-[#FF3B5C] text-center">{pinError}</p>}
            {pinSuccess && <p className="text-xs text-[#00C9A7] font-bold text-center animate-fade-in">PIN berhasil diubah!</p>}
            <button
              type="submit"
              className="w-full h-10 rounded-xl bg-[#008CEB] text-white text-xs font-bold active:scale-[0.97] transition-transform"
            >
              Simpan PIN Baru
            </button>
          </form>
        )}
      </div>

      {/* Info */}
      <div className="premium-card p-4 space-y-2">
        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Informasi Akun</label>
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">User ID</span>
          <span className="font-mono text-[10px] text-slate-500">{currentUser.id.slice(0, 8)}...</span>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="premium-card p-4 text-center text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 active:scale-[0.98] transition-all"
      >
        🚪 Logout
      </button>
    </div>
  );
}
