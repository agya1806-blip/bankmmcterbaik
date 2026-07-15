"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Printer, Monitor, Smartphone, Coffee, Store, Shirt, Tags,
  Wallet, BarChart3, Settings, Users, Sigma,
} from "lucide-react";

const BRANCHES = [
  { slug: "percetakan", label: "Percetakan", icon: Printer, color: "text-violet-400", bg: "bg-violet-500/10" },
  { slug: "laptop", label: "Laptop / PC", icon: Monitor, color: "text-cyan-400", bg: "bg-cyan-500/10" },
  { slug: "gadget", label: "Gadget", icon: Smartphone, color: "text-sky-400", bg: "bg-sky-500/10" },
  { slug: "warkop", label: "Warkop", icon: Coffee, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { slug: "kelontong", label: "Kelontong", icon: Store, color: "text-amber-400", bg: "bg-amber-500/10" },
  { slug: "konveksi", label: "Konveksi", icon: Tags, color: "text-rose-400", bg: "bg-rose-500/10" },
  { slug: "toko-pakaian", label: "Toko Pakaian", icon: Shirt, color: "text-pink-400", bg: "bg-pink-500/10" },
] as const;

const HUB_MENUS = [
  { slug: "pelanggan", label: "Pelanggan Usaha", icon: Users, color: "text-emerald-400" },
  { slug: "dompet", label: "Dompet Usaha", icon: Wallet, color: "text-emerald-400" },
  { slug: "laporan-keuangan", label: "Laporan Usaha", icon: BarChart3, color: "text-emerald-400" },
  { slug: "pengaturan", label: "Pengaturan", icon: Settings, color: "text-emerald-400" },
];

export default function BukuUsahaLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const isRoot = pathname === "/buku-usaha";

  if (!isRoot) {
    return <>{children}</>;
  }

  return (
    <div className="space-y-6 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
          <Sigma className="size-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold font-heading">Buku Usaha</h1>
          <p className="text-xs text-slate-400">7 cabang usaha terpadu</p>
        </div>
      </div>

      {/* Hub Menus */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Manajemen Usaha</h2>
        <div className="grid grid-cols-2 gap-3">
          {HUB_MENUS.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.slug}
                onClick={() => router.push(`/buku-usaha/${m.slug}`)}
                className="flex items-center gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800/60 active:scale-[0.97] transition-all text-left"
              >
                <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Icon className="size-5 text-emerald-400" />
                </div>
                <span className="text-sm font-medium">{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 7 Branches */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Cabang Usaha</h2>
        <div className="grid grid-cols-2 gap-3">
          {BRANCHES.map((b) => {
            const Icon = b.icon;
            return (
              <button
                key={b.slug}
                onClick={() => router.push(`/buku-usaha/${b.slug}/dashboard`)}
                className={"flex items-center gap-3 p-4 rounded-2xl " + b.bg + " border border-slate-800/40 active:scale-[0.97] transition-all text-left"}
              >
                <div className={"size-10 rounded-xl " + b.bg + " flex items-center justify-center shrink-0"}>
                  <Icon className={"size-5 " + b.color} />
                </div>
                <span className={"text-sm font-medium " + b.color}>{b.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
