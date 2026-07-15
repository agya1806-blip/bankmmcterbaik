"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";

type ButtonVariant = "default" | "primary" | "secondary" | "outline" | "ghost" | "danger" | "destructive";
type ButtonSize = "xs" | "sm" | "md" | "lg" | "icon-xs" | "icon-sm" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<string, string> = {
  default:
    "bg-gradient-to-r from-[#7B61FF] to-[#FF5C00] text-white hover:opacity-90 active:scale-[0.97]",
  primary:
    "bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white hover:opacity-90 active:scale-[0.97]",
  secondary:
    "bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/60 active:scale-[0.97]",
  outline:
    "border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40 active:scale-[0.97]",
  ghost:
    "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 active:scale-[0.97]",
  danger:
    "bg-gradient-to-r from-red-600 to-red-500 text-white hover:opacity-90 active:scale-[0.97]",
  destructive:
    "bg-gradient-to-r from-red-600 to-red-500 text-white hover:opacity-90 active:scale-[0.97]",
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: "h-8 px-3 text-xs rounded-xl gap-1 font-medium",
  sm: "h-9 px-4 text-sm rounded-xl gap-1.5 font-medium",
  md: "h-10 px-5 text-sm rounded-xl gap-2 font-semibold",
  lg: "h-11 px-6 text-base rounded-2xl gap-2 font-semibold",
  "icon-xs": "size-8 rounded-xl",
  "icon-sm": "size-9 rounded-xl",
  icon: "size-10 rounded-xl",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", size = "md", className, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled}
      className={`inline-flex items-center justify-center relative overflow-hidden transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B61FF]/40 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ${variantStyles[variant]} ${sizeStyles[size]} ${className ?? ""}`}
      {...props}
    >
      {children}
    </button>
  )
);
Button.displayName = "Button";

export { Button, type ButtonProps };
