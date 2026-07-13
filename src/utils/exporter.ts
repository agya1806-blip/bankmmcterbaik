import type { Order, Transaction } from "@/lib/db";

/* ─── WhatsApp ─── */

const WA_PREFIX_REGEX = /^0+/;

export function formatWaNumber(phone: string): string {
  return phone.replace(/\D/g, "").replace(WA_PREFIX_REGEX, "62");
}

export function sendWhatsAppReceipt(phone: string, orderData: { number?: string; total: number; dp?: number; remaining?: number; status?: string; items?: { description: string; quantity: number; total: number }[]; customerName?: string; id: string }): void {
  const wa = formatWaNumber(phone);
  let text = `*MUGHIS BANK — Nota Pembayaran*\n\n`;
  text += `*Tiga Pilar Keuangan:*\n`;
  text += `💰 *Total Belanja:* ${orderData.total.toLocaleString()}\n`;
  text += `💳 *Dibayar:* ${(orderData.dp || 0).toLocaleString()}\n`;
  text += `📋 *Sisa Tagihan:* ${(orderData.remaining || orderData.total).toLocaleString()}\n`;
  text += `📌 *Status:* ${orderData.status || "Baru"}\n\n`;
  if (orderData.items && orderData.items.length > 0) {
    text += `*Item Pesanan:*\n`;
    orderData.items.slice(0, 5).forEach((i) => {
      text += `  • ${i.description} x${i.quantity} = ${i.total.toLocaleString()}\n`;
    });
  }
  const invoiceUrl = `${window.location.origin}/invoices/${orderData.id}`;
  text += `\n🔗 *Link Invoice:* ${invoiceUrl}\n\n`;
  text += `Terima kasih!`;
  window.open(`https://wa.me/${wa}?text=${encodeURIComponent(text)}`, "_blank");
}

/* ─── PNG ─── */

export async function exportToPNG(elementId: string, filename = "struk.png"): Promise<void> {
  const el = document.getElementById(elementId);
  if (!el) return;
  const html2canvas = (await import("html2canvas")).default;
  const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}

/* ─── PDF ─── */

const PDF_FORMATS: Record<string, { unit: "mm"; format: [number, number]; orientation: "portrait" | "landscape" }> = {
  thermal: { unit: "mm", format: [80, 297], orientation: "portrait" },
  a4: { unit: "mm", format: [210, 297], orientation: "portrait" },
};

export async function exportToPDF(elementId: string, format: "thermal" | "a4" = "thermal", filename = "struk.pdf"): Promise<void> {
  const el = document.getElementById(elementId);
  if (!el) return;
  const html2pdf = (await import("html2pdf.js")).default;
  const cfg = PDF_FORMATS[format];
  html2pdf().set({
    margin: format === "thermal" ? [5, 5, 5, 5] : [10, 15, 10, 15],
    filename,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: cfg,
  }).from(el).save();
}

/* ─── XLSX ─── */

export function exportToExcel(data: Record<string, unknown>[], sheetName = "Laporan", filename = "laporan.xlsx"): void {
  const XLSX = (window as unknown as Record<string, unknown>).XLSX as typeof import("xlsx") | undefined;
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
