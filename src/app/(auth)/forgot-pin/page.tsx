"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db-v4";
import { hashPin } from "@/lib/crypto";
import { showToast } from "@/lib/toast";
import { motion, AnimatePresence } from "framer-motion";
import { Key, CheckCircle, User, Lock, ArrowLeft, Shield, ArrowRight } from "lucide-react";

export default function ForgotPinPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<"verify" | "reset">("verify");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return showToast.error("Username harus diisi!");
    setLoading(true);
    const user = await db.users.where("nama").equals(username.trim()).first();
    setLoading(false);
    if (!user) return showToast.error("Username tidak ditemukan!");
    setStep("reset");
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4) return showToast.error("PIN minimal 4 digit!");
    if (newPin !== confirmPin) return showToast.error("PIN konfirmasi tidak cocok!");
    setLoading(true);
    const user = await db.users.where("nama").equals(username.trim()).first();
    if (!user) { setLoading(false); return showToast.error("User tidak ditemukan!"); }
    await db.users.update(user.id, { pinHash: await hashPin(newPin) });
    setLoading(false);
    setSuccess(true);
    showToast.success("PIN berhasil direset!");
    setTimeout(() => router.push("/login"), 2000);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-sm"
      >
        <div className="card-modern p-8 flex flex-col gap-6">
          <div className="text-center space-y-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 15 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20"
            >
              <Key className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-heading font-extrabold tracking-tight gradient-gold">Reset PIN</h1>
              <p className="text-[11px] text-[var(--color-text-secondary)] font-medium mt-0.5">
                {success ? "PIN berhasil diperbarui" : step === "verify" ? "Masukkan username untuk reset PIN" : "Buat PIN baru Anda"}
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center py-6 gap-3"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-emerald-600">PIN berhasil direset!</p>
                  <p className="text-[11px] text-[var(--color-text-secondary)] mt-1">Mengalihkan ke halaman login...</p>
                </div>
              </motion.div>
            ) : step === "verify" ? (
              <motion.form
                key="verify"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleVerify}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider px-1">Username</label>
                  <div className="relative group">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)] group-focus-within:text-amber-500 transition-colors duration-200" />
                    <input
                      type="text"
                      placeholder="Masukkan username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="input-modern pl-10"
                    />
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
                    <span className="flex items-center gap-2">Verifikasi <ArrowRight className="w-4 h-4" /></span>
                  )}
                </motion.button>
              </motion.form>
            ) : (
              <motion.form
                key="reset"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleReset}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider px-1">PIN Baru</label>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)] group-focus-within:text-amber-500 transition-colors duration-200" />
                    <input
                      type="password"
                      placeholder="Buat PIN baru (4-6 digit)"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="input-modern pl-10 tracking-[0.3em]"
                      maxLength={6}
                      inputMode="numeric"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider px-1">Konfirmasi PIN</label>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)] group-focus-within:text-amber-500 transition-colors duration-200" />
                    <input
                      type="password"
                      placeholder="Masukkan ulang PIN baru"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="input-modern pl-10 tracking-[0.3em]"
                      maxLength={6}
                      inputMode="numeric"
                    />
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
                    <span className="flex items-center gap-2">Reset PIN <ArrowRight className="w-4 h-4" /></span>
                  )}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>

          <button type="button" onClick={() => router.push("/login")} className="flex items-center justify-center gap-1.5 text-xs text-[var(--color-text-secondary)] hover:text-emerald-600 transition-colors font-medium">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Login
          </button>
        </div>

        <p className="text-center text-[10px] text-[var(--color-text-secondary)] mt-6 opacity-60">
          &copy; {new Date().getFullYear()} MMCBANK Finance
        </p>
      </motion.div>
    </div>
  );
}
