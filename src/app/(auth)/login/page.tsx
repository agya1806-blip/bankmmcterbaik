"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/store/useSessionStore";
import { db } from "@/lib/db-v4";
import { ArrowRight, Eye, EyeOff, KeyRound } from "lucide-react";

async function hashPin(pin: string): Promise<string> {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(pin));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function LoginPage() {
  const router = useRouter();
  const { currentUser, setSession } = useSessionStore();
  const [isInitializing, setIsInitializing] = useState(true);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);

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

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) { setError("PIN minimal 4 digit"); return; }
    setLoading(true);
    setError("");

    try {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      const users = await db.users.toArray();
      if (users.length === 0) {
        router.replace("/register");
        return;
      }

      const hash = await hashPin(pin);
      const found = users.find((u) => u.pinHash === hash && u.isActive);
      if (!found) {
        setError("PIN salah");
        setLoading(false);
        return;
      }

      setSession(found);

      document.body.style.filter = "blur(4px)";
      setTimeout(() => {
        document.body.style.filter = "blur(0px)";
        router.replace("/");
      }, 150);
    } catch {
      setError("Terjadi kesalahan");
      setLoading(false);
    }
  }, [pin, router, setSession]);

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
          <h1 className="text-xl font-bold font-heading">MMCBANK</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Masukkan PIN untuk masuk</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 px-4 py-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">PIN Akun</label>
            <div className="relative">
              <input
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="6 digit PIN"
                value={pin}
                onChange={(e) => { setPin(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                className="input-premium w-full h-10 pl-10 pr-12 text-base rounded-xl"
                autoFocus
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

          <button
            type="submit"
            disabled={loading || pin.length < 4}
            className="btn-gradient w-full h-10 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <span className="flex items-center gap-2">Masuk <ArrowRight className="size-4" /></span>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          Belum punya akun?{" "}
          <button onClick={() => router.push("/register")} className="text-[#7B61FF] font-medium hover:underline">
            Buat Sekarang
          </button>
        </p>
      </div>
    </div>
  );
}
