"use client";

import { Image, Phone, FileDown, FileSpreadsheet } from "lucide-react";
import {
  exportToPNG,
  exportToPDF,
  sendWhatsAppReceipt,
  exportToExcel,
  pesananKeSheet,
} from "@/utils/exporter";
import toast from "react-hot-toast";
import type { CartItem } from "./pos-cart";

interface ExportButtonsProps {
  customerPhone: string;
  totalBayar: number;
  bayar: number;
  kembalian: number;
  cart: CartItem[];
  workspaceId: string;
}

interface ExportBtnProps {
  icon: React.ReactNode;
  label: string;
  gradient: string;
  shadow: string;
  onClick: () => void;
}

function ExportBtn({ icon, label, gradient, shadow, onClick }: ExportBtnProps) {
  return (
    <button onClick={onClick}
      className={`flex flex-col items-center gap-1.5 p-3.5 rounded-2xl bg-gradient-to-br ${gradient} text-white ${shadow} hover:scale-[1.03] active:scale-[0.95] transition-all duration-200`}>
      {icon}
      <span className="text-[10px] font-semibold tracking-wide">{label}</span>
    </button>
  );
}

export default function ExportButtons({
  customerPhone,
  totalBayar,
  bayar,
  kembalian,
  cart,
  workspaceId,
}: ExportButtonsProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      <ExportBtn
        icon={<Image className="size-5" />}
        label="PNG"
        gradient="from-amber-400 to-amber-500"
        shadow="shadow-lg shadow-amber-500/25"
        onClick={() => exportToPNG("receipt-preview", "struk.png")}
      />
      <ExportBtn
        icon={<FileDown className="size-5" />}
        label="PDF"
        gradient="from-red-500 to-red-600"
        shadow="shadow-lg shadow-red-500/25"
        onClick={() => exportToPDF("receipt-preview", "thermal", "struk.pdf")}
      />
      <ExportBtn
        icon={<Phone className="size-5" />}
        label="WA"
        gradient="from-emerald-500 to-emerald-600"
        shadow="shadow-lg shadow-emerald-500/25"
        onClick={() => {
          if (!customerPhone) { toast.error("Nomor WA tidak tersedia"); return; }
          sendWhatsAppReceipt(customerPhone, {
            id: crypto.randomUUID(), total: totalBayar, dp: bayar,
            remaining: Math.max(0, totalBayar - bayar),
            status: bayar >= totalBayar ? "Lunas" : "DP", items: cart,
          });
        }}
      />
      <ExportBtn
        icon={<FileSpreadsheet className="size-5" />}
        label="Excel"
        gradient="from-blue-500 to-blue-600"
        shadow="shadow-lg shadow-blue-500/25"
        onClick={async () => {
          const { getOrdersByWorkspace } = await import("@/lib/db");
          const all = await getOrdersByWorkspace(workspaceId);
          exportToExcel(pesananKeSheet(all), "Pesanan", "laporan-pesanan.xlsx");
          toast.success("Excel terunduh");
        }}
      />
    </div>
  );
}
