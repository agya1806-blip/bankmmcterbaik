"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Shield, Download, Upload, CheckCircle2, Key, Database } from "lucide-react";
import toast from "react-hot-toast";
import { exportEncryptedBackup, importEncryptedBackup, downloadBlob } from "@/lib/backupEngine";

export default function GlobalPengaturanPage() {
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [backupPin, setBackupPin] = useState("");
  const [restorePin, setRestorePin] = useState("");
  const [masterPin, setMasterPin] = useState("123456");
  const [newMasterPin, setNewMasterPin] = useState("");
  const [confirmMasterPin, setConfirmMasterPin] = useState("");

  const handleExport = async () => {
    if (backupPin.length < 4) { toast.error("PIN minimal 4 digit"); return; }
    setExporting(true);
    try {
      const blob = await exportEncryptedBackup(backupPin);
      const filename = `mmcbank-backup-${new Date().toISOString().slice(0, 10)}.json`;
      downloadBlob(blob, filename);
      toast.success("Backup berhasil diunduh!");
    } catch {
      toast.error("Gagal membuat backup");
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    if (restorePin.length < 4) { toast.error("PIN minimal 4 digit"); return; }
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!confirm("Yakin akan merestore database? Semua data saat ini akan diganti!")) return;
      setImporting(true);
      try {
        const result = await importEncryptedBackup(file, restorePin);
        if (result.success) {
          toast.success(result.message);
          setTimeout(() => window.location.reload(), 1500);
        } else {
          toast.error(result.message);
        }
      } catch {
        toast.error("Gagal merestore backup");
      } finally {
        setImporting(false);
      }
    };
    input.click();
  };

  const handleUpdateMasterPin = () => {
    if (newMasterPin.length < 4) { toast.error("PIN minimal 4 digit"); return; }
    if (newMasterPin !== confirmMasterPin) { toast.error("PIN baru tidak cocok"); return; }
    setMasterPin(newMasterPin);
    setNewMasterPin("");
    setConfirmMasterPin("");
    toast.success("PIN Master berhasil diperbarui (local)");
  };

  return (
    <div className="space-y-5 pb-4 max-w-lg mx-auto animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/buku-global")} className="size-9 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all active:scale-90">
          <ArrowLeft className="size-4 text-slate-500" />
        </button>
        <div className="size-10 rounded-xl bg-gradient-to-r from-[#FF5C00] to-orange-600 flex items-center justify-center shadow-lg">
          <Shield className="size-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold font-heading">Pengaturan Global</h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">Keamanan & backup database</p>
        </div>
      </div>

      {/* Backup */}
      <div className="premium-card p-4 space-y-4">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-gradient-to-r from-[#7B61FF]/10 to-[#FF5C00]/10 flex items-center justify-center">
            <Download className="size-4 text-[#7B61FF]" />
          </div>
          <div>
            <p className="text-sm font-semibold">Backup Database</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Ekspor seluruh data ke file JSON terenkripsi</p>
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400">PIN Backup (untuk enkripsi AES-256)</label>
          <input type="password" inputMode="numeric" value={backupPin}
            onChange={(e) => setBackupPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="******" className="input-premium w-full text-sm tracking-[0.5em] tabular-nums" maxLength={6} />
        </div>
        <button onClick={handleExport} disabled={exporting || backupPin.length < 4}
          className="btn-gradient w-full">
          <Database className="size-4" /> {exporting ? "Mengekspor..." : "Unduh Backup"}
        </button>
      </div>

      {/* Restore */}
      <div className="premium-card p-4 space-y-4">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-gradient-to-r from-rose-500/10 to-red-500/10 flex items-center justify-center">
            <Upload className="size-4 text-rose-500" />
          </div>
          <div>
            <p className="text-sm font-semibold">Restore Database</p>
            <p className="text-[10px] text-rose-500">Peringatan: Semua data saat ini akan ditimpa!</p>
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400">PIN Backup</label>
          <input type="password" inputMode="numeric" value={restorePin}
            onChange={(e) => setRestorePin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="******" className="input-premium w-full text-sm tracking-[0.5em] tabular-nums" maxLength={6} />
        </div>
        <button onClick={handleImport} disabled={importing || restorePin.length < 4}
          className="btn-ghost w-full bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20">
          <Upload className="size-4" /> {importing ? "Merestore..." : "Pilih File & Restore"}
        </button>
      </div>

      {/* Master PIN */}
      <div className="premium-card p-4 space-y-4">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-gradient-to-r from-amber-500/10 to-yellow-500/10 flex items-center justify-center">
            <Key className="size-4 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-semibold">Master PIN Security</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              PIN saat ini: <span className="font-mono tracking-widest text-[#FF5C00]">{masterPin.replace(/./g, "•")}</span>
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="space-y-1">
            <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400">PIN Baru (4-6 digit)</label>
            <input type="password" inputMode="numeric" value={newMasterPin}
              onChange={(e) => setNewMasterPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="******" className="input-premium w-full text-sm tracking-[0.5em] tabular-nums" maxLength={6} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Konfirmasi PIN Baru</label>
            <input type="password" inputMode="numeric" value={confirmMasterPin}
              onChange={(e) => setConfirmMasterPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="******" className="input-premium w-full text-sm tracking-[0.5em] tabular-nums" maxLength={6} />
          </div>
        </div>
        <button onClick={handleUpdateMasterPin} disabled={newMasterPin.length < 4 || newMasterPin !== confirmMasterPin}
          className="btn-gradient w-full">
          <CheckCircle2 className="size-4" /> Perbarui PIN Master
        </button>
      </div>
    </div>
  );
}
