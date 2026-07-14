"use client";

import { useRouter } from "next/navigation";
import { Printer, Smartphone, Coffee, Shirt, Wallet, Settings, BarChart3, Package, Users, ArrowUpDown, Tag, LayoutDashboard } from "lucide-react";

const UNIT_LIST: { id: string; label: string; icon: React.ElementType; grad: string; glow: string; }[] = [
  { id: "percetakan", label: "Percetakan", icon: Printer, grad: "from-indigo-500 to-purple-600", glow: "shadow-indigo-500/25" },
  { id: "gadget-laptop", label: "Gadget & Laptop", icon: Smartphone, grad: "from-cyan-500 to-blue-600", glow: "shadow-cyan-500/25" },
  { id: "warkop-kelontong", label: "Warkop & Kelontong", icon: Coffee, grad: "from-emerald-500 to-emerald-600", glow: "shadow-emerald-500/25" },
  { id: "pakaian-konveksi", label: "Pakaian & Konveksi", icon: Shirt, grad: "from-rose-500 to-pink-600", glow: "shadow-rose-500/25" },
];

export default function BukuUsahaPage() {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto pb-20 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="size-12 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-xl shadow-violet-500/20">
          <Printer className="size-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold font-heading">Buku Usaha</h1>
          <p className="text-xs text-muted-foreground/60">Pilih unit bisnis yang ingin dikelola</p>
        </div>
      </div>

      {/* ════════════════════════════════════════ */}
      {/* 🔥 KASIR CEPAT */}
      {/* ════════════════════════════════════════ */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Kasir Cepat</h2>
          <span className="text-[10px] text-muted-foreground/40">Langsung ke kasir</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {UNIT_LIST.map((unit) => {
            const Ico = unit.icon;
            return (
              <button
                key={unit.id}
                onClick={() => router.push(`/buku-usaha/${unit.id}/kasir`)}
                className="group relative text-left floating-card p-5 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-200 min-h-[120px] flex flex-col justify-between"
              >
                <div className="flex items-start gap-3">
                  <div className={`size-11 rounded-2xl bg-gradient-to-br ${unit.grad} flex items-center justify-center shrink-0 shadow-lg ${unit.glow} group-hover:scale-105 transition-transform`}>
                    <Ico className="size-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{unit.label}</p>
                    <p className="text-[11px] font-medium text-primary/80 mt-1">Buka Kasir</p>
                  </div>
                </div>

                {/* Dashboard link (small, doesn't interfere) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/buku-usaha/${unit.id}/dashboard`);
                  }}
                  className="self-end text-[10px] text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors flex items-center gap-1"
                >
                  <LayoutDashboard className="size-3" />
                  Dashboard
                </button>
              </button>
            );
          })}
        </div>
      </section>

      {/* ════════════════════════════════════════ */}
      {/* ⚙️ ADMIN */}
      {/* ════════════════════════════════════════ */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-3">Admin</h2>

        {/* Primary tools */}
        <div className="grid grid-cols-3 gap-2 mb-2">
          <button onClick={() => router.push("/buku-usaha/dompet")}
            className="floating-card p-3.5 flex flex-col items-center gap-2 hover:shadow-md active:scale-95 transition-all"
          >
            <div className="size-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
              <Wallet className="size-5 text-white" />
            </div>
            <span className="text-[11px] font-semibold">Dompet</span>
          </button>
          <button onClick={() => router.push("/buku-usaha/inventory")}
            className="floating-card p-3.5 flex flex-col items-center gap-2 hover:shadow-md active:scale-95 transition-all"
          >
            <div className="size-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
              <Package className="size-5 text-white" />
            </div>
            <span className="text-[11px] font-semibold">Stok</span>
          </button>
          <button onClick={() => router.push("/buku-usaha/laporan-keuangan")}
            className="floating-card p-3.5 flex flex-col items-center gap-2 hover:shadow-md active:scale-95 transition-all"
          >
            <div className="size-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
              <BarChart3 className="size-5 text-white" />
            </div>
            <span className="text-[11px] font-semibold">Laporan</span>
          </button>
        </div>

        {/* Secondary tools */}
        <div className="grid grid-cols-4 gap-2">
          <button onClick={() => router.push("/buku-usaha/pelanggan")}
            className="floating-card p-2.5 flex flex-col items-center gap-1.5 hover:shadow-sm active:scale-95 transition-all"
          >
            <div className="size-8 rounded-lg bg-gradient-to-br from-amber-500/70 to-orange-600/70 flex items-center justify-center shadow-sm">
              <Users className="size-4 text-white" />
            </div>
            <span className="text-[9px] font-medium text-muted-foreground/80">Pelanggan</span>
          </button>
          <button onClick={() => router.push("/buku-usaha/piutang")}
            className="floating-card p-2.5 flex flex-col items-center gap-1.5 hover:shadow-sm active:scale-95 transition-all"
          >
            <div className="size-8 rounded-lg bg-gradient-to-br from-red-500/70 to-rose-600/70 flex items-center justify-center shadow-sm">
              <ArrowUpDown className="size-4 text-white" />
            </div>
            <span className="text-[9px] font-medium text-muted-foreground/80">Piutang</span>
          </button>
          <button onClick={() => router.push("/buku-usaha/labels")}
            className="floating-card p-2.5 flex flex-col items-center gap-1.5 hover:shadow-sm active:scale-95 transition-all"
          >
            <div className="size-8 rounded-lg bg-gradient-to-br from-pink-500/70 to-rose-600/70 flex items-center justify-center shadow-sm">
              <Tag className="size-4 text-white" />
            </div>
            <span className="text-[9px] font-medium text-muted-foreground/80">Label</span>
          </button>
          <button onClick={() => router.push("/buku-usaha/pengaturan")}
            className="floating-card p-2.5 flex flex-col items-center gap-1.5 hover:shadow-sm active:scale-95 transition-all"
          >
            <div className="size-8 rounded-lg bg-gradient-to-br from-slate-500/70 to-slate-600/70 flex items-center justify-center shadow-sm">
              <Settings className="size-4 text-white" />
            </div>
            <span className="text-[9px] font-medium text-muted-foreground/80">Atur</span>
          </button>
        </div>
      </section>
    </div>
  );
}
