import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserInfo {
  id: string;
  nama: string;
  fotoUrl: string;
  role: string;
}

interface SessionState {
  currentUser: UserInfo | null;
  currentBranch: string | null;
  onboardingCompleted: boolean;
  isPinVerified: boolean;
  isInitializing: boolean;
  kioskTarget: string | null;
  lastActivity: number;
  login: (user: UserInfo) => void;
  logout: () => void;
  setBranch: (branch: string) => void;
  completeOnboarding: () => void;
  verifyPin: () => void;
  resetPinVerification: () => void;
  setIsInitializing: (v: boolean) => void;
  setKioskTarget: (target: string | null) => void;
  updateProfile: (patch: Partial<Pick<UserInfo, "nama" | "fotoUrl">>) => void;
  isLoggedIn: () => boolean;
  isKiosk: () => boolean;
  updateActivity: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      currentBranch: null,
      onboardingCompleted: false,
      isPinVerified: false,
      isInitializing: true,
      kioskTarget: null,
      lastActivity: Date.now(),
      login: (user) => set({ currentUser: user }),
      logout: () => set({ currentUser: null, currentBranch: null, isPinVerified: false, kioskTarget: null }),
      setBranch: (branch) => set({ currentBranch: branch }),
      completeOnboarding: () => set({ onboardingCompleted: true }),
      verifyPin: () => set({ isPinVerified: true }),
      resetPinVerification: () => set({ isPinVerified: false }),
      setIsInitializing: (v) => set({ isInitializing: v }),
      setKioskTarget: (target) => set({ kioskTarget: target }),
      updateProfile: (patch) => {
        const curr = get().currentUser;
        if (curr) set({ currentUser: { ...curr, ...patch } });
      },
      isLoggedIn: () => get().currentUser !== null,
      isKiosk: () => get().kioskTarget !== null,
      updateActivity: () => set({ lastActivity: Date.now() }),
    }),
    {
      name: 'mmc-session-store',
      onRehydrateStorage: () => (state) => {
        if (state) state.setIsInitializing(false);
      },
    }
  )
);
