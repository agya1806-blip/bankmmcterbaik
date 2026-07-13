"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet, ArrowLeft, Plus, ArrowRightLeft, History,
  Building2, Banknote, Smartphone, Trash2, TrendingUp, BarChart3,
} from "lucide-react";
import toast from "react-hot-toast";
import { useBusinessStore, WalletTipe } from "@/store/useBusinessStore";

function formatRupiah(n: number) {
  return `IDR ${n.toLocaleString("id-ID")}`;
}

function genId(): string {
  return `wallet_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

const WALLET_ICONS: Record<WalletTipe, { icon: React.ElementType; color: string; bg: string }> = {
  KasTunai: { icon: Banknote, color: "text-emerald-600", bg: "bg-emerald-500/10" },
  Bank: { icon: Building2, color: "text-blue-600", bg: "bg-blue-500/10" },
  EWallet: { icon: Smartphone, color: "text-violet-600", bg: "bg-violet-500/10" },
};

export default function DompetPage() {
  const router = useRouter();
  const store = useBusinessStore();
  const { wallets, mutasiLog } = store;

  const [mounted, setMounted] = useState(false);

  /* ─── Tab ─── */
  const [tab, setTab] = useState<"grid" | "transfer" | "tambah">("grid");

  /* ─── Transfer form ─── */
  const [dariId, setDariId] = useState("");
  const [keId, setKeId] = useState("");
  const [nominal, setNominal] = useState("");
  const [alasan, setAlasan] = useState("");

  /* ─── Tambah dompet ─── */
  const [newNama, setNewNama] = useState("");
  const [newSaldo, setNewSaldo] = useState("");
  const [newTipe, setNewTipe] = useState<WalletTipe>("KasTunai");
  const [newCatatan, setNewCatatan] = useState("");

  useEffect(() => setMounted(true), []);

  /* ─── Total saldo ─── */
  const totalSaldo = useMemo(() => wallets.reduce((s, w) => s + w.saldo, 0), [wallets]);

  /* ─── Transfer ─── */
  const handleTransfer = useCallback(() => {
    if (!dariId || !keId) { toast.error("Pilih dompet asal dan tujuan"); return; }
    if (dariId === keId) { toast.error("Dompet asal dan tujuan harus berbeda"); return; }
    const nominalNum = parseInt(nominal.replace(/\D/g, ""), 10);
    if (!nominalNum || nominalNum <= 0) { toast.error("Nominal harus lebih dari 0"); return; }
    if (!alasan.trim()) { toast.error("Isi alasan mutasi"); return; }
    const result = store.transferSaldo(dariId, keId, nominalNum, alasan);
    if (result.ok) {
      toast.success("Transfer berhasil");
      setNominal("");
      setAlasan("");
      setDariId("");
      setKeId("");
    } else {
      toast.error(result.error || "Transfer gagal");
    }
  }, [dariId, keId, nominal, alasan, store]);

  /* ─── Tambah dompet ─── */
  const handleTambah = useCallback(() => {
    if (!newNama.trim()) { toast.error("Nama dompet wajib diisi"); return; }
    store.addWallet({
      id: genId(),
      namaDompet: newNama.trim(),
      saldo: parseInt(newSaldo.replace(/\D/g, ""), 10) || 0,
      tipe: newTipe,
      catatan: newCatatan,
    });
    toast.success(`Dompet ${newNama.trim()} ditambahkan`);
    setNewNama(""); setNewSaldo(""); setNewTipe("KasTunai"); setNewCatatan("");
    setTab("grid");
  }, [newNama, newSaldo, newTipe, newCatatan, store]);

  /* ─── Hapus dompet ─── */
  const handleHapus = useCallback((id: string, nama: string) => {
    if (wallets.length <= 1) { toast.error("Minimal 1 dompet harus ada"); return; }
    store.removeWallet(id);
    toast.success(`Dompet ${nama} dihapus`);
  }, [wallets.length, store]);

  if (!mounted) return <div className="min-h-[60vh]" />;

  const tabBtn = (key: "grid" | "transfer" | "tambah", label: string, icon: React.ElementType) => {
    const Ico = icon;
    const aktif = tab === key;
    return (
      <button key={key} onClick={() => setTab(key)}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-bold transition-all ${
          aktif
            ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/20"
            : "bg-muted/30 text-muted-foreground/60 hover:bg-muted/50"
        }`}
      >
        <Ico className="size-3.5" /> {label}
      </button>
    );
  };

  return (
    <div className="max-w-3xl mx-auto pb-24 space-y-5 animate-fade-in">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/buku-usaha")}
            className="size-9 rounded-xl bg-muted/30 flex items-center justify-center hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="size-4 text-muted-foreground" />
          </button>
          <div className="size-11 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Wallet className="size-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold font-heading">Dompet Kas Operasional</h2>
            <p className="text-[10px] text-muted-foreground/60">Manajemen multi-wallet internal usaha</p>
          </div>
        </div>
        <button onClick={() => router.push("/buku-usaha/laporan-keuangan")}
          className="px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 text-[10px] font-bold hover:bg-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-1"
        >
          <BarChart3 className="size-3.5" /> Laporan
        </button>
      </div>

      {/* ─── Total Saldo ─── */}
      <div className="floating-card p-5 bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20">
        <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-semibold">Total Kas Usaha</p>
        <p className="text-3xl font-bold font-heading tabular-nums mt-1">{formatRupiah(totalSaldo)}</p>
        <div className="flex gap-2 mt-3">
          {wallets.map((w) => {
            const WIcon = WALLET_ICONS[w.tipe].icon;
            return (
              <div key={w.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background/60 text-[9px]">
                <WIcon className="size-3 text-muted-foreground/60" />
                <span className="font-medium">{w.namaDompet}</span>
                <span className="tabular-nums font-semibold">{formatRupiah(w.saldo)}</span>
              </div>
            );
          })}
        </div>
        <p className="text-[8px] text-muted-foreground/40 mt-2">Saldo akan otomatis terpotong/bertambah saat transaksi POS Kasir</p>
      </div>

      {/* ─── Tab Nav ─── */}
      <div className="flex gap-2">
        {tabBtn("grid", "Dompet", Wallet)}
        {tabBtn("transfer", "Transfer", ArrowRightLeft)}
        {tabBtn("tambah", "Tambah Dompet", Plus)}
      </div>

      {/* ══════════════════════════════════════════════════
          TAB: GRID DOMPET
          ══════════════════════════════════════════════════ */}
      {tab === "grid" && (
        <div className="space-y-3">
          {wallets.length === 0 ? (
            <div className="floating-card p-6 text-center">
              <Wallet className="size-10 mx-auto text-muted-foreground/20" />
              <p className="text-xs text-muted-foreground/40 mt-2">Belum ada dompet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {wallets.map((w) => {
                const meta = WALLET_ICONS[w.tipe];
                const WIcon = meta.icon;
                const pct = totalSaldo > 0 ? (w.saldo / totalSaldo) * 100 : 0;
                return (
                  <div key={w.id} className="floating-card p-4 space-y-3 group">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`size-10 rounded-xl ${meta.bg} flex items-center justify-center`}>
                          <WIcon className={`size-5 ${meta.color}`} />
                        </div>
                        <div>
                          <p className="text-xs font-bold">{w.namaDompet}</p>
                          <p className="text-[9px] text-muted-foreground/50 capitalize">{w.tipe}</p>
                        </div>
                      </div>
                      <button onClick={() => handleHapus(w.id, w.namaDompet)}
                        className="size-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 text-muted-foreground/40 hover:text-rose-500 transition-all"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                    <p className="text-xl font-bold font-heading tabular-nums">{formatRupiah(w.saldo)}</p>
                    <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-600 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-muted-foreground/40">
                      <span>{pct.toFixed(1)}% dari total</span>
                      {w.catatan && <span className="truncate max-w-[180px]">{w.catatan}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Mutasi Log */}
          <div className="floating-card p-4 space-y-3">
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <History className="size-3.5 text-violet-500" /> Log Mutasi Terakhir
            </p>
            {mutasiLog.length === 0 ? (
              <p className="text-[10px] text-muted-foreground/30 py-2 text-center">Belum ada mutasi</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {mutasiLog.slice(0, 20).map((m) => {
                  const dari = wallets.find((w) => w.id === m.dariWalletId);
                  const ke = wallets.find((w) => w.id === m.keWalletId);
                  const waktu = new Date(m.createdAt);
                  return (
                    <div key={m.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 text-[9px]">
                      <div className="size-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                        <ArrowRightLeft className="size-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">
                          {dari?.namaDompet || "?"} <TrendingUp className="size-2.5 inline text-rose-400" /> {ke?.namaDompet || "?"}
                        </p>
                        <p className="text-muted-foreground/50">{m.alasan}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold tabular-nums text-amber-600">{formatRupiah(m.nominal)}</p>
                        <p className="text-muted-foreground/30">{waktu.toLocaleDateString("id-ID")}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TAB: TRANSFER
          ══════════════════════════════════════════════════ */}
      {tab === "transfer" && (
        <div className="floating-card p-5 space-y-4">
          <p className="text-xs font-semibold flex items-center gap-1.5">
            <ArrowRightLeft className="size-3.5 text-violet-500" /> Transfer Antar Dompet
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] text-muted-foreground/50">Dari Dompet</label>
              <select value={dariId} onChange={(e) => setDariId(e.target.value)} className="input-premium w-full text-[10px]">
                <option value="">Pilih dompet asal</option>
                {wallets.filter((w) => w.id !== keId).map((w) => (
                  <option key={w.id} value={w.id}>{w.namaDompet} ({formatRupiah(w.saldo)})</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-muted-foreground/50">Ke Dompet</label>
              <select value={keId} onChange={(e) => setKeId(e.target.value)} className="input-premium w-full text-[10px]">
                <option value="">Pilih dompet tujuan</option>
                {wallets.filter((w) => w.id !== dariId).map((w) => (
                  <option key={w.id} value={w.id}>{w.namaDompet} ({formatRupiah(w.saldo)})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] text-muted-foreground/50">Nominal Transfer</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/50">Rp</span>
              <input type="text" inputMode="numeric" value={nominal}
                onChange={(e) => setNominal(e.target.value.replace(/\D/g, ""))}
                placeholder="0" className="input-premium w-full text-xs pl-10 tabular-nums" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] text-muted-foreground/50">Alasan / Catatan Mutasi *</label>
            <input type="text" value={alasan} onChange={(e) => setAlasan(e.target.value)}
              placeholder="cth: Setor harian ke bank" className="input-premium w-full text-[10px]" />
          </div>

          {/* Preview */}
          {dariId && keId && nominal && (
            <div className="rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 p-3 space-y-1 text-[10px]">
              <p className="font-semibold text-amber-600">Ringkasan Transfer</p>
              <p>Dari: <span className="font-medium">{wallets.find((w) => w.id === dariId)?.namaDompet}</span></p>
              <p>Ke: <span className="font-medium">{wallets.find((w) => w.id === keId)?.namaDompet}</span></p>
              <p>Nominal: <span className="font-bold tabular-nums">{formatRupiah(parseInt(nominal) || 0)}</span></p>
            </div>
          )}

          <button onClick={handleTransfer}
            disabled={!dariId || !keId || !nominal || !alasan.trim()}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-bold shadow-lg shadow-violet-500/20 hover:shadow-xl hover:shadow-violet-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <ArrowRightLeft className="size-4" /> Transfer Saldo
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TAB: TAMBAH DOMPET
          ══════════════════════════════════════════════════ */}
      {tab === "tambah" && (
        <div className="floating-card p-5 space-y-4">
          <p className="text-xs font-semibold flex items-center gap-1.5">
            <Plus className="size-3.5 text-violet-500" /> Tambah Dompet Baru
          </p>
          <div className="space-y-1">
            <label className="text-[9px] text-muted-foreground/50">Nama Dompet *</label>
            <input type="text" value={newNama} onChange={(e) => setNewNama(e.target.value)}
              placeholder="cth: Kas Laci Kasir" className="input-premium w-full text-xs" />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] text-muted-foreground/50">Saldo Awal</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/50">Rp</span>
              <input type="text" inputMode="numeric" value={newSaldo}
                onChange={(e) => setNewSaldo(e.target.value.replace(/\D/g, ""))}
                placeholder="0" className="input-premium w-full text-xs pl-10 tabular-nums" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] text-muted-foreground/50">Tipe Dompet</label>
            <div className="flex gap-2">
              {(["KasTunai", "Bank", "EWallet"] as WalletTipe[]).map((t) => {
                const meta = WALLET_ICONS[t];
                const WIcon = meta.icon;
                const aktif = newTipe === t;
                return (
                  <button key={t} onClick={() => setNewTipe(t)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-semibold transition-all ${
                      aktif
                        ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md"
                        : "bg-muted/30 text-muted-foreground/50 hover:bg-muted/50"
                    }`}
                  >
                    <WIcon className="size-3.5" /> {t === "KasTunai" ? "Tunai" : t === "Bank" ? "Bank" : "E-Wallet"}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] text-muted-foreground/50">Catatan (opsional)</label>
            <input type="text" value={newCatatan} onChange={(e) => setNewCatatan(e.target.value)}
              placeholder="cth: BSI 1234567890" className="input-premium w-full text-[10px]" />
          </div>
          <button onClick={handleTambah}
            disabled={!newNama.trim()}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-bold shadow-lg shadow-violet-500/20 hover:shadow-xl hover:shadow-violet-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Plus className="size-4" /> Tambah Dompet
          </button>
        </div>
      )}
    </div>
  );
}
