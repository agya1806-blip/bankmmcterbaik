"use client";
import React, { useState, useRef, useEffect } from "react";
import { cn } from "./cn";

/**
 * Dropdown menu triggered by a click on the trigger element.
 *
 * @example
 * ```tsx
 * <Dropdown
 *   trigger={<Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>}
 *   items={[
 *     { label: "Edit", onClick: handleEdit },
 *     { label: "Hapus", onClick: handleDelete, variant: "danger" },
 *   ]}
 * />
 * ```
 */
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
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className={cn("relative inline-block", className)}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div
          className={cn(
            "absolute top-full mt-1 z-50 min-w-[140px] bg-white dark:bg-[#131527] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 animate-scale-in overflow-hidden",
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
                "w-full flex items-center gap-2 px-3 py-2.5 text-[11px] font-bold text-left transition-colors",
                item.variant === "danger"
                  ? "text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5",
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
