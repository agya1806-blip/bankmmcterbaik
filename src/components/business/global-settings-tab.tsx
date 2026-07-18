"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sun, Moon, Database, Download, Upload, ArrowRightLeft, Zap, Plus, Trash2,
  BarChart3, RotateCcw, LogOut, X, AlertTriangle, Building, Landmark,
  Smartphone, Save, DollarSign, CreditCard, Search, Users, Wallet, ScrollText, Edit3,
} from "lucide-react";
import { BOOK_LABELS, POS_UNITS, ALL_UNITS, type UnitId } from "@/lib/db-v4";

const BRANCH_LIST: UnitId[] = POS_UNITS;

interface Props {
  theme: string;
  toggleTheme: () => void;
  isProcessing: boolean;
  setIsProcessing: (v: boolean) => void;
  backupPassword: string;
  setBackupPassword: (v: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleBackup: () => void;
  handleRestore: (e: React.ChangeEvent<HTMLInputElement>) => void;
  transferFrom: UnitId;
  setTransferFrom: (v: UnitId) => void;
  transferTo: UnitId;
  setTransferTo: (v: UnitId) => void;
  transferAmount: number;
  setTransferAmount: (v: number) => void;
  transferDesc: string;
  setTransferDesc: (v: string) => void;
  handleTransfer: () => void;
  showQuickOrderModal: boolean;
  setShowQuickOrderModal: (v: boolean) => void;
  quickOrderLabel: string;
  setQuickOrderLabel: (v: string) => void;
  quickOrderItems: { desc: string; price: number }[];
  setQuickOrderItems: (v: { desc: string; price: number }[] | ((prev: { desc: string; price: number }[]) => { desc: string; price: number }[])) => void;
  quickOrderBranch: UnitId;
  setQuickOrderBranch: (v: UnitId) => void;
  qoItemDesc: string;
  setQoItemDesc: (v: string) => void;
  qoItemPrice: number;
  setQoItemPrice: (v: number) => void;
  handleAddQuickOrder: () => void;
  handleSaveQuickOrder: () => void;
  handleDeleteQuickOrder: (id: string) => void;
  allQuickOrders: any[];
  handleExportTransactions: () => void;
  handleExportCashflow: () => void;
  showResetModal: boolean;
  setShowResetModal: (v: boolean) => void;
  resetScope: "all" | UnitId;
  setResetScope: (v: "all" | UnitId) => void;
  resetTypes: Record<string, boolean>;
  toggleResetType: (key: string) => void;
  setResetTypes: (v: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
  handleResetData: () => void;
  handleLogout: () => void;
}

export default function GlobalSettingsTab({
  theme, toggleTheme,
  isProcessing, setIsProcessing,
  backupPassword, setBackupPassword,
  fileInputRef, handleBackup, handleRestore,
  transferFrom, setTransferFrom, transferTo, setTransferTo,
  transferAmount, setTransferAmount, transferDesc, setTransferDesc,
  handleTransfer,
  showQuickOrderModal, setShowQuickOrderModal,
  quickOrderLabel, setQuickOrderLabel,
  quickOrderItems, setQuickOrderItems,
  quickOrderBranch, setQuickOrderBranch,
  qoItemDesc, setQoItemDesc,
  qoItemPrice, setQoItemPrice,
  handleAddQuickOrder, handleSaveQuickOrder, handleDeleteQuickOrder,
  allQuickOrders,
  handleExportTransactions, handleExportCashflow,
  showResetModal, setShowResetModal,
  resetScope, setResetScope,
  resetTypes,   toggleResetType, setResetTypes, handleResetData,
  handleLogout,
}: Props) {
  return (
    <>
      <div className="space-y-3 animate-fade-in">
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
              <select value={transferFrom} onChange={(e) => setTransferFrom(e.target.value as UnitId)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none">
                {BRANCH_LIST.map((b) => <option key={b} value={b}>{BOOK_LABELS[b]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">Ke</label>
              <select value={transferTo} onChange={(e) => setTransferTo(e.target.value as UnitId)}
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
              {allQuickOrders.map((qo: any) => (
                <div key={qo.id} className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-900/50 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold">{qo.label}</p>
                    <p className="text-[9px] text-slate-400">
                      {qo.items.length} item · Rp{qo.items.reduce((s: number, i: any) => s + i.price, 0).toLocaleString()}
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

        <div className="premium-card p-3 space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-white shadow-md">
              <span className="text-sm"><RotateCcw className="w-5 h-5" /></span>
            </div>
            <div>
              <span className="text-xs font-bold">Reset Data</span>
              <p className="text-[10px] text-slate-400">Pilih data & cabang yang ingin direset</p>
            </div>
          </div>
          <button onClick={() => setShowResetModal(true)}
            className="w-full py-2.5 rounded-xl bg-rose-500 text-white font-bold text-xs active:scale-[0.98] flex items-center justify-center gap-1.5">
            <span className="text-sm"><RotateCcw className="w-5 h-5" /></span> Reset Data
          </button>
        </div>

        <button onClick={handleLogout}
          className="premium-card p-3 flex items-center gap-3 text-rose-500 active:scale-[0.98] w-full">
          <span className="text-sm"><LogOut className="w-5 h-5" /></span>
          <span className="text-xs font-bold">Keluar dari Akun</span>
        </button>
      </div>

      {/* Quick Order Modal */}
      <AnimatePresence>
        {showQuickOrderModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-md bg-white dark:bg-[#131527] rounded-2xl p-5 pb-8 space-y-3 shadow-2xl max-h-[85vh] overflow-y-auto"
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
              <select value={quickOrderBranch} onChange={(e) => setQuickOrderBranch(e.target.value as UnitId)}
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
                  {quickOrderItems.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-zinc-900/50 rounded-xl text-xs">
                      <span>{item.desc}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">Rp{item.price.toLocaleString()}</span>
                        <button onClick={() => setQuickOrderItems((prev: any) => prev.filter((_: any, i: number) => i !== idx))} className="text-rose-400">
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

      {/* Reset Data Modal */}
      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-md bg-white dark:bg-[#131527] rounded-2xl p-5 pb-8 space-y-3 shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center">
                    <RotateCcw className="w-4 h-4 text-rose-500" />
                  </div>
                  <h3 className="text-sm font-extrabold">Reset Data</h3>
                </div>
                <button onClick={() => setShowResetModal(false)} className="p-1 rounded-full bg-slate-100 dark:bg-zinc-800">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="premium-card p-3 border-rose-300/40 dark:border-rose-700/40">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <span className="text-[10px] font-bold text-rose-500">PERINGATAN</span>
                </div>
                <p className="text-[10px] text-slate-400">Data yang direset tidak dapat dikembalikan. Pastikan sudah melakukan backup sebelum reset.</p>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase mb-1.5 block">Cakupan Reset</label>
                <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
                  <button onClick={() => setResetScope("all")}
                    className={`w-full p-2.5 rounded-xl text-[10px] font-bold text-left flex items-center gap-2 transition-all ${resetScope === "all" ? "bg-rose-500 text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-400"}`}>
                    <Database className="w-4 h-4" />
                    SEMUA Buku & Cabang
                  </button>
                  {(["pribadi", "keluarga", ...ALL_UNITS] as UnitId[]).map((b) => (
                    <button key={b} onClick={() => setResetScope(b)}
                      className={`w-full p-2 rounded-xl text-[10px] font-bold text-left flex items-center gap-2 transition-all ${resetScope === b ? "bg-rose-500 text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-400"}`}>
                      <Building className="w-4 h-4" />
                      {BOOK_LABELS[b]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase mb-1.5 block">Jenis Data</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {([
                    { key: "transactions", label: "Transaksi", icon: <BarChart3 className="w-3.5 h-3.5" /> },
                    { key: "cashflows", label: "Cashflow", icon: <DollarSign className="w-3.5 h-3.5" /> },
                    { key: "piutang", label: "Piutang", icon: <CreditCard className="w-3.5 h-3.5" /> },
                    { key: "inventory", label: "Inventaris", icon: <Search className="w-3.5 h-3.5" /> },
                    { key: "customers", label: "Pelanggan", icon: <Users className="w-3.5 h-3.5" /> },
                    { key: "wallets", label: "Dompet", icon: <Wallet className="w-3.5 h-3.5" /> },
                    { key: "auditLogs", label: "Audit Log", icon: <ScrollText className="w-3.5 h-3.5" /> },
                    { key: "quickOrders", label: "Template Cepat", icon: <Zap className="w-3.5 h-3.5" /> },
                  ]).map((item) => (
                    <button key={item.key} onClick={() => toggleResetType(item.key)}
                      className={`p-2 rounded-xl text-[10px] font-bold flex items-center gap-1.5 transition-all ${resetTypes[item.key] ? "bg-rose-500 text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-400"}`}>
                      {item.icon} {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setResetTypes({ transactions: true, cashflows: true, piutang: true, inventory: true, customers: true, wallets: true, auditLogs: true, quickOrders: true })}
                  className="flex-1 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-[10px] font-bold text-slate-400">
                  Pilih Semua
                </button>
                <button onClick={() => setResetTypes({ transactions: false, cashflows: false, piutang: false, inventory: false, customers: false, wallets: false, auditLogs: false, quickOrders: false })}
                  className="flex-1 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-[10px] font-bold text-slate-400">
                  Hapus Pilihan
                </button>
              </div>

              <button onClick={handleResetData} disabled={isProcessing}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 text-white font-extrabold text-xs shadow-lg active:scale-[0.98] flex items-center justify-center gap-2">
                <RotateCcw className="w-4 h-4" />
                {isProcessing ? "Mereset..." : "Reset Sekarang"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
