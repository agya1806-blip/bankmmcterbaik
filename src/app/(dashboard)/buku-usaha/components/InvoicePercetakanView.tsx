"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  Download, FileText, MessageSquare, Image, CreditCard, Printer,
} from "lucide-react";
import toast from "react-hot-toast";
import { useProfilUsahaStore } from "../percetakan/store/useProfilUsahaStore";
import { useBusinessStore } from "@/store/useBusinessStore";

/* ─── Types ─── */
export interface InvoiceItem {
  no: number;
  item: string;
  qty: number;
  harga: number;
  jumlah: number;
}

export interface OrderInvoiceData {
  id: string;
  tanggal: string;
  customer: string;
  noWA: string;
  kategori: string;
  status: string;
  statusLabel: string;
  statusColor: string;
  deskripsi: string;
  spesifikasi: string;
  ukuran: string;
  ukuranJadi: string;
  kertasIsi: string;
  cover: string;
  laminasi: string;
  wrapping: string;
  jilid: string;
  items: InvoiceItem[];
  total: number;
  dp: number;
  sisa: number;
  pembayaran: string;
  rekeningBank: string;
  rekeningNomor: string;
  rekeningAtasNama: string;
}

interface Props {
  data: OrderInvoiceData;
  noRef?: string;
  preview?: boolean;
}

