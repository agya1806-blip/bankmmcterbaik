import {
  db,
  type UnitId,
  type DbTransaction,
  type DbTransactionItem,
  type DbCashflow,
  type DbWallet,
  type SedekahType,
  PRODUCTION_UNITS,
  MAX_WALLET_PER_UNIT,
  branchPrefix,
  generateInvoiceNumber,
} from "@/lib/db-v4";
import { writeAuditLog } from "@/lib/audit-logger";

/* ─── Input Types ─── */

export interface PosCartItem {
  namaItem: string;
  qty: number;
  hargaSatuan: number;
  hargaModal: number;
  diskonPersen: number;
  spesifikasi: string;
}

export interface PipelineInputV4 {
  id: string;
  bookOrBranchId: UnitId;
  userId: string;
  items: PosCartItem[];
  totalBruto: number;
  diskonGlobalPersen: number;
  ppnPersen: number;
  dpDibayar: number;
  sedekahNominal: number;
  sedekahType: SedekahType;
  paymentMethod: "CASH" | "DEPOSIT" | "TRANSFER" | "QRIS";
  customerNama: string;
  customerWA: string;
  walletIdTarget: string;
  catatan?: string;
  buktiBayar?: string;
}

/* ─── Result Type ─── */

export interface PipelineResultV4 {
  ok: boolean;
  invoiceNumber?: string;
  transactionId?: string;
  error?: string;
}

/* ─── Wallet Limit Check ─── */

async function checkWalletLimit(unitId: UnitId): Promise<{ ok: boolean; error?: string }> {
  const count = await db.wallets
    .where("unitId")
    .equals(unitId)
    .filter((w) => w.isActive)
    .count();
  if (count >= MAX_WALLET_PER_UNIT) {
    return { ok: false, error: `Maksimum ${MAX_WALLET_PER_UNIT} dompet aktif per unit! (${count} sudah terpakai)` };
  }
  return { ok: true };
}

/* ─── Execute Pipeline ─── */

