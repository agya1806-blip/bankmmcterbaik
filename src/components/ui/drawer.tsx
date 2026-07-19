"use client";
import React, { useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "./cn";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Drawer({ open, onClose, title, children, className }: DrawerProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) { document.addEventListener("keydown", handleEscape); document.body.style.overflow = "hidden"; }
    return () => { document.removeEventListener("keydown", handleEscape); document.body.style.overflow = ""; };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100]">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn("absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white dark:bg-zinc-900 shadow-2xl border-l border-slate-200 dark:border-zinc-800 flex flex-col", className)}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            {title && (
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-zinc-800">
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">{title}</h2>
                <button type="button" onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors" aria-label="Tutup">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
