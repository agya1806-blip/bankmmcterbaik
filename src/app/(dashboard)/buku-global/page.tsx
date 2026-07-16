"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/store/useSessionStore";
import { createBackup, restoreBackup, downloadBlob } from "@/lib/backup";
import { executeTransfer, type TransferInput } from "@/engine/double-entry";
import { exportTransactionsExcel, exportCashflowExcel } from "@/lib/export-utils";
import { db, type BookOrBranch } from "@/lib/db-v4";
import { useLiveQuery } from "@/hooks/useLiveQuery";
import {
  LogOut, Download, Upload, ArrowRightLeft, FileSpreadsheet,
  Moon, Sun, Shield, Database, AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PinLock from "@/components/pin-lock";

const BRANCH_LIST: BookOrBranch[] = [
  "usaha-percetakan", "usaha-laptop", "usaha-gadget",
  "usaha-warkop", "usaha-konveksi",
];

export default function BukuGlobalPage() {
  const router = useRouter();
  const { currentUser, logout, isPinVerified, verifyPin, resetPinVerification } = useSessionStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showPin, setShowPin] = useState(true);
  const [activeSection, setActiveSection] = useState<"none" | "backup" | "transfer" | "export">("none");
  const [backupPassword, setBackupPassword] = useState("");
  const [transferFrom, setTransferFrom] = useState<BookOrBranch>("usaha-warkop");
  const [transferTo, setTransferTo] = useState<BookOrBranch>("usaha-percetakan");
  const [transferAmount, setTransferAmount] = useState(0);
  const [transferDesc, setTransferDesc] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const allTransactions = useLiveQuery(() => db.transactions.toArray()) || [];
  const allCashflows = useLiveQuery(() => db.cashflows.toArray()) || [];

  if (!isPinVerified && showPin) {
    return (
      <PinLock
        onSuccess={() => { verifyPin(); setShowPin(false); }}
        title="Akses Pengaturan Global"
        subtitle="Masukkan PIN admin"
      />
    );
  }

  const handleBackup = async () => {
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
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const password = prompt("Masukkan password backup:");
    if (!password) return;

    setIsProcessing(true);
    try {
      const result = await restoreBackup(file, password);
      if (result.ok) {
        alert("Restore berhasil! Memuat ulang...");
        window.location.reload();
      } else {
        alert(`Restore gagal: ${result.error}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      alert(`Restore gagal: ${message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTransfer = async () => {
    if (transferAmount <= 0) return alert("Jumlah harus lebih dari 0!");
    if (!transferDesc.trim()) return alert("Deskripsi wajib diisi!");
    if (transferFrom === transferTo) return alert("Cabang asal dan tujuan harus berbeda!");

    setIsProcessing(true);
    try {
      const res = await executeTransfer({
        fromBranch: transferFrom,
        toBranch: transferTo,
        amount: transferAmount,
        description: transferDesc.trim(),
      });
      if (res.ok) {
        alert("Transfer antar cabang berhasil!");
        setTransferAmount(0);
        setTransferDesc("");
        setActiveSection("none");
      } else {
        alert(`Transfer gagal: ${res.error}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      alert(`Transfer gagal: ${message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportTransactions = () => {
    if (allTransactions.length === 0) return alert("Tidak ada data transaksi!");
    exportTransactionsExcel(allTransactions, "Semua-Cabang");
    alert("Export Excel berhasil!");
  };

  const handleExportCashflow = () => {
    if (allCashflows.length === 0) return alert("Tidak ada data cashflow!");
    exportCashflowExcel(allCashflows, "Semua-Cabang");
    alert("Export Excel cashflow berhasil!");
  };

  const handleLogout = () => {
    if (!confirm("Yakin ingin logout?")) return;
    logout();
    resetPinVerification();
    router.push("/login");
  };

  const sections = [
    { key: "backup" as const, label: "Backup & Restore", icon: Database, color: "from-blue-500 to-indigo-500" },
    { key: "transfer" as const, label: "Transfer Antar Cabang", icon: ArrowRightLeft, color: "from-emerald-500 to-teal-500" },
    { key: "export" as const, label: "Export Data", icon: FileSpreadsheet, color: "from-amber-500 to-orange-500" },
  ];

  return (
    <div className="flex-1 flex flex-col pt-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-heading font-extrabold tracking-tight">Pengaturan Global</h1>
          <p className="text-[10px] text-slate-400 font-medium">Kelola seluruh sistem</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 font-medium">Login sebagai</span>
          <p className="text-xs font-heading font-extrabold gradient-text">{currentUser}</p>
        </div>
      </div>

      {/* Section Cards */}
      <div className="space-y-2">
        {sections.map((s) => {
          const Icon = s.icon;
          const isActive = activeSection === s.key;
          return (
            <div key={s.key}>
              <button
                onClick={() => setActiveSection(isActive ? "none" : s.key)}
                className={`w-full premium-card premium-card-glow p-3 flex items-center gap-3 transition-all duration-200 ${
                  isActive ? "border-[#7B61FF]/40" : ""
                }`}
              >
                <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white shadow-md`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-heading font-bold flex-1 text-left">{s.label}</span>
                <span className={`text-xs text-slate-400 transition-transform duration-200 ${isActive ? "rotate-180" : ""}`}>▼</span>
              </button>

              <AnimatePresence>
                {isActive && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="premium-card p-4 mt-2 space-y-3">
                      {s.key === "backup" && (
                        <>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">
                              Password Backup (AES-256-GCM)
                            </label>
                            <input
                              type="password"
                              value={backupPassword}
                              onChange={(e) => setBackupPassword(e.target.value)}
                              placeholder="Min. 4 karakter"
                              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none"
                            />
                          </div>
                          <button
                            onClick={handleBackup}
                            disabled={isProcessing}
                            className="w-full py-2.5 rounded-xl bg-blue-500 text-white font-bold text-xs active:scale-[0.98] flex items-center justify-center gap-1.5"
                          >
                            <Download className="w-3.5 h-3.5" />
                            {isProcessing ? "Memproses..." : "Download Backup"}
                          </button>
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isProcessing}
                            className="w-full py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-xs active:scale-[0.98] flex items-center justify-center gap-1.5"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            Restore dari File
                          </button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".enc"
                            className="hidden"
                            onChange={handleRestore}
                          />
                        </>
                      )}

                      {s.key === "transfer" && (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 mb-1">Dari Cabang</label>
                              <select
                                value={transferFrom}
                                onChange={(e) => setTransferFrom(e.target.value as BookOrBranch)}
                                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none"
                              >
                                {BRANCH_LIST.map((b) => (
                                  <option key={b} value={b}>{b.replace("usaha-", "")}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 mb-1">Ke Cabang</label>
                              <select
                                value={transferTo}
                                onChange={(e) => setTransferTo(e.target.value as BookOrBranch)}
                                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none"
                              >
                                {BRANCH_LIST.map((b) => (
                                  <option key={b} value={b}>{b.replace("usaha-", "")}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">Jumlah (Rp)</label>
                            <input
                              type="number"
                              value={transferAmount || ""}
                              onChange={(e) => setTransferAmount(Number(e.target.value))}
                              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">Deskripsi</label>
                            <input
                              type="text"
                              value={transferDesc}
                              onChange={(e) => setTransferDesc(e.target.value)}
                              placeholder="Contoh: Modal usaha percetakan"
                              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none"
                            />
                          </div>
                          <button
                            onClick={handleTransfer}
                            disabled={isProcessing}
                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#7B61FF] to-[#FF5C00] text-white font-bold text-xs active:scale-[0.98]"
                          >
                            {isProcessing ? "Memproses..." : "Transfer Sekarang"}
                          </button>
                        </>
                      )}

                      {s.key === "export" && (
                        <>
                          <button
                            onClick={handleExportTransactions}
                            className="w-full py-2.5 rounded-xl bg-blue-500 text-white font-bold text-xs active:scale-[0.98] flex items-center justify-center gap-1.5"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            Export Semua Transaksi (Excel)
                          </button>
                          <button
                            onClick={handleExportCashflow}
                            className="w-full py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-xs active:scale-[0.98] flex items-center justify-center gap-1.5"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            Export Semua Cashflow (Excel)
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* DB Stats */}
      <div className="premium-card p-3 space-y-2">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase">Statistik Database</h3>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-sm font-extrabold text-[#7B61FF]">{allTransactions.length}</p>
            <span className="text-[9px] text-slate-400">Transaksi</span>
          </div>
          <div>
            <p className="text-sm font-extrabold text-emerald-500">{allCashflows.length}</p>
            <span className="text-[9px] text-slate-400">Cashflow</span>
          </div>
          <div>
            <p className="text-sm font-extrabold text-amber-500">{BRANCH_LIST.length}</p>
            <span className="text-[9px] text-slate-400">Cabang</span>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="premium-card p-3 flex items-center gap-3 text-rose-500 active:scale-[0.98]"
      >
        <LogOut className="w-5 h-5" />
        <span className="text-xs font-bold">Keluar dari Akun</span>
      </button>
    </div>
  );
}
