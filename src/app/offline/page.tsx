"use client";
import { motion } from "framer-motion";
import { WifiOff, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#F8F9FD] dark:bg-[#0B0C16] flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
        <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mx-auto">
          <WifiOff className="w-10 h-10 text-slate-500" />
        </div>
        <h1 className="text-lg font-extrabold text-slate-800 dark:text-slate-200">Tidak Ada Koneksi</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
          Anda sedang offline. Data tetap tersimpan secara lokal dan akan tersinkronisasi saat koneksi kembali.
        </p>
        <button onClick={() => window.location.reload()} className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-2xl hover:bg-emerald-600 transition-colors">
          <RefreshCw className="w-4 h-4" /> Coba Lagi
        </button>
      </motion.div>
    </div>
  );
}
