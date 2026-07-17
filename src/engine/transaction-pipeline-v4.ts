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
  hargaModal: number;
  diskonPersen: number;
  spesifikasi: string;
}

export interface PipelineInputV4 {
  id: string;
  bookOrBranchId: BookOrBranch;
  items: PosCartItem[];
  totalBruto: number;
  diskonGlobalPersen: number;
  ppnPersen: number;
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
    diskonGlobalPersen,
    ppnPersen,
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

    /* Step 4: Create transaction */
    const transaction: DbTransaction = {
      id: invId,
      bookOrBranchId,
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

    /* Step 5: Create cashflow entry & update wallet saldo */
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

    /* Step 5b: Update wallet saldo */
    if (walletIdTarget && dpDibayar > 0) {
      await db.wallets.update(walletIdTarget, { saldo: saldoSesudah });
    }

    /* Step 5c: Create piutang record if DP (sisa tagihan > 0) */
    if (status === "DP" && sisaTagihan > 0) {
      const jatuhTempo = new Date();
      jatuhTempo.setDate(jatuhTempo.getDate() + 30);
      await db.piutang.add({
        id: crypto.randomUUID(),
        bookOrBranchId,
        transactionId: invId,
        customerId: "",
        customerNama: customerNama || "Pelanggan Umum",
        customerWA: customerWA || "",
        totalPiutang: grandTotal,
        sisaPiutang: sisaTagihan,
        jatuhTempo: jatuhTempo.toISOString(),
        status: "AKTIF",
        catatan: `Piutang dari ${invoiceNumber}`,
        createdAt: now,
      });
    }

    /* Step 6: Write audit log */
    await writeAuditLog({
      bookOrBranchId,
      action: "CREATE",
      entityType: "transaction",
      entityId: invId,
      userId: "system",
      userName: "System",
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
