"use client";

import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";

function Dialog({ open, onOpenChange, trigger, children }: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open !== undefined ? open : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  return (
    <>
      {trigger && (
        <div onClick={() => setOpen(true)} style={{ display: "inline-flex" }}>{trigger}</div>
      )}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm animate-fade-in"
            onClick={() => setOpen(false)}
          />
          <div ref={contentRef} className="relative z-10 w-full sm:max-w-lg bg-white/95 dark:bg-[var(--card)]/95 backdrop-blur-2xl border border-border/50 shadow-2xl sm:rounded-2xl rounded-t-2xl p-6 animate-scale-in max-h-[90vh] overflow-y-auto pb-4 sm:pb-6">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 flex items-center justify-center size-11 rounded-xl hover:bg-muted/50 transition-colors text-muted-foreground active:scale-90"
            >
              <X className="size-4" />
            </button>
            {children}
          </div>
        </div>
      )}
    </>
  );
}

function DialogTrigger({ children, render }: { children?: React.ReactNode; render?: React.ReactElement }) {
  return <>{render || children}</>;
}

function DialogHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex flex-col gap-1.5 mb-6 ${className ?? ""}`}>{children}</div>;
}

function DialogTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-lg font-semibold font-heading ${className ?? ""}`}>{children}</h2>;
}

function DialogDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-sm text-muted-foreground/70 ${className ?? ""}`}>{children}</p>;
}

function DialogFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex items-center justify-end gap-3 pt-4 border-t border-border/50 mt-6 ${className ?? ""}`}>{children}</div>;
}

function DialogContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className ?? ""}>{children}</div>;
}

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter };
