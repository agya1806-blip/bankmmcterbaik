"use client";

import { create } from "zustand";
import {
  createProduct as dbCreate,
  updateProduct as dbUpdate,
  deleteProduct as dbDelete,
  getProductsByWorkspace,
  type Product,
} from "@/lib/db";

interface ProductState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  loadProducts: (workspaceId: string) => Promise<void>;
  addProduct: (data: Omit<Product, "id" | "createdAt">) => Promise<void>;
  editProduct: (id: string, data: Partial<Product>) => Promise<void>;
  removeProduct: (id: string) => Promise<void>;
  clearError: () => void;
}

function generateId(): string {
  return crypto.randomUUID();
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  isLoading: false,
  error: null,

  loadProducts: async (workspaceId) => {
    set({ isLoading: true, error: null });
    try {
      const products = await getProductsByWorkspace(workspaceId);
      set({ products, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  addProduct: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const product: Product = { ...data, id: generateId(), createdAt: Date.now() };
      await dbCreate(product);
      set((s) => ({ products: [...s.products, product], isLoading: false }));
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  editProduct: async (id, data) => {
    set({ error: null });
    try {
      const existing = get().products.find((p) => p.id === id);
      if (!existing) throw new Error("Product not found");
      const updated = { ...existing, ...data };
      await dbUpdate(updated);
      set((s) => ({ products: s.products.map((p) => (p.id === id ? updated : p)) }));
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  removeProduct: async (id) => {
    set({ error: null });
    try {
      await dbDelete(id);
      set((s) => ({ products: s.products.filter((p) => p.id !== id) }));
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  clearError: () => set({ error: null }),
}));
