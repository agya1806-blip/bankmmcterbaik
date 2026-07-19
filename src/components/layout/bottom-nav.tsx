"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, BookOpen, Receipt, BarChart3, User } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/buku", icon: BookOpen, label: "Buku" },
  { href: "/buku", icon: Receipt, label: "Transaksi", dynamic: true },
  { href: "/buku", icon: BarChart3, label: "Laporan", dynamic: true },
  { href: "/profile", icon: User, label: "Profil" },
];

export default function BottomNav() {
  const pathname = usePathname();

  const getHref = (item: typeof NAV_ITEMS[0]) => {
    if (!item.dynamic) return item.href;
    if (pathname.startsWith("/buku-pribadi")) return "/buku-pribadi/cashflow";
    if (pathname.startsWith("/buku-keluarga")) return "/buku-keluarga/cashflow";
    const match = pathname.match(/^\/buku-bisnis\/([^/]+)/);
    if (match) {
      if (item.label === "Transaksi") return `/buku-bisnis/${match[1]}/transaksi`;
      if (item.label === "Laporan") return `/buku-bisnis/${match[1]}/laporan`;
    }
    return "/buku";
  };

  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <nav className="glass-nav safe-area-inset-bottom">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const href = getHref(item);
          const active = item.dynamic ? false : isActive(href);
          return (
            <Link key={item.label} href={href} className="relative flex flex-col items-center justify-center w-14 h-full gap-0.5">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200 ${active ? "bg-emerald-50 dark:bg-emerald-950/30" : ""}`}>
                <Icon className={`w-5 h-5 transition-colors duration-200 ${active ? "text-emerald-500" : "text-slate-400 dark:text-slate-500"}`} />
              </div>
              <span className={`text-[9px] font-bold transition-colors duration-200 ${active ? "text-emerald-500" : "text-slate-400 dark:text-slate-500"}`}>{item.label}</span>
              {active && <motion.div layoutId="nav-active" className="absolute -top-0.5 w-6 h-0.5 rounded-full bg-emerald-500" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
