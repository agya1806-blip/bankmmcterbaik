"use client";
import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { Smartphone, MessageCircle, Send, Pencil, Trash2 } from "lucide-react";
import { db, BRANCH_MAP } from "@/lib/db-v4";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CustomerHistory } from "./customer-history";
import { CustomerDebtCard } from "./customer-debt-card";
import { CustomerRewardCard } from "./customer-reward-card";
import type { Customer, DbPiutang, DbTransaction } from "./customer-types";

interface CustomerDetailDrawerProps {
  customer: Customer | null;
  onClose: () => void;
  onRedeem: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
}

export function CustomerDetailDrawer({
  customer,
  onClose,
  onRedeem,
  onEdit,
  onDelete,
}: CustomerDetailDrawerProps) {
  const params = useParams();
  const cabangSlug = (params?.cabang as string) || "";
  const bookOrBranchId = BRANCH_MAP[cabangSlug] || "usaha-percetakan";

  const [promoMessage, setPromoMessage] = useState(
    "Halo [Nama], dapatkan penawaran spesial minggu ini hanya di toko kami!"
  );
  const [showHistory, setShowHistory] = useState(false);

  const customerPiutang = useLiveQuery(
    () => customer?.id
      ? db.piutang.where("customerId").equals(customer.id).toArray()
      : Promise.resolve<DbPiutang[]>([]),
    [customer?.id]
  ) || [];

  const piutangInstallments = useLiveQuery(
    () => db.piutangInstallments.where("bookOrBranchId").equals(bookOrBranchId).toArray(),
    [bookOrBranchId]
  ) || [];

  const customerTransactions = useLiveQuery(
    () => customer?.id && showHistory
      ? db.transactions.where("customerId").equals(customer.id).reverse().limit(10).toArray()
      : Promise.resolve<DbTransaction[]>([]),
    [customer?.id, showHistory]
  ) || [];

  const handleBroadcast = () => {
    if (!customer) return;
    const personalized = promoMessage.replace("[Nama]", customer.nama);
    const phoneClean = customer.noWA.replace(/[^0-9]/g, "");
    window.open(`https://api.whatsapp.com/send?phone=${phoneClean}&text=${encodeURIComponent(personalized)}`, "_blank");
  };

  if (!customer) return null;

  return (
    <Drawer open={!!customer} onClose={onClose} title={customer.nama}>
      <div className="space-y-4">

        {/* Avatar & Kontak */}
        <div className="flex flex-col items-center py-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#008CEB] to-[#00C9A7] flex items-center justify-center text-white text-2xl font-extrabold shadow-md mb-3">
            {customer.nama.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-200">{customer.nama}</h2>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400">
            <Smartphone className="w-3.5 h-3.5" /> {customer.noWA}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={customer.totalTransaksi > 0 ? "success" : "danger"}>
              {customer.totalTransaksi > 0 ? "Aktif" : "Belum Bertransaksi"}
            </Badge>
            {customer.totalBelanja >= 10000000 && <Badge variant="info">Platinum</Badge>}
          </div>
        </div>

        {/* Stat box */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-50 dark:bg-zinc-900 rounded-xl p-2.5 text-center">
            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Transaksi</p>
            <p className="text-sm font-extrabold text-slate-700 dark:text-slate-200">{customer.totalTransaksi}</p>
          </div>
          <div className="bg-slate-50 dark:bg-zinc-900 rounded-xl p-2.5 text-center">
            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Total Belanja</p>
            <p className="text-sm font-extrabold text-emerald-600">Rp{customer.totalBelanja.toLocaleString()}</p>
          </div>
          <div className="bg-slate-50 dark:bg-zinc-900 rounded-xl p-2.5 text-center">
            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Poin</p>
            <p className="text-sm font-extrabold text-amber-500">{customer.poin.toLocaleString()}</p>
          </div>
        </div>

        {/* WA Broadcast */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <MessageCircle className="w-3 h-3" /> Kirim Promosi WhatsApp
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={promoMessage}
              onChange={(e) => setPromoMessage(e.target.value)}
              className="flex-1 px-3 py-2 text-[11px] bg-slate-100 dark:bg-zinc-900 rounded-xl border-none outline-none focus:ring-1 focus:ring-[#008CEB]"
            />
            <Button variant="primary" size="sm" onClick={handleBroadcast}>
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Reward Card */}
        {customer.poin > 0 && (
          <CustomerRewardCard customer={customer} onRedeem={onRedeem} />
        )}

        {/* Riwayat Transaksi Toggle */}
        <div>
          <Button
            variant={showHistory ? "default" : "outline"}
            size="sm"
            className="w-full"
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? "Tutup Riwayat" : "Lihat Riwayat Transaksi"}
          </Button>
          {showHistory && (
            <div className="mt-2">
              {customerTransactions.length === 0 && customer === customer ? (
                <div className="text-center py-4 text-slate-400 text-[10px]">Memuat transaksi...</div>
              ) : (
                <CustomerHistory transactions={customerTransactions} />
              )}
            </div>
          )}
        </div>

        {/* Piutang */}
        <CustomerDebtCard piutangList={customerPiutang} installments={piutangInstallments} />

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button variant="secondary" size="sm" className="flex-1" onClick={() => onEdit(customer)}>
            <Pencil className="w-3.5 h-3.5" /> Edit
          </Button>
          <Button variant="danger" size="sm" className="flex-1" onClick={() => { onDelete(customer.id); onClose(); }}>
            <Trash2 className="w-3.5 h-3.5" /> Hapus
          </Button>
        </div>

      </div>
    </Drawer>
  );
}