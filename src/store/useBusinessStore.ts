"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type {
  Wallet, WalletMutasi, PersonalTransaction, SavingsGoal,
  GadgetItem, LaptopBuild, FashionSKU, CoffeeIngredient,
  PrintingJob, CustomerRecord, CustomerTransaction,
  InventoryItem, InventoryMutation, Piutang, PembayaranCicilan,
  LedgerDebt, QuickOrder, TransaksiLabel, TransaksiTag,
  SedekahBalance,
} from "./business-types";

/* Re-export semua legacy types untuk backward compatibility */
export * from "./business-types";

/* Helper untuk empty array typing di persist middleware */
function empty<T>(): T[] { return []; }

/* ══════════════════════════════════════════════════════════════
   LOCALSTORAGE — HANYA KONFIGURASI RINGAN
   Data operasional berat (wallets, transaksi, inventory, piutang,
   pelanggan) disimpan di IndexedDB via Dexie (mmcbank-db.ts)
   ══════════════════════════════════════════════════════════════ */

/* ─── Profil Usaha ─── */
export interface BusinessProfile {
  logoUrl: string;
  namaUsaha: string;
  alamat: string;
  noWhatsapp: string;
  slogan: string;
  subLayanan: string[];
}

/* ─── Metode Pembayaran ─── */
export interface PaymentMethod {
  id: string;
  namaMetode: string;
  bankName: string;
  accountNo: string;
  accountName: string;
  qrisImageUrl: string;
  isEnabled: boolean;
}

/* ─── Tema ─── */
export type AccentColor = "indigo" | "amber" | "emerald" | "sapphire" | "rose";

/* ─── Store ─── */
interface BusinessStore {
  profile: BusinessProfile;
  paymentMethods: PaymentMethod[];
  accentColor: AccentColor;
  lastKasirUnit: string | null;

  /* Buku Pribadi — tetap di localStorage karena personal */
  personalTransactions: PersonalTransaction[];
  savingsGoals: SavingsGoal[];
  setPersonalTransactions: (t: PersonalTransaction[]) => void;
  addPersonalTransaction: (t: PersonalTransaction) => void;
  removePersonalTransaction: (id: string) => void;
  setSavingsGoals: (g: SavingsGoal[]) => void;
  addSavingsGoal: (g: SavingsGoal) => void;
  alokasikanTabungan: (goalId: string, nominal: number) => void;

  setProfileLogo: (logoUrl: string) => void;
  setProfileNama: (nama: string) => void;
  setProfileAlamat: (alamat: string) => void;
  setProfileWhatsapp: (no: string) => void;
  setProfileSlogan: (slogan: string) => void;
  updateProfile: (data: Partial<BusinessProfile>) => void;
  resetProfile: () => void;
  tambahSubLayanan: (item: string) => void;
  hapusSubLayanan: (index: number) => void;

  addPaymentMethod: (p: PaymentMethod) => void;
  updatePaymentMethod: (id: string, data: Partial<PaymentMethod>) => void;
  removePaymentMethod: (id: string) => void;
  togglePaymentMethod: (id: string) => void;

  /* Dompet — lightweight state (sync ke IndexedDB via engine nanti) */
  wallets: Wallet[];
  mutasiLog: WalletMutasi[];
  addWallet: (w: Wallet) => void;
  updateWallet: (id: string, data: Partial<Wallet>) => void;
  removeWallet: (id: string) => void;
  tambahSaldoWallet: (id: string, nominal: number) => void;
  kurangiSaldoWallet: (id: string, nominal: number) => boolean;
  transferSaldo: (dariId: string, keId: string, nominal: number, alasan: string) => { ok: boolean; error?: string };

  /* Label kustom — lightweight config */
  transaksiLabels: TransaksiLabel[];
  transaksiTags: TransaksiTag[];
  addTransaksiLabel: (data: Omit<TransaksiLabel, "id" | "createdAt">) => string;
  deleteTransaksiLabel: (id: string) => void;
  tagTransaksi: (transaksiRef: string, labelId: string) => void;
  untagTransaksi: (transaksiRef: string, labelId: string) => void;
  getLabelsForTransaksi: (transaksiRef: string) => TransaksiLabel[];

