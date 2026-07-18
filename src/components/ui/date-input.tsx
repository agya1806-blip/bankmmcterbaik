"use client";
import React from "react";
import { cn } from "./cn";

/**
 * Date input component with label, helper, and error state.
 *
 * @example
 * ```tsx
 * <DateInput
 *   label="Tanggal Transaksi"
 *   value={date}
 *   onChange={setDate}
 *   required
 * />
 * ```
 */
interface DateInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function DateInput({
  label,
  value,
  onChange,
  error,
  helperText,
  required,
  disabled,
  className,
  id,
}: DateInputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        id={inputId}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        aria-invalid={!!error}
        className={cn(
          "w-full input-premium",
          error && "!shadow-[0_0_0_2px_rgba(239,68,68,0.3)] !bg-red-50/50 dark:!bg-red-950/20",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      />
      {error && <p className="text-[10px] font-medium text-rose-500" role="alert">{error}</p>}
      {helperText && !error && <p className="text-[10px] text-slate-400">{helperText}</p>}
    </div>
  );
}
