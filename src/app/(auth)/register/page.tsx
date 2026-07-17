"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/store/useSessionStore";
import { db } from "@/lib/db-v4";

export default function RegisterPage() {
  const router = useRouter();
  const { login, completeOnboarding } = useSessionStore();
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return setError("Username harus diisi!");
    if (pin.length < 4) return setError("PIN minimal 4 digit!");
    if (pin !== pinConfirm) return setError("PIN konfirmasi tidak cocok!");

    const existing = await db.users.where("nama").equals(username.trim()).first();
    if (existing) return setError("Username sudah digunakan!");

    const userId = crypto.randomUUID();
    await db.users.add({
      id: userId,
      bookOrBranchId: "pribadi",
      nama: username.trim(),
      pinHash: pin,
      fotoUrl: "",
      role: "admin",
      allowedUnits: [],
      isActive: true,
      createdAt: new Date().toISOString(),
    });

    login({ id: userId, nama: username.trim(), fotoUrl: "" });
    completeOnboarding();
    router.push("/buku-usaha");
  };

  return (
    <div className="min-h-screen bg-[#F5F9FC] dark:bg-[#0A1628] flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm premium-card p-8 flex flex-col gap-5 animate-fade-in">
        <div className="text-center">
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-[#008CEB] to-[#00C9A7] bg-clip-text text-transparent">
            Daftar Akun Baru
          </h1>
          <p className="text-xs text-slate-500 mt-1">Buat akun untuk mulai mengelola usaha</p>
        </div>

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">👤</span>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(""); }}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0F1926] text-sm focus:outline-none focus:ring-2 focus:ring-[#008CEB]/40"
          />
        </div>

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">🔒</span>
          <input
            type={showPin ? "text" : "password"}
            placeholder="PIN (4-6 digit)"
            value={pin}
            onChange={(e) => { setPin(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
            className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0F1926] text-sm focus:outline-none focus:ring-2 focus:ring-[#008CEB]/40 tracking-[0.3em]"
            maxLength={6}
          />
          <button type="button" onClick={() => setShowPin(!showPin)} className="absolute right-3 top-1/2 -translate-y-1/2">
            <span className="text-sm text-slate-400">{showPin ? "🙈" : "👁️"}</span>
          </button>
        </div>

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">🔒</span>
          <input
            type="password"
            placeholder="Konfirmasi PIN"
            value={pinConfirm}
            onChange={(e) => { setPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0F1926] text-sm focus:outline-none focus:ring-2 focus:ring-[#008CEB]/40 tracking-[0.3em]"
            maxLength={6}
          />
        </div>

        {error && <p className="text-xs text-[#FF3B5C] text-center">{error}</p>}

        <button
          type="submit"
          className="w-full h-11 rounded-xl bg-gradient-to-r from-[#008CEB] to-[#00C9A7] text-white font-bold text-sm shadow-lg shadow-[#008CEB]/20 active:scale-[0.97] transition-transform"
        >
          Daftar
        </button>

        <p className="text-center text-xs text-slate-400">
          Sudah punya akun?{" "}
          <button onClick={() => router.push("/login")} className="text-[#008CEB] font-bold">Masuk</button>
        </p>
      </form>
    </div>
  );
}
