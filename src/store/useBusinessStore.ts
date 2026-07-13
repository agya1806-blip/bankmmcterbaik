"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/* ─── Types ─── */

export interface PersonalTransaction {
  id: string; workspaceId: string; type: "income" | "expense"; category: string; amount: number; description: string; date: string; createdAt: number;
}

export interface SavingsGoal {
  id: string; workspaceId: string; name: string; targetAmount: number; collectedAmount: number; targetDate: string; createdAt: number;
}

export interface PrintingJob {
  id: string; workspaceId: string; type: "meteran" | "buku"; panjang: number; lebar: number; qty: number; pages?: number; coverCost?: number; jilidCost?: number; totalCost: number; price: number; createdAt: number;
}

export interface GadgetItem {
  id: string; workspaceId: string; imei1: string; imei2?: string; model: string; warrantyEnd: string; hpp: number; price: number; tukarTambahValue?: number; createdAt: number;
}

export interface LaptopBuild {
  id: string; workspaceId: string; sn: string; parts: { name: string; price: number }[]; totalHpp: number; price: number; invoiceNumber: string; createdAt: number;
}

export interface CoffeeIngredient {
  id: string; workspaceId: string; name: string; stockGram: number; minStockThreshold: number; unit: string; createdAt: number;
}

export interface FashionSKU {
  id: string; workspaceId: string; productName: string; color: string; size: string; price: number; stock: number; createdAt: number;
}

export interface SedekahBalance {
  zakatMal: number; zakatFitrah: number; infakTerikat: number; sedekahSubuh: number;
}

export interface Distribution {
  id: string; workspaceId: string; amount: number; source: keyof SedekahBalance; tujuan: string; notes: string; createdAt: number;
}

export interface LedgerDebt {
  id: string; workspaceId: string; type: "hutang_kita" | "piutang_orang"; contactName: string; phone: string; amount: number; status: "belum_lunas" | "lunas"; jatuhTempo: string; createdAt: number;
}

export interface DigitalMemo {
  id: string; workspaceId: string; title: string; content: string; tags: string[]; updatedAt: number; createdAt: number;
}

/* ─── Kalkulator Bisnis ─── */

export function hitungCetakMeteran(p: number, l: number, qty: number, modalSatuan: number): { totalCost: number; hargaJual: number } {
  const area = p * l * qty;
  const totalCost = area * modalSatuan * 1.05;
  const hargaJual = Math.ceil(totalCost * 1.4);
  return { totalCost, hargaJual };
}

export function hitungCetakBuku(halaman: number, kertasPerLembar: number, cover: number, jilid: number, qty: number): { totalCost: number; hargaJual: number } {
  const kertasCost = (halaman / kertasPerLembar) * 100;
  const totalCost = (kertasCost + cover + jilid) * qty * 1.05;
  const hargaJual = Math.ceil(totalCost * 1.35);
  return { totalCost, hargaJual };
}

export function hitungTukarTambah(hargaBaru: number, taksiranBekas: number): { bayar: number; hppBekas: number } {
  return { bayar: Math.max(0, hargaBaru - taksiranBekas), hppBekas: Math.ceil(taksiranBekas * 0.85) };
}

export function hitungKonveksi(beratKg: number, hargaKainPerKg: number, cmt: number, sablon: number, wastagePct: number): { totalCost: number; hargaJual: number } {
  const bahan = beratKg * hargaKainPerKg * 1.05;
  const wastage = (bahan + cmt + sablon) * (wastagePct / 100);
  const totalCost = bahan + cmt + sablon + wastage;
  const hargaJual = Math.ceil(totalCost * 1.5);
  return { totalCost, hargaJual };
}

/* ─── Store ─── */

interface BusinessStore {
  personalTransactions: PersonalTransaction[];
  savingsGoals: SavingsGoal[];
  printingJobs: PrintingJob[];
  gadgetItems: GadgetItem[];
  laptopBuilds: LaptopBuild[];
  coffeeIngredients: CoffeeIngredient[];
  fashionSKUs: FashionSKU[];
  sedekahBalance: SedekahBalance;
  distributions: Distribution[];
  ledgerDebts: LedgerDebt[];
  digitalMemos: DigitalMemo[];

  setPersonalTransactions: (t: PersonalTransaction[]) => void;
  addPersonalTransaction: (t: PersonalTransaction) => void;
  setSavingsGoals: (g: SavingsGoal[]) => void;
  addSavingsGoal: (g: SavingsGoal) => void;
  updateSavingsGoal: (id: string, g: Partial<SavingsGoal>) => void;
  alokasikanTabungan: (goalId: string, amount: number) => void;

  setPrintingJobs: (j: PrintingJob[]) => void;
  addPrintingJob: (j: PrintingJob) => void;
  setGadgetItems: (i: GadgetItem[]) => void;
  addGadgetItem: (i: GadgetItem) => void;
  setLaptopBuilds: (b: LaptopBuild[]) => void;
  addLaptopBuild: (b: LaptopBuild) => void;
  setCoffeeIngredients: (c: CoffeeIngredient[]) => void;
  addCoffeeIngredient: (c: CoffeeIngredient) => void;
  reduceCoffeeStock: (id: string, gram: number) => void;
  setFashionSKUs: (s: FashionSKU[]) => void;
  addFashionSKU: (s: FashionSKU) => void;

