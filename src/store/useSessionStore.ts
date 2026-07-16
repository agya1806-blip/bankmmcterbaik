import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SessionState {
  currentUser: string | null;
  currentBranch: string | null;
  onboardingCompleted: boolean;
  isPinVerified: boolean;
  isInitializing: boolean;
  kioskTarget: string | null;
  login: (username: string) => void;
  logout: () => void;
  setBranch: (branch: string) => void;
  completeOnboarding: () => void;
  verifyPin: () => void;
  resetPinVerification: () => void;
  setIsInitializing: (v: boolean) => void;
  setKioskTarget: (target: string | null) => void;
  isLoggedIn: () => boolean;
  isKiosk: () => boolean;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      currentBranch: null,
      onboardingCompleted: false,
      isPinVerified: false,
      isInitializing: false,
      kioskTarget: null,
      login: (username) => set({ currentUser: username }),
      logout: () => set({ currentUser: null, currentBranch: null, isPinVerified: false, kioskTarget: null }),
      setBranch: (branch) => set({ currentBranch: branch }),
      completeOnboarding: () => set({ onboardingCompleted: true }),
      verifyPin: () => set({ isPinVerified: true }),
      resetPinVerification: () => set({ isPinVerified: false }),
      setIsInitializing: (v) => set({ isInitializing: v }),
      setKioskTarget: (target) => set({ kioskTarget: target }),
      isLoggedIn: () => get().currentUser !== null,
      isKiosk: () => get().kioskTarget !== null,
    }),
    { name: 'mmc-session-store' }
  )
);
