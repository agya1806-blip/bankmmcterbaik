import { db, type BookOrBranch, type DbTransaction, type DbTransactionItem } from "@/lib/db-v4";
import { writeAuditLog } from "@/lib/audit-logger";

export interface PipelineInputV4 {
  id: string;
  bookOrBranchId: BookOrBranch;
  invoiceNumber: string;
  tanggal: string;
  items: DbTransactionItem[];
  totalBruto: number;
  dpDibayar: number;
  walletIdTarget: string;
  customerNama: string;
  customerWA: string;
  catatan?: string;
  jatuhTempo?: string;
  inventoryLinks?: { itemId: string; qtyDipotong: number }[];
  userId?: string;
  userName?: string;
  poinDigunakan?: number;
  originalCustomerBranch?: BookOrBranch;
}

export interface PipelineResultV4 {
  ok: boolean;
  transactionId: string;
  customerId?: string;
  piutangId?: string;
  poinTerpakai?: number;
  error?: string;
}

async function findOrCreateCustomer(branch: BookOrBranch, nama: string, wa: string): Promise<string> {
  const existing = await db.customers
    .where("[bookOrBranchId+noWA]")
    .equals([branch, wa])
    .first();
  if (existing) return existing.id;

  const id = crypto.randomUUID();
  await db.customers.add({
    id,
    bookOrBranchId: branch,
    nama,
    noWA: wa,
    totalTransaksi: 0,
    totalBelanja: 0,
    poin: 0,
    terakhirTransaksi: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  });
  return id;
}

async function findCustomerCrossBranch(noWA: string): Promise<{ id: string; bookOrBranchId: BookOrBranch; poin: number } | null> {
  const all = await db.customers
    .where("noWA")
    .equals(noWA)
    .toArray();
  if (all.length === 0) return null;
  const withPoin = all.filter((c) => c.poin > 0).sort((a, b) => b.poin - a.poin);
  return withPoin.length > 0 ? withPoin[0] : all[0];
}

async function usePoinCustomer(customerId: string, poinDigunakan: number) {
  const cust = await db.customers.get(customerId);
  if (!cust || cust.poin < poinDigunakan) return;
  await db.customers.update(customerId, { poin: cust.poin - poinDigunakan });
}

export async function cutInventoryStock(branch: BookOrBranch, links: { itemId: string; qtyDipotong: number }[]) {
  for (const link of links) {
    const item = await db.inventory.get(link.itemId);
    if (!item) continue;
    const stokSebelum = item.stok;
    const stokSesudah = Math.max(stokSebelum - link.qtyDipotong, 0);
    await db.inventory.update(link.itemId, { stok: stokSesudah });
    await db.inventoryMutations.add({
      id: crypto.randomUUID(),
      bookOrBranchId: branch,
      itemId: link.itemId,
      tipe: "keluar",
      qty: link.qtyDipotong,
      stokSebelum,
      stokSesudah,
      alasan: "Transaksi POS",
      createdAt: new Date().toISOString(),
    });
  }
}

export async function updateCustomerMetrics(customerId: string, nominal: number, poinBertambah: number) {
  const cust = await db.customers.get(customerId);
  if (!cust) return;
  await db.customers.update(customerId, {
    totalTransaksi: (cust.totalTransaksi ?? 0) + 1,
    totalBelanja: (cust.totalBelanja ?? 0) + nominal,
    poin: (cust.poin ?? 0) + poinBertambah,
    terakhirTransaksi: new Date().toISOString(),
  });
}

async function updateWalletBalance(walletId: string, nominal: number) {
  const wallet = await db.wallets.get(walletId);
  if (!wallet) return;
  await db.wallets.update(walletId, { saldo: wallet.saldo + nominal });
}

