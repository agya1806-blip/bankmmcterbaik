import React from "react";
import { cn } from "./cn";

const cardBase = "bg-white dark:bg-zinc-900/90 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-[0_2px_16px_rgba(13,27,42,0.05)] dark:shadow-[0_2px_16px_rgba(0,0,0,0.2)] backdrop-blur-md";

export function Card({ className, children, glow, onClick, ...props }: React.HTMLAttributes<HTMLDivElement> & { glow?: boolean; onClick?: () => void }) {
  return (
    <div
      className={cn(cardBase, glow && "hover:shadow-[0_6px_24px_rgba(16,185,129,0.08)] dark:hover:shadow-[0_6px_24px_rgba(16,185,129,0.12)] transition-shadow duration-300", onClick && "cursor-pointer active:scale-[0.98] transition-transform", className)}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
      {...props}
    >
      {children}
    </div>
  );
}
export function CardHeader({ title, subtitle, action, className, children, ...props }: React.HTMLAttributes<HTMLDivElement> & { title?: string; subtitle?: string; action?: React.ReactNode }) {
  const content = children || (
    <div className="flex items-center justify-between">
      <div className="flex flex-col gap-0.5">
        {title && <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">{title}</h3>}
        {subtitle && <p className="text-[10px] text-slate-400">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
  return <div className={cn("px-5 pt-5 pb-0", className)} {...props}>{content}</div>;
}
export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props}>{children}</div>;
}
export function CardFooter({ className, children, bordered, ...props }: React.HTMLAttributes<HTMLDivElement> & { bordered?: boolean }) {
  return <div className={cn("px-5 pb-5 pt-0", bordered && "pt-3 border-t border-slate-100 dark:border-zinc-800", className)} {...props}>{children}</div>;
}
