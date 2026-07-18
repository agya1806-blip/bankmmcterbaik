import { db, type UnitId } from "@/lib/db-v4";
import { transactionService } from "@/services/transaction";
import { cashflowService } from "@/services/cashflow";

export interface IReportService {
  getLabaRugi(bookOrBranchId: UnitId): Promise<LabaRugiReport>;
  getPenjualanPerKategori(bookOrBranchId: UnitId): Promise<KategoriSummary[]>;
  getStokReport(bookOrBranchId: UnitId): Promise<StokReport>;
}

export interface LabaRugiReport {
  totalPendapatan: number;
  totalHpp: number;
  labaKotor: number;
  totalPengeluaran: number;
  labaBersih: number;
  totalTransaksi: number;
}

export interface KategoriSummary {
  kategori: string;
  total: number;
  qty: number;
}

export interface StokReport {
  totalProduk: number;
  totalNilaiStok: number;
  stokMenipis: number;
  stokHabis: number;
}

class ReportService implements IReportService {
  async getLabaRugi(bookOrBranchId: UnitId): Promise<LabaRugiReport> {
    const transaksi = await transactionService.getAll(bookOrBranchId);
    const cashflows = await cashflowService.getAll(bookOrBranchId);

    let totalPendapatan = 0;
    let totalHpp = 0;

    for (const tx of transaksi) {
      if (tx.status === "BATAL") continue;
      totalPendapatan += tx.grandTotal - (tx.sedekahNominal || 0);
      for (const item of tx.items) {
        totalHpp += (item.hargaModal || 0) * item.qty;
      }
    }

    const labaKotor = totalPendapatan - totalHpp;
    const EXCLUDE_KATEGORI = new Set(["HPP", "Retur/Batal", "Transfer_Keluar"]);
    const totalPengeluaran = cashflows
      .filter((cf) => cf.tipe === "keluar" && !EXCLUDE_KATEGORI.has(cf.kategori))
      .reduce((sum, cf) => sum + cf.nominal, 0);
    const labaBersih = labaKotor - totalPengeluaran;

    return {
      totalPendapatan,
      totalHpp,
      labaKotor,
      totalPengeluaran,
      labaBersih,
      totalTransaksi: transaksi.filter((t) => t.status !== "BATAL").length,
    };
  }

  async getPenjualanPerKategori(bookOrBranchId: UnitId): Promise<KategoriSummary[]> {
    const transaksi = await transactionService.getAll(bookOrBranchId);
    const map = new Map<string, { total: number; qty: number }>();

    for (const tx of transaksi) {
      if (tx.status === "BATAL") continue;
      for (const item of tx.items) {
        const key = item.namaItem || "Umum";
        const existing = map.get(key) || { total: 0, qty: 0 };
        existing.total += item.subtotal;
        existing.qty += item.qty;
        map.set(key, existing);
      }
    }

    return Array.from(map.entries())
      .map(([kategori, v]) => ({ kategori, total: v.total, qty: v.qty }))
      .sort((a, b) => b.total - a.total);
  }

  async getStokReport(bookOrBranchId: UnitId): Promise<StokReport> {
    const products = await db.inventory.where("bookOrBranchId").equals(bookOrBranchId).toArray();
    return {
      totalProduk: products.length,
      totalNilaiStok: products.reduce((sum, p) => sum + p.hargaModal * p.stok, 0),
      stokMenipis: products.filter((p) => p.stok <= p.stokMin && p.stok > 0).length,
      stokHabis: products.filter((p) => p.stok === 0).length,
    };
  }
}

export const reportService = new ReportService();
