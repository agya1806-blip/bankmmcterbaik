"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import Link from "next/link";

export default function ForgotPinPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<"verify" | "reset">("verify");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const users = JSON.parse(localStorage.getItem("mmc_users") || "[]");
    const user = users.find((u: any) => u.username === username.trim());
    if (!user) return setError("Username tidak ditemukan!");
    setStep("reset");
    setError("");
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4) return setError("PIN minimal 4 digit!");
    if (newPin !== confirmPin) return setError("PIN konfirmasi tidak cocok!");

    const users = JSON.parse(localStorage.getItem("mmc_users") || "[]");
    const idx = users.findIndex((u: any) => u.username === username.trim());
    if (idx === -1) return setError("User tidak ditemukan!");

    users[idx].pin = newPin;
    localStorage.setItem("mmc_users", JSON.stringify(users));
    setSuccess(true);
    setTimeout(() => router.push("/login"), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FD] dark:bg-[#0B0C16] flex items-center justify-center px-4">
      <div className="w-full max-w-sm premium-card p-8 flex flex-col gap-5 animate-fade-in">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-3">
            <span className="text-amber-600 text-2xl">🔑</span>
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">Reset PIN</h1>
          <p className="text-xs text-slate-500 mt-1">Masukkan username untuk reset PIN</p>
        </div>

        {success ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">✓</span>
            </div>
            <p className="text-sm font-bold text-emerald-600">PIN berhasil direset!</p>
            <p className="text-xs text-slate-400 mt-1">Mengalihkan ke halaman login...</p>
          </div>
        ) : step === "verify" ? (
          <form onSubmit={handleVerify} className="flex flex-col gap-4">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">🔒</span>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(""); }}
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#131527] text-sm focus:outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
              />
            </div>
            {error && <p className="text-xs text-red-500 text-center">{error}</p>}
            <button
              type="submit"
              className="w-full h-11 rounded-xl bg-gradient-to-r from-[#7B61FF] to-[#FF5C00] text-white font-bold text-sm active:scale-[0.97] transition-transform"
            >
              Verifikasi
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="flex flex-col gap-4">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">🔒</span>
              <input
                type="password"
                placeholder="PIN Baru (4-6 digit)"
                value={newPin}
                onChange={(e) => { setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#131527] text-sm focus:outline-none tracking-[0.3em]"
                maxLength={6}
              />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">🔒</span>
              <input
                type="password"
                placeholder="Konfirmasi PIN Baru"
                value={confirmPin}
                onChange={(e) => { setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#131527] text-sm focus:outline-none tracking-[0.3em]"
                maxLength={6}
              />
            </div>
            {error && <p className="text-xs text-red-500 text-center">{error}</p>}
            <button
              type="submit"
              className="w-full h-11 rounded-xl bg-gradient-to-r from-[#7B61FF] to-[#FF5C00] text-white font-bold text-sm active:scale-[0.97] transition-transform"
            >
              Reset PIN
            </button>
          </form>
        )}

        <Link href="/login" className="flex items-center justify-center gap-1 text-xs text-slate-400 hover:text-[#7B61FF]">
          <span className="text-xs">◀️</span> Kembali ke Login
        </Link>
      </div>
    </div>
  );
}
