import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DbUser } from "@/lib/db-v4";

export type KioskTarget = {
  unitSlug: string;
  kasirPath: string;
};

interface SessionState {
  currentUserId: string | null;
  currentUser: DbUser | null;
  onboardingCompleted: boolean;
  kioskTarget: KioskTarget | null;
  _hydrated: boolean;
  isInitializing: boolean;
  setSession: (user: DbUser) => void;
  clearSession: () => void;
  setOnboardingCompleted: (v: boolean) => void;
  setHydrated: () => void;
  finishInit: () => void;
  hasUnitAccess: (unit: string) => boolean;
  isLoggedIn: () => boolean;
  enterKioskMode: (target: KioskTarget) => void;
  exitKioskMode: () => void;
  isKiosk: () => boolean;
}

const KIOSK_OVERRIDE_PIN = "123456";

export function checkKioskOverride(pin: string): boolean {
  return pin === KIOSK_OVERRIDE_PIN;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      currentUserId: null,
      currentUser: null,
      onboardingCompleted: false,
      kioskTarget: null,
      _hydrated: false,
      isInitializing: true,

      setSession: (user) =>
        set({ currentUserId: user.id, currentUser: user }),

      clearSession: () =>
        set({ currentUserId: null, currentUser: null, kioskTarget: null }),

      setOnboardingCompleted: (v) => set({ onboardingCompleted: v }),

      setHydrated: () => set({ _hydrated: true }),

      finishInit: () => set({ isInitializing: false }),

      hasUnitAccess: (unit) => {
        const user = get().currentUser;
        if (!user) return false;
        if (user.role === "admin") return true;
        return user.allowedUnits.includes(unit);
      },

      isLoggedIn: () => get().currentUser !== null,

      enterKioskMode: (target) => set({ kioskTarget: target }),
      exitKioskMode: () => set({ kioskTarget: null }),
      isKiosk: () => get().kioskTarget !== null,
    }),
    {
      name: "mmcbank-session",
      partialize: (state) => ({
        currentUserId: state.currentUserId,
        currentUser: state.currentUser,
        onboardingCompleted: state.onboardingCompleted,
        kioskTarget: state.kioskTarget,
      }),
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            state.setHydrated();
            state.finishInit();
          }
        };
      },
    }
  )
);
