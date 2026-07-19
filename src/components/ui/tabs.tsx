"use client";
import React from "react";
import { cn } from "./cn";

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
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn("flex gap-1 p-1 bg-slate-100 dark:bg-zinc-800 rounded-2xl", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold rounded-xl whitespace-nowrap transition-all",
            activeTab === tab.key
              ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
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

interface TabContentProps {
  children: React.ReactNode;
  active: boolean;
  className?: string;
}

export function TabContent({ children, active, className }: TabContentProps) {
  if (!active) return null;
  return <div className={cn("mt-4", className)} role="tabpanel">{children}</div>;
}
