import type { UnitId, Transaction, Cashflow } from "@/lib/db-v4";

/* ─── Format Helpers ─── */

function formatCurrency(n: number): string {
  return `Rp${n.toLocaleString("id-ID")}`;
}

function formatDate(d: Date | string): string {
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/* ─── WA Text Export ─── */

export function formatTransactionWA(tx: Transaction, branchName: string): string {
  const itemsList = tx.items
    .map((item) => `  • ${item.namaItem} x${item.qty}  ${formatCurrency(item.hargaSatuan * item.qty)}`)
    .join("\n");

  return (
    `📋 *INVOICE ${tx.invoiceNumber}*\n` +
    ` Cabang: ${branchName}\n` +
    ` Tanggal: ${formatDate(tx.tanggal)}\n` +
    ` Pelanggan: ${tx.customerNama}\n` +
    `\n${"─".repeat(30)}\n` +
    `${itemsList}\n` +
    `${"─".repeat(30)}\n` +
    ` *Total:* ${formatCurrency(tx.totalBruto)}\n` +
    ` *Dibayar:* ${formatCurrency(tx.dpDibayar)}\n` +
    (tx.sisaTagihan > 0
      ? ` *Sisa Piutang:* ${formatCurrency(tx.sisaTagihan)}\n`
      : ` ✅ *LUNAS*\n`) +
    `\nTerima kasih atas kunjungan Anda! 🙏`
  );
}

export function formatCashflowWA(cashflows: Cashflow[], branchName: string, period: string): string {
  const masuk = cashflows.filter((c) => c.tipe === "masuk");
  const keluar = cashflows.filter((c) => c.tipe === "keluar");
  const totalMasuk = masuk.reduce((s, c) => s + c.nominal, 0);
  const totalKeluar = keluar.reduce((s, c) => s + c.nominal, 0);

  const lines = [
    `📊 *LAPORAN CASHFLOW*`,
    ` Cabang: ${branchName}`,
    ` Periode: ${period}`,
    `\n${"─".repeat(30)}`,
    `\n💰 *PEMASUKAN (${masuk.length} transaksi):*`,
    ...masuk.slice(0, 10).map((c) => `  • ${c.catatan}: ${formatCurrency(c.nominal)}`),
    `\n💸 *PENGELUARAN (${keluar.length} transaksi):*`,
    ...keluar.slice(0, 10).map((c) => `  • ${c.catatan}: ${formatCurrency(c.nominal)}`),
    `\n${"─".repeat(30)}`,
    ` Total Masuk: ${formatCurrency(totalMasuk)}`,
    ` Total Keluar: ${formatCurrency(totalKeluar)}`,
    ` *Selisih:* ${formatCurrency(totalMasuk - totalKeluar)}`,
  ];

  return lines.join("\n");
}

/* ─── Open WA ─── */

export function openWhatsApp(phone: string, message: string): void {
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}

/* ─── PDF Export ─── */

export async function exportPDF(
  filename: string,
  html: string
): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF("p", "mm", "a4");
  doc.setFont("helvetica");
  doc.setFontSize(10);

  const lines = html.split("\n");
  let y = 20;
  lines.forEach((line) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.text(line, 15, y);
    y += 5;
  });

  doc.save(`${filename}.pdf`);
}

/* ─── PNG Export (html2canvas) ─── */

export async function exportPNG(
  elementId: string,
  filename: string
): Promise<void> {
  const { default: html2canvas } = await import("html2canvas");
  const el = document.getElementById(elementId);
  if (!el) return alert("Element tidak ditemukan!");
  const canvas = await html2canvas(el, { scale: 2, useCORS: true });
  const link = document.createElement("a");
  link.download = `${filename}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

/* ─── Excel Export (xlsx) ─── */

export async function exportExcel(
  filename: string,
  headers: string[],
  rows: (string | number)[][]
): Promise<void> {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/* ─── Transaction Excel Helper ─── */

export function exportTransactionsExcel(
  transactions: Transaction[],
  branchName: string
): void {
  const headers = ["No", "Invoice", "Tanggal", "Pelanggan", "Total", "Dibayar", "Sisa", "Status"];
  const rows = transactions.map((tx, i) => [
    i + 1,
    tx.invoiceNumber,
    formatDate(tx.tanggal),
    tx.customerNama,
    tx.totalBruto,
    tx.dpDibayar,
    tx.sisaTagihan,
    tx.status,
  ]);
  exportExcel(`Transaksi-${branchName}-${Date.now()}`, headers, rows);
}

/* ─── Cashflow Excel Helper ─── */

export function exportCashflowExcel(
  cashflows: Cashflow[],
  branchName: string
): void {
  const headers = ["No", "Tanggal", "Tipe", "Kategori", "Nominal", "Catatan"];
  const rows = cashflows.map((cf, i) => [
    i + 1,
    formatDate(cf.createdAt),
    cf.tipe === "masuk" ? "Pemasukan" : "Pengeluaran",
    cf.kategori,
    cf.nominal,
    cf.catatan,
  ]);
  exportExcel(`Cashflow-${branchName}-${Date.now()}`, headers, rows);
}
