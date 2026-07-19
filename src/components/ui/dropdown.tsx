"use client";
import React, { useState, useRef, useEffect } from "react";
import { cn } from "./cn";

interface DropdownItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  variant?: "default" | "danger";
  disabled?: boolean;
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
  className?: string;
}

export function Dropdown({ trigger, items, align = "right", className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className={cn("relative inline-block", className)}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div
          className={cn(
            "absolute top-full mt-1.5 z-50 min-w-[150px] bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-slate-200 dark:border-zinc-700 py-1.5 overflow-hidden",
            align === "right" ? "right-0" : "left-0"
          )}
          role="menu"
        >
          {items.map((item, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { item.onClick(); setOpen(false); }}
              disabled={item.disabled}
              className={cn(
                "w-full flex items-center gap-2 px-3.5 py-2.5 text-[11px] font-bold text-left transition-colors",
                item.variant === "danger"
                  ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800",
                item.disabled && "opacity-50 cursor-not-allowed"
              )}
              role="menuitem"
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
