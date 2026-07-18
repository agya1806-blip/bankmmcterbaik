"use client";

import React from "react";
import { cn } from "@/components/ui/cn";

interface PageContainerProps {
  className?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
}

const maxWidths = {
  sm: "max-w-2xl",
  md: "max-w-4xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  full: "max-w-full",
};

export function PageContainer({ className, children, maxWidth = "lg" }: PageContainerProps) {
  return (
    <div className={cn("w-full mx-auto px-4 sm:px-6 py-4 sm:py-6", maxWidths[maxWidth], className)}>
      {children}
    </div>
  );
}
