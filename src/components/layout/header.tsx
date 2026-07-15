"use client";

import { usePathname } from "next/navigation";
import { Search, LogOut, ChevronRight } from "lucide-react";
import { useSessionStore } from "@/store/useSessionStore";

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

export default function Header(_props: HeaderProps) {
  const pathname = usePathname();
  const { clearSession } = useSessionStore();

  const segments = pathname.split("/").filter(Boolean);
  const pageTitle =
    segments.length === 0
      ? "Dashboard"
      : segments
          .map((s) => s.replace(/-/g, " "))
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
          .join(" / ");

  return (
    <header className="byond-header">
      <div className="flex items-center gap-2 min-w-0">
        <div className="size-8 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
          <span className="text-emerald-400 font-bold text-xs">M</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-400 min-w-0">
          <span className="font-semibold text-slate-300">MMCBANK</span>
          {segments.length > 0 && (
            <>
              <ChevronRight className="size-3 shrink-0" />
              <span className="truncate font-medium">{pageTitle}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button className="flex items-center justify-center size-9 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-all active:scale-90">
          <Search className="size-4" />
        </button>
        <button
          onClick={() => { clearSession(); window.location.href = "/login"; }}
          className="flex items-center justify-center size-9 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all active:scale-90"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </header>
  );
}
