"use client";
import React, { useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "./cn";

/**
 * Slide-in drawer panel from the right side.
 *
 * @example
 * ```tsx
 * <Drawer open={isOpen} onClose={() => setIsOpen(false)} title="Filter">
 *   <div>Drawer content</div>
 * </Drawer>
 * ```
 */
interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Drawer({ open, onClose, title, children, className }: DrawerProps) {
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
        <div className="fixed inset-0 z-[100]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white dark:bg-[#0A1628] shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col",
              className
            )}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            {title && (
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 font-heading">{title}</h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors scale-press"
                  aria-label="Tutup"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-4">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
