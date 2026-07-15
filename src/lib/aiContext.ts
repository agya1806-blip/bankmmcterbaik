import { db, BOOK_LABELS, BRANCH_SLUGS, type BookOrBranch } from "@/lib/db-v4";

export interface AiContextPayload {
  ringkasanKeuangan: string;
  totalKekayaan: number;
  perBuku: { label: string; saldo: number }[];
  omzetHarian: { label: string; omzet: number; laba: number; txCount: number }[];
  piutangAktif: { label: string; total: number; count: number; jatuhTempoTerdekat: string }[];
}

export async function buildAiContext(): Promise<AiContextPayload> {
  const allWallets = await db.wallets.where("isActive").equals(1).toArray();
  const grouped: Record<string, number> = {};
  for (const w of allWallets) {
    grouped[w.bookOrBranchId] = (grouped[w.bookOrBranchId] ?? 0) + w.saldo;
  }

  const perBuku: AiContextPayload["perBuku"] = [];
  const seen = new Set<string>();
  for (const [key, saldo] of Object.entries(grouped)) {
    const root = (key.startsWith("usaha-") ? "usaha" : key) as BookOrBranch;
    if (!seen.has(root)) {
      seen.add(root);
      const aggregateTotal =
        root === "usaha"
          ? BRANCH_SLUGS.reduce((s, slug) => s + (grouped[slug] ?? 0), 0) +
            (grouped["usaha"] ?? 0)
          : saldo;
      perBuku.push({ label: BOOK_LABELS[root] ?? root, saldo: aggregateTotal });
    }
  }

  const totalKekayaan = perBuku.reduce((s, b) => s + b.saldo, 0);

  // Omzet harian
  const today = new Date().toISOString().slice(0, 10);
  const transactionsToday = await db.transactions
    .where("tanggal")
    .equals(today)
    .toArray();

  const omzetGrouped: Record<string, { omzet: number; txCount: number }> = {};
  for (const tx of transactionsToday) {
    if (!omzetGrouped[tx.bookOrBranchId]) {
      omzetGrouped[tx.bookOrBranchId] = { omzet: 0, txCount: 0 };
    }
    omzetGrouped[tx.bookOrBranchId].omzet += tx.totalBruto;
    omzetGrouped[tx.bookOrBranchId].txCount += 1;
  }

  const omzetHarian: AiContextPayload["omzetHarian"] = [];
  for (const [key, val] of Object.entries(omzetGrouped)) {
    omzetHarian.push({
      label: BOOK_LABELS[key as BookOrBranch] ?? key,
      omzet: val.omzet,
      laba: Math.round(val.omzet * 0.2),
      txCount: val.txCount,
    });
  }

  // Piutang aktif
  const piutangAktifRaw = await db.piutang
    .where("status")
    .equals("AKTIF")
    .toArray();

  const piutangGrouped: Record<
    string,
    { total: number; count: number; terdekat: string }
  > = {};
  for (const p of piutangAktifRaw) {
    if (!piutangGrouped[p.bookOrBranchId]) {
      piutangGrouped[p.bookOrBranchId] = {
        total: 0,
        count: 0,
        terdekat: "",
      };
    }
    piutangGrouped[p.bookOrBranchId].total += p.sisaPiutang;
    piutangGrouped[p.bookOrBranchId].count += 1;
    if (
      !piutangGrouped[p.bookOrBranchId].terdekat ||
      p.jatuhTempo < piutangGrouped[p.bookOrBranchId].terdekat
    ) {
      piutangGrouped[p.bookOrBranchId].terdekat = p.jatuhTempo;
    }
  }

  const piutangAktif: AiContextPayload["piutangAktif"] = [];
  for (const [key, val] of Object.entries(piutangGrouped)) {
    piutangAktif.push({
      label: BOOK_LABELS[key as BookOrBranch] ?? key,
      total: val.total,
      count: val.count,
      jatuhTempoTerdekat: val.terdekat,
    });
  }

  const ringkasanLines = [
    `Total kekayaan: Rp${totalKekayaan.toLocaleString("id-ID")}`,
    "",
    "=== PER BUKU ===",
    ...perBuku.map(
      (b) => `- ${b.label}: Rp${b.saldo.toLocaleString("id-ID")}`
    ),
    "",
    omzetHarian.length > 0
      ? `=== OMZET HARI INI (${today}) ===\n` +
        omzetHarian
          .map(
            (o) =>
              `- ${o.label}: Rp${o.omzet.toLocaleString("id-ID")} (${o.txCount} tx)`
          )
          .join("\n")
      : "Tidak ada transaksi hari ini.",
    "",
    piutangAktif.length > 0
      ? `=== PIUTANG AKTIF ===\n` +
        piutangAktif
          .map(
            (p) =>
              `- ${p.label}: Rp${p.total.toLocaleString("id-ID")} (${p.count} tagihan, jatuh tempo terdekat: ${p.jatuhTempoTerdekat})`
          )
          .join("\n")
      : "Tidak ada piutang aktif.",
  ];

  return {
    ringkasanKeuangan: ringkasanLines.join("\n"),
    totalKekayaan,
    perBuku,
    omzetHarian,
    piutangAktif,
  };
}
