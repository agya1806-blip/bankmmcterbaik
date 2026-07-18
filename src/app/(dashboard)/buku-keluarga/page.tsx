"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "@/hooks/useLiveQuery";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { db, type UnitId } from "@/lib/db-v4";
import { useSessionStore } from "@/store/useSessionStore";
import {
  Bell, Wallet, TrendingUp, TrendingDown, Clock,
  BarChart3, AlertTriangle, ArrowUpRight, ArrowDownRight,
  FileText, Save, Home, DollarSign, Landmark, Smartphone,   Pencil, Trash2,
} from "lucide-react";
import { showToast } from "@/lib/toast";

const BOOK_ID: UnitId = "keluarga";

type TabKey = "ringkasan" | "catat" | "hutang" | "laporan" | "riwayat" | "dompet";

export default function BukuKeluargaPage() {
  const router = useRouter();
  const { currentUser } = useSessionStore();
  const [activeTab, setActiveTab] = useState<TabKey>("ringkasan");
  const [showNotif, setShowNotif] = useState(false);



  /* ─── Dompet State ─── */
  const [walletName, setWalletName] = useState("");
  const [walletTipe, setWalletTipe] = useState<"KasTunai" | "Bank" | "EWallet">("KasTunai");
  const [walletSaldo, setWalletSaldo] = useState(0);
  const [walletCatatan, setWalletCatatan] = useState("");
  const [walletNomorRekening, setWalletNomorRekening] = useState("");
  const [walletAtasNama, setWalletAtasNama] = useState("");
  const [walletNamaBank, setWalletNamaBank] = useState("");
  const [editingWallet, setEditingWallet] = useState<string | null>(null);

  const transactions = useLiveQuery(() => db.transactions.where("bookOrBranchId").equals(BOOK_ID).toArray(), []) || [];
  const cashflows = useLiveQuery(() => db.cashflows.where("bookOrBranchId").equals(BOOK_ID).toArray(), []) || [];
  const wallets = useLiveQuery(() => db.wallets.where("bookOrBranchId").equals(BOOK_ID).toArray(), []) || [];
  const piutangList = useLiveQuery(() => db.piutang.where("bookOrBranchId").equals(BOOK_ID).toArray(), []) || [];

  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const todayTx = transactions.filter((tx) => tx.tanggal.slice(0, 10) === todayStr);
    const monthTx = transactions.filter((tx) => {
      const d = parseISO(tx.tanggal);
      return d >= monthStart && d <= monthEnd;
    });

    const totalHariIni = todayTx.reduce((s, tx) => s + tx.totalBruto, 0);
    const totalBulanIni = monthTx.reduce((s, tx) => s + tx.totalBruto, 0);
    const totalSaldo = wallets.reduce((s, w) => s + w.saldo, 0);

    const cashflowMasuk = cashflows.filter((c) => c.tipe === "masuk").reduce((s, c) => s + c.nominal, 0);
    const cashflowKeluar = cashflows.filter((c) => c.tipe === "keluar").reduce((s, c) => s + c.nominal, 0);

    const piutangAktif = piutangList.filter((p) => p.status === "AKTIF");
    const piutangDueSoon = piutangAktif.filter((p) => {
      const diff = parseISO(p.jatuhTempo).getTime() - now.getTime();
      return diff <= 3 * 24 * 60 * 60 * 1000 && diff >= 0;
    });

    return {
      totalHariIni, totalBulanIni, totalSaldo, cashflowMasuk, cashflowKeluar,
      labaBersih: cashflowMasuk - cashflowKeluar, piutangAktif,
      piutangDueSoon, jumlahTransaksi: transactions.length,
    };
  }, [transactions, cashflows, wallets, piutangList]);

  const recentTx = useMemo(() => {
    return [...transactions].sort((a, b) => b.tanggal.localeCompare(a.tanggal)).slice(0, 10);
  }, [transactions]);

  const handleSaveWallet = async () => {
    if (!walletName.trim()) return showToast.error("Nama dompet wajib diisi!");
    const bankData = walletTipe === "Bank" ? { nomorRekening: walletNomorRekening.trim() || undefined, atasNama: walletAtasNama.trim() || undefined, namaBank: walletNamaBank.trim() || undefined } : {};
    if (editingWallet) {
      await db.wallets.update(editingWallet, { namaDompet: walletName.trim(), tipe: walletTipe, saldo: walletSaldo, catatan: walletCatatan, ...bankData });
      setEditingWallet(null);
    } else {
      await db.wallets.add({
        id: crypto.randomUUID(), bookOrBranchId: BOOK_ID, unitId: BOOK_ID,
        namaDompet: walletName.trim(), saldo: walletSaldo, tipe: walletTipe,
        catatan: walletCatatan, isActive: true, createdAt: new Date().toISOString(), ...bankData,
      });
    }
    setWalletName(""); setWalletSaldo(0); setWalletCatatan(""); setWalletTipe("KasTunai");
    setWalletNomorRekening(""); setWalletAtasNama(""); setWalletNamaBank("");
  };

  const handleEditWallet = (w: typeof wallets[0]) => {
    setEditingWallet(w.id); setWalletName(w.namaDompet); setWalletTipe(w.tipe); setWalletSaldo(w.saldo); setWalletCatatan(w.catatan);
    setWalletNomorRekening(w.nomorRekening || ""); setWalletAtasNama(w.atasNama || ""); setWalletNamaBank(w.namaBank || "");
  };

  const handleDeleteWallet = async (id: string) => {
    if (!confirm("Hapus dompet ini?")) return;
    await db.wallets.delete(id);
    if (editingWallet === id) { setEditingWallet(null); setWalletName(""); setWalletSaldo(0); setWalletCatatan(""); }
  };

  return (
    <div className="flex flex-col gap-4 pt-2 pb-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-slate-400 font-bold">Buku Keluarga</p>
          <h1 className="text-xl font-heading font-extrabold tracking-tight">
            <span className="text-rose-500">Keluarga</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowNotif(!showNotif)} className="relative w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center scale-press">
            <Bell className="w-5 h-5 text-slate-500" />
            {stats.piutangDueSoon.length > 0 && <span className="absolute -top-1 -right-1 badge-alert">{stats.piutangDueSoon.length}</span>}
          </button>
          <button onClick={() => router.push("/profile")} className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#008CEB] to-[#00C9A7] flex items-center justify-center text-white text-sm font-extrabold overflow-hidden shadow-md scale-press">
            {currentUser?.fotoUrl ? (
              <img src={currentUser.fotoUrl} alt="Profil" className="w-full h-full object-cover" />
            ) : (
              currentUser?.nama?.charAt(0)?.toUpperCase() || "?"
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showNotif && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="premium-card p-4 border-amber-300/40 dark:border-amber-700/40">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-heading font-extrabold">Notifikasi</span>
              </div>
              {stats.piutangDueSoon.length > 0 && <p className="text-[11px] py-1 flex items-center gap-2"><span className="badge-alert">{stats.piutangDueSoon.length}</span> piutang jatuh tempo</p>}
              {stats.piutangDueSoon.length === 0 && <p className="text-[11px] py-1 text-slate-400">Tidak ada notifikasi</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="premium-card p-4 bg-gradient-to-br from-rose-500/10 to-pink-500/10 dark:from-rose-500/5 dark:to-pink-500/5">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
            <Home className="w-4 h-4 text-rose-500" />
          </div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Saldo Keluarga</span>
        </div>
        <p className="text-xl font-heading font-extrabold text-rose-500 dark:text-rose-400 tracking-tight">Rp{stats.totalSaldo.toLocaleString()}</p>
      </div>

      <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto">
        {([ "ringkasan", "catat", "hutang", "laporan", "riwayat", "dompet" ] as TabKey[]).map((tab) => (
          <button key={tab} onClick={() => tab === "catat" ? router.push("/buku-keluarga/cashflow") : setActiveTab(tab)} className={`px-3 py-2 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all flex-1 ${activeTab === tab ? "bg-white dark:bg-[#0F1926] text-rose-500 shadow-sm" : "text-slate-400"}`}>
            {tab === "ringkasan" ? "Ringkasan" : tab === "catat" ? "Catat" : tab === "hutang" ? "Hutang" : tab === "laporan" ? "Laporan" : tab === "riwayat" ? "Riwayat" : "Dompet"}
          </button>
        ))}
      </div>

      {activeTab === "ringkasan" && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="premium-card p-4 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Hari Ini</span>
              <span className="text-sm font-heading font-extrabold text-emerald-600">Rp{stats.totalHariIni.toLocaleString()}</span>
            </div>
            <div className="premium-card p-4 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Bulan Ini</span>
              <span className="text-sm font-heading font-extrabold text-blue-600">Rp{stats.totalBulanIni.toLocaleString()}</span>
            </div>
            <div className="premium-card p-4 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Pemasukan</span>
              <span className="text-sm font-heading font-extrabold text-emerald-600">Rp{stats.cashflowMasuk.toLocaleString()}</span>
            </div>
            <div className="premium-card p-4 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                  <ArrowDownRight className="w-4 h-4 text-rose-600" />
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Pengeluaran</span>
              <span className="text-sm font-heading font-extrabold text-rose-600">Rp{stats.cashflowKeluar.toLocaleString()}</span>
            </div>
          </div>

          {stats.piutangDueSoon.length > 0 && (
            <div className="premium-card p-4 border-amber-300/50 dark:border-amber-700/50">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-heading font-extrabold text-amber-600">Piutang Jatuh Tempo</span>
              </div>
              {stats.piutangDueSoon.slice(0, 3).map((p) => (
                <div key={p.id} className="flex justify-between items-center text-[11px] py-1">
                  <span className="font-bold">{p.customerNama}</span>
                  <span className="text-amber-600 font-extrabold">Rp{p.sisaPiutang.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "hutang" && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="premium-card p-4 border-l-4 border-amber-400">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Piutang Aktif</span>
              <p className="text-sm font-heading font-extrabold text-amber-600 mt-1">Rp{stats.piutangAktif.reduce((s, p) => s + p.sisaPiutang, 0).toLocaleString()}</p>
              <p className="text-[9px] text-slate-400 mt-0.5">{stats.piutangAktif.length} transaksi</p>
            </div>
            <div className="premium-card p-4 border-l-4 border-rose-400">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Hutang Aktif</span>
              <p className="text-sm font-heading font-extrabold text-rose-600 mt-1">Rp{stats.piutangAktif.reduce((s, p) => s + p.sisaPiutang, 0).toLocaleString()}</p>
              <p className="text-[9px] text-slate-400 mt-0.5">{stats.piutangAktif.length} transaksi</p>
            </div>
          </div>

          {piutangList.filter((p) => p.status === "AKTIF").length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">Tidak ada hutang/piutang aktif</div>
          ) : (
            <div className="flex flex-col gap-2">
              {piutangList.filter((p) => p.status === "AKTIF").map((p) => (
                <div key={p.id} className="premium-card p-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-heading font-bold line-clamp-1">{p.customerNama}</p>
                    <p className="text-[9px] text-slate-400">Jatuh tempo: {format(parseISO(p.jatuhTempo), "dd MMM yyyy", { locale: idLocale })}</p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-xs font-heading font-extrabold text-amber-600">Rp{p.sisaPiutang.toLocaleString()}</p>
                    <span className="text-[8px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-600">PIUTANG</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "laporan" && (
        <div className="flex flex-col gap-3">
          <div className="premium-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-rose-500" />
              <span className="text-xs font-heading font-extrabold">Laporan Keuangan Keluarga</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-medium text-slate-500">Total Transaksi</span>
                <span className="text-[11px] font-extrabold">{stats.jumlahTransaksi}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-medium text-slate-500">Total Pemasukan</span>
                <span className="text-[11px] font-extrabold text-emerald-600">Rp{stats.cashflowMasuk.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-medium text-slate-500">Total Pengeluaran</span>
                <span className="text-[11px] font-extrabold text-rose-600">Rp{stats.cashflowKeluar.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-medium text-slate-500">Laba Bersih</span>
                <span className={`text-[11px] font-extrabold ${stats.labaBersih >= 0 ? "text-emerald-600" : "text-rose-600"}`}>Rp{stats.labaBersih.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="premium-card p-4 flex flex-col gap-1 border-emerald-200/40 dark:border-emerald-900/30">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 pulse-dot" />
                <span className="text-[9px] text-emerald-600 font-bold uppercase">Pemasukan</span>
              </div>
              <p className="text-sm font-heading font-extrabold text-emerald-600">Rp{stats.cashflowMasuk.toLocaleString()}</p>
            </div>
            <div className="premium-card p-4 flex flex-col gap-1 border-rose-200/40 dark:border-rose-900/30">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-500 pulse-dot" />
                <span className="text-[9px] text-rose-600 font-bold uppercase">Pengeluaran</span>
              </div>
              <p className="text-sm font-heading font-extrabold text-rose-600">Rp{stats.cashflowKeluar.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "riwayat" && (
        <div className="flex flex-col gap-3">
          {recentTx.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">Belum ada transaksi</div>
          ) : (
            <div className="flex flex-col gap-2">
              {recentTx.map((tx) => (
                <div key={tx.id} className="premium-card p-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-heading font-bold line-clamp-1">{tx.customerNama}</p>
                    <p className="text-[9px] text-slate-400">{tx.items.length} item &middot; {format(parseISO(tx.tanggal), "dd MMM", { locale: idLocale })}</p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-xs font-heading font-extrabold text-rose-500">Rp{tx.totalBruto.toLocaleString()}</p>
                    <span className={`inline-block text-[8px] px-2 py-0.5 rounded-full font-bold mt-0.5 ${tx.sisaTagihan === 0 ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>
                      {tx.sisaTagihan === 0 ? "LUNAS" : "PIUTANG"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "dompet" && (
        <div className="flex flex-col gap-3">
          <div className="premium-card p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-md">
                <span className="text-sm"><Wallet className="w-5 h-5" /></span>
              </div>
              <div>
                <span className="text-xs font-bold">{editingWallet ? "Edit Dompet" : "Tambah Dompet"}</span>
                <p className="text-[10px] text-slate-400">Kas tunai, rekening, e-wallet</p>
              </div>
            </div>
            <div className="space-y-2">
              <input type="text" placeholder="Nama dompet (contoh: Kas, BCA, Dana)" value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none" />
              <div className="grid grid-cols-3 gap-2">
                {(["KasTunai", "Bank", "EWallet"] as const).map((t) => (
                  <button key={t} onClick={() => setWalletTipe(t)}
                    className={`py-2 rounded-xl text-[10px] font-bold flex flex-col items-center gap-1 transition-all ${walletTipe === t ? "bg-rose-500 text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-400"}`}>
                    {t === "KasTunai" ? <DollarSign className="w-4 h-4" /> : t === "Bank" ? <Landmark className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                    {t === "KasTunai" ? "Kas" : t === "Bank" ? "Bank" : "E-Wallet"}
                  </button>
                ))}
              </div>
              {walletTipe === "Bank" && <>
                <input type="text" placeholder="Nama Bank (contoh: BCA, Mandiri)" value={walletNamaBank}
                  onChange={(e) => setWalletNamaBank(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none font-bold" />
                <input type="text" placeholder="Atas Nama" value={walletAtasNama}
                  onChange={(e) => setWalletAtasNama(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none font-bold" />
                <input type="text" placeholder="Nomor Rekening" value={walletNomorRekening}
                  onChange={(e) => setWalletNomorRekening(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none font-bold" />
              </>}
              <input type="number" placeholder="Saldo awal (Rp)" value={walletSaldo || ""}
                onChange={(e) => setWalletSaldo(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none font-bold" />
              <input type="text" placeholder="Catatan (opsional)" value={walletCatatan}
                onChange={(e) => setWalletCatatan(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none" />
              <div className="flex gap-2">
                <button onClick={handleSaveWallet}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-xs active:scale-[0.98] flex items-center justify-center gap-1.5">
                  <span className="text-sm"><Save className="w-5 h-5" /></span> {editingWallet ? "Update" : "Simpan"}
                </button>
                {editingWallet && (
                  <button onClick={() => { setEditingWallet(null); setWalletName(""); setWalletSaldo(0); setWalletCatatan(""); setWalletNomorRekening(""); setWalletAtasNama(""); setWalletNamaBank(""); }}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-400 text-xs font-bold">
                    Batal
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="premium-card p-3 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-4 h-4 text-rose-500" />
              <span className="text-xs font-bold">Dompet Keluarga</span>
              <span className="text-[10px] text-slate-400 ml-auto">({wallets.length})</span>
            </div>
            {wallets.length === 0 ? (
              <p className="text-[10px] text-slate-400 py-4 text-center">Belum ada dompet. Tambahkan dompet di atas.</p>
            ) : (
              <div className="space-y-1.5">
                {wallets.map((w) => {
                  const tipeIcons: Record<string, React.ReactNode> = { Bank: <Landmark className="w-4 h-4" />, EWallet: <Smartphone className="w-4 h-4" />, KasTunai: <DollarSign className="w-4 h-4" /> };
                  return (
                    <div key={w.id} className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/50 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-500">
                        {tipeIcons[w.tipe] || <Wallet className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold truncate">{w.namaDompet}</p>
                        {w.tipe === "Bank" && w.namaBank ? (
                          <p className="text-[9px] text-slate-400">{w.namaBank}{w.atasNama ? ` · ${w.atasNama}` : ""}{w.nomorRekening ? ` · ${w.nomorRekening}` : ""}</p>
                        ) : (
                          <p className="text-[9px] text-slate-400">{w.tipe}{w.catatan && ` · ${w.catatan}`}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-extrabold text-rose-500">Rp{w.saldo.toLocaleString()}</p>
                        <div className="flex gap-1 mt-0.5">
                          <button onClick={() => handleEditWallet(w)} className="p-0.5 text-slate-400 hover:text-rose-500">
                            <span className="text-[10px]"><Pencil className="w-5 h-5" /></span>
                          </button>
                          <button onClick={() => handleDeleteWallet(w.id)} className="p-0.5 text-slate-400 hover:text-rose-500">
                            <span className="text-[10px]"><Trash2 className="w-5 h-5" /></span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
