"use client";

import { useCallback, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard, ArrowLeftRight, Wallet, PieChart, FileText,
  Users, Package, Tag, ShoppingCart, BarChart3, FolderKanban, Calendar,
  Settings, ChevronLeft, Building2, LogOut, Plus, ArrowUpDown, CreditCard,
  Zap, QrCode, type LucideIcon
} from "lucide-react";
import { useAuthStore } from "@/engines/identity/auth-store";
import { useWorkspaceStore } from "@/engines/workspace/workspace-store";
import { useTranslation } from "@/lib/i18n";

type NavItem = { href: string; labelKey: string; icon: LucideIcon };

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const ALL_NAV_GROUPS: Record<string, NavGroup[]> = {
  pribadi: [
    { items: [
      { href: "/", labelKey: "nav.dashboard", icon: LayoutDashboard },
      { href: "/transactions", labelKey: "nav.transactions", icon: ArrowLeftRight },
    ]},
    { label: "Keuangan", items: [
      { href: "/accounts", labelKey: "nav.accounts", icon: Wallet },
      { href: "/budgets", labelKey: "nav.budgets", icon: PieChart },
    ]},
    { label: "Laporan", items: [
      { href: "/reports", labelKey: "nav.reports", icon: BarChart3 },
      { href: "/calendar", labelKey: "nav.calendar", icon: Calendar },
    ]},
  ],
  usaha: [
    { items: [
      { href: "/", labelKey: "nav.dashboard", icon: LayoutDashboard },
      { href: "/transactions", labelKey: "nav.transactions", icon: ArrowLeftRight },
    ]},
    { label: "Bisnis", items: [
      { href: "/orders", labelKey: "nav.orders", icon: ShoppingCart },
      { href: "/invoices", labelKey: "nav.invoices", icon: FileText },
      { href: "/customers", labelKey: "nav.customers", icon: Users },
      { href: "/suppliers", labelKey: "nav.suppliers", icon: Building2 },
    ]},
    { label: "Produk", items: [
      { href: "/products", labelKey: "nav.products", icon: Tag },
      { href: "/inventory", labelKey: "nav.inventory", icon: Package },
    ]},
    { label: "Layanan", items: [
      { href: "/ppob", labelKey: "nav.ppob", icon: Zap },
      { href: "/qris", labelKey: "nav.qris", icon: QrCode },
    ]},
    { label: "Keuangan", items: [
      { href: "/accounts", labelKey: "nav.accounts", icon: Wallet },
      { href: "/budgets", labelKey: "nav.budgets", icon: PieChart },
      { href: "/debts", labelKey: "nav.debts", icon: ArrowUpDown },
    ]},
    { label: "Lainnya", items: [
      { href: "/projects", labelKey: "nav.projects", icon: FolderKanban },
      { href: "/reports", labelKey: "nav.reports", icon: BarChart3 },
      { href: "/calendar", labelKey: "nav.calendar", icon: Calendar },
      { href: "/categories", labelKey: "nav.categories", icon: Tag },
      { href: "/wallets", labelKey: "nav.wallets", icon: CreditCard },
    ]},
  ],
  modal: [
    { items: [
      { href: "/", labelKey: "nav.dashboard", icon: LayoutDashboard },
      { href: "/transactions", labelKey: "nav.transactions", icon: ArrowLeftRight },
      { href: "/accounts", labelKey: "nav.accounts", icon: Wallet },
      { href: "/reports", labelKey: "nav.reports", icon: BarChart3 },
    ]},
  ],
  toko: [
    { items: [
      { href: "/", labelKey: "nav.dashboard", icon: LayoutDashboard },
    ]},
    { label: "Layanan", items: [
      { href: "/ppob", labelKey: "nav.ppob", icon: Zap },
      { href: "/qris", labelKey: "nav.qris", icon: QrCode },
    ]},
    { label: "Bisnis", items: [
      { href: "/orders", labelKey: "nav.orders", icon: ShoppingCart },
      { href: "/products", labelKey: "nav.products", icon: Tag },
      { href: "/customers", labelKey: "nav.customers", icon: Users },
      { href: "/inventory", labelKey: "nav.inventory", icon: Package },
      { href: "/transactions", labelKey: "nav.transactions", icon: ArrowLeftRight },
    ]},
  ],
  hutang: [
    { items: [
      { href: "/", labelKey: "nav.dashboard", icon: LayoutDashboard },
      { href: "/debts", labelKey: "nav.debts", icon: ArrowUpDown },
      { href: "/customers", labelKey: "nav.customers", icon: Users },
      { href: "/calendar", labelKey: "nav.calendar", icon: Calendar },
    ]},
  ],
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onMobileClose?: () => void;
}

