"use client";
import React from "react";
import { cn } from "./cn";

/**
 * Currency input that formats values as Indonesian Rupiah (Rp).
 *
 * @example
 * ```tsx
 * <CurrencyInput
 *   label="Harga"
 *   value={price}
 *   onChange={setPrice}
 *   placeholder="0"
 * />
 * ```
 */
interface CurrencyInputProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  required?: boolean;
  className?: string;
  id?: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

function unformatCurrency(str: string): number {
  return Number(str.replace(/[^0-9]/g, "")) || 0;
}

export function CurrencyInput({
  label,
  value,
  onChange,
  placeholder = "0",
  disabled,
  error,
  helperText,
  required,
  className,
  id,
}: CurrencyInputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
  const [display, setDisplay] = React.useState(() => value ? formatCurrency(value) : "");
  const [focused, setFocused] = React.useState(false);

  React.useEffect(() => {
    if (!focused) setDisplay(value ? formatCurrency(value) : "");
  }, [value, focused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    const num = Number(raw) || 0;
    setDisplay(formatCurrency(num));
    onChange(num);
  };

  const handleBlur = () => {
    setFocused(false);
    if (!value) setDisplay("");
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[11px] font-bold text-slate-400 pointer-events-none">
          Rp
        </span>
        <input
          id={inputId}
          type="text"
          inputMode="numeric"
          value={focused ? display : (value ? formatCurrency(value) : "")}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={!!error}
          className={cn(
            "w-full input-premium pl-9 text-right font-bold",
            error && "!shadow-[0_0_0_2px_rgba(239,68,68,0.3)] !bg-red-50/50 dark:!bg-red-950/20",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
        />
      </div>
      {error && <p className="text-[10px] font-medium text-rose-500" role="alert">{error}</p>}
      {helperText && !error && <p className="text-[10px] text-slate-400">{helperText}</p>}
    </div>
  );
}
