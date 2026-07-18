import { db, type UnitId, type DbProduction, type ProductionStatus } from "@/lib/db-v4";

export interface IProductionService {
  getAll(bookOrBranchId: UnitId): Promise<DbProduction[]>;
  getByUnit(unitId: UnitId): Promise<DbProduction[]>;
  getByTransaction(txId: string): Promise<DbProduction | undefined>;
  updateStatus(id: string, status: ProductionStatus): Promise<void>;
}

class ProductionService implements IProductionService {
  async getAll(bookOrBranchId: UnitId): Promise<DbProduction[]> {
    return db.productions.where("bookOrBranchId").equals(bookOrBranchId).toArray();
  }

  async getByUnit(unitId: UnitId): Promise<DbProduction[]> {
    return db.productions.where("unitId").equals(unitId).toArray();
  }

  async getByTransaction(txId: string): Promise<DbProduction | undefined> {
    return db.productions.where({ transactionId: txId }).first();
  }

  async updateStatus(id: string, status: ProductionStatus): Promise<void> {
    await db.productions.update(id, { status, updatedAt: new Date().toISOString() });
  }
}

export const productionService = new ProductionService();
