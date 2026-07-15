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
  const [nama, setNama] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) router.replace("/");
  }, [currentUser, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!nama.trim()) { setError("Nama wajib diisi"); return; }
    if (pin.length < 4) { setError("PIN minimal 4 digit"); return; }
    if (pin !== confirmPin) { setError("PIN tidak cocok"); return; }
    setLoading(true);

    try {
      /* Force keyboard dismissal — iOS 100dvh reflow */
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

      /* Wait 150ms for iOS keyboard to fully dismiss + viewport to recalc 100dvh */
      setTimeout(() => {
        router.replace("/");
      }, 150);
    } catch {
      setError("Gagal mendaftar");
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
          <h1 className="text-xl font-bold font-heading text-slate-100">Buat Akun Baru</h1>
          <p className="text-sm text-slate-500 mt-1">PIN digunakan untuk masuk ke sistem</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl bg-red-900/20 border border-red-800/30 px-4 py-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Nama Lengkap</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Nama kamu"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="w-full h-12 pl-10 pr-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-base placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/15 transition-all"
                autoFocus
              />
              <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-600" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">PIN (4-6 digit)</label>
            <div className="relative">
              <input
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="Masukkan PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full h-12 pl-10 pr-12 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-base placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/15 transition-all"
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

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Konfirmasi PIN</label>
            <div className="relative">
              <input
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="Ulangi PIN"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full h-12 pl-10 pr-12 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-base placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/15 transition-all"
              />
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-600" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !nama.trim() || pin.length < 4 || pin !== confirmPin}
            className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {loading ? (
              <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <span className="flex items-center gap-2">Daftar <ArrowRight className="size-4" /></span>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-600">
          Sudah punya akun?{" "}
          <button onClick={() => router.push("/login")} className="text-emerald-400 font-medium hover:underline">
            Masuk
          </button>
        </p>
      </div>
    </div>
  );
}
