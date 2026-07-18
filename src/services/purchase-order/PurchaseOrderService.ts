import { db, type UnitId, type DbPurchaseOrder, type DbPurchaseOrderItem } from "@/lib/db-v4";

export interface IPurchaseOrderService {
  getAll(bookOrBranchId: UnitId): Promise<DbPurchaseOrder[]>;
  getById(id: string): Promise<DbPurchaseOrder | undefined>;
  create(data: CreatePOInput, bookOrBranchId: UnitId): Promise<DbPurchaseOrder>;
  updateStatus(id: string, status: DbPurchaseOrder["status"]): Promise<void>;
}

export interface CreatePOInput {
  poNumber: string;
  supplierId: string;
  supplierNama: string;
  items: DbPurchaseOrderItem[];
  total: number;
  catatan?: string;
}

class PurchaseOrderService implements IPurchaseOrderService {
  async getAll(bookOrBranchId: UnitId): Promise<DbPurchaseOrder[]> {
    return db.purchaseOrders.where("bookOrBranchId").equals(bookOrBranchId).reverse().toArray();
  }

  async getById(id: string): Promise<DbPurchaseOrder | undefined> {
    return db.purchaseOrders.get(id);
  }

  async create(data: CreatePOInput, bookOrBranchId: UnitId): Promise<DbPurchaseOrder> {
    const po: DbPurchaseOrder = {
      id: crypto.randomUUID(),
      bookOrBranchId,
      unitId: bookOrBranchId,
      poNumber: data.poNumber,
      supplierId: data.supplierId,
      supplierNama: data.supplierNama,
      items: data.items,
      total: data.total,
      status: "draft",
      catatan: data.catatan || "",
      createdAt: new Date().toISOString(),
    };
    await db.purchaseOrders.add(po);
    return po;
  }

  async updateStatus(id: string, status: DbPurchaseOrder["status"]): Promise<void> {
    await db.purchaseOrders.update(id, { status });
  }
}

export const purchaseOrderService = new PurchaseOrderService();
