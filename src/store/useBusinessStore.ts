"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/* ══════════════════════════════════════════════════════════════
   TIPE DATA — BUKU PRIBADI
   ══════════════════════════════════════════════════════════════ */

export type PersonalCategory = "Makanan" | "Transportasi" | "Cicilan" | "Hiburan" | "Lainnya";

export interface PersonalTransaction {
  id: string;
  tanggal: string;
  tipe: "Pemasukan" | "Pengeluaran";
  kategori: PersonalCategory;
  nominal: number;
  catatan?: string;
}

export interface SavingsGoal {
  id: string;
  nama: string;
  targetNominal: number;
  terkumpul: number;
  targetDate: string;
}

/* ══════════════════════════════════════════════════════════════
   TIPE DATA — BUKU USAHA: PERCETAKAN
   ══════════════════════════════════════════════════════════════ */

export type PrintingType = "meteran" | "buku";

export interface PrintingJob {
  id: string;
  type: PrintingType;
  panjang: number;
  lebar: number;
  qty: number;
  pages?: number;
  kertas?: { label: string; hargaPerLembar: number };
  cover?: { label: string; harga: number };
  jilid?: { label: string; harga: number };
  totalCost: number;
  hargaJual: number;
  margin: number;
}

export function hitungCetakMeteran(
  panjangCm: number,
  lebarCm: number,
  qty: number,
  modalPerCm2: number
): { totalCost: number; hargaJual: number; margin: number } {
  const area = panjangCm * lebarCm * qty;
  const totalCost = Math.ceil(area * modalPerCm2 * 1.05);
  const hargaJual = Math.ceil(totalCost * 1.4);
  const margin = hargaJual - totalCost;
  return { totalCost, hargaJual, margin };
}

export function hitungCetakBuku(
  halaman: number,
  kertasPerLembar: number,
  hargaKertas: number,
  cover: number,
  jilid: number,
  qty: number
): { totalCost: number; hargaJual: number; margin: number } {
  const kertasCost = (halaman / kertasPerLembar) * hargaKertas;
  const totalCost = Math.ceil((kertasCost + cover + jilid) * qty * 1.05);
  const hargaJual = Math.ceil(totalCost * 1.35);
  const margin = hargaJual - totalCost;
  return { totalCost, hargaJual, margin };
}

/* ══════════════════════════════════════════════════════════════
   TIPE DATA — BUKU USAHA: GADGET / HP
   ══════════════════════════════════════════════════════════════ */

export interface GadgetItem {
  id: string;
  imei1: string;
  imei2?: string;
  model: string;
  brand?: string;
  warrantyEnd: string;
  hpp: number;
  price: number;
  tukarTambahValue?: number;
  catatan?: string;
}

export interface TukarTambahResult {
  bayar: number;
  hppBekas: number;
  diskonSelisih: number;
}

export function hitungTukarTambah(
  hargaBaru: number,
  taksiranBekas: number
): TukarTambahResult {
  const bayar = Math.max(0, hargaBaru - taksiranBekas);
  const hppBekas = Math.ceil(taksiranBekas * 0.85);
  const diskonSelisih = hargaBaru - bayar;
  return { bayar, hppBekas, diskonSelisih };
}

/* ══════════════════════════════════════════════════════════════
   TIPE DATA — BUKU USAHA: LAPTOP / PC
   ══════════════════════════════════════════════════════════════ */

export interface LaptopPart {
  name: string;
  sn: string;
  price: number;
}

export interface LaptopBuild {
  id: string;
  sn: string;
  parts: LaptopPart[];
  totalHpp: number;
  price: number;
  invoiceNumber: string;
  margin: number;
}

/* ══════════════════════════════════════════════════════════════
   TIPE DATA — BUKU USAHA: KEDAI KOPI
   ══════════════════════════════════════════════════════════════ */

export interface CoffeeIngredient {
  id: string;
  name: string;
  stockGram: number;
  minStockThreshold: number;
  hargaPerGram?: number;
}

export interface CoffeeBOM {
  coffee?: number;
  milk?: number;
  syrup?: number;
  other?: number;
}

export interface CoffeeMenuItem {
  name: string;
  price: number;
  bom: CoffeeBOM;
  kategori?: "Kopi" | "Non-Kopi";
}

/* ══════════════════════════════════════════════════════════════
   TIPE DATA — BUKU USAHA: KONVEKSI
   ══════════════════════════════════════════════════════════════ */

export type FashionSize = "S" | "M" | "L" | "XL" | "XXL" | "3XL";

