"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/* ─── Types ─── */

export type PersonalCategory = "Makanan" | "Transportasi" | "Cicilan" | "Hiburan";

export interface PersonalTransaction {
  id: string;
  tanggal: string;
  tipe: "Pemasukan" | "Pengeluaran";
  kategori: PersonalCategory;
  nominal: number;
}

export interface SavingsGoal {
  id: string;
  nama: string;
  targetNominal: number;
  terkumpul: number;
  targetDate: string;
}

export interface PrintingJob {
  id: string;
  type: "meteran" | "buku";
  panjang: number;
  lebar: number;
  qty: number;
  pages?: number;
  coverCost?: number;
  jilidCost?: number;
  totalCost: number;
  hargaJual: number;
}

export interface GadgetItem {
  id: string;
  imei1: string;
  imei2?: string;
  model: string;
  warrantyEnd: string;
  hpp: number;
  price: number;
  tukarTambahValue?: number;
}

export interface LaptopBuild {
  id: string;
  sn: string;
  parts: { name: string; price: number }[];
  totalHpp: number;
  price: number;
  invoiceNumber: string;
}

export interface CoffeeIngredient {
  id: string;
  name: string;
  stockGram: number;
  minStockThreshold: number;
}

export interface FashionSKU {
  id: string;
  productName: string;
  color: string;
  size: string;
  price: number;
  stock: number;
}

export interface SedekahBalance {
  zakatMal: number;
  zakatFitrah: number;
  infakTerikat: number;
  sedekahSubuh: number;
}

export interface Distribution {
  id: string;
  amount: number;
  source: keyof SedekahBalance;
  tujuan: "Fakir Miskin" | "Pembangunan" | "Operasional";
  notes: string;
  dokumentasi: string;
  createdAt: number;
}

export interface LedgerDebt {
  id: string;
  tipe: "hutang_kita" | "piutang_orang";
  contactName: string;
  whatsapp: string;
  nominal: number;
  status: "Belum Lunas" | "Lunas";
  jatuhTempo: string;
}

export interface DigitalMemo {
  id: string;
  judul: string;
  isi: string;
  tags: string[];
  updatedAt: number;
}

/* ─── Kalkulator Bisnis ─── */

export function hitungCetakMeteran(p: number, l: number, qty: number, modalSatuan: number) {
  const area = p * l * qty;
  const totalCost = area * modalSatuan * 1.05;
  const hargaJual = Math.ceil(totalCost * 1.4);
  return { totalCost, hargaJual };
}

export function hitungCetakBuku(halaman: number, kertasPerLembar: number, cover: number, jilid: number, qty: number) {
  const kertasCost = (halaman / kertasPerLembar) * 100;
  const totalCost = (kertasCost + cover + jilid) * qty * 1.05;
  const hargaJual = Math.ceil(totalCost * 1.35);
  return { totalCost, hargaJual };
}

export function hitungTukarTambah(hargaBaru: number, taksiranBekas: number) {
  return { bayar: Math.max(0, hargaBaru - taksiranBekas), hppBekas: Math.ceil(taksiranBekas * 0.85) };
}

export function hitungKonveksi(beratKg: number, hargaKainPerKg: number, cmt: number, sablon: number, wastagePct: number) {
  const bahan = beratKg * hargaKainPerKg * 1.05;
  const wastage = (bahan + cmt + sablon) * (wastagePct / 100);
  const totalCost = bahan + cmt + sablon + wastage;
  const hargaJual = Math.ceil(totalCost * 1.5);
  return { totalCost, hargaJual };
}

/* ─── Alokasi Otomatis Sedekah ─── */

export const SEDEKAH_PERSENTASE = {
  zakatMal: 0.025,
  zakatFitrah: 0.25,
  infakTerikat: 0.25,
  sedekahSubuh: 0.475,
} as const;

export function hitungAlokasiSedekah(total: number): SedekahBalance {
  return {
    zakatMal: Math.round(total * SEDEKAH_PERSENTASE.zakatMal),
    zakatFitrah: Math.round(total * SEDEKAH_PERSENTASE.zakatFitrah),
    infakTerikat: Math.round(total * SEDEKAH_PERSENTASE.infakTerikat),
    sedekahSubuh: total - Math.round(total * (SEDEKAH_PERSENTASE.zakatMal + SEDEKAH_PERSENTASE.zakatFitrah + SEDEKAH_PERSENTASE.infakTerikat)),
  };
}

/* ─── Store Interface ─── */

interface BusinessStore {
  _mounted: boolean;
  setMounted: () => void;

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

  /* Personal */
  setPersonalTransactions: (t: PersonalTransaction[]) => void;
  addPersonalTransaction: (t: PersonalTransaction) => void;
  setSavingsGoals: (g: SavingsGoal[]) => void;
  addSavingsGoal: (g: SavingsGoal) => void;
  alokasikanTabungan: (goalId: string, nominal: number) => void;

  /* Percetakan */
  setPrintingJobs: (j: PrintingJob[]) => void;
  addPrintingJob: (j: PrintingJob) => void;

  /* Gadget */
  setGadgetItems: (i: GadgetItem[]) => void;
  addGadgetItem: (i: GadgetItem) => void;

  /* Laptop */
  setLaptopBuilds: (b: LaptopBuild[]) => void;
  addLaptopBuild: (b: LaptopBuild) => void;

  /* Kedai Kopi */
  setCoffeeIngredients: (c: CoffeeIngredient[]) => void;
  addCoffeeIngredient: (c: CoffeeIngredient) => void;
  reduceStock: (id: string, gram: number) => boolean;

