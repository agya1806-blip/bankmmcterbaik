import React from "react";
import { cn } from "./cn";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helper?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ label, helper, error, className, id, ...props }, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1.5">
      {label && <label htmlFor={inputId} className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wide uppercase">{label}</label>}
      <textarea
        ref={ref}
        id={inputId}
        className={cn(
          "w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-slate-800 dark:text-slate-200 resize-none min-h-[80px]",
          "focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500",
          "placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-200",
          error && "border-red-400 focus:border-red-500 focus:ring-red-500/30",
          className
        )}
        {...props}
      />
      {helper && !error && <p className="text-[10px] text-slate-400">{helper}</p>}
      {error && <p className="text-[10px] text-red-500 font-medium">{error}</p>}
    </div>
  );
});
Textarea.displayName = "Textarea";
