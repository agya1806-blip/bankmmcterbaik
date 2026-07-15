"use client";

import PosKasir from "@/components/pos-kasir";
import { Coffee } from "lucide-react";

export default function KasirWarkop() {
  return (
    <PosKasir
      branchConfig={{
        bookOrBranchId: "usaha-warkop",
        title: "Kasir Warkop",
        subtitle: "Warkop & Minuman",
        icon: <Coffee className="size-5" />,
      }}
    />
  );
}
