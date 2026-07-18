import { db, type UnitId, type DbWallet, type WalletTipe, type MataUang } from "@/lib/db-v4";
import { validResult, ValidationResult, requiredError } from "@/services/types";

export interface IWalletService {
  getAll(bookOrBranchId: UnitId): Promise<DbWallet[]>;
  getActive(bookOrBranchId: UnitId): Promise<DbWallet[]>;
  getById(id: string): Promise<DbWallet | undefined>;
  create(data: CreateWalletInput, bookOrBranchId: UnitId): Promise<DbWallet>;
  update(id: string, data: UpdateWalletInput): Promise<void>;
  delete(id: string): Promise<void>;
  getTotalSaldo(bookOrBranchId: UnitId): Promise<number>;
  canAdd(unitId: UnitId): Promise<{ ok: boolean; count: number; max: number }>;
  validate(data: CreateWalletInput): ValidationResult;
}

export interface CreateWalletInput {
  namaDompet: string;
  tipe: WalletTipe;
  saldo?: number;
  mataUang?: MataUang;
  nomorRekening?: string;
  atasNama?: string;
  namaBank?: string;
  catatan?: string;
}

export interface UpdateWalletInput {
  namaDompet?: string;
  tipe?: WalletTipe;
  saldo?: number;
  mataUang?: MataUang;
  nomorRekening?: string;
  atasNama?: string;
  namaBank?: string;
  catatan?: string;
  isActive?: boolean;
}

class WalletService implements IWalletService {
  async getAll(bookOrBranchId: UnitId): Promise<DbWallet[]> {
    return db.wallets.where("bookOrBranchId").equals(bookOrBranchId).toArray();
  }

  async getActive(bookOrBranchId: UnitId): Promise<DbWallet[]> {
    const all = await this.getAll(bookOrBranchId);
    return all.filter((w) => w.isActive);
  }

  async getById(id: string): Promise<DbWallet | undefined> {
    return db.wallets.get(id);
  }

  async create(data: CreateWalletInput, bookOrBranchId: UnitId): Promise<DbWallet> {
    const now = new Date().toISOString();
    const wallet: DbWallet = {
      id: crypto.randomUUID(),
      bookOrBranchId,
      unitId: bookOrBranchId,
      namaDompet: data.namaDompet,
      tipe: data.tipe,
      saldo: data.saldo ?? 0,
      mataUang: data.mataUang,
      nomorRekening: data.nomorRekening,
      atasNama: data.atasNama,
      namaBank: data.namaBank,
      catatan: data.catatan || "",
      isActive: true,
      createdAt: now,
    };
    await db.wallets.add(wallet);
    return wallet;
  }

  async update(id: string, data: UpdateWalletInput): Promise<void> {
    await db.wallets.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await db.wallets.delete(id);
  }

  async getTotalSaldo(bookOrBranchId: UnitId): Promise<number> {
    const wallets = await this.getActive(bookOrBranchId);
    return wallets.reduce((sum, w) => sum + w.saldo, 0);
  }

  async canAdd(unitId: UnitId): Promise<{ ok: boolean; count: number; max: number }> {
    const count = await db.wallets
      .where("unitId").equals(unitId)
      .filter((w) => w.isActive).count();
    return { ok: count < 4, count, max: 4 };
  }

  validate(data: CreateWalletInput): ValidationResult {
    if (!data.namaDompet || !data.namaDompet.trim()) {
      return { valid: false, errors: [requiredError("namaDompet")] };
    }
    if (!data.tipe) {
      return { valid: false, errors: [requiredError("tipe")] };
    }
    return validResult();
  }
}

export const walletService = new WalletService();
