"use client";
import React from "react";
import ErrorBoundary from "@/components/error-boundary";
import HydrationSafe from "@/components/hydration-safe";

export default function CabangLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <HydrationSafe>
        {children}
      </HydrationSafe>
    </ErrorBoundary>
  );
}
