"use client";

import PosKasir from "@/components/pos-kasir";
import { Printer } from "lucide-react";

export default function KasirPercetakan() {
  return (
    <PosKasir
      branchConfig={{
        bookOrBranchId: "usaha-percetakan",
        title: "POS Kasir Percetakan",
        subtitle: "Input item & spesifikasi manual",
        icon: <Printer className="size-5" />,
      }}
    />
  );
}
