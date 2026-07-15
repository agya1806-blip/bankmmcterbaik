"use client";

import { useEffect, useState } from "react";
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
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);

  useEffect(() => {
    if (currentUser) router.replace("/");
  }, [currentUser, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pin.length < 4) { setError("PIN minimal 4 digit"); return; }
    setLoading(true);
    setError("");

    try {
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
      router.replace("/");
    } catch {
      setError("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[100dvh] items-center justify-center bg-slate-950 p-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="size-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-xl shadow-xl shadow-emerald-500/20 mb-4">
            M
          </div>
          <h1 className="text-xl font-bold font-heading text-slate-100">MMCBANK</h1>
          <p className="text-sm text-slate-500 mt-1">Masukkan PIN untuk masuk</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl bg-red-900/20 border border-red-800/30 px-4 py-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">PIN Akun</label>
            <div className="relative">
              <input
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="6 digit PIN"
                value={pin}
                onChange={(e) => { setPin(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                className="w-full h-12 pl-10 pr-12 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-base placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/15 transition-all"
                autoFocus
              />
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-600" />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
              >
                {showPin ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || pin.length < 4}
            className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {loading ? (
              <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <span className="flex items-center gap-2">Masuk <ArrowRight className="size-4" /></span>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-600">
          Belum punya akun?{" "}
          <button onClick={() => router.push("/register")} className="text-emerald-400 font-medium hover:underline">
            Buat Sekarang
          </button>
        </p>
      </div>
    </div>
  );
}
