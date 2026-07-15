"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db, BOOK_LABELS, BRANCH_SLUGS, type BookOrBranch } from "@/lib/db-v4";
import {
  Wallet, TrendingUp, BookUser, Briefcase, HeartHandshake,
  BookOpen, ArrowRight, Plus, Building2,
} from "lucide-react";

interface BookCard {
  id: string;
  label: string;
  desc: string;
  icon: React.ElementType;
  gradient: string;
  route: string;
  key: string;
}

const BOOKS: BookCard[] = [
  {
    id: "buku-pribadi", label: "Buku Pribadi", desc: "Keuangan pribadi & tabungan",
    icon: BookUser, gradient: "from-emerald-500 to-emerald-600",
    route: "/buku-pribadi", key: "pribadi",
  },
  {
    id: "buku-keluarga", label: "Buku Keluarga", desc: "Keuangan keluarga",
    icon: Building2, gradient: "from-blue-500 to-blue-600",
    route: "/buku-keluarga", key: "keluarga",
  },
  {
    id: "buku-usaha", label: "Buku Usaha", desc: "7 cabang: Percetakan, Gadget, Laptop, Warkop, Kelontong, Konveksi, Pakaian",
    icon: Briefcase, gradient: "from-violet-500 to-violet-600",
    route: "/buku-usaha", key: "usaha",
  },
  {
    id: "buku-sedekah", label: "Buku Sedekah", desc: "Zakat, infak, sedekah",
    icon: HeartHandshake, gradient: "from-emerald-500 to-teal-500",
    route: "", key: "sedekah",
  },
  {
    id: "buku-catatan", label: "Catatan Lainnya", desc: "Hutang/piutang, memo digital",
    icon: BookOpen, gradient: "from-amber-500 to-orange-500",
    route: "", key: "catatan",
  },
];

export default function BukuKeuanganGlobal() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [saldoPerBuku, setSaldoPerBuku] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    (async () => {
      try {
        const allWallets = await db.wallets.where("isActive").equals(1).toArray();
        const grouped: Record<string, number> = {};
        for (const w of allWallets) {
          const key = w.bookOrBranchId;
          grouped[key] = (grouped[key] ?? 0) + w.saldo;
        }
        // Aggregate branch wallets into "usaha"
        let usahaTotal = 0;
        for (const slug of BRANCH_SLUGS) {
          usahaTotal += grouped[slug] ?? 0;
        }
        grouped["usaha"] = (grouped["usaha"] ?? 0) + usahaTotal;
        setSaldoPerBuku(grouped);
      } catch (e) {
        // DB might be empty — that's fine
      } finally {
        setLoading(false);
      }
    })();
  }, [mounted]);

  if (!mounted || loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded-lg bg-slate-800/50" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-800/30" />
          ))}
        </div>
      </div>
    );
  }

  const totalKekayaan = Object.values(saldoPerBuku).reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-6 pb-4">
      {/* Header Global */}
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-emerald-500/25">
          M
        </div>
        <div>
          <h1 className="text-lg font-bold font-heading">Buku Keuangan Global</h1>
          <p className="text-xs text-slate-400">Konsolidasi seluruh aset</p>
        </div>
      </div>

      {/* Total Kekayaan */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/60 p-5">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Total Kekayaan</p>
        <p className="text-3xl font-bold font-heading tabular-nums mt-1 text-emerald-400">
          Rp{totalKekayaan.toLocaleString("id-ID")}
        </p>
        <div className="flex gap-3 mt-3 flex-wrap">
          {Object.entries(saldoPerBuku).map(([key, saldo]) => {
            if (key === "usaha" || BRANCH_SLUGS.includes(key as BookOrBranch)) return null;
            return (
              <div key={key} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/50 text-[9px]">
                <Wallet className="size-3 text-emerald-400/60" />
                <span className="font-medium text-slate-300">{BOOK_LABELS[key as BookOrBranch] ?? key}</span>
                <span className="tabular-nums font-semibold text-slate-100">Rp{saldo.toLocaleString("id-ID")}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Buku Cards */}
      <div className="grid grid-cols-2 gap-3">
        {BOOKS.map((b) => {
          const Icon = b.icon;
          return (
            <button
              key={b.id}
              onClick={() => b.route && router.push(b.route)}
              disabled={!b.route}
              className="relative overflow-hidden rounded-2xl p-4 text-left bg-slate-900/80 border border-slate-800/60 active:scale-[0.97] transition-all disabled:opacity-50"
            >
              <div className={`size-10 rounded-xl bg-gradient-to-br ${b.gradient} flex items-center justify-center mb-3 shadow-lg`}>
                <Icon className="size-5 text-white" />
              </div>
              <h3 className="text-sm font-bold font-heading mb-0.5">{b.label}</h3>
              <p className="text-[10px] text-slate-400 leading-tight">{b.desc}</p>
              {saldoPerBuku[b.key] !== undefined && (
                <p className="text-xs font-semibold tabular-nums mt-2 text-emerald-400">
                  Rp{saldoPerBuku[b.key].toLocaleString("id-ID")}
                </p>
              )}
              {b.route && (
                <div className="absolute bottom-3 right-3 size-6 rounded-full bg-slate-800/80 flex items-center justify-center">
                  <ArrowRight className="size-3 text-slate-400" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
