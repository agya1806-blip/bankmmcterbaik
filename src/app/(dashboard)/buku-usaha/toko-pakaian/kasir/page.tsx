"use client";

import PosKasir from "@/components/pos-kasir";
import { Tag } from "lucide-react";

export default function KasirTokoPakaian() {
  return (
    <PosKasir
      branchConfig={{
        bookOrBranchId: "usaha-toko-pakaian",
        title: "Kasir Toko Pakaian",
        subtitle: "Toko Pakaian & Fashion",
        icon: <Tag className="size-5" />,
      }}
    />
  );
}
