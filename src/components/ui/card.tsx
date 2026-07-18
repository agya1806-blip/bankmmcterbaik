"use client";
import React from "react";
import { cn } from "./cn";

/**
 * Card container with optional glow effect. Use with CardHeader, CardContent, CardFooter.
 *
 * @example
 * ```tsx
 * <Card glow>
 *   <CardHeader title="Ringkasan" subtitle="Bulan ini" />
 *   <CardContent>
 *     <p>Content here</p>
 *   </CardContent>
 *   <CardFooter>
 *     <Button>Lihat Detail</Button>
 *   </CardFooter>
 * </Card>
 * ```
 */
interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, glow, onClick }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-[#131527]/90 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/60",
        "shadow-[0_2px_16px_rgba(13,27,42,0.05)] dark:shadow-[0_2px_16px_rgba(0,0,0,0.2)]",
        "backdrop-blur-md",
        glow && "hover:shadow-[0_6px_24px_rgba(0,140,235,0.08)] dark:hover:shadow-[0_6px_24px_rgba(0,140,235,0.12)] transition-shadow duration-300",
        onClick && "cursor-pointer active:scale-[0.98] transition-transform",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
    >
      {children}
    </div>
  );
}

/**
 * Card header with optional title, subtitle, and action slot.
 */
interface CardHeaderProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, action, className }: CardHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between mb-3", className)}>
      <div className="flex flex-col gap-0.5">
        {title && <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">{title}</h3>}
        {subtitle && <p className="text-[10px] text-slate-400">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

/**
 * Card content wrapper.
 */
interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn("", className)}>{children}</div>;
}

/**
 * Card footer with optional top border.
 */
interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
  bordered?: boolean;
}

export function CardFooter({ children, className, bordered }: CardFooterProps) {
  return (
    <div className={cn("mt-3 pt-3", bordered && "border-t border-slate-100 dark:border-slate-800", className)}>
      {children}
    </div>
  );
}
