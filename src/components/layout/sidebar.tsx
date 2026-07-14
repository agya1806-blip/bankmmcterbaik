"use client";

import { useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard, Briefcase, Wallet, FileText, Settings,
  ChevronLeft, Printer, Smartphone, Coffee, Shirt, LogOut, Package, Zap,
  type LucideIcon
} from "lucide-react";
import { useAuthStore } from "@/engines/identity/auth-store";

type NavItem = { href: string; label: string; icon: LucideIcon };

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onMobileClose?: () => void;
}

const MAIN_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard Global", icon: LayoutDashboard },
  { href: "/buku-usaha", label: "Buku Usaha", icon: Briefcase },
];

const BIZ_ITEMS: NavItem[] = [
  { href: "/buku-usaha/percetakan/kasir", label: "Percetakan", icon: Printer },
  { href: "/buku-usaha/gadget-laptop/kasir", label: "Gadget & Laptop", icon: Smartphone },
  { href: "/buku-usaha/warkop-kelontong/kasir", label: "Warkop Kelontong", icon: Coffee },
  { href: "/buku-usaha/pakaian-konveksi/kasir", label: "Pakaian Konveksi", icon: Shirt },
];

const TOOL_ITEMS: NavItem[] = [
  { href: "/buku-usaha/dompet", label: "Dompet Kas", icon: Wallet },
  { href: "/buku-usaha/inventory", label: "Manajemen Stok", icon: Package },
  { href: "/buku-usaha/laporan-keuangan", label: "Laporan Keuangan", icon: FileText },
  { href: "/buku-usaha/template-cepat", label: "Template Cepat", icon: Zap },
  { href: "/buku-usaha/pengaturan", label: "Pengaturan", icon: Settings },
];

export default function Sidebar({ collapsed, onToggle, onMobileClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const handleNav = useCallback((href: string) => {
    router.push(href);
    onMobileClose?.();
  }, [router, onMobileClose]);

  const NavBtn = ({ item, isActive: active }: { item: NavItem; isActive: boolean }) => {
    if (collapsed) {
      return (
        <button
          onClick={() => handleNav(item.href)}
          className={`byond-nav-item byond-nav-item-collapsed ${active ? "byond-nav-item-active" : ""}`}
          title={item.label}
        >
          {active && <span className="byond-nav-glow" />}
          <div className={`byond-nav-icon-wrap ${active ? "byond-nav-icon-active" : ""}`}>
            <item.icon className="byond-nav-icon" />
          </div>
        </button>
      );
    }

    return (
      <button
        onClick={() => handleNav(item.href)}
        className={`byond-nav-item ${active ? "byond-nav-item-active" : ""}`}
      >
        {active && <span className="byond-nav-glow" />}
        <div className={`byond-nav-icon-wrap ${active ? "byond-nav-icon-active" : ""}`}>
          <item.icon className="byond-nav-icon" />
        </div>
        <span className="byond-nav-text">{item.label}</span>
        {active && <span className="byond-nav-indicator" />}
      </button>
    );
  };

  return (
    <aside className={`byond-sidebar ${collapsed ? "byond-sidebar-collapsed" : ""}`}>
      {/* Brand */}
      <div className="byond-sidebar-header">
        {!collapsed ? (
          <div className="byond-brand">
            <div className="byond-brand-icon">
              <LayoutDashboard className="size-6" />
            </div>
            <div className="byond-brand-text">
              <p className="byond-brand-name">MUGHIS BANK</p>
              <p className="byond-brand-type">Buku Usaha v3</p>
            </div>
          </div>
        ) : (
          <div className="byond-brand byond-brand-collapsed">
            <div className="byond-brand-icon byond-brand-icon-sm">
              <LayoutDashboard className="size-5" />
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="byond-nav">
        <div className="byond-nav-group">
          {!collapsed && <p className="byond-nav-label">Utama</p>}
          <div className="byond-nav-items">
            {MAIN_ITEMS.map((item) => (
              <NavBtn key={item.href} item={item} isActive={isActive(item.href)} />
            ))}
          </div>
        </div>

        <div className="byond-nav-group">
          {!collapsed && <p className="byond-nav-label">Bisnis</p>}
          <div className="byond-nav-items">
            {BIZ_ITEMS.map((item) => (
              <NavBtn key={item.href} item={item} isActive={isActive(item.href)} />
            ))}
          </div>
        </div>

        <div className="byond-nav-group">
          {!collapsed && <p className="byond-nav-label">Tools</p>}
          <div className="byond-nav-items">
            {TOOL_ITEMS.map((item) => (
              <NavBtn key={item.href} item={item} isActive={isActive(item.href)} />
            ))}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="byond-sidebar-footer">
        {/* Profile */}
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
              title="Logout"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        )}

        <button
          onClick={onToggle}
          className={`byond-nav-item byond-toggle ${collapsed ? "byond-nav-item-collapsed" : ""}`}
          title={collapsed ? "Perluas" : "Ciutkan"}
        >
          <div className="byond-nav-icon-wrap">
            <ChevronLeft className={`byond-nav-icon byond-toggle-icon ${collapsed ? "rotate-180" : ""}`} />
          </div>
          {!collapsed && <span className="byond-nav-text">Ciutkan</span>}
        </button>
      </div>
    </aside>
  );
}
