"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/store/useSessionStore";


export default function LoginPage() {
  const router = useRouter();
  const { login, completeOnboarding } = useSessionStore();
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Username harus diisi");
      return;
    }
    if (pin.length < 4) {
      setError("PIN minimal 4 digit");
      return;
    }
    login(username.trim());
    completeOnboarding();
    router.push("/buku-usaha");
  };

  return (
    <div className="min-h-screen bg-[#F8F9FD] dark:bg-[#0B0C16] flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm premium-card premium-card-glow p-8 flex flex-col gap-5 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7B61FF] to-[#FF5C00] flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/20">
            <span className="text-white text-3xl">🔒</span>
          </div>
          <h1 className="text-2xl font-heading font-extrabold tracking-tight gradient-text">
            MMCBANK
          </h1>
          <p className="text-[11px] text-slate-500 font-medium">Multi-Business Financial Manager</p>
        </div>

        <div className="relative group">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 group-focus-within:text-[#7B61FF] transition-colors duration-200">👤</span>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(""); }}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#131527] text-sm focus:outline-none focus:ring-2 focus:ring-[#7B61FF]/40 transition-all duration-200"
          />
        </div>

        <div className="relative group">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 group-focus-within:text-[#7B61FF] transition-colors duration-200">🔒</span>
          <input
            type="password"
            placeholder="PIN (4-6 digit)"
            value={pin}
            onChange={(e) => { setPin(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#131527] text-sm focus:outline-none focus:ring-2 focus:ring-[#7B61FF]/40 tracking-[0.3em] transition-all duration-200"
            maxLength={6}
          />
        </div>

        {error && (
          <p className="text-xs text-rose-500 font-bold text-center bg-rose-50 dark:bg-rose-950/30 py-2 rounded-xl">{error}</p>
        )}

        <button
          type="submit"
          className="btn-primary w-full h-11 text-sm shadow-lg shadow-indigo-500/20"
        >
          Masuk ke Dashboard
        </button>

        <div className="flex justify-between text-xs mt-1">
          <button onClick={() => router.push("/register")} className="text-[#7B61FF] font-bold hover:text-[#FF5C00] transition-colors duration-200">Daftar Akun Baru</button>
          <button onClick={() => router.push("/forgot-pin")} className="text-slate-400 font-bold hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-200">Lupa PIN?</button>
        </div>
      </form>
    </div>
  );
}
