"use client";
import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "./cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: "sm" | "md" | "lg";
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, size = "md", footer, children }: ModalProps) {
  useEffect(() => { if (open) { document.body.style.overflow = "hidden"; } else { document.body.style.overflow = ""; } return () => { document.body.style.overflow = ""; }; }, [open]);
  const widths = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg" };
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
          <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn("bg-white dark:bg-zinc-900/95 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-2xl w-full max-h-[85vh] overflow-y-auto", widths[size])} onClick={e => e.stopPropagation()}>
            {title && (
              <div className="flex items-center justify-between px-5 pt-5 pb-0">
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">{title}</h2>
                <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"><X className="w-4 h-4 text-slate-500" /></button>
              </div>
            )}
            <div className="p-5">{children}</div>
            {footer && <div className="px-5 pb-5 pt-0">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
