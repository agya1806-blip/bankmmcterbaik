"use client";

import { useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard, ArrowLeftRight, Wallet, FileText, Settings,
  Zap, ShoppingCart, ArrowUpDown, type LucideIcon
} from "lucide-react";
import { useWorkspaceStore } from "@/engines/workspace/workspace-store";
import { useTranslation } from "@/lib/i18n";

const NAV_MAP: Record<string, { href: string; labelKey: string; icon: LucideIcon }[]> = {
  pribadi: [
    { href: "/", labelKey: "nav.home", icon: LayoutDashboard },
    { href: "/transactions", labelKey: "nav.transactions", icon: ArrowLeftRight },
    { href: "/accounts", labelKey: "nav.accounts", icon: Wallet },
    { href: "/budgets", labelKey: "nav.budgets", icon: FileText },
    { href: "/settings", labelKey: "nav.settings", icon: Settings },
  ],
  usaha: [
    { href: "/", labelKey: "nav.home", icon: LayoutDashboard },
    { href: "/transactions", labelKey: "nav.transactions", icon: ArrowLeftRight },
    { href: "/orders", labelKey: "nav.orders", icon: ShoppingCart },
    { href: "/invoices", labelKey: "nav.invoices", icon: FileText },
    { href: "/settings", labelKey: "nav.settings", icon: Settings },
  ],
  modal: [
    { href: "/", labelKey: "nav.home", icon: LayoutDashboard },
    { href: "/transactions", labelKey: "nav.transactions", icon: ArrowLeftRight },
    { href: "/accounts", labelKey: "nav.accounts", icon: Wallet },
    { href: "/reports", labelKey: "nav.reports", icon: FileText },
    { href: "/settings", labelKey: "nav.settings", icon: Settings },
  ],
  toko: [
    { href: "/", labelKey: "nav.home", icon: LayoutDashboard },
    { href: "/ppob", labelKey: "nav.ppob", icon: Zap },
    { href: "/orders", labelKey: "nav.orders", icon: ShoppingCart },
    { href: "/products", labelKey: "nav.products", icon: Wallet },
    { href: "/settings", labelKey: "nav.settings", icon: Settings },
  ],
  hutang: [
    { href: "/", labelKey: "nav.home", icon: LayoutDashboard },
    { href: "/debts", labelKey: "nav.debts", icon: ArrowUpDown },
    { href: "/customers", labelKey: "nav.customers", icon: Wallet },
    { href: "/calendar", labelKey: "nav.calendar", icon: FileText },
    { href: "/settings", labelKey: "nav.settings", icon: Settings },
  ],
};

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const { activeWorkspace } = useWorkspaceStore();

  const items = useMemo(() => {
    const type = activeWorkspace?.type || "pribadi";
    return NAV_MAP[type] || NAV_MAP.pribadi;
  }, [activeWorkspace?.type]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden safe-bottom">
      <div className="relative flex items-center justify-around px-1 py-0.5 bg-white/90 dark:bg-[var(--card)]/90 backdrop-blur-2xl border-t border-border/50 shadow-2xl shadow-black/5">
        <div className="absolute inset-0 rounded-t-2xl bg-gradient-to-t from-emerald-500/[0.02] to-transparent pointer-events-none" />
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`relative flex flex-col items-center gap-0.5 py-2 px-3 min-w-[48px] min-h-[48px] rounded-xl transition-all duration-200 ${
                active ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {active && (
                <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-sm shadow-emerald-500/30" />
              )}
              <item.icon className={`size-5 transition-all duration-200 ${active ? 'scale-110 drop-shadow-sm' : ''}`} />
              <span className={`text-[10px] font-medium transition-all ${active ? 'font-semibold translate-y-0' : ''}`}>{t(item.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
