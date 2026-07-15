"use client";

import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, Briefcase, Wallet, BookUser, Settings } from "lucide-react";

const ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, color: "text-emerald-400" },
  { href: "/buku-usaha", label: "Usaha", icon: Briefcase, color: "text-violet-400" },
  { href: "/buku-pribadi", label: "Pribadi", icon: BookUser, color: "text-sky-400" },
  { href: "/buku-usaha/dompet", label: "Dompet", icon: Wallet, color: "text-amber-400" },
  { href: "/buku-usaha/pengaturan", label: "Settings", icon: Settings, color: "text-slate-400" },
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="byond-bottom-nav">
      <div className="flex items-center justify-around px-2 py-1">
        {ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className="relative flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl min-w-0 transition-all duration-200 flex-1 active:scale-90"
              style={{ minHeight: 44, minWidth: 44 }}
            >
              <div
                className={`flex items-center justify-center size-9 rounded-xl transition-all duration-300 ${
                  active ? "bg-slate-800 text-white translate-y-[-2px]" : "text-slate-500"
                }`}
              >
                <Icon className={`size-5 transition-all duration-200 ${active ? item.color : ""}`} />
              </div>
              <span
                className={`text-[9px] font-medium transition-all duration-200 whitespace-nowrap ${
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
