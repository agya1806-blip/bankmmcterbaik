"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Shirt, ArrowLeft, Plus, Minus, Trash2, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { useProfilUsahaStore } from "../../percetakan/store/useProfilUsahaStore";
import { useBusinessStore } from "@/store/useBusinessStore";
import { KasirSkeleton } from "@/components/ui/skeleton";

const BOOK = "usaha-toko-pakaian";

type ModeKasir = "ready" | "custom";

interface ProdukFashion {
  id: string; nama: string; kategori: string;
  varian: { warna: string; ukuran: string; stok: number }[];
  harga: number;
}

interface CartReadyItem { produk: ProdukFashion; warna: string; ukuran: string; qty: number; harga: number; }

const PRODUK_FASHION: ProdukFashion[] = [];

const WARNA_LIST = ["Hitam", "Putih", "Merah", "Biru", "Abu-abu", "Khaki", "Hijau Army", "Maroon"];

function generateId() {
  const d = new Date();
  const ds = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `FASHION-${ds}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

function todayISO() { return new Date().toISOString().slice(0, 10); }
function formatRupiah(n: number) { return `Rp ${n.toLocaleString("id-ID")}`; }

export default function KasirTokoPakaian() {
  const router = useRouter();
  const { profil } = useProfilUsahaStore();
  const { wallets, tambahSaldoWallet, kurangiSaldoWallet, setLastKasirUnit } = useBusinessStore();
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<ModeKasir>("ready");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartReadyItem[]>([]);
  const [customerNama, setCustomerNama] = useState("");
  const [customerWA, setCustomerWA] = useState("");
  const [walletId, setWalletId] = useState(wallets[0]?.id || "wallet-kas");
  const [invoiceId, setInvoiceId] = useState("");
  const [showInvoice, setShowInvoice] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => setMounted(true), []);

  const filtered = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return PRODUK_FASHION.filter((p) => p.nama.toLowerCase().includes(q) || p.kategori.toLowerCase().includes(q));
  }, [search]);

  const total = useMemo(() => cart.reduce((s, c) => s + c.harga * c.qty, 0), [cart]);

  const tambahKeCart = (p: ProdukFashion, warna: string, ukuran: string) => {
    const varian = p.varian.find((v) => v.warna === warna && v.ukuran === ukuran);
    if (varian && varian.stok <= 0) { toast.error("Stok habis"); return; }
    setCart((prev) => {
      const ex = prev.find((c) => c.produk.id === p.id && c.warna === warna && c.ukuran === ukuran);
      if (ex) return prev.map((c) => c.produk.id === p.id && c.warna === warna && c.ukuran === ukuran ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { produk: p, warna, ukuran, qty: 1, harga: p.harga }];
    });
  };

  const bayar = useCallback(async () => {
    if (cart.length === 0) { toast.error("Keranjang kosong"); return; }
    setIsProcessing(true);
    try {
      tambahSaldoWallet(walletId, total);
      const invId = generateId();
      setInvoiceId(invId);
      setLastKasirUnit(BOOK);
      toast.success("Transaksi berhasil!");
      setShowInvoice(true);
    } catch (err) {
      toast.error("Gagal memproses transaksi");
    } finally {
      setIsProcessing(false);
    }
  }, [cart, total, walletId, tambahSaldoWallet, setLastKasirUnit]);

  if (!mounted) return <KasirSkeleton />;

  return (
    <div className="max-w-2xl mx-auto pb-20 space-y-4 animate-fade-in">
      {!showInvoice ? (
        <>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/buku-usaha")} className="size-10 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors">
              <ArrowLeft className="size-5 text-slate-300" />
            </button>
            <div className="size-11 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-xl">
              <Shirt className="size-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold font-heading">Kasir Toko Pakaian</h1>
              <p className="text-[10px] text-muted-foreground/60">Toko Pakaian & Fashion</p>
            </div>
          </div>

          <div className="floating-card p-4 space-y-3">
            <input type="text" value={customerNama} onChange={(e) => setCustomerNama(e.target.value)}
              placeholder="Nama pelanggan" className="input-premium w-full text-xs" />
            <input type="text" value={customerWA} onChange={(e) => setCustomerWA(e.target.value)}
              placeholder="No. WhatsApp (opsional)" className="input-premium w-full text-xs" inputMode="numeric" />
          </div>

          <div className="floating-card p-4 space-y-3">
            <p className="text-xs font-bold text-muted-foreground">Produk Tersedia</p>
            <p className="text-[10px] text-muted-foreground/40 italic">Belum ada produk fashion. Tambah produk di Pengaturan.</p>
          </div>

          {cart.length > 0 && (
            <div className="floating-card p-4 space-y-2">
              <p className="text-xs font-bold text-muted-foreground">Keranjang ({cart.length})</p>
              {cart.map((c, i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{c.produk.nama}</p>
                    <p className="text-[9px] text-muted-foreground/40">{c.warna} / {c.ukuran}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setCart((p) => p.map((x, j) => j === i ? { ...x, qty: Math.max(1, x.qty - 1) } : x))} className="size-7 rounded-lg bg-slate-800 flex items-center justify-center"><Minus className="size-3" /></button>
                    <span className="text-xs font-bold w-6 text-center tabular-nums">{c.qty}</span>
                    <button onClick={() => setCart((p) => p.map((x, j) => j === i ? { ...x, qty: x.qty + 1 } : x))} className="size-7 rounded-lg bg-slate-800 flex items-center justify-center"><Plus className="size-3" /></button>
                  </div>
                  <span className="text-xs font-bold w-20 text-right tabular-nums">{formatRupiah(c.harga * c.qty)}</span>
                  <button onClick={() => setCart((p) => p.filter((_, j) => j !== i))} className="size-7 rounded-lg bg-rose-500/10 flex items-center justify-center">
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
          <p className="text-lg font-bold font-heading">Transaksi Berhasil!</p>
          <p className="text-xs text-muted-foreground/60">No. {invoiceId}</p>
          <p className="text-sm font-bold text-emerald-400">{formatRupiah(total)}</p>
          <button onClick={() => router.push("/buku-usaha/toko-pakaian/kasir")}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-violet-600 text-white font-bold text-sm">
            <Plus className="size-4 inline mr-1" />Transaksi Baru
          </button>
        </div>
      )}
    </div>
  );
}
