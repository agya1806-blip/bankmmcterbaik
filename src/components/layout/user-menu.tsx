"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/store/useSessionStore";
import { useThemeStore } from "@/store/useThemeStore";
import { cn } from "@/components/ui/cn";
import { User, Moon, Sun, LogOut, ChevronDown } from "lucide-react";

export function UserMenu() {
  const router = useRouter();
  const { currentUser, logout } = useSessionStore();
  const { theme, toggleTheme } = useThemeStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    if (!confirm("Yakin ingin logout?")) return;
    logout();
    router.push("/login");
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 h-10 px-3 rounded-xl bg-white dark:bg-[#131527] border border-slate-100 dark:border-slate-800",
          "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        )}
      >
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#008CEB] to-[#00C9A7] flex items-center justify-center text-white text-[10px] font-extrabold overflow-hidden">
          {currentUser?.fotoUrl ? (
            <img src={currentUser.fotoUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            currentUser?.nama?.charAt(0)?.toUpperCase() || "?"
          )}
        </div>
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 max-w-[80px] truncate hidden sm:block">
          {currentUser?.nama || "User"}
        </span>
        <ChevronDown className={cn("w-3 h-3 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#131527] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl z-50 py-2 animate-scale-in origin-top-right">
          <button
            onClick={() => { router.push("/profile"); setOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <User className="w-4 h-4 text-slate-400" />
            <span className="font-medium text-slate-700 dark:text-slate-300">Profile</span>
          </button>

          <div className="h-px bg-slate-100 dark:bg-slate-800 mx-3 my-1" />

          <button
            onClick={() => { toggleTheme(); setOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-400" />
            )}
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {theme === "dark" ? "Mode Terang" : "Mode Gelap"}
            </span>
          </button>

          <div className="h-px bg-slate-100 dark:bg-slate-800 mx-3 my-1" />

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors text-rose-500"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      )}
    </div>
  );
}
