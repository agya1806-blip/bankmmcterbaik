import Dexie, { type Table } from "dexie";

/* ─── Book/Branch ID ─── */

export type BookOrBranch =
  | "pribadi"
  | "keluarga"
  | "usaha"
  | "usaha-percetakan"
  | "usaha-laptop"
  | "usaha-gadget"
  | "usaha-warkop"
  | "usaha-kelontong"
  | "usaha-konveksi"
  | "usaha-toko-pakaian";

export const BOOK_LABELS: Record<BookOrBranch, string> = {
  pribadi: "Buku Pribadi",
  keluarga: "Buku Keluarga",
  usaha: "Buku Usaha",
  "usaha-percetakan": "Percetakan",
  "usaha-laptop": "Laptop / PC",
  "usaha-gadget": "Gadget",
  "usaha-warkop": "Warkop",
  "usaha-kelontong": "Kelontong",
  "usaha-konveksi": "Konveksi",
  "usaha-toko-pakaian": "Toko Pakaian",
};

export const BRANCH_SLUGS: BookOrBranch[] = [
  "usaha-percetakan",
  "usaha-laptop",
  "usaha-gadget",
  "usaha-warkop",
  "usaha-konveksi",
];

/* ─── Enums ─── */

export type WalletTipe = "KasTunai" | "Bank" | "EWallet";
export type UserRole = "admin" | "kasir" | "viewer";
export type TransStatus = "LUNAS" | "DP" | "BATAL";
export type PiutangStatus = "AKTIF" | "LUNAS" | "DIHAPUS";
export type InvTipe = "masuk" | "keluar" | "penyesuaian";

/* ─── Row Types (each has bookOrBranchId) ─── */

export interface DbUser {
  id: string;
  bookOrBranchId: BookOrBranch;
  nama: string;
  pinHash: string;
  role: UserRole;
  allowedUnits: string[];
  isActive: boolean;
  createdAt: string;
}

export interface DbProfile {
  id: string;
  bookOrBranchId: BookOrBranch;
  namaUsaha: string;
  logoUrl: string;
  alamat: string;
  noWhatsapp: string;
  slogan: string;
  subLayanan: string[];
  updatedAt: string;
}

export interface DbWallet {
  id: string;
  bookOrBranchId: BookOrBranch;
  namaDompet: string;
  saldo: number;
  tipe: WalletTipe;
  catatan: string;
  isActive: boolean;
  createdAt: string;
}

export interface DbWalletMutation {
  id: string;
  bookOrBranchId: BookOrBranch;
  dariWalletId: string;
  keWalletId: string;
  nominal: number;
  alasan: string;
  createdAt: string;
}

export interface DbCustomer {
  id: string;
  bookOrBranchId: BookOrBranch;
  nama: string;
  noWA: string;
  totalTransaksi: number;
  totalBelanja: number;
  poin: number;
  terakhirTransaksi: string;
  createdAt: string;
}

export interface DbTransactionItem {
  id: string;
  namaItem: string;
  qty: number;
  hargaSatuan: number;
  diskonPersen: number;
  subtotal: number;
  spesifikasi: string;
}

export interface DbTransaction {
  id: string;
  bookOrBranchId: BookOrBranch;
  invoiceNumber: string;
  customerId?: string;
  customerNama: string;
  customerWA: string;
  tanggal: string;
  items: DbTransactionItem[];
  totalBruto: number;
  diskonGlobalPersen: number;
  totalDiskonItem: number;
  totalDiskonGlobal: number;
  subtotalAfterDiskon: number;
  ppnPersen: number;
  ppnNominal: number;
  grandTotal: number;
  dpDibayar: number;
  sisaTagihan: number;
  status: TransStatus;
  walletIdTarget: string;
  catatan: string;
  buktiBayar?: string;
  createdAt: string;
}

export interface DbPiutang {
  id: string;
  bookOrBranchId: BookOrBranch;
  transactionId: string;
  customerId: string;
  customerNama: string;
  customerWA: string;
  totalPiutang: number;
  sisaPiutang: number;
  jatuhTempo: string;
  status: PiutangStatus;
  catatan: string;
  createdAt: string;
}

export interface DbPiutangInstallment {
  id: string;
  bookOrBranchId: BookOrBranch;
  piutangId: string;
  jumlah: number;
  metode: string;
  tanggal: string;
  catatan: string;
}

