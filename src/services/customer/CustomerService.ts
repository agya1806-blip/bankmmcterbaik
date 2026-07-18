import { db, type UnitId, type DbCustomer } from "@/lib/db-v4";
import { validResult, ValidationResult, requiredError } from "@/services/types";

export interface ICustomerService {
  getAll(bookOrBranchId: UnitId): Promise<DbCustomer[]>;
  getById(id: string): Promise<DbCustomer | undefined>;
  getByPhone(noWA: string, bookOrBranchId: UnitId): Promise<DbCustomer | undefined>;
  search(query: string, bookOrBranchId: UnitId): Promise<DbCustomer[]>;
  create(data: CreateCustomerInput, bookOrBranchId: UnitId): Promise<DbCustomer>;
  update(id: string, data: UpdateCustomerInput): Promise<void>;
  delete(id: string): Promise<void>;
  updateTransactionStats(customerId: string, amount: number): Promise<void>;
  addPoints(customerId: string, points: number): Promise<void>;
  validate(data: CreateCustomerInput): ValidationResult;
  toDTO(customer: DbCustomer): CustomerDTO;
}

export interface CreateCustomerInput {
  nama: string;
  noWA?: string;
}

export interface UpdateCustomerInput {
  nama?: string;
  noWA?: string;
}

export interface CustomerDTO {
  id: string;
  nama: string;
  noWA: string;
  totalTransaksi: number;
  totalBelanja: number;
  poin: number;
  terakhirTransaksi: string;
  createdAt: string;
}

class CustomerService implements ICustomerService {
  async getAll(bookOrBranchId: UnitId): Promise<DbCustomer[]> {
    return db.customers.where("bookOrBranchId").equals(bookOrBranchId).toArray();
  }

  async getById(id: string): Promise<DbCustomer | undefined> {
    return db.customers.get(id);
  }

  async getByPhone(noWA: string, bookOrBranchId: UnitId): Promise<DbCustomer | undefined> {
    return db.customers
      .where("bookOrBranchId")
      .equals(bookOrBranchId)
      .filter((c) => c.noWA === noWA)
      .first();
  }

  async search(query: string, bookOrBranchId: UnitId): Promise<DbCustomer[]> {
    const all = await this.getAll(bookOrBranchId);
    const q = query.toLowerCase();
    return all.filter(
      (c) => c.nama.toLowerCase().includes(q) || c.noWA.includes(query)
    );
  }

  async create(data: CreateCustomerInput, bookOrBranchId: UnitId): Promise<DbCustomer> {
    const now = new Date().toISOString();
    const customer: DbCustomer = {
      id: crypto.randomUUID(),
      bookOrBranchId,
      nama: data.nama,
      noWA: data.noWA || "",
      totalTransaksi: 0,
      totalBelanja: 0,
      poin: 0,
      terakhirTransaksi: now,
      createdAt: now,
    };
    await db.customers.add(customer);
    return customer;
  }

  async update(id: string, data: UpdateCustomerInput): Promise<void> {
    await db.customers.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await db.customers.delete(id);
  }

  async updateTransactionStats(customerId: string, amount: number): Promise<void> {
    const customer = await this.getById(customerId);
    if (!customer) return;
    await db.customers.update(customerId, {
      totalTransaksi: (customer.totalTransaksi || 0) + 1,
      totalBelanja: (customer.totalBelanja || 0) + amount,
      terakhirTransaksi: new Date().toISOString(),
    });
  }

  async addPoints(customerId: string, points: number): Promise<void> {
    const customer = await this.getById(customerId);
    if (!customer) return;
    await db.customers.update(customerId, {
      poin: (customer.poin || 0) + points,
    });
  }

  validate(data: CreateCustomerInput): ValidationResult {
    if (!data.nama || !data.nama.trim()) {
      return { valid: false, errors: [requiredError("nama")] };
    }
    return validResult();
  }

  toDTO(customer: DbCustomer): CustomerDTO {
    return {
      id: customer.id,
      nama: customer.nama,
      noWA: customer.noWA,
      totalTransaksi: customer.totalTransaksi,
      totalBelanja: customer.totalBelanja,
      poin: customer.poin,
      terakhirTransaksi: customer.terakhirTransaksi,
      createdAt: customer.createdAt,
    };
  }
}

export const customerService = new CustomerService();
