"use client";

import { useEffect, useState } from "react";
import { useRoleStore } from "@/store/useRoleStore";
import type { BizUnit } from "@/store/useBusinessStore";
import type { Role } from "@/store/useRoleStore";
import { Shield, Fingerprint, X } from "lucide-react";

interface UnitGuardProps {
  unit: BizUnit;
  requiredRole?: Role;
  children: React.ReactNode;
}

export default function UnitGuard({ unit, requiredRole, children }: UnitGuardProps) {
  const { pinUsers, currentPinUserId, loginPin, logoutPin, hasUnitAccess, currentRole } = useRoleStore();
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="min-h-[60vh]" />;

  /* If PIN user is logged in, check access */
  if (currentPinUserId) {
    const canAccess = hasUnitAccess(unit);
    const role = currentRole();

    if (!canAccess) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center max-w-sm p-6">
            <Shield className="size-12 mx-auto text-rose-500/50 mb-3" />
            <h2 className="text-base font-bold font-heading mb-1">Akses Ditolak</h2>
            <p className="text-xs text-muted-foreground/60 mb-4">Anda tidak memiliki akses ke unit ini.</p>
            <button onClick={logoutPin} className="text-xs text-emerald-600 font-medium hover:underline">Ganti Akun</button>
          </div>
        </div>
      );
    }

    if (requiredRole === "admin" && role !== "admin") {
      return (
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center max-w-sm p-6">
            <Shield className="size-12 mx-auto text-amber-500/50 mb-3" />
            <h2 className="text-base font-bold font-heading mb-1">Akses Terbatas</h2>
            <p className="text-xs text-muted-foreground/60">Role {role} tidak memiliki izin untuk halaman ini.</p>
          </div>
        </div>
      );
    }

    return <>{children}</>;
  }

  /* If PIN user exists but not logged in, show PIN modal */
  if (pinUsers.length > 0) {
    return (
      <>
        {children}
        {!showPinModal && (
          <button onClick={() => setShowPinModal(true)}
            className="fixed bottom-6 left-6 z-40 size-10 rounded-full bg-violet-500 text-white shadow-xl shadow-violet-500/30 hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
            title="Login PIN Kasir"
          >
            <Fingerprint className="size-4" />
          </button>
        )}

        {showPinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-card rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Fingerprint className="size-5 text-violet-500" />
                  <p className="text-sm font-bold font-heading">Login PIN Kasir</p>
                </div>
                <button onClick={() => { setShowPinModal(false); setPinInput(""); setPinError(""); }}>
                  <X className="size-4 text-muted-foreground/40 hover:text-muted-foreground" />
                </button>
              </div>
              <input type="password" inputMode="numeric" value={pinInput} maxLength={6}
                onChange={(e) => { setPinInput(e.target.value.replace(/\D/g, "")); setPinError(""); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && pinInput.length >= 4) {
                    const user = loginPin(pinInput);
                    if (user) { setShowPinModal(false); setPinInput(""); }
                    else setPinError("PIN salah");
                  }
                }}
                placeholder="Masukkan PIN (6 digit)"
                className="input-premium w-full text-center text-lg tracking-[0.5em] tabular-nums"
                autoFocus
              />
              {pinError && <p className="text-[10px] text-rose-500 text-center">{pinError}</p>}
              <button onClick={() => {
                const user = loginPin(pinInput);
                if (user) { setShowPinModal(false); setPinInput(""); }
                else setPinError("PIN salah");
              }} disabled={pinInput.length < 4}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-bold shadow-lg disabled:opacity-40 transition-all"
              >
                Masuk
              </button>
              <p className="text-[9px] text-muted-foreground/40 text-center">PIN Default: 123456</p>
            </div>
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
}
