"use client";
import React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./button";

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

export function ConfirmDialog({ open, onClose, onConfirm, title = "Konfirmasi", message = "Apakah Anda yakin?", icon, confirmLabel = "Ya", cancelLabel = "Batal", confirmVariant = "primary", loading = false }: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-xs bg-white dark:bg-zinc-900/95 rounded-3xl p-5 shadow-2xl border border-slate-100 dark:border-zinc-800 text-center" role="alertdialog" aria-modal="true">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center mx-auto mb-4">
          {icon || <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />}
        </div>
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">{title}</h2>
        <p className="text-[11px] text-slate-400 mb-5">{message}</p>
        <div className="flex gap-2">
          <Button variant="ghost" size="md" onClick={onClose} className="flex-1" disabled={loading}>{cancelLabel}</Button>
          <Button variant={confirmVariant} size="md" onClick={onConfirm} className="flex-1" loading={loading}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
