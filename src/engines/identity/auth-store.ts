"use client";

import { create } from "zustand";
import {
  createUser,
  getUserByEmail,
  getUserById,
  updateUser,
  createSession,
  getAllSessions,
  deleteSession,
  type User,
  type Session,
} from "@/lib/db";

function generateId(): string {
  return crypto.randomUUID();
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export interface AuthState {
  user: (Pick<User, "id" | "email" | "name"> & { createdAt: number }) | null;
  sessionId: string | null;
  isLoading: boolean;
  error: string | null;

  register: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  updateProfile: (data: { name?: string; email?: string; currentPassword?: string; newPassword?: string }) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  sessionId: null,
  isLoading: true,
  error: null,

  register: async (email: string, password: string, name: string) => {
    set({ isLoading: true, error: null });
    try {
      const existing = await getUserByEmail(email);
      if (existing) {
        throw new Error("Email already registered");
      }
      const passwordHash = await hashPassword(password);
      const user: User = {
        id: generateId(),
        email,
        passwordHash,
        name,
        createdAt: Date.now(),
      };
      await createUser(user);

      const session: Session = {
        id: generateId(),
        userId: user.id,
        createdAt: Date.now(),
      };
      await createSession(session);
      localStorage.setItem("sessionId", session.id);

      set({
        user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
        sessionId: session.id,
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Registration failed",
        isLoading: false,
      });
      throw err;
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = await getUserByEmail(email);
      if (!user) {
        throw new Error("Invalid email or password");
      }
      const passwordHash = await hashPassword(password);
      if (user.passwordHash !== passwordHash) {
        throw new Error("Invalid email or password");
      }

      const session: Session = {
        id: generateId(),
        userId: user.id,
        createdAt: Date.now(),
      };
      await createSession(session);
      localStorage.setItem("sessionId", session.id);

      set({
        user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
        sessionId: session.id,
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Login failed",
        isLoading: false,
      });
      throw err;
    }
  },

  logout: async () => {
    const { sessionId } = get();
    set({ isLoading: true });
    try {
      if (sessionId) {
        await deleteSession(sessionId);
      }
      localStorage.removeItem("sessionId");
      set({ user: null, sessionId: null, isLoading: false, error: null });
    } catch {
      localStorage.removeItem("sessionId");
      set({ user: null, sessionId: null, isLoading: false, error: null });
    }
  },

  checkSession: async () => {
    set({ isLoading: true });
    const timeout = setTimeout(() => {
      set({ user: null, sessionId: null, isLoading: false });
    }, 3000);
    try {
      const storedSessionId = localStorage.getItem("sessionId");
      if (!storedSessionId) {
        clearTimeout(timeout);
        set({ user: null, sessionId: null, isLoading: false });
        return;
      }

      const sessions = await getAllSessions();
      clearTimeout(timeout);
      const session = sessions.find((s) => s.id === storedSessionId);
      if (!session) {
        localStorage.removeItem("sessionId");
        set({ user: null, sessionId: null, isLoading: false });
        return;
      }

      const user = await getUserById(session.userId);
      if (!user) {
        localStorage.removeItem("sessionId");
        await deleteSession(session.id);
        set({ user: null, sessionId: null, isLoading: false });
        return;
      }

      set({
        user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
        sessionId: session.id,
        isLoading: false,
      });
    } catch (err) {
      clearTimeout(timeout);
      console.error("checkSession error:", err);
      set({ user: null, sessionId: null, isLoading: false });
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const state = get();
      if (!state.user) throw new Error("Not authenticated");

      const user = await getUserById(state.user.id);
      if (!user) throw new Error("User not found");

      if (data.currentPassword && data.newPassword) {
        const currentHash = await hashPassword(data.currentPassword);
        if (user.passwordHash !== currentHash) {
          throw new Error("Current password is incorrect");
        }
        user.passwordHash = await hashPassword(data.newPassword);
      }

      if (data.name) user.name = data.name;
      if (data.email) {
        const existing = await getUserByEmail(data.email);
        if (existing && existing.id !== user.id) {
          throw new Error("Email already in use");
        }
        user.email = data.email;
      }

      await updateUser(user);
      set({
        user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to update profile",
        isLoading: false,
      });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
