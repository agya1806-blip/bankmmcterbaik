"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, Moon, Sun, PanelRightOpen, Sparkles, X, ChevronRight } from "lucide-react";
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
  const { activeWorkspace } = useWorkspaceStore();
  const { theme, toggleTheme } = useThemeStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 5) setGreeting("Selamat Malam");
    else if (hour < 12) setGreeting("Selamat Pagi");
    else if (hour < 17) setGreeting("Selamat Siang");
    else setGreeting("Selamat Sore");
  }, []);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/transactions?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  }, [searchQuery, router]);

  return (
    <>
      <header className="byond-header">
        <div className="byond-header-left">
          <button
            className="byond-header-menu-btn"
            onClick={onMobileMenuToggle}
            aria-label="Toggle menu"
          >
            <PanelRightOpen className="size-4" />
          </button>
          <div className="byond-header-brand">
            <Sparkles className="byond-header-sparkle" />
            <div className="byond-header-breadcrumb">
              <span className="byond-header-breadcrumb-app">MUGHIS</span>
              {activeWorkspace && (
                <>
                  <ChevronRight className="byond-header-breadcrumb-sep" />
                  <span className="byond-header-breadcrumb-page">{activeWorkspace.name}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="byond-header-center">
          <form onSubmit={handleSearch} className="byond-header-search">
            <Search className="byond-header-search-icon" />
            <input
              type="text"
              placeholder={t("header.search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="byond-header-search-input"
            />
          </form>
        </div>

        <div className="byond-header-right">
          <button
            onClick={() => setSearchOpen(true)}
            className="byond-header-action md:hidden"
            aria-label="Search"
          >
            <Search className="size-4" />
          </button>

          <button
            onClick={toggleTheme}
            className="byond-header-action"
            aria-label={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>

          <button className="byond-header-action byond-header-notification" aria-label="Notifications">
            <Bell className="size-4" />
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
      </header>

      {/* Mobile Search Overlay */}
      {searchOpen && (
        <div className="byond-search-overlay" onClick={() => setSearchOpen(false)}>
          <div className="byond-search-overlay-content" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSearch} className="byond-search-overlay-form">
              <Search className="byond-search-overlay-icon" />
              <input
                type="text"
                placeholder={t("header.searchShort")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="byond-search-overlay-input"
              />
              <button
                type="button"
                onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                className="byond-search-overlay-close"
              >
                <X className="size-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
