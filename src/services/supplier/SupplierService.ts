import { db, type UnitId, type DbSupplier } from "@/lib/db-v4";
import { validResult, ValidationResult, requiredError } from "@/services/types";

export interface ISupplierService {
  getAll(bookOrBranchId: UnitId): Promise<DbSupplier[]>;
  getById(id: string): Promise<DbSupplier | undefined>;
  create(data: CreateSupplierInput, bookOrBranchId: UnitId): Promise<DbSupplier>;
  update(id: string, data: UpdateSupplierInput): Promise<void>;
  delete(id: string): Promise<void>;
  validate(data: CreateSupplierInput): ValidationResult;
}

export interface CreateSupplierInput {
  nama: string;
  kontak?: string;
  alamat?: string;
  catatan?: string;
}

export interface UpdateSupplierInput {
  nama?: string;
  kontak?: string;
  alamat?: string;
  catatan?: string;
}

class SupplierService implements ISupplierService {
  async getAll(bookOrBranchId: UnitId): Promise<DbSupplier[]> {
    return db.suppliers.where("bookOrBranchId").equals(bookOrBranchId).toArray();
  }

  async getById(id: string): Promise<DbSupplier | undefined> {
    return db.suppliers.get(id);
  }

  async create(data: CreateSupplierInput, bookOrBranchId: UnitId): Promise<DbSupplier> {
    const supplier: DbSupplier = {
      id: crypto.randomUUID(),
      bookOrBranchId,
      unitId: bookOrBranchId,
      nama: data.nama,
      kontak: data.kontak || "",
      alamat: data.alamat || "",
      catatan: data.catatan || "",
      createdAt: new Date().toISOString(),
    };
    await db.suppliers.add(supplier);
    return supplier;
  }

  async update(id: string, data: UpdateSupplierInput): Promise<void> {
    await db.suppliers.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await db.suppliers.delete(id);
  }

  validate(data: CreateSupplierInput): ValidationResult {
    if (!data.nama || !data.nama.trim()) {
      return { valid: false, errors: [requiredError("nama")] };
    }
    return validResult();
  }
}

export const supplierService = new SupplierService();
