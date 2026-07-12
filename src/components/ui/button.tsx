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
    "bg-gradient-to-br from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:brightness-110 active:brightness-95 active:scale-[0.97]",
  primary:
    "bg-gradient-to-br from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:brightness-110 active:brightness-95 active:scale-[0.97]",
  secondary:
    "bg-foreground/5 text-foreground hover:bg-foreground/10 active:scale-[0.97]",
  outline:
    "border border-border bg-transparent text-foreground hover:bg-muted/50 active:scale-[0.97]",
  ghost:
    "text-muted-foreground hover:text-foreground hover:bg-muted/50 active:scale-[0.97]",
  danger:
    "bg-gradient-to-br from-red-600 to-red-500 text-white shadow-lg shadow-red-500/20 hover:shadow-red-500/30 hover:brightness-110 active:brightness-95 active:scale-[0.97]",
  destructive:
    "bg-gradient-to-br from-red-600 to-red-500 text-white shadow-lg shadow-red-500/20 hover:shadow-red-500/30 hover:brightness-110 active:brightness-95 active:scale-[0.97]",
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: "h-8 px-3 text-xs rounded-xl gap-1",
  sm: "h-10 px-4 text-sm rounded-xl gap-1.5",
  md: "h-11 px-5 text-sm rounded-2xl gap-2",
  lg: "h-12 px-6 text-base rounded-2xl gap-2",
  "icon-xs": "size-8 rounded-xl",
  "icon-sm": "size-10 rounded-xl",
  icon: "size-11 rounded-2xl",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", size = "md", className, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled}
      className={`btn-premium ${variantStyles[variant]} ${sizeStyles[size]} ${
        disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
      } ${className ?? ""}`}
      {...props}
    >
      {children}
    </button>
  )
);
Button.displayName = "Button";

export { Button, type ButtonProps };
