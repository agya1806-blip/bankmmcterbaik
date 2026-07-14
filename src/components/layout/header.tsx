"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, Moon, Sun, PanelRightOpen, Sparkles, ChevronRight, Search } from "lucide-react";
import { useAuthStore } from "@/engines/identity/auth-store";
import { useThemeStore } from "@/components/layout/theme-store";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Link from "next/link";

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

const SEARCH_ROUTES = [
  { label: "Dashboard Global", path: "/" },
  { label: "Buku Usaha", path: "/buku-usaha" },
  { label: "Dompet", path: "/buku-usaha/dompet" },
  { label: "Laporan Keuangan", path: "/buku-usaha/laporan-keuangan" },
  { label: "Pengaturan", path: "/buku-usaha/pengaturan" },
  { label: "Kasir Percetakan", path: "/buku-usaha/kasir/percetakan" },
  { label: "Kasir Gadget", path: "/buku-usaha/kasir/gadget" },
  { label: "Kasir Laptop", path: "/buku-usaha/kasir/laptop" },
  { label: "Kasir Konveksi", path: "/buku-usaha/kasir/konveksi" },
];

export default function Header({ onMobileMenuToggle }: HeaderProps) {
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [greeting, setGreeting] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 5) setGreeting("Selamat Malam");
    else if (hour < 12) setGreeting("Selamat Pagi");
    else if (hour < 17) setGreeting("Selamat Siang");
    else setGreeting("Selamat Sore");
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      setSearchOpen((o) => !o);
    }
    if (e.key === "Escape" && searchOpen) {
      setSearchOpen(false);
    }
  }, [searchOpen]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (!searchOpen) setSearchQuery("");
  }, [searchOpen]);

  const filtered = SEARCH_ROUTES.filter(
    (r) => r.label.toLowerCase().includes(searchQuery.toLowerCase()) || r.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <header className="byond-header">
      <div className="byond-header-left">
        <button
          className="byond-header-menu-btn"
          onClick={onMobileMenuToggle}
          aria-label="Toggle menu"
        >
          <PanelRightOpen className="size-5" />
        </button>
        <div className="byond-header-brand">
          <Sparkles className="byond-header-sparkle" />
          <div className="byond-header-breadcrumb">
            <span className="byond-header-breadcrumb-app">MUGHIS</span>
            <ChevronRight className="byond-header-breadcrumb-sep" />
            <span className="byond-header-breadcrumb-page">Buku Usaha</span>
          </div>
        </div>
      </div>

      <div className="byond-header-right">
        <button
          onClick={() => setSearchOpen(true)}
          className="byond-header-action"
          aria-label="Search"
        >
          <Search className="size-5" />
        </button>

        <button
          onClick={toggleTheme}
          className="byond-header-action"
          aria-label={theme === "dark" ? "Light mode" : "Dark mode"}
        >
          {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </button>

        <button className="byond-header-action byond-header-notification" aria-label="Notifications">
          <Bell className="size-5" />
          <span className="byond-notification-dot" />
        </button>

        <div className="byond-header-divider" />

        <div className="byond-header-user">
          <div className="byond-header-user-info">
            <p className="byond-header-greeting">{greeting}</p>
            <p className="byond-header-username">{user?.name || "User"}</p>
          </div>
          <div className="byond-header-avatar">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
        </div>
      </div>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent>
          <div className="pt-2">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari halaman..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-muted/50 border border-border/50 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
              />
            </div>
            <div className="space-y-0.5 max-h-60 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-xs text-muted-foreground/50 text-center py-6">Tidak ada hasil</p>
              ) : filtered.map((r) => (
                <Link
                  key={r.path}
                  href={r.path}
                  onClick={() => setSearchOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-colors group"
                >
                  <div className="size-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <ChevronRight className="size-3.5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{r.label}</p>
                    <p className="text-[10px] text-muted-foreground/50">{r.path}</p>
                  </div>
                </Link>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground/30 text-center mt-4">
              Tekan <kbd className="px-1 py-0.5 rounded bg-muted/50 text-[9px] font-mono">Ctrl+K</kbd> untuk membuka pencarian
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
