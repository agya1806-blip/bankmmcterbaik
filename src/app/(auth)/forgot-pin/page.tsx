"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db-v4";
import { Key, CheckCircle, User, Lock, ArrowLeft } from "lucide-react";

export default function ForgotPinPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<"verify" | "reset">("verify");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = await db.users.where("nama").equals(username.trim()).first();
    if (!user) return setError("Username tidak ditemukan!");
    setStep("reset");
    setError("");
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4) return setError("PIN minimal 4 digit!");
    if (newPin !== confirmPin) return setError("PIN konfirmasi tidak cocok!");

    const user = await db.users.where("nama").equals(username.trim()).first();
    if (!user) return setError("User tidak ditemukan!");

    await db.users.update(user.id, { pinHash: newPin });
    setSuccess(true);
    setTimeout(() => router.push("/login"), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F5F9FC] dark:bg-[#0A1628] flex items-center justify-center px-4">
      <div className="w-full max-w-sm premium-card p-8 flex flex-col gap-5 animate-fade-in">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-[#E8F5FD] dark:bg-[#008CEB]/10 flex items-center justify-center mx-auto mb-3">
            <Key className="w-6 h-6 text-[#008CEB]" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">Reset PIN</h1>
          <p className="text-xs text-slate-500 mt-1">Masukkan username untuk reset PIN</p>
        </div>

        {success ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="text-sm font-bold text-[#00C9A7]">PIN berhasil direset!</p>
            <p className="text-xs text-slate-400 mt-1">Mengalihkan ke halaman login...</p>
          </div>
        ) : step === "verify" ? (
          <form onSubmit={handleVerify} className="flex flex-col gap-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(""); }}
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0F1926] text-sm focus:outline-none focus:ring-2 focus:ring-[#008CEB]/40"
              />
            </div>
            {error && <p className="text-xs text-[#FF3B5C] text-center">{error}</p>}
            <button
              type="submit"
              className="w-full h-11 rounded-xl bg-gradient-to-r from-[#008CEB] to-[#00C9A7] text-white font-bold text-sm active:scale-[0.97] transition-transform"
            >
              Verifikasi
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="flex flex-col gap-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                placeholder="PIN Baru (4-6 digit)"
                value={newPin}
                onChange={(e) => { setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0F1926] text-sm focus:outline-none tracking-[0.3em]"
                maxLength={6}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                placeholder="Konfirmasi PIN Baru"
                value={confirmPin}
                onChange={(e) => { setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0F1926] text-sm focus:outline-none tracking-[0.3em]"
                maxLength={6}
              />
            </div>
            {error && <p className="text-xs text-[#FF3B5C] text-center">{error}</p>}
            <button
              type="submit"
              className="w-full h-11 rounded-xl bg-gradient-to-r from-[#008CEB] to-[#00C9A7] text-white font-bold text-sm active:scale-[0.97] transition-transform"
            >
              Reset PIN
            </button>
          </form>
        )}

        <button onClick={() => router.push("/login")} className="flex items-center justify-center gap-1 text-xs text-slate-400 hover:text-[#008CEB]">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Login
        </button>
      </div>
    </div>
  );
}
