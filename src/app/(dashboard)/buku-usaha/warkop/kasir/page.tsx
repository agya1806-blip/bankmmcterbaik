"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Coffee, Plus, Minus, Trash2, ArrowLeft, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { useBusinessStore } from "@/store/useBusinessStore";
import { KasirSkeleton } from "@/components/ui/skeleton";

const BOOK = "usaha-warkop";

function generateId() {
  const d = new Date();
  const ds = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `WRK-${ds}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
}

function formatRupiah(n: number) { return `Rp ${n.toLocaleString("id-ID")}`; }

export default function KasirWarkop() {
  const router = useRouter();
  const { wallets, tambahSaldoWallet, setLastKasirUnit } = useBusinessStore();
  const [mounted, setMounted] = useState(false);
  const [cart, setCart] = useState<{ nama: string; harga: number; qty: number }[]>([]);
  const [customerNama, setCustomerNama] = useState("");
  const [walletId, setWalletId] = useState(wallets[0]?.id || "wallet-kas");
  const [invoiceId, setInvoiceId] = useState("");
  const [showBill, setShowBill] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [itemNama, setItemNama] = useState("");
  const [itemHarga, setItemHarga] = useState("");

  useEffect(() => setMounted(true), []);

  const total = useMemo(() => cart.reduce((s, e) => s + e.harga * e.qty, 0), [cart]);

  const tambahItem = () => {
    const harga = parseInt(itemHarga.replace(/\D/g, ""), 10);
    if (!itemNama.trim() || !harga) { toast.error("Nama dan harga harus diisi"); return; }
    setCart((prev) => {
      const ex = prev.find((e) => e.nama === itemNama.trim());
      if (ex) return prev.map((e) => e.nama === itemNama.trim() ? { ...e, qty: e.qty + 1 } : e);
      return [...prev, { nama: itemNama.trim(), harga, qty: 1 }];
    });
    setItemNama("");
    setItemHarga("");
  };

  const bayar = useCallback(async () => {
    if (cart.length === 0) { toast.error("Keranjang kosong"); return; }
    setIsProcessing(true);
    try {
      tambahSaldoWallet(walletId, total);
      const invId = generateId();
      setInvoiceId(invId);
      setLastKasirUnit(BOOK);
      toast.success("Pembayaran berhasil!");
      setShowBill(true);
    } catch {
      toast.error("Gagal memproses pembayaran");
    } finally {
      setIsProcessing(false);
    }
  }, [cart, total, walletId, tambahSaldoWallet, setLastKasirUnit]);

  if (!mounted) return <KasirSkeleton />;

  return (
    <div className="max-w-2xl mx-auto pb-20 space-y-4 animate-fade-in">
      {!showBill ? (
        <>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/buku-usaha")} className="size-10 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors">
              <ArrowLeft className="size-5 text-slate-300" />
            </button>
            <div className="size-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-xl">
              <Coffee className="size-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold font-heading">Kasir Warkop</h1>
              <p className="text-[10px] text-muted-foreground/60">Warkop & Minuman</p>
            </div>
          </div>

          <div className="floating-card p-4 space-y-3">
            <p className="text-xs font-bold text-muted-foreground">Tambah Item</p>
            <div className="flex gap-2">
              <input type="text" value={itemNama} onChange={(e) => setItemNama(e.target.value)}
                placeholder="Nama menu" className="input-premium flex-1 text-xs"
                onKeyDown={(e) => e.key === "Enter" && tambahItem()} />
              <input type="text" inputMode="numeric" value={itemHarga} onChange={(e) => setItemHarga(e.target.value.replace(/\D/g, ""))}
                placeholder="Harga" className="input-premium w-24 text-xs tabular-nums"
                onKeyDown={(e) => e.key === "Enter" && tambahItem()} />
              <button onClick={tambahItem} className="size-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/30">
                <Plus className="size-5" />
              </button>
            </div>
          </div>

          <div className="floating-card p-4">
            <input type="text" value={customerNama} onChange={(e) => setCustomerNama(e.target.value)}
              placeholder="Nama pelanggan (opsional)" className="input-premium w-full text-xs" />
          </div>

          {cart.length > 0 && (
            <div className="floating-card p-4 space-y-2">
              <p className="text-xs font-bold text-muted-foreground">Keranjang ({cart.length})</p>
              {cart.map((e, i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <span className="text-xs flex-1 truncate">{e.nama}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setCart((p) => p.map((x, j) => j === i ? { ...x, qty: Math.max(1, x.qty - 1) } : x))} className="size-7 rounded-lg bg-slate-800 flex items-center justify-center"><Minus className="size-3" /></button>
                    <span className="text-xs font-bold w-6 text-center tabular-nums">{e.qty}</span>
                    <button onClick={() => setCart((p) => p.map((x, j) => j === i ? { ...x, qty: x.qty + 1 } : x))} className="size-7 rounded-lg bg-slate-800 flex items-center justify-center"><Plus className="size-3" /></button>
                  </div>
                  <span className="text-xs font-bold w-20 text-right tabular-nums">{formatRupiah(e.harga * e.qty)}</span>
                  <button onClick={() => setCart((p) => p.filter((_, j) => j !== i))} className="size-7 rounded-lg bg-rose-500/10 flex items-center justify-center hover:bg-rose-500/20">
                    <Trash2 className="size-3 text-rose-400" />
                  </button>
                </div>
              ))}
              <div className="flex justify-between text-sm font-bold border-t border-slate-700 pt-2 mt-1">
                <span>Total</span>
                <span className="text-emerald-400">{formatRupiah(total)}</span>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground/50">Dompet Penerimaan</label>
            <select value={walletId} onChange={(e) => setWalletId(e.target.value)} className="input-premium w-full text-xs">
              {wallets.map((w) => <option key={w.id} value={w.id}>{w.namaDompet}</option>)}
            </select>
          </div>

          <button onClick={bayar} disabled={isProcessing || cart.length === 0}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-sm shadow-xl shadow-emerald-500/25 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.97] transition-all disabled:opacity-30">
            {isProcessing ? "Memproses..." : `Bayar ${formatRupiah(total)}`}
          </button>
        </>
      ) : (
        <div className="floating-card p-6 space-y-4 text-center">
          <div className="size-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="size-8 text-emerald-400" />
          </div>
          <p className="text-lg font-bold font-heading">Pembayaran Berhasil!</p>
          <p className="text-xs text-muted-foreground/60">No. {invoiceId}</p>
          <p className="text-sm font-bold text-emerald-400">{formatRupiah(total)}</p>
          <button onClick={() => router.push("/buku-usaha/warkop/kasir")}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-violet-600 text-white font-bold text-sm">
            <Plus className="size-4 inline mr-1" />Transaksi Baru
          </button>
        </div>
      )}
    </div>
  );
}
