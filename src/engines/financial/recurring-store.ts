"use client";

import { create } from "zustand";
import {
  createRecurringRule as createRuleDb,
  updateRecurringRule as updateRuleDb,
  deleteRecurringRule as deleteRuleDb,
  getRecurringRulesByWorkspace,
  createTransaction as createTransactionDb,
  getAccountById,
  updateAccount,
  type RecurringRule,
  type Transaction,
} from "@/lib/db";

function computeNextDate(rule: RecurringRule): string {
  const current = new Date(rule.nextDate);
  const next = new Date(current);
  switch (rule.frequency) {
    case "daily": next.setDate(next.getDate() + rule.interval); break;
    case "weekly": next.setDate(next.getDate() + 7 * rule.interval); break;
    case "monthly": next.setMonth(next.getMonth() + rule.interval); break;
    case "yearly": next.setFullYear(next.getFullYear() + rule.interval); break;
  }
  return next.toISOString().split("T")[0];
}

export interface RecurringState {
  rules: RecurringRule[];
  isLoading: boolean;
  error: string | null;

  loadRules: (workspaceId: string) => Promise<void>;
  addRule: (data: {
    workspaceId: string;
    type: Transaction["type"];
    amount: number;
    accountId: string;
    toAccountId?: string;
    categoryId?: string;
    description: string;
    frequency: RecurringRule["frequency"];
    interval: number;
    startDate: string;
  }) => Promise<void>;
  removeRule: (id: string) => Promise<void>;
  toggleRule: (id: string) => Promise<void>;
  processDueRules: () => Promise<void>;
  clearError: () => void;
}

export const useRecurringStore = create<RecurringState>((set, get) => ({
  rules: [],
  isLoading: false,
  error: null,

  loadRules: async (workspaceId: string) => {
    set({ isLoading: true, error: null });
    try {
      const rules = await getRecurringRulesByWorkspace(workspaceId);
      set({ rules, isLoading: false });
    } catch {
      set({ error: "Failed to load recurring rules", isLoading: false });
    }
  },

  addRule: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const rule: RecurringRule = {
        id: crypto.randomUUID(),
        ...data,
        endDate: undefined,
        nextDate: data.startDate,
        active: true,
        createdAt: Date.now(),
      };
      await createRuleDb(rule);
      const state = get();
      set({ rules: [...state.rules, rule], isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to add rule",
        isLoading: false,
      });
    }
  },

  removeRule: async (id) => {
    try {
      await deleteRuleDb(id);
      const state = get();
      set({ rules: state.rules.filter((r) => r.id !== id) });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to delete rule" });
    }
  },

  toggleRule: async (id) => {
    try {
      const state = get();
      const existing = state.rules.find((r) => r.id === id);
      if (!existing) throw new Error("Rule not found");
      const updated = { ...existing, active: !existing.active };
      await updateRuleDb(updated);
      set({ rules: state.rules.map((r) => (r.id === id ? updated : r)) });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to toggle rule" });
    }
  },

  processDueRules: async () => {
    try {
      const { getPendingRecurringRules } = await import("@/lib/db");
      const due = await getPendingRecurringRules();
      for (const rule of due) {
        if (!rule.active) continue;
        const tx: Transaction = {
          id: crypto.randomUUID(),
          workspaceId: rule.workspaceId,
          type: rule.type,
          amount: rule.amount,
          accountId: rule.accountId,
          toAccountId: rule.toAccountId,
          categoryId: rule.categoryId,
          description: `[Recurring] ${rule.description}`,
          date: rule.nextDate,
          createdAt: Date.now(),
        };
        await createTransactionDb(tx);

        const acc = await getAccountById(rule.accountId);
        if (acc) {
          if (rule.type === "income") acc.balance += rule.amount;
          else if (rule.type === "expense") acc.balance -= rule.amount;
          else if (rule.type === "transfer" && rule.toAccountId) {
            acc.balance -= rule.amount;
            const toAcc = await getAccountById(rule.toAccountId);
            if (toAcc) {
              toAcc.balance += rule.amount;
              await updateAccount(toAcc);
            }
          }
          await updateAccount(acc);
        }

        const updated = { ...rule, nextDate: computeNextDate(rule) };
        if (updated.endDate && updated.nextDate > updated.endDate) {
          updated.active = false;
        }
        await updateRuleDb(updated);
      }
    } catch (err) {
      console.error("Failed to process recurring rules:", err);
    }
  },

  clearError: () => set({ error: null }),
}));
