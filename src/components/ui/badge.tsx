"use client";

import { type HTMLAttributes } from "react";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "outline";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<string, string> = {
  default: "bg-muted text-muted-foreground",
  success: "bg-emerald-100/80 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
  warning: "bg-amber-100/80 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  danger: "bg-red-100/80 dark:bg-red-900/30 text-red-600 dark:text-red-400",
  info: "bg-blue-100/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  outline: "border border-border text-muted-foreground",
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
