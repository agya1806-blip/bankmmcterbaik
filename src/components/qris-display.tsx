"use client";

import { useState, useCallback } from "react";
import { CreditCard, Copy, Eye, EyeOff, Maximize2, Minimize2, X } from "lucide-react";
import toast from "react-hot-toast";
import { useBusinessStore } from "@/store/useBusinessStore";
import { ImgFromIdb } from "@/components/img-from-idb";

export default function QrisDisplay() {
  const paymentMethods = useBusinessStore((s) => s.paymentMethods);
  const enabledPayments = paymentMethods.filter((pm) => pm.isEnabled && pm.qrisImageUrl);
  const [showQris, setShowQris] = useState(false);
  const [fullscreenPm, setFullscreenPm] = useState<string | null>(null);

  const copyRekening = useCallback((noRek: string) => {
    navigator.clipboard.writeText(noRek).then(() => {
      toast.success("Nomor rekening disalin!");
    }).catch(() => {
      toast.error("Gagal menyalin");
    });
  }, []);

  if (enabledPayments.length === 0) return null;

  const fullPm = enabledPayments.find((p) => p.id === fullscreenPm);

  return (
    <>
      <div className="floating-card overflow-hidden">
        <button
          onClick={() => setShowQris(!showQris)}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/20 transition-colors"
        >
          <div className="flex items-center gap-2">
            <CreditCard className="size-4 text-indigo-500" />
            <span className="text-xs font-semibold">QRIS Pembayaran</span>
            <span className="text-[9px] text-muted-foreground/50 bg-muted/30 px-1.5 py-0.5 rounded-full">
              {enabledPayments.length}
            </span>
          </div>
          {showQris ? <EyeOff className="size-3.5 text-muted-foreground/50" /> : <Eye className="size-3.5 text-muted-foreground/50" />}
        </button>

        {showQris && (
          <div className="px-4 pb-4 space-y-3">
            {enabledPayments.map((pm) => (
              <div
                key={pm.id}
                className="rounded-xl bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200/50 dark:border-blue-800/30 p-3 flex items-start gap-3"
              >
                <div className="size-14 shrink-0 rounded-lg border border-blue-200 dark:border-blue-800/50 bg-white overflow-hidden">
                  <ImgFromIdb
                    src={pm.qrisImageUrl}
                    alt={pm.namaMetode}
                    className="size-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0 text-[10px] space-y-0.5">
                  <p className="font-semibold">{pm.namaMetode}</p>
                  {pm.bankName && <p className="text-muted-foreground/70">{pm.bankName}</p>}
                  <p className="tabular-nums font-mono font-medium">{pm.accountNo}</p>
                  {pm.accountName && <p className="text-muted-foreground/60">a.n {pm.accountName}</p>}
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => copyRekening(pm.accountNo)}
                    className="size-8 rounded-lg bg-white dark:bg-muted/30 flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30 text-muted-foreground/50 transition-colors"
                    title="Salin nomor rekening"
                  >
                    <Copy className="size-3.5" />
                  </button>
                  <button
                    onClick={() => setFullscreenPm(pm.id)}
                    className="size-8 rounded-lg bg-white dark:bg-muted/30 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/30 text-muted-foreground/50 transition-colors"
                    title="Perbesar QRIS"
                  >
                    <Maximize2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {fullscreenPm && fullPm && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setFullscreenPm(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setFullscreenPm(null)}
              className="absolute top-3 right-3 size-8 rounded-full bg-muted/30 flex items-center justify-center hover:bg-muted/50 transition-colors"
            >
              <X className="size-4 text-muted-foreground" />
            </button>
            <div className="text-center space-y-3">
              <p className="text-sm font-bold">{fullPm.namaMetode}</p>
              {fullPm.bankName && <p className="text-xs text-muted-foreground/70">{fullPm.bankName}</p>}
              <div className="mx-auto max-w-[200px] rounded-xl border border-border/40 overflow-hidden bg-white p-2">
                <ImgFromIdb
                  src={fullPm.qrisImageUrl}
                  alt={fullPm.namaMetode}
                  className="w-full aspect-square object-contain"
                />
              </div>
              <p className="text-xs font-mono font-semibold tabular-nums">{fullPm.accountNo}</p>
              {fullPm.accountName && <p className="text-[10px] text-muted-foreground/70">a.n {fullPm.accountName}</p>}
              <button
                onClick={() => copyRekening(fullPm.accountNo)}
                className="w-full py-2.5 rounded-xl bg-indigo-500 text-white text-xs font-bold hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2"
              >
                <Copy className="size-3.5" /> Salin Nomor Rekening
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
