import {
  db,
  type UnitId,
  type BookOrBranch,
  type DbWallet,
  type DbTransaction,
  type DbCashflow,
  type DbPiutang,
  type DbInventoryItem,
  ALL_UNITS,
  POS_UNITS,
  NON_BIZ_UNITS,
  MAX_WALLET_PER_UNIT,
} from "@/lib/db-v4";

/* ───────────────────────────────────────────────────────── */
/* UNIT FILTERING                                           */
/* ───────────────────────────────────────────────────────── */

/** Check if a BookOrBranch is GLOBAL mode */
export function isGlobal(bookOrBranchId: BookOrBranch): boolean {
  return bookOrBranchId === "GLOBAL";
}

/** Get all unitIds visible for a given bookOrBranchId */
export function getVisibleUnits(bookOrBranchId: BookOrBranch): UnitId[] {
  if (isGlobal(bookOrBranchId)) return ALL_UNITS;
  return [bookOrBranchId as UnitId];
}

/* ───────────────────────────────────────────────────────── */
/* WALLET QUERIES                                           */
/* ───────────────────────────────────────────────────────── */

/** Get active wallets for a unit (or all if GLOBAL) */
export async function getWallets(
  bookOrBranchId: BookOrBranch
): Promise<DbWallet[]> {
  const units = getVisibleUnits(bookOrBranchId);
  const wallets = await db.wallets
    .where("unitId")
    .anyOf(units)
    .filter((w) => w.isActive)
    .toArray();
  return wallets;
}

/** Get active wallets for a unit (synchronous, for useLiveQuery) */
export function queryWallets(bookOrBranchId: BookOrBranch) {
  const units = getVisibleUnits(bookOrBranchId);
  return db.wallets.where("unitId").anyOf(units).filter((w) => w.isActive).toArray();
}

/** Check if unit has room for more wallets */
export async function canAddWallet(unitId: UnitId): Promise<{ ok: boolean; count: number; max: number }> {
  const count = await db.wallets
    .where("unitId")
    .equals(unitId)
    .filter((w) => w.isActive)
    .count();
  return {
    ok: count < MAX_WALLET_PER_UNIT,
    count,
    max: MAX_WALLET_PER_UNIT,
  };
}

/** Get total saldo across all wallets for a unit */
export async function getTotalSaldo(bookOrBranchId: BookOrBranch): Promise<number> {
  const wallets = await getWallets(bookOrBranchId);
  return wallets.reduce((sum, w) => sum + w.saldo, 0);
}

/* ───────────────────────────────────────────────────────── */
/* TRANSACTION QUERIES                                      */
/* ───────────────────────────────────────────────────────── */

/** Query transactions for a unit (or all if GLOBAL) */
export function queryTransactions(bookOrBranchId: BookOrBranch) {
  const units = getVisibleUnits(bookOrBranchId);
  return db.transactions.where("unitId").anyOf(units).reverse().sortBy("createdAt");
}

/** Get filtered transactions */
export async function getTransactions(
  bookOrBranchId: BookOrBranch,
  opts?: {
    status?: DbTransaction["status"];
    from?: string;
    to?: string;
    customerId?: string;
  }
): Promise<DbTransaction[]> {
  const units = getVisibleUnits(bookOrBranchId);
  let txs = await db.transactions.where("unitId").anyOf(units).toArray();

  if (opts?.status) txs = txs.filter((t) => t.status === opts!.status);
  if (opts?.from) txs = txs.filter((t) => t.tanggal >= opts!.from!);
  if (opts?.to) txs = txs.filter((t) => t.tanggal <= opts!.to!);
  if (opts?.customerId) txs = txs.filter((t) => t.customerId === opts!.customerId);

  return txs.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
}

/* ───────────────────────────────────────────────────────── */
/* CASHFLOW QUERIES                                         */
/* ───────────────────────────────────────────────────────── */

/** Query cashflows for a unit (or all if GLOBAL) */
export function queryCashflows(bookOrBranchId: BookOrBranch) {
  const units = getVisibleUnits(bookOrBranchId);
  return db.cashflows.where("unitId").anyOf(units).reverse().sortBy("createdAt");
}

/* ───────────────────────────────────────────────────────── */
/* PIUTANG QUERIES                                          */
/* ───────────────────────────────────────────────────────── */

/** Query piutang for a unit (or all if GLOBAL) */
export function queryPiutang(bookOrBranchId: BookOrBranch) {
  const units = getVisibleUnits(bookOrBranchId);
  return db.piutang.where("unitId").anyOf(units).toArray();
}

/** Get active piutang for a unit */
export async function getActivePiutang(bookOrBranchId: BookOrBranch): Promise<DbPiutang[]> {
  const all = await queryPiutang(bookOrBranchId);
  return all.filter((p) => p.status === "AKTIF");
}

/* ───────────────────────────────────────────────────────── */
/* INVENTORY QUERIES                                        */
/* ───────────────────────────────────────────────────────── */

