"use client";

import { motion } from "framer-motion";
import { User, Home, Building2, ChevronRight, BookOpen, Wallet, BarChart3, Shield } from "lucide-react";
import { useRouter } from "next/navigation";

const BOOKS = [
  {
    label: "Buku Pribadi",
    desc: "Keuangan pribadi",
    longDesc: "Kelola pemasukan, pengeluaran, dan catatan keuangan harian pribadi",
    icon: <User className="w-7 h-7 text-white" />,
    gradient: "from-emerald-500 to-emerald-600",
    shadow: "shadow-emerald-500/20",
    accent: "emerald",
    route: "/buku-pribadi",
  },
  {
    label: "Buku Keluarga",
    desc: "Keuangan keluarga",
    longDesc: "Atur anggaran rumah tangga, tabungan pendidikan, dan kebutuhan keluarga",
    icon: <Home className="w-7 h-7 text-white" />,
    gradient: "from-amber-400 to-amber-500",
    shadow: "shadow-amber-500/20",
    accent: "amber",
    route: "/buku-keluarga",
  },
  {
    label: "Buku Bisnis",
    desc: "Unit usaha & bisnis",
    longDesc: "Manajemen penjualan, inventory, piutang, dan laporan keuangan bisnis",
    icon: <Building2 className="w-7 h-7 text-white" />,
    gradient: "from-slate-500 to-slate-600",
    shadow: "shadow-slate-500/20",
    accent: "slate",
    route: "/buku-bisnis",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as any } },
};

export default function BukuPage() {
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col gap-6 pt-2 pb-8 max-w-2xl mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="flex items-center gap-3"
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-heading font-extrabold tracking-tight">Pilih Buku</h1>
          <p className="text-[11px] text-[var(--color-text-secondary)] font-medium">Pilih kategori buku keuangan yang akan dikelola</p>
        </div>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-4"
      >
        {BOOKS.map((b) => (
          <motion.button
            key={b.route}
            variants={cardVariants}
            whileHover={{ y: -3, scale: 1.005 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push(b.route)}
            className="card-modern p-6 text-left flex items-center gap-5 group"
          >
            <div
              className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${b.gradient} flex items-center justify-center text-white shadow-lg ${b.shadow} group-hover:shadow-xl ${b.shadow.replace("/20", "/30")} transition-shadow duration-300 shrink-0`}
            >
              {b.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-extrabold tracking-tight">{b.label}</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{b.desc}</p>
              <p className="text-[10px] text-[var(--color-text-secondary)] mt-1.5 opacity-60 leading-relaxed">{b.longDesc}</p>
              <div className="flex items-center gap-3 mt-3">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg bg-${b.accent}-50 dark:bg-${b.accent}-900/20 text-${b.accent}-600 dark:text-${b.accent}-400`}>
                  {b.label === "Buku Pribadi" && "Catatan Harian"}
                  {b.label === "Buku Keluarga" && "Anggaran"}
                  {b.label === "Buku Bisnis" && "Bisnis & Inventory"}
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[var(--color-bg)] flex items-center justify-center shrink-0 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20 transition-colors duration-300">
              <ChevronRight className="w-5 h-5 text-[var(--color-text-secondary)] group-hover:text-emerald-500 transition-colors duration-300" />
            </div>
          </motion.button>
        ))}
      </motion.div>

      {/* Footer info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="card-modern p-5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/20 dark:to-emerald-900/10 border-emerald-200/50 dark:border-emerald-800/30 mt-2"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white shadow-md shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">MMCBANK Finance</p>
            <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">Multi-Business Financial Manager &mdash; Kelola semua keuangan dalam satu aplikasi</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
