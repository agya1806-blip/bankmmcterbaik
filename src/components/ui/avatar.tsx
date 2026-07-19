import React from "react";
import { cn } from "./cn";

export function Avatar({ name, src, size = "md", className }: { name: string; src?: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const sizes = { sm: "w-8 h-8 text-[10px]", md: "w-10 h-10 text-xs", lg: "w-14 h-14 text-sm" };
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  if (src) return <img src={src} alt={name} className={cn("rounded-full object-cover", sizes[size], className)} />;
  return (
    <div className={cn("rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-heading font-bold", sizes[size], className)}>
      {initials}
    </div>
  );
}
