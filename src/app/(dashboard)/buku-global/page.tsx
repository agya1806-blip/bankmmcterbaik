"use client";

import React, { useState, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/store/useSessionStore";
import { useThemeStore } from "@/store/useThemeStore";
import { createBackup, restoreBackup, downloadBlob } from "@/lib/backup";
import { executeTransfer } from "@/engine/double-entry";
import { exportTransactionsExcel, exportCashflowExcel } from "@/lib/export-utils";
import { db, type UnitId, BOOK_LABELS } from "@/lib/db-v4";
import { useLiveQuery } from "dexie-react-hooks";
import { Sun, Moon, TrendingUp, CreditCard, Users, Wallet, ScrollText, Settings, UserCircle } from "lucide-react";
import { showToast } from "@/lib/toast";

import GlobalKpiCards from "@/components/business/global-kpi-cards";
import GlobalPiutangTab from "@/components/business/global-piutang-tab";
import GlobalPelangganTab from "@/components/business/global-pelanggan-tab";
import GlobalAuditTab from "@/components/business/global-audit-tab";
import GlobalSettingsTab from "@/components/business/global-settings-tab";
import GlobalDompetTab from "@/components/business/global-dompet-tab";
import GlobalProfilTab from "@/components/business/global-profil-tab";

type TabKey = "dashboard" | "piutang" | "pelanggan" | "audit" | "settings" | "dompet" | "profil";

export default function BukuGlobalPage() {
  const router = useRouter();
  const { currentUser, logout } = useSessionStore();
  const { theme, toggleTheme } = useThemeStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [isProcessing, setIsProcessing] = useState(false);
  const [backupPassword, setBackupPassword] = useState("");

  const [transferFrom, setTransferFrom] = useState<UnitId>("usaha-warkop");
  const [transferTo, setTransferTo] = useState<UnitId>("usaha-percetakan");
  const [transferAmount, setTransferAmount] = useState(0);
  const [transferDesc, setTransferDesc] = useState("");

  const [piutangSearch, setPiutangSearch] = useState("");
  const [piutangBranchFilter, setPiutangBranchFilter] = useState<UnitId | "semua">("semua");
  const [selectedPiutang, setSelectedPiutang] = useState<string | null>(null);
  const [bayarPiutangAmount, setBayarPiutangAmount] = useState(0);

  const [pelangganSearch, setPelangganSearch] = useState("");
  const [pelangganBranch, setPelangganBranch] = useState<UnitId | "semua">("semua");

  const [auditSearch, setAuditSearch] = useState("");
  const [auditBranch, setAuditBranch] = useState<UnitId | "semua">("semua");
  const [auditType, setAuditType] = useState<string>("semua");

  const [showQuickOrderModal, setShowQuickOrderModal] = useState(false);
  const [quickOrderLabel, setQuickOrderLabel] = useState("");
  const [quickOrderItems, setQuickOrderItems] = useState<{ desc: string; price: number }[]>([]);
  const [quickOrderBranch, setQuickOrderBranch] = useState<UnitId>("usaha-warkop");
  const [qoItemDesc, setQoItemDesc] = useState("");
  const [qoItemPrice, setQoItemPrice] = useState(0);

  const [walletName, setWalletName] = useState("");
  const [walletTipe, setWalletTipe] = useState<"KasTunai" | "Bank" | "EWallet">("Bank");
  const [walletSaldo, setWalletSaldo] = useState(0);
  const [walletCatatan, setWalletCatatan] = useState("");
  const [walletUnit, setWalletUnit] = useState<UnitId>("usaha-warkop");
  const [editingWallet, setEditingWallet] = useState<string | null>(null);

  const [profileNama, setProfileNama] = useState("");
  const [profileNoHP, setProfileNoHP] = useState("");
  const [profileAlamat, setProfileAlamat] = useState("");

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetScope, setResetScope] = useState<"all" | UnitId>("all");
  const [resetTypes, setResetTypes] = useState<Record<string, boolean>>({
    transactions: false, cashflows: false, piutang: false, inventory: false,
    customers: false, wallets: false, auditLogs: false, quickOrders: false,
  });

  const allTransactions = useLiveQuery(() => db.transactions.toArray()) || [];
  const allCashflows = useLiveQuery(() => db.cashflows.toArray()) || [];
  const allPiutang = useLiveQuery(() => db.piutang.toArray()) || [];
  const allCustomers = useLiveQuery(() => db.customers.toArray()) || [];
  const allInventory = useLiveQuery(() => db.inventory.toArray()) || [];
  const allAuditLogs = useLiveQuery(() => db.auditLogs.orderBy("createdAt").reverse().toArray()) || [];
  const allQuickOrders = useLiveQuery(() => db.quickOrders.toArray()) || [];
  const allWallets = useLiveQuery(() => db.wallets.toArray()) || [];

  const EXCLUDE_CF_KATEGORI = useMemo(() => new Set(["HPP", "Retur/Batal", "Transfer_Keluar", "Transfer_Masuk"]), []);
  const BRANCH_LIST: UnitId[] = ["usaha-warkop", "usaha-percetakan"];

  const dashData = useMemo(() => {
    let totalPendapatan = 0, totalHpp = 0, transaksiLunas = 0, transaksiPiutang = 0;
    allTransactions.forEach((tx) => {
      if (tx.status === "BATAL") return;
      const pendapatanBersih = tx.grandTotal - (tx.sedekahNominal || 0);
      if (tx.status === "LUNAS") { totalPendapatan += pendapatanBersih; transaksiLunas++; }
      else if (tx.status === "DP") { totalPendapatan += tx.dpDibayar; transaksiPiutang++; }
      tx.items.forEach((item) => { totalHpp += (item.hargaModal || 0) * item.qty; });
    });
    const cashflowMasuk = allCashflows.filter((c) => c.tipe === "masuk").reduce((s, c) => s + c.nominal, 0);
    const cashflowKeluar = allCashflows.filter((c) => c.tipe === "keluar" && !EXCLUDE_CF_KATEGORI.has(c.kategori)).reduce((s, c) => s + c.nominal, 0);
    const piutangAktif = allPiutang.filter((p) => p.status === "AKTIF");
    const totalPiutang = piutangAktif.reduce((s, p) => s + p.sisaPiutang, 0);
    const stokMenipis = allInventory.filter((i) => i.stok <= i.stokMin && i.stok > 0);
    const stokHabis = allInventory.filter((i) => i.stok === 0);
    const labaBersih = (totalPendapatan - totalHpp) - cashflowKeluar;
    const perBranch = BRANCH_LIST.map((branch) => {
      const txBranch = allTransactions.filter((t) => t.unitId === branch && t.status !== "BATAL");
      const cfBranch = allCashflows.filter((c) => c.unitId === branch);
      const piutangBranch = allPiutang.filter((p) => p.unitId === branch && p.status === "AKTIF");
      const invBranch = allInventory.filter((i) => i.unitId === branch);
      return {
        branch, label: BOOK_LABELS[branch] || branch,
        pendapatan: txBranch.reduce((s, t) => s + (t.grandTotal - (t.sedekahNominal || 0)), 0),
        labaBersih: 0,
        cashMasuk: cfBranch.filter((c) => c.tipe === "masuk").reduce((s, c) => s + c.nominal, 0),
        cashKeluar: cfBranch.filter((c) => c.tipe === "keluar").reduce((s, c) => s + c.nominal, 0),
        piutang: piutangBranch.reduce((s, p) => s + p.sisaPiutang, 0),
        jumlahProduk: invBranch.length,
        stokMenipis: invBranch.filter((i) => i.stok <= i.stokMin && i.stok > 0).length,
        jumlahTransaksi: txBranch.length,
      };
    });
    return {
      totalPendapatan, totalHpp, labaKotor: totalPendapatan - totalHpp, labaBersih,
      cashflowMasuk, cashflowKeluar, totalPiutang, piutangAktifCount: piutangAktif.length,
      stokMenipisCount: stokMenipis.length, stokHabisCount: stokHabis.length,
      transaksiLunas, transaksiPiutang,
      totalTransaksi: allTransactions.filter((t) => t.status !== "BATAL").length,
      totalPelanggan: allCustomers.length, totalProduk: allInventory.length,
      totalCabang: BRANCH_LIST.length, perBranch,
    };
  }, [allTransactions, allCashflows, allPiutang, allCustomers, allInventory, EXCLUDE_CF_KATEGORI, BRANCH_LIST]);

  const last7Days = useMemo(() => {
    const days: { date: string; pemasukan: number; pengeluaran: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayLabel = d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric" });
      days.push({
        date: dayLabel,
        pemasukan: allCashflows.filter((cf) => cf.tipe === "masuk" && cf.createdAt.startsWith(dateStr)).reduce((s, cf) => s + cf.nominal, 0),
        pengeluaran: allCashflows.filter((cf) => cf.tipe === "keluar" && cf.createdAt.startsWith(dateStr)).reduce((s, cf) => s + cf.nominal, 0),
      });
    }
    return days;
  }, [allCashflows]);

  const branchRevenue = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of allTransactions) {
      if (tx.status === "BATAL") continue;
      map.set(BOOK_LABELS[tx.unitId] || tx.unitId, (map.get(BOOK_LABELS[tx.unitId] || tx.unitId) || 0) + (tx.grandTotal - (tx.sedekahNominal || 0)));
    }
    return Array.from(map.entries()).map(([name, revenue]) => ({ name, revenue }));
  }, [allTransactions]);

  const filteredPiutang = useMemo(() => allPiutang.filter((p) => {
    if (piutangBranchFilter !== "semua" && p.bookOrBranchId !== piutangBranchFilter) return false;
    return p.customerNama.toLowerCase().includes(piutangSearch.toLowerCase());
  }).sort((a, b) => b.sisaPiutang - a.sisaPiutang), [allPiutang, piutangBranchFilter, piutangSearch]);

  const filteredPelanggan = useMemo(() => allCustomers.filter((c) => {
    if (pelangganBranch !== "semua" && c.bookOrBranchId !== pelangganBranch) return false;
    if (pelangganSearch && !c.nama.toLowerCase().includes(pelangganSearch.toLowerCase()) && !c.noWA.includes(pelangganSearch)) return false;
    return true;
  }).sort((a, b) => b.totalBelanja - a.totalBelanja), [allCustomers, pelangganBranch, pelangganSearch]);

  const filteredAudit = useMemo(() => allAuditLogs.filter((log) => {
    if (auditBranch !== "semua" && log.bookOrBranchId !== auditBranch) return false;
    if (auditType !== "semua" && log.action !== auditType) return false;
    if (auditSearch && !log.userName.toLowerCase().includes(auditSearch.toLowerCase()) && !log.alasan.toLowerCase().includes(auditSearch.toLowerCase())) return false;
    return true;
  }).slice(0, 100), [allAuditLogs, auditBranch, auditType, auditSearch]);

  const handleBackup = useCallback(async () => {
    if (!backupPassword || backupPassword.length < 4) return showToast.error("Password minimal 4 karakter!");
    setIsProcessing(true);
    try { const blob = await createBackup(backupPassword); downloadBlob(blob, `mmcbank-backup-${Date.now()}.enc`); showToast.success("Backup berhasil diunduh!"); }
    catch (err: unknown) { showToast.error(`Backup gagal: ${err instanceof Error ? err.message : "Unknown error"}`); }
    finally { setIsProcessing(false); }
  }, [backupPassword]);

  const handleRestore = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const password = prompt("Masukkan password backup:");
    if (!password) return;
    setIsProcessing(true);
    try {
      const result = await restoreBackup(file, password);
      if (result.ok) { showToast.success("Restore berhasil! Memuat ulang..."); window.location.reload(); }
      else showToast.error(`Restore gagal: ${result.error}`);
    } catch (err: unknown) { showToast.error(`Restore gagal: ${err instanceof Error ? err.message : "Unknown error"}`); }
    finally { setIsProcessing(false); }
  }, []);

  const handleTransfer = useCallback(async () => {
    if (transferAmount <= 0) return showToast.error("Jumlah harus lebih dari 0!");
    if (!transferDesc.trim()) return showToast.error("Deskripsi wajib diisi!");
    if (transferFrom === transferTo) return showToast.error("Cabang asal dan tujuan harus berbeda!");
    setIsProcessing(true);
    try {
      const res = await executeTransfer({ fromBranch: transferFrom, toBranch: transferTo, amount: transferAmount, description: transferDesc.trim() });
      if (res.ok) { showToast.success("Transfer antar cabang berhasil!"); setTransferAmount(0); setTransferDesc(""); }
      else showToast.error(`Transfer gagal: ${res.error}`);
    } catch (err: unknown) { showToast.error(`Transfer gagal: ${err instanceof Error ? err.message : "Unknown error"}`); }
    finally { setIsProcessing(false); }
  }, [transferFrom, transferTo, transferAmount, transferDesc]);

  const handleBayarPiutang = useCallback(async (piutangId: string) => {
    if (bayarPiutangAmount <= 0) return showToast.error("Jumlah harus lebih dari 0!");
    const piutang = allPiutang.find((p) => p.id === piutangId);
    if (!piutang) return;
    if (bayarPiutangAmount > piutang.sisaPiutang) return showToast.error("Jumlah melebihi sisa piutang!");
    const newSisa = piutang.sisaPiutang - bayarPiutangAmount;
    await db.piutang.update(piutangId, { sisaPiutang: newSisa, status: newSisa <= 0 ? "LUNAS" : "AKTIF" });
    if (piutang.transactionId) {
      const tx = await db.transactions.get(piutang.transactionId);
      if (tx) {
        const newDp = tx.dpDibayar + bayarPiutangAmount;
        const newSisaTagihan = Math.max(0, tx.grandTotal - newDp);
        await db.transactions.update(tx.id, { dpDibayar: newDp, sisaTagihan: newSisaTagihan, status: newSisaTagihan <= 0 ? "LUNAS" : "DP" });
      }
    }
    await db.piutangInstallments.add({ id: crypto.randomUUID(), bookOrBranchId: piutang.bookOrBranchId, piutangId, jumlah: bayarPiutangAmount, metode: "tunai", tanggal: new Date().toISOString(), catatan: "Pembayaran dari Global" });
    showToast.success(`Pembayaran Rp${bayarPiutangAmount.toLocaleString()} berhasil!`);
    setBayarPiutangAmount(0); setSelectedPiutang(null);
  }, [bayarPiutangAmount, allPiutang]);

  const handleAddQuickOrder = useCallback(() => {
    if (!qoItemDesc || qoItemPrice <= 0) return;
    setQuickOrderItems((prev) => [...prev, { desc: qoItemDesc, price: qoItemPrice }]);
    setQoItemDesc(""); setQoItemPrice(0);
  }, [qoItemDesc, qoItemPrice]);

  const handleSaveQuickOrder = useCallback(async () => {
    if (!quickOrderLabel || quickOrderItems.length === 0) return showToast.error("Label dan item wajib diisi!");
    await db.quickOrders.add({ id: crypto.randomUUID(), bookOrBranchId: quickOrderBranch, label: quickOrderLabel, items: quickOrderItems, createdAt: new Date().toISOString() });
    showToast.success("Template Cepat disimpan!");
    setShowQuickOrderModal(false); setQuickOrderLabel(""); setQuickOrderItems([]);
  }, [quickOrderLabel, quickOrderItems, quickOrderBranch]);

  const handleDeleteQuickOrder = useCallback(async (id: string) => {
    if (!confirm("Hapus template ini?")) return;
    await db.quickOrders.delete(id);
  }, []);

  const handleExportTransactions = () => {
    if (allTransactions.length === 0) return showToast.error("Tidak ada data transaksi!");
    exportTransactionsExcel(allTransactions, "Semua-Cabang");
  };

  const handleExportCashflow = () => {
    if (allCashflows.length === 0) return showToast.error("Tidak ada data cashflow!");
    exportCashflowExcel(allCashflows, "Semua-Cabang");
  };

  const handleLogout = () => {
    if (!confirm("Yakin ingin logout?")) return;
    logout(); router.push("/login");
  };

  const handleSaveWallet = async () => {
    if (!walletName.trim()) return showToast.error("Nama dompet wajib diisi!");
    if (editingWallet) {
      await db.wallets.update(editingWallet, { namaDompet: walletName.trim(), tipe: walletTipe, saldo: walletSaldo, catatan: walletCatatan });
      setEditingWallet(null);
    } else {
      await db.wallets.add({ id: crypto.randomUUID(), bookOrBranchId: walletUnit, unitId: walletUnit, namaDompet: walletName.trim(), saldo: walletSaldo, tipe: walletTipe, catatan: walletCatatan, isActive: true, createdAt: new Date().toISOString() });
    }
    setWalletName(""); setWalletSaldo(0); setWalletCatatan(""); setWalletTipe("Bank");
    showToast.success(editingWallet ? "Dompet diperbarui!" : "Dompet ditambahkan!");
  };

  const handleEditWallet = (w: any) => {
    setEditingWallet(w.id); setWalletName(w.namaDompet); setWalletTipe(w.tipe); setWalletSaldo(w.saldo); setWalletCatatan(w.catatan);
  };

  const handleDeleteWallet = async (id: string) => {
    if (!confirm("Hapus dompet ini?")) return;
    await db.wallets.delete(id);
    if (editingWallet === id) { setEditingWallet(null); setWalletName(""); setWalletSaldo(0); setWalletCatatan(""); }
  };

  const handleSaveProfile = () => {
    localStorage.setItem("mmcbank_profile", JSON.stringify({ nama: profileNama, noHP: profileNoHP, alamat: profileAlamat }));
    showToast.success("Profil tersimpan!");
  };

  const handleLoadProfile = useCallback(() => {
    try {
      const saved = localStorage.getItem("mmcbank_profile");
      if (saved) { const p = JSON.parse(saved); setProfileNama(p.nama || ""); setProfileNoHP(p.noHP || ""); setProfileAlamat(p.alamat || ""); }
    } catch {}
  }, []);

  const toggleResetType = (key: string) => setResetTypes((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleResetData = async () => {
    const selectedTypes = Object.entries(resetTypes).filter(([, v]) => v);
    if (selectedTypes.length === 0) return showToast.error("Pilih minimal satu jenis data!");
    const scopeLabel = resetScope === "all" ? "SEMUA buku & cabang" : BOOK_LABELS[resetScope];
    if (!confirm(`Yakin reset ${selectedTypes.map(([k]) => k).join(", ")} pada ${scopeLabel}? Tindakan ini TIDAK bisa dibatalkan!`)) return;
    setIsProcessing(true);
    try {
      const tableMap: Record<string, keyof typeof db> = { transactions: "transactions", cashflows: "cashflows", piutang: "piutang", inventory: "inventory", customers: "customers", wallets: "wallets", auditLogs: "auditLogs", quickOrders: "quickOrders" };
      for (const [key] of selectedTypes) {
        const table = db[tableMap[key] as keyof typeof db] as any;
        if (!table) continue;
        if (resetScope === "all") await table.clear();
        else await table.where("bookOrBranchId").equals(resetScope).delete();
      }
      showToast.success(`Berhasil reset data pada ${scopeLabel}!`);
      setShowResetModal(false);
      setResetTypes({ transactions: false, cashflows: false, piutang: false, inventory: false, customers: false, wallets: false, auditLogs: false, quickOrders: false });
    } catch (err: unknown) { showToast.error(`Gagal reset: ${err instanceof Error ? err.message : "Unknown error"}`); }
    finally { setIsProcessing(false); }
  };

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "dashboard", label: "Ringkasan", icon: <TrendingUp className="w-5 h-5" /> },
    { key: "piutang", label: "Piutang", icon: <CreditCard className="w-5 h-5" /> },
    { key: "pelanggan", label: "Pelanggan", icon: <Users className="w-5 h-5" /> },
    { key: "dompet", label: "Dompet", icon: <Wallet className="w-5 h-5" /> },
    { key: "audit", label: "Audit Log", icon: <ScrollText className="w-5 h-5" /> },
    { key: "settings", label: "Pengaturan", icon: <Settings className="w-5 h-5" /> },
    { key: "profil", label: "Profil", icon: <UserCircle className="w-5 h-5" /> },
  ];

  return (
    <div className="flex-1 flex flex-col pt-2 pb-4 space-y-3">
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-[#008CEB] to-[#00C9A7] bg-clip-text text-transparent">Global</h1>
          <p className="text-[10px] text-slate-400">Kelola seluruh unit usaha</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="p-2 bg-white dark:bg-[#131527] rounded-full shadow-md">
            {theme === "dark" ? <span className="text-sm text-amber-400"><Sun className="w-5 h-5" /></span> : <span className="text-sm text-slate-600"><Moon className="w-5 h-5" /></span>}
          </button>
          <button onClick={() => router.push("/profile")} className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#008CEB] to-[#00C9A7] flex items-center justify-center text-white text-sm font-extrabold overflow-hidden shadow-md scale-press">
            {currentUser?.fotoUrl ? <img src={currentUser.fotoUrl} alt="Profil" className="w-full h-full object-cover" /> : currentUser?.nama?.charAt(0)?.toUpperCase() || "?"}
          </button>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto px-1 pb-1 -mx-1 scrollbar-hide">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all ${activeTab === t.key ? "bg-gradient-to-r from-[#008CEB] to-[#00C9A7] text-white shadow-md" : "bg-white dark:bg-[#131527] text-slate-400"}`}>
            <span className="text-sm">{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {activeTab === "dashboard" && <GlobalKpiCards dashData={dashData} last7Days={last7Days} branchRevenue={branchRevenue} />}
      {activeTab === "piutang" && <GlobalPiutangTab piutangSearch={piutangSearch} setPiutangSearch={setPiutangSearch} piutangBranchFilter={piutangBranchFilter} setPiutangBranchFilter={setPiutangBranchFilter} selectedPiutang={selectedPiutang} setSelectedPiutang={setSelectedPiutang} bayarPiutangAmount={bayarPiutangAmount} setBayarPiutangAmount={setBayarPiutangAmount} filteredPiutang={filteredPiutang} handleBayarPiutang={handleBayarPiutang} />}
      {activeTab === "pelanggan" && <GlobalPelangganTab pelangganSearch={pelangganSearch} setPelangganSearch={setPelangganSearch} pelangganBranch={pelangganBranch} setPelangganBranch={setPelangganBranch} filteredPelanggan={filteredPelanggan} />}
      {activeTab === "audit" && <GlobalAuditTab auditSearch={auditSearch} setAuditSearch={setAuditSearch} auditBranch={auditBranch} setAuditBranch={setAuditBranch} auditType={auditType} setAuditType={setAuditType} filteredAudit={filteredAudit} />}
      {activeTab === "settings" && <GlobalSettingsTab theme={theme} toggleTheme={toggleTheme} isProcessing={isProcessing} setIsProcessing={setIsProcessing} backupPassword={backupPassword} setBackupPassword={setBackupPassword} fileInputRef={fileInputRef} handleBackup={handleBackup} handleRestore={handleRestore} transferFrom={transferFrom} setTransferFrom={setTransferFrom} transferTo={transferTo} setTransferTo={setTransferTo} transferAmount={transferAmount} setTransferAmount={setTransferAmount} transferDesc={transferDesc} setTransferDesc={setTransferDesc} handleTransfer={handleTransfer} showQuickOrderModal={showQuickOrderModal} setShowQuickOrderModal={setShowQuickOrderModal} quickOrderLabel={quickOrderLabel} setQuickOrderLabel={setQuickOrderLabel} quickOrderItems={quickOrderItems} setQuickOrderItems={setQuickOrderItems} quickOrderBranch={quickOrderBranch} setQuickOrderBranch={setQuickOrderBranch} qoItemDesc={qoItemDesc} setQoItemDesc={setQoItemDesc} qoItemPrice={qoItemPrice} setQoItemPrice={setQoItemPrice} handleAddQuickOrder={handleAddQuickOrder} handleSaveQuickOrder={handleSaveQuickOrder} handleDeleteQuickOrder={handleDeleteQuickOrder} allQuickOrders={allQuickOrders} handleExportTransactions={handleExportTransactions} handleExportCashflow={handleExportCashflow} showResetModal={showResetModal} setShowResetModal={setShowResetModal} resetScope={resetScope} setResetScope={setResetScope} resetTypes={resetTypes} toggleResetType={toggleResetType} setResetTypes={setResetTypes} handleResetData={handleResetData} handleLogout={handleLogout} />}
      {activeTab === "dompet" && <GlobalDompetTab allWallets={allWallets} walletName={walletName} setWalletName={setWalletName} walletTipe={walletTipe} setWalletTipe={setWalletTipe} walletSaldo={walletSaldo} setWalletSaldo={setWalletSaldo} walletCatatan={walletCatatan} setWalletCatatan={setWalletCatatan} walletUnit={walletUnit} setWalletUnit={setWalletUnit} editingWallet={editingWallet} setEditingWallet={setEditingWallet} handleSaveWallet={handleSaveWallet} handleEditWallet={handleEditWallet} handleDeleteWallet={handleDeleteWallet} />}
      {activeTab === "profil" && <GlobalProfilTab currentUser={currentUser} allWallets={allWallets} profileNama={profileNama} setProfileNama={setProfileNama} profileNoHP={profileNoHP} setProfileNoHP={setProfileNoHP} profileAlamat={profileAlamat} setProfileAlamat={setProfileAlamat} handleSaveProfile={handleSaveProfile} handleLoadProfile={handleLoadProfile} />}
    </div>
  );
}
