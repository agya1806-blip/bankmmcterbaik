"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSessionStore } from "@/store/useSessionStore";
import Header from "@/components/layout/header";
import BottomNav from "@/components/layout/bottom-nav";
import OnboardingGuard from "@/components/onboarding-guard";

const PUBLIC_ROUTES = ["/login", "/register", "/forgot-pin"];

function SolidLoader() {
  return (
    <div className="flex h-[100dvh] items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-3">
        <div className="size-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white font-bold text-lg">
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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isInitializing = useSessionStore((s) => s.isInitializing);
  const isLoggedIn = useSessionStore((s) => s.isLoggedIn);
  const isKioskFn = useSessionStore((s) => s.isKiosk);
  const kioskTarget = useSessionStore((s) => s.kioskTarget);

  useEffect(() => {
    if (isInitializing) return;
    if (!isLoggedIn() && !PUBLIC_ROUTES.includes(pathname)) {
      router.replace("/login");
    }
  }, [isInitializing, isLoggedIn, pathname, router]);

  /* ─── 1. Hold all render until store fully hydrated ─── */
  if (isInitializing) {
    return <SolidLoader />;
  }

  const isPublic = PUBLIC_ROUTES.includes(pathname);
  const isLoginPage = pathname === "/login";

  if (!isLoggedIn() && !isPublic) {
    return <SolidLoader />;
  }

  if (isLoginPage || isPublic) {
    return <>{children}</>;
  }

  /* ─── Kiosk Mode — fullscreen, no nav ─── */
  if (isKioskFn() && kioskTarget) {
    return (
      <div className="flex flex-col h-[100dvh] bg-slate-950 text-slate-100 overflow-hidden">
        <main className="flex-1 overflow-y-auto scrollbar-hide">
          {children}
        </main>
      </div>
    );
  }

  /* ─── Dashboard — stable layout ─── */
  return (
    <OnboardingGuard>
      <div className="flex flex-col min-h-[100dvh] overflow-hidden">
        <Header />
        <div className="flex-1 flex flex-col min-h-0">
          <main className="flex-1 overflow-y-auto px-4 pt-3 pb-[70px] safe-bottom scrollbar-hide">
            {children}
          </main>
        </div>
        <BottomNav />
      </div>
    </OnboardingGuard>
  );
}
