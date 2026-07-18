import React from "react";
import { cn } from "./cn";

const variants = {
  primary:
    "bg-gradient-to-r from-[#008CEB] to-[#00C9A7] text-white shadow-lg shadow-[#008CEB]/20 hover:shadow-xl hover:shadow-[#008CEB]/30 active:scale-[0.97]",
  default:
    "bg-gradient-to-r from-[#008CEB] to-[#00C9A7] text-white shadow-lg shadow-[#008CEB]/20 hover:shadow-xl hover:shadow-[#008CEB]/30 active:scale-[0.97]",
  secondary:
    "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.97]",
  ghost:
    "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400",
  danger:
    "bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/20 hover:shadow-xl hover:shadow-rose-500/30 active:scale-[0.97]",
  outline:
    "border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0F1926] hover:bg-slate-50 dark:hover:bg-slate-800/50 active:scale-[0.97]",
};

const sizes = {
  sm: "h-8 px-3 text-[10px]",
  md: "h-10 px-4 text-xs",
  lg: "h-12 px-6 text-sm",
  icon: "h-10 w-10",
  "icon-sm": "h-8 w-8",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
}

export function Button({
  className,
  variant = "default",
  size = "md",
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all duration-200",
        variants[variant],
        sizes[size],
        (disabled || loading) && "opacity-50 cursor-not-allowed pointer-events-none",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
      {children}
    </button>
  );
}
