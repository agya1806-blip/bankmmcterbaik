import { db, type UnitId, type Inventory } from "@/lib/db-v4";
import { ValidationResult, validResult, requiredError } from "@/services/types";

export interface IProductService {
  getAll(bookOrBranchId: UnitId): Promise<Inventory[]>;
  getById(id: string): Promise<Inventory | undefined>;
  getByBranch(bookOrBranchId: UnitId): Promise<Inventory[]>;
  getByBarcode(barcode: string, bookOrBranchId: UnitId): Promise<Inventory | undefined>;
  getCategories(bookOrBranchId: UnitId): Promise<string[]>;
  search(query: string, bookOrBranchId: UnitId): Promise<Inventory[]>;
  create(data: CreateProductInput, bookOrBranchId: UnitId): Promise<Inventory>;
  update(id: string, data: UpdateProductInput): Promise<void>;
  delete(id: string): Promise<void>;
  bulkDelete(ids: string[]): Promise<void>;
  validate(data: CreateProductInput): ValidationResult;
  toDTO(product: Inventory): ProductDTO;
  toFormData(product: Inventory): ProductFormData;
}

export interface CreateProductInput {
  nama: string;
  sku: string;
  barcode?: string;
  kategori?: string;
  hargaModal?: number;
  hargaJual?: number;
  stok?: number;
  stokMin?: number;
  satuan?: string;
  catatan?: string;
  fotoUrl?: string;
}

export interface UpdateProductInput {
  nama?: string;
  sku?: string;
  barcode?: string;
  kategori?: string;
  hargaModal?: number;
  hargaJual?: number;
  stok?: number;
  stokMin?: number;
  satuan?: string;
  catatan?: string;
  fotoUrl?: string;
}

export interface ProductDTO {
  id: string;
  nama: string;
  sku: string;
  barcode: string;
  kategori: string;
  hargaModal: number;
  hargaJual: number;
  stok: number;
  stokMin: number;
  satuan: string;
  catatan: string;
  fotoUrl: string;
  status: "aktif" | "nonaktif" | "menipis";
  margin: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFormData {
  nama: string;
  sku: string;
  barcode: string;
  kategori: string;
  hargaModal: number;
  hargaJual: number;
  stok: number;
  stokMin: number;
  satuan: string;
  fotoUrl: string;
  catatan: string;
}

export const emptyFormData: ProductFormData = {
  nama: "", sku: "", barcode: "", kategori: "",
  hargaModal: 0, hargaJual: 0, stok: 0, stokMin: 2,
  satuan: "pcs", fotoUrl: "", catatan: "",
};

class ProductService implements IProductService {
  async getAll(bookOrBranchId: UnitId): Promise<Inventory[]> {
    return db.inventory.where("bookOrBranchId").equals(bookOrBranchId).toArray();
  }

  async getById(id: string): Promise<Inventory | undefined> {
    return db.inventory.get(id);
  }

  async getByBranch(bookOrBranchId: UnitId): Promise<Inventory[]> {
    return db.inventory.where("bookOrBranchId").equals(bookOrBranchId).toArray();
  }

  async getByBarcode(barcode: string, bookOrBranchId: UnitId): Promise<Inventory | undefined> {
    const all = await this.getByBranch(bookOrBranchId);
    return all.find((p) => p.barcode === barcode);
  }

  async getCategories(bookOrBranchId: UnitId): Promise<string[]> {
    const products = await this.getByBranch(bookOrBranchId);
    const unique = new Set(products.map((p) => p.kategori).filter(Boolean));
    return Array.from(unique).sort();
  }

  async search(query: string, bookOrBranchId: UnitId): Promise<Inventory[]> {
    const all = await this.getByBranch(bookOrBranchId);
    const q = query.toLowerCase();
    return all.filter(
      (p) =>
        p.nama.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        p.sku.toLowerCase().includes(q) ||
        p.kategori.toLowerCase().includes(q)
    );
  }

  async create(data: CreateProductInput, bookOrBranchId: UnitId): Promise<Inventory> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const product: Inventory = {
      id,
      bookOrBranchId,
      unitId: bookOrBranchId,
      sku: data.sku || "",
      barcode: data.barcode || "",
      nama: data.nama || "",
      kategori: data.kategori || "",
      stok: data.stok ?? 0,
      stokMin: data.stokMin ?? 2,
      hargaModal: data.hargaModal ?? 0,
      hargaJual: data.hargaJual ?? 0,
      satuan: data.satuan || "pcs",
      catatan: data.catatan || "",
      fotoUrl: data.fotoUrl || undefined,
      createdAt: now,
      updatedAt: now,
    };
    await db.inventory.add(product);
    return product;
  }

  async update(id: string, data: UpdateProductInput): Promise<void> {
    await db.inventory.update(id, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  }

  async delete(id: string): Promise<void> {
    await db.inventory.delete(id);
  }

  async bulkDelete(ids: string[]): Promise<void> {
    await db.inventory.bulkDelete(ids);
  }

  validate(data: CreateProductInput): ValidationResult {
    if (!data.nama || !data.nama.trim()) {
      return { valid: false, errors: [{ field: "nama", message: "Nama produk harus diisi" }] };
    }
    return validResult();
  }

  toDTO(product: Inventory): ProductDTO {
    const margin = product.hargaModal > 0
      ? Math.round(((product.hargaJual - product.hargaModal) / product.hargaModal) * 100)
      : 0;
    let status: ProductDTO["status"] = "aktif";
    if (product.stok === 0) status = "nonaktif";
    else if (product.stok <= product.stokMin) status = "menipis";

    return {
      id: product.id,
      nama: product.nama,
      sku: product.sku,
      barcode: product.barcode || "",
      kategori: product.kategori,
      hargaModal: product.hargaModal,
      hargaJual: product.hargaJual,
      stok: product.stok,
      stokMin: product.stokMin,
      satuan: product.satuan,
      catatan: product.catatan,
      fotoUrl: product.fotoUrl || "",
      status,
      margin,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  toFormData(product: Inventory): ProductFormData {
    return {
      nama: product.nama,
      sku: product.sku,
      barcode: product.barcode || "",
      kategori: product.kategori,
      hargaModal: product.hargaModal,
      hargaJual: product.hargaJual,
      stok: product.stok,
      stokMin: product.stokMin,
      satuan: product.satuan,
      fotoUrl: product.fotoUrl || "",
      catatan: product.catatan,
    };
  }
}

export const productService = new ProductService();
