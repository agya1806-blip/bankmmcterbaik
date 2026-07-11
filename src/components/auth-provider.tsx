"use client";

// Auth is handled by AppShell. This is a no-op provider for compatibility.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