  /* Data operasional — sementara di store, nanti migrasi ke IndexedDB */
  gadgetItems: GadgetItem[];
  laptopBuilds: LaptopBuild[];
  fashionSKUs: FashionSKU[];
  coffeeIngredients: CoffeeIngredient[];
  printingJobs: PrintingJob[];
  customers: CustomerRecord[];
  customerTransactions: CustomerTransaction[];
  inventory: InventoryItem[];
  inventoryMutations: InventoryMutation[];
  piutangList: Piutang[];
  pembayaranCicilan: PembayaranCicilan[];
  ledgerDebts: LedgerDebt[];
  quickOrders: QuickOrder[];
  sedekahBalance: SedekahBalance;
  setSedekahBalance: (b: SedekahBalance) => void;
  setGadgetItems: (items: GadgetItem[]) => void;
  setLaptopBuilds: (items: LaptopBuild[]) => void;
  setFashionSKUs: (items: FashionSKU[]) => void;
  setCoffeeIngredients: (items: CoffeeIngredient[]) => void;
  setPrintingJobs: (items: PrintingJob[]) => void;
  addCustomerRecord: (c: Omit<CustomerRecord, "id" | "totalTransaksi" | "totalBelanja" | "poin" | "terakhirTransaksi" | "createdAt"> & Partial<Pick<CustomerRecord, "id" | "totalTransaksi" | "totalBelanja" | "poin" | "terakhirTransaksi" | "createdAt">>) => string;
  recordCustomerTransaction: (customerId: string, t: Omit<CustomerTransaction, "id">) => void;
  getCustomerByWA: (wa: string) => CustomerRecord | undefined;
  getCicilanByPiutang: (piutangId: string) => PembayaranCicilan[];
  addPiutang: (p: Omit<Piutang, "id" | "createdAt"> & Partial<Pick<Piutang, "id" | "createdAt">>) => string;
  bayarCicilan: (piutangId: string, jumlah: number, metode: string, catatan?: string) => void;
  addQuickOrder: (q: Omit<QuickOrder, "id" | "createdAt"> & Partial<Pick<QuickOrder, "id" | "createdAt">>) => string;
  deleteQuickOrder: (id: string) => void;
  addInventoryItem: (item: Omit<InventoryItem, "id" | "createdAt" | "updatedAt"> & Partial<Pick<InventoryItem, "id" | "createdAt" | "updatedAt">>) => void;
  deleteInventoryItem: (id: string) => void;
  updateInventoryItem: (id: string, data: Partial<InventoryItem>) => void;
  adjustStok: (id: string, tipe: "masuk" | "keluar", qty: number, alasan: string) => void;
  updateTransaksiLabel: (id: string, data: Partial<TransaksiLabel>) => void;

  setAccentColor: (color: AccentColor) => void;
  setLastKasirUnit: (unit: string) => void;
}

const DEFAULT_PROFILE: BusinessProfile = {
  logoUrl: "", namaUsaha: "", alamat: "", noWhatsapp: "",
  slogan: "", subLayanan: [],
};

