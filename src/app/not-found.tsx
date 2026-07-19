"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8F9FD] dark:bg-[#0B0C16] flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
        <div className="w-20 h-20 rounded-3xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto">
          <span className="text-4xl font-extrabold text-amber-500">404</span>
        </div>
        <h1 className="text-lg font-extrabold text-slate-800 dark:text-slate-200">Halaman Tidak Ditemukan</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">Halaman yang Anda cari tidak tersedia atau telah dipindahkan.</p>
        <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-2xl hover:bg-emerald-600 transition-colors">
          <Home className="w-4 h-4" /> Kembali ke Beranda
        </Link>
      </motion.div>
    </div>
  );
}