export type FashionColor =
  | "Hitam" | "Putih" | "Merah" | "Biru" | "Hijau"
  | "Kuning" | "Abu" | "Coklat" | "Navy" | "Burgundy";

export interface FashionSKU {
  id: string;
  productName: string;
  color: FashionColor;
  size: FashionSize;
  price: number;
  stock: number;
  hpp?: number;
}

export interface KonveksiCostResult {
  totalCost: number;
  hargaJual: number;
  margin: number;
  rincian: {
    bahan: number;
    cmt: number;
    sablon: number;
    wastage: number;
  };
}

export function hitungKonveksi(
  beratKg: number,
  hargaKainPerKg: number,
  cmt: number,
  sablon: number,
  wastagePct: number
): KonveksiCostResult {
  const bahan = Math.ceil(beratKg * hargaKainPerKg * 1.05);
  const wastage = Math.ceil((bahan + cmt + sablon) * (wastagePct / 100));
  const totalCost = bahan + cmt + sablon + wastage;
  const hargaJual = Math.ceil(totalCost * 1.5);
  return {
    totalCost,
    hargaJual,
    margin: hargaJual - totalCost,
    rincian: { bahan, cmt, sablon, wastage },
  };
}

/* ══════════════════════════════════════════════════════════════
   TIPE DATA — BUKU SEDEKAH
   ══════════════════════════════════════════════════════════════ */

export interface SedekahBalance {
  zakatMal: number;
  zakatFitrah: number;
  infakTerikat: number;
  sedekahSubuh: number;
}

export type SedekahSource = keyof SedekahBalance;

export type DistributionTujuan =
  | "Fakir Miskin"
  | "Pembangunan"
  | "Operasional"
  | "Beasiswa"
  | "Bencana Alam";

export interface Distribution {
  id: string;
  amount: number;
  source: SedekahSource;
  tujuan: DistributionTujuan;
  notes: string;
  dokumentasi: string;
  createdAt: number;
}

export const SEDEKAH_PERSENTASE = {
  zakatMal: 0.025,
  zakatFitrah: 0.25,
  infakTerikat: 0.25,
  sedekahSubuh: 0.475,
} as const;

export function hitungAlokasiSedekah(total: number): SedekahBalance {
  const zm = Math.round(total * SEDEKAH_PERSENTASE.zakatMal);
  const zf = Math.round(total * SEDEKAH_PERSENTASE.zakatFitrah);
  const it = Math.round(total * SEDEKAH_PERSENTASE.infakTerikat);
  const ss = total - zm - zf - it;
  return { zakatMal: zm, zakatFitrah: zf, infakTerikat: it, sedekahSubuh: ss };
}

/* ══════════════════════════════════════════════════════════════
   TIPE DATA — BUKU CATATAN LAINNYA
   ══════════════════════════════════════════════════════════════ */

export interface LedgerDebt {
  id: string;
  tipe: "hutang_kita" | "piutang_orang";
  contactName: string;
  whatsapp: string;
  nominal: number;
  status: "Belum Lunas" | "Lunas";
  jatuhTempo: string;
  catatan?: string;
}

export interface DigitalMemo {
  id: string;
  judul: string;
  isi: string;
  tags: string[];
  pinned: boolean;
  updatedAt: number;
}

/* ══════════════════════════════════════════════════════════════
   BUSINESS UNIT IDENTIFIER
   ══════════════════════════════════════════════════════════════ */

export type BizUnit = "percetakan" | "gadget" | "laptop" | "kedai_kopi" | "konveksi";

export const BIZ_UNIT_LABELS: Record<BizUnit, string> = {
  percetakan: "Percetakan",
  gadget: "Gadget",
  laptop: "Laptop/PC",
  kedai_kopi: "Kedai Kopi",
  konveksi: "Konveksi",
};

/* ══════════════════════════════════════════════════════════════
   STORE INTERFACE
   ══════════════════════════════════════════════════════════════ */

interface BusinessStore {
  /* Hydration guard */
  _mounted: boolean;
  setMounted: () => void;

  /* Buku Pribadi */
  personalTransactions: PersonalTransaction[];
  savingsGoals: SavingsGoal[];
  setPersonalTransactions: (t: PersonalTransaction[]) => void;
  addPersonalTransaction: (t: PersonalTransaction) => void;
  removePersonalTransaction: (id: string) => void;
  setSavingsGoals: (g: SavingsGoal[]) => void;
  addSavingsGoal: (g: SavingsGoal) => void;
  alokasikanTabungan: (goalId: string, nominal: number) => void;

