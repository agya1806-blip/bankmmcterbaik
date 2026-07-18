"use client";
import React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./button";

/**
 * Reusable confirmation dialog with confirm/cancel actions.
 *
 * @example
 * ```tsx
 * <ConfirmDialog
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onConfirm={handleDelete}
 *   title="Hapus Data"
 *   message="Data yang dihapus tidak dapat dikembalikan."
 *   confirmLabel="Hapus"
 *   confirmVariant="danger"
 *   loading={isDeleting}
 * />
 * ```
 */
interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "primary" | "danger" | "secondary";
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Konfirmasi",
  message = "Apakah Anda yakin?",
  icon,
  confirmLabel = "Ya",
  cancelLabel = "Batal",
  confirmVariant = "primary",
  loading = false,
}: ConfirmDialogProps) {
  return (
    <div
      className={`fixed inset-0 z-[110] flex items-center justify-center p-4 ${open ? "" : "pointer-events-none"}`}
      style={{ display: open ? "flex" : "none" }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        className="relative w-full max-w-xs bg-white dark:bg-[#0F1926] rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-in text-center"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
      >
        <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
          {icon || <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />}
        </div>
        <h2 id="confirm-title" className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1 font-heading">
          {title}
        </h2>
        <p id="confirm-message" className="text-[11px] text-slate-400 mb-5">
          {message}
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" size="md" onClick={onClose} className="flex-1" disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} size="md" onClick={onConfirm} className="flex-1" loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
