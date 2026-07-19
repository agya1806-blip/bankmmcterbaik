"use client";

import { User, Home, Building2, ChevronRight, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";

const BOOKS = [
  {
    label: "Buku Pribadi",
    desc: "Keuangan pribadi",
    icon: <User className="w-6 h-6 text-white" />,
    gradient: "from-slate-500 to-slate-600",
    route: "/buku-pribadi",
  },
  {
    label: "Buku Keluarga",
    desc: "Keuangan keluarga",
    icon: <Home className="w-6 h-6 text-white" />,
    gradient: "from-rose-400 to-rose-500",
    route: "/buku-keluarga",
  },
  {
    label: "Buku Bisnis",
    desc: "Kelola unit usaha & bisnis",
    icon: <Building2 className="w-6 h-6 text-white" />,
    gradient: "from-amber-400 to-orange-500",
    route: "/buku-bisnis",
  },
];

export default function BukuPage() {
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col gap-6 pt-2 pb-8 animate-fade-in max-w-xl mx-auto w-full">
      {/* header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#008CEB] to-[#00C9A7] flex items-center justify-center text-white shadow-md">
          <BookOpen className="w-5 h-5" />
        </div>
        <h1 className="text-2xl font-heading font-extrabold tracking-tight">Pilih Buku</h1>
      </div>

      {/* cards */}
      <div className="flex flex-col gap-4">
        {BOOKS.map((b) => (
          <button
            key={b.route}
            onClick={() => router.push(b.route)}
            className="bg-white dark:bg-[#131527] rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 active:scale-[0.98] transition-all text-left"
          >
            <div
              className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${b.gradient} flex items-center justify-center text-white shadow-md shrink-0`}
            >
              {b.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold">{b.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{b.desc}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
