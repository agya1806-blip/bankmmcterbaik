"use client";

import { create } from "zustand";
import {
  createWorkspace as dbCreateWorkspace,
  updateWorkspace as dbUpdateWorkspace,
  deleteWorkspace as dbDeleteWorkspace,
  getWorkspaceById,
  getWorkspaceByInviteCode,
  getAllWorkspaces,
  addWorkspaceMember,
  removeWorkspaceMember,
  getWorkspaceMember,
  getWorkspaceMembers,
  getUserWorkspaces,
  updateWorkspaceMember,
  deleteAllWorkspaceMembers,
  type Workspace,
  type WorkspaceType,
  type WorkspaceMember,
} from "@/lib/db";

function generateId(): string {
  return crypto.randomUUID();
}

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const WORKSPACE_TYPES: { type: WorkspaceType; label: string; desc: string; icon: string }[] = [
  { type: "pribadi", label: "Buku Pribadi", desc: "Catat keuangan pribadi harian", icon: "📒" },
  { type: "usaha", label: "Buku Usaha", desc: "Kelola bisnis dengan cabang", icon: "🏪" },
  { type: "modal", label: "Buku Modal", desc: "Tracking modal & investasi", icon: "💰" },
  { type: "toko", label: "Toko Online", desc: "Jualan online & kelola pesanan", icon: "🛒" },
  { type: "hutang", label: "Buku Hutang", desc: "Catat hutang & piutang", icon: "📋" },
];

export interface WorkspaceState {
  workspaces: Workspace[];
  members: WorkspaceMember[];
  activeWorkspace: Workspace | null;
  activeWorkspaceRole: WorkspaceMember["role"] | null;
  isLoading: boolean;
  error: string | null;

  loadWorkspaces: (userId: string) => Promise<void>;
  loadMembers: (workspaceId: string) => Promise<void>;
  selectWorkspace: (workspaceId: string) => Promise<void>;
  createWorkspace: (
    data: { name: string; description: string; currency: string; icon: string; type: WorkspaceType },
    userId: string
  ) => Promise<Workspace>;
  updateWorkspace: (
    workspaceId: string,
    data: Partial<Pick<Workspace, "name" | "description" | "currency" | "icon" | "connectedWorkspaces" | "businessProfile">>
  ) => Promise<void>;
  deleteWorkspace: (workspaceId: string) => Promise<void>;
  joinWorkspace: (inviteCode: string, userId: string) => Promise<void>;
  leaveWorkspace: (workspaceId: string, userId: string) => Promise<void>;
  updateMemberRole: (workspaceId: string, userId: string, role: WorkspaceMember["role"]) => Promise<void>;
  removeMember: (workspaceId: string, userId: string) => Promise<void>;
  regenerateInviteCode: (workspaceId: string) => Promise<void>;
  toggleConnection: (workspaceId: string, targetId: string) => Promise<void>;
  clearError: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  members: [],
  activeWorkspace: null,
  activeWorkspaceRole: null,
  isLoading: false,
  error: null,

