"use client";
import React from "react";
import { cn } from "./cn";

interface CurrencyInputProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  helper?: string;
  required?: boolean;
  className?: string;
  id?: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

export function CurrencyInput({ label, value, onChange, placeholder = "0", disabled, error, helper, required, className, id }: CurrencyInputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  const [focused, setFocused] = React.useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    onChange(Number(raw) || 0);
  };

  const displayValue = focused || value > 0 ? formatCurrency(value) : "";

  return (
    <div className="space-y-1.5">
      {label && <label htmlFor={inputId} className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wide uppercase">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-[11px] font-bold text-slate-400 pointer-events-none">Rp</span>
        <input
          id={inputId}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "w-full h-10 pl-10 pr-4 rounded-2xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-slate-800 dark:text-slate-200 text-right font-bold",
            "focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500",
            "placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-200",
            error && "border-red-400 focus:border-red-500 focus:ring-red-500/30",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
        />
      </div>
      {helper && !error && <p className="text-[10px] text-slate-400">{helper}</p>}
      {error && <p className="text-[10px] text-red-500 font-medium">{error}</p>}
    </div>
  );
}
