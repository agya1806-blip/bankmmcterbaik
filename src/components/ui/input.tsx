import React from "react";
import { cn } from "./cn";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({ className, label, error, icon, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        )}
        <input
          className={cn(
            "w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700",
            "bg-white dark:bg-[#0F1926] text-sm",
            "focus:outline-none focus:ring-2 focus:ring-[#008CEB]/40 focus:border-transparent",
            "placeholder:text-slate-400 dark:placeholder:text-slate-500",
            "transition-all duration-200",
            icon ? "pl-10 pr-4" : "px-4",
            error && "border-rose-300 focus:ring-rose-500/40",
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-[10px] text-rose-500 font-medium">{error}</p>}
    </div>
  );
}
