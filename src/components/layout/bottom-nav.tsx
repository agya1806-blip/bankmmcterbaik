"use client";

import { useMemo, useState } from "react";
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
  const [pressed, setPressed] = useState<string | null>(null);

  const items = useMemo(() => {
    const type = activeWorkspace?.type || "pribadi";
    return NAV_MAP[type] || NAV_MAP.pribadi;
  }, [activeWorkspace?.type]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="byond-bottom-nav">
      <div className="byond-bottom-nav-inner">
        {items.map((item) => {
          const active = isActive(item.href);
          const isPressed = pressed === item.href;
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              onMouseDown={() => setPressed(item.href)}
              onMouseUp={() => setPressed(null)}
              onMouseLeave={() => setPressed(null)}
              className={`byond-bottom-nav-item ${active ? "byond-bottom-nav-active" : ""} ${isPressed ? "scale-90" : ""}`}
            >
              {active && <span className="byond-bottom-nav-glow" />}
              <div className={`byond-bottom-nav-icon-wrap ${active ? "byond-bottom-nav-icon-active" : ""}`}>
                <item.icon className={`byond-bottom-nav-icon ${active ? "byond-bottom-nav-icon-active-color" : ""}`} />
              </div>
              <span className={`byond-bottom-nav-label ${active ? "byond-bottom-nav-label-active" : ""}`}>
                {t(item.labelKey)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
