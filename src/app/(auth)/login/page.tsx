"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/store/useSessionStore";
import { db } from "@/lib/db-v4";
import { verifyPin } from "@/lib/crypto";
import { showToast } from "@/lib/toast";
import { motion } from "framer-motion";
import { Shield, User, Lock, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, completeOnboarding } = useSessionStore();
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return showToast.error("Username harus diisi");
    if (pin.length < 4) return showToast.error("PIN minimal 4 digit");
    setLoading(true);
    try {
      const user = await db.users.where("nama").equals(username.trim()).first();
      if (!user) return showToast.error("Username tidak ditemukan");
      if (!(await verifyPin(pin, user.pinHash))) return showToast.error("PIN salah");
      login({ id: user.id, nama: user.nama, fotoUrl: user.fotoUrl, role: user.role });
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
              <h1 className="text-2xl font-heading font-extrabold tracking-tight gradient-text">MMCBANK</h1>
              <p className="text-[11px] text-[var(--color-text-secondary)] font-medium mt-0.5">Multi-Business Financial Manager</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider px-1">Username</label>
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)] group-focus-within:text-emerald-500 transition-colors duration-200" />
                <input
                  type="text"
                  placeholder="Masukkan username"
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
                  type="password"
                  placeholder="Masukkan PIN (4-6 digit)"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
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
              <span className="flex items-center gap-2">Masuk <ArrowRight className="w-4 h-4" /></span>
            )}
          </motion.button>

          <div className="flex justify-between text-xs">
            <button type="button" onClick={() => router.push("/register")} className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
              Daftar Akun Baru
            </button>
            <button type="button" onClick={() => router.push("/forgot-pin")} className="font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
              Lupa PIN?
            </button>
          </div>
        </form>

        <p className="text-center text-[10px] text-[var(--color-text-secondary)] mt-6 opacity-60">
          &copy; {new Date().getFullYear()} MMCBANK Finance
        </p>
      </motion.div>
    </div>
  );
}
