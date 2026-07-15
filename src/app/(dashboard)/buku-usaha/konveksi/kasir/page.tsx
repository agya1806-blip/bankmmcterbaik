"use client";

import PosKasir from "@/components/pos-kasir";
import { Shirt } from "lucide-react";

export default function KasirKonveksi() {
  return (
    <PosKasir
      branchConfig={{
        bookOrBranchId: "usaha-konveksi",
        title: "Kasir Konveksi",
        subtitle: "Konveksi & Seragam",
        icon: <Shirt className="size-5" />,
      }}
    />
  );
}
