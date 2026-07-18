import { db, type UnitId, type DbTransaction, type TransStatus } from "@/lib/db-v4";

export interface ITransactionService {
  getAll(bookOrBranchId: UnitId): Promise<DbTransaction[]>;
  getById(id: string): Promise<DbTransaction | undefined>;
  getByCustomer(customerId: string, limit?: number): Promise<DbTransaction[]>;
  getRecent(bookOrBranchId: UnitId, limit?: number): Promise<DbTransaction[]>;
  getByStatus(bookOrBranchId: UnitId, status: TransStatus): Promise<DbTransaction[]>;
  getTotalPendapatan(bookOrBranchId: UnitId): Promise<number>;
  getByPeriode(bookOrBranchId: UnitId, periode: string): Promise<DbTransaction[]>;
}

class TransactionService implements ITransactionService {
  async getAll(bookOrBranchId: UnitId): Promise<DbTransaction[]> {
    return db.transactions.where("bookOrBranchId").equals(bookOrBranchId).reverse().toArray();
  }

  async getById(id: string): Promise<DbTransaction | undefined> {
    return db.transactions.get(id);
  }

  async getByCustomer(customerId: string, limit?: number): Promise<DbTransaction[]> {
    let query = db.transactions.where("customerId").equals(customerId).reverse();
    if (limit) {
      return query.limit(limit).toArray();
    }
    return query.toArray();
  }

  async getRecent(bookOrBranchId: UnitId, limit = 10): Promise<DbTransaction[]> {
    return db.transactions
      .where("bookOrBranchId").equals(bookOrBranchId)
      .reverse()
      .limit(limit)
      .toArray();
  }

  async getByStatus(bookOrBranchId: UnitId, status: TransStatus): Promise<DbTransaction[]> {
    const all = await this.getAll(bookOrBranchId);
    return all.filter((t) => t.status === status);
  }

  async getTotalPendapatan(bookOrBranchId: UnitId): Promise<number> {
    const all = await this.getAll(bookOrBranchId);
    return all
      .filter((t) => t.status !== "BATAL")
      .reduce((sum, t) => sum + t.grandTotal - (t.sedekahNominal || 0), 0);
  }

  async getByPeriode(bookOrBranchId: UnitId, periode: string): Promise<DbTransaction[]> {
    const all = await this.getAll(bookOrBranchId);
    return all.filter((t) => t.tanggal.startsWith(periode));
  }
}

export const transactionService = new TransactionService();
