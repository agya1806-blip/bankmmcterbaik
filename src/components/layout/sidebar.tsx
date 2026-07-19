"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/components/ui/cn";
import {
  LayoutDashboard, ShoppingCart, Package, Settings, Users,
  Wallet, ArrowRightLeft, Receipt, Handshake, Building2, UserCog,
  BarChart3, X, CircleUser, BookOpen, User, FileText, Calendar, RefreshCw,
} from "lucide-react";

interface SidebarItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  isActive?: (path: string) => boolean;
}

interface SidebarGroup {
  label: string;
  items: SidebarItem[];
}

function formatCabang(slug: string): string {
  return slug
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function useSidebarMenu(): SidebarGroup[] {
  const pathname = usePathname();

  const match = pathname.match(/^\/buku-bisnis\/([^/]+)/);
  const cabang = match ? match[1] : null;
  const isUnitPage = cabang !== null;

  if (isUnitPage) {
    return [
      {
        label: formatCabang(cabang),
        items: [
          {
            label: "Dashboard",
            icon: <LayoutDashboard className="w-4 h-4" />,
            href: `/buku-bisnis/${cabang}`,
            isActive: (p) => p === `/buku-bisnis/${cabang}`,
          },
          {
            label: "Kasir",
            icon: <ShoppingCart className="w-4 h-4" />,
            href: `/buku-bisnis/${cabang}/kasir`,
            isActive: (p) => p.includes("/kasir"),
          },
          {
            label: "Transaksi",
            icon: <Receipt className="w-4 h-4" />,
            href: `/buku-bisnis/${cabang}/transaksi`,
            isActive: (p) => p.includes("/transaksi"),
          },
          {
            label: "Invoice",
            icon: <FileText className="w-4 h-4" />,
            href: `/buku-bisnis/${cabang}/transaksi`,
            isActive: (p) => p.includes("/transaksi"),
          },
          {
            label: "Produk",
            icon: <Package className="w-4 h-4" />,
            href: `/buku-bisnis/${cabang}/produk`,
            isActive: (p) => p.includes("/produk"),
          },
          {
            label: "Pelanggan",
            icon: <Users className="w-4 h-4" />,
            href: `/buku-bisnis/${cabang}/pelanggan`,
            isActive: (p) => p.includes("/pelanggan"),
          },
          {
            label: "Laporan",
            icon: <BarChart3 className="w-4 h-4" />,
            href: `/buku-bisnis/${cabang}/laporan`,
            isActive: (p) => p.includes("/laporan"),
          },
        ],
      },
      {
        label: "PENGATURAN",
        items: [
          {
            label: "Pengaturan Unit",
            icon: <Settings className="w-4 h-4" />,
            href: `/buku-bisnis/${cabang}/pengaturan`,
            isActive: (p) => p.includes("/pengaturan"),
          },
          {
            label: "Budget",
            icon: <Wallet className="w-4 h-4" />,
            href: `/buku-bisnis/${cabang}/budget`,
            isActive: (p) => p.includes("/budget"),
          },
          {
            label: "Period Closing",
            icon: <Calendar className="w-4 h-4" />,
            href: `/buku-bisnis/${cabang}/period`,
            isActive: (p) => p.includes("/period"),
          },
          {
            label: "Users",
            icon: <UserCog className="w-4 h-4" />,
            href: `/buku-bisnis/${cabang}/users`,
            isActive: (p) => p.includes("/users"),
          },
          {
            label: "Sedekah",
            icon: <Handshake className="w-4 h-4" />,
            href: `/buku-bisnis/${cabang}/sedekah`,
            isActive: (p) => p.includes("/sedekah"),
          },
          {
            label: "Exchange Rate",
            icon: <ArrowRightLeft className="w-4 h-4" />,
            href: `/buku-bisnis/${cabang}/exchange-rate`,
            isActive: (p) => p.includes("/exchange-rate"),
          },
          {
            label: "Recurring",
            icon: <RefreshCw className="w-4 h-4" />,
            href: `/buku-bisnis/${cabang}/recurring`,
            isActive: (p) => p.includes("/recurring"),
          },
        ],
      },
      {
        label: "",
        items: [
          {
            label: "Dashboard Utama",
            icon: <LayoutDashboard className="w-4 h-4" />,
            href: "/",
            isActive: (p) => p === "/",
          },
          {
            label: "Buku",
            icon: <BookOpen className="w-4 h-4" />,
            href: "/buku",
            isActive: (p) => p === "/buku",
          },
        ],
      },
    ];
  }

  return [
    {
      label: "UTAMA",
      items: [
        {
          label: "Dashboard",
          icon: <LayoutDashboard className="w-4 h-4" />,
          href: "/",
          isActive: (p) => p === "/",
        },
        {
          label: "Buku",
          icon: <BookOpen className="w-4 h-4" />,
          href: "/buku",
          isActive: (p) => p === "/buku",
        },
        {
          label: "Profil",
          icon: <CircleUser className="w-4 h-4" />,
          href: "/profile",
          isActive: (p) => p === "/profile",
        },
      ],
    },
    {
      label: "BUKU",
      items: [
        {
          label: "Pribadi",
          icon: <User className="w-4 h-4" />,
          href: "/buku-pribadi",
          isActive: (p) => p === "/buku-pribadi",
        },
        {
          label: "Keluarga",
          icon: <Users className="w-4 h-4" />,
          href: "/buku-keluarga",
          isActive: (p) => p === "/buku-keluarga",
        },
        {
          label: "Bisnis",
          icon: <Building2 className="w-4 h-4" />,
          href: "/buku-bisnis",
          isActive: (p) => p.startsWith("/buku-bisnis"),
        },
      ],
    },
  ];
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const groups = useSidebarMenu();

  const handleNav = (href: string) => {
    router.push(href);
    onClose();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 h-16 px-5 border-b border-slate-100 dark:border-slate-800/60 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-400 flex items-center justify-center text-white text-sm font-extrabold shadow-lg shadow-emerald-500/20">
          M
        </div>
        <div>
          <p className="text-sm font-heading font-extrabold tracking-tight text-slate-800 dark:text-white">
            MMCBANK
          </p>
          <p className="text-[9px] text-slate-400 font-medium">Multi-Business Manager</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5 scrollbar-thin">
        {groups.map((group) => (
          <div key={group.label || "links"}>
            {group.label && (
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 px-3 mb-2">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = item.isActive?.(pathname) ?? false;
                return (
                  <button
                    key={item.href}
                    onClick={() => handleNav(item.href)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 group",
                      active
                        ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-bold"
                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                  >
                    <span className={cn("shrink-0", active ? "text-emerald-500" : "text-slate-400 group-hover:text-slate-500")}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                    {active && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex lg:flex-col lg:w-[240px] xl:w-[260px] h-screen sticky top-0 bg-white dark:bg-[#0F1926] border-r border-slate-100 dark:border-slate-800/60 shrink-0">
        {sidebarContent}
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          <div className="absolute left-0 top-0 bottom-0 w-[280px] bg-white/90 dark:bg-[#0F1926]/90 backdrop-blur-xl shadow-2xl">
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
