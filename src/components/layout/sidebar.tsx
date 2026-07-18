"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSessionStore } from "@/store/useSessionStore";
import { cn } from "@/components/ui/cn";
import {
  LayoutDashboard, ShoppingCart, Package, Settings, Users, Truck,
  Wallet, ArrowRightLeft, Receipt, Handshake, Building2, UserCog,
  BarChart3, X, ChevronRight, CircleUser, Factory,
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

function useSidebarMenu(): SidebarGroup[] {
  const pathname = usePathname();
  const { currentBranch } = useSessionStore();
  const cabang = currentBranch || "percetakan";

  const groups: SidebarGroup[] = [
    {
      label: "",
      items: [
        {
          label: "Dashboard",
          icon: <LayoutDashboard className="w-4 h-4" />,
          href: "/buku-usaha",
          isActive: (p) => p === "/buku-usaha",
        },
      ],
    },
    {
      label: "OPERASIONAL",
      items: [
        {
          label: "Kasir",
          icon: <ShoppingCart className="w-4 h-4" />,
          href: `/buku-usaha/${cabang}/kasir`,
          isActive: (p) => p.includes("/kasir"),
        },
        {
          label: "Produk",
          icon: <Package className="w-4 h-4" />,
          href: `/buku-usaha/${cabang}/inventory`,
          isActive: (p) => p.includes("/inventory"),
        },
        {
          label: "Produksi",
          icon: <Factory className="w-4 h-4" />,
          href: `/buku-usaha/${cabang}/produksi`,
          isActive: (p) => p.includes("/produksi"),
        },
        {
          label: "Pelanggan",
          icon: <Users className="w-4 h-4" />,
          href: `/buku-usaha/${cabang}/pelanggan`,
          isActive: (p) => p.includes("/pelanggan"),
        },
        {
          label: "Supplier",
          icon: <Truck className="w-4 h-4" />,
          href: `/buku-usaha/${cabang}/supplier`,
          isActive: (p) => p.includes("/supplier"),
        },
      ],
    },
    {
      label: "KEUANGAN",
      items: [
        {
          label: "Dompet",
          icon: <Wallet className="w-4 h-4" />,
          href: `/buku-usaha/${cabang}/dompet`,
          isActive: (p) => p.includes("/dompet"),
        },
        {
          label: "Cashflow",
          icon: <Receipt className="w-4 h-4" />,
          href: `/buku-usaha/${cabang}/cashflow`,
          isActive: (p) => p.includes("/cashflow"),
        },
        {
          label: "Transfer",
          icon: <ArrowRightLeft className="w-4 h-4" />,
          href: `/buku-usaha/${cabang}/transfer`,
          isActive: (p) => p.includes("/transfer"),
        },
        {
          label: "Piutang",
          icon: <Handshake className="w-4 h-4" />,
          href: `/buku-usaha/${cabang}/transaksi`,
          isActive: (p) => p.includes("/transaksi"),
        },
      ],
    },
    {
      label: "OWNER",
      items: [
        {
          label: "Buku Global",
          icon: <BarChart3 className="w-4 h-4" />,
          href: "/buku-global",
          isActive: (p) => p.includes("/buku-global"),
        },
        {
          label: "Cabang",
          icon: <Building2 className="w-4 h-4" />,
          href: "/buku-usaha/usaha",
          isActive: (p) => p.includes("/buku-usaha/usaha"),
        },
        {
          label: "User",
          icon: <UserCog className="w-4 h-4" />,
          href: `/buku-usaha/${cabang}/users`,
          isActive: (p) => p.includes("/users"),
        },
      ],
    },
    {
      label: "PENGATURAN",
      items: [
        {
          label: "Pengaturan",
          icon: <Settings className="w-4 h-4" />,
          href: `/buku-usaha/${cabang}/pengaturan`,
          isActive: (p) => p.includes("/pengaturan"),
        },
        {
          label: "Profile",
          icon: <CircleUser className="w-4 h-4" />,
          href: "/profile",
          isActive: (p) => p === "/profile",
        },
      ],
    },
  ];

  return groups;
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
      {/* Logo area */}
      <div className="flex items-center gap-3 h-16 px-5 border-b border-slate-100 dark:border-slate-800/60 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#008CEB] to-[#00C9A7] flex items-center justify-center text-white text-sm font-extrabold shadow-lg shadow-[#008CEB]/20">
          M
        </div>
        <div>
          <p className="text-sm font-heading font-extrabold tracking-tight text-slate-800 dark:text-white">
            MMCBANK
          </p>
          <p className="text-[9px] text-slate-400 font-medium">Multi-Business Manager</p>
        </div>
      </div>

      {/* Menu groups */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5 scrollbar-thin">
        {groups.map((group) => (
          <div key={group.label || "main"}>
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
                        ? "bg-[#008CEB]/10 text-[#008CEB] dark:text-[#60B5FF] font-bold"
                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                  >
                    <span className={cn("shrink-0", active ? "text-[#008CEB]" : "text-slate-400 group-hover:text-slate-500")}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                    {active && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#008CEB]" />
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
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-[240px] xl:w-[260px] h-screen sticky top-0 bg-white dark:bg-[#0F1926] border-r border-slate-100 dark:border-slate-800/60 shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile drawer overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          <div className="absolute left-0 top-0 bottom-0 w-[280px] bg-white dark:bg-[#0F1926] shadow-2xl animate-slide-up">
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
