"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRightLeft, Loader2, CheckCircle2, Receipt, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { db, BOOK_LABELS, type BookOrBranch } from "@/lib/db-v4";
import { writeAuditLog } from "@/lib/audit-logger";
import { useSessionStore } from "@/store/useSessionStore";

function formatRupiah(n: number) { return `Rp ${n.toLocaleString("id-ID")}`; }

interface WalletOption {
  id: string;
  bookOrBranchId: BookOrBranch;
  namaDompet: string;
  saldo: number;
  label: string;
}

export default function MutasiAntarBukuPage() {
  const router = useRouter();
  const user = useSessionStore((s) => s.currentUser);
  const [mounted, setMounted] = useState(false);
  const [wallets, setWallets] = useState<WalletOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [dariWalletId, setDariWalletId] = useState("");
  const [keWalletId, setKeWalletId] = useState("");
  const [nominal, setNominal] = useState("");
  const [alasan, setAlasan] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    (async () => {
      const all = await db.wallets.where("isActive").equals(1).toArray();
      setWallets(all.map((w) => ({ ...w, label: `${BOOK_LABELS[w.bookOrBranchId] ?? w.bookOrBranchId} — ${w.namaDompet}` })));
    })();
  }, [mounted]);

  const walletDari = wallets.find((w) => w.id === dariWalletId);
  const isValid = dariWalletId && keWalletId && dariWalletId !== keWalletId && nominal && parseInt(nominal) > 0 && walletDari && walletDari.saldo >= parseInt(nominal);

  const handleTransfer = useCallback(async () => {
    if (!isValid || !user) return;
    setLoading(true);
    try {
      const nominalNum = parseInt(nominal);
      await db.transaction("rw", [db.wallets, db.walletMutations, db.auditLogs, db.cashflows], async () => {
        const dari = await db.wallets.get(dariWalletId);
        const ke = await db.wallets.get(keWalletId);
        if (!dari || !ke) throw new Error("Dompet tidak ditemukan");
        if (dari.saldo < nominalNum) throw new Error("Saldo tidak mencukupi");

        await db.wallets.update(dariWalletId, { saldo: dari.saldo - nominalNum });
        await db.wallets.update(keWalletId, { saldo: ke.saldo + nominalNum });

        const mutasiId = crypto.randomUUID();
        await db.walletMutations.add({
          id: mutasiId,
          bookOrBranchId: dari.bookOrBranchId,
          dariWalletId, keWalletId,
          nominal: nominalNum,
          alasan: alasan || `Transfer ke ${BOOK_LABELS[ke.bookOrBranchId] ?? ke.bookOrBranchId}`,
          createdAt: new Date().toISOString(),
        });

        await db.cashflows.add({
          id: crypto.randomUUID(),
          bookOrBranchId: dari.bookOrBranchId,
          tipe: "keluar",
          kategori: "Prive / Transfer",
          nominal: nominalNum,
          saldoSebelum: dari.saldo,
          saldoSesudah: dari.saldo - nominalNum,
          walletId: dariWalletId,
          walletNama: dari.namaDompet,
          referensiId: mutasiId,
          referensiTipe: "mutasi",
          catatan: alasan || `Transfer ke ${BOOK_LABELS[ke.bookOrBranchId] ?? ke.bookOrBranchId}`,
          createdAt: new Date().toISOString(),
        });

        await db.cashflows.add({
          id: crypto.randomUUID(),
          bookOrBranchId: ke.bookOrBranchId,
          tipe: "masuk",
          kategori: "Suntikan Dana",
          nominal: nominalNum,
          saldoSebelum: ke.saldo,
          saldoSesudah: ke.saldo + nominalNum,
          walletId: keWalletId,
          walletNama: ke.namaDompet,
          referensiId: mutasiId,
          referensiTipe: "mutasi",
          catatan: `Suntikan Dana dari ${BOOK_LABELS[dari.bookOrBranchId] ?? dari.bookOrBranchId}`,
          createdAt: new Date().toISOString(),
        });

        const alasanText = alasan || `Prive / Transfer ke ${BOOK_LABELS[ke.bookOrBranchId] ?? ke.bookOrBranchId}`;
        await writeAuditLog({ bookOrBranchId: dari.bookOrBranchId, action: "TRANSFER_KELUAR", entityType: "transfer", entityId: mutasiId, userId: user.id, userName: user.nama, dataBefore: { saldo: dari.saldo }, dataAfter: { saldo: dari.saldo - nominalNum }, nominal: nominalNum, alasan: alasanText });
        await writeAuditLog({ bookOrBranchId: ke.bookOrBranchId, action: "TRANSFER_MASUK", entityType: "transfer", entityId: mutasiId, userId: user.id, userName: user.nama, dataBefore: { saldo: ke.saldo }, dataAfter: { saldo: ke.saldo + nominalNum }, nominal: nominalNum, alasan: `Suntikan Dana dari ${BOOK_LABELS[dari.bookOrBranchId] ?? dari.bookOrBranchId}` });
      });

      setSuccess(true);
      toast.success(`Rp${nominalNum.toLocaleString("id-ID")} berhasil ditransfer`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal transfer");
    } finally {
      setLoading(false);
    }
  }, [isValid, dariWalletId, keWalletId, nominal, alasan, user]);

  const resetForm = useCallback(() => {
    setDariWalletId(""); setKeWalletId(""); setNominal(""); setAlasan(""); setSuccess(false);
  }, []);

  if (!mounted) return <div className="h-48 rounded-2xl bg-slate-100 dark:bg-slate-800/30 animate-pulse" />;

  if (success) {
    return (
      <div className="max-w-lg mx-auto pt-16 text-center space-y-5 animate-fade-in">
        <div className="size-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
          <CheckCircle2 className="size-10 text-emerald-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold font-heading text-slate-800 dark:text-slate-200">Transfer Berhasil</h2>
          <p className="text-base font-semibold text-emerald-600 dark:text-emerald-400 mt-1">{formatRupiah(parseInt(nominal))}</p>
        </div>
        <div className="flex flex-col gap-2 max-w-xs mx-auto">
          <button onClick={resetForm} className="btn-gradient">Transfer Lagi</button>
          <button onClick={() => router.push("/")} className="btn-ghost">Kembali ke Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto pb-20 space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/")} className="size-9 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all active:scale-90">
          <ArrowLeft className="size-4 text-slate-500" />
        </button>
        <div className="size-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
          <ArrowRightLeft className="size-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold font-heading">Mutasi Antar-Buku</h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">Pencatatan double-entry + cashflow otomatis</p>
        </div>
      </div>

      <div className="premium-card p-4 space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Dari Dompet</label>
          <select value={dariWalletId} onChange={(e) => setDariWalletId(e.target.value)} className="input-premium w-full text-sm">
            <option value="">Pilih dompet sumber</option>
            {wallets.map((w) => (<option key={w.id} value={w.id}>{w.label} ({formatRupiah(w.saldo)})</option>))}
          </select>
          {walletDari && <p className="text-[10px] text-slate-400 tabular-nums">Saldo tersedia: <span className="font-semibold text-slate-600 dark:text-slate-300">{formatRupiah(walletDari.saldo)}</span></p>}
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Ke Dompet</label>
          <select value={keWalletId} onChange={(e) => setKeWalletId(e.target.value)} className="input-premium w-full text-sm">
            <option value="">Pilih dompet tujuan</option>
            {wallets.filter((w) => w.id !== dariWalletId).map((w) => (<option key={w.id} value={w.id}>{w.label} ({formatRupiah(w.saldo)})</option>))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Nominal Transfer</label>
          <input type="number" inputMode="numeric" value={nominal} onChange={(e) => setNominal(e.target.value.replace(/\D/g, ""))} placeholder="0" className="input-premium w-full text-sm tabular-nums" />
          {nominal && walletDari && (
            <p className={`text-[10px] tabular-nums ${parseInt(nominal) > walletDari.saldo ? "text-red-500" : "text-slate-400"}`}>
              Sisa setelah transfer: <span className="font-semibold">{formatRupiah(walletDari.saldo - parseInt(nominal))}</span>
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Alasan / Keterangan</label>
          <textarea value={alasan} onChange={(e) => setAlasan(e.target.value)} placeholder="cth: Prive / Transfer ke Keluarga" rows={2} className="input-premium w-full text-sm resize-none" />
        </div>

        <button onClick={handleTransfer} disabled={!isValid || loading}
          className="btn-gradient w-full">
          {loading ? <><Loader2 className="size-4 animate-spin" /> Memproses...</> : <><ArrowRightLeft className="size-4" /> Transfer Dana</>}
        </button>
      </div>

      <div className="premium-card p-4 space-y-2">
        <p className="text-xs font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
          <Receipt className="size-3.5 text-emerald-500" /> Double-Entry + Cashflow Otomatis
        </p>
        <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
          <span className="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-500 font-medium">Pengeluaran (Sumber)</span>
          <ArrowRight className="size-3" />
          <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 font-medium">Pemasukan (Tujuan)</span>
        </div>
        <p className="text-[10px] text-slate-400">Cashflow tercatat otomatis di kedua buku dengan kategori Prive & Suntikan Dana</p>
      </div>
    </div>
  );
}
