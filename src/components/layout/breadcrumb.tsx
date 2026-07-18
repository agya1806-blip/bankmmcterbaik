"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui/cn";

const LABEL_MAP: Record<string, string> = {
  "buku-usaha": "Dashboard",
  "buku-global": "Buku Global",
  "buku-pribadi": "Buku Pribadi",
  "buku-keluarga": "Buku Keluarga",
  profile: "Profile",
  kasir: "Kasir",
  inventory: "Inventory",
  produksi: "Produksi",
  pelanggan: "Pelanggan",
  supplier: "Supplier",
  dompet: "Dompet",
  cashflow: "Cashflow",
  transfer: "Transfer",
  transaksi: "Transaksi",
  laporan: "Laporan",
  pengaturan: "Pengaturan",
  users: "User",
  usaha: "Unit Usaha",
  label: "Label",
  "purchase-order": "Purchase Order",
  "exchange-rate": "Exchange Rate",
  sedekah: "Sedekah",
  period: "Periode",
  recurring: "Recurring",
  budget: "Anggaran",
};

function segmentLabel(seg: string): string {
  const slug = seg.startsWith("[") ? seg.slice(1, -1) : seg;
  return LABEL_MAP[slug] || slug.charAt(0).toUpperCase() + slug.slice(1);
}

interface BreadcrumbProps {
  className?: string;
  homeLabel?: string;
}

export function Breadcrumb({ className, homeLabel = "Dashboard" }: BreadcrumbProps) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const items: { label: string; href: string }[] = [];
  let accum = "";
  for (const seg of segments) {
    accum += "/" + seg;
    const label = seg === segments[0] ? homeLabel : segmentLabel(seg);
    items.push({ label, href: accum });
  }

  return (
    <nav className={cn("flex items-center gap-1.5 text-[10px] text-slate-400", className)} aria-label="Breadcrumb">
      {items.map((item, i) => (
        <React.Fragment key={item.href}>
          {i > 0 && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300 dark:text-slate-600">
              <path d="M9 18l6-6-6-6" />
            </svg>
          )}
          {i === items.length - 1 ? (
            <span className="font-bold text-slate-600 dark:text-slate-300 truncate max-w-[120px]">
              {item.label}
            </span>
          ) : (
            <span className="text-slate-400 truncate max-w-[80px]">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
