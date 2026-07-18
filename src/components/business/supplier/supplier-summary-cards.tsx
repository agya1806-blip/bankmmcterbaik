"use client";
import React from "react";
import { Building2, Users, UserPlus, CreditCard, Star } from "lucide-react";

interface SupplierSummaryCardsProps {
  totalSupplier: number;
  supplierAktif: number;
  supplierBaru: number;
  totalHutang: number;
  supplierFavorit: string;
}

export function SupplierSummaryCards({
  totalSupplier,
  supplierAktif,
  supplierBaru,
  totalHutang,
  supplierFavorit,
}: SupplierSummaryCardsProps) {
  const cards = [
    {
      label: "Total Supplier",
      value: String(totalSupplier),
      icon: <Building2 className="w-4 h-4" />,
      color: "from-[#008CEB] to-[#00C9A7]",
    },
    {
      label: "Supplier Aktif",
      value: String(supplierAktif),
      icon: <Users className="w-4 h-4" />,
      color: "from-emerald-500 to-emerald-600",
    },
    {
      label: "Supplier Baru",
      value: String(supplierBaru),
      icon: <UserPlus className="w-4 h-4" />,
      color: "from-violet-500 to-violet-600",
    },
    {
      label: "Total Hutang",
      value: `Rp${totalHutang.toLocaleString()}`,
      icon: <CreditCard className="w-4 h-4" />,
      color: "from-amber-500 to-orange-500",
    },
    {
      label: "Favorit",
      value: supplierFavorit || "—",
      icon: <Star className="w-4 h-4" />,
      color: "from-yellow-400 to-amber-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
      {cards.map((c) => (
        <div
          key={c.label}
          className="premium-card premium-card-glow p-3 flex flex-col gap-1.5 animate-fade-in"
        >
          <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center text-white shadow-sm`}>
            {c.icon}
          </div>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{c.label}</span>
          <span className="text-sm font-heading font-extrabold truncate">{c.value}</span>
        </div>
      ))}
    </div>
  );
}
