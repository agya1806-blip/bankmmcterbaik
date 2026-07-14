"use client";

import { useRouter } from "next/navigation";
import { Printer, Smartphone, Coffee, Shirt, Wallet, Settings, BarChart3, Package, Users } from "lucide-react";

const UNIT_LIST: { id: string; label: string; desc: string; icon: React.ElementType; grad: string; glow: string; route: string; }[] = [
  { id: "percetakan", label: "Percetakan", desc: "Digital Printing & Large Format", icon: Printer, grad: "from-indigo-500 to-purple-600", glow: "shadow-indigo-500/25", route: "/buku-usaha/percetakan/dashboard" },
  { id: "gadget-laptop", label: "Gadget & Laptop", desc: "HP, Laptop/PC Rakitan, Tablet & Aksesoris", icon: Smartphone, grad: "from-cyan-500 to-blue-600", glow: "shadow-cyan-500/25", route: "/buku-usaha/gadget-laptop/dashboard" },
  { id: "warkop-kelontong", label: "Warkop & Kelontong", desc: "Kedai Kopi & Retail Modern", icon: Coffee, grad: "from-emerald-500 to-emerald-600", glow: "shadow-emerald-500/25", route: "/buku-usaha/warkop-kelontong/dashboard" },
  { id: "pakaian-konveksi", label: "Pakaian & Konveksi", desc: "Fashion, Jahit & Custom CMT", icon: Shirt, grad: "from-rose-500 to-pink-600", glow: "shadow-rose-500/25", route: "/buku-usaha/pakaian-konveksi/dashboard" },
];

export default function BukuUsahaPage() {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto pb-20 space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="size-12 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-xl shadow-violet-500/20">
          <Printer className="size-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold font-heading">Buku Usaha</h1>
          <p className="text-xs text-muted-foreground/60">Pilih unit bisnis yang ingin dikelola</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {UNIT_LIST.map((unit) => {
          const Ico = unit.icon;
          return (
            <button
              key={unit.id}
              onClick={() => {
                if (unit.route) router.push(unit.route);
                else alert(`Modul ${unit.label} dalam pengembangan`);
              }}
              className="group relative text-left floating-card p-5 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
            >
              <div className="flex items-start gap-4">
                <div className={`size-12 rounded-2xl bg-gradient-to-br ${unit.grad} flex items-center justify-center shrink-0 shadow-lg ${unit.glow} group-hover:scale-105 transition-transform`}>
                  <Ico className="size-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{unit.label}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">{unit.desc}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Navigasi Tools */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button onClick={() => router.push("/buku-usaha/dompet")}
          className="floating-card p-3 flex flex-col items-center gap-1.5 hover:shadow-md active:scale-95 transition-all"
        >
          <div className="size-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
            <Wallet className="size-5 text-white" />
          </div>
          <span className="text-[10px] font-semibold">Dompet Kas</span>
        </button>
        <button onClick={() => router.push("/buku-usaha/inventory")}
          className="floating-card p-3 flex flex-col items-center gap-1.5 hover:shadow-md active:scale-95 transition-all"
        >
          <div className="size-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
            <Package className="size-5 text-white" />
          </div>
          <span className="text-[10px] font-semibold">Manajemen Stok</span>
        </button>
        <button onClick={() => router.push("/buku-usaha/laporan-keuangan")}
          className="floating-card p-3 flex flex-col items-center gap-1.5 hover:shadow-md active:scale-95 transition-all"
        >
          <div className="size-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
            <BarChart3 className="size-5 text-white" />
          </div>
          <span className="text-[10px] font-semibold">Laporan</span>
        </button>
        <button onClick={() => router.push("/buku-usaha/pelanggan")}
          className="floating-card p-3 flex flex-col items-center gap-1.5 hover:shadow-md active:scale-95 transition-all"
        >
          <div className="size-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
            <Users className="size-5 text-white" />
          </div>
          <span className="text-[10px] font-semibold">Pelanggan</span>
        </button>
        <button onClick={() => router.push("/buku-usaha/pengaturan")}
          className="floating-card p-3 flex flex-col items-center gap-1.5 hover:shadow-md active:scale-95 transition-all"
        >
          <div className="size-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shadow-md">
            <Settings className="size-5 text-white" />
          </div>
          <span className="text-[10px] font-semibold">Pengaturan</span>
        </button>
      </div>
    </div>
  );
}
