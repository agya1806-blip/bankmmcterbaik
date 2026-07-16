"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/store/useSessionStore";

const branches = [
  { slug: "percetakan", label: "Percetakan", color: "from-blue-500 to-blue-600", icon: "🖨️" },
  { slug: "laptop", label: "Laptop & Servis", color: "from-violet-500 to-purple-600", icon: "💻" },
  { slug: "gadget", label: "Gadget", color: "from-indigo-500 to-indigo-600", icon: "📱" },
  { slug: "warkop", label: "Warkop & Kuliner", color: "from-orange-400 to-orange-500", icon: "☕" },
  { slug: "kelontong", label: "Kelontong", color: "from-emerald-400 to-emerald-500", icon: "🛒" },
  { slug: "konveksi", label: "Konveksi", color: "from-pink-400 to-pink-500", icon: "🧵" },
  { slug: "toko-pakaian", label: "Toko Pakaian", color: "from-rose-400 to-rose-500", icon: "👔" },
];

export default function BukuUsahaPage() {
  const router = useRouter();
  const { setBranch } = useSessionStore();

  const handleSelect = (slug: string) => {
    setBranch(slug);
    router.push(`/buku-usaha/${slug}`);
  };

  return (
    <div className="flex flex-col gap-6 pt-8 pb-4 animate-fade-in">
      <div className="text-center">
        <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-[#7B61FF] to-[#FF5C00] bg-clip-text text-transparent">
          Pilih Unit Usaha
        </h1>
        <p className="text-xs text-slate-500 mt-1">Pilih cabang yang ingin dikelola</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {branches.map((b) => (
          <button
            key={b.slug}
            onClick={() => handleSelect(b.slug)}
            className={`premium-card p-4 flex flex-col items-center gap-2 active:scale-[0.97] transition-transform cursor-pointer`}
          >
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${b.color} flex items-center justify-center text-xl shadow-lg`}>
              {b.icon}
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{b.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
