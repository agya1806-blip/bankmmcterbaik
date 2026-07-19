"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, BookOpen, Receipt, BarChart3, User } from "lucide-react";
import { cn } from "@/components/ui/cn";

export default function BottomNav() {
  const pathname = usePathname();

  const getTransaksiUrl = () => {
    if (pathname.startsWith("/buku-pribadi")) return "/buku-pribadi/cashflow";
    if (pathname.startsWith("/buku-keluarga")) return "/buku-keluarga/cashflow";
    const match = pathname.match(/^\/buku-bisnis\/([^\/]+)/);
    if (match) return `/buku-bisnis/${match[1]}/transaksi`;
    return "/buku";
  };

  const getLaporanUrl = () => {
    if (pathname.startsWith("/buku-pribadi")) return "/buku-pribadi";
    if (pathname.startsWith("/buku-keluarga")) return "/buku-keluarga";
    const match = pathname.match(/^\/buku-bisnis\/([^\/]+)/);
    if (match) return `/buku-bisnis/${match[1]}/laporan`;
    return "/buku";
  };

  const items = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/" },
    { label: "Buku", icon: BookOpen, href: "/buku" },
    { label: "Transaksi", icon: Receipt, href: getTransaksiUrl() },
    { label: "Laporan", icon: BarChart3, href: getLaporanUrl() },
    { label: "Profil", icon: User, href: "/profile" },
  ];

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/");

  return (
    <div className="fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[500px] h-16 bg-white/90 dark:bg-[#131527]/90 backdrop-blur-xl rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-2xl z-40 flex items-center justify-around px-1 transition-all duration-300 pb-safe">
      {items.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.label}
            href={item.href}
            className="relative flex flex-col items-center justify-center w-14 h-14 active:scale-90 transition-transform"
          >
            <item.icon
              className={cn(
                "w-5 h-5 transition-colors duration-200",
                active ? "text-[#008CEB]" : "text-slate-400 dark:text-slate-500"
              )}
            />
            <span
              className={cn(
                "text-[9px] mt-0.5 font-semibold transition-colors duration-200",
                active ? "text-[#008CEB]" : "text-slate-400 dark:text-slate-500"
              )}
            >
              {item.label}
            </span>
            {active && (
              <motion.div
                layoutId="nav-dot"
                className="absolute -bottom-0.5 w-1.5 h-1.5 bg-[#008CEB] rounded-full"
              />
            )}
          </Link>
        );
      })}
    </div>
  );
}
