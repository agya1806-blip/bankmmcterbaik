"use client";
import React from "react";
import { Inbox } from "lucide-react";
import { cn } from "./cn";

/**
 * Empty state placeholder with icon, title, description, and optional action.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon={<Package className="w-8 h-8" />}
 *   title="Belum ada produk"
 *   description="Tambahkan produk pertama Anda"
 *   action={<Button onClick={handleAdd}>Tambah Produk</Button>}
 * />
 * ```
 */
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
        {icon || <Inbox className="w-7 h-7 text-slate-400" />}
      </div>
      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{title}</h3>
      {description && (
        <p className="text-[11px] text-slate-400 max-w-[220px] mb-4">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
