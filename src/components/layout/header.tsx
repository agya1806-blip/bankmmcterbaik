"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, Moon, Sun, PanelRightOpen, Sparkles } from "lucide-react";
import { useAuthStore } from "@/engines/identity/auth-store";
import { useWorkspaceStore } from "@/engines/workspace/workspace-store";
import { useThemeStore } from "@/components/layout/theme-store";
import { useTranslation } from "@/lib/i18n";

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

export default function Header({ onMobileMenuToggle }: HeaderProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { activeWorkspace, workspaces } = useWorkspaceStore();
  const { theme, toggleTheme } = useThemeStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/transactions?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  }, [searchQuery, router]);

  return (
    <header className="fixed top-3 left-3 right-3 z-40 h-14 flex items-center justify-between px-4 rounded-2xl bg-white/80 dark:bg-[var(--card)]/80 backdrop-blur-xl border border-border/50 shadow-glass">
      {/* Left - Mobile menu + breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          className="lg:hidden flex items-center justify-center size-9 rounded-xl bg-sidebar-muted text-sidebar-foreground hover:bg-sidebar-accent transition-all active:scale-90"
          onClick={onMobileMenuToggle}
          aria-label="Toggle menu"
        >
          <PanelRightOpen className="size-4" />
        </button>
        <div className="hidden sm:flex items-center gap-2 text-sm">
          <Sparkles className="size-3.5 text-emerald-500" />
          <span className="text-muted-foreground/60 font-medium">MUGHIS</span>
          {activeWorkspace && (
            <>
              <span className="text-muted-foreground/30">/</span>
              <span className="font-semibold text-foreground">{activeWorkspace.name}</span>
            </>
          )}
        </div>
      </div>

      {/* Center - Search */}
      <div className="hidden md:flex flex-1 max-w-md mx-4">
        <form onSubmit={handleSearch} className="relative w-full group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40 group-focus-within:text-emerald-500 transition-colors" />
          <input
            type="text"
            placeholder={t("header.search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-xl bg-muted/50 border border-border/30 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/15 transition-all"
          />
        </form>
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-1.5">
        {/* Search (mobile) */}
        <button
          onClick={() => setSearchOpen(true)}
          className="md:hidden flex items-center justify-center size-9 rounded-xl hover:bg-muted/50 transition-colors text-muted-foreground active:scale-90"
          aria-label="Search"
        >
          <Search className="size-4" />
        </button>

        {/* Workspace switcher */}
        {workspaces.length > 1 && (
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer active:scale-95">
            <span className="text-xs font-semibold text-muted-foreground">{activeWorkspace?.currency}</span>
          </div>
        )}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center size-9 rounded-xl hover:bg-muted/50 transition-all text-muted-foreground active:scale-90"
          aria-label={theme === "dark" ? "Light mode" : "Dark mode"}
        >
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>

        {/* Notifications */}
        <button className="relative flex items-center justify-center size-9 rounded-xl hover:bg-muted/50 transition-all text-muted-foreground active:scale-90" aria-label="Notifications">
          <Bell className="size-4" />
          <span className="absolute top-2 right-2 size-1.5 rounded-full bg-danger animate-pulse-soft" />
        </button>

        {/* User */}
        <div className="flex items-center gap-2 pl-2 border-l border-border/50 ml-1">
          <div className="hidden sm:flex flex-col items-end">
            <p className="text-xs font-semibold leading-tight text-foreground">{user?.name || "User"}</p>
            <p className="text-[10px] text-muted-foreground/60">{user?.email}</p>
          </div>
          <div className="flex items-center justify-center size-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-500/20 ring-2 ring-white/20 dark:ring-white/10">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
        </div>
      </div>

      {/* Mobile search overlay */}
      {searchOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm p-4 pt-16 animate-fade-in">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
            <input
              type="text"
              placeholder={t("header.searchShort")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full h-11 pl-9 pr-4 rounded-2xl bg-card border border-border shadow-lg text-sm focus:outline-none focus:border-emerald-500/50"
            />
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-emerald-500 hover:text-emerald-600 transition-colors"
            >
              {t("header.cancel")}
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
