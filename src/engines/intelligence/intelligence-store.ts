"use client";

import { create } from "zustand";
import type { Transaction, Category, Budget } from "@/lib/db";

export interface IntelligenceState {
  insights: string[];
  isLoading: boolean;
  error: string | null;

  generateInsights: (
    workspaceId: string,
    transactions: Transaction[],
    categories: Category[],
    budgets: Budget[]
  ) => Promise<string[]>;
  suggestCategory: (
    description: string,
    categories: Category[]
  ) => string | null;
  detectAnomalies: (transactions: Transaction[]) => string[];
  simpleForecast: (transactions: Transaction[]) => {
    nextMonthIncome: number;
    nextMonthExpense: number;
  };
}

export const useIntelligenceStore = create<IntelligenceState>((set, get) => ({
  insights: [],
  isLoading: false,
  error: null,

  generateInsights: async (
    _workspaceId: string,
    transactions: Transaction[],
    categories: Category[],
    budgets: Budget[]
  ) => {
    set({ isLoading: true, error: null });
    try {
      const result: string[] = [];

      const anomalies = get().detectAnomalies(transactions);
      if (anomalies.length > 0) {
        result.push(
          `Anomalies detected: ${anomalies.length} unusual transaction(s) found.`
        );
        anomalies.slice(0, 3).forEach((a) => result.push(a));
      }

      const incomeTxs = transactions.filter((t) => t.type === "income");
      const expenseTxs = transactions.filter((t) => t.type === "expense");
      const totalIncome = incomeTxs.reduce((s, t) => s + t.amount, 0);
      const totalExpense = expenseTxs.reduce((s, t) => s + t.amount, 0);

      if (totalIncome > 0 || totalExpense > 0) {
        const pnl = totalIncome - totalExpense;
        result.push(
          pnl >= 0
            ? `Net profit: ${pnl.toFixed(2)} (Income: ${totalIncome.toFixed(2)}, Expense: ${totalExpense.toFixed(2)})`
            : `Net loss: ${pnl.toFixed(2)} (Income: ${totalIncome.toFixed(2)}, Expense: ${totalExpense.toFixed(2)})`
        );

        const ratio =
          totalExpense > 0
            ? ((totalIncome / totalExpense) * 100).toFixed(1)
            : "N/A";
        result.push(`Income/Expense ratio: ${ratio}%`);
      }

      if (budgets.length > 0) {
        const categoryMap = new Map(
          categories.map((c) => [c.id, c.name])
        );
        for (const budget of budgets) {
          const catName =
            categoryMap.get(budget.categoryId) ?? "Unknown";
          const spent = expenseTxs
            .filter((t) => t.categoryId === budget.categoryId)
            .reduce((s, t) => s + t.amount, 0);
          if (budget.amount > 0) {
            const pct = ((spent / budget.amount) * 100).toFixed(1);
            if (parseFloat(pct) > 80) {
              result.push(
                `Budget alert: ${catName} is at ${pct}% (${spent.toFixed(2)} / ${budget.amount.toFixed(2)})`
              );
            }
          }
        }
      }

      const forecast = get().simpleForecast(transactions);
      result.push(
        `Forecast next month: Income ${forecast.nextMonthIncome.toFixed(2)}, Expense ${forecast.nextMonthExpense.toFixed(2)}`
      );

      set({ insights: result, isLoading: false });
      return result;
    } catch (err) {
      set({
        error:
          err instanceof Error ? err.message : "Failed to generate insights",
        isLoading: false,
      });
      return [];
    }
  },

  suggestCategory: (description: string, categories: Category[]) => {
    const lower = description.toLowerCase();
    const keywordMap: Record<string, string> = {};
    for (const cat of categories) {
      keywordMap[cat.name.toLowerCase()] = cat.id;
    }
    for (const [keyword, id] of Object.entries(keywordMap)) {
      if (lower.includes(keyword)) return id;
    }
    return null;
  },

  detectAnomalies: (transactions: Transaction[]) => {
    const anomalies: string[] = [];
    const amounts = transactions.map((t) => t.amount);
    if (amounts.length === 0) return anomalies;
    const avg = amounts.reduce((s, a) => s + a, 0) / amounts.length;
    const threshold = avg * 3;
    for (const t of transactions) {
      if (t.amount > threshold) {
        anomalies.push(
          `${t.description}: ${t.amount.toFixed(2)} (3x above average of ${avg.toFixed(2)})`
        );
      }
    }
    return anomalies;
  },

  simpleForecast: (transactions: Transaction[]) => {
    const now = new Date();
    const threeMonthsAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 3,
      1
    );
    const recent = transactions.filter(
      (t) => new Date(t.date) >= threeMonthsAgo
    );

    const incomeTotals: number[] = [];
    const expenseTotals: number[] = [];

    for (let i = 0; i < 3; i++) {
      const month = new Date(
        now.getFullYear(),
        now.getMonth() - i,
        1
      );
      const monthStr = month.toISOString().slice(0, 7);
      const monthTxs = recent.filter(
        (t) => t.date.slice(0, 7) === monthStr
      );
      incomeTotals.push(
        monthTxs
          .filter((t) => t.type === "income")
          .reduce((s, t) => s + t.amount, 0)
      );
      expenseTotals.push(
        monthTxs
          .filter((t) => t.type === "expense")
          .reduce((s, t) => s + t.amount, 0)
      );
    }

    const avgIncome =
      incomeTotals.length > 0
        ? incomeTotals.reduce((s, v) => s + v, 0) / incomeTotals.length
        : 0;
    const avgExpense =
      expenseTotals.length > 0
        ? expenseTotals.reduce((s, v) => s + v, 0) / expenseTotals.length
        : 0;

    return {
      nextMonthIncome: avgIncome,
      nextMonthExpense: avgExpense,
    };
  },
}));
