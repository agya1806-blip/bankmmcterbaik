"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, User, Home, Building2, Menu } from "lucide-react";
import { cn } from "@/components/ui/cn";

interface BottomNavProps {
  onMenuClick?: () => void;
}

export default function BottomNav({ onMenuClick }: BottomNavProps) {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/");

  const items = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/" },
    { label: "Pribadi", icon: User, href: "/buku-pribadi" },
    { label: "Keluarga", icon: Home, href: "/buku-keluarga" },
    { label: "Bisnis", icon: Building2, href: "/buku-bisnis" },
  ];

  return (
    <div className="fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[400px] h-16 bg-white/90 dark:bg-[#131527]/90 backdrop-blur-xl rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-2xl z-40 flex items-center justify-around px-2 transition-all duration-300 pb-safe">
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

      {/* Menu button (opens sidebar on mobile) */}
      <button
        onClick={onMenuClick}
        className="relative flex flex-col items-center justify-center w-14 h-14 active:scale-90 transition-transform"
      >
        <Menu className="w-5 h-5 text-slate-400 dark:text-slate-500" />
        <span className="text-[9px] mt-0.5 font-semibold text-slate-400 dark:text-slate-500">Menu</span>
      </button>
    </div>
  );
}
