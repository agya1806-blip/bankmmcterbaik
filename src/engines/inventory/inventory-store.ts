"use client";

import { create } from "zustand";
import {
  createInventoryItem as createItemDb,
  updateInventoryItem as updateItemDb,
  deleteInventoryItem as deleteItemDb,
  getInventoryItemsByWorkspace,
  createInventoryMutation as createMutationDb,
  getMutationsByItem,
  getMutationsByWorkspace,
  type InventoryItem,
  type InventoryMutation,
} from "@/lib/db";

export interface InventoryState {
  items: InventoryItem[];
  mutations: InventoryMutation[];
  isLoading: boolean;
  error: string | null;

  loadItems: (workspaceId: string) => Promise<void>;
  loadMutations: (workspaceId: string) => Promise<void>;
  loadItemMutations: (itemId: string) => Promise<void>;
  addItem: (data: {
    workspaceId: string;
    name: string;
    sku: string;
    category: string;
    unit: string;
    stock: number;
    price: number;
  }) => Promise<void>;
  editItem: (
    id: string,
    data: Partial<Pick<InventoryItem, "name" | "sku" | "category" | "unit" | "price">>
  ) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  stockIn: (itemId: string, quantity: number, note: string, workspaceId: string) => Promise<void>;
  stockOut: (itemId: string, quantity: number, note: string, workspaceId: string) => Promise<void>;
  stockOpname: (itemId: string, newStock: number, note: string, workspaceId: string) => Promise<void>;
  clearError: () => void;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  items: [],
  mutations: [],
  isLoading: false,
  error: null,

  loadItems: async (workspaceId: string) => {
    set({ isLoading: true, error: null });
    try {
      const items = await getInventoryItemsByWorkspace(workspaceId);
      set({ items, isLoading: false });
    } catch {
      set({ error: "Failed to load inventory", isLoading: false });
    }
  },

  loadMutations: async (workspaceId: string) => {
    try {
      const mutations = await getMutationsByWorkspace(workspaceId);
      set({ mutations });
    } catch {
      set({ error: "Failed to load mutations" });
    }
  },

  loadItemMutations: async (itemId: string) => {
    try {
      const mutations = await getMutationsByItem(itemId);
      set({ mutations });
    } catch {
      set({ error: "Failed to load mutations" });
    }
  },

  addItem: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const item: InventoryItem = {
        id: crypto.randomUUID(),
        ...data,
        createdAt: Date.now(),
      };
      await createItemDb(item);
      const state = get();
      set({ items: [...state.items, item], isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to add item",
        isLoading: false,
      });
    }
  },

  editItem: async (id, data) => {
    set({ error: null });
    try {
      const state = get();
      const existing = state.items.find((i) => i.id === id);
      if (!existing) throw new Error("Item not found");
      const updated: InventoryItem = { ...existing, ...data };
      await updateItemDb(updated);
      set({ items: state.items.map((i) => (i.id === id ? updated : i)) });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to update item",
      });
    }
  },

  removeItem: async (id) => {
    set({ error: null });
    try {
      await deleteItemDb(id);
      const state = get();
      set({ items: state.items.filter((i) => i.id !== id) });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to delete item",
      });
    }
  },

  stockIn: async (itemId, quantity, note, workspaceId) => {
    set({ isLoading: true, error: null });
    try {
      const state = get();
      const item = state.items.find((i) => i.id === itemId);
      if (!item) throw new Error("Item not found");
      const stockBefore = item.stock;
      const stockAfter = item.stock + quantity;
      const updated: InventoryItem = { ...item, stock: stockAfter };
      await updateItemDb(updated);

      const mutation: InventoryMutation = {
        id: crypto.randomUUID(),
        workspaceId,
        itemId,
        type: "in",
        quantity,
        stockBefore,
        stockAfter,
        reference: "manual",
        note,
        createdAt: Date.now(),
      };
      await createMutationDb(mutation);

      set({
        items: state.items.map((i) => (i.id === itemId ? updated : i)),
        mutations: [...state.mutations, mutation],
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to process stock in",
        isLoading: false,
      });
    }
  },

  stockOut: async (itemId, quantity, note, workspaceId) => {
    set({ isLoading: true, error: null });
    try {
      const state = get();
      const item = state.items.find((i) => i.id === itemId);
      if (!item) throw new Error("Item not found");
      if (item.stock < quantity) throw new Error("Insufficient stock");
      const stockBefore = item.stock;
      const stockAfter = item.stock - quantity;
      const updated: InventoryItem = { ...item, stock: stockAfter };
      await updateItemDb(updated);

      const mutation: InventoryMutation = {
        id: crypto.randomUUID(),
        workspaceId,
        itemId,
        type: "out",
        quantity,
        stockBefore,
        stockAfter,
        reference: "manual",
        note,
        createdAt: Date.now(),
      };
      await createMutationDb(mutation);

      set({
        items: state.items.map((i) => (i.id === itemId ? updated : i)),
        mutations: [...state.mutations, mutation],
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to process stock out",
        isLoading: false,
      });
    }
  },

  stockOpname: async (itemId, newStock, note, workspaceId) => {
    set({ isLoading: true, error: null });
    try {
      const state = get();
      const item = state.items.find((i) => i.id === itemId);
      if (!item) throw new Error("Item not found");
      const stockBefore = item.stock;
      const stockAfter = newStock;
      const quantity = newStock - item.stock;
      const updated: InventoryItem = { ...item, stock: stockAfter };
      await updateItemDb(updated);

      const mutation: InventoryMutation = {
        id: crypto.randomUUID(),
        workspaceId,
        itemId,
        type: "adjustment",
        quantity,
        stockBefore,
        stockAfter,
        reference: "opname",
        note: note || `Stock opname: ${stockBefore} → ${stockAfter}`,
        createdAt: Date.now(),
      };
      await createMutationDb(mutation);

      set({
        items: state.items.map((i) => (i.id === itemId ? updated : i)),
        mutations: [...state.mutations, mutation],
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to process stock opname",
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