  /* Buku Usaha — Percetakan */
  printingJobs: PrintingJob[];
  setPrintingJobs: (j: PrintingJob[]) => void;
  addPrintingJob: (j: PrintingJob) => void;
  removePrintingJob: (id: string) => void;

  /* Buku Usaha — Gadget */
  gadgetItems: GadgetItem[];
  setGadgetItems: (i: GadgetItem[]) => void;
  addGadgetItem: (i: GadgetItem) => void;
  removeGadgetItem: (id: string) => void;

  /* Buku Usaha — Laptop */
  laptopBuilds: LaptopBuild[];
  setLaptopBuilds: (b: LaptopBuild[]) => void;
  addLaptopBuild: (b: LaptopBuild) => void;
  removeLaptopBuild: (id: string) => void;

  /* Buku Usaha — Kedai Kopi */
  coffeeIngredients: CoffeeIngredient[];
  setCoffeeIngredients: (c: CoffeeIngredient[]) => void;
  addCoffeeIngredient: (c: CoffeeIngredient) => void;
  reduceStock: (id: string, gram: number) => boolean;
  removeCoffeeIngredient: (id: string) => void;

  /* Buku Usaha — Konveksi */
  fashionSKUs: FashionSKU[];
  setFashionSKUs: (s: FashionSKU[]) => void;
  addFashionSKU: (s: FashionSKU) => void;
  removeFashionSKU: (id: string) => void;

  /* Buku Sedekah */
  sedekahBalance: SedekahBalance;
  distributions: Distribution[];
  setSedekahBalance: (b: SedekahBalance) => void;
  topUpSedekah: (total: number) => void;
  distribusiDana: (d: Distribution) => { ok: boolean; error?: string };
  setDistributions: (d: Distribution[]) => void;

  /* Buku Catatan Lainnya */
  ledgerDebts: LedgerDebt[];
  digitalMemos: DigitalMemo[];
  setLedgerDebts: (d: LedgerDebt[]) => void;
  addLedgerDebt: (d: LedgerDebt) => void;
  updateLedgerDebt: (id: string, d: Partial<LedgerDebt>) => void;
  removeLedgerDebt: (id: string) => void;
  setDigitalMemos: (m: DigitalMemo[]) => void;
  addDigitalMemo: (m: DigitalMemo) => void;
  updateDigitalMemo: (id: string, m: Partial<DigitalMemo>) => void;
  removeDigitalMemo: (id: string) => void;
}

/* ══════════════════════════════════════════════════════════════
   PERSISTENCE CONFIG
   ══════════════════════════════════════════════════════════════ */

const ssrSafeStorage = createJSONStorage(() => {
  if (typeof window === "undefined") {
    return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  }
  return localStorage;
});

/* ══════════════════════════════════════════════════════════════
   STORE
   ══════════════════════════════════════════════════════════════ */

const INITIAL_SEDEKAH: SedekahBalance = {
  zakatMal: 0,
  zakatFitrah: 0,
  infakTerikat: 0,
  sedekahSubuh: 0,
};

