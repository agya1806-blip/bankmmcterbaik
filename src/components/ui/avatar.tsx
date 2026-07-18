"use client";
import React from "react";
import { cn } from "./cn";

/**
 * Avatar component for user profile images with initials fallback.
 *
 * @example
 * ```tsx
 * <Avatar src="/avatar.jpg" name="John Doe" size="md" />
 * <Avatar name="Jane Smith" size="lg" />
 * ```
 */
interface AvatarProps {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeStyles: Record<string, string> = {
  sm: "w-8 h-8 text-[10px]",
  md: "w-10 h-10 text-xs",
  lg: "w-12 h-12 text-sm",
  xl: "w-16 h-16 text-lg",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getColorFromName(name: string): string {
  const colors = [
    "from-[#008CEB] to-[#00C9A7]",
    "from-violet-500 to-purple-600",
    "from-amber-400 to-orange-500",
    "from-emerald-400 to-teal-500",
    "from-pink-400 to-rose-500",
    "from-cyan-400 to-blue-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  return (
    <div
      className={cn(
        "rounded-2xl flex items-center justify-center text-white font-extrabold overflow-hidden shrink-0",
        sizeStyles[size],
        !src && `bg-gradient-to-br ${getColorFromName(name)}`,
        className
      )}
      role="img"
      aria-label={name}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        getInitials(name)
      )}
    </div>
  );
}
