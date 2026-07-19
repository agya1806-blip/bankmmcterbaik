"use client";
import React, { useState } from "react";
import { cn } from "./cn";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

const positionStyles: Record<string, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

export function Tooltip({ content, children, position = "top", className }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className={cn("relative inline-flex", className)} onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)} onFocus={() => setVisible(true)} onBlur={() => setVisible(false)}>
      {children}
      {visible && (
        <div className={cn("absolute z-[200] px-2.5 py-1.5 rounded-xl bg-zinc-900 dark:bg-slate-100 text-white dark:text-zinc-900 text-[9px] font-bold whitespace-nowrap pointer-events-none shadow-lg", positionStyles[position])} role="tooltip">
          {content}
        </div>
      )}
    </div>
  );
}
