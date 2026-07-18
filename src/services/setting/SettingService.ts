import { db, type UnitId, type DbProfile } from "@/lib/db-v4";

export interface ISettingService {
  getProfile(bookOrBranchId: UnitId): Promise<DbProfile | undefined>;
  upsertProfile(data: UpsertProfileInput, bookOrBranchId: UnitId): Promise<void>;
  resetBranchData(bookOrBranchId: UnitId): Promise<void>;
}

export interface UpsertProfileInput {
  namaUsaha?: string;
  logoUrl?: string;
  alamat?: string;
  noWhatsapp?: string;
  slogan?: string;
  subLayanan?: string[];
}

class SettingService implements ISettingService {
  async getProfile(bookOrBranchId: UnitId): Promise<DbProfile | undefined> {
    const profiles = await db.profiles.where("bookOrBranchId").equals(bookOrBranchId).toArray();
    return profiles[0];
  }

  async upsertProfile(data: UpsertProfileInput, bookOrBranchId: UnitId): Promise<void> {
    const existing = await this.getProfile(bookOrBranchId);
    if (existing) {
      await db.profiles.update(existing.id, { ...data, updatedAt: new Date().toISOString() });
    } else {
      await db.profiles.add({
        id: crypto.randomUUID(),
        bookOrBranchId,
        namaUsaha: data.namaUsaha || "",
        logoUrl: data.logoUrl || "",
        alamat: data.alamat || "",
        noWhatsapp: data.noWhatsapp || "",
        slogan: data.slogan || "",
        subLayanan: data.subLayanan || [],
        updatedAt: new Date().toISOString(),
      });
    }
  }

  async resetBranchData(bookOrBranchId: UnitId): Promise<void> {
    await db.transactions.where("bookOrBranchId").equals(bookOrBranchId).delete();
    await db.cashflows.where("bookOrBranchId").equals(bookOrBranchId).delete();
    await db.piutang.where("bookOrBranchId").equals(bookOrBranchId).delete();
    await db.piutangInstallments.where("bookOrBranchId").equals(bookOrBranchId).delete();
    await db.inventoryMutations.where("bookOrBranchId").equals(bookOrBranchId).delete();
    await db.walletMutations.where("bookOrBranchId").equals(bookOrBranchId).delete();
    await db.productions.where("bookOrBranchId").equals(bookOrBranchId).delete();
    const wallets = await db.wallets.where("bookOrBranchId").equals(bookOrBranchId).toArray();
    for (const w of wallets) {
      await db.wallets.update(w.id, { saldo: 0 });
    }
  }
}

export const settingService = new SettingService();
