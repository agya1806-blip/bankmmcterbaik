"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  Download, FileText, MessageSquare, Image, CreditCard, Smartphone,
  Shield, AlertTriangle, CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useProfilUsahaStore } from "../percetakan/store/useProfilUsahaStore";
import { useBusinessStore } from "@/store/useBusinessStore";

/* ─── Types ─── */
export interface GadgetInvoiceItem {
  no: number;
  item: string;
  spesifikasi: string;
  imeiSn: string;
  garansi: string;
  qty: number;
  harga: number;
  jumlah: number;
}

export interface GadgetTradeIn {
  aktif: boolean;
  unitBekas: string;
  imeiSnBekas: string;
  nilaiTaksir: number;
}

export interface GadgetOrderInvoiceData {
  id: string;
  tanggal: string;
  customer: string;
  noWA: string;
  kategori: string;
  statusBayar: "lunas" | "piutang";
  statusLabel: string;
  statusColor: string;
  items: GadgetInvoiceItem[];
  tradeIn: GadgetTradeIn;
  subtotal: number;
  potonganTradeIn: number;
  total: number;
  dp: number;
  sisa: number;
  pembayaran: string;
  rekeningBank: string;
  rekeningNomor: string;
  rekeningAtasNama: string;
}

interface Props {
  data: GadgetOrderInvoiceData;
  noRef?: string;
  preview?: boolean;
}

