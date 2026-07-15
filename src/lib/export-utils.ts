/* ─── 4-Format Universal Export Engine ─── */

/**
 * 1. WA Export — format teks ramah WhatsApp, buka URL wa.me
 */
export function exportWA(
  phone: string,
  message: string
): string {
  const text = encodeURIComponent(message);
  const cleaned = phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${cleaned}?text=${text}`;
}

export function formatInvoiceWA(
  invoiceNumber: string,
  customerNama: string,
  items: { namaItem: string; qty: number; subtotal: number }[],
  total: number,
  dp: number,
  sisa: number,
  profilNama: string
): string {
  let msg = `*${profilNama}*\n`;
  msg += `─────────────────\n`;
  msg += `*INVOICE #${invoiceNumber}*\n`;
  msg += `Kepada: ${customerNama}\n\n`;
  msg += `*Pesanan:*\n`;
  items.forEach((it, i) => {
    msg += `${i + 1}. ${it.namaItem} x${it.qty} — Rp${it.subtotal.toLocaleString()}\n`;
  });
  msg += `─────────────────\n`;
  msg += `*Total: Rp${total.toLocaleString()}*\n`;
  if (dp > 0) msg += `DP: Rp${dp.toLocaleString()}\n`;
  if (sisa > 0) msg += `Sisa: Rp${sisa.toLocaleString()}\n`;
  msg += `─────────────────\n`;
  msg += `Terima kasih 🙏`;
  return msg;
}

/**
 * 2. Photo Export — html2canvas → PNG download
 */
export async function exportPhoto(
  element: HTMLElement,
  filename: string = "nota"
): Promise<void> {
  const html2canvas = (await import("html2canvas")).default;
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
  });
  const link = document.createElement("a");
  link.download = `${filename}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

/**
 * 3. PDF Export — jspdf dari canvas atau html
 */
export async function exportPDF(
  element: HTMLElement,
  filename: string = "nota"
): Promise<void> {
  const html2canvas = (await import("html2canvas")).default;
  const { default: jsPDF } = await import("jspdf");

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
  });

  const imgData = canvas.toDataURL("image/png");
  const imgWidth = 210;
  const pageHeight = 297;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  const pdf = new jsPDF("p", "mm", "a4");
  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(`${filename}.pdf`);
}

/**
 * 4. Excel Export — SheetJS xlsx
 */
export async function exportExcel(
  data: Record<string, unknown>[],
  sheetName: string = "Sheet1",
  filename: string = "laporan"
): Promise<void> {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/* ─── Format helpers ─── */

export function formatRupiah(n: number): string {
  return `Rp${n.toLocaleString("id-ID")}`;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function nowISO(): string {
  return new Date().toISOString();
}
