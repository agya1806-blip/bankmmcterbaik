"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Printer, Monitor, Smartphone, Coffee, Store, Shirt, Tags,
  Wallet, BarChart3, Settings, Users, Sigma, LayoutDashboard, ClipboardList,
} from "lucide-react";

const BRANCHES = [
  { slug: "percetakan", label: "Percetakan", icon: Printer, color: "from-violet-500 to-purple-600" },
  { slug: "laptop", label: "Laptop / PC", icon: Monitor, color: "from-cyan-500 to-blue-600" },
  { slug: "gadget", label: "Gadget", icon: Smartphone, color: "from-sky-500 to-indigo-600" },
  { slug: "warkop", label: "Warkop", icon: Coffee, color: "from-emerald-500 to-teal-600" },
  { slug: "kelontong", label: "Kelontong", icon: Store, color: "from-amber-500 to-orange-600" },
  { slug: "konveksi", label: "Konveksi", icon: Tags, color: "from-rose-500 to-pink-600" },
  { slug: "toko-pakaian", label: "Toko Pakaian", icon: Shirt, color: "from-fuchsia-500 to-pink-600" },
] as const;

const HUB_MENUS = [
  { slug: "pelanggan", label: "Pelanggan", icon: Users },
  { slug: "dompet", label: "Dompet", icon: Wallet },
  { slug: "laporan-keuangan", label: "Laporan", icon: BarChart3 },
  { slug: "inventory", label: "Inventaris", icon: ClipboardList },
  { slug: "pengaturan", label: "Pengaturan", icon: Settings },
];

export default function BukuUsahaLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const isRoot = pathname === "/buku-usaha";

  if (!isRoot) {
    return <>{children}</>;
  }

  return (
    <div className="space-y-5 pb-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-gradient-to-r from-[#7B61FF] to-[#FF5C00] flex items-center justify-center shadow-lg">
          <Sigma className="size-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold font-heading">Buku Usaha</h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">7 cabang usaha terpadu dalam satu platform</p>
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-1">Manajemen Pusat</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {HUB_MENUS.map((m) => {
            const Icon = m.icon;
            return (
              <button key={m.slug} onClick={() => router.push(`/buku-usaha/${m.slug}`)}
                className="premium-card p-3 flex items-center gap-2.5 active:scale-[0.97] transition-all text-left group">
                <div className="size-9 rounded-lg bg-gradient-to-r from-[#7B61FF]/10 to-[#FF5C00]/10 flex items-center justify-center shrink-0 group-hover:from-[#7B61FF]/20 group-hover:to-[#FF5C00]/20 transition-all">
                  <Icon className="size-4 text-[#7B61FF]" />
                </div>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-1">Cabang Usaha</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BRANCHES.map((b) => {
            const Icon = b.icon;
            return (
              <div key={b.slug} className="premium-card overflow-hidden">
                <button onClick={() => router.push(`/buku-usaha/${b.slug}/dashboard`)}
                  className="w-full flex items-center gap-3 p-4 active:scale-[0.97] transition-all text-left">
                  <div className={`size-10 rounded-xl bg-gradient-to-r ${b.color} flex items-center justify-center shrink-0 shadow-md`}>
                    <Icon className="size-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{b.label}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-slate-400">Dashboard</span>
                    </div>
                  </div>
                  <LayoutDashboard className="size-4 text-slate-300 dark:text-slate-600" />
                </button>
                <div className="flex border-t border-slate-100 dark:border-slate-800/60">
                  <button onClick={() => router.push(`/buku-usaha/${b.slug}/dashboard`)}
                    className="flex-1 py-2.5 text-[10px] text-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-all active:scale-[0.97] font-medium">
                    Dashboard
                  </button>
                  <button onClick={() => router.push(`/buku-usaha/${b.slug}/kasir`)}
                    className="flex-1 py-2.5 text-[10px] text-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-all active:scale-[0.97] font-medium border-x border-slate-100 dark:border-slate-800/60">
                    Kasir
                  </button>
                  <button onClick={() => router.push(`/buku-usaha/${b.slug}/transaksi`)}
                    className="flex-1 py-2.5 text-[10px] text-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-all active:scale-[0.97] font-medium">
                    Aktivitas
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
