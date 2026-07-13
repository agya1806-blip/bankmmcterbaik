"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { BizUnit } from "./useBusinessStore";

export type Role = "admin" | "kasir" | "viewer";

export interface PinUser {
  id: string;
  nama: string;
  pin: string;
  role: Role;
  allowedUnits: BizUnit[];
  aktif: boolean;
}

interface RoleStore {
  pinUsers: PinUser[];
  currentPinUserId: string | null;
  loginPin: (pin: string) => PinUser | null;
  logoutPin: () => void;
  addPinUser: (u: PinUser) => void;
  removePinUser: (id: string) => void;
  updatePinUser: (id: string, data: Partial<PinUser>) => void;
  hasUnitAccess: (unitId: BizUnit) => boolean;
  currentRole: () => Role | null;
}

function hashPin(pin: string): string {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const c = pin.charCodeAt(i);
    hash = ((hash << 5) - hash) + c;
    hash = hash & hash;
  }
  return "pin_" + Math.abs(hash).toString(36);
}

export const useRoleStore = create<RoleStore>()(
  persist(
    (set, get) => ({
      pinUsers: [
        {
          id: "pin-admin",
          nama: "Admin Utama",
          pin: hashPin("123456"),
          role: "admin",
          allowedUnits: ["percetakan", "gadget", "laptop", "kedai_kopi", "konveksi"],
          aktif: true,
        },
      ],
      currentPinUserId: null,

      loginPin: (pin) => {
        const hashed = hashPin(pin);
        const found = get().pinUsers.find((u) => u.pin === hashed && u.aktif);
        if (found) {
          set({ currentPinUserId: found.id });
          return found;
        }
        return null;
      },

      logoutPin: () => set({ currentPinUserId: null }),

      addPinUser: (u) => set((s) => ({ pinUsers: [...s.pinUsers, u] })),
      removePinUser: (id) => set((s) => ({ pinUsers: s.pinUsers.filter((u) => u.id !== id) })),
      updatePinUser: (id, data) =>
        set((s) => ({
          pinUsers: s.pinUsers.map((u) => (u.id === id ? { ...u, ...data } : u)),
        })),

      hasUnitAccess: (unitId) => {
        const { currentPinUserId, pinUsers } = get();
        if (!currentPinUserId) return true;
        const user = pinUsers.find((u) => u.id === currentPinUserId);
        if (!user) return true;
        if (user.role === "admin") return true;
        return user.allowedUnits.includes(unitId);
      },

      currentRole: () => {
        const { currentPinUserId, pinUsers } = get();
        if (!currentPinUserId) return null;
        return pinUsers.find((u) => u.id === currentPinUserId)?.role || null;
      },
    }),
    {
      name: "mmcbank-role-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
