"use client";

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSessionStore } from '@/store/useSessionStore';
import { useThemeStore } from '@/store/useThemeStore';
import BottomNav from './bottom-nav';
import { AnimatePresence, motion } from 'framer-motion';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentUser, onboardingCompleted } = useSessionStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, [theme]);

  const isAuthPage = pathname.includes('/login') || pathname.includes('/register') || pathname.includes('/forgot-pin');

  return (
    <div className="min-h-screen bg-[#F8F9FD] dark:bg-[#0B0C16] text-slate-900 dark:text-slate-100 flex flex-col items-center justify-start overflow-x-hidden">
      <div className="w-full max-w-md min-h-screen flex flex-col bg-[#F8F9FD] dark:bg-[#0B0C16] shadow-2xl relative border-x border-slate-100 dark:border-zinc-900">
        <main className="flex-1 w-full pt-[calc(env(safe-area-inset-top)+1rem)] pb-[110px] flex flex-col px-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: "easeInOut" }}
              className="w-full h-full flex flex-col flex-1"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {!isAuthPage && onboardingCompleted && currentUser && (
          <BottomNav />
        )}
      </div>
    </div>
  );
}
