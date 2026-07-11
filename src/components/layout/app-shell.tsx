"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/engines/identity/auth-store";
import { useWorkspaceStore } from "@/engines/workspace/workspace-store";
import { useThemeStore } from "@/components/layout/theme-store";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import BottomNav from "@/components/layout/bottom-nav";

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
        selectWorkspace(saved);
      } else {
        selectWorkspace(workspaces[0].id);
      }
    }
  }, [user, workspaces, activeWorkspace, selectWorkspace]);

  const isAuthPage = AUTH_ROUTES.includes(pathname);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-xl shadow-emerald-500/20 animate-float">
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
    <div className="min-h-screen bg-background">
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <div
        data-sidebar
        className={`fixed inset-y-0 left-3 top-3 bottom-3 z-50 transition-all duration-300 ${
          sidebarCollapsed ? 'w-sidebar-collapsed' : 'w-sidebar'
        } ${mobileSidebarOpen ? 'open' : ''} max-lg:fixed max-lg:left-0 max-lg:top-0 max-lg:bottom-0 max-lg:z-50 max-lg:-translate-x-full max-lg:[&.open]:translate-x-0 max-lg:transition-transform max-lg:duration-300`}
      >
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />
      </div>

      <div
        className={`transition-all duration-300 ${
          sidebarCollapsed ? 'lg:pl-[calc(72px+24px)]' : 'lg:pl-[calc(280px+24px)]'
        } pt-[calc(56px+16px)] pb-0 lg:pb-0`}
      >
        <Header onMobileMenuToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
        <main className="min-h-[calc(100vh-80px)] p-4 sm:p-6 lg:p-8 section-padding">
          <div className="content-container animate-slide-up">
            {children}
          </div>
        </main>
      </div>

      <BottomNav />

      <div className="lg:hidden h-bottom-nav" />
    </div>
  );
}
