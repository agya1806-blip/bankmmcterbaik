import { db, type BookOrBranch, type DbTransaction, type DbTransactionItem, type DbCashflow, type DbAuditLog } from "@/lib/db-v4";
import { writeAuditLog } from "@/lib/audit-logger";

/* ─── Double-Entry Transfer Input ─── */

export interface TransferInput {
  fromBranch: BookOrBranch;
  toBranch: BookOrBranch;
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
      namaItem: `Transfer ke ${toBranch.replace("usaha-", "")}`,
      qty: 1,
      hargaSatuan: amount,
      hargaModal: 0,
      diskonPersen: 0,
      subtotal: amount,
      spesifikasi: description,
    };

    const incomingItem: DbTransactionItem = {
      id: crypto.randomUUID(),
      namaItem: `Transfer dari ${fromBranch.replace("usaha-", "")}`,
      qty: 1,
      hargaSatuan: amount,
      hargaModal: 0,
      diskonPersen: 0,
      subtotal: amount,
      spesifikasi: description,
    };

    /* Step 1: Create outgoing cashflow for source branch */
    const outgoing: DbCashflow = {
      id: crypto.randomUUID(),
      bookOrBranchId: fromBranch,
      tipe: "keluar",
      kategori: "transfer",
      nominal: amount,
      saldoSebelum: 0,
      saldoSesudah: 0,
      walletId: "",
      walletNama: "",
      referensiId: transferId,
      referensiTipe: "adjustment",
      catatan: `[TRANSFER] ${description} → ${toBranch.replace("usaha-", "")}`,
      createdAt: now,
    };
    await db.cashflows.add(outgoing);

    /* Step 2: Create incoming cashflow for destination branch */
    const incoming: DbCashflow = {
      id: crypto.randomUUID(),
      bookOrBranchId: toBranch,
      tipe: "masuk",
      kategori: "transfer",
      nominal: amount,
      saldoSebelum: 0,
      saldoSesudah: 0,
      walletId: "",
      walletNama: "",
      referensiId: transferId,
      referensiTipe: "adjustment",
      catatan: `[TRANSFER] ${description} ← ${fromBranch.replace("usaha-", "")}`,
      createdAt: now,
    };
    await db.cashflows.add(incoming);

    /* Step 3: Create transaction records (linked pair) */
    const sourceTx: DbTransaction = {
      id: transferId,
      bookOrBranchId: fromBranch,
      invoiceNumber: `TRF-${Date.now()}`,
      customerNama: `Transfer ke ${toBranch.replace("usaha-", "")}`,
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
      status: "LUNAS",
      walletIdTarget: "",
      catatan: description,
      createdAt: now,
    };
    await db.transactions.add(sourceTx);

    const destTx: DbTransaction = {
      id: crypto.randomUUID(),
      bookOrBranchId: toBranch,
      invoiceNumber: `TRF-${Date.now()}-IN`,
      customerNama: `Transfer dari ${fromBranch.replace("usaha-", "")}`,
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
      status: "LUNAS",
      walletIdTarget: "",
      catatan: description,
      createdAt: now,
    };
    await db.transactions.add(destTx);

    /* Step 4: Audit logs for both branches */
    await writeAuditLog({
      bookOrBranchId: fromBranch,
      action: "TRANSFER_KELUAR",
      entityType: "transfer",
      entityId: transferId,
      userId,
      userName,
      nominal: amount,
      alasan: `Transfer keluar Rp${amount.toLocaleString()} ke ${toBranch.replace("usaha-", "")}: ${description}`,
    });

    await writeAuditLog({
      bookOrBranchId: toBranch,
      action: "TRANSFER_MASUK",
      entityType: "transfer",
      entityId: transferId,
      userId,
      userName,
      nominal: amount,
      alasan: `Transfer masuk Rp${amount.toLocaleString()} dari ${fromBranch.replace("usaha-", "")}: ${description}`,
    });

    return { ok: true, transferId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: `Transfer gagal: ${message}` };
  }
}
