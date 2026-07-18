"use client";
import React from "react";
import { cn } from "./cn";

/**
 * Textarea component with label, helper text, and error state.
 *
 * @example
 * ```tsx
 * <Textarea
 *   label="Catatan"
 *   placeholder="Tulis catatan..."
 *   rows={3}
 * />
 * ```
 */
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, error, required, disabled, className, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
    const helperId = inputId ? `${inputId}-helper` : undefined;
    const errorId = inputId ? `${inputId}-error` : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
            {label}
            {required && <span className="text-rose-500 ml-0.5">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={cn(
            "w-full input-premium resize-none min-h-[80px]",
            error && "!shadow-[0_0_0_2px_rgba(239,68,68,0.3)] !bg-red-50/50 dark:!bg-red-950/20",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
          {...props}
        />
        {error && (
          <p id={errorId} className="text-[10px] font-medium text-rose-500" role="alert">{error}</p>
        )}
        {helperText && !error && (
          <p id={helperId} className="text-[10px] text-slate-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