function formatRupiah(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

export default function InvoiceGadgetLaptopView({ data, noRef, preview }: Props) {
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
      link.download = `Nota-Gadget-${data.id}.png`;
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
        filename: `Nota-Gadget-${data.id}.pdf`,
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
      `${i.no}. ${i.item}\n   IMEI/SN: ${i.imeiSn}\n   Garansi: ${i.garansi}\n   ${formatRupiah(i.jumlah)}`
    ).join("\n");

    const tradeText = data.tradeIn.aktif
      ? `\n*Tukar Tambah:*\n${data.tradeIn.unitBekas} (${data.tradeIn.imeiSnBekas}) — Potongan: ${formatRupiah(data.tradeIn.nilaiTaksir)}\n`
      : "";

    const paymentLines = enabledPayments.map((pm) => {
      let line = `• ${pm.namaMetode}`;
      if (pm.bankName) line += ` (${pm.bankName})`;
      line += ` — ${pm.accountNo}`;
      if (pm.accountName) line += ` a.n ${pm.accountName}`;
      return line;
    }).join("\n");

    const msg = `*NOTA GADGET & LAPTOP ${profil.nama.toUpperCase()}*
No: ${data.id}
Tgl: ${data.tanggal}
Customer: ${data.customer}
Status: ${data.statusLabel}

*Detail Unit:*
${itemsText}
${tradeText}
*Total: ${formatRupiah(data.total)}*
DP: ${formatRupiah(data.dp)}
Sisa: ${formatRupiah(data.sisa)}

${profil.nama}
${profil.alamat}
WA: ${profil.noWA}

*Metode Pembayaran:*
${paymentLines || `${data.rekeningBank} a.n ${data.rekeningAtasNama} — ${data.rekeningNomor}`}

_Garansi tidak berlaku jika segel rusak, terkena air, atau human error. Wajib bawa nota ini saat klaim._
Terima kasih — ${profil.nama}`;

    window.open(`https://wa.me/${prefix || prefixToko}?text=${encodeURIComponent(msg)}`, "_blank");
    toast.success("Pesan WA dibuka");
  }, [data, profil, enabledPayments]);

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
        {/* ─── HEADER DINAMIS ─── */}
        <div className="text-center border-b border-gray-200 pb-5 mb-5">
          {profil.logo ? (
            <img src={profil.logo} alt="Logo" className="h-16 mx-auto mb-3 object-contain" />
          ) : (
            <div className="size-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Smartphone className="size-8 text-white" />
            </div>
          )}
          <h1 className="text-xl font-bold tracking-tight text-gray-900">{profil.nama}</h1>
          <p className="text-[10px] text-gray-500 mt-0.5">{profil.alamat} | WA: {profil.noWA}</p>
          {profil.subLayanan.length > 0 && (
            <ul className="flex flex-wrap justify-center gap-x-4 gap-y-0.5 mt-2">
              {profil.subLayanan.map((s, i) => (
                <li key={i} className="text-[9px] text-gray-400 before:content-['•'] before:mr-1 before:text-cyan-400">{s}</li>
              ))}
            </ul>
          )}
        </div>

        {/* ─── METADATA ─── */}
        <div className="flex items-start justify-between mb-5">
          <div className="space-y-1 text-[11px]">
            <p className="text-gray-400 text-[9px] uppercase tracking-wider font-semibold">NOTA GADGET & LAPTOP</p>
            <p><span className="text-gray-500">ID:</span> <span className="font-semibold">{data.id}</span></p>
            <p><span className="text-gray-500">Tanggal:</span> {data.tanggal}</p>
            <p><span className="text-gray-500">Kategori:</span> {data.kategori}</p>
          </div>
          <div className="text-right">
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold ${
              data.statusBayar === "lunas"
                ? "text-emerald-700 bg-emerald-100"
                : "text-amber-700 bg-amber-100"
            }`}>
              {data.statusBayar === "lunas" ? <CheckCircle2 className="size-3" /> : <AlertTriangle className="size-3" />}
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

        {/* ─── TABEL ITEM ─── */}
        <table className="w-full text-[10px] mb-4">
          <thead>
            <tr className="bg-cyan-50 border-b border-cyan-200">
              <th className="text-left py-2.5 px-2 font-semibold text-gray-600 w-8">NO</th>
              <th className="text-left py-2.5 px-2 font-semibold text-gray-600">ITEM / SPESIFIKASI</th>
              <th className="text-right py-2.5 px-2 font-semibold text-gray-600 w-10">QTY</th>
              <th className="text-right py-2.5 px-2 font-semibold text-gray-600 w-20">HARGA</th>
              <th className="text-right py-2.5 px-2 font-semibold text-gray-600 w-20">JUMLAH</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/70"}>
                <td className="py-2 px-2 text-gray-500 align-top">{row.no}</td>
                <td className="py-2 px-2">
                  <p className="font-medium">{row.item}</p>
                  {row.spesifikasi && <p className="text-[9px] text-gray-500 mt-0.5">{row.spesifikasi}</p>}
                  <div className="flex items-center gap-3 mt-1 text-[9px]">
                    <span className="text-gray-400"><span className="font-medium text-gray-600">IMEI/SN:</span> {row.imeiSn}</span>
                    <span className="flex items-center gap-0.5 text-cyan-600">
                      <Shield className="size-2.5" /> {row.garansi}
                    </span>
                  </div>
                </td>
                <td className="py-2 px-2 text-right align-top">{row.qty}</td>
                <td className="py-2 px-2 text-right align-top tabular-nums">{formatRupiah(row.harga)}</td>
                <td className="py-2 px-2 text-right align-top tabular-nums font-semibold">{formatRupiah(row.jumlah)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ─── TUKAR TAMBAH ─── */}
        {data.tradeIn.aktif && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-3 mb-4 text-[10px] border border-amber-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-6 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Shield className="size-3 text-amber-600" />
                </div>
                <span className="font-semibold">Potongan Tukar Tambah</span>
                <span className="text-gray-500">{data.tradeIn.unitBekas} ({data.tradeIn.imeiSnBekas})</span>
              </div>
              <span className="font-bold text-red-600 tabular-nums">- {formatRupiah(data.tradeIn.nilaiTaksir)}</span>
            </div>
          </div>
        )}

        {/* ─── TOTALS ─── */}
        <div className="flex justify-end mb-5">
          <div className="w-full max-w-xs space-y-1.5 text-[11px]">
            <div className="flex justify-between py-1">
              <span className="text-gray-500">Subtotal</span>
              <span className="tabular-nums">{formatRupiah(data.subtotal)}</span>
            </div>
            {data.tradeIn.aktif && (
              <div className="flex justify-between py-1 text-red-600">
                <span>Potongan Tukar Tambah</span>
                <span className="tabular-nums">- {formatRupiah(data.tradeIn.nilaiTaksir)}</span>
              </div>
            )}
            <div className="flex justify-between py-1 border-t border-gray-100">
              <span className="font-semibold">Total</span>
              <span className="font-semibold tabular-nums">{formatRupiah(data.total)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-500">Dibayar</span>
              <span className="tabular-nums text-emerald-600">{formatRupiah(data.dp)}</span>
            </div>
            <div className="flex justify-between py-2 border-t-2 border-gray-200">
              <span className="font-bold text-sm">Sisa</span>
              <span className={`font-bold text-sm tabular-nums ${data.sisa > 0 ? "text-red-700" : "text-emerald-700"}`}>
                {data.sisa > 0 ? formatRupiah(data.sisa) : "LUNAS"}
              </span>
            </div>
            {data.total > 0 && data.sisa > 0 && (
              <div className="space-y-1 pt-1">
                <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all"
                    style={{ width: `${Math.min((data.dp / data.total) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-[9px] text-gray-400 text-right tabular-nums">
                  Dibayar ({Math.round((data.dp / data.total) * 100)}%) | {formatRupiah(data.dp)} / {formatRupiah(data.total)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ─── FOOTER GARANSI ─── */}
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-4 border border-cyan-100 mb-4">
          <div className="flex items-start gap-3">
            <Shield className="size-5 text-cyan-600 shrink-0 mt-0.5" />
            <div className="text-[9px] text-gray-600 space-y-0.5">
              <p className="font-semibold text-gray-700 text-[10px]">Syarat & Ketentuan Garansi</p>
              <p>Garansi tidak berlaku jika segel rusak, terkena air, atau kesalahan pengguna (human error).</p>
              <p>Wajib membawa nota ini saat klaim garansi.</p>
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
            Nota ini sah dan diproses oleh {profil.nama} &mdash; {noRef || "MUGHIS BANK v3 Enterprise"}
          </p>
        </div>
      </div>

      {/* ─── ACTION BUTTONS ─── */}
      {preview ? (
        <div className="text-center py-2">
          <span className="inline-block px-3 py-1 rounded-full bg-cyan-100 text-cyan-700 text-[9px] font-semibold uppercase tracking-wider">
            Live Preview — Format Nota
          </span>
        </div>
      ) : (
      <div className="flex flex-wrap items-center justify-center gap-3 print:hidden">
        <button onClick={handleExportPNG}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 text-white text-[10px] font-bold shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
        >
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
          <MessageSquare className="size-4" /> Kirim WA
        </button>
        <button onClick={() => window.print()}
          className="px-4 py-2.5 rounded-xl bg-muted/50 text-muted-foreground text-[10px] font-bold hover:bg-muted/80 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
        >
          <Download className="size-4" /> Cetak
        </button>
      </div>
      )}
    </div>
  );
}
