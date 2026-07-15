"use client";

import { useRouter } from "next/navigation";
import { Shirt, ArrowLeft } from "lucide-react";
import BranchTransactionHistory from "@/components/branch-transaction-history";
import { type BookOrBranch } from "@/lib/db-v4";

const BRANCH: BookOrBranch = "usaha-toko-pakaian";

export default function TokoPakaianTransaksi() {
  const router = useRouter();
  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/buku-usaha/toko-pakaian/dashboard")}
          className="size-9 rounded-xl bg-muted/30 flex items-center justify-center hover:bg-muted/50 transition-colors"
        >
          <ArrowLeft className="size-4 text-muted-foreground" />
        </button>
        <div className="size-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
          <Shirt className="size-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold font-heading">Aktivitas Toko Pakaian</h1>
          <p className="text-xs text-muted-foreground/60">Riwayat transaksi fashion</p>
        </div>
      </div>
      <BranchTransactionHistory branch={BRANCH} branchLabel="Toko Pakaian" />
    </div>
  );
}
