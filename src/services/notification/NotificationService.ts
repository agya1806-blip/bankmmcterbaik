import { db, type UnitId } from "@/lib/db-v4";

export interface INotificationService {
  getDuePiutang(bookOrBranchId: UnitId, daysAhead?: number): Promise<DuePiutangItem[]>;
  getLowStockAlerts(bookOrBranchId: UnitId): Promise<LowStockAlert[]>;
  getOutOfStockAlerts(bookOrBranchId: UnitId): Promise<OutOfStockAlert[]>;
  getSummary(bookOrBranchId: UnitId): Promise<NotificationSummary>;
}

export interface DuePiutangItem {
  id: string;
  customerNama: string;
  sisaPiutang: number;
  jatuhTempo: string;
  daysLeft: number;
}

export interface LowStockAlert {
  productId: string;
  nama: string;
  stok: number;
  stokMin: number;
}

export interface OutOfStockAlert {
  productId: string;
  nama: string;
}

export interface NotificationSummary {
  piutangDueSoon: number;
  stokMenipis: number;
  stokHabis: number;
}

class NotificationService implements INotificationService {
  async getDuePiutang(bookOrBranchId: UnitId, daysAhead = 3): Promise<DuePiutangItem[]> {
    const now = new Date();
    const cutoff = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000).toISOString();
    const piutang = await db.piutang
      .where("bookOrBranchId").equals(bookOrBranchId)
      .filter((p) => p.status === "AKTIF" && p.jatuhTempo <= cutoff)
      .toArray();

    return piutang.map((p) => {
      const daysLeft = Math.ceil(
        (new Date(p.jatuhTempo).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        id: p.id,
        customerNama: p.customerNama,
        sisaPiutang: p.sisaPiutang,
        jatuhTempo: p.jatuhTempo,
        daysLeft,
      };
    });
  }

  async getLowStockAlerts(bookOrBranchId: UnitId): Promise<LowStockAlert[]> {
    const products = await db.inventory.where("bookOrBranchId").equals(bookOrBranchId).toArray();
    return products
      .filter((p) => p.stok <= p.stokMin && p.stok > 0)
      .map((p) => ({ productId: p.id, nama: p.nama, stok: p.stok, stokMin: p.stokMin }));
  }

  async getOutOfStockAlerts(bookOrBranchId: UnitId): Promise<OutOfStockAlert[]> {
    const products = await db.inventory.where("bookOrBranchId").equals(bookOrBranchId).toArray();
    return products
      .filter((p) => p.stok === 0)
      .map((p) => ({ productId: p.id, nama: p.nama }));
  }

  async getSummary(bookOrBranchId: UnitId): Promise<NotificationSummary> {
    const [due, lowStock, outOfStock] = await Promise.all([
      this.getDuePiutang(bookOrBranchId),
      this.getLowStockAlerts(bookOrBranchId),
      this.getOutOfStockAlerts(bookOrBranchId),
    ]);
    return {
      piutangDueSoon: due.length,
      stokMenipis: lowStock.length,
      stokHabis: outOfStock.length,
    };
  }
}

export const notificationService = new NotificationService();
