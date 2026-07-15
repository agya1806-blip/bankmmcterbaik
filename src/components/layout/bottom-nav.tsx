"use client";

import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, Briefcase, ArrowRightLeft, Bot, Globe, User, Users } from "lucide-react";

const ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, color: "text-emerald-400" },
  { href: "/buku-pribadi", label: "Pribadi", icon: User, color: "text-sky-400" },
  { href: "/buku-keluarga", label: "Keluarga", icon: Users, color: "text-amber-400" },
  { href: "/buku-usaha", label: "Usaha", icon: Briefcase, color: "text-violet-400" },
  { href: "/buku-global", label: "Global", icon: Globe, color: "text-emerald-400" },
  { href: "/mutasi-antar-buku", label: "Transfer", icon: ArrowRightLeft, color: "text-cyan-400" },
  { href: "/asisten-ai", label: "AI Chat", icon: Bot, color: "text-purple-400" },
];

const NAV_HEIGHT = 64;

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav
      className="byond-bottom-nav"
      style={{ height: NAV_HEIGHT + "px" }}
    >
      <div className="flex items-center justify-around px-1 h-full">
        {ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className="relative flex flex-col items-center justify-center gap-0 px-1 rounded-xl min-w-0 flex-1 active:scale-90 transition-transform duration-150"
              style={{ minHeight: 44, minWidth: 40 }}
            >
              <div
                className={`flex items-center justify-center size-8 rounded-xl transition-all duration-200 ${
                  active ? "bg-slate-800 text-white" : "text-slate-500"
                }`}
              >
                <Icon className={`size-4 transition-colors duration-200 ${active ? item.color : ""}`} />
              </div>
              <span
                className={`text-[8px] font-medium leading-tight transition-colors duration-200 ${
                  active ? "text-slate-200 font-semibold" : "text-slate-500"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