/** Query inventory for a unit (or all if GLOBAL) */
export function queryInventory(bookOrBranchId: BookOrBranch) {
  const units = getVisibleUnits(bookOrBranchId);
  return db.inventory.where("unitId").anyOf(units).toArray();
}

/** Get low-stock items */
export async function getLowStockItems(bookOrBranchId: BookOrBranch): Promise<DbInventoryItem[]> {
  const items = await queryInventory(bookOrBranchId);
  return items.filter((i) => i.stok <= i.stokMin && i.stok > 0);
}

/** Get out-of-stock items */
export async function getOutOfStockItems(bookOrBranchId: BookOrBranch): Promise<DbInventoryItem[]> {
  const items = await queryInventory(bookOrBranchId);
  return items.filter((i) => i.stok === 0);
}

/* ───────────────────────────────────────────────────────── */
/* ACCOUNTING (Laba Bersih)                                 */
/* ───────────────────────────────────────────────────────── */

/** 
 * Hitung laba bersih sesuai rumus akuntansi:
 * - totalPendapatan = Σ(grandTotal - sedekahNominal) WHERE status LUNAS/DP
 * - totalHpp = Σ(item.hargaModal × item.qty)
 * - labaKotor = totalPendapatan - totalHpp
 * - totalPengeluaranOperasional = Σ(cf keluar WHERE kategori NOT IN ("HPP","Retur/Batal","Transfer_Keluar"))
 * - labaBersih = labaKotor - totalPengeluaranOperasional
 */
export async function computeLabaBersih(bookOrBranchId: BookOrBranch) {
  const units = getVisibleUnits(bookOrBranchId);

  const txs = await db.transactions
    .where("unitId")
    .anyOf(units)
    .toArray();

  const cfs = await db.cashflows
    .where("unitId")
    .anyOf(units)
    .toArray();

  /* Pendapatan bersih (exclude transfers & sedekah) */
  let totalPendapatan = 0;
  let totalHpp = 0;

  const EXCLUDE_CF_KATEGORI = new Set(["HPP", "Retur/Batal", "Transfer_Keluar"]);

  for (const tx of txs) {
    if (tx.status === "BATAL") continue;
    const pendapatanBersih = tx.grandTotal - (tx.sedekahNominal || 0);
    if (tx.status === "LUNAS") {
      totalPendapatan += pendapatanBersih;
    } else if (tx.status === "DP") {
      totalPendapatan += tx.dpDibayar;
    }
    for (const item of tx.items) {
      totalHpp += (item.hargaModal || 0) * item.qty;
    }
  }

  const labaKotor = totalPendapatan - totalHpp;

  /* Pengeluaran operasional (exclude HPP, retur, transfer) */
  const pengeluaranOperasional = cfs
    .filter((cf) => cf.tipe === "keluar" && !EXCLUDE_CF_KATEGORI.has(cf.kategori))
    .reduce((sum, cf) => sum + cf.nominal, 0);

  const labaBersih = labaKotor - pengeluaranOperasional;

  return {
    totalPendapatan,
    totalHpp,
    labaKotor,
    pengeluaranOperasional,
    labaBersih,
    totalTransaksi: txs.filter((t) => t.status !== "BATAL").length,
    totalTransaksiLunas: txs.filter((t) => t.status === "LUNAS").length,
    totalTransaksiDP: txs.filter((t) => t.status === "DP").length,
    totalPiutang: cfs.filter((c) => c.tipe === "masuk").reduce((s, c) => s + c.nominal, 0),
    totalCashflowKeluar: pengeluaranOperasional,
  };
}

/* ───────────────────────────────────────────────────────── */
/* PER-UNIT SUMMARY                                         */
/* ───────────────────────────────────────────────────────── */

export interface UnitSummary {
  unitId: UnitId;
  label: string;
  totalPendapatan: number;
  totalHpp: number;
  labaKotor: number;
  labaBersih: number;
  jumlahTransaksi: number;
  jumlahProduk: number;
  stokMenipis: number;
  totalPiutang: number;
}

/** Get summary for all units (used by GLOBAL dashboard) */
export async function getAllUnitSummaries(): Promise<UnitSummary[]> {
  const summaries: UnitSummary[] = [];

  for (const unitId of POS_UNITS) {
    const labData = await computeLabaBersih(unitId);
    const inv = await queryInventory(unitId);
    const stokMenipis = inv.filter((i) => i.stok <= i.stokMin && i.stok > 0).length;
    const piutang = await getActivePiutang(unitId);

    summaries.push({
      unitId,
      label: unitId.replace("usaha-", ""),
      totalPendapatan: labData.totalPendapatan,
      totalHpp: labData.totalHpp,
      labaKotor: labData.labaKotor,
      labaBersih: labData.labaBersih,
      jumlahTransaksi: labData.totalTransaksi,
      jumlahProduk: inv.length,
      stokMenipis,
      totalPiutang: piutang.reduce((s, p) => s + p.sisaPiutang, 0),
    });
  }

  return summaries;
}
