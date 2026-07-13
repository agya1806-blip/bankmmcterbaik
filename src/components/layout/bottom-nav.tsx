"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard, Briefcase, Wallet, FileText, Settings,
} from "lucide-react";

const ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/buku-usaha", label: "Usaha", icon: Briefcase },
  { href: "/buku-usaha/dompet", label: "Dompet", icon: Wallet },
  { href: "/buku-usaha/laporan-keuangan", label: "Laporan", icon: FileText },
  { href: "/buku-usaha/pengaturan", label: "Atur", icon: Settings },
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [pressed, setPressed] = useState<string | null>(null);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="byond-bottom-nav">
      <div className="byond-bottom-nav-inner">
        {ITEMS.map((item) => {
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
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
