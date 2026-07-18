"use client";
import React from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "./cn";

/**
 * Page header with back button, title, subtitle, and action slot.
 *
 * @example
 * ```tsx
 * <PageHeader
 *   title="Tambah Produk"
 *   subtitle="Isi detail produk baru"
 *   onBack={() => router.back()}
 *   action={<Button size="sm">Simpan</Button>}
 * />
 * ```
 */
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, onBack, action, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-center gap-3 mb-4", className)}>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors scale-press"
          aria-label="Kembali"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200 truncate font-heading">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[11px] text-slate-400 truncate">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