export interface DbInventoryItem {
  id: string;
  bookOrBranchId: BookOrBranch;
  sku: string;
  nama: string;
  kategori: string;
  stok: number;
  stokMin: number;
  hargaModal: number;
  hargaJual: number;
  satuan: string;
  catatan: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbInventoryMutation {
  id: string;
  bookOrBranchId: BookOrBranch;
  itemId: string;
  tipe: InvTipe;
  qty: number;
  stokSebelum: number;
  stokSesudah: number;
  alasan: string;
  createdAt: string;
}

export interface DbLabel {
  id: string;
  bookOrBranchId: BookOrBranch;
  label: string;
  warna: string;
  createdAt: string;
}

export interface DbLabelTag {
  id: string;
  bookOrBranchId: BookOrBranch;
  transaksiRef: string;
  labelId: string;
}

export interface DbQuickOrder {
  id: string;
  bookOrBranchId: BookOrBranch;
  label: string;
  items: { desc: string; price: number }[];
  createdAt: string;
}

export interface DbAuditLog {
  id: string;
  bookOrBranchId: BookOrBranch;
  action: "CREATE" | "UPDATE" | "DELETE" | "BATAL" | "TRANSFER_KELUAR" | "TRANSFER_MASUK";
  entityType: "transaction" | "piutang" | "wallet" | "customer" | "inventory" | "transfer";
  entityId: string;
  userId: string;
  userName: string;
  dataBefore: string;
  dataAfter: string;
  nominal: number;
  alasan: string;
  createdAt: string;
}

export interface DbCashflow {
  id: string;
  bookOrBranchId: BookOrBranch;
  tipe: "masuk" | "keluar";
  kategori: string;
  nominal: number;
  saldoSebelum: number;
  saldoSesudah: number;
  walletId: string;
  walletNama: string;
  referensiId: string;
  referensiTipe: "transaction" | "mutasi" | "adjustment";
  catatan: string;
  createdAt: string;
}

export type ProductionStatus = "antre" | "diproduksi" | "selesai";

export interface DbProduction {
  id: string;
  bookOrBranchId: BookOrBranch;
  transactionId: string;
  invoiceNumber: string;
  status: ProductionStatus;
  catatan: string;
  updatedAt: string;
  createdAt: string;
}

export interface DbSedekahBalance {
  id: string;
  bookOrBranchId: BookOrBranch;
  zakatMal: number;
  zakatFitrah: number;
  infakTerikat: number;
  sedekahSubuh: number;
}

export interface DbInvoiceCounter {
  id: string;
  bookOrBranchId: BookOrBranch;
  prefix: string;
  counter: number;
}

/* ─── Dexie DB ─── */

class MmcBankDB extends Dexie {
  users!: Table<DbUser, string>;
  profiles!: Table<DbProfile, string>;
  wallets!: Table<DbWallet, string>;
  walletMutations!: Table<DbWalletMutation, string>;
  customers!: Table<DbCustomer, string>;
  transactions!: Table<DbTransaction, string>;
  piutang!: Table<DbPiutang, string>;
  piutangInstallments!: Table<DbPiutangInstallment, string>;
  inventory!: Table<DbInventoryItem, string>;
  inventoryMutations!: Table<DbInventoryMutation, string>;
  labels!: Table<DbLabel, string>;
  labelTags!: Table<DbLabelTag, string>;
  quickOrders!: Table<DbQuickOrder, string>;
  sedekahBalances!: Table<DbSedekahBalance, string>;
  invoiceCounters!: Table<DbInvoiceCounter, string>;
  auditLogs!: Table<DbAuditLog, string>;
  cashflows!: Table<DbCashflow, string>;
  productions!: Table<DbProduction, string>;

  constructor() {
    super("mmcbank-v4");

    this.version(1).stores({
      users: "id, &nama, role, bookOrBranchId",
      profiles: "id, bookOrBranchId",
      wallets: "id, bookOrBranchId, tipe, isActive",
      walletMutations: "id, bookOrBranchId, dariWalletId, keWalletId, createdAt",
      customers: "id, bookOrBranchId, &[bookOrBranchId+noWA], nama",
      transactions: "id, bookOrBranchId, customerId, tanggal, status, walletIdTarget, invoiceNumber",
      piutang: "id, bookOrBranchId, customerId, status, jatuhTempo",
      piutangInstallments: "id, bookOrBranchId, piutangId, tanggal",
      inventory: "id, bookOrBranchId, sku, kategori",
      inventoryMutations: "id, bookOrBranchId, itemId, tipe, createdAt",
      labels: "id, bookOrBranchId",
      labelTags: "id, bookOrBranchId, transaksiRef, labelId",
      quickOrders: "id, bookOrBranchId",
      sedekahBalances: "id, bookOrBranchId",
      invoiceCounters: "id, bookOrBranchId, prefix",
      auditLogs: "id, bookOrBranchId, action, entityType, entityId, createdAt",
      cashflows: "id, bookOrBranchId, tipe, kategori, walletId, referensiId, createdAt",
      productions: "id, bookOrBranchId, transactionId, status, updatedAt",
    });
  }
}

export const db = new MmcBankDB();

/* ─── Helpers ─── */

export function generateInvoiceNumber(
  prefix: string,
  date: Date = new Date()
): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${prefix}/${y}${m}${d}/`;
}

export function branchPrefix(slug: BookOrBranch): string {
  const map: Partial<Record<BookOrBranch, string>> = {
    "usaha-percetakan": "PRT",
    "usaha-laptop": "LPT",
    "usaha-gadget": "GDG",
    "usaha-warkop": "WRK",
    "usaha-kelontong": "KLN",
    "usaha-konveksi": "KNV",
    "usaha-toko-pakaian": "TPK",
  };
  return map[slug] ?? "USR";
}

/* ─── Type Aliases (for backward compatibility) ─── */
export type Customer = DbCustomer;
export type Transaction = DbTransaction;
export type Cashflow = DbCashflow;
export type AuditLog = DbAuditLog;
export type Production = DbProduction;
export type Wallet = DbWallet;
export type Piutang = DbPiutang;

export type Inventory = DbInventoryItem;
