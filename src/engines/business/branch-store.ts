"use client";

import { create } from "zustand";
import {
  createBranch as dbCreate,
  updateBranch as dbUpdate,
  deleteBranch as dbDelete,
  getBranchesByWorkspace,
  type Branch,
} from "@/lib/db";

function generateId(): string {
  return crypto.randomUUID();
}

interface BranchState {
  branches: Branch[];
  isLoading: boolean;
  error: string | null;
  loadBranches: (workspaceId: string) => Promise<void>;
  addBranch: (data: Omit<Branch, "id" | "createdAt">) => Promise<void>;
  editBranch: (id: string, data: Partial<Branch>) => Promise<void>;
  removeBranch: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useBranchStore = create<BranchState>((set, get) => ({
  branches: [],
  isLoading: false,
  error: null,

  loadBranches: async (workspaceId) => {
    set({ isLoading: true, error: null });
    try {
      const branches = await getBranchesByWorkspace(workspaceId);
      set({ branches, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  addBranch: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const branch: Branch = { ...data, id: generateId(), createdAt: Date.now() };
      await dbCreate(branch);
      set((s) => ({ branches: [...s.branches, branch], isLoading: false }));
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  editBranch: async (id, data) => {
    set({ error: null });
    try {
      const existing = get().branches.find((b) => b.id === id);
      if (!existing) throw new Error("Branch not found");
      const updated = { ...existing, ...data };
      await dbUpdate(updated);
      set((s) => ({ branches: s.branches.map((b) => (b.id === id ? updated : b)) }));
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  removeBranch: async (id) => {
    set({ error: null });
    try {
      await dbDelete(id);
      set((s) => ({ branches: s.branches.filter((b) => b.id !== id) }));
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  clearError: () => set({ error: null }),
}));