function formatRupiah(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

export default function InvoicePercetakanView({ data, noRef, preview }: Props) {
  const { profil } = useProfilUsahaStore();
  const paymentMethods = useBusinessStore((s) => s.paymentMethods);
  const enabledPayments = paymentMethods.filter((pm) => pm.isEnabled);
  const [mounted, setMounted] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  /* ─── Export Handler ─── */
  const handleExportPNG = useCallback(async () => {
    try {
      const html2canvas = (await import("html2canvas")).default;
      if (!printRef.current) return;
      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true });
      const link = document.createElement("a");
      link.download = `Invoice-${data.id}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("PNG berhasil diunduh");
    } catch {
      toast.error("html2canvas tidak tersedia, install: npm i html2canvas");
    }
  }, [data.id]);

  const handleExportPDF = useCallback(async () => {
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      if (!printRef.current) return;
      const opt = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `Invoice-${data.id}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
      };
      html2pdf().set(opt).from(printRef.current).save();
      toast.success("PDF A4 sedang diunduh");
    } catch {
      window.print();
    }
  }, [data.id]);

  const handleKirimWA = useCallback(() => {
    /* Gunakan nomor dari profil toko sebagai pengirim formal */
    const waToko = profil.noWA.replace(/[^0-9]/g, "");
    const prefixToko = waToko.startsWith("0") ? "62" + waToko.slice(1) : waToko.startsWith("62") ? waToko : "62" + waToko;

    const waCustomer = data.noWA.replace(/[^0-9]/g, "");
    const prefixCustomer = waCustomer.startsWith("0") ? "62" + waCustomer.slice(1) : waCustomer.startsWith("62") ? waCustomer : "62" + waCustomer;
    const targetWA = prefixCustomer || prefixToko;

    const totalStr = formatRupiah(data.total);
    const dpStr = formatRupiah(data.dp);
    const sisaStr = formatRupiah(data.sisa);

    const subBullet = profil.subLayanan.map((s) => `• ${s}`).join("\n");

    const paymentLines = enabledPayments.map((pm) => {
      let line = `• ${pm.namaMetode}`;
      if (pm.bankName) line += ` (${pm.bankName})`;
      line += ` — ${pm.accountNo}`;
      if (pm.accountName) line += ` a.n ${pm.accountName}`;
      return line;
    }).join("\n");

    const msg = `*INVOICE ${profil.nama.toUpperCase()}*
No: ${data.id}
Tgl: ${data.tanggal}
Customer: ${data.customer}
Total: ${totalStr}
DP: ${dpStr}
Sisa: ${sisaStr}
Status: ${data.statusLabel}

*Detail Pesanan:*
${data.deskripsi}
${data.spesifikasi}

*Layanan Kami:*
${subBullet}

*${profil.nama}*
${profil.alamat}
WA: ${profil.noWA}

*Metode Pembayaran:*
${paymentLines || data.pembayaran}

_Kirim bukti transfer via WA setelah pembayaran._
Terima kasih — ${profil.nama}`;

    window.open(`https://wa.me/${targetWA}?text=${encodeURIComponent(msg)}`, "_blank");
    toast.success("Pesan WA dibuka di tab baru");
  }, [data, profil]);

  if (!mounted) return <div className="min-h-[60vh]" />;

  return (
    <div className="space-y-4">
      {/* ─── INVOICE A4 ─── */}
      <div
        id="invoice-print-area"
        ref={printRef}
        className="bg-white text-gray-900 rounded-2xl shadow-2xl p-6 sm:p-8 print:p-4 print:shadow-none max-w-[210mm] mx-auto"
        style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}
      >
        {/* ─── HEADER BRANDING DINAMIS ─── */}
        <div className="text-center border-b border-gray-200 pb-5 mb-5">
          {profil.logo ? (
            <img src={profil.logo} alt="Logo" className="h-16 mx-auto mb-3 object-contain" />
          ) : (
            <div className="size-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
              <Printer className="size-8 text-white" />
            </div>
          )}
          <h1 className="text-xl font-bold tracking-tight text-gray-900">{profil.nama}</h1>
          <p className="text-[10px] text-gray-500 mt-0.5">{profil.alamat} | WA: {profil.noWA}</p>
          {profil.subLayanan.length > 0 && (
            <ul className="flex flex-wrap justify-center gap-x-4 gap-y-0.5 mt-2">
              {profil.subLayanan.map((s, i) => (
                <li key={i} className="text-[9px] text-gray-400 before:content-['•'] before:mr-1 before:text-indigo-400">
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ─── METADATA ─── */}
        <div className="flex items-start justify-between mb-5">
          <div className="space-y-1 text-[11px]">
            <p className="text-gray-400 text-[9px] uppercase tracking-wider font-semibold">PESANAN</p>
            <p><span className="text-gray-500">ID:</span> <span className="font-semibold">{data.id}</span></p>
            <p><span className="text-gray-500">Tanggal:</span> {data.tanggal}</p>
            <p><span className="text-gray-500">Kategori:</span> {data.kategori}</p>
          </div>
          <div className="text-right">
            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold ${data.statusColor}`}>
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

        {/* ─── SPESIFIKASI TEKNIS ─── */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-3.5 mb-5 text-[10px] space-y-1">
          <p className="text-gray-400 text-[9px] uppercase tracking-wider font-semibold mb-1.5">SPESIFIKASI TEKNIS</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <p><span className="text-gray-500">Ukuran:</span> {data.ukuran}</p>
            <p><span className="text-gray-500">Jilid:</span> {data.jilid}</p>
            <p><span className="text-gray-500">Ukuran Jadi:</span> {data.ukuranJadi}</p>
            <p><span className="text-gray-500">Kertas Isi:</span> {data.kertasIsi}</p>
            <p><span className="text-gray-500">Cover:</span> {data.cover}</p>
            <p><span className="text-gray-500">Laminating:</span> {data.laminasi}</p>
            <p><span className="text-gray-500">Wrapping:</span> {data.wrapping}</p>
          </div>
        </div>

        {/* ─── STRIPED TABLE ─── */}
        <table className="w-full text-[11px] mb-5">
          <thead>
            <tr className="bg-amber-50 border-b border-amber-200">
              <th className="text-left py-2.5 px-2 font-semibold text-gray-600 w-8">NO</th>
              <th className="text-left py-2.5 px-2 font-semibold text-gray-600">ITEM</th>
              <th className="text-right py-2.5 px-2 font-semibold text-gray-600 w-12">QTY</th>
              <th className="text-right py-2.5 px-2 font-semibold text-gray-600 w-20">HARGA</th>
              <th className="text-right py-2.5 px-2 font-semibold text-gray-600 w-20">JUMLAH</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/70"}>
                <td className="py-2 px-2 text-gray-500">{row.no}</td>
                <td className="py-2 px-2 font-medium">{row.item}</td>
                <td className="py-2 px-2 text-right">{row.qty}</td>
                <td className="py-2 px-2 text-right tabular-nums">{formatRupiah(row.harga)}</td>
                <td className="py-2 px-2 text-right tabular-nums font-semibold">{formatRupiah(row.jumlah)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ─── TOTALS ─── */}
        <div className="flex justify-end mb-5">
          <div className="w-64 space-y-1.5 text-[11px]">
            <div className="flex justify-between py-1">
              <span className="text-gray-500">Total</span>
              <span className="font-semibold tabular-nums">{formatRupiah(data.total)}</span>
            </div>
            <div className="flex justify-between py-1 border-t border-gray-100">
              <span className="text-gray-500">DP Dibayar</span>
              <span className="font-semibold tabular-nums text-emerald-600">{formatRupiah(data.dp)}</span>
            </div>
            <div className="flex justify-between py-2 border-t-2 border-gray-200">
              <span className="font-bold text-sm">Sisa</span>
              <span className="font-bold text-sm tabular-nums text-red-700">{formatRupiah(data.sisa)}</span>
            </div>
            {data.total > 0 && (
              <div className="space-y-1 pt-1">
                <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all"
                    style={{ width: `${Math.min((data.dp / data.total) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-[9px] text-gray-400 text-right tabular-nums">
                  DP ({Math.round((data.dp / data.total) * 100)}%) | {formatRupiah(data.dp)} / {formatRupiah(data.total)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ─── FOOTER PEMBAYARAN DINAMIS ─── */}
        <div className="space-y-2 mb-4">
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
                    <img src={pm.qrisImageUrl} alt="QRIS" className="size-16 rounded-lg border border-gray-200 object-contain bg-white" />
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

        {/* ─── FOOTER ─── */}
        <div className="text-center mt-5 pt-3 border-t border-gray-100">
          <p className="text-[8px] text-gray-300">
            Invoice ini sah dan diproses oleh sistem {profil.nama} &mdash; {noRef || "MUGHIS BANK v3 Enterprise"}
          </p>
        </div>
      </div>

      {/* ─── ACTION BUTTONS ─── */}
      {preview ? (
        <div className="text-center py-2">
          <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-[9px] font-semibold uppercase tracking-wider">
            Live Preview — Format Nota
          </span>
        </div>
      ) : (
      <div className="flex flex-wrap items-center justify-center gap-3 print:hidden">
        <button
          onClick={handleExportPNG}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white text-[10px] font-bold shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
        >
          <Image className="size-4" /> Ekspor PNG
        </button>
        <button
          onClick={handleExportPDF}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 text-white text-[10px] font-bold shadow-lg shadow-rose-500/20 hover:shadow-xl hover:shadow-rose-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
        >
          <FileText className="size-4" /> Unduh PDF A4
        </button>
        <button
          onClick={handleKirimWA}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-[10px] font-bold shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
        >
          <MessageSquare className="size-4" /> Kirim WA via {profil.noWA}
        </button>
        <button
          onClick={() => window.print()}
          className="px-4 py-2.5 rounded-xl bg-muted/50 text-muted-foreground text-[10px] font-bold hover:bg-muted/80 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
        >
          <Printer className="size-4" /> Cetak
        </button>
      </div>
      )}
    </div>
  );
}
