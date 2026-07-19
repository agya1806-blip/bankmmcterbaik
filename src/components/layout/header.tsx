"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/components/ui/cn";
import { Breadcrumb } from "./breadcrumb";
import { SearchBar } from "./search-bar";
import { NotificationBell } from "./notification-bell";
import { UserMenu } from "./user-menu";
import { Menu } from "lucide-react";

interface HeaderProps {
  className?: string;
  onMenuToggle?: () => void;
  notifCount?: number;
  hideSearch?: boolean;
}

export function Header({ className, onMenuToggle, notifCount = 0, hideSearch }: HeaderProps) {
  const router = useRouter();

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full bg-white/80 dark:bg-[#0B0C16]/80 backdrop-blur-xl",
        "border-b border-slate-100 dark:border-slate-800/60",
        className
      )}
    >
      <div className="flex items-center h-14 lg:h-16 px-4 gap-3 max-w-screen-2xl mx-auto">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </button>

        {/* Logo */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 shrink-0"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#008CEB] to-[#00C9A7] flex items-center justify-center text-white text-[10px] font-extrabold shadow-md">
            M
          </div>
          <span className="font-heading font-extrabold text-sm tracking-tight text-slate-800 dark:text-white hidden sm:block">
            MMCBANK
          </span>
        </button>

        {/* Breadcrumb */}
        <Breadcrumb className="hidden md:flex ml-2" />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search */}
        {!hideSearch && <SearchBar className="w-full max-w-[200px] hidden lg:block" />}

        {/* Notification */}
        <NotificationBell count={notifCount} />

        {/* User Menu */}
        <UserMenu />
      </div>
    </header>
  );
}
