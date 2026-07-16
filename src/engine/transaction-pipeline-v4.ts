import {
  db,
  type BookOrBranch,
  type DbTransaction,
  type DbTransactionItem,
  branchPrefix,
  generateInvoiceNumber,
} from "@/lib/db-v4";
import { writeAuditLog } from "@/lib/audit-logger";

/* ─── Input Types ─── */

export interface PosCartItem {
  namaItem: string;
  qty: number;
  hargaSatuan: number;
  spesifikasi: string;
}

export interface PipelineInputV4 {
  id: string;
  bookOrBranchId: BookOrBranch;
  items: PosCartItem[];
  totalBruto: number;
  dpDibayar: number;
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

/* ─── Execute Pipeline ─── */

export async function executeTransactionPipelineV4(
  input: PipelineInputV4
): Promise<PipelineResultV4> {
  const {
    id: invId,
    bookOrBranchId,
    items,
    totalBruto,
    dpDibayar,
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

  try {
    const prefix = branchPrefix(bookOrBranchId);
    const invoiceNumber = generateInvoiceNumber(prefix);
    const sisaTagihan = Math.max(0, totalBruto - dpDibayar);
    const status: DbTransaction["status"] = sisaTagihan > 0 ? "DP" : "LUNAS";
    const now = new Date().toISOString();

    /* Step 1: Deduct inventory stock */
    for (const item of items) {
      const product = await db.inventory
        .where("bookOrBranchId")
        .equals(bookOrBranchId)
        .filter((p) => p.nama === item.namaItem)
        .first();

      if (product) {
        const newStock = product.stok - item.qty;
        await db.inventory.update(product.id, { stok: Math.max(0, newStock) });
      }
    }

    /* Step 2: Build DbTransactionItem[] */
    const txItems: DbTransactionItem[] = items.map((item) => ({
      id: crypto.randomUUID(),
      namaItem: item.namaItem,
      qty: item.qty,
      hargaSatuan: item.hargaSatuan,
      subtotal: item.qty * item.hargaSatuan,
      spesifikasi: item.spesifikasi,
    }));

    /* Step 3: Create transaction */
    const transaction: DbTransaction = {
      id: invId,
      bookOrBranchId,
      invoiceNumber,
      customerNama: customerNama || "Pelanggan Umum",
      customerWA: customerWA || "",
      tanggal: now,
      items: txItems,
      totalBruto,
      dpDibayar,
      sisaTagihan,
      status,
      walletIdTarget,
      catatan: catatan ?? "",
      buktiBayar: input.buktiBayar || "",
      createdAt: now,
    };

    await db.transactions.add(transaction);

    /* Step 4: Create production record for branches that need it */
    const productionBranches: BookOrBranch[] = [
      "usaha-percetakan",
      "usaha-konveksi",
      "usaha-toko-pakaian",
    ];
    if (productionBranches.includes(bookOrBranchId)) {
      await db.productions.add({
        id: crypto.randomUUID(),
        bookOrBranchId,
        transactionId: invId,
        invoiceNumber,
        status: "antre",
        catatan: "",
        updatedAt: now,
        createdAt: now,
      });
    }

    /* Step 5: Create cashflow entry */
    const wallet = await db.wallets.get(walletIdTarget);
    const walletNama = wallet?.namaDompet ?? "";
    const saldoSebelum = wallet?.saldo ?? 0;
    const saldoSesudah = saldoSebelum + dpDibayar;

    await db.cashflows.add({
      id: crypto.randomUUID(),
      bookOrBranchId,
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

    /* Step 6: Write audit log */
    await writeAuditLog({
      bookOrBranchId,
      action: "CREATE",
      entityType: "transaction",
      entityId: invId,
      userId: "system",
      userName: "System",
      dataAfter: JSON.stringify(transaction),
      nominal: totalBruto,
      alasan: `Transaksi ${invoiceNumber} - ${customerNama || "Umum"} - Rp${totalBruto.toLocaleString()} (${status})`,
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