export async function executeTransactionPipelineV4(
  input: PipelineInputV4
): Promise<PipelineResultV4> {
  const {
    id: invId,
    bookOrBranchId,
    userId,
    items,
    totalBruto,
    diskonGlobalPersen,
    ppnPersen,
    dpDibayar,
    sedekahNominal,
    sedekahType,
    paymentMethod,
    customerNama,
    customerWA,
    walletIdTarget,
    catatan,
    buktiBayar,
  } = input;

  if (!items || items.length === 0) {
    return { ok: false, error: "Keranjang belanja kosong!" };
  }

  if (totalBruto <= 0) {
    return { ok: false, error: "Total transaksi harus lebih dari 0!" };
  }

  if (sedekahNominal < 0) {
    return { ok: false, error: "Sedekah tidak boleh negatif!" };
  }

  if (sedekahNominal > totalBruto) {
    return { ok: false, error: "Sedekah tidak boleh melebihi total transaksi!" };
  }

  const unitId = bookOrBranchId as UnitId;

  /* Pre-flight: wallet limit */
  const walletCheck = await checkWalletLimit(unitId);
  if (!walletCheck.ok) {
    return { ok: false, error: walletCheck.error };
  }

  try {
    const prefix = branchPrefix(unitId);
    const invoiceNumber = generateInvoiceNumber(prefix);
    const now = new Date().toISOString();

    /* Step 1: Deduct inventory stock */
    for (const item of items) {
      const product = await db.inventory
        .where("unitId")
        .equals(unitId)
        .filter((p) => p.nama === item.namaItem)
        .first();

      if (product) {
        const newStock = product.stok - item.qty;
        await db.inventory.update(product.id, { stok: Math.max(0, newStock) });

        await db.inventoryMutations.add({
          id: crypto.randomUUID(),
          bookOrBranchId: unitId,
          itemId: product.id,
          tipe: "keluar",
          qty: item.qty,
          stokSebelum: product.stok,
          stokSesudah: Math.max(0, newStock),
          alasan: `Penjualan ${invoiceNumber}`,
          createdAt: now,
        });
      }
    }

    /* Step 2: Build DbTransactionItem[] with diskon per item */
    const txItems: DbTransactionItem[] = items.map((item) => {
      const subtotalSebelumDiskon = item.qty * item.hargaSatuan;
      const diskonNominal = subtotalSebelumDiskon * (item.diskonPersen / 100);
      return {
        id: crypto.randomUUID(),
        namaItem: item.namaItem,
        qty: item.qty,
        hargaSatuan: item.hargaSatuan,
        hargaModal: item.hargaModal,
        diskonPersen: item.diskonPersen,
        subtotal: subtotalSebelumDiskon - diskonNominal,
        spesifikasi: item.spesifikasi,
      };
    });

    /* Step 3: Calculate totals with diskon & PPN */
    const totalDiskonItem = txItems.reduce(
      (sum, item) => sum + item.qty * item.hargaSatuan * (item.diskonPersen / 100),
      0
    );
    const subtotalAfterItemDiskon = totalBruto - totalDiskonItem;
    const totalDiskonGlobal = subtotalAfterItemDiskon * (diskonGlobalPersen / 100);
    const subtotalAfterDiskon = subtotalAfterItemDiskon - totalDiskonGlobal;
    const ppnNominal = subtotalAfterDiskon * (ppnPersen / 100);
    const grandTotal = subtotalAfterDiskon + ppnNominal;
    const sisaTagihan = Math.max(0, grandTotal - dpDibayar);
    const status: DbTransaction["status"] = sisaTagihan > 0 ? "DP" : "LUNAS";

    /* Step 4: Build transaction record */
    const transaction: DbTransaction = {
      id: invId,
      bookOrBranchId: unitId,
      unitId,
      userId,
      invoiceNumber,
      customerNama: customerNama || "Pelanggan Umum",
      customerWA: customerWA || "",
      tanggal: now,
      items: txItems,
      totalBruto,
      diskonGlobalPersen,
      totalDiskonItem,
      totalDiskonGlobal,
      subtotalAfterDiskon,
      ppnPersen,
      ppnNominal,
      grandTotal,
      dpDibayar,
      sisaTagihan,
      sedekahNominal,
      status,
      walletIdTarget,
      catatan: catatan ?? "",
      buktiBayar: buktiBayar || "",
      createdAt: now,
    };

    /* Step 5: Wallet & cashflow updates */
    let saldoSebelum = 0;
    let saldoSesudah = 0;
    let walletNama = "";

    if (walletIdTarget) {
      const wallet = await db.wallets.get(walletIdTarget);
      walletNama = wallet?.namaDompet ?? "";
      saldoSebelum = wallet?.saldo ?? 0;
      saldoSesudah = saldoSebelum + dpDibayar;
    }

    /* Step 6: Production record (if unit requires it) */
    const needsProduction = PRODUCTION_UNITS.includes(unitId);

    /* Step 7: Piutang record (if DP) */
    let piutangRecord = undefined;
    if (status === "DP" && sisaTagihan > 0) {
      const jatuhTempo = new Date();
      jatuhTempo.setDate(jatuhTempo.getDate() + 30);
      piutangRecord = {
        id: crypto.randomUUID(),
        bookOrBranchId: unitId,
        unitId,
        transactionId: invId,
        customerId: "",
        customerNama: customerNama || "Pelanggan Umum",
        customerWA: customerWA || "",
        totalPiutang: grandTotal,
        sisaPiutang: sisaTagihan,
        jatuhTempo: jatuhTempo.toISOString(),
        status: "AKTIF" as const,
        catatan: `Piutang dari ${invoiceNumber}`,
        createdAt: now,
      };
    }

    /* ─── Atomic Write via db.transaction() ─── */
    await db.transaction(
      "rw",
      db.transactions,
      db.cashflows,
      db.wallets,
      db.productions,
      db.piutang,
      async () => {
        /* 4a: Transaction */
        await db.transactions.add(transaction);

        /* 4b: Cashflow entry */
        if (walletIdTarget && dpDibayar > 0) {
          await db.cashflows.add({
            id: crypto.randomUUID(),
            bookOrBranchId: unitId,
            unitId,
            tipe: "masuk",
            kategori: "Penjualan",
            nominal: dpDibayar,
            saldoSebelum,
            saldoSesudah,
            walletId: walletIdTarget,
            walletNama,
            referensiId: invId,
            referensiTipe: "transaction",
            catatan: `Penjualan ${invoiceNumber}`,
            createdAt: now,
          });

          /* 4c: Update wallet saldo */
          await db.wallets.update(walletIdTarget, { saldo: saldoSesudah });
        }

        /* 4d: Production */
        if (needsProduction) {
          await db.productions.add({
            id: crypto.randomUUID(),
            bookOrBranchId: unitId,
            unitId,
            transactionId: invId,
            invoiceNumber,
            status: "antre",
            catatan: "",
            updatedAt: now,
            createdAt: now,
          });
        }

        /* 4e: Piutang */
        if (piutangRecord) {
          await db.piutang.add(piutangRecord);
        }
      }
    );

    /* 4f: Sedekah allocation (outside tx — separate atomic) */
    if (sedekahNominal > 0) {
      const sedekahRecord = await db.sedekahBalances
        .where("bookOrBranchId")
        .equals(unitId)
        .first();
      if (sedekahRecord) {
        const updateField: Record<string, number> = {};
        updateField[sedekahType] = (sedekahRecord[sedekahType] || 0) + sedekahNominal;
        await db.sedekahBalances.update(sedekahRecord.id, updateField);
      }

      /* Sedekah cashflow entry */
      const sedekahWallet = await db.wallets.get(walletIdTarget);
      const sedekahSaldoSebelum = sedekahWallet?.saldo ?? 0;
      const sedekahSaldoSesudah = sedekahSaldoSebelum - sedekahNominal;

      await db.cashflows.add({
        id: crypto.randomUUID(),
        bookOrBranchId: unitId,
        unitId,
        tipe: "keluar",
        kategori: "Sedekah",
        nominal: sedekahNominal,
        saldoSebelum: sedekahSaldoSebelum,
        saldoSesudah: sedekahSaldoSesudah,
        walletId: walletIdTarget,
        walletNama: sedekahWallet?.namaDompet ?? "",
        referensiId: invId,
        referensiTipe: "sedekah",
        catatan: `Sedekah ${invoiceNumber} — ${sedekahType}`,
        createdAt: now,
      });

      /* Deduct from wallet */
      if (walletIdTarget) {
        await db.wallets.update(walletIdTarget, { saldo: sedekahSaldoSesudah });
      }
    }

    /* 5: Audit log (outside tx) */
    await writeAuditLog({
      bookOrBranchId: unitId,
      action: "CREATE",
      entityType: "transaction",
      entityId: invId,
      userId,
      userName: userId,
      dataAfter: JSON.stringify(transaction),
      nominal: grandTotal,
      alasan: `Transaksi ${invoiceNumber} - ${customerNama || "Umum"} - Rp${grandTotal.toLocaleString()} (${status})`,
    });

    return {
      ok: true,
      invoiceNumber,
      transactionId: invId,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: `Pipeline error: ${message}` };
  }
}
