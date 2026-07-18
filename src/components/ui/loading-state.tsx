"use client";
import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "./cn";

/**
 * Full page or inline loading state with spinner and optional message.
 *
 * @example
 * ```tsx
 * <LoadingState message="Memuat data..." />
 * <LoadingState size="sm" />
 * ```
 */
interface LoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  fullPage?: boolean;
  className?: string;
}

const sizeStyles: Record<string, string> = {
  sm: "w-5 h-5",
  md: "w-7 h-7",
  lg: "w-10 h-10",
};

export function LoadingState({ message, size = "md", fullPage, className }: LoadingStateProps) {
  const content = (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <Loader2 className={cn("animate-spin text-[#008CEB]", sizeStyles[size])} />
      {message && (
        <p className="text-[11px] font-medium text-slate-400 animate-pulse">{message}</p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[200px]">
        {content}
      </div>
    );
  }

  return content;
}
