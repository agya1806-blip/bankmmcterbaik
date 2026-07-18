import { db, type UnitId, type DbCashflow } from "@/lib/db-v4";

export interface ICashflowService {
  getAll(bookOrBranchId: UnitId): Promise<DbCashflow[]>;
  getRecent(bookOrBranchId: UnitId, limit?: number): Promise<DbCashflow[]>;
  getByType(bookOrBranchId: UnitId, tipe: "masuk" | "keluar"): Promise<DbCashflow[]>;
  getByKategori(bookOrBranchId: UnitId, kategori: string): Promise<DbCashflow[]>;
  getTotalMasuk(bookOrBranchId: UnitId): Promise<number>;
  getTotalKeluar(bookOrBranchId: UnitId): Promise<number>;
  create(data: CreateCashflowInput): Promise<DbCashflow>;
  update(id: string, data: UpdateCashflowInput): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface CreateCashflowInput {
  bookOrBranchId: UnitId;
  unitId: UnitId;
  tipe: "masuk" | "keluar";
  kategori: string;
  nominal: number;
  saldoSebelum?: number;
  walletId: string;
  walletNama: string;
  referensiId?: string;
  referensiTipe?: DbCashflow["referensiTipe"];
  catatan?: string;
}

export interface UpdateCashflowInput {
  tipe?: "masuk" | "keluar";
  kategori?: string;
  nominal?: number;
  catatan?: string;
}

class CashflowService implements ICashflowService {
  async getAll(bookOrBranchId: UnitId): Promise<DbCashflow[]> {
    return db.cashflows.where("bookOrBranchId").equals(bookOrBranchId).reverse().toArray();
  }

  async getRecent(bookOrBranchId: UnitId, limit = 20): Promise<DbCashflow[]> {
    return db.cashflows
      .where("bookOrBranchId").equals(bookOrBranchId)
      .reverse()
      .limit(limit)
      .toArray();
  }

  async getByType(bookOrBranchId: UnitId, tipe: "masuk" | "keluar"): Promise<DbCashflow[]> {
    const all = await this.getAll(bookOrBranchId);
    return all.filter((c) => c.tipe === tipe);
  }

  async getByKategori(bookOrBranchId: UnitId, kategori: string): Promise<DbCashflow[]> {
    const all = await this.getAll(bookOrBranchId);
    return all.filter((c) => c.kategori === kategori);
  }

  async getTotalMasuk(bookOrBranchId: UnitId): Promise<number> {
    const all = await this.getByType(bookOrBranchId, "masuk");
    return all.reduce((sum, c) => sum + c.nominal, 0);
  }

  async getTotalKeluar(bookOrBranchId: UnitId): Promise<number> {
    const all = await this.getByType(bookOrBranchId, "keluar");
    return all.reduce((sum, c) => sum + c.nominal, 0);
  }

  async create(data: CreateCashflowInput): Promise<DbCashflow> {
    const cf: DbCashflow = {
      id: crypto.randomUUID(),
      bookOrBranchId: data.bookOrBranchId,
      unitId: data.unitId,
      tipe: data.tipe,
      kategori: data.kategori,
      nominal: data.nominal,
      saldoSebelum: data.saldoSebelum ?? 0,
      saldoSesudah: 0,
      walletId: data.walletId,
      walletNama: data.walletNama,
      referensiId: data.referensiId || "",
      referensiTipe: data.referensiTipe || "adjustment",
      catatan: data.catatan || "",
      createdAt: new Date().toISOString(),
    };
    await db.cashflows.add(cf);
    return cf;
  }

  async update(id: string, data: UpdateCashflowInput): Promise<void> {
    await db.cashflows.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await db.cashflows.delete(id);
  }
}

export const cashflowService = new CashflowService();
