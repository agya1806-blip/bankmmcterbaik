"use client";

import React, { useEffect, useState } from "react";
import { type DbTransaction, type DbWallet, type DbProfile } from "@/lib/db-v4";
import QRCode from "qrcode";

const formatRp = (n: number) => `Rp${n.toLocaleString()}`;
const formatDate = (iso: string) => new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });

interface InvoiceA4Props {
  transaction: DbTransaction;
  wallet: DbWallet | undefined;
  profile: DbProfile | undefined;
  cabangSlug: string;
  onClose: () => void;
  onPrint: () => void;
}

export default function InvoiceA4({ transaction: tx, wallet, profile, cabangSlug, onClose, onPrint }: InvoiceA4Props) {
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    QRCode.toDataURL(`mmcbank://invoice/${tx.invoiceNumber}`, { width: 120, margin: 1 }, (err, url) => {
      if (!err) setQrDataUrl(url);
    });
  }, [tx.invoiceNumber]);

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-a4-wrapper, #invoice-a4-wrapper * { visibility: visible; }
          #invoice-a4-wrapper { position: absolute; left: 0; top: 0; width: 210mm; }
          .no-print { display: none !important; }
        }
      `}</style>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
          <div id="invoice-a4-wrapper" className="bg-white text-black" style={{ width: "210mm", minHeight: "297mm", padding: "15mm 20mm", fontFamily: "Inter, sans-serif" }}>
            {/* Header */}
            <div className="flex items-start justify-between border-b-2 border-gray-900 pb-5 mb-5">
              <div>
                <h1 style={{ fontSize: "24pt", fontWeight: 900, letterSpacing: "-0.5pt", margin: 0 }} className="text-gray-900">{profile?.namaUsaha || "MMCBANK"}</h1>
                {profile?.slogan && <p style={{ fontSize: "8pt", color: "#6b7280", marginTop: 2 }}>{profile.slogan}</p>}
                {profile?.alamat && <p style={{ fontSize: "8pt", color: "#6b7280", marginTop: 2, maxWidth: "250px" }}>{profile.alamat}</p>}
                {profile?.noWhatsapp && <p style={{ fontSize: "8pt", color: "#6b7280", marginTop: 1 }}>WA: {profile.noWhatsapp}</p>}
              </div>
              <div className="text-right">
                <div className="flex items-center gap-3 justify-end">
                  <div>
                    <p style={{ fontSize: "18pt", fontWeight: 900, letterSpacing: "2pt", color: "#1e40af", margin: 0 }}>INVOICE</p>
                    <p style={{ fontSize: "8pt", color: "#6b7280", marginTop: 2 }} className="capitalize">{cabangSlug}</p>
                  </div>
                  {qrDataUrl && (
                    <div className="flex flex-col items-center">
                      <img src={qrDataUrl} alt="QR" className="w-16 h-16" />
                      <span style={{ fontSize: "6pt", color: "#6b7280", marginTop: 1 }}>Scan to Pay</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="flex justify-between mb-6">
              <div style={{ fontSize: "9pt" }}>
                <p className="text-gray-500 mb-1" style={{ fontSize: "7pt", fontWeight: 600, letterSpacing: "1pt" }}>KEPADA</p>
                <p style={{ fontWeight: 700, margin: 0 }}>{tx.customerNama}</p>
                {tx.customerWA && <p style={{ color: "#6b7280", margin: "1px 0" }}>WA: {tx.customerWA}</p>}
              </div>
              <div className="text-right" style={{ fontSize: "9pt" }}>
                <div className="grid gap-x-6 gap-y-0.5" style={{ display: "grid", gridTemplateColumns: "auto auto" }}>
                  <span className="text-gray-500 text-left">No. Invoice</span>
                  <span className="font-bold text-right">{tx.invoiceNumber}</span>
                  <span className="text-gray-500 text-left">Tanggal</span>
                  <span className="font-bold text-right">{formatDate(tx.tanggal)}</span>
                  <span className="text-gray-500 text-left">Status</span>
                  <span className="font-bold text-right capitalize">{tx.status}</span>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9pt", marginBottom: "20px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #111827", borderTop: "2px solid #111827" }}>
                  <th style={{ padding: "6px 4px", textAlign: "left", fontSize: "7pt", fontWeight: 600, letterSpacing: "1pt", color: "#6b7280", width: "30px" }}>NO</th>
                  <th style={{ padding: "6px 4px", textAlign: "left", fontSize: "7pt", fontWeight: 600, letterSpacing: "1pt", color: "#6b7280" }}>ITEM</th>
                  <th style={{ padding: "6px 4px", textAlign: "center", fontSize: "7pt", fontWeight: 600, letterSpacing: "1pt", color: "#6b7280", width: "50px" }}>QTY</th>
                  <th style={{ padding: "6px 4px", textAlign: "right", fontSize: "7pt", fontWeight: 600, letterSpacing: "1pt", color: "#6b7280", width: "100px" }}>HARGA</th>
                  <th style={{ padding: "6px 4px", textAlign: "right", fontSize: "7pt", fontWeight: 600, letterSpacing: "1pt", color: "#6b7280", width: "110px" }}>SUBTOTAL</th>
                </tr>
              </thead>
              <tbody>
                {tx.items.map((item, idx) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "5px 4px", color: "#6b7280" }}>{idx + 1}</td>
                    <td style={{ padding: "5px 4px", fontWeight: 600 }}>
                      {item.namaItem}
                      {item.spesifikasi && <span style={{ fontSize: "7pt", color: "#9ca3af", display: "block" }}>{item.spesifikasi}</span>}
                    </td>
                    <td style={{ padding: "5px 4px", textAlign: "center" }}>{item.qty}</td>
                    <td style={{ padding: "5px 4px", textAlign: "right" }}>{formatRp(item.hargaSatuan)}</td>
                    <td style={{ padding: "5px 4px", textAlign: "right", fontWeight: 600 }}>{formatRp(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Cost Summary */}
            <div className="flex justify-end mb-6">
              <div style={{ fontSize: "9pt", minWidth: "200px" }}>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatRp(tx.subtotalAfterDiskon)}</span>
                </div>
                {tx.diskonGlobalPersen > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Diskon ({tx.diskonGlobalPersen}%)</span>
                    <span className="text-red-500">-{formatRp(tx.totalDiskonGlobal)}</span>
                  </div>
                )}
                {tx.ppnNominal > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">PPN ({tx.ppnPersen}%)</span>
                    <span>{formatRp(tx.ppnNominal)}</span>
                  </div>
                )}
                <div className="flex justify-between py-1.5 border-t-2 border-gray-900 mt-1" style={{ fontSize: "12pt" }}>
                  <span style={{ fontWeight: 800 }}>Grand Total</span>
                  <span style={{ fontWeight: 800 }}>{formatRp(tx.grandTotal)}</span>
                </div>
                {tx.dpDibayar > 0 && (
                  <>
                    <div className="flex justify-between py-1 text-amber-600">
                      <span>Uang Muka (DP)</span>
                      <span style={{ fontWeight: 700 }}>{formatRp(tx.dpDibayar)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-t border-gray-300">
                      <span style={{ fontWeight: 800 }}>Sisa Tagihan</span>
                      <span style={{ fontWeight: 800 }}>{formatRp(tx.sisaTagihan)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Payment Method */}
            {wallet && (
              <div style={{ fontSize: "9pt", marginBottom: "20px" }}>
                <p style={{ fontSize: "7pt", fontWeight: 600, letterSpacing: "1pt", color: "#6b7280", marginBottom: 4 }}>METODE PEMBAYARAN</p>
                <p style={{ fontWeight: 600, margin: 0 }}>{wallet.namaDompet}</p>
                {wallet.tipe === "Bank" && wallet.namaBank && (
                  <p style={{ color: "#6b7280", margin: "1px 0" }}>
                    {wallet.namaBank}{wallet.atasNama ? ` a.n. ${wallet.atasNama}` : ""}{wallet.nomorRekening ? ` · ${wallet.nomorRekening}` : ""}
                  </p>
                )}
              </div>
            )}

            {/* Notes */}
            {tx.catatan && (
              <div style={{ fontSize: "9pt", marginBottom: "30px" }}>
                <p style={{ fontSize: "7pt", fontWeight: 600, letterSpacing: "1pt", color: "#6b7280", marginBottom: 4 }}>CATATAN</p>
                <p style={{ margin: 0, color: "#374151" }}>{tx.catatan}</p>
              </div>
            )}

            {/* Footer */}
            <div className="text-center" style={{ borderTop: "1px solid #e5e7eb", paddingTop: "15px", fontSize: "7pt", color: "#9ca3af" }}>
              <p style={{ margin: 0 }}>Terima kasih telah berbelanja di {profile?.namaUsaha || "MMCBANK"}</p>
              <p style={{ margin: "2px 0 0" }}>Dokumen ini sah dan diproses secara otomatis</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 p-4 border-t border-gray-200 no-print">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition-colors">
              Tutup
            </button>
            <button onClick={onPrint} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors">
              Cetak / Print
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
