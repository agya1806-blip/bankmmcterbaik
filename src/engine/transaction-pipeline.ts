import { mmcDB, type MmcTransaction, type MmcTransactionItem, type MmcCustomer, type BizUnit } from "@/lib/db/mmcbank-db";

export interface PipelineInput {
  id: string;
  unit: BizUnit;
  tanggal: string;
  items: MmcTransactionItem[];
  totalBruto: number;
  dpDibayar: number;
  walletIdTarget: string;
  customer?: { nama: string; noWA: string };
  label?: string;
  labelColor?: string;
  jatuhTempo?: string;
  inventoryLinks?: { itemId: string; qtyDipotong: number }[];
  bahanBakuLinks?: { inventoryId: string; gramDipotong: number }[];
}

export interface PipelineResult {
  ok: boolean;
  transactionId: string;
  customerId?: string;
  piutangId?: string;
  error?: string;
}

async function findOrCreateCustomer(data: { nama: string; noWA: string }): Promise<string> {
  const wa = data.noWA.trim();
  if (wa) {
    const existing = await mmcDB.customers.where("noWA").equals(wa).first();
    if (existing) return existing.id;
  }
  const id = crypto.randomUUID();
  const now = Date.now();
  await mmcDB.customers.add({
    id, nama: data.nama, noWA: wa, totalBelanja: 0, poin: 0, terakhirTransaksi: now,
  });
  return id;
}

async function updateCustomerMetrics(customerId: string, nominal: number) {
  const cust = await mmcDB.customers.get(customerId);
  if (!cust) return;
  const poinBertambah = Math.floor(nominal * 0.01);
  await mmcDB.customers.update(customerId, {
    totalBelanja: cust.totalBelanja + nominal,
    poin: cust.poin + poinBertambah,
    terakhirTransaksi: Date.now(),
  });
}

async function cutInventoryStock(links: { itemId: string; qtyDipotong: number }[]) {
  for (const link of links) {
    const item = await mmcDB.inventory.get(link.itemId);
    if (!item) continue;
    const stokSebelum = item.stok;
    const stokSesudah = Math.max(stokSebelum - link.qtyDipotong, 0);
    await mmcDB.inventory.update(link.itemId, { stok: stokSesudah });
    await mmcDB.inventoryMutations.add({
      id: crypto.randomUUID(),
      itemId: link.itemId,
      tipe: "keluar",
      qty: link.qtyDipotong,
      stokSebelum,
      stokSesudah,
      alasan: "Transaksi POS",
      createdAt: Date.now(),
    });
  }
}

async function cutBahanBakuStock(links: { inventoryId: string; gramDipotong: number }[]) {
  for (const link of links) {
    const item = await mmcDB.inventory.get(link.inventoryId);
    if (!item) continue;
    const stokSebelum = item.stok;
    const stokSesudah = Math.max(stokSebelum - link.gramDipotong, 0);
    await mmcDB.inventory.update(link.inventoryId, { stok: stokSesudah });
    await mmcDB.inventoryMutations.add({
      id: crypto.randomUUID(),
      itemId: link.inventoryId,
      tipe: "keluar",
      qty: link.gramDipotong,
      stokSebelum,
      stokSesudah,
      alasan: "Resep bahan baku",
      createdAt: Date.now(),
    });
  }
}

async function updateWalletBalance(walletId: string, nominal: number) {
  const wallet = await mmcDB.wallets.get(walletId);
  if (!wallet) return;
  await mmcDB.wallets.update(walletId, { saldo: wallet.saldo + nominal });
}

async function createPiutang(data: {
  transactionId: string; customerId: string; sisaPiutang: number; jatuhTempo: string;
}): Promise<string> {
  const id = crypto.randomUUID();
  await mmcDB.piutang.add({
    id,
    transactionId: data.transactionId,
    customerId: data.customerId,
    totalPiutang: data.sisaPiutang,
    sisaPiutang: data.sisaPiutang,
    jatuhTempo: data.jatuhTempo,
    status: "BELUM_LUNAS",
  });
  return id;
}

function defaultJatuhTempo(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
}

/* ─── Main Pipeline ─── */

export async function executeTransactionPipeline(input: PipelineInput): Promise<PipelineResult> {
  try {
    return await mmcDB.transaction("rw", [
      mmcDB.wallets,
      mmcDB.inventory,
      mmcDB.inventoryMutations,
      mmcDB.customers,
      mmcDB.transactions,
      mmcDB.piutang,
    ], async () => {
      /* 1. Cut inventory stock */
      if (input.inventoryLinks?.length) {
        await cutInventoryStock(input.inventoryLinks);
      }

      /* 1b. Cut bahan baku stock (warkop recipes) */
      if (input.bahanBakuLinks?.length) {
        await cutBahanBakuStock(input.bahanBakuLinks);
      }

      /* 2. Find or create customer */
      let customerId: string | undefined;
      if (input.customer) {
        customerId = await findOrCreateCustomer(input.customer);
      }

      /* 3. Save transaction */
      const sisaTagihan = Math.max(input.totalBruto - input.dpDibayar, 0);
      const status = sisaTagihan <= 0 ? "LUNAS" : "DIPROSES";

      const transaction: MmcTransaction = {
        id: input.id,
        customerId,
        unit: input.unit,
        tanggal: input.tanggal,
        totalBruto: input.totalBruto,
        dpDibayar: input.dpDibayar,
        sisaTagihan,
        status,
        walletIdTarget: input.walletIdTarget,
        items: input.items,
        label: input.label || "",
        labelColor: input.labelColor || "",
      };
      await mmcDB.transactions.add(transaction);

      /* 4. Update wallet balance */
      const nominalWallet = input.dpDibayar > 0 ? input.dpDibayar : input.totalBruto;
      await updateWalletBalance(input.walletIdTarget, nominalWallet);

      /* 5. Update customer metrics */
      if (customerId) {
        await updateCustomerMetrics(customerId, input.totalBruto);
      }

      /* 6. Auto-create piutang if sisa > 0 */
      let piutangId: string | undefined;
      if (sisaTagihan > 0 && customerId) {
        piutangId = await createPiutang({
          transactionId: input.id,
          customerId,
          sisaPiutang: sisaTagihan,
          jatuhTempo: input.jatuhTempo || defaultJatuhTempo(),
        });
      }

      return { ok: true, transactionId: input.id, customerId, piutangId };
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, transactionId: input.id, error: message };
  }
}
