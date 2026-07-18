"use client";
import React from "react";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "./cn";

/**
 * Breadcrumb navigation component.
 *
 * @example
 * ```tsx
 * <Breadcrumb
 *   items={[
 *     { label: "Beranda", href: "/" },
 *     { label: "Produk", href: "/products" },
 *     { label: "Detail" },
 *   ]}
 * />
 * ```
 */
interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  homeIcon?: boolean;
}

export function Breadcrumb({ items, className, homeIcon = true }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-1 overflow-x-auto scrollbar-hide", className)}>
      {homeIcon && (
        <>
          <Home className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
        </>
      )}
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <React.Fragment key={i}>
            {item.href ? (
              <a
                href={item.href}
                className={cn(
                  "text-[10px] font-bold whitespace-nowrap transition-colors",
                  isLast
                    ? "text-slate-800 dark:text-slate-200 pointer-events-none"
                    : "text-slate-400 hover:text-[#008CEB]"
                )}
              >
                {item.label}
              </a>
            ) : (
              <span
                className={cn(
                  "text-[10px] font-bold whitespace-nowrap",
                  isLast ? "text-slate-800 dark:text-slate-200" : "text-slate-400"
                )}
              >
                {item.label}
              </span>
            )}
            {!isLast && <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
