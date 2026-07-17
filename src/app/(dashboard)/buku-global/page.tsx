"use client";

import React, { useState, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/store/useSessionStore";
import { useThemeStore } from "@/store/useThemeStore";
import { createBackup, restoreBackup, downloadBlob } from "@/lib/backup";
import { executeTransfer } from "@/engine/double-entry";
import { exportTransactionsExcel, exportCashflowExcel } from "@/lib/export-utils";
import { db, type BookOrBranch, BOOK_LABELS } from "@/lib/db-v4";
import { useLiveQuery } from "dexie-react-hooks";
import { motion, AnimatePresence } from "framer-motion";
import PinLock from "@/components/pin-lock";
import { BarChart3, CreditCard, Users, ScrollText, Settings, Sun, Moon, DollarSign, TrendingUp, TrendingDown, AlertTriangle, Search, Wallet, Download, Upload, ArrowRightLeft, Zap, Plus, Trash2, LogOut, X, Database } from "lucide-react";

const BRANCH_LIST: BookOrBranch[] = [
  "usaha-percetakan", "usaha-laptop", "usaha-gadget",
  "usaha-warkop", "usaha-kelontong", "usaha-konveksi", "usaha-toko-pakaian",
];

type TabKey = "dashboard" | "piutang" | "pelanggan" | "audit" | "settings";

export default function BukuGlobalPage() {
  const router = useRouter();
  const { currentUser, logout, isPinVerified, verifyPin, resetPinVerification } = useSessionStore();
  const { theme, toggleTheme } = useThemeStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showPin, setShowPin] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [isProcessing, setIsProcessing] = useState(false);

  /* ─── Backup State ─── */
  const [backupPassword, setBackupPassword] = useState("");

  /* ─── Transfer State ─── */
  const [transferFrom, setTransferFrom] = useState<BookOrBranch>("usaha-warkop");
  const [transferTo, setTransferTo] = useState<BookOrBranch>("usaha-percetakan");
  const [transferAmount, setTransferAmount] = useState(0);
  const [transferDesc, setTransferDesc] = useState("");

  /* ─── Piutang State ─── */
  const [piutangSearch, setPiutangSearch] = useState("");
  const [piutangBranchFilter, setPiutangBranchFilter] = useState<BookOrBranch | "semua">("semua");
  const [selectedPiutang, setSelectedPiutang] = useState<string | null>(null);
  const [bayarPiutangAmount, setBayarPiutangAmount] = useState(0);

  /* ─── Pelanggan State ─── */
  const [pelangganSearch, setPelangganSearch] = useState("");
  const [pelangganBranch, setPelangganBranch] = useState<BookOrBranch | "semua">("semua");

  /* ─── Audit State ─── */
  const [auditSearch, setAuditSearch] = useState("");
  const [auditBranch, setAuditBranch] = useState<BookOrBranch | "semua">("semua");
  const [auditType, setAuditType] = useState<string>("semua");

  /* ─── Quick Order State ─── */
  const [showQuickOrderModal, setShowQuickOrderModal] = useState(false);
  const [quickOrderLabel, setQuickOrderLabel] = useState("");
  const [quickOrderItems, setQuickOrderItems] = useState<{ desc: string; price: number }[]>([]);
  const [quickOrderBranch, setQuickOrderBranch] = useState<BookOrBranch>("usaha-warkop");
  const [qoItemDesc, setQoItemDesc] = useState("");
  const [qoItemPrice, setQoItemPrice] = useState(0);

  /* ─── DB Queries ─── */
  const allTransactions = useLiveQuery(() => db.transactions.toArray()) || [];
  const allCashflows = useLiveQuery(() => db.cashflows.toArray()) || [];
  const allPiutang = useLiveQuery(() => db.piutang.toArray()) || [];
  const allCustomers = useLiveQuery(() => db.customers.toArray()) || [];
  const allInventory = useLiveQuery(() => db.inventory.toArray()) || [];
  const allAuditLogs = useLiveQuery(() => db.auditLogs.orderBy("createdAt").reverse().toArray()) || [];
  const allQuickOrders = useLiveQuery(() => db.quickOrders.toArray()) || [];

  /* ─── Auth Gate ─── */
  if (!isPinVerified && showPin) {
    return (
      <PinLock
        onSuccess={() => { verifyPin(); setShowPin(false); }}
        title="Akses Pengaturan Global"
        subtitle="Masukkan PIN admin"
      />
    );
  }

  /* ═══════════════════════════════════════════════════════ */
  /* DASHBOARD COMPUTATIONS                                 */
  /* ═══════════════════════════════════════════════════════ */

  const dashData = useMemo(() => {
    let totalPendapatan = 0;
    let totalHpp = 0;
    let transaksiLunas = 0;
    let transaksiPiutang = 0;

    allTransactions.forEach((tx) => {
      totalPendapatan += tx.totalBruto;
      if (tx.status === "LUNAS") transaksiLunas++;
      if (tx.status === "DP") transaksiPiutang++;
      tx.items.forEach((item) => {
        const inv = allInventory.find((i) => i.nama === item.namaItem && i.bookOrBranchId === tx.bookOrBranchId);
        if (inv) totalHpp += inv.hargaModal * item.qty;
      });
    });

    const cashflowMasuk = allCashflows.filter((c) => c.tipe === "masuk").reduce((s, c) => s + c.nominal, 0);
    const cashflowKeluar = allCashflows.filter((c) => c.tipe === "keluar").reduce((s, c) => s + c.nominal, 0);
    const piutangAktif = allPiutang.filter((p) => p.status === "AKTIF");
    const totalPiutang = piutangAktif.reduce((s, p) => s + p.sisaPiutang, 0);
    const stokMenipis = allInventory.filter((i) => i.stok <= i.stokMin && i.stok > 0);
    const stokHabis = allInventory.filter((i) => i.stok === 0);
    const labaKotor = totalPendapatan - totalHpp;
    const labaBersih = cashflowMasuk - cashflowKeluar;

    const perBranch = BRANCH_LIST.map((branch) => {
      const txBranch = allTransactions.filter((t) => t.bookOrBranchId === branch);
      const cfBranch = allCashflows.filter((c) => c.bookOrBranchId === branch);
      const piutangBranch = allPiutang.filter((p) => p.bookOrBranchId === branch && p.status === "AKTIF");
      const invBranch = allInventory.filter((i) => i.bookOrBranchId === branch);
      return {
        branch,
        label: BOOK_LABELS[branch],
        pendapatan: txBranch.reduce((s, t) => s + t.totalBruto, 0),
        cashMasuk: cfBranch.filter((c) => c.tipe === "masuk").reduce((s, c) => s + c.nominal, 0),
        cashKeluar: cfBranch.filter((c) => c.tipe === "keluar").reduce((s, c) => s + c.nominal, 0),
        piutang: piutangBranch.reduce((s, p) => s + p.sisaPiutang, 0),
        jumlahProduk: invBranch.length,
        stokMenipis: invBranch.filter((i) => i.stok <= i.stokMin && i.stok > 0).length,
        jumlahTransaksi: txBranch.length,
      };
    });

    return {
      totalPendapatan, totalHpp, labaKotor, labaBersih,
      cashflowMasuk, cashflowKeluar,
      totalPiutang, piutangAktifCount: piutangAktif.length,
      stokMenipisCount: stokMenipis.length, stokHabisCount: stokHabis.length,
      transaksiLunas, transaksiPiutang,
      totalTransaksi: allTransactions.length,
      totalPelanggan: allCustomers.length,
      totalProduk: allInventory.length,
      totalCabang: BRANCH_LIST.length,
      perBranch,
    };
  }, [allTransactions, allCashflows, allPiutang, allCustomers, allInventory]);

  /* ═══════════════════════════════════════════════════════ */
  /* HANDLERS                                               */
  /* ═══════════════════════════════════════════════════════ */

  const handleBackup = useCallback(async () => {
    if (!backupPassword || backupPassword.length < 4) return alert("Password minimal 4 karakter!");
    setIsProcessing(true);
    try {
      const blob = await createBackup(backupPassword);
      downloadBlob(blob, `mmcbank-backup-${Date.now()}.enc`);
      alert("Backup berhasil diunduh!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      alert(`Backup gagal: ${message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [backupPassword]);

  const handleRestore = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const password = prompt("Masukkan password backup:");
    if (!password) return;
    setIsProcessing(true);
    try {
      const result = await restoreBackup(file, password);
      if (result.ok) { alert("Restore berhasil! Memuat ulang..."); window.location.reload(); }
      else alert(`Restore gagal: ${result.error}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      alert(`Restore gagal: ${message}`);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleTransfer = useCallback(async () => {
    if (transferAmount <= 0) return alert("Jumlah harus lebih dari 0!");
    if (!transferDesc.trim()) return alert("Deskripsi wajib diisi!");
    if (transferFrom === transferTo) return alert("Cabang asal dan tujuan harus berbeda!");
    setIsProcessing(true);
    try {
      const res = await executeTransfer({ fromBranch: transferFrom, toBranch: transferTo, amount: transferAmount, description: transferDesc.trim() });
      if (res.ok) { alert("Transfer antar cabang berhasil!"); setTransferAmount(0); setTransferDesc(""); }
      else alert(`Transfer gagal: ${res.error}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      alert(`Transfer gagal: ${message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [transferFrom, transferTo, transferAmount, transferDesc]);

  const handleBayarPiutang = useCallback(async (piutangId: string) => {
    if (bayarPiutangAmount <= 0) return alert("Jumlah harus lebih dari 0!");
    const piutang = allPiutang.find((p) => p.id === piutangId);
    if (!piutang) return;
    if (bayarPiutangAmount > piutang.sisaPiutang) return alert("Jumlah melebihi sisa piutang!");
    const newSisa = piutang.sisaPiutang - bayarPiutangAmount;
    await db.piutang.update(piutangId, { sisaPiutang: newSisa, status: newSisa <= 0 ? "LUNAS" : "AKTIF" });
    await db.piutangInstallments.add({
      id: crypto.randomUUID(),
      bookOrBranchId: piutang.bookOrBranchId,
      piutangId,
      jumlah: bayarPiutangAmount,
      metode: "tunai",
      tanggal: new Date().toISOString(),
      catatan: `Pembayaran dari Global`,
    });
    alert(`Pembayaran Rp${bayarPiutangAmount.toLocaleString()} berhasil!`);
    setBayarPiutangAmount(0);
    setSelectedPiutang(null);
  }, [bayarPiutangAmount, allPiutang]);

  const handleAddQuickOrder = useCallback(() => {
    if (!qoItemDesc || qoItemPrice <= 0) return;
    setQuickOrderItems((prev) => [...prev, { desc: qoItemDesc, price: qoItemPrice }]);
    setQoItemDesc("");
    setQoItemPrice(0);
  }, [qoItemDesc, qoItemPrice]);

  const handleSaveQuickOrder = useCallback(async () => {
    if (!quickOrderLabel || quickOrderItems.length === 0) return alert("Label dan item wajib diisi!");
    await db.quickOrders.add({
      id: crypto.randomUUID(),
      bookOrBranchId: quickOrderBranch,
      label: quickOrderLabel,
      items: quickOrderItems,
      createdAt: new Date().toISOString(),
    });
    alert("Template Cepat disimpan!");
    setShowQuickOrderModal(false);
    setQuickOrderLabel("");
    setQuickOrderItems([]);
  }, [quickOrderLabel, quickOrderItems, quickOrderBranch]);

  const handleDeleteQuickOrder = useCallback(async (id: string) => {
    if (!confirm("Hapus template ini?")) return;
    await db.quickOrders.delete(id);
  }, []);

  const handleExportTransactions = () => {
    if (allTransactions.length === 0) return alert("Tidak ada data transaksi!");
    exportTransactionsExcel(allTransactions, "Semua-Cabang");
  };

  const handleExportCashflow = () => {
    if (allCashflows.length === 0) return alert("Tidak ada data cashflow!");
    exportCashflowExcel(allCashflows, "Semua-Cabang");
  };

  const handleLogout = () => {
    if (!confirm("Yakin ingin logout?")) return;
    logout();
    resetPinVerification();
    router.push("/login");
  };

  /* ═══════════════════════════════════════════════════════ */
  /* FILTERED DATA                                          */
  /* ═══════════════════════════════════════════════════════ */

  const filteredPiutang = useMemo(() => {
    return allPiutang.filter((p) => {
      if (piutangBranchFilter !== "semua" && p.bookOrBranchId !== piutangBranchFilter) return false;
      if (!p.customerNama.toLowerCase().includes(piutangSearch.toLowerCase())) return false;
      return true;
    }).sort((a, b) => b.sisaPiutang - a.sisaPiutang);
  }, [allPiutang, piutangBranchFilter, piutangSearch]);

  const filteredPelanggan = useMemo(() => {
    return allCustomers.filter((c) => {
      if (pelangganBranch !== "semua" && c.bookOrBranchId !== pelangganBranch) return false;
      if (pelangganSearch && !c.nama.toLowerCase().includes(pelangganSearch.toLowerCase()) && !c.noWA.includes(pelangganSearch)) return false;
      return true;
    }).sort((a, b) => b.totalBelanja - a.totalBelanja);
  }, [allCustomers, pelangganBranch, pelangganSearch]);

  const filteredAudit = useMemo(() => {
    return allAuditLogs.filter((log) => {
      if (auditBranch !== "semua" && log.bookOrBranchId !== auditBranch) return false;
      if (auditType !== "semua" && log.action !== auditType) return false;
      if (auditSearch && !log.userName.toLowerCase().includes(auditSearch.toLowerCase()) && !log.alasan.toLowerCase().includes(auditSearch.toLowerCase())) return false;
      return true;
    }).slice(0, 100);
  }, [allAuditLogs, auditBranch, auditType, auditSearch]);

  /* ═══════════════════════════════════════════════════════ */
  /* TAB CONFIG                                             */
  /* ═══════════════════════════════════════════════════════ */

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "dashboard", label: "Ringkasan", icon: <TrendingUp className="w-5 h-5" /> },
    { key: "piutang", label: "Piutang", icon: <CreditCard className="w-5 h-5" /> },
    { key: "pelanggan", label: "Pelanggan", icon: <Users className="w-5 h-5" /> },
    { key: "audit", label: "Audit Log", icon: <ScrollText className="w-5 h-5" /> },
    { key: "settings", label: "Pengaturan", icon: <Settings className="w-5 h-5" /> },
  ];

  /* ═══════════════════════════════════════════════════════ */
  /* RENDER                                                 */
  /* ═══════════════════════════════════════════════════════ */

  return (
    <div className="flex-1 flex flex-col pt-2 pb-4 space-y-3">

      {/* ─── Header ─── */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-[#008CEB] to-[#00C9A7] bg-clip-text text-transparent">
            Global
          </h1>
          <p className="text-[10px] text-slate-400">Kelola seluruh unit usaha</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="p-2 bg-white dark:bg-[#131527] rounded-full shadow-md">
            {theme === "dark" ? <span className="text-sm text-amber-400"><Sun className="w-5 h-5" /></span> : <span className="text-sm text-slate-600"><Moon className="w-5 h-5" /></span>}
          </button>
          <div className="text-right">
            <span className="text-[10px] text-slate-400">Admin</span>
            <p className="text-xs font-extrabold">{currentUser}</p>
          </div>
        </div>
      </div>

      {/* ─── Tab Bar ─── */}
      <div className="flex gap-1 overflow-x-auto px-1 pb-1 -mx-1 scrollbar-hide">
        {tabs.map((t) => {
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all ${
                activeTab === t.key
                  ? "bg-gradient-to-r from-[#008CEB] to-[#00C9A7] text-white shadow-md"
                  : "bg-white dark:bg-[#131527] text-slate-400"
              }`}
            >
              <span className="text-sm">{t.icon}</span>
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* TAB: DASHBOARD RINGKASAN                               */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === "dashboard" && (
        <div className="space-y-3 animate-fade-in">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-2">
            <div className="premium-card p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <span className="text-sm text-emerald-500"><DollarSign className="w-5 h-5" /></span>
                </div>
                <span className="text-[9px] text-slate-400 font-bold uppercase">Pendapatan</span>
              </div>
              <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">Rp{dashData.totalPendapatan.toLocaleString()}</p>
            </div>
            <div className="premium-card p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${dashData.labaBersih >= 0 ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-rose-100 dark:bg-rose-900/30"}`}>
                  {dashData.labaBersih >= 0 ? <span className="text-sm text-emerald-500"><TrendingUp className="w-5 h-5" /></span> : <span className="text-sm text-rose-500"><TrendingDown className="w-5 h-5" /></span>}
                </div>
                <span className="text-[9px] text-slate-400 font-bold uppercase">Laba Bersih</span>
              </div>
              <p className={`text-sm font-extrabold ${dashData.labaBersih >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                Rp{dashData.labaBersih.toLocaleString()}
              </p>
            </div>
            <div className="premium-card p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <span className="text-sm text-amber-500"><CreditCard className="w-5 h-5" /></span>
                </div>
                <span className="text-[9px] text-slate-400 font-bold uppercase">Piutang</span>
              </div>
              <p className="text-sm font-extrabold text-amber-600 dark:text-amber-400">Rp{dashData.totalPiutang.toLocaleString()}</p>
              <p className="text-[9px] text-slate-400">{dashData.piutangAktifCount} aktif</p>
            </div>
            <div className="premium-card p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-6 h-6 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                  <span className="text-sm text-rose-500"><AlertTriangle className="w-5 h-5" /></span>
                </div>
                <span className="text-[9px] text-slate-400 font-bold uppercase">Stok Alert</span>
              </div>
              <p className="text-sm font-extrabold text-rose-600 dark:text-rose-400">{dashData.stokMenipisCount + dashData.stokHabisCount}</p>
              <p className="text-[9px] text-slate-400">{dashData.stokMenipisCount} tipis, {dashData.stokHabisCount} habis</p>
            </div>
          </div>

          {/* Cashflow Summary */}
          <div className="premium-card p-3">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Cashflow Global</h3>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-1 mb-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[9px] text-slate-400">Masuk</span>
                </div>
                <p className="text-xs font-extrabold text-emerald-500">Rp{dashData.cashflowMasuk.toLocaleString()}</p>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1 mb-1">
                  <div className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-[9px] text-slate-400">Keluar</span>
                </div>
                <p className="text-xs font-extrabold text-rose-500">Rp{dashData.cashflowKeluar.toLocaleString()}</p>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1 mb-1">
                  <div className="w-2 h-2 rounded-full bg-[#008CEB]" />
                  <span className="text-[9px] text-slate-400">Saldo</span>
                </div>
                <p className={`text-xs font-extrabold ${dashData.cashflowMasuk - dashData.cashflowKeluar >= 0 ? "text-[#008CEB]" : "text-rose-500"}`}>
                  Rp{(dashData.cashflowMasuk - dashData.cashflowKeluar).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="premium-card p-3">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Total</h3>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-sm font-extrabold text-[#008CEB]">{dashData.totalTransaksi}</p>
                <span className="text-[8px] text-slate-400">Transaksi</span>
              </div>
              <div>
                <p className="text-sm font-extrabold text-emerald-500">{dashData.totalPelanggan}</p>
                <span className="text-[8px] text-slate-400">Pelanggan</span>
              </div>
              <div>
                <p className="text-sm font-extrabold text-amber-500">{dashData.totalProduk}</p>
                <span className="text-[8px] text-slate-400">Produk</span>
              </div>
              <div>
                <p className="text-sm font-extrabold text-orange-500">{dashData.totalCabang}</p>
                <span className="text-[8px] text-slate-400">Cabang</span>
              </div>
            </div>
          </div>

          {/* Per-Branch Breakdown */}
          <div className="premium-card p-3 space-y-2">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase">Per Cabang</h3>
            <div className="space-y-2">
              {dashData.perBranch.map((b) => (
                <div key={b.branch} className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-900/50 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold">{b.label}</span>
                    <span className="text-[9px] font-bold text-[#008CEB]">Rp{b.pendapatan.toLocaleString()}</span>
                  </div>
                  <div className="flex gap-3 text-[9px]">
                    <span className="text-emerald-500">+Rp{b.cashMasuk.toLocaleString()}</span>
                    <span className="text-rose-500">-Rp{b.cashKeluar.toLocaleString()}</span>
                    {b.piutang > 0 && <span className="text-amber-500">Piutang: Rp{b.piutang.toLocaleString()}</span>}
                  </div>
                  <div className="flex gap-3 text-[9px] text-slate-400">
                    <span>{b.jumlahTransaksi} tx</span>
                    <span>{b.jumlahProduk} produk</span>
                    {b.stokMenipis > 0 && <span className="text-amber-500">{b.stokMenipis} stok tipis</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* TAB: PIUTANG                                           */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === "piutang" && (
        <div className="space-y-3 animate-fade-in">
          {/* Filters */}
          <div className="space-y-2">
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-sm text-slate-400"><Search className="w-4 h-4" /></span>
              <input type="text" placeholder="Cari nama pelanggan..." value={piutangSearch} onChange={(e) => setPiutangSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-[#131527] rounded-xl border-none outline-none focus:ring-1 focus:ring-[#008CEB]" />
            </div>
            <div className="flex gap-1 overflow-x-auto pb-1">
              <button onClick={() => setPiutangBranchFilter("semua")}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap ${piutangBranchFilter === "semua" ? "bg-[#008CEB] text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-400"}`}>
                Semua
              </button>
              {BRANCH_LIST.map((b) => (
                <button key={b} onClick={() => setPiutangBranchFilter(b)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap ${piutangBranchFilter === b ? "bg-[#008CEB] text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-400"}`}>
                  {BOOK_LABELS[b]}
                </button>
              ))}
            </div>
          </div>

          {/* Piutang List */}
          <div className="space-y-2">
            {filteredPiutang.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">Tidak ada data piutang.</div>
            ) : (
              filteredPiutang.map((p) => (
                <div key={p.id} className={`premium-card p-3 space-y-2 ${selectedPiutang === p.id ? "border-[#008CEB]/40" : ""}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-extrabold">{p.customerNama}</h4>
                      <p className="text-[9px] text-slate-400">{BOOK_LABELS[p.bookOrBranchId]}</p>
                      <p className="text-[9px] text-slate-400">Jatuh tempo: {new Date(p.jatuhTempo).toLocaleDateString("id-ID")}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${p.status === "LUNAS" ? "bg-emerald-100 text-emerald-600" : p.status === "DIHAPUS" ? "bg-slate-100 text-slate-400" : "bg-amber-100 text-amber-600"}`}>
                        {p.status}
                      </span>
                      <p className="text-sm font-extrabold text-amber-500 mt-1">Rp{p.sisaPiutang.toLocaleString()}</p>
                      <p className="text-[9px] text-slate-400">dari Rp{p.totalPiutang.toLocaleString()}</p>
                    </div>
                  </div>

                  {p.status === "AKTIF" && (
                    <div className="flex gap-2">
                      <button onClick={() => setSelectedPiutang(selectedPiutang === p.id ? null : p.id)}
                        className="flex-1 py-1.5 bg-[#008CEB] text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-1">
                        <span className="text-sm"><CreditCard className="w-5 h-5" /></span> Bayar
                      </button>
                      <a href={`https://api.whatsapp.com/send?phone=${p.customerWA.replace(/[^0-9]/g, "")}&text=${encodeURIComponent(`Halo ${p.customerNama}, Anda memiliki piutang sebesar Rp${p.sisaPiutang.toLocaleString()}. Mohon segera dilunasi. Terima kasih.`)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="py-1.5 px-3 bg-emerald-500 text-white rounded-xl text-[10px] font-bold flex items-center gap-1">
                        WA
                      </a>
                    </div>
                  )}

                  {selectedPiutang === p.id && (
                    <div className="p-2 bg-slate-50 dark:bg-zinc-900/50 rounded-xl space-y-2">
                      <input type="number" placeholder="Jumlah bayar" value={bayarPiutangAmount || ""}
                        onChange={(e) => setBayarPiutangAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-zinc-800 focus:outline-none font-bold" />
                      <button onClick={() => handleBayarPiutang(p.id)}
                        className="w-full py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold active:scale-[0.98]">
                        Konfirmasi Bayar Rp{bayarPiutangAmount.toLocaleString()}
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* TAB: PELANGGAN                                         */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === "pelanggan" && (
        <div className="space-y-3 animate-fade-in">
          {/* Filters */}
          <div className="space-y-2">
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-sm text-slate-400"><Search className="w-4 h-4" /></span>
              <input type="text" placeholder="Cari nama atau nomor HP..." value={pelangganSearch} onChange={(e) => setPelangganSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-[#131527] rounded-xl border-none outline-none focus:ring-1 focus:ring-[#008CEB]" />
            </div>
            <div className="flex gap-1 overflow-x-auto pb-1">
              <button onClick={() => setPelangganBranch("semua")}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap ${pelangganBranch === "semua" ? "bg-[#008CEB] text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-400"}`}>
                Semua
              </button>
              {BRANCH_LIST.map((b) => (
                <button key={b} onClick={() => setPelangganBranch(b)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap ${pelangganBranch === b ? "bg-[#008CEB] text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-400"}`}>
                  {BOOK_LABELS[b]}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="premium-card p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#008CEB]"><Users className="w-5 h-5" /></span>
              <span className="text-xs font-bold">{filteredPelanggan.length} Pelanggan</span>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-slate-400">Total Belanja</span>
              <p className="text-xs font-extrabold text-[#008CEB]">
                Rp{filteredPelanggan.reduce((s, c) => s + c.totalBelanja, 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Customer List */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {filteredPelanggan.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">Tidak ada data pelanggan.</div>
            ) : (
              filteredPelanggan.map((c) => (
                <div key={c.id} className="premium-card p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-extrabold">{c.nama}</h4>
                      <p className="text-[9px] text-slate-400 flex items-center gap-1">
                        <span>{c.noWA}</span> · <span>{BOOK_LABELS[c.bookOrBranchId]}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-extrabold text-[#00C9A7]">Rp{c.totalBelanja.toLocaleString()}</p>
                      <p className="text-[9px] text-slate-400">{c.totalTransaksi} tx · {c.poin} poin</p>
                    </div>
                  </div>
                  {c.noWA && (
                    <a href={`https://api.whatsapp.com/send?phone=${c.noWA.replace(/[^0-9]/g, "")}`}
                      target="_blank" rel="noopener noreferrer"
                      className="mt-2 block w-full py-1.5 bg-emerald-500 text-white rounded-xl text-[10px] font-bold text-center">
                      Hubungi WA
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* TAB: AUDIT LOG                                         */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === "audit" && (
        <div className="space-y-3 animate-fade-in">
          {/* Filters */}
          <div className="space-y-2">
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-sm text-slate-400"><Search className="w-4 h-4" /></span>
              <input type="text" placeholder="Cari user atau aksi..." value={auditSearch} onChange={(e) => setAuditSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-[#131527] rounded-xl border-none outline-none focus:ring-1 focus:ring-[#008CEB]" />
            </div>
            <div className="flex gap-1 overflow-x-auto pb-1">
              <button onClick={() => setAuditBranch("semua")}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap ${auditBranch === "semua" ? "bg-[#008CEB] text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-400"}`}>
                Semua Cabang
              </button>
              {BRANCH_LIST.map((b) => (
                <button key={b} onClick={() => setAuditBranch(b)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap ${auditBranch === b ? "bg-[#008CEB] text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-400"}`}>
                  {BOOK_LABELS[b]}
                </button>
              ))}
            </div>
            <div className="flex gap-1 overflow-x-auto pb-1">
              {["semua", "CREATE", "UPDATE", "DELETE", "BATAL", "TRANSFER_KELUAR", "TRANSFER_MASUK"].map((t) => (
                <button key={t} onClick={() => setAuditType(t)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap ${auditType === t ? "bg-[#00C9A7] text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-400"}`}>
                  {t === "semua" ? "Semua" : t.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Audit Log List */}
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
            {filteredAudit.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">Tidak ada log aktivitas.</div>
            ) : (
              filteredAudit.map((log) => {
                const actionColors: Record<string, string> = {
                  CREATE: "bg-emerald-100 text-emerald-600",
                  UPDATE: "bg-blue-100 text-blue-600",
                  DELETE: "bg-rose-100 text-rose-600",
                  BATAL: "bg-amber-100 text-amber-600",
                  TRANSFER_KELUAR: "bg-orange-100 text-orange-600",
                  TRANSFER_MASUK: "bg-purple-100 text-purple-600",
                };
                return (
                  <div key={log.id} className="p-2 rounded-xl bg-white dark:bg-[#131527] flex items-start gap-2">
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold shrink-0 mt-0.5 ${actionColors[log.action] || "bg-slate-100 text-slate-400"}`}>
                      {log.action}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold truncate">{log.alasan || log.entityType}</p>
                      <p className="text-[9px] text-slate-400">
                        {log.userName || "System"} · {BOOK_LABELS[log.bookOrBranchId]}
                        {log.nominal > 0 && <> · Rp{log.nominal.toLocaleString()}</>}
                      </p>
                      <p className="text-[8px] text-slate-300">{new Date(log.createdAt).toLocaleString("id-ID")}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* TAB: PENGATURAN                                        */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === "settings" && (
        <div className="space-y-3 animate-fade-in">

          {/* Dark Mode Toggle */}
          <button onClick={toggleTheme}
            className="premium-card p-3 flex items-center gap-3 w-full active:scale-[0.98]">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md">
              {theme === "dark" ? <span className="text-sm"><Sun className="w-5 h-5" /></span> : <span className="text-sm"><Moon className="w-5 h-5" /></span>}
            </div>
            <div className="flex-1 text-left">
              <span className="text-xs font-bold">Dark Mode</span>
              <p className="text-[10px] text-slate-400">{theme === "dark" ? "Mode gelap aktif" : "Mode terang aktif"}</p>
            </div>
            <div className={`w-10 h-6 rounded-full transition-all ${theme === "dark" ? "bg-[#008CEB]" : "bg-slate-200"}`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow-md mt-0.5 transition-all ${theme === "dark" ? "ml-5" : "ml-0.5"}`} />
            </div>
          </button>

          {/* Backup & Restore */}
          <div className="premium-card p-3 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-md">
                <span className="text-sm"><Database className="w-5 h-5" /></span>
              </div>
              <div>
                <span className="text-xs font-bold">Backup & Restore</span>
                <p className="text-[10px] text-slate-400">AES-256-GCM encrypted</p>
              </div>
            </div>
            <input type="password" value={backupPassword} onChange={(e) => setBackupPassword(e.target.value)}
              placeholder="Password backup (min. 4 karakter)"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none" />
            <div className="flex gap-2">
              <button onClick={handleBackup} disabled={isProcessing}
                className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white font-bold text-xs active:scale-[0.98] flex items-center justify-center gap-1.5">
                <span className="text-sm"><Download className="w-5 h-5" /></span>
                {isProcessing ? "..." : "Backup"}
              </button>
              <button onClick={() => fileInputRef.current?.click()} disabled={isProcessing}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-xs active:scale-[0.98] flex items-center justify-center gap-1.5">
                <span className="text-sm"><Upload className="w-5 h-5" /></span> Restore
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept=".enc" className="hidden" onChange={handleRestore} />
          </div>

          {/* Transfer Antar Cabang */}
          <div className="premium-card p-3 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-md">
                <span className="text-sm"><ArrowRightLeft className="w-5 h-5" /></span>
              </div>
              <div>
                <span className="text-xs font-bold">Transfer Antar Cabang</span>
                <p className="text-[10px] text-slate-400">Double-entry system</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Dari</label>
                <select value={transferFrom} onChange={(e) => setTransferFrom(e.target.value as BookOrBranch)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none">
                  {BRANCH_LIST.map((b) => <option key={b} value={b}>{BOOK_LABELS[b]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Ke</label>
                <select value={transferTo} onChange={(e) => setTransferTo(e.target.value as BookOrBranch)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none">
                  {BRANCH_LIST.map((b) => <option key={b} value={b}>{BOOK_LABELS[b]}</option>)}
                </select>
              </div>
            </div>
            <input type="number" placeholder="Jumlah (Rp)" value={transferAmount || ""}
              onChange={(e) => setTransferAmount(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none font-bold" />
            <input type="text" placeholder="Deskripsi" value={transferDesc}
              onChange={(e) => setTransferDesc(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none" />
            <button onClick={handleTransfer} disabled={isProcessing}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#008CEB] to-[#00C9A7] text-white font-bold text-xs active:scale-[0.98]">
              {isProcessing ? "..." : "Transfer Sekarang"}
            </button>
          </div>

          {/* Template Cepat */}
          <div className="premium-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white shadow-md">
                  <span className="text-sm"><Zap className="w-5 h-5" /></span>
                </div>
                <div>
                  <span className="text-xs font-bold">Template Cepat</span>
                  <p className="text-[10px] text-slate-400">{allQuickOrders.length} template tersimpan</p>
                </div>
              </div>
              <button onClick={() => setShowQuickOrderModal(true)}
                className="p-2 bg-[#008CEB] text-white rounded-full shadow-md">
                <span className="text-sm"><Plus className="w-5 h-5" /></span>
              </button>
            </div>
            {allQuickOrders.length > 0 && (
              <div className="space-y-1.5 max-h-[150px] overflow-y-auto">
                {allQuickOrders.map((qo) => (
                  <div key={qo.id} className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-900/50 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold">{qo.label}</p>
                      <p className="text-[9px] text-slate-400">
                        {qo.items.length} item · Rp{qo.items.reduce((s, i) => s + i.price, 0).toLocaleString()}
                      </p>
                    </div>
                    <button onClick={() => handleDeleteQuickOrder(qo.id)} className="p-1 text-rose-400">
                      <span className="text-sm"><Trash2 className="w-5 h-5" /></span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Export Data */}
          <div className="premium-card p-3 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md">
                <span className="text-sm"><BarChart3 className="w-5 h-5" /></span>
              </div>
              <div>
                <span className="text-xs font-bold">Export Data</span>
                <p className="text-[10px] text-slate-400">Format Excel</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleExportTransactions}
                className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white font-bold text-xs active:scale-[0.98]">
                Transaksi
              </button>
              <button onClick={handleExportCashflow}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-xs active:scale-[0.98]">
                Cashflow
              </button>
            </div>
          </div>

          {/* Logout */}
          <button onClick={handleLogout}
            className="premium-card p-3 flex items-center gap-3 text-rose-500 active:scale-[0.98] w-full">
            <span className="text-sm"><LogOut className="w-5 h-5" /></span>
            <span className="text-xs font-bold">Keluar dari Akun</span>
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* MODAL: Quick Order                                     */}
      {/* ═══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showQuickOrderModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-end justify-center">
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="w-full max-w-md bg-white dark:bg-[#131527] rounded-t-[32px] p-5 pb-8 space-y-3 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold">Template Cepat Baru</h3>
                <button onClick={() => setShowQuickOrderModal(false)} className="p-1 rounded-full bg-slate-100 dark:bg-zinc-800">
                  <span className="text-sm"><X className="w-4 h-4" /></span>
                </button>
              </div>
              <input type="text" placeholder="Label template" value={quickOrderLabel}
                onChange={(e) => setQuickOrderLabel(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none" />
              <select value={quickOrderBranch} onChange={(e) => setQuickOrderBranch(e.target.value as BookOrBranch)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none">
                {BRANCH_LIST.map((b) => <option key={b} value={b}>{BOOK_LABELS[b]}</option>)}
              </select>
              <div className="flex gap-2">
                <input type="text" placeholder="Item deskripsi" value={qoItemDesc}
                  onChange={(e) => setQoItemDesc(e.target.value)} className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none" />
                <input type="number" placeholder="Harga" value={qoItemPrice || ""}
                  onChange={(e) => setQoItemPrice(Number(e.target.value))} className="w-24 px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none" />
                <button onClick={handleAddQuickOrder} className="p-2 bg-[#008CEB] text-white rounded-xl">
                  <span className="text-sm"><Plus className="w-5 h-5" /></span>
                </button>
              </div>
              {quickOrderItems.length > 0 && (
                <div className="space-y-1 max-h-[120px] overflow-y-auto">
                  {quickOrderItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-zinc-900/50 rounded-xl text-xs">
                      <span>{item.desc}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">Rp{item.price.toLocaleString()}</span>
                        <button onClick={() => setQuickOrderItems((prev) => prev.filter((_, i) => i !== idx))} className="text-rose-400">
                          <span className="text-sm"><Trash2 className="w-5 h-5" /></span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={handleSaveQuickOrder}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#008CEB] to-[#00C9A7] text-white font-extrabold text-xs shadow-lg active:scale-[0.98]">
                Simpan Template
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
