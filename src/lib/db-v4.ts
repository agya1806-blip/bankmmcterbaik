import Dexie, { type Table, type Transaction as DexieTx } from "dexie";

/* ───────────────────────────────────────────────────────── */
/* UNIT IDs — Semua cabang & buku non-bisnis                */
/* ───────────────────────────────────────────────────────── */

export type UnitId =
  | "pribadi"
  | "keluarga"
  | "usaha-percetakan"
  | "usaha-laptop"
  | "usaha-gadget"
  | "usaha-warkop"
  | "usaha-kelontong"
  | "usaha-konveksi"
  | "usaha-toko-pakaian";

export type BookOrBranch = UnitId | "GLOBAL";

export const UNIT_LABELS: Record<UnitId, string> = {
  pribadi: "Pribadi",
  keluarga: "Keluarga",
  "usaha-percetakan": "Percetakan",
  "usaha-laptop": "Laptop / PC",
  "usaha-gadget": "Gadget",
  "usaha-warkop": "Warkop",
  "usaha-kelontong": "Kelontong",
  "usaha-konveksi": "Konveksi",
  "usaha-toko-pakaian": "Toko Pakaian",
};

/** Legacy alias */
export const BOOK_LABELS = UNIT_LABELS as Record<BookOrBranch, string>;
BOOK_LABELS.GLOBAL = "Global";

/** Unit yang menggunakan POS/Kasir + Inventory */
export const POS_UNITS: UnitId[] = [
  "usaha-percetakan", "usaha-laptop", "usaha-gadget",
  "usaha-warkop", "usaha-kelontong", "usaha-konveksi", "usaha-toko-pakaian",
];

/** Unit yang menggunakan modul Produksi */
export const PRODUCTION_UNITS: UnitId[] = [
  "usaha-percetakan", "usaha-konveksi", "usaha-toko-pakaian",
];

/** Unit buku non-bisnis (hanya Cashflow) */
export const NON_BIZ_UNITS: UnitId[] = ["pribadi", "keluarga"];

/** Unit yang bisa dibuat dompet (maks 4 aktif) */
export const MAX_WALLET_PER_UNIT = 4;

export const ALL_UNITS: UnitId[] = [
  "pribadi", "keluarga",
  "usaha-percetakan", "usaha-laptop", "usaha-gadget",
  "usaha-warkop", "usaha-kelontong", "usaha-konveksi", "usaha-toko-pakaian",
];

/* Legacy aliases */
export const BRANCH_SLUGS = POS_UNITS;
export const BRANCH_LIST = POS_UNITS;

/* ─── Enums ─── */

export type WalletTipe = "KasTunai" | "Bank" | "EWallet";
export type UserRole = "admin" | "kasir" | "viewer";
export type TransStatus = "LUNAS" | "DP" | "BATAL";
export type PiutangStatus = "AKTIF" | "LUNAS" | "DIHAPUS";
export type InvTipe = "masuk" | "keluar" | "penyesuaian";
export type ProductionStatus = "antre" | "diproduksi" | "selesai";
export type SedekahType = "zakatMal" | "zakatFitrah" | "infakTerikat" | "sedekahSubuh";

/* ───────────────────────────────────────────────────────── */
/* 18 TABLE INTERFACES                                      */
/* ───────────────────────────────────────────────────────── */

export interface DbUser {
  id: string;
  bookOrBranchId: UnitId;
  nama: string;
  pinHash: string;
  fotoUrl: string;
  role: UserRole;
  allowedUnits: string[];
  isActive: boolean;
  createdAt: string;
}

export interface DbProfile {
  id: string;
  bookOrBranchId: UnitId;
  namaUsaha: string;
  logoUrl: string;
  alamat: string;
  noWhatsapp: string;
  slogan: string;
  subLayanan: string[];
  updatedAt: string;
}

/* ─── DOMPET ─── */