export const useBusinessStore = create<BusinessStore>()(
  persist(
    (set) => ({
      profile: DEFAULT_PROFILE,
      paymentMethods: empty<PaymentMethod>(),
      accentColor: "indigo",
      lastKasirUnit: null,

      personalTransactions: empty<PersonalTransaction>(),
      savingsGoals: empty<SavingsGoal>(),
      setPersonalTransactions: (t) => set({ personalTransactions: t }),
      addPersonalTransaction: (t) =>
        set((s) => ({ personalTransactions: [...s.personalTransactions, t] })),
      removePersonalTransaction: (id) =>
        set((s) => ({
          personalTransactions: s.personalTransactions.filter((tx) => tx.id !== id),
        })),
      setSavingsGoals: (g) => set({ savingsGoals: g }),
      addSavingsGoal: (g) =>
        set((s) => ({ savingsGoals: [...s.savingsGoals, g] })),
      alokasikanTabungan: (goalId, nominal) =>
        set((s) => ({
          savingsGoals: s.savingsGoals.map((g) =>
            g.id === goalId
              ? { ...g, terkumpul: g.terkumpul + nominal }
              : g
          ),
        })),

      setProfileLogo: (logoUrl) =>
        set((s) => ({ profile: { ...s.profile, logoUrl } })),
      setProfileNama: (namaUsaha) =>
        set((s) => ({ profile: { ...s.profile, namaUsaha } })),
      setProfileAlamat: (alamat) =>
        set((s) => ({ profile: { ...s.profile, alamat } })),
      setProfileWhatsapp: (noWhatsapp) =>
        set((s) => ({ profile: { ...s.profile, noWhatsapp } })),
      setProfileSlogan: (slogan) =>
        set((s) => ({ profile: { ...s.profile, slogan } })),
      updateProfile: (data) =>
        set((s) => ({ profile: { ...s.profile, ...data } })),
      resetProfile: () => set({ profile: DEFAULT_PROFILE }),
      tambahSubLayanan: (item) =>
        set((s) => ({ profile: { ...s.profile, subLayanan: [...s.profile.subLayanan, item] } })),
      hapusSubLayanan: (index) =>
        set((s) => ({
          profile: { ...s.profile, subLayanan: s.profile.subLayanan.filter((_, i) => i !== index) },
        })),

      addPaymentMethod: (p) =>
        set((s) => ({ paymentMethods: [...s.paymentMethods, p] })),
      updatePaymentMethod: (id, data) =>
        set((s) => ({
          paymentMethods: s.paymentMethods.map((pm) =>
            pm.id === id ? { ...pm, ...data } : pm
          ),
        })),
      removePaymentMethod: (id) =>
        set((s) => ({ paymentMethods: s.paymentMethods.filter((pm) => pm.id !== id) })),
      togglePaymentMethod: (id) =>
        set((s) => ({
          paymentMethods: s.paymentMethods.map((pm) =>
            pm.id === id ? { ...pm, isEnabled: !pm.isEnabled } : pm
          ),
        })),

      wallets: empty<Wallet>(),
      mutasiLog: empty<WalletMutasi>(),
      addWallet: (w) => set((s) => ({ wallets: [...s.wallets, w] })),
      updateWallet: (id, data) =>
        set((s) => ({
          wallets: s.wallets.map((w) => (w.id === id ? { ...w, ...data } : w)),
        })),
      removeWallet: (id) =>
        set((s) => ({ wallets: s.wallets.filter((w) => w.id !== id) })),
      tambahSaldoWallet: (id, nominal) =>
        set((s) => ({
          wallets: s.wallets.map((w) =>
            w.id === id ? { ...w, saldo: w.saldo + nominal } : w
          ),
        })),
      kurangiSaldoWallet: (id, nominal) => {
        let ok = true;
        set((s) => {
          const w = s.wallets.find((w) => w.id === id);
          if (!w || w.saldo < nominal) { ok = false; return s; }
          return {
            wallets: s.wallets.map((w) =>
              w.id === id ? { ...w, saldo: w.saldo - nominal } : w
            ),
          };
        });
        return ok;
      },
      transferSaldo: (dariId, keId, nominal, alasan) => {
        const state = useBusinessStore.getState();
        const dari = state.wallets.find((w) => w.id === dariId);
        const ke = state.wallets.find((w) => w.id === keId);
        if (!dari) return { ok: false, error: "Dompet asal tidak ditemukan" };
        if (!ke) return { ok: false, error: "Dompet tujuan tidak ditemukan" };
        if (dari.saldo < nominal) return { ok: false, error: "Saldo dompet asal tidak mencukupi" };
        set((s) => ({
          wallets: s.wallets.map((w) =>
            w.id === dariId ? { ...w, saldo: w.saldo - nominal } :
            w.id === keId ? { ...w, saldo: w.saldo + nominal } : w
          ),
          mutasiLog: [
            ...s.mutasiLog,
            {
              id: crypto.randomUUID(),
              dariWalletId: dariId,
              keWalletId: keId,
              nominal,
              alasan,
              createdAt: Date.now(),
            },
          ],
        }));
        return { ok: true };
      },

      transaksiLabels: empty<TransaksiLabel>(),
      transaksiTags: empty<TransaksiTag>(),
      addTransaksiLabel: (data) => {
        const id = crypto.randomUUID();
        const createdAt = new Date().toISOString();
        set((s) => ({
          transaksiLabels: [...s.transaksiLabels, { id, ...data, createdAt }],
        }));
        return id;
      },
      deleteTransaksiLabel: (id) =>
        set((s) => ({
          transaksiLabels: s.transaksiLabels.filter((l) => l.id !== id),
          transaksiTags: s.transaksiTags.filter((t) => t.labelId !== id),
        })),
      tagTransaksi: (transaksiRef, labelId) =>
        set((s) => {
          if (s.transaksiTags.some((t) => t.transaksiRef === transaksiRef && t.labelId === labelId)) return s;
          return { transaksiTags: [...s.transaksiTags, { id: crypto.randomUUID(), transaksiRef, labelId }] };
        }),
      untagTransaksi: (transaksiRef, labelId) =>
        set((s) => ({
          transaksiTags: s.transaksiTags.filter((t) => !(t.transaksiRef === transaksiRef && t.labelId === labelId)),
        })),
      getLabelsForTransaksi: (transaksiRef) => {
        const s = useBusinessStore.getState();
        const tagIds = s.transaksiTags.filter((t) => t.transaksiRef === transaksiRef).map((t) => t.labelId);
        return s.transaksiLabels.filter((l) => tagIds.includes(l.id));
      },

      /* Data operasional */
      gadgetItems: empty<GadgetItem>(),
      laptopBuilds: empty<LaptopBuild>(),
      fashionSKUs: empty<FashionSKU>(),
      coffeeIngredients: empty<CoffeeIngredient>(),
      printingJobs: empty<PrintingJob>(),
      customers: empty<CustomerRecord>(),
      customerTransactions: empty<CustomerTransaction>(),
      inventory: empty<InventoryItem>(),
      inventoryMutations: empty<InventoryMutation>(),
      piutangList: empty<Piutang>(),
      ledgerDebts: empty<LedgerDebt>(),
      pembayaranCicilan: empty<PembayaranCicilan>(),
      quickOrders: empty<QuickOrder>(),
      sedekahBalance: { zakatMal: 0, zakatFitrah: 0, infakTerikat: 0, sedekahSubuh: 0 },
      setSedekahBalance: (b) => set({ sedekahBalance: b }),
      setGadgetItems: (items) => set({ gadgetItems: items }),
      setLaptopBuilds: (items) => set({ laptopBuilds: items }),
      setFashionSKUs: (items) => set({ fashionSKUs: items }),
      setCoffeeIngredients: (items) => set({ coffeeIngredients: items }),
      setPrintingJobs: (items) => set({ printingJobs: items }),
      addCustomerRecord: (c) => {
        const id = c.id ?? crypto.randomUUID();
        const now = new Date().toISOString();
        set((s) => ({
          customers: [...s.customers, {
            id, nama: c.nama, noWA: c.noWA,
            totalTransaksi: c.totalTransaksi ?? 0,
            totalBelanja: c.totalBelanja ?? 0,
            poin: c.poin ?? 0,
            terakhirTransaksi: c.terakhirTransaksi ?? "",
            createdAt: c.createdAt ?? now,
          }],
        }));
        return id;
      },
      recordCustomerTransaction: (customerId, t) =>
        set((s) => ({
          customerTransactions: [...s.customerTransactions, {
            id: crypto.randomUUID(),
            ...t,
            customerId,
          }],
        })),
      getCustomerByWA: (wa) => useBusinessStore.getState().customers.find((c) => c.noWA === wa),
      getCicilanByPiutang: (piutangId) =>
        useBusinessStore.getState().pembayaranCicilan.filter((c) => c.piutangId === piutangId),
      addPiutang: (p) => {
        const id = p.id ?? crypto.randomUUID();
        const createdAt = p.createdAt ?? new Date().toISOString();
        set((s) => ({ piutangList: [...s.piutangList, { ...p, id, createdAt } as Piutang] }));
        return id;
      },
      bayarCicilan: (piutangId, jumlah, metode, catatan) =>
        set((s) => {
          const cicilan: PembayaranCicilan = {
            id: crypto.randomUUID(), piutangId, jumlah, metode,
            tanggal: new Date().toISOString(),
            ...(catatan ? { catatan } : {}),
          };
          return {
            pembayaranCicilan: [...(s.pembayaranCicilan ?? []), cicilan],
            piutangList: s.piutangList.map((p) =>
              p.id === piutangId ? {
                ...p,
                sisaPiutang: p.sisaPiutang - jumlah,
                status: (p.sisaPiutang - jumlah <= 0 ? "lunas" : p.status),
              } : p
            ),
          };
        }),
      addQuickOrder: (q) => {
        const id = q.id ?? crypto.randomUUID();
        const createdAt = q.createdAt ?? new Date().toISOString();
        set((s) => ({ quickOrders: [...s.quickOrders, { ...q, id, createdAt } as QuickOrder] }));
        return id;
      },
      deleteQuickOrder: (id) =>
        set((s) => ({ quickOrders: s.quickOrders.filter((q) => q.id !== id) })),
      addInventoryItem: (item) => {
        const id = item.id ?? crypto.randomUUID();
        const createdAt = item.createdAt ?? new Date().toISOString();
        const updatedAt = item.updatedAt ?? new Date().toISOString();
        set((s) => ({
          inventory: [...s.inventory, { ...item, id, createdAt, updatedAt } as InventoryItem],
        }));
      },
      deleteInventoryItem: (id) =>
        set((s) => ({ inventory: s.inventory.filter((i) => i.id !== id) })),
      updateInventoryItem: (id, data) =>
        set((s) => ({
          inventory: s.inventory.map((i) => (i.id === id ? { ...i, ...data } : i)),
        })),
      adjustStok: (id, tipe, qty, alasan) =>
        set((s) => {
          const item = s.inventory.find((i) => i.id === id);
          if (!item) return s;
          const adjustedQty = tipe === "masuk" ? qty : -qty;
          const stokSesudah = item.stok + adjustedQty;
          return {
            inventory: s.inventory.map((i) => (i.id === id ? { ...i, stok: stokSesudah } : i)),
            inventoryMutations: [
              ...s.inventoryMutations,
              {
                id: crypto.randomUUID(),
                itemId: id,
                tipe: tipe as InventoryMutation["tipe"],
                qty: adjustedQty,
                stokSebelum: item.stok,
                stokSesudah,
                alasan,
                createdAt: new Date().toISOString(),
              },
            ],
          };
        }),
      updateTransaksiLabel: (id, data) =>
        set((s) => ({
          transaksiLabels: s.transaksiLabels.map((l) => (l.id === id ? { ...l, ...data } : l)),
        })),

      setAccentColor: (accentColor) => set({ accentColor }),
      setLastKasirUnit: (lastKasirUnit) => set({ lastKasirUnit }),
    }) as BusinessStore,
    {
      name: "mmcbank-business-config",
      partialize: (state) => ({
        profile: state.profile,
        paymentMethods: state.paymentMethods,
        accentColor: state.accentColor,
        lastKasirUnit: state.lastKasirUnit,
        personalTransactions: state.personalTransactions,
        savingsGoals: state.savingsGoals,
        transaksiLabels: state.transaksiLabels,
        transaksiTags: state.transaksiTags,
        wallets: state.wallets,
        mutasiLog: state.mutasiLog,
        gadgetItems: state.gadgetItems,
        laptopBuilds: state.laptopBuilds,
        fashionSKUs: state.fashionSKUs,
        coffeeIngredients: state.coffeeIngredients,
        printingJobs: state.printingJobs,
        customers: state.customers,
        customerTransactions: state.customerTransactions,
        inventory: state.inventory,
        inventoryMutations: state.inventoryMutations,
        piutangList: state.piutangList,
        pembayaranCicilan: state.pembayaranCicilan,
        ledgerDebts: state.ledgerDebts,
        quickOrders: state.quickOrders,
        sedekahBalance: state.sedekahBalance,
      }),
    }
  )
);