async function createPiutang(data: {
  branch: BookOrBranch;
  transactionId: string;
  customerId: string;
  customerNama: string;
  customerWA: string;
  sisaPiutang: number;
  jatuhTempo: string;
}): Promise<string> {
  const id = crypto.randomUUID();
  await db.piutang.add({
    id,
    bookOrBranchId: data.branch,
    transactionId: data.transactionId,
    customerId: data.customerId,
    customerNama: data.customerNama,
    customerWA: data.customerWA,
    totalPiutang: data.sisaPiutang,
    sisaPiutang: data.sisaPiutang,
    jatuhTempo: data.jatuhTempo,
    status: "AKTIF",
    catatan: "",
    createdAt: new Date().toISOString(),
  });
  return id;
}

function defaultJatuhTempo(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
}

export async function executeTransactionPipelineV4(input: PipelineInputV4): Promise<PipelineResultV4> {
  try {
    return await db.transaction("rw", [
      db.wallets,
      db.inventory,
      db.inventoryMutations,
      db.customers,
      db.transactions,
      db.piutang,
      db.auditLogs,
    ], async () => {
      const branch = input.bookOrBranchId;
      let poinTerpakai = 0;
      let customerId: string | undefined;

      /* 0. Cross-branch poin redemption */
      if (input.poinDigunakan && input.poinDigunakan > 0 && input.customerWA) {
        const crossCust = await findCustomerCrossBranch(input.customerWA);
        if (crossCust && crossCust.poin >= input.poinDigunakan) {
          await usePoinCustomer(crossCust.id, input.poinDigunakan);
          poinTerpakai = input.poinDigunakan;
        }
      }

      /* 1. Cut inventory stock */
      if (input.inventoryLinks?.length) {
        await cutInventoryStock(branch, input.inventoryLinks);
      }

      /* 2. Find or create customer */
      if (input.customerNama.trim()) {
        customerId = await findOrCreateCustomer(branch, input.customerNama, input.customerWA);
      }

      /* 3. Save transaction */
      const sisaTagihan = Math.max(input.totalBruto - input.dpDibayar, 0);
      const status = sisaTagihan <= 0 ? "LUNAS" : "DP";

      const transaction: DbTransaction = {
        id: input.id,
        bookOrBranchId: branch,
        invoiceNumber: input.invoiceNumber,
        customerId,
        customerNama: input.customerNama,
        customerWA: input.customerWA,
        tanggal: input.tanggal,
        items: input.items,
        totalBruto: input.totalBruto,
        dpDibayar: input.dpDibayar,
        sisaTagihan,
        status,
        walletIdTarget: input.walletIdTarget,
        catatan: input.catatan ?? "",
        createdAt: new Date().toISOString(),
      };
      await db.transactions.add(transaction);

      /* 4. Update wallet balance */
      const nominalWallet = input.dpDibayar > 0 ? input.dpDibayar : input.totalBruto;
      await updateWalletBalance(input.walletIdTarget, nominalWallet);

      /* 5. Update customer metrics */
      if (customerId) {
        const poinBertambah = input.poinDigunakan ? 0 : Math.floor(input.totalBruto * 0.01);
        await updateCustomerMetrics(customerId, input.totalBruto, poinBertambah);
      }

      /* 6. Auto-create piutang if sisa > 0 */
      let piutangId: string | undefined;
      if (sisaTagihan > 0 && customerId) {
        piutangId = await createPiutang({
          branch,
          transactionId: input.id,
          customerId,
          customerNama: input.customerNama,
          customerWA: input.customerWA,
          sisaPiutang: sisaTagihan,
          jatuhTempo: input.jatuhTempo || defaultJatuhTempo(),
        });
      }

      /* 7. Audit log */
      if (input.userId) {
        await writeAuditLog({
          bookOrBranchId: branch,
          action: "CREATE",
          entityType: "transaction",
          entityId: input.id,
          userId: input.userId,
          userName: input.userName ?? "System",
          dataAfter: transaction,
          nominal: input.totalBruto,
          alasan: input.catatan ?? "Transaksi POS",
        });
      }

      return { ok: true, transactionId: input.id, customerId, piutangId, poinTerpakai };
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, transactionId: input.id, error: message };
  }
}