export const useBusinessStore = create<BusinessStore>()(
  persist(
    (set, get) => ({
      /* ─── Hydration ─── */
      _mounted: false,
      setMounted: () => set({ _mounted: true }),

      /* ─── Buku Pribadi ─── */
      personalTransactions: [],
      savingsGoals: [],
      setPersonalTransactions: (t) => set({ personalTransactions: t }),
      addPersonalTransaction: (t) =>
        set((s) => ({ personalTransactions: [t, ...s.personalTransactions] })),
      removePersonalTransaction: (id) =>
        set((s) => ({
          personalTransactions: s.personalTransactions.filter((t) => t.id !== id),
        })),
      setSavingsGoals: (g) => set({ savingsGoals: g }),
      addSavingsGoal: (g) =>
        set((s) => ({ savingsGoals: [g, ...s.savingsGoals] })),
      alokasikanTabungan: (goalId, nominal) =>
        set((s) => ({
          savingsGoals: s.savingsGoals.map((g) =>
            g.id === goalId
              ? { ...g, terkumpul: Math.min(g.targetNominal, g.terkumpul + nominal) }
              : g
          ),
        })),

      /* ─── Buku Usaha: Percetakan ─── */
      printingJobs: [],
      setPrintingJobs: (j) => set({ printingJobs: j }),
      addPrintingJob: (j) =>
        set((s) => ({ printingJobs: [j, ...s.printingJobs] })),
      removePrintingJob: (id) =>
        set((s) => ({
          printingJobs: s.printingJobs.filter((j) => j.id !== id),
        })),

      /* ─── Buku Usaha: Gadget ─── */
      gadgetItems: [],
      setGadgetItems: (i) => set({ gadgetItems: i }),
      addGadgetItem: (i) =>
        set((s) => ({ gadgetItems: [i, ...s.gadgetItems] })),
      removeGadgetItem: (id) =>
        set((s) => ({
          gadgetItems: s.gadgetItems.filter((i) => i.id !== id),
        })),

      /* ─── Buku Usaha: Laptop ─── */
      laptopBuilds: [],
      setLaptopBuilds: (b) => set({ laptopBuilds: b }),
      addLaptopBuild: (b) =>
        set((s) => ({ laptopBuilds: [b, ...s.laptopBuilds] })),
      removeLaptopBuild: (id) =>
        set((s) => ({
          laptopBuilds: s.laptopBuilds.filter((b) => b.id !== id),
        })),

      /* ─── Buku Usaha: Kedai Kopi ─── */
      coffeeIngredients: [],
      setCoffeeIngredients: (c) => set({ coffeeIngredients: c }),
      addCoffeeIngredient: (c) =>
        set((s) => ({ coffeeIngredients: [c, ...s.coffeeIngredients] })),
      reduceStock: (id, gram) => {
        const item = get().coffeeIngredients.find((c) => c.id === id);
        if (!item || item.stockGram < gram) return false;
        set((s) => ({
          coffeeIngredients: s.coffeeIngredients.map((c) =>
            c.id === id
              ? { ...c, stockGram: Math.max(0, c.stockGram - gram) }
              : c
          ),
        }));
        return true;
      },
      removeCoffeeIngredient: (id) =>
        set((s) => ({
          coffeeIngredients: s.coffeeIngredients.filter((c) => c.id !== id),
        })),

      /* ─── Buku Usaha: Konveksi ─── */
      fashionSKUs: [],
      setFashionSKUs: (s) => set({ fashionSKUs: s }),
      addFashionSKU: (s) =>
        set((state) => ({ fashionSKUs: [s, ...state.fashionSKUs] })),
      removeFashionSKU: (id) =>
        set((s) => ({
          fashionSKUs: s.fashionSKUs.filter((sk) => sk.id !== id),
        })),

      /* ─── Buku Sedekah ─── */
      sedekahBalance: { ...INITIAL_SEDEKAH },
      distributions: [],
      setSedekahBalance: (b) => set({ sedekahBalance: b }),
      topUpSedekah: (total) =>
        set({ sedekahBalance: hitungAlokasiSedekah(total) }),
      distribusiDana: (d) => {
        const bal = get().sedekahBalance;
        if (bal[d.source] < d.amount) {
          return {
            ok: false,
            error: `Saldo ${d.source} tidak mencukupi (tersedia: ${bal[d.source]}, diperlukan: ${d.amount})`,
          };
        }
        set((s) => ({
          sedekahBalance: {
            ...s.sedekahBalance,
            [d.source]: s.sedekahBalance[d.source] - d.amount,
          },
          distributions: [d, ...s.distributions],
        }));
        return { ok: true };
      },
      setDistributions: (d) => set({ distributions: d }),

      /* ─── Buku Catatan Lainnya ─── */
      ledgerDebts: [],
      digitalMemos: [],
      setLedgerDebts: (d) => set({ ledgerDebts: d }),
      addLedgerDebt: (d) =>
        set((s) => ({ ledgerDebts: [d, ...s.ledgerDebts] })),
      updateLedgerDebt: (id, upd) =>
        set((s) => ({
          ledgerDebts: s.ledgerDebts.map((d) =>
            d.id === id ? { ...d, ...upd } : d
          ),
        })),
      removeLedgerDebt: (id) =>
        set((s) => ({
          ledgerDebts: s.ledgerDebts.filter((d) => d.id !== id),
        })),
      setDigitalMemos: (m) => set({ digitalMemos: m }),
      addDigitalMemo: (m) =>
        set((s) => ({ digitalMemos: [m, ...s.digitalMemos] })),
      updateDigitalMemo: (id, upd) =>
        set((s) => ({
          digitalMemos: s.digitalMemos.map((m) =>
            m.id === id ? { ...m, ...upd, updatedAt: Date.now() } : m
          ),
        })),
      removeDigitalMemo: (id) =>
        set((s) => ({
          digitalMemos: s.digitalMemos.filter((m) => m.id !== id),
        })),
    }),
    {
      name: "mmcbank-business-store-v3",
      storage: ssrSafeStorage,
      partialize: (state) => {
        const { _mounted, setMounted, ...rest } = state;
        void _mounted;
        void setMounted;
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
