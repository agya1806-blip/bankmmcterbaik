"use client";

import { type HTMLAttributes } from "react";

type BadgeVariant = "default" | "secondary" | "destructive" | "success" | "warning" | "danger" | "info" | "outline";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<string, string> = {
  default: "bg-[#7B61FF]/10 text-[#7B61FF] dark:text-[#7B61FF]",
  secondary: "bg-[#FF5C00]/10 text-[#FF5C00] dark:text-[#FF5C00]",
  destructive: "bg-red-100/80 dark:bg-red-900/30 text-red-600 dark:text-red-400",
  success: "bg-emerald-100/80 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
  warning: "bg-amber-100/80 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  danger: "bg-red-100/80 dark:bg-red-900/30 text-red-600 dark:text-red-400",
  info: "bg-[#7B61FF]/10 text-[#7B61FF] dark:text-[#7B61FF]",
  outline: "border border-slate-200/60 dark:border-slate-800/60 text-muted-foreground",
};

export function Badge({ variant = "default", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-all ${variantStyles[variant]} ${className ?? ""}`}
      {...props}
    >
      {children}
    </span>
  );
}
