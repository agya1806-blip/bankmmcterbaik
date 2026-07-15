"use client";

import { useRouter } from "next/navigation";
import { Coffee, ArrowLeft } from "lucide-react";
import BranchTransactionHistory from "@/components/branch-transaction-history";
import { type BookOrBranch } from "@/lib/db-v4";

const BRANCH: BookOrBranch = "usaha-warkop";

export default function WarkopTransaksi() {
  const router = useRouter();
  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/buku-usaha/warkop/dashboard")}
          className="size-9 rounded-xl bg-muted/30 flex items-center justify-center hover:bg-muted/50 transition-colors"
        >
          <ArrowLeft className="size-4 text-muted-foreground" />
        </button>
        <div className="size-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Coffee className="size-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold font-heading">Aktivitas Warkop</h1>
          <p className="text-xs text-muted-foreground/60">Riwayat transaksi warkop</p>
        </div>
      </div>
      <BranchTransactionHistory branch={BRANCH} branchLabel="Warkop" />
    </div>
  );
}
