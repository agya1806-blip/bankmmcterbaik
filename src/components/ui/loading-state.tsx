"use client";
import React from "react";
import { cn } from "./cn";

export function LoadingState({ message, fullPage, className }: { message?: string; fullPage?: boolean; className?: string }) {
  const content = (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className="w-8 h-8 border-[3px] border-emerald-200 dark:border-emerald-900 border-t-emerald-500 rounded-full animate-spin" />
      {message && <p className="text-[11px] font-medium text-slate-400">{message}</p>}
    </div>
  );
  if (fullPage) {
    return <div className="flex-1 flex items-center justify-center min-h-[200px]">{content}</div>;
  }
  return content;
}
