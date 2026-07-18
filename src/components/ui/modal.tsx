"use client";
import React, { useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "./cn";
import { Button } from "./button";

/**
 * Modal dialog with overlay, close button, title, description, and footer actions.
 *
 * @example
 * ```tsx
 * <Modal
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Hapus Produk"
 *   description="Apakah Anda yakin ingin menghapus produk ini?"
 *   footer={
 *     <div className="flex gap-2">
 *       <Button variant="ghost" onClick={() => setIsOpen(false)}>Batal</Button>
 *       <Button variant="danger" onClick={handleDelete}>Hapus</Button>
 *     </div>
 *   }
 * >
 *   <p>Isi modal body...</p>
 * </Modal>
 * ```
 */
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeStyles: Record<string, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

export function Modal({ open, onClose, title, description, children, footer, className, size = "sm" }: ModalProps) {
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, handleEscape]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "relative w-full bg-white dark:bg-[#0F1926] rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[85vh] overflow-y-auto",
              sizeStyles[size],
              className
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "modal-title" : undefined}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors scale-press"
              aria-label="Tutup"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>

            {title && (
              <h2 id="modal-title" className="text-base font-bold text-slate-800 dark:text-slate-200 pr-8 font-heading">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-[11px] text-slate-400 mt-1">{description}</p>
            )}

            {children && <div className="mt-4">{children}</div>}

            {footer && (
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
