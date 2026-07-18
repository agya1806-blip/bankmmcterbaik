"use client";

import React from "react";
import { cn } from "@/components/ui/cn";
import { Bell } from "lucide-react";

interface NotificationBellProps {
  count?: number;
  onClick?: () => void;
  className?: string;
}

export function NotificationBell({ count = 0, onClick, className }: NotificationBellProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center",
        "hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95",
        className
      )}
    >
      <Bell className="w-4 h-4 text-slate-500" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF3B5C] text-white text-[8px] font-bold flex items-center justify-center shadow-lg shadow-[#FF3B5C]/30">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}
