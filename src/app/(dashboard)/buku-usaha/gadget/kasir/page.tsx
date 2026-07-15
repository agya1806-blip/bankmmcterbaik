"use client";

import PosKasir from "@/components/pos-kasir";
import { Smartphone } from "lucide-react";

export default function KasirGadget() {
  return (
    <PosKasir
      branchConfig={{
        bookOrBranchId: "usaha-gadget",
        title: "Kasir Gadget",
        subtitle: "Toko Gadget & Aksesoris",
        icon: <Smartphone className="size-5" />,
      }}
    />
  );
}
