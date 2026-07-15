"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Laptop, ArrowLeft, Search, DollarSign, User, CheckCircle2, Shield, Box, X, Printer, Coffee, Shirt, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { useProfilUsahaStore } from "../../percetakan/store/useProfilUsahaStore";
import { useBusinessStore } from "@/store/useBusinessStore";
import { KasirSkeleton } from "@/components/ui/skeleton";

const BOOK = "usaha-laptop";

const GARANSI_OPTIONS = [
  { value: "1-bulan", label: "1 Bulan" }, { value: "3-bulan", label: "3 Bulan" },
  { value: "6-bulan", label: "6 Bulan" }, { value: "1-tahun", label: "1 Tahun" }, { value: "2-tahun", label: "2 Tahun" },
];

function generateId() {
  const d = new Date();
  const ds = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `NOTA-LAPTOP-${ds}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

function todayISO() { return new Date().toISOString().slice(0, 10); }
function formatRupiah(n: number) { return `IDR ${n.toLocaleString("id-ID")}`; }

export default function KasirLaptop() {
  const router = useRouter();
  const { profil } = useProfilUsahaStore();
  const { wallets, gadgetItems, tambahSaldoWallet, kurangiSaldoWallet, setLastKasirUnit } = useBusinessStore();
  const [walletPenerimaanId, setWalletPenerimaanId] = useState(wallets[0]?.id || "wallet-kas");
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{ id: string; brand: string; tipe: string; hargaJual: number; hargaModal: number } | null>(null);
  const [imeiSn, setImeiSn] = useState("");
  const [kondisi, setKondisi] = useState<"baru" | "second">("baru");
  const [garansi, setGaransi] = useState("1-tahun");
  const [cariCustomer, setCariCustomer] = useState("");
  const [customerNama, setCustomerNama] = useState("");
  const [customerWA, setCustomerWA] = useState("");
  const [showCustDropdown, setShowCustDropdown] = useState(false);
  const [dp, setDP] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [showInvoice, setShowInvoice] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => setMounted(true), []);

  const filtered = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return gadgetItems.filter((g) => g.brand?.toLowerCase().includes(q) || g.model?.toLowerCase().includes(q));
  }, [search, gadgetItems]);

  const pilihProduk = (g: typeof gadgetItems[0]) => {
    setSelectedProduct({ id: g.id, brand: g.brand || "", tipe: g.model, hargaJual: g.price, hargaModal: g.hpp });
    setSearch(`${g.brand} ${g.model}`);
    setShowDropdown(false);
    setImeiSn(g.imei1 || "");
  };

  const bayar = useCallback(async () => {
    if (!selectedProduct) { toast.error("Pilih produk dulu"); return; }
    if (!customerNama.trim()) { toast.error("Nama pelanggan harus diisi"); return; }
    setIsProcessing(true);
    try {
      const nominalDp = parseInt(dp.replace(/\D/g, ""), 10) || 0;
      const finalTotal = selectedProduct.hargaJual;
      if (nominalDp > finalTotal) { toast.error("DP tidak boleh melebihi total"); setIsProcessing(false); return; }
      tambahSaldoWallet(walletPenerimaanId, finalTotal);
      if (nominalDp > 0) {
        kurangiSaldoWallet(walletPenerimaanId, finalTotal - nominalDp);
      }
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
  }, [selectedProduct, customerNama, dp, walletPenerimaanId, tambahSaldoWallet, kurangiSaldoWallet, setLastKasirUnit]);

  if (!mounted) return <KasirSkeleton />;

  return (
    <div className="max-w-2xl mx-auto pb-20 space-y-4 animate-fade-in">
      {!showInvoice ? (
        <>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/buku-usaha")} className="size-10 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors">
              <ArrowLeft className="size-5 text-slate-300" />
            </button>
            <div className="size-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl">
              <Laptop className="size-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold font-heading">Kasir Laptop</h1>
              <p className="text-[10px] text-muted-foreground/60">Toko Laptop & Service</p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); }}
              placeholder="Cari produk..." className="input-premium w-full pl-9 text-xs" />
            {showDropdown && search.trim() && filtered.length > 0 && (
              <div className="absolute z-20 top-full mt-1 left-0 right-0 max-h-48 overflow-y-auto rounded-xl bg-slate-800 border border-slate-700 shadow-2xl">
                {filtered.map((g) => (
                  <button key={g.id} onClick={() => pilihProduk(g)}
                    className="w-full text-left px-3 py-2.5 text-xs text-slate-200 hover:bg-slate-700 transition-colors flex justify-between">
                    <span>{g.brand} {g.model}</span>
                    <span className="text-emerald-400 font-bold">{formatRupiah(g.price)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedProduct && (
            <div className="floating-card p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-bold">{selectedProduct.brand} {selectedProduct.tipe}</p>
                </div>
                <p className="text-lg font-bold text-emerald-400 font-heading">{formatRupiah(selectedProduct.hargaJual)}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground/50">IMEI/SN</label>
                  <input type="text" value={imeiSn} onChange={(e) => setImeiSn(e.target.value)} className="input-premium w-full text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground/50">Kondisi</label>
                  <select value={kondisi} onChange={(e) => setKondisi(e.target.value as any)} className="input-premium w-full text-xs">
                    <option value="baru">Baru</option><option value="second">Second</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground/50">Garansi</label>
                <select value={garansi} onChange={(e) => setGaransi(e.target.value)} className="input-premium w-full text-xs">
                  {GARANSI_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
          )}

          <div className="floating-card p-4 space-y-3">
            <p className="text-xs font-bold text-muted-foreground">Pelanggan</p>
            <input type="text" value={customerNama} onChange={(e) => setCustomerNama(e.target.value)}
              placeholder="Nama pelanggan" className="input-premium w-full text-xs" />
            <input type="text" value={customerWA} onChange={(e) => setCustomerWA(e.target.value)}
              placeholder="No. WhatsApp (opsional)" className="input-premium w-full text-xs" inputMode="numeric" />
          </div>

          <div className="floating-card p-4 space-y-2">
            <p className="text-xs font-bold text-muted-foreground">DP / Cicilan</p>
            <input type="text" inputMode="numeric" value={dp} onChange={(e) => setDP(e.target.value.replace(/\D/g, ""))}
              placeholder="DP (kosongkan jika lunas)" className="input-premium w-full text-xs" />
          </div>

          {selectedProduct && (
            <div className="floating-card p-4 bg-gradient-to-br from-slate-800 to-slate-900 flex justify-between items-center">
              <span className="text-xs text-muted-foreground/60">Total</span>
              <span className="text-lg font-bold text-emerald-400 font-heading">{formatRupiah(selectedProduct.hargaJual)}</span>
            </div>
          )}

          <button onClick={bayar} disabled={isProcessing || !selectedProduct || !customerNama.trim()}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-sm shadow-xl shadow-emerald-500/25 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.97] transition-all disabled:opacity-30">
            {isProcessing ? "Memproses..." : "Bayar"}
          </button>
        </>
      ) : (
        <div className="floating-card p-6 space-y-4 text-center">
          <div className="size-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="size-8 text-emerald-400" />
          </div>
          <p className="text-lg font-bold font-heading">Transaksi Berhasil!</p>
          <p className="text-xs text-muted-foreground/60">Invoice: {invoiceId}</p>
          <p className="text-sm font-bold text-emerald-400">{formatRupiah(selectedProduct?.hargaJual || 0)}</p>
          <button onClick={() => router.push("/buku-usaha/laptop/kasir")}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-violet-600 text-white font-bold text-sm">
            <Plus className="size-4 inline mr-1" />Transaksi Baru
          </button>
        </div>
      )}
    </div>
  );
}
