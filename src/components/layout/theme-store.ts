"use client";

import { create } from "zustand";

interface ThemeState {
  theme: "light" | "dark";
  toggleTheme: () => void;
  setTheme: (t: "light" | "dark") => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "light",
  toggleTheme: () => {
    const next = get().theme === "light" ? "dark" : "light";
    set({ theme: next });
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("mmcbank-theme", next);
  },
  setTheme: (t) => {
    set({ theme: t });
    document.documentElement.classList.toggle("dark", t === "dark");
    localStorage.setItem("mmcbank-theme", t);
  },
}));
