"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRightLeft, Loader2, CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  db, BOOK_LABELS, type BookOrBranch,
} from "@/lib/db-v4";
import { writeAuditLog } from "@/lib/audit-logger";
import { useSessionStore } from "@/store/useSessionStore";

function formatRupiah(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

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
      const mapped: WalletOption[] = all.map((w) => ({
        ...w,
        label: `${BOOK_LABELS[w.bookOrBranchId] ?? w.bookOrBranchId} — ${w.namaDompet}`,
      }));
      setWallets(mapped);
    })();
  }, [mounted]);

  const walletDari = wallets.find((w) => w.id === dariWalletId);

  const isValid =
    dariWalletId &&
    keWalletId &&
    dariWalletId !== keWalletId &&
    nominal &&
    parseInt(nominal) > 0 &&
    walletDari &&
    walletDari.saldo >= parseInt(nominal);

  const handleTransfer = useCallback(async () => {
    if (!isValid || !user) return;
    setLoading(true);
    try {
      const nominalNum = parseInt(nominal);
      await db.transaction(
        "rw",
        [db.wallets, db.walletMutations, db.auditLogs],
        async () => {
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
            dariWalletId,
            keWalletId,
            nominal: nominalNum,
            alasan: alasan || `Transfer ke ${BOOK_LABELS[ke.bookOrBranchId] ?? ke.bookOrBranchId}`,
            createdAt: new Date().toISOString(),
          });

          // Double-entry audit
          const alasanText = alasan || `Prive / Transfer ke ${BOOK_LABELS[ke.bookOrBranchId] ?? ke.bookOrBranchId}`;
          await writeAuditLog({
            bookOrBranchId: dari.bookOrBranchId,
            action: "TRANSFER_KELUAR",
            entityType: "transfer",
            entityId: mutasiId,
            userId: user.id,
            userName: user.nama,
            dataBefore: { saldo: dari.saldo },
            dataAfter: { saldo: dari.saldo - nominalNum },
            nominal: nominalNum,
            alasan: alasanText,
          });
          await writeAuditLog({
            bookOrBranchId: ke.bookOrBranchId,
            action: "TRANSFER_MASUK",
            entityType: "transfer",
            entityId: mutasiId,
            userId: user.id,
            userName: user.nama,
            dataBefore: { saldo: ke.saldo },
            dataAfter: { saldo: ke.saldo + nominalNum },
            nominal: nominalNum,
            alasan: `Suntikan Dana dari ${BOOK_LABELS[dari.bookOrBranchId] ?? dari.bookOrBranchId}`,
          });
        }
      );

      setSuccess(true);
      toast.success(`Rp${nominalNum.toLocaleString("id-ID")} berhasil ditransfer`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal transfer");
    } finally {
      setLoading(false);
    }
  }, [isValid, dariWalletId, keWalletId, nominal, alasan, user]);

  const resetForm = useCallback(() => {
    setDariWalletId("");
    setKeWalletId("");
    setNominal("");
    setAlasan("");
    setSuccess(false);
  }, []);

  if (!mounted) {
    return <div className="h-48 rounded-2xl bg-slate-800/30 animate-pulse" />;
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto pt-16 text-center space-y-5">
        <div className="size-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
          <CheckCircle2 className="size-10 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold font-heading">Transfer Berhasil</h2>
          <p className="text-sm text-slate-400 mt-1">
            {formatRupiah(parseInt(nominal))} dipindahkan
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={resetForm}
            className="py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold shadow-lg"
          >
            Transfer Lagi
          </button>
          <button onClick={() => router.push("/")}
            className="py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto pb-20 space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/")}
          className="size-9 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="size-4 text-slate-400" />
        </button>
        <div className="size-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
          <ArrowRightLeft className="size-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold font-heading">Mutasi Antar-Buku</h1>
          <p className="text-[10px] text-slate-400">Pencatatan double-entry otomatis</p>
        </div>
      </div>

      <div className="rounded-2xl bg-slate-900/80 border border-slate-800/60 p-4 space-y-4">
        <div className="space-y-1">
          <label className="text-[9px] font-medium text-slate-500 uppercase tracking-wider">Dari Dompet</label>
          <select value={dariWalletId} onChange={(e) => setDariWalletId(e.target.value)}
            className="input-premium w-full text-xs bg-slate-900/80"
          >
            <option value="">Pilih dompet sumber</option>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.label} ({formatRupiah(w.saldo)})
              </option>
            ))}
          </select>
          {walletDari && (
            <p className="text-[10px] text-slate-500 tabular-nums">Saldo tersedia: {formatRupiah(walletDari.saldo)}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-medium text-slate-500 uppercase tracking-wider">Ke Dompet</label>
          <select value={keWalletId} onChange={(e) => setKeWalletId(e.target.value)}
            className="input-premium w-full text-xs bg-slate-900/80"
          >
            <option value="">Pilih dompet tujuan</option>
            {wallets.filter((w) => w.id !== dariWalletId).map((w) => (
              <option key={w.id} value={w.id}>
                {w.label} ({formatRupiah(w.saldo)})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-medium text-slate-500 uppercase tracking-wider">Nominal Transfer</label>
          <input
            type="number"
            inputMode="numeric"
            value={nominal}
            onChange={(e) => setNominal(e.target.value.replace(/\D/g, ""))}
            placeholder="0"
            className="input-premium w-full text-sm tabular-nums bg-slate-900/80"
          />
          {nominal && walletDari && (
            <p className={`text-[10px] tabular-nums ${parseInt(nominal) > walletDari.saldo ? "text-rose-400" : "text-slate-500"}`}>
              Sisa setelah transfer: {formatRupiah(walletDari.saldo - parseInt(nominal))}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-medium text-slate-500 uppercase tracking-wider">Alasan / Keterangan</label>
          <textarea
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
            placeholder="cth: Prive / Transfer ke Keluarga"
            rows={2}
            className="input-premium w-full text-xs bg-slate-900/80 resize-none"
          />
        </div>

        <button
          onClick={handleTransfer}
          disabled={!isValid || loading}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <><Loader2 className="size-4 animate-spin" /> Memproses...</>
          ) : (
            <><ArrowRightLeft className="size-4" /> Transfer Dana</>
          )}
        </button>
      </div>

      <div className="rounded-2xl bg-slate-900/80 border border-slate-800/60 p-4 space-y-2">
        <p className="text-xs font-semibold flex items-center gap-1.5">
          <CheckCircle2 className="size-3.5 text-emerald-400" /> Double-Entry Otomatis
        </p>
        <p className="text-[10px] text-slate-400">
          Sistem akan mencatat dua jurnal secara otomatis:
        </p>
        <ol className="text-[10px] text-slate-500 space-y-1 list-decimal list-inside">
          <li>Pengeluaran di dompet sumber (kategori: Prive / Transfer)</li>
          <li>Pemasukan di dompet tujuan (kategori: Suntikan Dana)</li>
        </ol>
      </div>
    </div>
  );
}
