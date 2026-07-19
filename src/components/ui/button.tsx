"use client";
import React from "react";
import { cn } from "./cn";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "icon-sm" | "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({ variant = "primary", size = "md", loading, className, children, ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center gap-1.5 font-bold transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = { "icon-sm": "w-8 h-8 rounded-xl", sm: "px-3.5 py-2 text-[10px] rounded-xl", md: "px-5 py-2.5 text-xs rounded-2xl", lg: "px-6 py-3 text-sm rounded-2xl" };
  const variants = {
    primary: "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/35 hover:-translate-y-0.5",
    secondary: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/50",
    outline: "border-2 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-slate-400 hover:border-emerald-500 hover:text-emerald-600 dark:hover:border-emerald-400",
    ghost: "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800",
    danger: "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/35 hover:-translate-y-0.5",
  };
  return (
    <button className={cn(base, sizes[size], variants[variant], (loading || props.disabled) && "pointer-events-none", className)} disabled={loading || props.disabled} {...props}>
      {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
      {children}
    </button>
  );
}
