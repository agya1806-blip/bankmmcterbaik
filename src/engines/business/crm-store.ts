"use client";

import { create } from "zustand";
import {
  createCustomer as createCustomerDb,
  updateCustomer as updateCustomerDb,
  deleteCustomer as deleteCustomerDb,
  getCustomersByWorkspace,
  createSupplier as createSupplierDb,
  updateSupplier as updateSupplierDb,
  deleteSupplier as deleteSupplierDb,
  getSuppliersByWorkspace,
  type Customer,
  type Supplier,
} from "@/lib/db";

export interface CRMState {
  customers: Customer[];
  suppliers: Supplier[];
  isLoading: boolean;
  error: string | null;

  loadCustomers: (workspaceId: string) => Promise<void>;
  loadSuppliers: (workspaceId: string) => Promise<void>;
  addCustomer: (data: {
    workspaceId: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    notes: string;
  }) => Promise<void>;
  editCustomer: (
    id: string,
    data: Partial<Pick<Customer, "name" | "email" | "phone" | "address" | "notes">>
  ) => Promise<void>;
  removeCustomer: (id: string) => Promise<void>;
  addSupplier: (data: {
    workspaceId: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    notes: string;
  }) => Promise<void>;
  editSupplier: (
    id: string,
    data: Partial<Pick<Supplier, "name" | "email" | "phone" | "address" | "notes">>
  ) => Promise<void>;
  removeSupplier: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useCRMStore = create<CRMState>((set, get) => ({
  customers: [],
  suppliers: [],
  isLoading: false,
  error: null,

  loadCustomers: async (workspaceId: string) => {
    set({ isLoading: true, error: null });
    try {
      const customers = await getCustomersByWorkspace(workspaceId);
      set({ customers, isLoading: false });
    } catch {
      set({ error: "Failed to load customers", isLoading: false });
    }
  },

  loadSuppliers: async (workspaceId: string) => {
    set({ isLoading: true, error: null });
    try {
      const suppliers = await getSuppliersByWorkspace(workspaceId);
      set({ suppliers, isLoading: false });
    } catch {
      set({ error: "Failed to load suppliers", isLoading: false });
    }
  },

  addCustomer: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const customer: Customer = {
        id: crypto.randomUUID(),
        ...data,
        createdAt: Date.now(),
      };
      await createCustomerDb(customer);
      const state = get();
      set({ customers: [...state.customers, customer], isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to add customer",
        isLoading: false,
      });
    }
  },

  editCustomer: async (id, data) => {
    set({ error: null });
    try {
      const state = get();
      const existing = state.customers.find((c) => c.id === id);
      if (!existing) throw new Error("Customer not found");
      const updated: Customer = { ...existing, ...data };
      await updateCustomerDb(updated);
      set({ customers: state.customers.map((c) => (c.id === id ? updated : c)) });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to update customer",
      });
    }
  },

  removeCustomer: async (id) => {
    set({ error: null });
    try {
      await deleteCustomerDb(id);
      const state = get();
      set({ customers: state.customers.filter((c) => c.id !== id) });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to delete customer",
      });
    }
  },

  addSupplier: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const supplier: Supplier = {
        id: crypto.randomUUID(),
        ...data,
        createdAt: Date.now(),
      };
      await createSupplierDb(supplier);
      const state = get();
      set({ suppliers: [...state.suppliers, supplier], isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to add supplier",
        isLoading: false,
      });
    }
  },

  editSupplier: async (id, data) => {
    set({ error: null });
    try {
      const state = get();
      const existing = state.suppliers.find((s) => s.id === id);
      if (!existing) throw new Error("Supplier not found");
      const updated: Supplier = { ...existing, ...data };
      await updateSupplierDb(updated);
      set({ suppliers: state.suppliers.map((s) => (s.id === id ? updated : s)) });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to update supplier",
      });
    }
  },

  removeSupplier: async (id) => {
    set({ error: null });
    try {
      await deleteSupplierDb(id);
      const state = get();
      set({ suppliers: state.suppliers.filter((s) => s.id !== id) });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to delete supplier",
      });
    }
  },

  clearError: () => set({ error: null }),
}));
