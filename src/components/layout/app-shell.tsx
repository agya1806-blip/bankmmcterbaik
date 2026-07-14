"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/engines/identity/auth-store";
import { useWorkspaceStore } from "@/engines/workspace/workspace-store";
import { useThemeStore } from "@/components/layout/theme-store";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import BottomNav from "@/components/layout/bottom-nav";
import PWA from "@/components/pwa";
import Reminder from "@/components/reminder";
import OnboardingGuard from "@/components/onboarding-guard";

const AUTH_ROUTES = ["/login", "/register"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading: authLoading, checkSession } = useAuthStore();
  const { workspaces, activeWorkspace, loadWorkspaces, selectWorkspace } = useWorkspaceStore();
  const { setTheme } = useThemeStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("mmcbank-theme") as "light" | "dark" | null;
    if (saved) setTheme(saved);
  }, [setTheme]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (!authLoading && !user && !AUTH_ROUTES.includes(pathname)) {
      router.replace("/login");
    }
  }, [authLoading, user, pathname, router]);

  useEffect(() => {
    if (user) loadWorkspaces(user.id);
  }, [user, loadWorkspaces]);

  useEffect(() => {
    if (user && workspaces.length > 0 && !activeWorkspace) {
      const saved = localStorage.getItem("activeWorkspaceId");
      if (saved && workspaces.some((w) => w.id === saved)) {
        selectWorkspace(saved, user.id);
      } else {
        selectWorkspace(workspaces[0].id, user.id);
      }
    }
  }, [user, workspaces, activeWorkspace, selectWorkspace]);

  const isAuthPage = AUTH_ROUTES.includes(pathname);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="size-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-xl shadow-2xl shadow-emerald-500/25 animate-float">
            M
          </div>
          <div className="flex gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0ms]" />
            <span className="size-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:150ms]" />
            <span className="size-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    );
  }

  if (!user || isAuthPage) {
    return <>{children}</>;
  }

  if (workspaces.length === 0 || !activeWorkspace) {
    return <>{children}</>;
  }

  return (
    <OnboardingGuard>
    <div className="min-h-screen bg-background">
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          style={{ animation: "fadeIn 0.2s ease-out" }}
        />
      )}

      <div
        data-sidebar
        className={`transition-all duration-[350ms] ${
          sidebarCollapsed ? 'w-[var(--sidebar-collapsed-width)]' : 'w-[var(--sidebar-width)]'
        } ${mobileSidebarOpen ? 'open' : ''} max-lg:fixed max-lg:inset-0 max-lg:z-[55] max-lg:-translate-x-full max-lg:[&.open]:translate-x-0 max-lg:transition-transform max-lg:duration-300`}
      >
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />
      </div>

      <div
        className={`transition-all duration-[350ms] ${
          sidebarCollapsed ? 'lg:ml-[calc(var(--sidebar-collapsed-width)+16px)]' : 'lg:ml-[calc(var(--sidebar-width)+16px)]'
        } pt-[calc(64px+12px+16px)] pb-0 lg:pb-0`}
      >
        <Header onMobileMenuToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
        <main className="min-h-[calc(100vh-80px)] p-4 sm:p-6 lg:p-8 section-padding">
          <div className="content-container animate-slide-up">
            {children}
          </div>
        </main>
      </div>

      <BottomNav />

      <PWA />
      <Reminder />

      <div className="lg:hidden h-[100px]" />
    </div>
    </OnboardingGuard>
  );
}