export default function Sidebar({ collapsed, onToggle, onMobileClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const { logout } = useAuthStore();
  const { activeWorkspace } = useWorkspaceStore();

  const navGroups = useMemo(() => {
    const type = activeWorkspace?.type || "pribadi";
    return ALL_NAV_GROUPS[type] || ALL_NAV_GROUPS.pribadi;
  }, [activeWorkspace?.type]);

  const handleNav = useCallback((href: string) => {
    router.push(href);
    onMobileClose?.();
  }, [router, onMobileClose]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const typeLabel = activeWorkspace?.type
    ? ({ pribadi: "Buku Pribadi", usaha: "Buku Usaha", modal: "Buku Modal", toko: "Toko Online", hutang: "Buku Hutang" } as Record<string, string>)[activeWorkspace.type]
    : "";

  return (
    <aside className={`floating-sidebar flex flex-col ${collapsed ? 'w-sidebar-collapsed' : ''}`}>
      <div className="flex items-center gap-3 px-4 h-16 shrink-0 border-b border-sidebar-border">
        <div className="flex items-center justify-center size-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 shrink-0">
          {activeWorkspace?.icon || "M"}
        </div>
        {!collapsed && (
          <div className="flex items-center justify-between flex-1 min-w-0">
            <div className="min-w-0">
              <p className="text-sm font-bold text-sidebar-foreground truncate font-heading">{activeWorkspace?.name || "MUGHIS"}</p>
              <p className="text-[10px] text-sidebar-muted-foreground truncate">{typeLabel}</p>
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-hide">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {group.label && !collapsed && (
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted-foreground/50">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <button
                  key={item.href}
                  onClick={() => handleNav(item.href)}
                  className={`w-full nav-item ${isActive(item.href) ? 'nav-item-active' : ''} ${collapsed ? 'justify-center px-0' : ''}`}
                  title={collapsed ? t(item.labelKey) : undefined}
                >
                  <item.icon className="size-5 shrink-0" />
                  {!collapsed && <span>{t(item.labelKey)}</span>}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-sidebar-border space-y-0.5">
        <button
          onClick={() => handleNav("/workspaces")}
          className={`w-full nav-item ${collapsed ? 'justify-center px-0' : ''}`}
          title={collapsed ? t("nav.workspaces") : undefined}
        >
          <Plus className="size-5 shrink-0" />
          {!collapsed && <span>{t("nav.workspaces")}</span>}
        </button>
        <button
          onClick={() => handleNav("/settings")}
          className={`w-full nav-item ${isActive("/settings") ? 'nav-item-active' : ''} ${collapsed ? 'justify-center px-0' : ''}`}
          title={collapsed ? t("nav.settings") : undefined}
        >
          <Settings className="size-5 shrink-0" />
          {!collapsed && <span>{t("nav.settings")}</span>}
        </button>
        <button
          onClick={logout}
          className={`w-full nav-item ${collapsed ? 'justify-center px-0' : ''}`}
          title={collapsed ? t("nav.signOut") : undefined}
        >
          <LogOut className="size-5 shrink-0" />
          {!collapsed && <span>{t("nav.signOut")}</span>}
        </button>
        <button
          onClick={onToggle}
          className={`w-full nav-item mt-1 ${collapsed ? 'justify-center px-0' : ''}`}
          title={collapsed ? t("nav.expand") : t("nav.collapse")}
        >
          <ChevronLeft className={`size-5 shrink-0 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
          {!collapsed && <span>{t("nav.collapse")}</span>}
        </button>
      </div>
    </aside>
  );
}
