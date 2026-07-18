import { db, type UnitId } from "@/lib/db-v4";
import { showToast } from "@/lib/toast";

export interface IBackupService {
  createBackup(): Promise<BackupData>;
  restoreBackup(data: BackupData): Promise<void>;
  exportToJSON(bookOrBranchId?: UnitId): Promise<string>;
  importFromJSON(json: string): Promise<void>;
}

export interface BackupData {
  version: number;
  createdAt: string;
  tables: Record<string, unknown[]>;
}

const TABLE_NAMES = [
  "transactions", "cashflows", "piutang", "piutangInstallments",
  "inventory", "inventoryMutations", "customers", "wallets",
  "walletMutations", "auditLogs", "productions", "suppliers",
  "purchaseOrders", "budgets", "labels", "labelTags",
  "quickOrders", "sedekahBalances", "profiles", "users",
  "periods", "recurringTemplates", "exchangeRates",
] as const;

class BackupService implements IBackupService {
  async createBackup(): Promise<BackupData> {
    const tables: Record<string, unknown[]> = {};
    for (const name of TABLE_NAMES) {
      tables[name] = await (db as any)[name].toArray();
    }
    return { version: 7, createdAt: new Date().toISOString(), tables };
  }

  async restoreBackup(data: BackupData): Promise<void> {
    for (const name of TABLE_NAMES) {
      const items = data.tables[name];
      if (items && items.length > 0) {
        await (db as any)[name].clear();
        await (db as any)[name].bulkAdd(items);
      }
    }
  }

  async exportToJSON(bookOrBranchId?: UnitId): Promise<string> {
    const backup = await this.createBackup();
    if (bookOrBranchId) {
      const filtered: Record<string, unknown[]> = {};
      for (const [name, items] of Object.entries(backup.tables)) {
        filtered[name] = (items as any[]).filter(
          (item: any) => item.bookOrBranchId === bookOrBranchId
        );
      }
      backup.tables = filtered;
    }
    return JSON.stringify(backup, null, 2);
  }

  async importFromJSON(json: string): Promise<void> {
    const data = JSON.parse(json) as BackupData;
    await this.restoreBackup(data);
  }
}

export const backupService = new BackupService();
