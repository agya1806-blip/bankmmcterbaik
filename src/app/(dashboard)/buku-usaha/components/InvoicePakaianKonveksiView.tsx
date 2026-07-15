"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  FileText, MessageSquare, Image, CreditCard, Shirt,
  Printer, CheckCircle2, AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useProfilUsahaStore } from "../percetakan/store/useProfilUsahaStore";
import { useBusinessStore } from "@/store/useBusinessStore";
import { ImgFromIdb } from "@/components/img-from-idb";

/* ─── Types ─── */
export interface FashionInvoiceItem {
  no: number;
  item: string;
  varian: string;
  detailProduksi: string;
  qty: number;
  harga: number;
  jumlah: number;
}

export interface FashionInvoiceData {
  id: string;
  tanggal: string;
  customer: string;
  noWA: string;
  kategori: string;
  mode: "ready" | "custom";
  statusLabel: string;
  statusColor: string;
  items: FashionInvoiceItem[];
  subtotal: number;
  dp: number;
  sisa: number;
  pembayaran: string;
  rekeningBank: string;
  rekeningNomor: string;
  rekeningAtasNama: string;
}

interface Props {
  data: FashionInvoiceData;
  noRef?: string;
  preview?: boolean;
}

function formatRupiah(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

export default function InvoicePakaianKonveksiView({ data, noRef, preview }: Props) {
  const { profil } = useProfilUsahaStore();
  const paymentMethods = useBusinessStore((s) => s.paymentMethods);
  const enabledPayments = paymentMethods.filter((pm) => pm.isEnabled);
  const [mounted, setMounted] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const handleExportPNG = useCallback(async () => {
    try {
      const html2canvas = (await import("html2canvas")).default;
      if (!printRef.current) return;
      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true });
      const link = document.createElement("a");
      link.download = `Invoice-Fashion-${data.id}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("PNG berhasil diunduh");
    } catch {
      toast.error("html2canvas tidak tersedia");
    }
  }, [data.id]);

  const handleExportPDF = useCallback(async () => {
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      if (!printRef.current) return;
      const opt = {
        margin: [0.5, 0.5, 0.5, 0.5] as [number, number, number, number],
        filename: `Invoice-Fashion-${data.id}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" as const },
      };
      html2pdf().set(opt).from(printRef.current).save();
      toast.success("PDF A4 sedang diunduh");
    } catch {
      window.print();
    }
  }, [data.id]);

  const handleKirimWA = useCallback(() => {
    const waCustomer = data.noWA.replace(/[^0-9]/g, "");
    const prefix = waCustomer.startsWith("0") ? "62" + waCustomer.slice(1) : waCustomer.startsWith("62") ? waCustomer : "62" + waCustomer;
    const waToko = profil.noWA.replace(/[^0-9]/g, "");
    const prefixToko = waToko.startsWith("0") ? "62" + waToko.slice(1) : waToko;

    const itemsText = data.items.map((i) =>
      `${i.no}. ${i.item} (${i.varian})${i.detailProduksi ? `\n   ${i.detailProduksi}` : ""}\n   x${i.qty} = ${formatRupiah(i.jumlah)}`
    ).join("\n");

    const paymentLines = enabledPayments.map((pm) => {
      let line = `• ${pm.namaMetode}`;
      if (pm.bankName) line += ` (${pm.bankName})`;
      line += ` — ${pm.accountNo}`;
      if (pm.accountName) line += ` a.n ${pm.accountName}`;
      return line;
    }).join("\n");

    const msg = `*INVOICE FASHION ${profil.nama.toUpperCase()}*
No: ${data.id}
Tgl: ${data.tanggal}
Customer: ${data.customer}
Status: ${data.statusLabel}

*Item:*
${itemsText}

Total: ${formatRupiah(data.subtotal)}
DP: ${formatRupiah(data.dp)}
Sisa: ${formatRupiah(data.sisa)}

${profil.nama}
${profil.alamat}
WA: ${profil.noWA}

*Metode Pembayaran:*
${paymentLines || `${data.rekeningBank} a.n ${data.rekeningAtasNama} — ${data.rekeningNomor}`}

_Barang yang sudah dipotong/diproduksi tidak dapat dibatalkan. Toleransi ukuran +/- 1-2 cm._
Terima kasih — ${profil.nama}`;

    window.open(`https://wa.me/${prefix || prefixToko}?text=${encodeURIComponent(msg)}`, "_blank");
    toast.success("Pesan WA dibuka");
  }, [data, profil, enabledPayments]);

  const lunas = data.sisa <= 0;

  if (!mounted) return <div className="min-h-[60vh]" />;

  return (
    <div className="space-y-4">
      <div id="invoice-print-area" ref={printRef}
        className="bg-white text-gray-900 rounded-2xl shadow-2xl p-6 sm:p-8 print:p-4 print:shadow-none max-w-[210mm] mx-auto"
        style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}
      >
        {/* ─── HEADER ─── */}
        <div className="text-center border-b border-gray-200 pb-5 mb-5">
          {profil.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profil.logo} alt="" className="h-16 mx-auto mb-3 object-contain" />
          ) : (
            <div className="size-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg">
              <Shirt className="size-8 text-white" />
            </div>
          )}
          <h1 className="text-xl font-bold tracking-tight text-gray-900">{profil.nama}</h1>
          <p className="text-[10px] text-gray-500 mt-0.5">{profil.alamat} | WA: {profil.noWA}</p>
          {profil.subLayanan.length > 0 && (
            <ul className="flex flex-wrap justify-center gap-x-4 gap-y-0.5 mt-2">
              {profil.subLayanan.map((s, i) => (
                <li key={i} className="text-[9px] text-gray-400 before:content-['•'] before:mr-1 before:text-rose-400">{s}</li>
              ))}
            </ul>
          )}
        </div>

        {/* ─── METADATA ─── */}
        <div className="flex items-start justify-between mb-5">
          <div className="space-y-1 text-[11px]">
            <p className="text-gray-400 text-[9px] uppercase tracking-wider font-semibold">INVOICE FASHION</p>
            <p><span className="text-gray-500">ID:</span> <span className="font-semibold">{data.id}</span></p>
            <p><span className="text-gray-500">Tanggal:</span> {data.tanggal}</p>
            <p><span className="text-gray-500">Kategori:</span> {data.kategori}</p>
          </div>
          <div className="text-right">
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold ${
              lunas
                ? "text-emerald-700 bg-emerald-100"
                : "text-amber-700 bg-amber-100"
            }`}>
              {lunas ? <CheckCircle2 className="size-3" /> : <AlertTriangle className="size-3" />}
              {data.statusLabel}
            </span>
          </div>
        </div>

        {/* ─── PELANGGAN ─── */}
        <div className="bg-gray-50 rounded-xl p-3.5 mb-5 text-[11px]">
          <p className="text-gray-400 text-[9px] uppercase tracking-wider font-semibold mb-1">PELANGGAN</p>
          <p className="font-semibold">{data.customer}</p>
          <p className="text-gray-500">{data.noWA}</p>
        </div>

        {/* ─── TABEL ─── */}
        <table className="w-full text-[10px] mb-5">
          <thead>
            <tr className="bg-rose-50 border-b border-rose-200">
              <th className="text-left py-2.5 px-2 font-semibold text-gray-600 w-8">NO</th>
              <th className="text-left py-2.5 px-2 font-semibold text-gray-600">ITEM / VARIAN</th>
              <th className="text-right py-2.5 px-2 font-semibold text-gray-600 w-10">QTY</th>
              <th className="text-right py-2.5 px-2 font-semibold text-gray-600 w-20">HARGA</th>
              <th className="text-right py-2.5 px-2 font-semibold text-gray-600 w-20">JUMLAH</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/70"}>
                <td className="py-2.5 px-2 text-gray-500 align-top">{row.no}</td>
                <td className="py-2.5 px-2">
                  <p className="font-medium">{row.item}</p>
                  <p className="text-[9px] text-gray-500 mt-0.5">
                    {row.varian && <>Varian: {row.varian}</>}
                  </p>
                  {row.detailProduksi && (
                    <p className="text-[9px] text-rose-600/70 mt-0.5 italic">{row.detailProduksi}</p>
                  )}
                </td>
                <td className="py-2.5 px-2 text-right align-top">{row.qty}</td>
                <td className="py-2.5 px-2 text-right align-top tabular-nums">{formatRupiah(row.harga)}</td>
                <td className="py-2.5 px-2 text-right align-top tabular-nums font-semibold">{formatRupiah(row.jumlah)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ─── TOTALS + DP PROGRESS ─── */}
        <div className="flex justify-end mb-5">
          <div className="w-full max-w-xs space-y-1.5 text-[11px]">
            <div className="flex justify-between py-1">
              <span className="text-gray-500">Total</span>
              <span className="font-semibold tabular-nums">{formatRupiah(data.subtotal)}</span>
            </div>
            <div className="flex justify-between py-1 border-t border-gray-100">
              <span className="text-gray-500">Uang Muka (DP)</span>
              <span className="tabular-nums text-emerald-600">{formatRupiah(data.dp)}</span>
            </div>
            <div className="flex justify-between py-2 border-t-2 border-gray-200">
              <span className="font-bold text-sm">Sisa Tagihan</span>
              <span className={`font-bold text-sm tabular-nums ${data.sisa > 0 ? "text-red-700" : "text-emerald-700"}`}>
                {data.sisa > 0 ? formatRupiah(data.sisa) : "LUNAS"}
              </span>
            </div>
            {data.subtotal > 0 && (
              <div className="space-y-1 pt-1">
                <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all"
                    style={{ width: `${Math.min((data.dp / data.subtotal) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-[9px] text-gray-400 text-right tabular-nums">
                  DP ({Math.round((data.dp / data.subtotal) * 100)}%) | {formatRupiah(data.dp)} / {formatRupiah(data.subtotal)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ─── FOOTER ─── */}
        <div className="bg-gradient-to-r from-rose-50 to-gray-50 rounded-xl p-4 border border-rose-100 mb-4">
          <div className="flex items-start gap-3">
            <Shirt className="size-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="text-[9px] text-gray-600 space-y-0.5">
              <p className="font-semibold text-gray-700 text-[10px]">Syarat & Ketentuan Konveksi</p>
              <p>Barang yang sudah dipotong/diproduksi sesuai detail spesifikasi di atas tidak dapat dibatalkan.</p>
              <p>Toleransi ukuran produksi +/- 1-2 cm.</p>
            </div>
          </div>
        </div>

        {/* ─── METODE BAYAR DINAMIS ─── */}
        <div className="space-y-2">
          {enabledPayments.length > 0 ? (
            enabledPayments.map((pm) => (
              <div key={pm.id} className="bg-gradient-to-r from-blue-50 to-gray-50 rounded-xl p-3 border border-blue-100 flex items-start gap-3">
                <CreditCard className="size-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-[10px] space-y-0.5 flex-1">
                  <p className="font-semibold text-gray-700">{pm.namaMetode}</p>
                  {pm.bankName && <p className="text-gray-500">{pm.bankName}</p>}
                  <p className="text-gray-500">{pm.accountNo}</p>
                  {pm.accountName && <p className="text-gray-500">a.n {pm.accountName}</p>}
                </div>
                {pm.qrisImageUrl && (
                  <div className="shrink-0">
                    <ImgFromIdb src={pm.qrisImageUrl} alt="QRIS" className="size-16 rounded-lg border border-gray-200 object-contain bg-white" />
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-gradient-to-r from-blue-50 to-gray-50 rounded-xl p-4 border border-blue-100 flex items-start gap-3">
              <CreditCard className="size-5 text-blue-500 shrink-0 mt-0.5" />
              <div className="text-[10px] space-y-1 flex-1">
                <p className="font-semibold text-gray-700">Metode Pembayaran: {data.pembayaran}</p>
                <p className="text-gray-500">{data.rekeningBank} — {data.rekeningNomor}</p>
                <p className="text-gray-500">a.n {data.rekeningAtasNama}</p>
              </div>
            </div>
          )}
          <p className="text-[9px] text-gray-400 flex items-center gap-1">
            <MessageSquare className="size-3 text-green-500" />
            Kirim bukti transfer via WhatsApp setelah pembayaran.
          </p>
        </div>

        <div className="text-center mt-5 pt-3 border-t border-gray-100">
          <p className="text-[8px] text-gray-300">
            Invoice ini sah dan diproses oleh {profil.nama} &mdash; {noRef || "MUGHIS BANK v3 Enterprise"}
          </p>
        </div>
      </div>

      {/* ─── ACTIONS ─── */}
      {preview ? (
        <div className="text-center py-2">
          <span className="inline-block px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-[9px] font-semibold uppercase tracking-wider">
            Live Preview — Format Invoice
          </span>
        </div>
      ) : (
      <div className="flex flex-wrap items-center justify-center gap-3 print:hidden">
        <button onClick={handleExportPNG}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white text-[10px] font-bold shadow-lg shadow-rose-500/20 hover:shadow-xl hover:shadow-rose-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
        >
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image className="size-4" /> Ekspor PNG
        </button>
        <button onClick={handleExportPDF}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 text-white text-[10px] font-bold shadow-lg shadow-rose-500/20 hover:shadow-xl hover:shadow-rose-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
        >
          <FileText className="size-4" /> Unduh PDF A4
        </button>
        <button onClick={handleKirimWA}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-[10px] font-bold shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
        >
          <MessageSquare className="size-4" /> Kirim WA Invoice
        </button>
        <button onClick={() => window.print()}
          className="px-4 py-2.5 rounded-xl bg-muted/50 text-muted-foreground text-[10px] font-bold hover:bg-muted/80 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
        >
          <Printer className="size-4" /> Cetak
        </button>
      </div>
      )}
    </div>
  );
}