export interface DbWallet {
  id: string;
  bookOrBranchId: UnitId;
  unitId: UnitId;
  namaDompet: string;
  saldo: number;
  tipe: WalletTipe;
  nomorRekening?: string;
  atasNama?: string;
  namaBank?: string;
  catatan: string;
  isActive: boolean;
  createdAt: string;
}

export interface DbWalletMutation {
  id: string;
  bookOrBranchId: UnitId;
  dariWalletId: string;
  keWalletId: string;
  nominal: number;
  alasan: string;
  createdAt: string;
}

/* ─── PELANGGAN ─── */

export interface DbCustomer {
  id: string;
  bookOrBranchId: UnitId;
  nama: string;
  noWA: string;
  totalTransaksi: number;
  totalBelanja: number;
  poin: number;
  terakhirTransaksi: string;
  createdAt: string;
}

/* ─── TRANSAKSI ─── */

export interface DbTransactionItem {
  id: string;
  namaItem: string;
  qty: number;
  hargaSatuan: number;
  hargaModal: number;
  diskonPersen: number;
  subtotal: number;
  spesifikasi: string;
}

export interface DbTransaction {
  id: string;
  bookOrBranchId: UnitId;
  unitId: UnitId;
  userId: string;
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
  sedekahNominal: number;
  status: TransStatus;
  walletIdTarget: string;
  catatan: string;
  buktiBayar?: string;
  createdAt: string;
}

/* ─── PIUTANG ─── */

export interface DbPiutang {
  id: string;
  bookOrBranchId: UnitId;
  unitId: UnitId;
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
  bookOrBranchId: UnitId;
  piutangId: string;
  jumlah: number;
  metode: string;
  tanggal: string;
  catatan: string;
}

/* ─── INVENTORY ─── */

export interface DbInventoryItem {
  id: string;
  bookOrBranchId: UnitId;
  unitId: UnitId;
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
  bookOrBranchId: UnitId;
  itemId: string;
  tipe: InvTipe;
  qty: number;
  stokSebelum: number;
  stokSesudah: number;
  alasan: string;
  createdAt: string;
}

/* ─── LABEL ─── */

export interface DbLabel {
  id: string;
  bookOrBranchId: UnitId;
  label: string;
  warna: string;
  createdAt: string;
}

export interface DbLabelTag {
  id: string;
  bookOrBranchId: UnitId;
  transaksiRef: string;
  labelId: string;
}

/* ─── QUICK ORDER ─── */

export interface DbQuickOrder {
  id: string;
  bookOrBranchId: UnitId;
  label: string;
  items: { desc: string; price: number }[];
  createdAt: string;
}

/* ─── AUDIT LOG ─── */

export interface DbAuditLog {
  id: string;
  bookOrBranchId: UnitId;
  action: "CREATE" | "UPDATE" | "DELETE" | "BATAL" | "RETUR" | "TRANSFER_KELUAR" | "TRANSFER_MASUK";
  entityType: "transaction" | "piutang" | "wallet" | "customer" | "inventory" | "transfer" | "sedekah";
  entityId: string;
  userId: string;
  userName: string;
  dataBefore: string;
  dataAfter: string;
  nominal: number;
  alasan: string;
  createdAt: string;
}

/* ─── CASHPLOW ─── */

export interface DbCashflow {
  id: string;
  bookOrBranchId: UnitId;
  unitId: UnitId;
  tipe: "masuk" | "keluar";
  kategori: string;
  nominal: number;
  saldoSebelum: number;
  saldoSesudah: number;
  walletId: string;
  walletNama: string;
  referensiId: string;
  referensiTipe: "transaction" | "mutasi" | "adjustment" | "retur" | "sedekah";
  catatan: string;
  createdAt: string;
}

/* ─── PRODUKSI ─── */

export interface DbProduction {
  id: string;
  bookOrBranchId: UnitId;
  unitId: UnitId;
  transactionId: string;
  invoiceNumber: string;
  status: ProductionStatus;
  catatan: string;
  updatedAt: string;
  createdAt: string;
}

