import { db, type UnitId, type DbInventoryMutation, type InvTipe } from "@/lib/db-v4";
import { validResult, ValidationResult, requiredError } from "@/services/types";

export interface IInventoryService {
  getMutations(bookOrBranchId: UnitId): Promise<DbInventoryMutation[]>;
  getMutationsByProduct(itemId: string, bookOrBranchId: UnitId): Promise<DbInventoryMutation[]>;
  adjustStock(params: AdjustStockInput): Promise<void>;
  getLowStock(bookOrBranchId: UnitId): Promise<{ productId: string; nama: string; stok: number; stokMin: number }[]>;
  getStockStats(bookOrBranchId: UnitId): Promise<StockStats>;
  validateAdjustment(data: AdjustStockInput): ValidationResult;
}

export interface AdjustStockInput {
  bookOrBranchId: UnitId;
  itemId: string;
  tipe: InvTipe;
  qty: number;
  stokSebelum: number;
  alasan?: string;
}

export interface StockStats {
  total: number;
  active: number;
  inactive: number;
  lowStock: number;
  totalValue: number;
}

class InventoryService implements IInventoryService {
  async getMutations(bookOrBranchId: UnitId): Promise<DbInventoryMutation[]> {
    return db.inventoryMutations.where("bookOrBranchId").equals(bookOrBranchId).reverse().toArray();
  }

  async getMutationsByProduct(itemId: string, bookOrBranchId: UnitId): Promise<DbInventoryMutation[]> {
    const all = await this.getMutations(bookOrBranchId);
    return all.filter((m) => m.itemId === itemId);
  }

  async adjustStock(params: AdjustStockInput): Promise<void> {
    const now = new Date().toISOString();
    const qty = params.tipe === "masuk" ? params.qty : -params.qty;
    const stokSesudah = Math.max(0, params.stokSebelum + qty);

    await db.inventory.update(params.itemId, { stok: stokSesudah, updatedAt: now });
    await db.inventoryMutations.add({
      id: crypto.randomUUID(),
      bookOrBranchId: params.bookOrBranchId,
      itemId: params.itemId,
      tipe: params.tipe,
      qty: params.qty,
      stokSebelum: params.stokSebelum,
      stokSesudah,
      alasan: params.alasan || "",
      createdAt: now,
    });
  }

  async getLowStock(bookOrBranchId: UnitId): Promise<{ productId: string; nama: string; stok: number; stokMin: number }[]> {
    const products = await db.inventory.where("bookOrBranchId").equals(bookOrBranchId).toArray();
    return products
      .filter((p) => p.stok <= p.stokMin)
      .map((p) => ({ productId: p.id, nama: p.nama, stok: p.stok, stokMin: p.stokMin }));
  }

  async getStockStats(bookOrBranchId: UnitId): Promise<StockStats> {
    const products = await db.inventory.where("bookOrBranchId").equals(bookOrBranchId).toArray();
    const total = products.length;
    const active = products.filter((p) => p.stok > 0).length;
    const inactive = products.filter((p) => p.stok === 0).length;
    const lowStock = products.filter((p) => p.stok <= p.stokMin && p.stok > 0).length;
    const totalValue = products.reduce((sum, p) => sum + p.hargaModal * p.stok, 0);
    return { total, active, inactive, lowStock, totalValue };
  }

  validateAdjustment(data: AdjustStockInput): ValidationResult {
    if (data.qty <= 0) {
      return { valid: false, errors: [requiredError("qty")] };
    }
    return validResult();
  }
}

export const inventoryService = new InventoryService();
