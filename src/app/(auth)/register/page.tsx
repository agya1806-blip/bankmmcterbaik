"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/store/useSessionStore";
import { db } from "@/lib/db-v4";
import { ArrowRight, Eye, EyeOff, User, KeyRound } from "lucide-react";

async function hashPin(pin: string): Promise<string> {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(pin));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function RegisterPage() {
  const router = useRouter();
  const { currentUser, setSession } = useSessionStore();
  const [isInitializing, setIsInitializing] = useState(true);
  const [nama, setNama] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIsInitializing(false), 150);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!isInitializing && currentUser) {
      document.body.style.filter = "blur(0px)";
      router.replace("/");
    }
  }, [currentUser, router, isInitializing]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!nama.trim()) { setError("Nama wajib diisi"); return; }
    if (pin.length < 4) { setError("PIN minimal 4 digit"); return; }
    if (pin !== confirmPin) { setError("PIN tidak cocok"); return; }
    setLoading(true);

    try {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      const existing = await db.users.where("nama").equals(nama.trim()).first();
      if (existing) { setError("Nama sudah terdaftar"); setLoading(false); return; }

      const hash = await hashPin(pin);
      const newUser = {
        id: crypto.randomUUID(),
        bookOrBranchId: "usaha" as const,
        nama: nama.trim(),
        pinHash: hash,
        role: "admin" as const,
        allowedUnits: [],
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      await db.users.add(newUser);
      setSession(newUser);

      document.body.style.filter = "blur(4px)";
      setTimeout(() => {
        document.body.style.filter = "blur(0px)";
        router.replace("/");
      }, 150);
    } catch {
      setError("Gagal mendaftar");
      setLoading(false);
    }
  }

  if (isInitializing) {
    return <div className="flex h-[100dvh] items-center justify-center bg-[#F8F9FD] dark:bg-[#0B0C16]" />;
  }

  return (
    <div className="flex h-[100dvh] items-center justify-center p-6 bg-[#F8F9FD] dark:bg-[#0B0C16] animate-fade-in">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="size-14 rounded-2xl bg-gradient-to-r from-[#7B61FF] to-[#FF5C00] flex items-center justify-center text-white font-bold text-xl shadow-xl shadow-[#7B61FF]/20 mb-4">
            M
          </div>
          <h1 className="text-xl font-bold font-heading">Buat Akun Baru</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">PIN digunakan untuk masuk ke sistem</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 px-4 py-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Nama Lengkap</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Nama kamu"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="input-premium w-full h-10 pl-10 pr-4 text-base rounded-xl"
                autoFocus
              />
              <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">PIN (4-6 digit)</label>
            <div className="relative">
              <input
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="Masukkan PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="input-premium w-full h-10 pl-10 pr-12 text-base rounded-xl"
              />
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                {showPin ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Konfirmasi PIN</label>
            <div className="relative">
              <input
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="Ulangi PIN"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="input-premium w-full h-10 pl-10 pr-12 text-base rounded-xl"
              />
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !nama.trim() || pin.length < 4 || pin !== confirmPin}
            className="btn-gradient w-full h-10 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <span className="flex items-center gap-2">Daftar <ArrowRight className="size-4" /></span>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          Sudah punya akun?{" "}
          <button onClick={() => router.push("/login")} className="text-[#7B61FF] font-medium hover:underline">
            Masuk
          </button>
        </p>
      </div>
    </div>
  );
}
