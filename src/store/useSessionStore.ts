import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MmcUser, BizUnit } from "@/lib/db/mmcbank-db";

interface SessionState {
  currentUserId: string | null;
  currentUser: MmcUser | null;
  onboardingCompleted: boolean;
  setSession: (user: MmcUser) => void;
  clearSession: () => void;
  setOnboardingCompleted: (v: boolean) => void;
  hasUnitAccess: (unit: BizUnit) => boolean;
  isLoggedIn: () => boolean;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      currentUserId: null,
      currentUser: null,
      onboardingCompleted: false,

      setSession: (user) =>
        set({ currentUserId: user.id, currentUser: user }),

      clearSession: () =>
        set({ currentUserId: null, currentUser: null }),

      setOnboardingCompleted: (v) => set({ onboardingCompleted: v }),

      hasUnitAccess: (unit) => {
        const user = get().currentUser;
        if (!user) return false;
        if (user.role === "admin") return true;
        return user.allowedUnits.includes(unit);
      },

      isLoggedIn: () => get().currentUser !== null,
    }),
    {
      name: "mmcbank-session",
      partialize: (state) => ({
        currentUserId: state.currentUserId,
        currentUser: state.currentUser,
        onboardingCompleted: state.onboardingCompleted,
      }),
    }
  )
);
