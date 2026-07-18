"use client";
import React from "react";
import { cn } from "./cn";

/**
 * Tabs container that manages active tab state.
 *
 * @example
 * ```tsx
 * <Tabs
 *   tabs={[
 *     { key: "detail", label: "Detail" },
 *     { key: "riwayat", label: "Riwayat" },
 *   ]}
 *   activeTab={activeTab}
 *   onChange={setActiveTab}
 * />
 * ```
 */
interface Tab {
  key: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (key: string) => void;
  className?: string;
  variant?: "pill" | "underline";
}

export function Tabs({ tabs, activeTab, onChange, className, variant = "pill" }: TabsProps) {
  return (
    <div className={cn(
      "flex gap-1 overflow-x-auto scrollbar-hide -mx-1 px-1",
      variant === "underline" && "border-b border-slate-200 dark:border-slate-800 gap-0",
      className
    )}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={cn(
            "flex items-center gap-1.5 whitespace-nowrap transition-all scale-press",
            variant === "pill" ? (
              activeTab === tab.key
                ? "tab-pill tab-pill-active"
                : "tab-pill tab-pill-inactive"
            ) : (
              activeTab === tab.key
                ? "px-3 py-2 text-[11px] font-bold text-[#008CEB] border-b-2 border-[#008CEB] -mb-[1px]"
                : "px-3 py-2 text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            )
          )}
          role="tab"
          aria-selected={activeTab === tab.key}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Individual Tab content panel (shown when active).
 *
 * @example
 * ```tsx
 * <Tab active={activeTab === "detail"}>
 *   Konten detail...
 * </Tab>
 * ```
 */
interface TabProps {
  children: React.ReactNode;
  active: boolean;
  className?: string;
}

export function Tab({ children, active, className }: TabProps) {
  if (!active) return null;
  return (
    <div className={cn("animate-fade-in", className)} role="tabpanel">
      {children}
    </div>
  );
}
