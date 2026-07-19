"use client";
import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSessionStore } from "@/store/useSessionStore";
import { useThemeStore } from "@/store/useThemeStore";
import { AnimatePresence, motion } from "framer-motion";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import BottomNav from "./bottom-nav";
import NotificationChecker from "./notification-checker";
import RecurringScheduler from "./recurring-scheduler";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, onboardingCompleted, isInitializing } = useSessionStore();
  const { theme } = useThemeStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") { root.classList.add("dark"); root.style.colorScheme = "dark"; }
    else { root.classList.remove("dark"); root.style.colorScheme = "light"; }
  }, [theme]);

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/forgot-pin");

  useEffect(() => {
    if (isInitializing) return;
    if (!isAuthPage && !currentUser) router.replace("/login");
    if (isAuthPage && currentUser) router.replace("/");
  }, [currentUser, isAuthPage, isInitializing, router]);

  if (isInitializing) return <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center"><div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /></div>;

  if (isAuthPage) return <>{children}</>;

  if (!currentUser) return null;

  const showNav = onboardingCompleted;

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex">
      {showNav && <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
      <div className="flex-1 flex flex-col min-h-screen max-w-full">
        {showNav && <Header onMenuToggle={() => setSidebarOpen(true)} />}
        <main className="flex-1 flex flex-col w-full px-4 sm:px-6 lg:px-8 pt-4 pb-24 lg:pb-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: "easeInOut" }}
              className="w-full flex-1 flex flex-col"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
        {showNav && <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40"><BottomNav /></div>}
      </div>
    </div>
  );
}
