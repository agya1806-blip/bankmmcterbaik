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
   TIPE DATA — BUKU USAHA: PROFIL USAHA
   ══════════════════════════════════════════════════════════════ */

export interface BusinessProfile {
  logoUrl: string;
  namaUsaha: string;
  alamat: string;
  noWhatsapp: string;
  slogan: string;
  subLayanan: string[];
}

/* ══════════════════════════════════════════════════════════════
   TIPE DATA — BUKU USAHA: DOMPET / KAS OPERASIONAL
   ══════════════════════════════════════════════════════════════ */

export type WalletTipe = "KasTunai" | "Bank" | "EWallet";

export interface Wallet {
  id: string;
  namaDompet: string;
  saldo: number;
  tipe: WalletTipe;
  catatan: string;
}

export interface WalletMutasi {
  id: string;
  dariWalletId: string;
  keWalletId: string;
  nominal: number;
  alasan: string;
  createdAt: number;
}

/* ══════════════════════════════════════════════════════════════
   TIPE DATA — BUKU USAHA: METODE PEMBAYARAN
   ══════════════════════════════════════════════════════════════ */

export interface PaymentMethod {
  id: string;
  namaMetode: string;
  bankName: string;
  accountNo: string;
  accountName: string;
  qrisImageUrl: string;
  isEnabled: boolean;
}

/* ══════════════════════════════════════════════════════════════
   TIPE DATA — BUKU USAHA: TEMA VISUAL
   ══════════════════════════════════════════════════════════════ */

export type AccentColor = "indigo" | "amber" | "emerald" | "sapphire" | "rose";

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
    BUKU USAHA — PIUTANG & CICILAN
    ══════════════════════════════════════════════════════════════ */

export interface Piutang {
  id: string;
  unit: BizUnit;
  customerNama: string;
  customerWA: string;
  invoiceId: string;
  totalPiutang: number;
  sisaPiutang: number;
  jatuhTempo: string;
  status: "aktif" | "lunas" | "dihapus";
  catatan?: string;
  createdAt: string;
}

export interface PembayaranCicilan {
  id: string;
  piutangId: string;
  jumlah: number;
  metode: string;
  tanggal: string;
  catatan?: string;
}

/* ══════════════════════════════════════════════════════════════
   KATEGORI & LABEL KUSTOM
   ══════════════════════════════════════════════════════════════ */

export interface TransaksiLabel {
  id: string;
  label: string;
  warna: string;
  createdAt: string;
}

export interface TransaksiTag {
  id: string;
  transaksiRef: string;
  labelId: string;
}

/* ══════════════════════════════════════════════════════════════
   BUKU USAHA — INVENTORY / MANAJEMEN STOK
   ══════════════════════════════════════════════════════════════ */

