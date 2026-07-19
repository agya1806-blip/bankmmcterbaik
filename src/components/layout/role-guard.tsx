"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/store/useSessionStore";
import { ArrowLeft, ShieldAlert } from "lucide-react";

type Role = "admin" | "kasir" | "viewer";

const ROLE_HIERARCHY: Record<Role, number> = {
  admin: 3,
  kasir: 2,
  viewer: 1,
};

interface RoleGuardProps {
  requiredRole: Role;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGuard({ requiredRole, children, fallback }: RoleGuardProps) {
  const router = useRouter();
  const { currentUser } = useSessionStore();

  if (!currentUser) {
    return null;
  }

  const userLevel = ROLE_HIERARCHY[currentUser.role as Role] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole];

  if (userLevel >= requiredLevel) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="premium-card p-8 text-center max-w-sm w-full animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8 text-rose-500" />
        </div>
        <h2 className="text-lg font-heading font-extrabold mb-2">Akses Ditolak</h2>
        <p className="text-sm text-slate-400 mb-6">
          Anda tidak memiliki izin untuk mengakses halaman ini.
        </p>
        <button
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#008CEB] to-[#00C9A7] text-white font-bold text-xs active:scale-[0.98] transition-transform"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </button>
      </div>
    </div>
  );
}
