import type { Order, Transaction, Customer } from "@/lib/db";

/* ─── WhatsApp ─── */

export function formatWaNumber(phone: string): string {
  return phone.replace(/\D/g, "").replace(/^0/, "62");
}

export function kirimWhatsApp(phone: string, message: string) {
  const wa = formatWaNumber(phone);
  window.open(`https://wa.me/${wa}?text=${encodeURIComponent(message)}`, "_blank");
}

export function buatRingkasanTransaksi(orders: Order[], customer?: Customer): string {
  let text = "";
  if (customer) text += `*${customer.name}*\n`;
  text += `*MUGHIS BANK — Laporan Transaksi*\n`;
  text += `\n*Tiga Pilar Keuangan:*\n`;
  const totalPenjualan = orders.reduce((s, o) => s + o.total, 0);
  const totalDp = orders.reduce((s, o) => s + (o.dp || 0), 0);
  const sisa = totalPenjualan - totalDp;
  text += `💰 *Total Penjualan:* ${totalPenjualan.toLocaleString()}\n`;
  text += `💳 *Total DP:* ${totalDp.toLocaleString()}\n`;
  text += `📋 *Sisa Tagihan:* ${sisa.toLocaleString()}\n`;
  text += `\n*Detail Pesanan:*\n`;
  orders.slice(0, 5).forEach((o, i) => {
    text += `${i + 1}. ${o.number || `#${o.id.slice(0, 6)}`} — ${o.status} — ${o.total.toLocaleString()}\n`;
  });
  const invoiceUrl = orders[0] ? `${window.location.origin}/invoices/${orders[0].id}` : window.location.origin;
  text += `\n🔗 *Link Invoice:* ${invoiceUrl}`;
  return text;
}

/* ─── PNG ─── */

export async function eksporPNG(element: HTMLElement, filename = "struk.png") {
  const html2canvas = (await import("html2canvas")).default;
  const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}

/* ─── PDF ─── */

export async function eksporPDF(element: HTMLElement, filename = "struk.pdf") {
  const html2pdf = (await import("html2pdf.js")).default;
  html2pdf().set({
    margin: [5, 5, 5, 5], filename, image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: "mm", format: [80, 297], orientation: "portrait" },
  }).from(element).save();
}

/* ─── XLSX ─── */

export function eksporXLSX(data: Record<string, unknown>[], sheetName = "Laporan", filename = "laporan.xlsx") {
  const XLSX = (window as unknown as { XLSX: typeof import("xlsx") }).XLSX;
  if (!XLSX) return;
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

export function transaksiKeSheet(transactions: Transaction[]): Record<string, unknown>[] {
  return transactions.map((t) => ({
    Tanggal: t.date,
    Tipe: t.type,
    Jumlah: t.amount,
    Deskripsi: t.description,
    Kategori: t.categoryId || "-",
    Akun: t.accountId,
  }));
}

export function pesananKeSheet(orders: Order[]): Record<string, unknown>[] {
  return orders.map((o) => ({
    Nomor: o.number || o.id,
    Tanggal: o.date,
    Pelanggan: o.customerName || o.customerId,
    Status: o.status,
    "Status Bayar": o.paymentStatus || "-",
    Total: o.total,
    DP: o.dp || 0,
    Sisa: o.remaining || o.total,
  }));
}
