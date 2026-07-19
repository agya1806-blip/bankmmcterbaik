"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/store/useSessionStore";
import { db } from "@/lib/db-v4";
import { hashPin } from "@/lib/crypto";
import { showToast } from "@/lib/toast";
import { motion } from "framer-motion";
import { User, Lock, Eye, EyeOff, ArrowRight, Shield } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { login, completeOnboarding } = useSessionStore();
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return showToast.error("Username harus diisi!");
    if (pin.length < 4) return showToast.error("PIN minimal 4 digit!");
    if (pin !== pinConfirm) return showToast.error("PIN konfirmasi tidak cocok!");
    setLoading(true);
    try {
      const existing = await db.users.where("nama").equals(username.trim()).first();
      if (existing) return showToast.error("Username sudah digunakan!");
      const userId = crypto.randomUUID();
      await db.users.add({
        id: userId, bookOrBranchId: "pribadi", nama: username.trim(),
        pinHash: await hashPin(pin), fotoUrl: "", role: "admin",
        allowedUnits: [], isActive: true, createdAt: new Date().toISOString(),
      });
      login({ id: userId, nama: username.trim(), fotoUrl: "", role: "admin" });
      completeOnboarding();
      router.push("/");
    } catch { showToast.error("Terjadi kesalahan"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-sm"
      >
        <form onSubmit={handleSubmit} className="card-modern p-8 flex flex-col gap-6">
          <div className="text-center space-y-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 15 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20"
            >
              <Shield className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-heading font-extrabold tracking-tight gradient-text">Daftar Akun Baru</h1>
              <p className="text-[11px] text-[var(--color-text-secondary)] font-medium mt-0.5">Buat akun untuk mulai mengelola usaha</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider px-1">Username</label>
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)] group-focus-within:text-emerald-500 transition-colors duration-200" />
                <input
                  type="text"
                  placeholder="Pilih username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-modern pl-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider px-1">PIN</label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)] group-focus-within:text-emerald-500 transition-colors duration-200" />
                <input
                  type={showPin ? "text" : "password"}
                  placeholder="Buat PIN (4-6 digit)"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="input-modern pl-10 pr-10 tracking-[0.3em]"
                  maxLength={6}
                  inputMode="numeric"
                />
                <button type="button" onClick={() => setShowPin(!showPin)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-emerald-500 transition-colors">
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider px-1">Konfirmasi PIN</label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)] group-focus-within:text-emerald-500 transition-colors duration-200" />
                <input
                  type="password"
                  placeholder="Masukkan ulang PIN"
                  value={pinConfirm}
                  onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="input-modern pl-10 tracking-[0.3em]"
                  maxLength={6}
                  inputMode="numeric"
                />
              </div>
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.97 }}
            className="btn-emerald w-full h-12 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span className="flex items-center gap-2">Daftar <ArrowRight className="w-4 h-4" /></span>
            )}
          </motion.button>

          <p className="text-center text-xs text-[var(--color-text-secondary)]">
            Sudah punya akun?{" "}
            <button type="button" onClick={() => router.push("/login")} className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
              Masuk
            </button>
          </p>
        </form>

        <p className="text-center text-[10px] text-[var(--color-text-secondary)] mt-6 opacity-60">
          &copy; {new Date().getFullYear()} MMCBANK Finance
        </p>
      </motion.div>
    </div>
  );
}