export interface InventoryItem {
  id: string;
  unit: BizUnit;
  sku: string;
  nama: string;
  kategori: string;
  stok: number;
  stokMin: number;
  hargaModal: number;
  hargaJual: number;
  satuan: string;
  catatan?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryMutation {
  id: string;
  itemId: string;
  tipe: "masuk" | "keluar" | "penyesuaian";
  qty: number;
  stokSebelum: number;
  stokSesudah: number;
  alasan: string;
  referensi?: string;
  createdAt: string;
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
   QUICK ORDER TEMPLATES
   ══════════════════════════════════════════════════════════════ */

export interface QuickOrder {
  id: string;
  unit: BizUnit;
  label: string;
  items: { desc: string; price: number }[];
  createdAt: string;
}

/* ══════════════════════════════════════════════════════════════
   TIPE DATA — PELANGGAN & RIWAYAT
   ══════════════════════════════════════════════════════════════ */

export interface CustomerRecord {
  id: string;
  nama: string;
  noWA: string;
  totalTransaksi: number;
  totalBelanja: number;
  poin: number;
  terakhirTransaksi: string;
  createdAt: string;
}

export interface CustomerTransaction {
  id: string;
  customerId: string;
  unit: BizUnit;
  invoiceId: string;
  total: number;
  tanggal: string;
  items: string;
}

/* ══════════════════════════════════════════════════════════════
   AKCENTHEME MAP
   ══════════════════════════════════════════════════════════════ */

export const ACCENT_THEMES: Record<AccentColor, { from: string; via: string; to: string; label: string }> = {
  indigo: { from: "from-indigo-500", via: "via-purple-500", to: "to-indigo-600", label: "Ungu-Cyan (Default)" },
  amber: { from: "from-amber-500", via: "via-yellow-500", to: "to-orange-600", label: "Amber Gold" },
  emerald: { from: "from-emerald-500", via: "via-teal-500", to: "to-emerald-600", label: "Emerald Mint" },
  sapphire: { from: "from-blue-500", via: "via-cyan-500", to: "to-blue-600", label: "Sapphire Blue" },
  rose: { from: "from-rose-500", via: "via-pink-500", to: "to-rose-600", label: "Rose Pink" },
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

  /* Buku Usaha — Profil */
  profile: BusinessProfile;
  setProfileLogo: (logoUrl: string) => void;
  setProfileNama: (nama: string) => void;
  setProfileAlamat: (alamat: string) => void;
  setProfileWhatsapp: (no: string) => void;
  setProfileSlogan: (slogan: string) => void;
  updateProfile: (data: Partial<BusinessProfile>) => void;
  resetProfile: () => void;
  tambahSubLayanan: (item: string) => void;
  hapusSubLayanan: (index: number) => void;

  /* Buku Usaha — Wallets */
  wallets: Wallet[];
  mutasiLog: WalletMutasi[];
  addWallet: (w: Wallet) => void;
  updateWallet: (id: string, data: Partial<Wallet>) => void;
  removeWallet: (id: string) => void;
  tambahSaldoWallet: (id: string, nominal: number) => void;
  kurangiSaldoWallet: (id: string, nominal: number) => boolean;
  transferSaldo: (dariId: string, keId: string, nominal: number, alasan: string) => { ok: boolean; error?: string };

  /* Buku Usaha — Payment Methods */
  paymentMethods: PaymentMethod[];
  addPaymentMethod: (p: PaymentMethod) => void;
  updatePaymentMethod: (id: string, data: Partial<PaymentMethod>) => void;
  removePaymentMethod: (id: string) => void;
  togglePaymentMethod: (id: string) => void;

  /* Buku Usaha — Tema */
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;

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

  /* Buku Usaha — Piutang & Cicilan */
  piutangList: Piutang[];
  cicilanList: PembayaranCicilan[];
  addPiutang: (data: Omit<Piutang, "id" | "createdAt">) => string;
  bayarCicilan: (piutangId: string, jumlah: number, metode: string, catatan?: string) => void;
  getPiutangAktif: () => Piutang[];
  getPiutangByUnit: (unit: BizUnit) => Piutang[];
  getCicilanByPiutang: (piutangId: string) => PembayaranCicilan[];

  /* Buku Usaha — Inventory */
  inventory: InventoryItem[];
  inventoryMutations: InventoryMutation[];
  addInventoryItem: (item: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">) => void;
  updateInventoryItem: (id: string, data: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  adjustStok: (itemId: string, tipe: "masuk" | "keluar", qty: number, alasan: string, referensi?: string) => void;

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

  /* Kategori & Label Kustom */
  transaksiLabels: TransaksiLabel[];
  transaksiTags: TransaksiTag[];
  addTransaksiLabel: (data: Omit<TransaksiLabel, "id" | "createdAt">) => string;
  deleteTransaksiLabel: (id: string) => void;
  updateTransaksiLabel: (id: string, data: Partial<Pick<TransaksiLabel, "label" | "warna">>) => void;
  tagTransaksi: (transaksiRef: string, labelId: string) => void;
  untagTransaksi: (transaksiRef: string, labelId: string) => void;
  getLabelsForTransaksi: (transaksiRef: string) => TransaksiLabel[];

  /* Quick Order Templates */
  quickOrders: QuickOrder[];
  addQuickOrder: (data: Omit<QuickOrder, "id" | "createdAt">) => void;
  deleteQuickOrder: (id: string) => void;
  getQuickOrdersByUnit: (unit: BizUnit) => QuickOrder[];

  /* Pelanggan & Riwayat */
  customers: CustomerRecord[];
  customerTransactions: CustomerTransaction[];
  addCustomerRecord: (data: Omit<CustomerRecord, "id" | "createdAt" | "totalTransaksi" | "totalBelanja" | "poin" | "terakhirTransaksi">) => string;
  recordCustomerTransaction: (customerId: string, transaction: Omit<CustomerTransaction, "id">) => void;
  getCustomerById: (id: string) => CustomerRecord | undefined;
  getCustomerByWA: (wa: string) => CustomerRecord | undefined;

  /* Last Kasir Unit (quick-switch preference) */
  lastKasirUnit: BizUnit | null;
  setLastKasirUnit: (unit: BizUnit) => void;
}

/* ══════════════════════════════════════════════════════════════
   DEFAULTS
   ══════════════════════════════════════════════════════════════ */

const DEFAULT_LABELS: Omit<TransaksiLabel, "id" | "createdAt">[] = [];

const DEFAULT_PROFILE: BusinessProfile = {
  logoUrl: "",
  namaUsaha: "",
  alamat: "",
  noWhatsapp: "",
  slogan: "",
  subLayanan: [],
};

const INITIAL_SEDEKAH: SedekahBalance = {
  zakatMal: 0,
  zakatFitrah: 0,
  infakTerikat: 0,
  sedekahSubuh: 0,
};

function genId(): string {
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/* ══════════════════════════════════════════════════════════════
   PERSISTENCE CONFIG
   ══════════════════════════════════════════════════════════════ */

const ssrSafeStorage = createJSONStorage(() => {
  if (typeof window === "undefined") {
    return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  }
  return {
    getItem: (name) => { try { return localStorage.getItem(name); } catch { return null; } },
    setItem: (name, value) => { try { localStorage.setItem(name, value); } catch (e) { console.warn("Storage penuh, hapus data lama atau backup"); } },
    removeItem: (name) => { try { localStorage.removeItem(name); } catch {} },
  };
});

/* ══════════════════════════════════════════════════════════════
   STORE
   ══════════════════════════════════════════════════════════════ */

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

      /* ─── Buku Usaha: Profil ─── */
      profile: { ...DEFAULT_PROFILE },
      setProfileLogo: (logoUrl) =>
        set((s) => ({ profile: { ...s.profile, logoUrl } })),
      setProfileNama: (nama) =>
        set((s) => ({ profile: { ...s.profile, namaUsaha: nama } })),
      setProfileAlamat: (alamat) =>
        set((s) => ({ profile: { ...s.profile, alamat } })),
      setProfileWhatsapp: (no) =>
        set((s) => ({ profile: { ...s.profile, noWhatsapp: no } })),
      setProfileSlogan: (slogan) =>
        set((s) => ({ profile: { ...s.profile, slogan } })),
      updateProfile: (data) =>
        set((s) => ({ profile: { ...s.profile, ...data } })),
      resetProfile: () => set({ profile: { ...DEFAULT_PROFILE } }),
      tambahSubLayanan: (item) =>
        set((s) => ({
          profile: { ...s.profile, subLayanan: [...s.profile.subLayanan, item] },
        })),
      hapusSubLayanan: (index) =>
        set((s) => ({
          profile: {
            ...s.profile,
            subLayanan: s.profile.subLayanan.filter((_, i) => i !== index),
          },
        })),

      /* ─── Buku Usaha: Wallets ─── */
      wallets: [],
      mutasiLog: [],
      addWallet: (w) => set((s) => ({ wallets: [w, ...s.wallets] })),
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
        const wallet = get().wallets.find((w) => w.id === id);
        if (!wallet || wallet.saldo < nominal) return false;
        set((s) => ({
          wallets: s.wallets.map((w) =>
            w.id === id ? { ...w, saldo: w.saldo - nominal } : w
          ),
        }));
        return true;
      },
      transferSaldo: (dariId, keId, nominal, alasan) => {
        const dari = get().wallets.find((w) => w.id === dariId);
        const ke = get().wallets.find((w) => w.id === keId);
        if (!dari) return { ok: false, error: "Dompet asal tidak ditemukan" };
        if (!ke) return { ok: false, error: "Dompet tujuan tidak ditemukan" };
        if (dari.saldo < nominal) return { ok: false, error: `Saldo ${dari.namaDompet} tidak mencukupi` };
        if (nominal <= 0) return { ok: false, error: "Nominal harus lebih dari 0" };
        const mutasi: WalletMutasi = {
          id: genId(),
          dariWalletId: dariId,
          keWalletId: keId,
          nominal,
          alasan,
          createdAt: Date.now(),
        };
        set((s) => ({
          wallets: s.wallets.map((w) => {
            if (w.id === dariId) return { ...w, saldo: w.saldo - nominal };
            if (w.id === keId) return { ...w, saldo: w.saldo + nominal };
            return w;
          }),
          mutasiLog: [mutasi, ...s.mutasiLog],
        }));
        return { ok: true };
      },

      /* ─── Buku Usaha: Payment Methods ─── */
      paymentMethods: [],
      addPaymentMethod: (p) => set((s) => ({ paymentMethods: [p, ...s.paymentMethods] })),
      updatePaymentMethod: (id, data) =>
        set((s) => ({
          paymentMethods: s.paymentMethods.map((pm) => (pm.id === id ? { ...pm, ...data } : pm)),
        })),
      removePaymentMethod: (id) =>
        set((s) => ({ paymentMethods: s.paymentMethods.filter((pm) => pm.id !== id) })),
      togglePaymentMethod: (id) =>
        set((s) => ({
          paymentMethods: s.paymentMethods.map((pm) =>
            pm.id === id ? { ...pm, isEnabled: !pm.isEnabled } : pm
          ),
        })),

      /* ─── Buku Usaha: Tema ─── */
      accentColor: "indigo",
      setAccentColor: (color) => set({ accentColor: color }),

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

      /* ─── Buku Usaha: Piutang & Cicilan ─── */
      piutangList: [],
      cicilanList: [],
      addPiutang: (data) => {
        const id = genId();
        const piutang: Piutang = {
          id,
          ...data,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ piutangList: [piutang, ...s.piutangList] }));
        return id;
      },
      bayarCicilan: (piutangId, jumlah, metode, catatan) => {
        const cicilan: PembayaranCicilan = {
          id: genId(),
          piutangId,
          jumlah,
          metode,
          tanggal: new Date().toISOString(),
          catatan,
        };
        set((s) => {
          const updatedPiutang = s.piutangList.map((p) => {
            if (p.id !== piutangId) return p;
            const sisaBaru = p.sisaPiutang - jumlah;
            return {
              ...p,
              sisaPiutang: Math.max(0, sisaBaru),
              status: sisaBaru <= 0 ? "lunas" : p.status,
            };
          });
          return {
            cicilanList: [cicilan, ...s.cicilanList],
            piutangList: updatedPiutang,
          };
        });
      },
      getPiutangAktif: () => get().piutangList.filter((p) => p.status === "aktif"),
      getPiutangByUnit: (unit) => get().piutangList.filter((p) => p.unit === unit),
      getCicilanByPiutang: (piutangId) => get().cicilanList.filter((c) => c.piutangId === piutangId),

      /* ─── Buku Usaha: Inventory ─── */
      inventory: [],
      inventoryMutations: [],
      addInventoryItem: (item) =>
        set((s) => ({
          inventory: [
            {
              ...item,
              id: genId(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            ...s.inventory,
          ],
        })),
      updateInventoryItem: (id, data) =>
        set((s) => ({
          inventory: s.inventory.map((i) =>
            i.id === id ? { ...i, ...data, updatedAt: new Date().toISOString() } : i
          ),
        })),
      deleteInventoryItem: (id) =>
        set((s) => ({
          inventory: s.inventory.filter((i) => i.id !== id),
        })),
      adjustStok: (itemId, tipe, qty, alasan, referensi) => {
        const item = get().inventory.find((i) => i.id === itemId);
        if (!item) return;
        const stokSebelum = item.stok;
        const stokSesudah =
          tipe === "masuk" ? item.stok + qty : Math.max(0, item.stok - qty);
        const mutasi: InventoryMutation = {
          id: genId(),
          itemId,
          tipe,
          qty,
          stokSebelum,
          stokSesudah,
          alasan,
          referensi,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          inventory: s.inventory.map((i) =>
            i.id === itemId
              ? { ...i, stok: stokSesudah, updatedAt: new Date().toISOString() }
              : i
          ),
          inventoryMutations: [mutasi, ...s.inventoryMutations],
        }));
      },

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

      /* ─── Kategori & Label Kustom ─── */
      transaksiLabels: DEFAULT_LABELS.map((l, i) => ({
        ...l,
        id: `label-default-${i}`,
        createdAt: new Date().toISOString(),
      })),
      transaksiTags: [],
      addTransaksiLabel: (data) => {
        const id = genId();
        const label: TransaksiLabel = {
          id,
          ...data,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ transaksiLabels: [label, ...s.transaksiLabels] }));
        return id;
      },
      deleteTransaksiLabel: (id) =>
        set((s) => ({
          transaksiLabels: s.transaksiLabels.filter((l) => l.id !== id),
          transaksiTags: s.transaksiTags.filter((t) => t.labelId !== id),
        })),
      updateTransaksiLabel: (id, data) =>
        set((s) => ({
          transaksiLabels: s.transaksiLabels.map((l) =>
            l.id === id ? { ...l, ...data } : l
          ),
        })),
      tagTransaksi: (transaksiRef, labelId) =>
        set((s) => {
          if (s.transaksiTags.find((t) => t.transaksiRef === transaksiRef && t.labelId === labelId)) return s;
          const tag: TransaksiTag = { id: genId(), transaksiRef, labelId };
          return { transaksiTags: [tag, ...s.transaksiTags] };
        }),
      untagTransaksi: (transaksiRef, labelId) =>
        set((s) => ({
          transaksiTags: s.transaksiTags.filter(
            (t) => !(t.transaksiRef === transaksiRef && t.labelId === labelId)
          ),
        })),
      getLabelsForTransaksi: (transaksiRef) => {
        const state = get();
        const tagIds = state.transaksiTags
          .filter((t) => t.transaksiRef === transaksiRef)
          .map((t) => t.labelId);
        return state.transaksiLabels.filter((l) => tagIds.includes(l.id));
      },

      /* ─── Quick Order Templates ─── */
      quickOrders: [],
      addQuickOrder: (data) => {
        const id = genId();
        const order: QuickOrder = {
          id,
          ...data,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ quickOrders: [order, ...s.quickOrders] }));
      },
      deleteQuickOrder: (id) =>
        set((s) => ({ quickOrders: s.quickOrders.filter((q) => q.id !== id) })),
      getQuickOrdersByUnit: (unit) => get().quickOrders.filter((q) => q.unit === unit),

      /* ─── Pelanggan & Riwayat ─── */
      customers: [],
      customerTransactions: [],
      addCustomerRecord: (data) => {
        const id = genId();
        const now = new Date().toISOString();
        const record: CustomerRecord = {
          id,
          ...data,
          totalTransaksi: 0,
          totalBelanja: 0,
          poin: 0,
          terakhirTransaksi: now,
          createdAt: now,
        };
        set((s) => ({ customers: [record, ...s.customers] }));
        return id;
      },
      recordCustomerTransaction: (customerId, transaction) => {
        const tx: CustomerTransaction = {
          id: genId(),
          ...transaction,
        };
        const cust = get().customers.find((c) => c.id === customerId);
        set((s) => ({
          customerTransactions: [tx, ...s.customerTransactions],
          customers: s.customers.map((c) =>
            c.id === customerId
              ? {
                  ...c,
                  totalTransaksi: c.totalTransaksi + 1,
                  totalBelanja: c.totalBelanja + transaction.total,
                  poin: c.poin + Math.floor(transaction.total / 10000),
                  terakhirTransaksi: transaction.tanggal,
                }
              : c
          ),
        }));
      },
      getCustomerById: (id) => get().customers.find((c) => c.id === id),
      getCustomerByWA: (wa) => get().customers.find((c) => c.noWA === wa),

      /* Last Kasir Unit */
      lastKasirUnit: null,
      setLastKasirUnit: (unit) => set({ lastKasirUnit: unit }),
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
