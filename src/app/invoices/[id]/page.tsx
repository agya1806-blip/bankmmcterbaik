"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/engines/identity/auth-store";
import { useWorkspaceStore } from "@/engines/workspace/workspace-store";
import { useOrderStore } from "@/engines/business/order-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftIcon, EditIcon, Trash2Icon, DownloadIcon, Share2Icon, PrinterIcon, CameraIcon } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { toCanvas } from "qrcode";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const PAYMENT_INFO = [
  { bank: "SeaBank", name: "Muhammad Aghisna", number: "901007430064" },
  { bank: "BSI", name: "Muhammad Aghisna", number: "7197202798" },
  { bank: "DANA", name: "Muhammad Aghisna", number: "085217706587" },
];

const TYPE_LABELS: Record<string, string> = {
  print: "Percetakan Buku",
  laptop: "Laptop Bekas",
  handphone: "Handphone",
  tiktok: "TikTok",
  umum: "Umum",
};

const PAYMENT_STYLES: Record<string, string> = {
  "Belum Lunas": "bg-red-100/80 dark:bg-red-900/30 text-red-600",
  DP: "bg-amber-100/80 dark:bg-amber-900/30 text-amber-600",
  Lunas: "bg-emerald-100/80 dark:bg-emerald-900/30 text-emerald-600",
  Batal: "bg-gray-100/80 dark:bg-gray-900/30 text-gray-600",
};

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuthStore();
  const { activeWorkspace, loadWorkspaces } = useWorkspaceStore();
  const { orders, loadOrders, removeOrder } = useOrderStore();

  const qrRef = useRef<HTMLCanvasElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const [shareLoading, setShareLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) loadWorkspaces(user.id);
  }, [user, loadWorkspaces]);

  useEffect(() => {
    if (activeWorkspace) loadOrders(activeWorkspace.id);
  }, [activeWorkspace, loadOrders]);

  const order = useMemo(
    () => orders.find((o) => o.id === params.id),
    [orders, params.id]
  );

  const qrValue = useMemo(
    () => order ? `${window.location.origin}/invoices/${order.id}` : "",
    [order]
  );

  useEffect(() => {
    if (qrRef.current && qrValue) {
      toCanvas(qrRef.current, qrValue, { width: 140 });
    }
  }, [qrValue]);

  const handleDelete = useCallback(async () => {
    if (!order) return;
    if (!confirm(t("orders.deleteConfirm"))) return;
    await removeOrder(order.id);
    router.push("/invoices");
  }, [order, removeOrder, router, t]);

  const handleDownloadPDF = useCallback(() => {
    if (!order || !activeWorkspace) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("INVOICE", 14, 22);
    doc.setFontSize(11);
    doc.text(`${activeWorkspace.name || "MUGHIS BANK"}`, 14, 32);
    doc.text(`${t("invoices.pdfNumber")} ${order.number}`, 14, 42);
    doc.text(`${t("invoices.pdfCustomer")} ${order.customerName || order.customerId}`, 14, 50);
    doc.text(`${t("invoices.pdfDate")} ${new Date(order.date).toLocaleDateString()}`, 14, 58);
    doc.text(`${t("invoices.pdfStatus")} ${order.paymentStatus || order.status}`, 14, 66);
    doc.line(14, 72, 196, 72);
    let y = 80;
    doc.text(t("invoices.pdfItem"), 14, y);
    doc.text(t("invoices.pdfQty"), 120, y);
    doc.text(t("invoices.pdfPrice"), 150, y);
    doc.text(t("invoices.pdfTotal"), 175, y);
    y += 8;
    for (const item of order.items) {
      doc.text(item.description, 14, y);
      doc.text(String(item.quantity), 120, y);
      doc.text(String(item.unitPrice), 150, y);
      doc.text(String(item.total), 175, y);
      y += 7;
    }
    y += 6;
    doc.text(`${t("invoices.pdfSubtotal")} ${activeWorkspace.currency} ${order.subtotal}`, 14, y);
    y += 7;
    if (order.discount > 0) {
      doc.text(`${t("invoices.pdfDiscount")} -${activeWorkspace.currency} ${order.discount}`, 14, y);
      y += 7;
    }
    if (order.dp > 0) {
      doc.text(`DP: ${activeWorkspace.currency} ${order.dp}`, 14, y);
      y += 7;
    }
    doc.setFontSize(13);
    doc.text(`${t("invoices.pdfTotal")} ${activeWorkspace.currency} ${order.total}`, 14, y + 4);
    doc.save(`invoice-${order.number}.pdf`);
  }, [order, activeWorkspace, t]);

  const handleWhatsApp = useCallback(() => {
    if (!order) return;
    const invoiceUrl = `${window.location.origin}/invoices/${order.id}`;
    let text = `*${activeWorkspace?.name || "MUGHIS BANK"}*\n`;
    text += `*Invoice: ${order.number}*\n`;
    text += `Tanggal: ${new Date(order.date).toLocaleDateString()}\n`;
    text += `Jenis: ${TYPE_LABELS[order.type] || order.type}\n`;
    text += `Pelanggan: ${order.customerName || order.customerId}\n`;
    if (order.customerPhone) text += `Telp: ${order.customerPhone}\n`;
    text += `\n*Item:*\n`;
    order.items.forEach((item, i) => {
      text += `${i + 1}. ${item.description} x${item.quantity} = ${activeWorkspace?.currency || ""} ${item.total}\n`;
    });
    text += `\n*Total: ${activeWorkspace?.currency || ""} ${order.total}*\n`;
    text += `DP: ${activeWorkspace?.currency || ""} ${order.dp}\n`;
    text += `Sisa: ${activeWorkspace?.currency || ""} ${order.remaining}\n`;
    text += `Status: *${order.paymentStatus || order.status}*\n\n`;
    text += `*Cara Bayar:*\n`;
    text += `Klik link berikut untuk bayar online:\n`;
    text += `${invoiceUrl}\n\n`;
    text += `*Transfer Bank:*\n`;
    PAYMENT_INFO.forEach((p) => {
      text += `${p.bank}: ${p.number} a.n ${p.name}\n`;
    });
    if (order.notes) text += `\nCatatan: ${order.notes}\n`;
    text += `\nTerima kasih!`;
    const phone = (order.customerPhone || "").replace(/\D/g, "").replace(/^0/, "62");
    window.open(`https://wa.me/${phone || "62"}?text=${encodeURIComponent(text)}`, "_blank");
  }, [order, activeWorkspace]);

  const handleShareImage = useCallback(async () => {
    if (!printRef.current) return;
    setShareLoading(true);
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `invoice-${order?.number || "slip"}.png`, { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: `Invoice ${order?.number}` });
            return;
          } catch { /* ignore */ }
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `invoice-${order?.number || "slip"}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    } finally {
      setShareLoading(false);
    }
  }, [order]);

  const handlePrint = useCallback(() => window.print(), []);

  const paymentStatus = order?.paymentStatus || (order?.dp > 0 ? (order.dp >= order.total ? "Lunas" : "DP") : "Belum Lunas");

  function renderSpecs() {
    if (!order?.specs || Object.keys(order.specs).length === 0) return null;
    const s = order.specs;
    if (order.type === "print") {
      return (
        <div className="mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Spesifikasi Buku</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <p><span className="text-muted-foreground">Ukuran:</span> {s.bookSize || "-"}</p>
            <p><span className="text-muted-foreground">Jilid:</span> {s.binding || "-"}</p>
            <p><span className="text-muted-foreground">Ukuran Jadi:</span> {s.finalSize || "-"}</p>
            <p><span className="text-muted-foreground">Kertas Isi:</span> {s.paperType || "-"}</p>
            <p><span className="text-muted-foreground">Cover:</span> {s.coverType || "-"}</p>
            <p><span className="text-muted-foreground">Laminating:</span> {s.laminating || "-"}</p>
            <p><span className="text-muted-foreground">Wrapping:</span> {s.wrapping || "-"}</p>
          </div>
        </div>
      );
    }
    if (order.type === "laptop") {
      return (
        <div className="mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Spesifikasi Laptop</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <p className="col-span-2 font-semibold">{s.laptopName || "-"}</p>
            <p><span className="text-muted-foreground">Processor:</span> {s.processor || "-"}</p>
            <p><span className="text-muted-foreground">RAM:</span> {s.ram || "-"}</p>
            <p><span className="text-muted-foreground">Storage:</span> {s.storage || "-"}</p>
            <p><span className="text-muted-foreground">Layar:</span> {s.screen || "-"}</p>
            <p><span className="text-muted-foreground">Kondisi:</span> {s.condition || "-"}</p>
            <p><span className="text-muted-foreground">Garansi:</span> {s.warranty || "-"}</p>
          </div>
        </div>
      );
    }
    if (order.type === "handphone") {
      return (
        <div className="mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Spesifikasi Handphone</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <p className="col-span-2 font-semibold">{s.handphoneName || "-"}</p>
            <p><span className="text-muted-foreground">Storage:</span> {s.storage || "-"}</p>
            <p><span className="text-muted-foreground">Warna:</span> {s.color || "-"}</p>
            <p><span className="text-muted-foreground">Kondisi:</span> {s.condition || "-"}</p>
          </div>
        </div>
      );
    }
    if (order.type === "tiktok") {
      return (
        <div className="mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Layanan TikTok</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <p><span className="text-muted-foreground">Niche:</span> {s.niche || "-"}</p>
            <p><span className="text-muted-foreground">Jenis Layanan:</span> {s.serviceType || "-"}</p>
          </div>
        </div>
      );
    }
    if (order.type === "umum") {
      return (
        <div className="mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Keterangan</p>
          <div className="text-sm">
            <p><span className="text-muted-foreground">Jenis:</span> {s.umumType || "-"}</p>
            <p className="mt-1">{s.umumDesc || "-"}</p>
          </div>
        </div>
      );
    }
    return null;
  }

  if (authLoading) return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">{t("loading")}</p></div>;
  if (!user || !activeWorkspace) return null;

  if (!order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
        <p className="text-muted-foreground">{t("invoices.notFound")}</p>
        <Button variant="outline" onClick={() => router.push("/invoices")}>{t("invoices.back")}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between flex-wrap gap-2 no-print">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => router.push("/invoices")}>
            <ArrowLeftIcon className="size-4" />
          </Button>
          <div>
            <h2 className="text-xl font-bold">{order.number}</h2>
            <p className="text-xs text-muted-foreground">{new Date(order.date).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="outline" className={`text-xs ${PAYMENT_STYLES[paymentStatus] || ""}`}>
            {paymentStatus}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => router.push("/orders")}>
            <EditIcon className="size-3" /> {t("invoices.edit")}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
            <DownloadIcon className="size-3" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleWhatsApp}>
            <Share2Icon className="size-3" /> WA
          </Button>
          <Button variant="outline" size="sm" onClick={handleShareImage} disabled={shareLoading}>
            <CameraIcon className="size-3" /> {shareLoading ? "..." : "Foto"}
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <PrinterIcon className="size-3" />
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2Icon className="size-3" />
          </Button>
        </div>
      </div>

      <div ref={printRef} className="bg-white text-gray-900 rounded-2xl border border-gray-200 p-6 print:border print:shadow-none">
        <div className="text-center mb-6 pb-4 border-b-2 border-gray-200">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-sky-500 to-indigo-500 rounded-xl flex items-center justify-center text-white text-3xl font-extrabold mb-3">
            MG
          </div>
          <h3 className="text-xl font-extrabold">{activeWorkspace.name || "MUGHIS BANK"}</h3>
          <p className="text-xs text-gray-500">Samalanga, Bireuen, Aceh</p>
          <p className="text-xs text-gray-500">WA: 085217706587</p>
        </div>

        <div className="mb-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">INVOICE</p>
          <p className="text-sm font-semibold">{order.number} | {new Date(order.date).toLocaleDateString()}</p>
        </div>

        <div className="mb-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Pelanggan</p>
          <p className="text-sm font-semibold">{order.customerName || order.customerId}</p>
          <p className="text-xs text-gray-500">{order.customerPhone || "-"}</p>
          <p className="text-xs text-gray-500">{order.customerAddress || "-"}</p>
        </div>

        {renderSpecs()}

        <div className="mb-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Daftar Item</p>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left text-xs text-gray-500">
                <th className="p-2 w-8">No</th>
                <th className="p-2">Item</th>
                <th className="p-2 text-center w-16">Qty</th>
                <th className="p-2 text-right w-24">Harga</th>
                <th className="p-2 text-right w-24">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="p-2 text-center text-gray-500">{idx + 1}</td>
                  <td className="p-2">{item.description}</td>
                  <td className="p-2 text-center">{item.quantity}</td>
                  <td className="p-2 text-right">{activeWorkspace.currency} {item.unitPrice.toLocaleString()}</td>
                  <td className="p-2 text-right font-semibold">{activeWorkspace.currency} {item.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 pt-4 border-t-2 border-gray-200">
          <div className="flex justify-end">
            <div className="w-56 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Total</span>
                <span>{activeWorkspace.currency} {order.subtotal.toLocaleString()}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>Diskon</span>
                  <span>- {activeWorkspace.currency} {order.discount.toLocaleString()}</span>
                </div>
              )}
              {order.dp > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>DP</span>
                  <span>{activeWorkspace.currency} {order.dp.toLocaleString()}</span>
                </div>
              )}
              {order.remaining > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>Sisa</span>
                  <span>{activeWorkspace.currency} {order.remaining.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
                <span>Grand Total</span>
                <span>{activeWorkspace.currency} {order.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold ${
            paymentStatus === "Lunas" ? "bg-emerald-100 text-emerald-800" :
            paymentStatus === "DP" ? "bg-amber-100 text-amber-800" :
            "bg-red-100 text-red-800"
          }`}>
            {paymentStatus}
          </span>
        </div>

        {order.notes && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs">
            <span className="font-semibold">Catatan:</span> {order.notes}
          </div>
        )}

        <div className="mt-4 p-3 bg-sky-50 rounded-lg text-center text-xs">
          <p className="font-bold mb-1">Metode Pembayaran:</p>
          {PAYMENT_INFO.map((p, i) => (
            <p key={i}>{p.bank} - {p.name} - {p.number}</p>
          ))}
          <p className="mt-1 text-gray-500">Kirim bukti transfer via WhatsApp setelah pembayaran.</p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 no-print">
        <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 flex flex-col items-center gap-3">
          <p className="text-sm font-semibold text-muted-foreground">{t("invoices.qrCode")}</p>
          <canvas ref={qrRef} />
        </div>

        <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
          <p className="text-sm font-semibold text-muted-foreground mb-3">Detail Invoice</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tipe</span>
              <span className="font-medium">{TYPE_LABELS[order.type] || order.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status Bayar</span>
              <span className={`font-medium ${PAYMENT_STYLES[paymentStatus]?.split(" ")[2] || ""}`}>{paymentStatus}</span>
            </div>
            {order.status !== "selesai" && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status Pesanan</span>
                <span className="font-medium">{order.status}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tanggal</span>
              <span className="font-medium">{new Date(order.date).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dibuat</span>
              <span className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
