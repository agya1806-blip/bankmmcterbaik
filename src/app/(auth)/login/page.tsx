"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/store/useSessionStore";
import { Lock, User } from "lucide-react";

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
      <form onSubmit={handleSubmit} className="w-full max-w-sm premium-card p-8 flex flex-col gap-5 animate-fade-in">
        <div className="text-center">
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-[#7B61FF] to-[#FF5C00] bg-clip-text text-transparent">
            MMCBANK
          </h1>
          <p className="text-xs text-slate-500 mt-1">Buku Usaha v3</p>
        </div>

        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(""); }}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#131527] text-sm focus:outline-none focus:ring-2 focus:ring-[#7B61FF]/40"
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="password"
            placeholder="PIN"
            value={pin}
            onChange={(e) => { setPin(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#131527] text-sm focus:outline-none focus:ring-2 focus:ring-[#7B61FF]/40 tracking-[0.3em]"
            maxLength={6}
          />
        </div>

        {error && <p className="text-xs text-red-500 text-center">{error}</p>}

        <button
          type="submit"
          className="w-full h-11 rounded-xl bg-gradient-to-r from-[#7B61FF] to-[#FF5C00] text-white font-bold text-sm shadow-lg shadow-indigo-500/20 active:scale-[0.97] transition-transform"
        >
          Masuk
        </button>

        <div className="flex justify-between text-xs">
          <button onClick={() => router.push("/register")} className="text-[#7B61FF] font-bold">Daftar Akun Baru</button>
          <button onClick={() => router.push("/forgot-pin")} className="text-slate-400 font-bold">Lupa PIN?</button>
        </div>
      </form>
    </div>
  );
}
