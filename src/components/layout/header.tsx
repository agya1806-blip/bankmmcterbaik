"use client";

import { useState, useEffect } from "react";
import { Bell, Moon, Sun, PanelRightOpen, Sparkles, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/engines/identity/auth-store";
import { useThemeStore } from "@/components/layout/theme-store";

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

export default function Header({ onMobileMenuToggle }: HeaderProps) {
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 5) setGreeting("Selamat Malam");
    else if (hour < 12) setGreeting("Selamat Pagi");
    else if (hour < 17) setGreeting("Selamat Siang");
    else setGreeting("Selamat Sore");
  }, []);

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
    </header>
  );
}
