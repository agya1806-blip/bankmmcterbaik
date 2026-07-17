import { db, type UnitId, type DbTransaction, type DbTransactionItem, type DbCashflow, type DbAuditLog } from "@/lib/db-v4";
import { writeAuditLog } from "@/lib/audit-logger";

/* ─── Double-Entry Transfer Input ─── */

export interface TransferInput {
  fromBranch: UnitId;
  toBranch: UnitId;
  amount: number;
  description: string;
  userId?: string;
  userName?: string;
}

/* ─── Result ─── */

export interface TransferResult {
  ok: boolean;
  transferId?: string;
  error?: string;
}

/* ─── Execute Double-Entry Transfer ─── */

export async function executeTransfer(input: TransferInput): Promise<TransferResult> {
  const { fromBranch, toBranch, amount, description, userId = "", userName = "" } = input;

  if (fromBranch === toBranch) {
    return { ok: false, error: "Cabang asal dan tujuan tidak boleh sama!" };
  }

  if (amount <= 0) {
    return { ok: false, error: "Jumlah transfer harus lebih dari 0!" };
  }

  try {
    const transferId = crypto.randomUUID();
    const now = new Date().toISOString();

    const outgoingItem: DbTransactionItem = {
      id: crypto.randomUUID(),
      namaItem: `Transfer ke ${toBranch}`,
      qty: 1,
      hargaSatuan: amount,
      hargaModal: 0,
      diskonPersen: 0,
      subtotal: amount,
      spesifikasi: description,
    };

    const incomingItem: DbTransactionItem = {
      id: crypto.randomUUID(),
      namaItem: `Transfer dari ${fromBranch}`,
      qty: 1,
      hargaSatuan: amount,
      hargaModal: 0,
      diskonPersen: 0,
      subtotal: amount,
      spesifikasi: description,
    };

    const sourceTx: DbTransaction = {
      id: transferId,
      bookOrBranchId: fromBranch,
      unitId: fromBranch,
      userId: userId || "system",
      invoiceNumber: `TRF-${Date.now()}`,
      customerNama: `Transfer ke ${toBranch}`,
      customerWA: "",
      tanggal: now,
      items: [outgoingItem],
      totalBruto: amount,
      diskonGlobalPersen: 0,
      totalDiskonItem: 0,
      totalDiskonGlobal: 0,
      subtotalAfterDiskon: amount,
      ppnPersen: 0,
      ppnNominal: 0,
      grandTotal: amount,
      dpDibayar: amount,
      sisaTagihan: 0,
      sedekahNominal: 0,
      status: "LUNAS",
      walletIdTarget: "",
      catatan: description,
      createdAt: now,
    };

    const destTx: DbTransaction = {
      id: crypto.randomUUID(),
      bookOrBranchId: toBranch,
      unitId: toBranch,
      userId: userId || "system",
      invoiceNumber: `TRF-${Date.now()}-IN`,
      customerNama: `Transfer dari ${fromBranch}`,
      customerWA: "",
      tanggal: now,
      items: [incomingItem],
      totalBruto: amount,
      diskonGlobalPersen: 0,
      totalDiskonItem: 0,
      totalDiskonGlobal: 0,
      subtotalAfterDiskon: amount,
      ppnPersen: 0,
      ppnNominal: 0,
      grandTotal: amount,
      dpDibayar: amount,
      sisaTagihan: 0,
      sedekahNominal: 0,
      status: "LUNAS",
      walletIdTarget: "",
      catatan: description,
      createdAt: now,
    };

    /* Step 1: Fetch wallets */
    const sourceWallets = await db.wallets.where("bookOrBranchId").equals(fromBranch).filter(w => w.isActive).toArray();
    const sourceWallet = sourceWallets[0];
    const sourceSaldoSebelum = sourceWallet?.saldo ?? 0;
    const sourceSaldoSesudah = sourceSaldoSebelum - amount;

    const destWallets = await db.wallets.where("bookOrBranchId").equals(toBranch).filter(w => w.isActive).toArray();
    const destWallet = destWallets[0];
    const destSaldoSebelum = destWallet?.saldo ?? 0;
    const destSaldoSesudah = destSaldoSebelum + amount;

    /* ─── Atomic Write ─── */
    await db.transaction(
      "rw",
      db.transactions,
      db.cashflows,
      db.wallets,
      async () => {
        /* 2a: Outgoing cashflow */
        await db.cashflows.add({
          id: crypto.randomUUID(),
          bookOrBranchId: fromBranch,
          unitId: fromBranch,
          tipe: "keluar",
          kategori: "Transfer_Keluar",
          nominal: amount,
          saldoSebelum: sourceSaldoSebelum,
          saldoSesudah: sourceSaldoSesudah,
          walletId: sourceWallet?.id ?? "",
          walletNama: sourceWallet?.namaDompet ?? "",
          referensiId: transferId,
          referensiTipe: "adjustment",
          catatan: `[TRANSFER] ${description} → ${toBranch}`,
          createdAt: now,
        });

        /* 2b: Update source wallet */
        if (sourceWallet) {
          await db.wallets.update(sourceWallet.id, { saldo: sourceSaldoSesudah });
        }

        /* 2c: Incoming cashflow */
        await db.cashflows.add({
          id: crypto.randomUUID(),
          bookOrBranchId: toBranch,
          unitId: toBranch,
          tipe: "masuk",
          kategori: "Transfer_Masuk",
          nominal: amount,
          saldoSebelum: destSaldoSebelum,
          saldoSesudah: destSaldoSesudah,
          walletId: destWallet?.id ?? "",
          walletNama: destWallet?.namaDompet ?? "",
          referensiId: transferId,
          referensiTipe: "adjustment",
          catatan: `[TRANSFER] ${description} ← ${fromBranch}`,
          createdAt: now,
        });

        /* 2d: Update dest wallet */
        if (destWallet) {
          await db.wallets.update(destWallet.id, { saldo: destSaldoSesudah });
        }

        /* 2e: Create transaction records */
        await db.transactions.add(sourceTx);
        await db.transactions.add(destTx);
      }
    );

    /* Step 3: Audit logs (outside tx) */
    await writeAuditLog({
      bookOrBranchId: fromBranch,
      action: "TRANSFER_KELUAR",
      entityType: "transfer",
      entityId: transferId,
      userId,
      userName,
      nominal: amount,
      alasan: `Transfer keluar Rp${amount.toLocaleString()} ke ${toBranch}: ${description}`,
    });

    await writeAuditLog({
      bookOrBranchId: toBranch,
      action: "TRANSFER_MASUK",
      entityType: "transfer",
      entityId: transferId,
      userId,
      userName,
      nominal: amount,
      alasan: `Transfer masuk Rp${amount.toLocaleString()} dari ${fromBranch}: ${description}`,
    });

    return { ok: true, transferId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: `Transfer gagal: ${message}` };
  }
}
