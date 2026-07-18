"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSessionStore } from "@/store/useSessionStore";
import { useThemeStore } from "@/store/useThemeStore";
import { AnimatePresence, motion } from "framer-motion";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import BottomNav from "./bottom-nav";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentUser, onboardingCompleted } = useSessionStore();
  const { theme } = useThemeStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
  }, [theme]);

  const isAuthPage =
    pathname.includes("/login") ||
    pathname.includes("/register") ||
    pathname.includes("/forgot-pin");

  if (isAuthPage) {
    return <>{children}</>;
  }

  const showNav = onboardingCompleted && currentUser;

  return (
    <div className="min-h-screen bg-[#F8F9FD] dark:bg-[#0B0C16] text-slate-900 dark:text-slate-100 flex">
      {/* Sidebar — desktop only */}
      {showNav && <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-h-screen max-w-full">
        {/* Header — all screens */}
        {showNav && (
          <Header onMenuToggle={() => setSidebarOpen(true)} />
        )}

        {/* Page content */}
        <main className="flex-1 flex flex-col w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15, ease: "easeInOut" }}
              className="w-full flex-1 flex flex-col"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom Nav — mobile only */}
        {showNav && (
          <div className="lg:hidden">
            <BottomNav onMenuClick={() => setSidebarOpen(true)} />
          </div>
        )}
      </div>
    </div>
  );
}
