"use client";
import React, { useMemo } from "react";
import { Users, UserCheck, UserPlus, BanknoteIcon, Star } from "lucide-react";
import type { Customer, DbPiutang } from "./customer-types";

interface CustomerSummaryCardsProps {
  customers: Customer[];
  allPiutang: DbPiutang[];
}

export function CustomerSummaryCards({ customers, allPiutang }: CustomerSummaryCardsProps) {
  const stats = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const totalPiutang = allPiutang.reduce((sum, p) => sum + p.sisaPiutang, 0);

    let aktifCount = 0;
    let baruBulanIni = 0;
    let rewardAktif = 0;

    for (const c of customers) {
      if (c.poin > 0) rewardAktif++;
      if (c.createdAt && new Date(c.createdAt) >= startOfMonth) baruBulanIni++;
      if (c.terakhirTransaksi) {
        const daysSince = Math.floor((now.getTime() - new Date(c.terakhirTransaksi).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSince <= 90) aktifCount++;
      }
    }

    return { total: customers.length, aktif: aktifCount, baruBulanIni, totalPiutang, rewardAktif };
  }, [customers, allPiutang]);

  const cards = [
    { label: "Total Customer", value: stats.total.toLocaleString(), icon: <Users className="w-4 h-4" />, color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600" },
    { label: "Customer Aktif", value: stats.aktif.toLocaleString(), icon: <UserCheck className="w-4 h-4" />, color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600" },
    { label: "Baru Bulan Ini", value: stats.baruBulanIni.toLocaleString(), icon: <UserPlus className="w-4 h-4" />, color: "bg-violet-100 dark:bg-violet-900/30 text-violet-600" },
    { label: "Total Piutang", value: `Rp${stats.totalPiutang.toLocaleString()}`, icon: <BanknoteIcon className="w-4 h-4" />, color: "bg-amber-100 dark:bg-amber-900/30 text-amber-600" },
    { label: "Reward Aktif", value: stats.rewardAktif.toLocaleString(), icon: <Star className="w-4 h-4" />, color: "bg-rose-100 dark:bg-rose-900/30 text-rose-600" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
      {cards.map((card, idx) => (
        <div key={idx} className="bg-white dark:bg-[#1a1b2e] rounded-2xl p-3 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col gap-1.5">
          <div className={`w-7 h-7 rounded-xl ${card.color} flex items-center justify-center`}>
            {card.icon}
          </div>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{card.label}</span>
          <p className="text-sm font-heading font-extrabold text-slate-800 dark:text-slate-200">{card.value}</p>
        </div>
      ))}
    </div>
  );
}