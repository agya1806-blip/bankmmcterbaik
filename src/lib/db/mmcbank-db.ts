import Dexie, { type Table } from "dexie";

/* ─── Core Types ─── */

export type BizUnit = "percetakan" | "gadget" | "kedai_kopi" | "konveksi";

export type TransactionStatus = "LUNAS" | "DIPROSES" | "SELESAI" | "BATAL";
export type PiutangStatus = "BELUM_LUNAS" | "LUNAS";
export type WalletTipe = "KasTunai" | "Bank" | "EWallet";
export type UserRole = "admin" | "kasir" | "viewer";
export type InvMutationTipe = "masuk" | "keluar" | "penyesuaian";

/* ─── Row Types ─── */

export interface MmcUser {
  id: string;
  nama: string;
  pinHash: string;
  role: UserRole;
  allowedUnits: BizUnit[];
  isActive: boolean;
}

export interface MmcWallet {
  id: string;
  namaDompet: string;
  saldo: number;
  tipe: WalletTipe;
  catatan: string;
}

export interface MmcWalletMutation {
  id: string;
  dariWalletId: string;
  keWalletId: string;
  nominal: number;
  alasan: string;
  createdAt: number;
}

export interface MmcInventoryItem {
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
  metadata?: Record<string, unknown>;
}

export interface MmcInventoryMutation {
  id: string;
  itemId: string;
  tipe: InvMutationTipe;
  qty: number;
  stokSebelum: number;
  stokSesudah: number;
  alasan: string;
  createdAt: number;
}

export interface MmcCustomer {
  id: string;
  nama: string;
  noWA: string;
  totalBelanja: number;
  poin: number;
  terakhirTransaksi: number;
}

export interface MmcTransactionItem {
  id: string;
  namaItem: string;
  qty: number;
  hargaModal: number;
  hargaJual: number;
  subtotal: number;
  spesifikasiDetail?: Record<string, unknown>;
}

export interface MmcTransaction {
  id: string;
  customerId?: string;
  unit: BizUnit;
  tanggal: string;
  totalBruto: number;
  dpDibayar: number;
  sisaTagihan: number;
  status: TransactionStatus;
  walletIdTarget: string;
  items: MmcTransactionItem[];
  label: string;
  labelColor: string;
}

export interface MmcPiutang {
  id: string;
  transactionId: string;
  customerId: string;
  totalPiutang: number;
  sisaPiutang: number;
  jatuhTempo: string;
  status: PiutangStatus;
}

export interface MmcPiutangInstallment {
  id: string;
  piutangId: string;
  jumlah: number;
  metodePembayaranId: string;
  tanggal: string;
}

/* ─── Dexie DB Class ─── */

class MmcBankDB extends Dexie {
  users!: Table<MmcUser, string>;
  wallets!: Table<MmcWallet, string>;
  walletMutations!: Table<MmcWalletMutation, string>;
  inventory!: Table<MmcInventoryItem, string>;
  inventoryMutations!: Table<MmcInventoryMutation, string>;
  customers!: Table<MmcCustomer, string>;
  transactions!: Table<MmcTransaction, string>;
  piutang!: Table<MmcPiutang, string>;
  piutangInstallments!: Table<MmcPiutangInstallment, string>;

  constructor() {
    super("mmcbank-v3");

    this.version(1).stores({
      users: "id, &nama, role",
      wallets: "id",
      walletMutations: "id, dariWalletId, keWalletId, createdAt",
      inventory: "id, unit, sku, kategori, stok",
      inventoryMutations: "id, itemId, tipe, createdAt",
      customers: "id, &noWA, nama",
      transactions: "id, customerId, unit, tanggal, status, walletIdTarget",
      piutang: "id, transactionId, customerId, status, jatuhTempo",
      piutangInstallments: "id, piutangId, tanggal",
    });
  }
}

export const mmcDB = new MmcBankDB();
