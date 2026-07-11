"use client";

import { useCallback, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard, ArrowLeftRight, Wallet, PieChart, FileText,
  Users, Package, Tag, ShoppingCart, BarChart3, FolderKanban, Calendar,
  Settings, ChevronLeft, Building2, LogOut, Plus, ArrowUpDown, CreditCard,
  Zap, QrCode, Search, type LucideIcon
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
  const { user, logout } = useAuthStore();
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
    <aside className={`byond-sidebar ${collapsed ? "byond-sidebar-collapsed" : ""}`}>
      {/* Brand Header */}
      <div className="byond-sidebar-header">
        {!collapsed && (
          <div className="byond-brand">
            <div className="byond-brand-icon">
              {activeWorkspace?.icon || "M"}
            </div>
            <div className="byond-brand-text">
              <p className="byond-brand-name">{activeWorkspace?.name || "MUGHIS"}</p>
              <p className="byond-brand-type">{typeLabel}</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="byond-brand byond-brand-collapsed">
            <div className="byond-brand-icon byond-brand-icon-sm">
              {activeWorkspace?.icon || "M"}
            </div>
          </div>
        )}
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="byond-search-wrap">
          <Search className="byond-search-icon" />
          <input
            type="text"
            placeholder="Cari menu..."
            className="byond-search-input"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.target as HTMLInputElement).value) {
                router.push(`/transactions?search=${encodeURIComponent((e.target as HTMLInputElement).value)}`);
              }
            }}
          />
        </div>
      )}

      {/* Navigation Groups */}
      <nav className="byond-nav">
        {navGroups.map((group, gi) => (
          <div key={gi} className="byond-nav-group">
            {group.label && !collapsed && (
              <p className="byond-nav-label">{group.label}</p>
            )}
            <div className="byond-nav-items">
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <button
                    key={item.href}
                    onClick={() => handleNav(item.href)}
                    className={`byond-nav-item ${active ? "byond-nav-item-active" : ""} ${collapsed ? "byond-nav-item-collapsed" : ""}`}
                    title={collapsed ? t(item.labelKey) : undefined}
                  >
                    {active && <span className="byond-nav-glow" />}
                    <div className={`byond-nav-icon-wrap ${active ? "byond-nav-icon-active" : ""}`}>
                      <item.icon className="byond-nav-icon" />
                    </div>
                    {!collapsed && (
                      <span className="byond-nav-text">{t(item.labelKey)}</span>
                    )}
                    {!collapsed && active && (
                      <span className="byond-nav-indicator" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="byond-sidebar-footer">
        <button
          onClick={() => handleNav("/workspaces")}
          className={`byond-nav-item ${collapsed ? "byond-nav-item-collapsed" : ""}`}
          title={collapsed ? t("nav.workspaces") : undefined}
        >
          <div className="byond-nav-icon-wrap byond-nav-icon-accent">
            <Plus className="byond-nav-icon" />
          </div>
          {!collapsed && <span className="byond-nav-text">{t("nav.workspaces")}</span>}
        </button>

        <button
          onClick={() => handleNav("/settings")}
          className={`byond-nav-item ${isActive("/settings") ? "byond-nav-item-active" : ""} ${collapsed ? "byond-nav-item-collapsed" : ""}`}
          title={collapsed ? t("nav.settings") : undefined}
        >
          {isActive("/settings") && <span className="byond-nav-glow" />}
          <div className={`byond-nav-icon-wrap ${isActive("/settings") ? "byond-nav-icon-active" : ""}`}>
            <Settings className="byond-nav-icon" />
          </div>
          {!collapsed && <span className="byond-nav-text">{t("nav.settings")}</span>}
        </button>

        {/* Profile Card */}
        {!collapsed && (
          <div className="byond-profile-card">
            <div className="byond-profile-avatar">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="byond-profile-info">
              <p className="byond-profile-name">{user?.name || "User"}</p>
              <p className="byond-profile-email">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="byond-logout-btn"
              title={t("nav.signOut")}
            >
              <LogOut className="size-4" />
            </button>
          </div>
        )}

        {/* Collapse Toggle */}
        <button
          onClick={onToggle}
          className={`byond-nav-item byond-toggle ${collapsed ? "byond-nav-item-collapsed" : ""}`}
          title={collapsed ? t("nav.expand") : t("nav.collapse")}
        >
          <div className="byond-nav-icon-wrap">
            <ChevronLeft className={`byond-nav-icon byond-toggle-icon ${collapsed ? "rotate-180" : ""}`} />
          </div>
          {!collapsed && <span className="byond-nav-text">{t("nav.collapse")}</span>}
        </button>
      </div>
    </aside>
  );
}
