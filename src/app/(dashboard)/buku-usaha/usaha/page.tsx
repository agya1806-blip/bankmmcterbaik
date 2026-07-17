"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "@/hooks/useLiveQuery";
import { db, type BookOrBranch } from "@/lib/db-v4";
import { useSessionStore } from "@/store/useSessionStore";

interface UnitUsaha {
  slug: string;
  label: string;
  icon: string;
  color: string;
  bookId: BookOrBranch;
}

const USAHA_UNITS: UnitUsaha[] = [
  { slug: "percetakan", label: "Percetakan", icon: "🖨️", color: "from-blue-500 to-blue-600", bookId: "usaha-percetakan" },
  { slug: "gadget", label: "Gadget", icon: "📱", color: "from-indigo-500 to-indigo-600", bookId: "usaha-gadget" },
  { slug: "laptop", label: "Komputer & Laptop", icon: "💻", color: "from-violet-500 to-purple-600", bookId: "usaha-laptop" },
  { slug: "warkop", label: "Kedai Kopi", icon: "☕", color: "from-orange-400 to-orange-500", bookId: "usaha-warkop" },
  { slug: "konveksi", label: "Fashion & Konveksi", icon: "👔", color: "from-pink-400 to-pink-500", bookId: "usaha-konveksi" },
];

export default function BukuUsahaListPage() {
  const router = useRouter();
  const { setBranch } = useSessionStore();

  const allTransactions = useLiveQuery(() => db.transactions.toArray()) || [];
  const allCashflows = useLiveQuery(() => db.cashflows.toArray()) || [];
  const allInventory = useLiveQuery(() => db.inventory.toArray()) || [];
  const allWallets = useLiveQuery(() => db.wallets.toArray()) || [];

  const unitStats = useMemo(() => {
    return USAHA_UNITS.map((u) => {
      const txs = allTransactions.filter((tx) => tx.bookOrBranchId === u.bookId);
      const cf = allCashflows.filter((c) => c.bookOrBranchId === u.bookId);
      const inv = allInventory.filter((i) => i.bookOrBranchId === u.bookId);
      const wallets = allWallets.filter((w) => w.bookOrBranchId === u.bookId);

      const masuk = cf.filter((c) => c.tipe === "masuk").reduce((s, c) => s + c.nominal, 0);
      const keluar = cf.filter((c) => c.tipe === "keluar").reduce((s, c) => s + c.nominal, 0);
      const saldo = wallets.reduce((s, w) => s + w.saldo, 0);
      const stokMenipis = inv.filter((i) => i.stok <= i.stokMin).length;
      const piutang = txs.filter((tx) => tx.sisaTagihan > 0).reduce((s, tx) => s + tx.sisaTagihan, 0);

      return { ...u, masuk, keluar, saldo, stokMenipis, piutang, jumlahTx: txs.length };
    });
  }, [allTransactions, allCashflows, allInventory, allWallets]);

  const handleSelectUnit = (slug: string, bookId: BookOrBranch) => {
    setBranch(slug);
    router.push(`/buku-usaha/${slug}`);
  };

  return (
    <div className="flex flex-col gap-4 pt-2 pb-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/buku-usaha")}
          className="p-2 bg-white dark:bg-[#131527] rounded-full shadow-md active:scale-95 transition-transform"
        >
          <span className="text-sm">◀️</span>
        </button>
        <div className="text-center">
          <h1 className="text-lg font-heading font-extrabold tracking-tight">🏢 Buku Usaha</h1>
          <p className="text-[9px] text-slate-400">{USAHA_UNITS.length} unit usaha</p>
        </div>
        <div className="w-9 h-9" />
      </div>

      {/* Stats Global Usaha */}
      <div className="premium-card p-4 bg-gradient-to-br from-amber-400/10 to-orange-500/10 dark:from-amber-400/5 dark:to-orange-500/5">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-[9px] text-slate-400 font-bold uppercase">Total Masuk</p>
            <p className="text-xs font-extrabold text-emerald-500">
              Rp{unitStats.reduce((s, u) => s + u.masuk, 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-[9px] text-slate-400 font-bold uppercase">Total Keluar</p>
            <p className="text-xs font-extrabold text-rose-500">
              Rp{unitStats.reduce((s, u) => s + u.keluar, 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-[9px] text-slate-400 font-bold uppercase">Total Saldo</p>
            <p className="text-xs font-extrabold text-[#7B61FF]">
              Rp{unitStats.reduce((s, u) => s + u.saldo, 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Unit Usaha Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {unitStats.map((u, i) => (
          <button
            key={u.slug}
            onClick={() => handleSelectUnit(u.slug, u.bookId)}
            className="premium-card premium-card-glow p-3 text-left scale-press animate-slide-up"
            style={{ animationDelay: `${100 + i * 60}ms`, animationFillMode: "backwards" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${u.color} flex items-center justify-center text-lg shadow-md`}>
                {u.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-heading font-bold line-clamp-1">{u.label}</p>
                <p className="text-[9px] text-slate-400">{u.jumlahTx} transaksi</p>
              </div>
              <span className="text-xs text-slate-300">▶</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg px-2 py-1">
                <p className="text-[8px] text-emerald-600 font-bold">Masuk</p>
                <p className="text-[10px] font-heading font-extrabold text-emerald-600 dark:text-emerald-400">Rp{(u.masuk / 1000).toFixed(0)}rb</p>
              </div>
              <div className="bg-rose-50 dark:bg-rose-950/20 rounded-lg px-2 py-1">
                <p className="text-[8px] text-rose-600 font-bold">Keluar</p>
                <p className="text-[10px] font-heading font-extrabold text-rose-600 dark:text-rose-400">Rp{(u.keluar / 1000).toFixed(0)}rb</p>
              </div>
            </div>
            {(u.stokMenipis > 0 || u.piutang > 0) && (
              <div className="flex gap-1.5 mt-1.5">
                {u.stokMenipis > 0 && <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 font-bold">{u.stokMenipis} stok tipis</span>}
                {u.piutang > 0 && <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 font-bold">piutang</span>}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
