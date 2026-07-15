import { db, type BookOrBranch, type DbTransaction, type DbTransactionItem, BOOK_LABELS, branchPrefix } from "@/lib/db-v4";
import { writeAuditLog } from "@/lib/audit-logger";

/* ─── Input / Output Types ─── */

export interface PipelineInputV4 {
  id: string;
  bookOrBranchId: BookOrBranch;
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
}

export interface PipelineResultV4 {
  ok: boolean;
  transactionId: string;
  invoiceNumber: string;
  customerId?: string;
  piutangId?: string;
  error?: string;
}

/* ─── Helpers ─── */

function uid(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function defaultJatuhTempo(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
}

/* ─── Auto-init branch wallets ─── */

export async function ensureBranchWallets(branch: BookOrBranch): Promise<void> {
  if (branch === "usaha" || branch === "pribadi" || branch === "keluarga") return;
  const existing = await db.wallets.where("bookOrBranchId").equals(branch).toArray();
  if (existing.length >= 2) return;
  const label = BOOK_LABELS[branch] || branch;
  const ts = now();
  if (!existing.find((w) => w.namaDompet.includes("Kas Laci"))) {
    await db.wallets.add({
      id: `wallet-kas-${branch}-${uid().slice(0, 8)}`,
      bookOrBranchId: branch,
      namaDompet: `Kas Laci ${label}`,
      saldo: 0,
      tipe: "KasTunai",
      catatan: `Dompet kas tunai ${label}`,
      isActive: true,
      createdAt: ts,
    });
  }
  if (!existing.find((w) => w.namaDompet.includes("Bank"))) {
    await db.wallets.add({
      id: `wallet-bank-${branch}-${uid().slice(0, 8)}`,
      bookOrBranchId: branch,
      namaDompet: `Bank/QRIS ${label}`,
      saldo: 0,
      tipe: "Bank",
      catatan: `Dompet non-tunai ${label}`,
      isActive: true,
      createdAt: ts,
    });
  }
}

/* ─── Invoice Number Auto-Increment ─── */

async function getNextInvoiceNumber(branch: BookOrBranch): Promise<string> {
  const prefix = branchPrefix(branch);
  const today = todayStr().replace(/-/g, "");
  const counterId = `${prefix}-${today}`;

  const existing = await db.invoiceCounters.get(counterId);
  const nextNum = (existing?.counter ?? 0) + 1;

  if (existing) {
    await db.invoiceCounters.update(counterId, { counter: nextNum });
  } else {
    await db.invoiceCounters.add({
      id: counterId,
      bookOrBranchId: branch,
      prefix,
      counter: nextNum,
    });
  }

  return `${prefix}/${today}/${String(nextNum).padStart(4, "0")}`;
}

/* ─── Customer Management ─── */

async function findOrCreateCustomer(branch: BookOrBranch, nama: string, wa: string): Promise<string> {
  const safeWA = (wa ?? "").replace(/[^0-9]/g, "").trim();
  const safeNama = (nama ?? "").trim() || "Walk-in";

  if (safeWA) {
    const existing = await db.customers
      .where("[bookOrBranchId+noWA]")
      .equals([branch, safeWA])
      .first();
    if (existing) return existing.id;
  }

  const id = uid();
  const ts = now();
  await db.customers.add({
    id,
    bookOrBranchId: branch,
    nama: safeNama,
    noWA: safeWA,
    totalTransaksi: 0,
    totalBelanja: 0,
    poin: 0,
    terakhirTransaksi: ts,
    createdAt: ts,
  });
  return id;
}

async function updateCustomerMetrics(customerId: string, totalBruto: number, addPoin: number) {
  const cust = await db.customers.get(customerId);
  if (!cust) return;
  await db.customers.update(customerId, {
    totalTransaksi: (cust.totalTransaksi ?? 0) + 1,
    totalBelanja: (cust.totalBelanja ?? 0) + totalBruto,
    poin: (cust.poin ?? 0) + addPoin,
    terakhirTransaksi: now(),
  });
}

async function redeemPoinCrossBranch(noWA: string, poin: number): Promise<boolean> {
  const safeWA = (noWA ?? "").replace(/[^0-9]/g, "").trim();
  if (!safeWA || poin <= 0) return false;
  const all = await db.customers.where("noWA").equals(safeWA).toArray();
  const candidate = all.filter((c) => c.poin >= poin).sort((a, b) => b.poin - a.poin)[0];
  if (!candidate) return false;
  await db.customers.update(candidate.id, { poin: candidate.poin - poin });
  return true;
}

/* ─── MAIN PIPELINE: 5-Step Atomic Transaction ─── */

export async function executeTransactionPipelineV4(input: PipelineInputV4): Promise<PipelineResultV4> {
  try {
    return await db.transaction(
      "rw",
      [
        db.transactions,
        db.wallets,
        db.cashflows,
        db.inventory,
        db.inventoryMutations,
        db.customers,
        db.piutang,
        db.invoiceCounters,
        db.auditLogs,
      ],
      async () => {
        const branch = input.bookOrBranchId;
        const ts = now();
        let customerId: string | undefined;

        /* ═══════════════════════════════════════════
           STEP 0: Ensure branch wallets exist
           ═══════════════════════════════════════════ */
        await ensureBranchWallets(branch);

        /* ═══════════════════════════════════════════
           STEP 1: Cross-branch poin redemption
           ═══════════════════════════════════════════ */
        if (input.poinDigunakan && input.poinDigunakan > 0 && input.customerWA) {
          await redeemPoinCrossBranch(input.customerWA, input.poinDigunakan);
        }

        /* ═══════════════════════════════════════════
           STEP 2: Generate invoice number & Save transaction
           ═══════════════════════════════════════════ */
        const invoiceNumber = await getNextInvoiceNumber(branch);
        const sisaTagihan = Math.max(input.totalBruto - input.dpDibayar, 0);
        const status = sisaTagihan <= 0 ? "LUNAS" : input.dpDibayar > 0 ? "DP" : "DP";

        if (input.customerNama.trim()) {
          customerId = await findOrCreateCustomer(branch, input.customerNama, input.customerWA);
        }

        const transaction: DbTransaction = {
          id: input.id,
          bookOrBranchId: branch,
          invoiceNumber,
          customerId,
          customerNama: input.customerNama || "Walk-in",
          customerWA: input.customerWA || "",
          tanggal: ts,
          items: input.items,
          totalBruto: input.totalBruto,
          dpDibayar: input.dpDibayar,
          sisaTagihan,
          status,
          walletIdTarget: input.walletIdTarget,
          catatan: input.catatan ?? "",
          createdAt: ts,
        };
        await db.transactions.add(transaction);

        /* ═══════════════════════════════════════════
           STEP 3: Mutasi dompet keuangan + cashflow
           ═══════════════════════════════════════════ */
        const walletMasuk = status === "LUNAS" ? input.totalBruto : input.dpDibayar;
        const wallet = await db.wallets.get(input.walletIdTarget);

        if (wallet && walletMasuk > 0) {
          const saldoSebelum = wallet.saldo;
          const saldoSesudah = saldoSebelum + walletMasuk;

          await db.wallets.update(input.walletIdTarget, { saldo: saldoSesudah });

          await db.cashflows.add({
            id: uid(),
            bookOrBranchId: branch,
            tipe: "masuk",
            kategori: "Penjualan POS",
            nominal: walletMasuk,
            saldoSebelum,
            saldoSesudah,
            walletId: input.walletIdTarget,
            walletNama: wallet.namaDompet,
            referensiId: input.id,
            referensiTipe: "transaction",
            catatan: `Penjualan ${BOOK_LABELS[branch]} — ${invoiceNumber}`,
            createdAt: ts,
          });
        }

        /* ═══════════════════════════════════════════
           STEP 4: Pengurangan stok & catat mutasi inventory
           ═══════════════════════════════════════════ */
        if (input.inventoryLinks?.length) {
          for (const link of input.inventoryLinks) {
            const item = await db.inventory.get(link.itemId);
            if (!item) continue;

            const stokSebelum = item.stok;
            const stokSesudah = Math.max(stokSebelum - link.qtyDipotong, 0);

            await db.inventory.update(link.itemId, { stok: stokSesudah, updatedAt: ts });

            await db.inventoryMutations.add({
              id: uid(),
              bookOrBranchId: branch,
              itemId: link.itemId,
              tipe: "keluar",
              qty: link.qtyDipotong,
              stokSebelum,
              stokSesudah,
              alasan: `Penjualan POS Ref: ${invoiceNumber}`,
              createdAt: ts,
            });
          }
        }

        /* ═══════════════════════════════════════════
           STEP 5: Manajemen piutang (jika sisa > 0)
           ═══════════════════════════════════════════ */
        let piutangId: string | undefined;
        if (sisaTagihan > 0 && customerId) {
          piutangId = uid();
          await db.piutang.add({
            id: piutangId,
            bookOrBranchId: branch,
            transactionId: input.id,
            customerId,
            customerNama: input.customerNama || "Walk-in",
            customerWA: input.customerWA || "",
            totalPiutang: sisaTagihan,
            sisaPiutang: sisaTagihan,
            jatuhTempo: input.jatuhTempo || defaultJatuhTempo(),
            status: "AKTIF",
            catatan: `Sisa tagihan ${invoiceNumber}`,
            createdAt: ts,
          });
        }

        /* ═══════════════════════════════════════════
           STEP 6: Update customer metrics & poin
           ═══════════════════════════════════════════ */
        if (customerId) {
          const addPoin = input.poinDigunakan ? 0 : Math.floor(input.totalBruto * 0.01);
          await updateCustomerMetrics(customerId, input.totalBruto, addPoin);
        }

        /* ═══════════════════════════════════════════
           STEP 7: Tulis audit log
           ═══════════════════════════════════════════ */
        await writeAuditLog({
          bookOrBranchId: branch,
          action: "CREATE",
          entityType: "transaction",
          entityId: input.id,
          userId: input.userId ?? "system",
          userName: input.userName ?? "Kasir POS",
          dataAfter: transaction,
          nominal: input.totalBruto,
          alasan: `Invoice ${invoiceNumber} — ${BOOK_LABELS[branch]}`,
        });

        return {
          ok: true,
          transactionId: input.id,
          invoiceNumber,
          customerId,
          piutangId,
        };
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown pipeline error";
    return { ok: false, transactionId: input.id, invoiceNumber: "", error: message };
  }
}