  loadWorkspaces: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const memberships = await getUserWorkspaces(userId);
      const workspaceIds = memberships.map((m) => m.workspaceId);
      const allWorkspaces = await getAllWorkspaces();
      const userWorkspaces = allWorkspaces.filter((w) => workspaceIds.includes(w.id));
      set({ workspaces: userWorkspaces, isLoading: false });
    } catch {
      set({ error: "Failed to load workspaces", isLoading: false });
    }
  },

  loadMembers: async (workspaceId: string) => {
    try {
      const members = await getWorkspaceMembers(workspaceId);
      set({ members });
    } catch {
      set({ error: "Failed to load members" });
    }
  },

  selectWorkspace: async (workspaceId: string) => {
    set({ isLoading: true, error: null });
    try {
      const workspace = await getWorkspaceById(workspaceId);
      if (!workspace) throw new Error("Workspace not found");
      localStorage.setItem("activeWorkspaceId", workspaceId);
      set({ activeWorkspace: workspace, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to select workspace", isLoading: false });
    }
  },

  createWorkspace: async (data, userId) => {
    set({ isLoading: true, error: null });
    try {
      let inviteCode = generateInviteCode();
      let existing = await getWorkspaceByInviteCode(inviteCode);
      while (existing) {
        inviteCode = generateInviteCode();
        existing = await getWorkspaceByInviteCode(inviteCode);
      }
      const workspace: Workspace = {
        id: generateId(),
        ...data,
        inviteCode,
        connectedWorkspaces: [],
        createdBy: userId,
        createdAt: Date.now(),
      };
      await dbCreateWorkspace(workspace);
      const member: WorkspaceMember = { workspaceId: workspace.id, userId, role: "admin", joinedAt: Date.now() };
      await addWorkspaceMember(member);
      const state = get();
      set({
        workspaces: [...state.workspaces, workspace],
        activeWorkspace: workspace,
        activeWorkspaceRole: "admin",
        isLoading: false,
      });
      localStorage.setItem("activeWorkspaceId", workspace.id);
      return workspace;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to create workspace", isLoading: false });
      throw err;
    }
  },

  updateWorkspace: async (workspaceId, data) => {
    set({ isLoading: true, error: null });
    try {
      const existing = await getWorkspaceById(workspaceId);
      if (!existing) throw new Error("Workspace not found");
      const updated: Workspace = { ...existing, ...data };
      await dbUpdateWorkspace(updated);
      const state = get();
      set({
        workspaces: state.workspaces.map((w) => (w.id === workspaceId ? updated : w)),
        activeWorkspace: state.activeWorkspace?.id === workspaceId ? updated : state.activeWorkspace,
        isLoading: false,
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to update workspace", isLoading: false });
    }
  },

  deleteWorkspace: async (workspaceId: string) => {
    set({ isLoading: true, error: null });
    try {
      await deleteAllWorkspaceMembers(workspaceId);
      await dbDeleteWorkspace(workspaceId);
      const state = get();
      set({
        workspaces: state.workspaces.filter((w) => w.id !== workspaceId),
        activeWorkspace: state.activeWorkspace?.id === workspaceId ? null : state.activeWorkspace,
        activeWorkspaceRole: state.activeWorkspace?.id === workspaceId ? null : state.activeWorkspaceRole,
        isLoading: false,
      });
      if (state.activeWorkspace?.id === workspaceId) localStorage.removeItem("activeWorkspaceId");
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to delete workspace", isLoading: false });
    }
  },

  joinWorkspace: async (inviteCode: string, userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const workspace = await getWorkspaceByInviteCode(inviteCode);
      if (!workspace) throw new Error("Invalid invite code");
      const existing = await getWorkspaceMember(workspace.id, userId);
      if (existing) throw new Error("Already a member");
      const member: WorkspaceMember = { workspaceId: workspace.id, userId, role: "viewer", joinedAt: Date.now() };
      await addWorkspaceMember(member);
      const state = get();
      set({
        workspaces: [...state.workspaces, workspace],
        activeWorkspace: workspace,
        activeWorkspaceRole: "viewer",
        isLoading: false,
      });
      localStorage.setItem("activeWorkspaceId", workspace.id);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to join workspace", isLoading: false });
      throw err;
    }
  },

  leaveWorkspace: async (workspaceId: string, userId: string) => {
    set({ isLoading: true, error: null });
    try {
      await removeWorkspaceMember(workspaceId, userId);
      const state = get();
      set({
        workspaces: state.workspaces.filter((w) => w.id !== workspaceId),
        activeWorkspace: state.activeWorkspace?.id === workspaceId ? null : state.activeWorkspace,
        activeWorkspaceRole: state.activeWorkspace?.id === workspaceId ? null : state.activeWorkspaceRole,
        isLoading: false,
      });
      if (state.activeWorkspace?.id === workspaceId) localStorage.removeItem("activeWorkspaceId");
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to leave workspace", isLoading: false });
    }
  },

  updateMemberRole: async (workspaceId, userId, role) => {
    try {
      const member = await getWorkspaceMember(workspaceId, userId);
      if (!member) throw new Error("Member not found");
      const updated: WorkspaceMember = { ...member, role };
      await updateWorkspaceMember(updated);
      const state = get();
      set({ members: state.members.map((m) => (m.workspaceId === workspaceId && m.userId === userId ? updated : m)) });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to update role" });
    }
  },

  removeMember: async (workspaceId, userId) => {
    try {
      await removeWorkspaceMember(workspaceId, userId);
      const state = get();
      set({ members: state.members.filter((m) => !(m.workspaceId === workspaceId && m.userId === userId)) });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to remove member" });
    }
  },

  regenerateInviteCode: async (workspaceId: string) => {
    try {
      const existing = await getWorkspaceById(workspaceId);
      if (!existing) throw new Error("Workspace not found");
      let inviteCode = generateInviteCode();
      let found = await getWorkspaceByInviteCode(inviteCode);
      while (found) { inviteCode = generateInviteCode(); found = await getWorkspaceByInviteCode(inviteCode); }
      const updated: Workspace = { ...existing, inviteCode };
      await dbUpdateWorkspace(updated);
      const state = get();
      set({
        workspaces: state.workspaces.map((w) => (w.id === workspaceId ? updated : w)),
        activeWorkspace: state.activeWorkspace?.id === workspaceId ? updated : state.activeWorkspace,
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to regenerate code" });
    }
  },

  toggleConnection: async (workspaceId: string, targetId: string) => {
    try {
      const existing = await getWorkspaceById(workspaceId);
      if (!existing) throw new Error("Workspace not found");
      const connected = existing.connectedWorkspaces || [];
      const updated: Workspace = {
        ...existing,
        connectedWorkspaces: connected.includes(targetId)
          ? connected.filter((id) => id !== targetId)
          : [...connected, targetId],
      };
      await dbUpdateWorkspace(updated);
      const state = get();
      set({
        workspaces: state.workspaces.map((w) => (w.id === workspaceId ? updated : w)),
        activeWorkspace: state.activeWorkspace?.id === workspaceId ? updated : state.activeWorkspace,
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to toggle connection" });
    }
  },

  clearError: () => set({ error: null }),
}));
