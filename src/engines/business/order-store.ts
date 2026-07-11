"use client";

import { create } from "zustand";
import {
  createOrder as dbCreate,
  updateOrder as dbUpdate,
  deleteOrder as dbDelete,
  getOrdersByWorkspace,
  type Order,
} from "@/lib/db";

function generateId(): string {
  return crypto.randomUUID();
}

function generateOrderNumber(): string {
  const now = new Date();
  const d = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const r = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  return `ORD-${d}-${r}`;
}

interface OrderState {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  loadOrders: (workspaceId: string) => Promise<void>;
  addOrder: (data: Omit<Order, "id" | "number" | "createdAt">) => Promise<void>;
  editOrder: (id: string, data: Partial<Order>) => Promise<void>;
  removeOrder: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  isLoading: false,
  error: null,

  loadOrders: async (workspaceId) => {
    set({ isLoading: true, error: null });
    try {
      const orders = await getOrdersByWorkspace(workspaceId);
      set({ orders, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  addOrder: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const order: Order = { ...data, id: generateId(), number: generateOrderNumber(), createdAt: Date.now() };
      await dbCreate(order);
      set((s) => ({ orders: [...s.orders, order], isLoading: false }));
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  editOrder: async (id, data) => {
    set({ error: null });
    try {
      const existing = get().orders.find((o) => o.id === id);
      if (!existing) throw new Error("Order not found");
      const updated = { ...existing, ...data };
      await dbUpdate(updated);
      set((s) => ({ orders: s.orders.map((o) => (o.id === id ? updated : o)) }));
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  removeOrder: async (id) => {
    set({ error: null });
    try {
      await dbDelete(id);
      set((s) => ({ orders: s.orders.filter((o) => o.id !== id) }));
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  clearError: () => set({ error: null }),
}));