  setSedekahBalance: (b: SedekahBalance) => void;
  topUpSedekah: (source: keyof SedekahBalance, amount: number) => void;
  addDistribution: (d: Distribution) => void;
  setDistributions: (d: Distribution[]) => void;

  setLedgerDebts: (d: LedgerDebt[]) => void;
  addLedgerDebt: (d: LedgerDebt) => void;
  updateLedgerDebt: (id: string, d: Partial<LedgerDebt>) => void;
  setDigitalMemos: (m: DigitalMemo[]) => void;
  addDigitalMemo: (m: DigitalMemo) => void;
  updateDigitalMemo: (id: string, m: Partial<DigitalMemo>) => void;
  removeDigitalMemo: (id: string) => void;
}

export const useBusinessStore = create<BusinessStore>()(
  persist(
    (set) => ({
      personalTransactions: [],
      savingsGoals: [],
      printingJobs: [],
      gadgetItems: [],
      laptopBuilds: [],
      coffeeIngredients: [],
      fashionSKUs: [],
      sedekahBalance: { zakatMal: 0, zakatFitrah: 0, infakTerikat: 0, sedekahSubuh: 0 },
      distributions: [],
      ledgerDebts: [],
      digitalMemos: [],

      setPersonalTransactions: (t) => set({ personalTransactions: t }),
      addPersonalTransaction: (t) => set((s) => ({ personalTransactions: [t, ...s.personalTransactions] })),
      setSavingsGoals: (g) => set({ savingsGoals: g }),
      addSavingsGoal: (g) => set((s) => ({ savingsGoals: [g, ...s.savingsGoals] })),
      updateSavingsGoal: (id, upd) => set((s) => ({ savingsGoals: s.savingsGoals.map((g) => g.id === id ? { ...g, ...upd } : g) })),
      alokasikanTabungan: (goalId, amount) => set((s) => ({ savingsGoals: s.savingsGoals.map((g) => g.id === goalId ? { ...g, collectedAmount: g.collectedAmount + amount } : g) })),

      setPrintingJobs: (j) => set({ printingJobs: j }),
      addPrintingJob: (j) => set((s) => ({ printingJobs: [j, ...s.printingJobs] })),
      setGadgetItems: (i) => set({ gadgetItems: i }),
      addGadgetItem: (i) => set((s) => ({ gadgetItems: [i, ...s.gadgetItems] })),
      setLaptopBuilds: (b) => set({ laptopBuilds: b }),
      addLaptopBuild: (b) => set((s) => ({ laptopBuilds: [b, ...s.laptopBuilds] })),
      setCoffeeIngredients: (c) => set({ coffeeIngredients: c }),
      addCoffeeIngredient: (c) => set((s) => ({ coffeeIngredients: [c, ...s.coffeeIngredients] })),
      reduceCoffeeStock: (id, gram) => set((s) => ({ coffeeIngredients: s.coffeeIngredients.map((c) => c.id === id ? { ...c, stockGram: Math.max(0, c.stockGram - gram) } : c) })),
      setFashionSKUs: (s) => set({ fashionSKUs: s }),
      addFashionSKU: (s) => set((s_) => ({ fashionSKUs: [s, ...s_.fashionSKUs] })),

      setSedekahBalance: (b) => set({ sedekahBalance: b }),
      topUpSedekah: (source, amount) => set((s) => ({ sedekahBalance: { ...s.sedekahBalance, [source]: s.sedekahBalance[source] + amount } })),
      addDistribution: (d) => set((s) => {
        const bal = { ...s.sedekahBalance };
        if (bal[d.source] >= d.amount) { bal[d.source] -= d.amount; }
        return { distributions: [d, ...s.distributions], sedekahBalance: bal };
      }),
      setDistributions: (d) => set({ distributions: d }),

      setLedgerDebts: (d) => set({ ledgerDebts: d }),
      addLedgerDebt: (d) => set((s) => ({ ledgerDebts: [d, ...s.ledgerDebts] })),
      updateLedgerDebt: (id, upd) => set((s) => ({ ledgerDebts: s.ledgerDebts.map((d) => d.id === id ? { ...d, ...upd } : d) })),
      setDigitalMemos: (m) => set({ digitalMemos: m }),
      addDigitalMemo: (m) => set((s) => ({ digitalMemos: [m, ...s.digitalMemos] })),
      updateDigitalMemo: (id, upd) => set((s) => ({ digitalMemos: s.digitalMemos.map((m) => m.id === id ? { ...m, ...upd } : m) })),
      removeDigitalMemo: (id) => set((s) => ({ digitalMemos: s.digitalMemos.filter((m) => m.id !== id) })),
    }),
    { name: "mmcbank-business-store" }
  )
);