  /* Konveksi */
  setFashionSKUs: (s: FashionSKU[]) => void;
  addFashionSKU: (s: FashionSKU) => void;

  /* Sedekah */
  setSedekahBalance: (b: SedekahBalance) => void;
  topUpSedekah: (total: number) => void;
  distribusiDana: (d: Distribution) => { ok: boolean; error?: string };
  setDistributions: (d: Distribution[]) => void;

  /* Catatan */
  setLedgerDebts: (d: LedgerDebt[]) => void;
  addLedgerDebt: (d: LedgerDebt) => void;
  updateLedgerDebt: (id: string, d: Partial<LedgerDebt>) => void;
  setDigitalMemos: (m: DigitalMemo[]) => void;
  addDigitalMemo: (m: DigitalMemo) => void;
  updateDigitalMemo: (id: string, m: Partial<DigitalMemo>) => void;
  removeDigitalMemo: (id: string) => void;
}

/* ─── Store ─── */

export const useBusinessStore = create<BusinessStore>()(
  persist(
    (set, get) => ({
      _mounted: false,
      setMounted: () => set({ _mounted: true }),

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

      /* Personal */
      setPersonalTransactions: (t) => set({ personalTransactions: t }),
      addPersonalTransaction: (t) => set((s) => ({ personalTransactions: [t, ...s.personalTransactions] })),
      setSavingsGoals: (g) => set({ savingsGoals: g }),
      addSavingsGoal: (g) => set((s) => ({ savingsGoals: [g, ...s.savingsGoals] })),
      alokasikanTabungan: (goalId, nominal) => set((s) => ({
        savingsGoals: s.savingsGoals.map((g) =>
          g.id === goalId ? { ...g, terkumpul: g.terkumpul + nominal } : g
        ),
      })),

      /* Percetakan */
      setPrintingJobs: (j) => set({ printingJobs: j }),
      addPrintingJob: (j) => set((s) => ({ printingJobs: [j, ...s.printingJobs] })),

      /* Gadget */
      setGadgetItems: (i) => set({ gadgetItems: i }),
      addGadgetItem: (i) => set((s) => ({ gadgetItems: [i, ...s.gadgetItems] })),

      /* Laptop */
      setLaptopBuilds: (b) => set({ laptopBuilds: b }),
      addLaptopBuild: (b) => set((s) => ({ laptopBuilds: [b, ...s.laptopBuilds] })),

      /* Kedai Kopi */
      setCoffeeIngredients: (c) => set({ coffeeIngredients: c }),
      addCoffeeIngredient: (c) => set((s) => ({ coffeeIngredients: [c, ...s.coffeeIngredients] })),
      reduceStock: (id, gram) => {
        const item = get().coffeeIngredients.find((c) => c.id === id);
        if (!item || item.stockGram < gram) return false;
        set((s) => ({
          coffeeIngredients: s.coffeeIngredients.map((c) =>
            c.id === id ? { ...c, stockGram: Math.max(0, c.stockGram - gram) } : c
          ),
        }));
        return true;
      },

      /* Konveksi */
      setFashionSKUs: (s) => set({ fashionSKUs: s }),
      addFashionSKU: (s) => set((s_) => ({ fashionSKUs: [s, ...s_.fashionSKUs] })),

      /* Sedekah */
      setSedekahBalance: (b) => set({ sedekahBalance: b }),
      topUpSedekah: (total) => set({ sedekahBalance: hitungAlokasiSedekah(total) }),
      distribusiDana: (d) => {
        const bal = get().sedekahBalance;
        if (bal[d.source] < d.amount) {
          return { ok: false, error: `Saldo ${d.source} tidak mencukupi (tersedia: ${bal[d.source]}, diperlukan: ${d.amount})` };
        }
        set((s) => ({
          sedekahBalance: { ...s.sedekahBalance, [d.source]: s.sedekahBalance[d.source] - d.amount },
          distributions: [d, ...s.distributions],
        }));
        return { ok: true };
      },
      setDistributions: (d) => set({ distributions: d }),

      /* Catatan */
      setLedgerDebts: (d) => set({ ledgerDebts: d }),
      addLedgerDebt: (d) => set((s) => ({ ledgerDebts: [d, ...s.ledgerDebts] })),
      updateLedgerDebt: (id, upd) => set((s) => ({
        ledgerDebts: s.ledgerDebts.map((d) => (d.id === id ? { ...d, ...upd } : d)),
      })),
      setDigitalMemos: (m) => set({ digitalMemos: m }),
      addDigitalMemo: (m) => set((s) => ({ digitalMemos: [m, ...s.digitalMemos] })),
      updateDigitalMemo: (id, upd) => set((s) => ({
        digitalMemos: s.digitalMemos.map((m) => (m.id === id ? { ...m, ...upd, updatedAt: Date.now() } : m)),
      })),
      removeDigitalMemo: (id) => set((s) => ({ digitalMemos: s.digitalMemos.filter((m) => m.id !== id) })),
    }),
    {
      name: "mmcbank-business-store-v2",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
        return localStorage;
      }),
      partialize: (state) => {
        const { _mounted: _m, setMounted: _s, ...rest } = state;
        void _m; void _s;
        return rest;
      },
      merge: (persisted, current) => ({
        ...current,
        ...(typeof persisted === "object" && persisted ? (persisted as object) : {}),
        _mounted: true,
      }),
    }
  )
);