/* ─── SEDEKAH ─── */

export interface DbSedekahBalance {
  id: string;
  bookOrBranchId: UnitId;
  zakatMal: number;
  zakatFitrah: number;
  infakTerikat: number;
  sedekahSubuh: number;
}

/* ─── INVOICE COUNTER ─── */

export interface DbInvoiceCounter {
  id: string;
  bookOrBranchId: UnitId;
  prefix: string;
  counter: number;
}

/* ───────────────────────────────────────────────────────── */
/* DEXIE DATABASE                                           */
/* ───────────────────────────────────────────────────────── */

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

    this.version(2).stores({
      users: "id, &nama, role, bookOrBranchId",
      profiles: "id, bookOrBranchId",
      wallets: "id, bookOrBranchId, unitId, tipe, isActive",
      walletMutations: "id, bookOrBranchId, dariWalletId, keWalletId, createdAt",
      customers: "id, bookOrBranchId, &[bookOrBranchId+noWA], nama",
      transactions: "id, bookOrBranchId, unitId, userId, customerId, tanggal, status, walletIdTarget, invoiceNumber",
      piutang: "id, bookOrBranchId, unitId, customerId, status, jatuhTempo, transactionId",
      piutangInstallments: "id, bookOrBranchId, piutangId, tanggal",
      inventory: "id, bookOrBranchId, unitId, sku, kategori",
      inventoryMutations: "id, bookOrBranchId, itemId, tipe, createdAt",
      labels: "id, bookOrBranchId",
      labelTags: "id, bookOrBranchId, transaksiRef, labelId",
      quickOrders: "id, bookOrBranchId",
      sedekahBalances: "id, bookOrBranchId",
      invoiceCounters: "id, bookOrBranchId, prefix",
      auditLogs: "id, bookOrBranchId, action, entityType, entityId, createdAt",
      cashflows: "id, bookOrBranchId, unitId, tipe, kategori, walletId, referensiId, createdAt",
      productions: "id, bookOrBranchId, unitId, transactionId, status, updatedAt",
    });

    this.on("populate", (tx) => this.seedDefaultData(tx as unknown as DexieTx));
  }

  private async seedDefaultData(tx: DexieTx) {
    for (const unit of ALL_UNITS) {
      const tbl = tx.table("sedekahBalances") as Table<DbSedekahBalance>;
      await tbl.add({
        id: `sedekah-${unit}`,
        bookOrBranchId: unit,
        zakatMal: 0,
        zakatFitrah: 0,
        infakTerikat: 0,
        sedekahSubuh: 0,
      });
    }
  }
}

export const db = new MmcBankDB();

/* ───────────────────────────────────────────────────────── */
/* HELPERS                                                  */
/* ───────────────────────────────────────────────────────── */

export function generateInvoiceNumber(
  prefix: string,
  date: Date = new Date()
): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${prefix}/${y}${m}${d}/`;
}

export function branchPrefix(slug: UnitId): string {
  const map: Partial<Record<UnitId, string>> = {
    "usaha-percetakan": "PRT",
    "usaha-laptop": "LPT",
    "usaha-gadget": "GDG",
    "usaha-warkop": "WRK",
    "usaha-kelontong": "KLN",
    "usaha-konveksi": "KNV",
    "usaha-toko-pakaian": "TPK",
    pribadi: "PRB",
    keluarga: "KLG",
  };
  return map[slug] ?? "USR";
}

/* ─── Type Aliases (backward compat) ─── */
export type Customer = DbCustomer;
export type Transaction = DbTransaction;
export type Cashflow = DbCashflow;
export type AuditLog = DbAuditLog;
export type Production = DbProduction;
export type Wallet = DbWallet;
export type Piutang = DbPiutang;
export type Inventory = DbInventoryItem;
