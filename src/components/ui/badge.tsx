import React from "react";
import { cn } from "./cn";

const badgeVariants = {
  default: "bg-[#008CEB]/10 text-[#008CEB]",
  success: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
  warning: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  danger: "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400",
  info: "bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400",
};

interface BadgeProps {
  className?: string;
  variant?: keyof typeof badgeVariants;
  children: React.ReactNode;
}

export function Badge({ className, variant = "default", children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider",
        badgeVariants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
