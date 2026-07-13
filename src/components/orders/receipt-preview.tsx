"use client";

import { forwardRef } from "react";
import type { CartItem } from "./pos-cart";

interface ReceiptPreviewProps {
  businessName: string;
  businessAddress: string;
  customerName: string;
  customerPhone: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  totalBayar: number;
  bayar: number;
  kembalian: number;
}

const ReceiptPreview = forwardRef<HTMLDivElement, ReceiptPreviewProps>(
  function ReceiptPreview(
    {
      businessName,
      businessAddress,
      customerName,
      customerPhone,
      items,
      subtotal,
      discount,
      totalBayar,
      bayar,
      kembalian,
    },
    ref
  ) {
    return (
      <div
        id="receipt-preview"
        ref={ref}
        className="bg-white text-black p-5 rounded-xl space-y-2 text-xs font-mono"
      >
        <div className="text-center border-b border-dashed border-gray-300 pb-3">
          <p className="text-sm font-bold">
            {businessName || "MUGHIS BANK"}
          </p>
          <p className="text-[10px] text-gray-500">
            {businessAddress || ""}
          </p>
          <p className="text-[10px] text-gray-500">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="border-b border-dashed border-gray-300 pb-2">
          <p>
            Pelanggan: {customerName || "Umum"}
            {customerPhone && ` — ${customerPhone}`}
          </p>
        </div>
        <div className="border-b border-dashed border-gray-300 pb-2 space-y-1">
          <div className="flex justify-between font-bold text-[10px] text-gray-500">
            <span className="flex-1">Item</span>
            <span className="w-10 text-right">Qty</span>
            <span className="w-16 text-right">Total</span>
          </div>
          {items.map((item) => (
            <div key={item.id} className="flex justify-between">
              <span className="flex-1 truncate">{item.description}</span>
              <span className="w-10 text-right">{item.quantity}</span>
              <span className="w-16 text-right font-semibold">
                {item.total.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{subtotal.toLocaleString()}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between">
              <span>Diskon</span>
              <span>-{discount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-sm border-t border-gray-300 pt-1">
            <span>Total</span>
            <span>{totalBayar.toLocaleString()}</span>
          </div>
          {bayar > 0 && (
            <>
              <div className="flex justify-between">
                <span>Bayar</span>
                <span>{bayar.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Kembali</span>
                <span className="text-green-700">
                  {kembalian.toLocaleString()}
                </span>
              </div>
            </>
          )}
        </div>
        <div className="text-center border-t border-dashed border-gray-300 pt-3 text-[10px] text-gray-400">
          <p>Terima kasih</p>
          <p>MUGHIS BANK v3 — POS Kasir</p>
        </div>
      </div>
    );
  }
);

export default ReceiptPreview;
