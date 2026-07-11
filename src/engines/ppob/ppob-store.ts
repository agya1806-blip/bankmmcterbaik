"use client";

import { create } from "zustand";
import {
  type PpobCategory,
  type DigitalProduct,
  type PpobTransaction,
  createPpobCategory,
  getPpobCategoriesByWorkspace,
  deletePpobCategory,
  createDigitalProduct,
  updateDigitalProduct,
  deleteDigitalProduct,
  getDigitalProductsByWorkspace,
  createPpobTransaction,
  getPpobTransactionsByWorkspace,
} from "@/lib/db";

interface PpobState {
  categories: PpobCategory[];
  products: DigitalProduct[];
  transactions: PpobTransaction[];
  isLoading: boolean;
  error: string | null;
  loadCategories: (workspaceId: string) => Promise<void>;
  addCategory: (cat: PpobCategory) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
  loadProducts: (workspaceId: string) => Promise<void>;
  addProduct: (prod: DigitalProduct) => Promise<void>;
  editProduct: (prod: DigitalProduct) => Promise<void>;
  removeProduct: (id: string) => Promise<void>;
  addTransaction: (tx: PpobTransaction) => Promise<void>;
  loadTransactions: (workspaceId: string) => Promise<void>;
  clearError: () => void;
}

export const usePpobStore = create<PpobState>((set, get) => ({
  categories: [],
  products: [],
  transactions: [],
  isLoading: false,
  error: null,

  loadCategories: async (workspaceId: string) => {
    set({ isLoading: true, error: null });
    try {
      const categories = await getPpobCategoriesByWorkspace(workspaceId);
      set({ categories, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  addCategory: async (cat: PpobCategory) => {
    set({ error: null });
    try {
      await createPpobCategory(cat);
      set((s) => ({ categories: [...s.categories, cat] }));
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  removeCategory: async (id: string) => {
    set({ error: null });
    try {
      await deletePpobCategory(id);
      set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }));
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  loadProducts: async (workspaceId: string) => {
    set({ isLoading: true, error: null });
    try {
      const products = await getDigitalProductsByWorkspace(workspaceId);
      set({ products, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  addProduct: async (prod: DigitalProduct) => {
    set({ error: null });
    try {
      await createDigitalProduct(prod);
      set((s) => ({ products: [...s.products, prod] }));
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  editProduct: async (prod: DigitalProduct) => {
    set({ error: null });
    try {
      await updateDigitalProduct(prod);
      set((s) => ({
        products: s.products.map((p) => (p.id === prod.id ? prod : p)),
      }));
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  removeProduct: async (id: string) => {
    set({ error: null });
    try {
      await deleteDigitalProduct(id);
      set((s) => ({ products: s.products.filter((p) => p.id !== id) }));
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  addTransaction: async (tx: PpobTransaction) => {
    set({ error: null });
    try {
      await createPpobTransaction(tx);
      set((s) => ({ transactions: [tx, ...s.transactions] }));
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  loadTransactions: async (workspaceId: string) => {
    set({ isLoading: true, error: null });
    try {
      const transactions = await getPpobTransactionsByWorkspace(workspaceId);
      set({ transactions, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
