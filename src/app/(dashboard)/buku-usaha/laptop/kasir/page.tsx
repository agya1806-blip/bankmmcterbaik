"use client";

import PosKasir from "@/components/pos-kasir";
import { Monitor } from "lucide-react";

export default function KasirLaptop() {
  return (
    <PosKasir
      branchConfig={{
        bookOrBranchId: "usaha-laptop",
        title: "Kasir Laptop",
        subtitle: "Toko Laptop & Service",
        icon: <Monitor className="size-5" />,
      }}
    />
  );
}
