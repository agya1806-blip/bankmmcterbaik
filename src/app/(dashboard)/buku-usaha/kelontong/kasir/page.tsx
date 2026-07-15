"use client";

import PosKasir from "@/components/pos-kasir";
import { ShoppingBag } from "lucide-react";

export default function KasirKelontong() {
  return (
    <PosKasir
      branchConfig={{
        bookOrBranchId: "usaha-kelontong",
        title: "Kasir Kelontong",
        subtitle: "Toko Kelontong & Sembako",
        icon: <ShoppingBag className="size-5" />,
      }}
    />
  );
}
