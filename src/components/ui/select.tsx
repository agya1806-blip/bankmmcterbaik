"use client";
import React from "react";
import { cn } from "./cn";

/**
 * Select component with label, helper text, error state, and options.
 *
 * @example
 * ```tsx
 * <Select
 *   label="Kategori"
 *   options={[
 *     { value: "makanan", label: "Makanan" },
 *     { value: "minuman", label: "Minuman" },
 *   ]}
 *   placeholder="Pilih kategori"
 * />
 * ```
 */
interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, helperText, error, required, disabled, options, placeholder, className, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
            {label}
            {required && <span className="text-rose-500 ml-0.5">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          className={cn(
            "w-full input-premium appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%238B9DB5%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right_8px_center] bg-no-repeat pr-8",
            error && "!shadow-[0_0_0_2px_rgba(239,68,68,0.3)] !bg-red-50/50 dark:!bg-red-950/20",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>{placeholder}</option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {error && (
          <p className="text-[10px] font-medium text-rose-500" role="alert">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-[10px] text-slate-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
