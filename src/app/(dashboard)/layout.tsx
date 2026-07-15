"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSessionStore } from "@/store/useSessionStore";
import Header from "@/components/layout/header";
import BottomNav from "@/components/layout/bottom-nav";
import OnboardingGuard from "@/components/onboarding-guard";
import PWA from "@/components/pwa";

const PUBLIC_ROUTES = ["/login", "/register", "/forgot-pin"];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isLoggedIn, onboardingCompleted } = useSessionStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isPublic = PUBLIC_ROUTES.includes(pathname);
  const isLoginPage = pathname === "/login";

  if (!mounted) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="size-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/25">
            M
          </div>
          <div className="flex gap-1">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0ms]" />
            <span className="size-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:150ms]" />
            <span className="size-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn() && !isPublic) {
    router.replace("/login");
    return null;
  }

  if (isLoginPage || isPublic) {
    return <>{children}</>;
  }

  return (
    <OnboardingGuard>
      <div className="flex flex-col h-[100dvh] bg-slate-950 text-slate-100 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto px-4 pt-3 pb-[80px] safe-bottom scrollbar-hide">
          {children}
        </main>
        <BottomNav />
      </div>
    </OnboardingGuard>
  );
}
