"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  Download, FileText, MessageSquare, Image, CreditCard, Coffee,
  ShoppingBag, Printer,
} from "lucide-react";
import toast from "react-hot-toast";
import { useProfilUsahaStore } from "../percetakan/store/useProfilUsahaStore";
import { useBusinessStore } from "@/store/useBusinessStore";

/* ─── Types ─── */
export interface BillItem {
  nama: string;
  qty: number;
  hargaSatuan: number;
  jumlah: number;
}

export interface BillData {
  id: string;
  tanggal: string;
  jam: string;
  noMeja: string;
  pelanggan: string;
  tipe: "dine-in" | "take-away";
  kasir: string;
  items: BillItem[];
  total: number;
  tunai: number;
  kembalian: number;
  metodeBayar: string;
}

interface Props {
  data: BillData;
  noRef?: string;
  preview?: boolean;
}

function formatRupiah(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function pad(i: number) {
  return String(i).padStart(2, "0");
}

export default function BillWarkopKelontongView({ data, noRef, preview }: Props) {
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
      link.download = `Bill-${data.id}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("PNG bill berhasil diunduh");
    } catch {
      toast.error("html2canvas tidak tersedia");
    }
  }, [data.id]);

  const handleExportPDF = useCallback(async () => {
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      if (!printRef.current) return;
      const opt = {
        margin: [0.3, 0.3, 0.3, 0.3],
        filename: `Bill-${data.id}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
      };
      html2pdf().set(opt).from(printRef.current).save();
      toast.success("PDF bill sedang diunduh");
    } catch {
      window.print();
    }
  }, [data.id]);

  const handleKirimWA = useCallback(() => {
    const waToko = profil.noWA.replace(/[^0-9]/g, "");
    const prefix = waToko.startsWith("0") ? "62" + waToko.slice(1) : waToko.startsWith("62") ? waToko : "62" + waToko;

    const lines = data.items.map((i) => `${i.nama} x${i.qty} @${formatRupiah(i.hargaSatuan)}  = ${formatRupiah(i.jumlah)}`).join("\n");

    const msg = `🛒 *FAKTUR PENJUALAN — ${profil.nama.toUpperCase()}*
${profil.alamat} | WA: ${profil.noWA}
${"=".repeat(30)}
No: ${data.id}
Tgl/Jam: ${data.tanggal} ${data.jam}
Meja/Pelanggan: ${data.noMeja || data.pelanggan}
Tipe: ${data.tipe === "dine-in" ? "Dine In" : "Take Away"}
Kasir: ${data.kasir}
${"=".repeat(30)}
${lines}
${"=".repeat(30)}
Total: ${formatRupiah(data.total)}
Tunai: ${formatRupiah(data.tunai)}
Kembali: ${formatRupiah(data.kembalian)}
${"=".repeat(30)}
${data.metodeBayar}
${"=".repeat(30)}
_Terima kasih atas kunjungan Anda!_
_Selamat menikmati._ 🎉

${profil.nama} — ${noRef || "MUGHIS BANK v3"}`;

    window.open(`https://wa.me/${prefix}?text=${encodeURIComponent(msg)}`, "_blank");
    toast.success("Bill WA dikirim");
  }, [data, profil, noRef]);

  if (!mounted) return <div className="min-h-[60vh]" />;

  const itemCount = data.items.reduce((s, i) => s + i.qty, 0);

  return (
    <div className="space-y-4">
      {/* ─── BILL ─── */}
      <div
        id="invoice-print-area"
        ref={printRef}
        className="bg-white text-gray-900 rounded-2xl shadow-2xl p-5 sm:p-7 print:p-3 print:shadow-none max-w-[210mm] mx-auto"
        style={{ fontFamily: "'Courier New', 'Inter', monospace, sans-serif" }}
      >
        {/* ─── HEADER ─── */}
        <div className="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
          {profil.logo ? (
            <img src={profil.logo} alt="Logo" className="h-12 mx-auto mb-2 object-contain" />
          ) : (
            <div className="size-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md">
              <Coffee className="size-6 text-white" />
            </div>
          )}
          <h1 className="text-base font-bold tracking-tight text-gray-900">{profil.nama}</h1>
          <p className="text-[9px] text-gray-500">{profil.alamat} | WA: {profil.noWA}</p>
          {profil.subLayanan.length > 0 && (
            <p className="text-[8px] text-gray-400 mt-0.5">{profil.subLayanan.slice(0, 3).join(" • ")}</p>
          )}
        </div>

        {/* ─── TITLE ─── */}
        <div className="text-center mb-4">
          <h2 className="text-sm font-bold tracking-wide uppercase">FAKTUR PENJUALAN / BILL</h2>
        </div>

        {/* ─── METADATA ─── */}
        <div className="text-[9px] space-y-0.5 mb-4 border-b border-dashed border-gray-200 pb-3">
          <div className="flex justify-between">
            <span className="text-gray-500">No Bill</span>
            <span className="font-semibold">{data.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Tanggal &amp; Jam</span>
            <span>{data.tanggal} {data.jam}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Meja / Pelanggan</span>
            <span>{data.noMeja || data.pelanggan || "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Tipe</span>
            <span>{data.tipe === "dine-in" ? "Dine In" : "Take Away"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Kasir</span>
            <span>{data.kasir}</span>
          </div>
        </div>

        {/* ─── TABLE ─── */}
        <div className="mb-4">
          <div className="flex justify-between text-[9px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 pb-1 mb-1">
            <span>ITEM</span>
            <span>JUMLAH</span>
          </div>
          <div className="space-y-1 text-[10px]">
            {data.items.map((item, i) => (
              <div key={i} className="flex justify-between">
                <span className="flex-1">
                  {item.nama}
                  <span className="text-gray-400 ml-1">x{item.qty}</span>
                  <span className="text-gray-400 ml-1">@ {formatRupiah(item.hargaSatuan)}</span>
                </span>
                <span className="font-semibold tabular-nums ml-2">{formatRupiah(item.jumlah)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── TOTAL & KEMBALIAN ─── */}
        <div className="border-t-2 border-double border-gray-300 pt-2 mb-4 space-y-1 text-[11px]">
          <div className="flex justify-between font-bold text-sm">
            <span>TOTAL</span>
            <span className="tabular-nums">{formatRupiah(data.total)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Item: {itemCount} jenis</span>
            <span></span>
          </div>
          <div className="flex justify-between pt-1 border-t border-gray-200">
            <span>Tunai / Bayar</span>
            <span className="tabular-nums">{formatRupiah(data.tunai)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-emerald-600">
            <span>Uang Kembali</span>
            <span className="tabular-nums">{formatRupiah(data.kembalian)}</span>
          </div>
        </div>

        {/* ─── METODE BAYAR ─── */}
        <div className="space-y-1.5 mb-3">
          {enabledPayments.length > 0 ? (
            enabledPayments.map((pm) => (
              <div key={pm.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-gradient-to-r from-blue-50 to-gray-50 border border-blue-100 text-[9px]">
                <div className="flex items-center gap-1.5">
                  <CreditCard className="size-3 text-blue-500 shrink-0" />
                  <span className="font-semibold">{pm.namaMetode}</span>
                  <span className="text-gray-500">{pm.accountNo}</span>
                </div>
                {pm.qrisImageUrl && (
                  <img src={pm.qrisImageUrl} alt="QRIS" className="size-10 rounded border border-gray-200 object-contain bg-white shrink-0" />
                )}
              </div>
            ))
          ) : (
            <div className="text-center text-[9px] text-gray-600">
              <CreditCard className="size-3 inline text-blue-500" /> {data.metodeBayar}
            </div>
          )}
        </div>

        {/* ─── FOOTER ─── */}
        <div className="text-center space-y-1">
          <p className="text-[9px] text-gray-400 italic">
            Terima kasih atas kunjungan Anda! Selamat menikmati.
          </p>
          <p className="text-[7px] text-gray-300">
            {profil.nama} — {noRef || "MUGHIS BANK v3 Enterprise"}
          </p>
        </div>
      </div>

      {/* ─── ACTION BUTTONS ─── */}
      {preview ? (
        <div className="text-center py-2">
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-semibold uppercase tracking-wider">
            Live Preview — Format Bill
          </span>
        </div>
      ) : (
      <div className="flex flex-wrap items-center justify-center gap-3 print:hidden">
        <button onClick={handleExportPNG}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-[10px] font-bold shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
        >
          <Image className="size-4" /> Ekspor PNG (Foto WA)
        </button>
        <button onClick={handleExportPDF}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 text-white text-[10px] font-bold shadow-lg shadow-rose-500/20 hover:shadow-xl hover:shadow-rose-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
        >
          <FileText className="size-4" /> Unduh PDF Bill
        </button>
        <button onClick={handleKirimWA}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-[10px] font-bold shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
        >
          <MessageSquare className="size-4" /> Kirim WA Struk Teks
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
