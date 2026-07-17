import {
  db,
  type UnitId,
  type DbTransaction,
  PRODUCTION_UNITS,
} from "@/lib/db-v4";
import { writeAuditLog } from "@/lib/audit-logger";

/* ─── Cancel Input ─── */

export interface CancelInput {
  transactionId: string;
  unitId: UnitId;
  userId: string;
  userName: string;
  alasan: string;
}

/* ─── Cancel Result ─── */

export interface CancelResult {
  ok: boolean;
  error?: string;
}

/* ─── Execute Cancel/Retur Pipeline ─── */

export async function executeCancelTransaction(
  input: CancelInput
): Promise<CancelResult> {
  const { transactionId, unitId, userId, userName, alasan } = input;

  try {
    /* Fetch transaction */
    const tx = await db.transactions.get(transactionId);
    if (!tx) {
      return { ok: false, error: "Transaksi tidak ditemukan!" };
    }

    if (tx.status === "BATAL") {
      return { ok: false, error: "Transaksi sudah dibatalkan!" };
    }

    const now = new Date().toISOString();

    /* ─── 1. Revert inventory stock (outside tx) ─── */
    for (const item of tx.items) {
      const product = await db.inventory
        .where("unitId")
        .equals(unitId)
        .filter((p) => p.nama === item.namaItem)
        .first();

      if (product) {
        const stokSebelum = product.stok;
        const stokSesudah = stokSebelum + item.qty;
        await db.inventory.update(product.id, { stok: stokSesudah });

        await db.inventoryMutations.add({
          id: crypto.randomUUID(),
          bookOrBranchId: unitId,
          itemId: product.id,
          tipe: "masuk",
          qty: item.qty,
          stokSebelum,
          stokSesudah,
          alasan: `Retur/Batal ${tx.invoiceNumber}`,
          createdAt: now,
        });
      }
    }

    /* ─── 2. Core atomic operations ─── */
    await db.transaction(
      "rw",
      db.transactions,
      db.cashflows,
      db.wallets,
      db.productions,
      db.piutang,
      async () => {
        /* 2a. Revert wallet saldo */
        if (tx.walletIdTarget && tx.dpDibayar > 0) {
          const wallet = await db.wallets.get(tx.walletIdTarget);
          if (wallet) {
            const saldoSebelum = wallet.saldo;
            const saldoSesudah = saldoSebelum - tx.dpDibayar;
            await db.wallets.update(tx.walletIdTarget, { saldo: saldoSesudah });

            await db.cashflows.add({
              id: crypto.randomUUID(),
              bookOrBranchId: unitId,
              unitId,
              tipe: "keluar",
              kategori: "Retur/Batal",
              nominal: tx.dpDibayar,
              saldoSebelum,
              saldoSesudah,
              walletId: tx.walletIdTarget,
              walletNama: wallet.namaDompet,
              referensiId: tx.id,
              referensiTipe: "retur",
              catatan: `Retur/Batal ${tx.invoiceNumber} - ${alasan}`,
              createdAt: now,
            });
          }
        }

        /* 2b. Cancel piutang record */
        const piutang = await db.piutang
          .where("transactionId")
          .equals(tx.id)
          .first();
        if (piutang) {
          await db.piutang.update(piutang.id, { status: "DIHAPUS" });
        }

        /* 2c. Cancel production record */
        if (PRODUCTION_UNITS.includes(unitId)) {
          const production = await db.productions
            .where("transactionId")
            .equals(tx.id)
            .first();
          if (production) {
            await db.productions.update(production.id, { status: "selesai", catatan: "Dibatalkan" });
          }
        }

        /* 2d. Mark transaction as BATAL */
        await db.transactions.update(tx.id, { status: "BATAL" });
      }
    );

    /* ─── 3. Reverse sedekah allocation ─── */
    if ((tx.sedekahNominal || 0) > 0) {
      const sedekahRecord = await db.sedekahBalances
        .where("bookOrBranchId")
        .equals(unitId)
        .first();
      if (sedekahRecord) {
        /* We don't know the sedekahType from old tx, so subtract from zakatMal as default */
        await db.sedekahBalances.update(sedekahRecord.id, {
          zakatMal: Math.max(0, (sedekahRecord.zakatMal || 0) - tx.sedekahNominal),
        });
      }
    }

    /* ─── 4. Audit log (outside tx) ─── */
    await writeAuditLog({
      bookOrBranchId: unitId,
      action: "BATAL",
      entityType: "transaction",
      entityId: tx.id,
      userId,
      userName,
      dataBefore: JSON.stringify(tx),
      nominal: tx.grandTotal,
      alasan: `Batal/Retur ${tx.invoiceNumber}: ${alasan}`,
    });

    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: `Cancel gagal: ${message}` };
  }
}
