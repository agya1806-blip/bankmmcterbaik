"use client";

import { create } from "zustand";
import {
  createAccount,
  updateAccount,
  deleteAccount,
  getAccountsByWorkspace,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoriesByWorkspace,
  createTransaction as createTransactionDb,
  updateTransaction as updateTransactionDb,
  deleteTransaction as deleteTransactionDb,
  getTransactionsByWorkspace,
  createBudget as createBudgetDb,
  updateBudget as updateBudgetDb,
  deleteBudget as deleteBudgetDb,
  getBudgetsByWorkspace,
  type Account,
  type Category,
  type Transaction,
  type Budget,
} from "@/lib/db";

function generateId(): string {
  return crypto.randomUUID();
}

export interface FinancialState {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  isLoading: boolean;
  error: string | null;

  loadAccounts: (workspaceId: string) => Promise<void>;
  loadCategories: (workspaceId: string) => Promise<void>;
  loadTransactions: (workspaceId: string) => Promise<void>;
  loadBudgets: (workspaceId: string) => Promise<void>;
  addAccount: (data: {
    workspaceId: string;
    name: string;
    type: Account["type"];
    balance: number;
    currency: string;
  }) => Promise<void>;
  editAccount: (id: string, data: Partial<Pick<Account, "name" | "type" | "balance" | "currency">>) => Promise<void>;
  removeAccount: (id: string) => Promise<void>;
  addCategory: (data: {
    workspaceId: string;
    name: string;
    type: Category["type"];
    color: string;
  }) => Promise<void>;
  editCategory: (id: string, data: Partial<Pick<Category, "name" | "type" | "color">>) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
  addTransaction: (data: {
    workspaceId: string;
    type: Transaction["type"];
    amount: number;
    accountId: string;
    toAccountId?: string;
    categoryId?: string;
    description: string;
    date: string;
  }) => Promise<void>;
  editTransaction: (id: string, data: {
    type?: Transaction["type"];
    amount?: number;
    accountId?: string;
    toAccountId?: string;
    categoryId?: string;
    description?: string;
    date?: string;
  }) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  addBudget: (data: {
    workspaceId: string;
    categoryId: string;
    amount: number;
    period: Budget["period"];
    startDate: string;
  }) => Promise<void>;
  editBudget: (id: string, data: Partial<Pick<Budget, "amount" | "period" | "startDate">>) => Promise<void>;
  removeBudget: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useFinancialStore = create<FinancialState>((set, get) => ({
  accounts: [],
  categories: [],
  transactions: [],
  budgets: [],
  isLoading: false,
  error: null,

  loadAccounts: async (workspaceId: string) => {
    set({ isLoading: true, error: null });
    try {
      const accounts = await getAccountsByWorkspace(workspaceId);
      set({ accounts, isLoading: false });
    } catch {
      set({ error: "Failed to load accounts", isLoading: false });
    }
  },

  loadCategories: async (workspaceId: string) => {
    set({ isLoading: true, error: null });
    try {
      const categories = await getCategoriesByWorkspace(workspaceId);
      set({ categories, isLoading: false });
    } catch {
      set({ error: "Failed to load categories", isLoading: false });
    }
  },

  loadTransactions: async (workspaceId: string) => {
    set({ isLoading: true, error: null });
    try {
      const transactions = await getTransactionsByWorkspace(workspaceId);
      set({ transactions, isLoading: false });
    } catch {
      set({ error: "Failed to load transactions", isLoading: false });
    }
  },

  loadBudgets: async (workspaceId: string) => {
    set({ isLoading: true, error: null });
    try {
      const budgets = await getBudgetsByWorkspace(workspaceId);
      set({ budgets, isLoading: false });
    } catch {
      set({ error: "Failed to load budgets", isLoading: false });
    }
  },

  addAccount: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const account: Account = {
        id: generateId(),
        ...data,
        createdAt: Date.now(),
      };
      await createAccount(account);
      const state = get();
      set({
        accounts: [...state.accounts, account],
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to add account",
        isLoading: false,
      });
    }
  },

  editAccount: async (id, data) => {
    set({ error: null });
    try {
      const state = get();
      const existing = state.accounts.find((a) => a.id === id);
      if (!existing) throw new Error("Account not found");
      const updated: Account = { ...existing, ...data };
      await updateAccount(updated);
      set({
        accounts: state.accounts.map((a) => (a.id === id ? updated : a)),
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to update account",
      });
    }
  },

  removeAccount: async (id) => {
    set({ error: null });
    try {
      await deleteAccount(id);
      const state = get();
      set({ accounts: state.accounts.filter((a) => a.id !== id) });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to delete account",
      });
    }
  },

  addCategory: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const category: Category = {
        id: generateId(),
        ...data,
        createdAt: Date.now(),
      };
      await createCategory(category);
      const state = get();
      set({
        categories: [...state.categories, category],
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to add category",
        isLoading: false,
      });
    }
  },

  editCategory: async (id, data) => {
    set({ error: null });
    try {
      const state = get();
      const existing = state.categories.find((c) => c.id === id);
      if (!existing) throw new Error("Category not found");
      const updated: Category = { ...existing, ...data };
      await updateCategory(updated);
      set({
        categories: state.categories.map((c) => (c.id === id ? updated : c)),
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to update category",
      });
    }
  },

  removeCategory: async (id) => {
    set({ error: null });
    try {
      await deleteCategory(id);
      const state = get();
      set({ categories: state.categories.filter((c) => c.id !== id) });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to delete category",
      });
    }
  },

  addTransaction: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const transaction: Transaction = {
        id: crypto.randomUUID(),
        ...data,
        createdAt: Date.now(),
      };
      await createTransactionDb(transaction);

      const state = get();

      const accounts = state.accounts.map((a) => {
        if (data.type === "income" && a.id === data.accountId) {
          return { ...a, balance: a.balance + data.amount };
        }
        if (data.type === "expense" && a.id === data.accountId) {
          return { ...a, balance: a.balance - data.amount };
        }
        if (data.type === "transfer") {
          if (a.id === data.accountId) return { ...a, balance: a.balance - data.amount };
          if (a.id === data.toAccountId) return { ...a, balance: a.balance + data.amount };
        }
        return a;
      });

      if (data.type === "income" || data.type === "expense") {
        const acc = accounts.find((a) => a.id === data.accountId);
        if (acc) await updateAccount(acc);
      } else if (data.type === "transfer") {
        const from = accounts.find((a) => a.id === data.accountId);
        const to = accounts.find((a) => a.id === data.toAccountId);
        if (from) await updateAccount(from);
        if (to) await updateAccount(to);
      }

      set({
        transactions: [...state.transactions, transaction],
        accounts,
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to add transaction",
        isLoading: false,
      });
    }
  },

  editTransaction: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const state = get();
      const existing = state.transactions.find((t) => t.id === id);
      if (!existing) throw new Error("Transaction not found");

      const updated: Transaction = { ...existing, ...data, id, createdAt: existing.createdAt };
      await updateTransactionDb(updated);

      const balanceDelta = (tx: Transaction): Record<string, number> => {
        const deltas: Record<string, number> = {};
        if (tx.type === "income") deltas[tx.accountId] = tx.amount;
        else if (tx.type === "expense") deltas[tx.accountId] = -tx.amount;
        else if (tx.type === "transfer") {
          deltas[tx.accountId] = -tx.amount;
          if (tx.toAccountId) deltas[tx.toAccountId] = tx.amount;
        }
        return deltas;
      };

      const oldDeltas = balanceDelta(existing);
      const newDeltas = balanceDelta(updated);
      const accounts = state.accounts.map((a) => {
        const net = (newDeltas[a.id] || 0) - (oldDeltas[a.id] || 0);
        return net !== 0 ? { ...a, balance: a.balance + net } : a;
      });

      for (const a of accounts) {
        if (Object.keys(oldDeltas).includes(a.id) || Object.keys(newDeltas).includes(a.id)) {
          await updateAccount(a);
        }
      }

      set({
        transactions: state.transactions.map((t) => (t.id === id ? updated : t)),
        accounts,
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to update transaction",
        isLoading: false,
      });
    }
  },

  removeTransaction: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const state = get();
      const existing = state.transactions.find((t) => t.id === id);
      if (!existing) throw new Error("Transaction not found");

      await deleteTransactionDb(id);

      const accounts = state.accounts.map((a) => {
        if ((existing.type === "income" || existing.type === "receivable") && a.id === existing.accountId) {
          return { ...a, balance: a.balance - existing.amount };
        }
        if ((existing.type === "expense" || existing.type === "debt") && a.id === existing.accountId) {
          return { ...a, balance: a.balance + existing.amount };
        }
        if (existing.type === "transfer") {
          if (a.id === existing.accountId) return { ...a, balance: a.balance + existing.amount };
          if (a.id === existing.toAccountId) return { ...a, balance: a.balance - existing.amount };
        }
        return a;
      });

      for (const a of accounts) {
        if (existing.accountId === a.id || existing.toAccountId === a.id) {
          await updateAccount(a);
        }
      }

      set({
        transactions: state.transactions.filter((t) => t.id !== id),
        accounts,
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to delete transaction",
        isLoading: false,
      });
    }
  },

  addBudget: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const budget: Budget = {
        id: crypto.randomUUID(),
        ...data,
        createdAt: Date.now(),
      };
      await createBudgetDb(budget);
      const state = get();
      set({ budgets: [...state.budgets, budget], isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to add budget",
        isLoading: false,
      });
    }
  },

  editBudget: async (id, data) => {
    set({ error: null });
    try {
      const state = get();
      const existing = state.budgets.find((b) => b.id === id);
      if (!existing) throw new Error("Budget not found");
      const updated: Budget = { ...existing, ...data };
      await updateBudgetDb(updated);
      set({ budgets: state.budgets.map((b) => (b.id === id ? updated : b)) });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to update budget",
      });
    }
  },

  removeBudget: async (id) => {
    set({ error: null });
    try {
      await deleteBudgetDb(id);
      const state = get();
      set({ budgets: state.budgets.filter((b) => b.id !== id) });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to delete budget",
      });
    }
  },

  clearError: () => set({ error: null }),
}));
