"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLiveQuery } from "@/hooks/useLiveQuery";
import { db, type UnitId } from "@/lib/db-v4";
import { useSessionStore } from "@/store/useSessionStore";
import {
  ArrowLeft, Save, Building2, Landmark, Smartphone, DollarSign,
  Trash2, AlertTriangle, Download, ExternalLink, Plus, Pencil,
  Wallet, Globe, Phone, MapPin, MessageSquare, Shield, Settings,
  Package, Users, History, ShieldCheck,
} from "lucide-react";

const BRANCH_MAP: Record<string, UnitId> = {
  pribadi: "pribadi", keluarga: "keluarga",
  percetakan: "usaha-percetakan", laptop: "usaha-laptop", gadget: "usaha-gadget",
  warkop: "usaha-warkop", konveksi: "usaha-konveksi", kelontong: "usaha-kelontong",
  "toko-pakaian": "usaha-toko-pakaian",
};
const BRANCH_LABELS: Record<string, string> = {
  pribadi: "Buku Pribadi", keluarga: "Buku Keluarga",
  percetakan: "Percetakan", gadget: "Gadget", laptop: "Komputer & Laptop",
  warkop: "Kedai Kopi", konveksi: "Fashion & Konveksi", kelontong: "Kelontong",
  "toko-pakaian": "Toko Pakaian",
};

export default function PengaturanPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useSessionStore();
  const cabangSlug = (params?.cabang as string) || "";
  const bookOrBranchId: UnitId = BRANCH_MAP[cabangSlug] || "usaha-warkop";

  const profile = useLiveQuery(() => db.profiles.where("bookOrBranchId").equals(bookOrBranchId).toArray(), [bookOrBranchId]) || [];
  const wallets = useLiveQuery(() => db.wallets.where("bookOrBranchId").equals(bookOrBranchId).toArray(), [bookOrBranchId]) || [];
  const transactions = useLiveQuery(() => db.transactions.where("bookOrBranchId").equals(bookOrBranchId).toArray(), [bookOrBranchId]) || [];
  const cashflows = useLiveQuery(() => db.cashflows.where("bookOrBranchId").equals(bookOrBranchId).toArray(), [bookOrBranchId]) || [];
  const auditLogs = useLiveQuery(() => db.auditLogs.where("bookOrBranchId").equals(bookOrBranchId).reverse().limit(50).toArray(), [bookOrBranchId]) || [];

  const existingProfile = profile[0];

  const [namaUsaha, setNamaUsaha] = useState(existingProfile?.namaUsaha || "");
  const [logoUrl, setLogoUrl] = useState(existingProfile?.logoUrl || "");
  const [alamat, setAlamat] = useState(existingProfile?.alamat || "");
  const [noWhatsapp, setNoWhatsapp] = useState(existingProfile?.noWhatsapp || "");
  const [slogan, setSlogan] = useState(existingProfile?.slogan || "");
  const [subLayanan, setSubLayanan] = useState(existingProfile?.subLayanan?.join(", ") || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetConfirm, setResetConfirm] = useState("");

  const handleSaveProfile = async () => {
    setSaving(true);
    const data = {
      bookOrBranchId,
      namaUsaha: namaUsaha.trim() || BRANCH_LABELS[cabangSlug] || "MMCBANK",
      logoUrl: logoUrl.trim(),
      alamat: alamat.trim(),
      noWhatsapp: noWhatsapp.trim(),
      slogan: slogan.trim(),
      subLayanan: subLayanan.split(",").map((s) => s.trim()).filter(Boolean),
      updatedAt: new Date().toISOString(),
    };
    if (existingProfile) {
      await db.profiles.update(existingProfile.id, data);
    } else {
      await db.profiles.add({ id: crypto.randomUUID(), ...data });
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleResetData = async () => {
    if (resetConfirm !== "RESET") return;
    await db.transactions.where("bookOrBranchId").equals(bookOrBranchId).delete();
    await db.cashflows.where("bookOrBranchId").equals(bookOrBranchId).delete();
    await db.piutang.where("bookOrBranchId").equals(bookOrBranchId).delete();
    await db.piutangInstallments.where("bookOrBranchId").equals(bookOrBranchId).delete();
    await db.inventoryMutations.where("bookOrBranchId").equals(bookOrBranchId).delete();
    await db.walletMutations.where("bookOrBranchId").equals(bookOrBranchId).delete();
    await db.productions.where("bookOrBranchId").equals(bookOrBranchId).delete();
    const allWallets = await db.wallets.where("bookOrBranchId").equals(bookOrBranchId).toArray();
    for (const w of allWallets) {
      await db.wallets.update(w.id, { saldo: 0 });
    }
    setShowReset(false);
    setResetConfirm("");
  };

  const handleExport = async () => {
    const allData = {
      transactions,
      cashflows,
      wallets,
      profile: existingProfile || null,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup-${cabangSlug}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalTransaksi = transactions.length;
  const totalPemasukan = cashflows.filter((c) => c.tipe === "masuk").reduce((s, c) => s + c.nominal, 0);
  const totalDompet = wallets.reduce((s, w) => s + w.saldo, 0);

  return (
    <div className="flex flex-col gap-4 pt-2 pb-4 animate-fade-in">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.push(`/buku-usaha/${cabangSlug}`)} className="p-2 bg-white dark:bg-[#131527] rounded-full shadow-md active:scale-95 transition-transform">
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-heading font-extrabold tracking-tight flex items-center gap-2 justify-center">
            <Settings className="w-5 h-5 text-[#008CEB]" />
            Pengaturan
          </h1>
          <p className="text-[9px] text-slate-400 capitalize">{BRANCH_LABELS[cabangSlug] || cabangSlug}</p>
        </div>
        <div className="w-9 h-9" />
      </div>

      {/* ─── Quick Stats ─── */}
      <div className="grid grid-cols-3 gap-2">
        <div className="premium-card p-3 text-center">
          <p className="text-[18px] font-heading font-extrabold text-[#008CEB]">{totalTransaksi}</p>
          <p className="text-[8px] text-slate-400 font-bold uppercase">Transaksi</p>
        </div>
        <div className="premium-card p-3 text-center">
          <p className="text-[18px] font-heading font-extrabold text-emerald-500">Rp{(totalPemasukan / 1000000).toFixed(1)}jt</p>
          <p className="text-[8px] text-slate-400 font-bold uppercase">Pemasukan</p>
        </div>
        <div className="premium-card p-3 text-center">
          <p className="text-[18px] font-heading font-extrabold text-amber-500">Rp{(totalDompet / 1000000).toFixed(1)}jt</p>
          <p className="text-[8px] text-slate-400 font-bold uppercase">Saldo</p>
        </div>
      </div>

      {/* ─── Profil Bisnis ─── */}
      <div className="premium-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-[#008CEB]/10 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-[#008CEB]" />
          </div>
          <span className="text-xs font-heading font-extrabold">Profil Bisnis</span>
          {saved && <span className="ml-auto text-[10px] text-emerald-500 font-bold">Tersimpan ✓</span>}
        </div>
        <div className="space-y-2.5 text-xs">
          <div>
            <label className="text-[9px] text-slate-400 font-bold uppercase flex items-center gap-1 mb-1"><Building2 className="w-3 h-3" /> Nama Usaha</label>
            <input type="text" value={namaUsaha} onChange={(e) => setNamaUsaha(e.target.value)}
              placeholder={BRANCH_LABELS[cabangSlug] || "Nama usaha"} className="w-full input-premium" />
          </div>
          <div>
            <label className="text-[9px] text-slate-400 font-bold uppercase flex items-center gap-1 mb-1"><Globe className="w-3 h-3" /> Logo (URL)</label>
            <input type="text" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" className="w-full input-premium" />
          </div>
          <div>
            <label className="text-[9px] text-slate-400 font-bold uppercase flex items-center gap-1 mb-1"><MapPin className="w-3 h-3" /> Alamat</label>
            <textarea value={alamat} onChange={(e) => setAlamat(e.target.value)} rows={2} className="w-full input-premium resize-none" />
          </div>
          <div>
            <label className="text-[9px] text-slate-400 font-bold uppercase flex items-center gap-1 mb-1"><Phone className="w-3 h-3" /> No WhatsApp</label>
            <input type="text" value={noWhatsapp} onChange={(e) => setNoWhatsapp(e.target.value)} placeholder="08123456789" className="w-full input-premium" />
          </div>
          <div>
            <label className="text-[9px] text-slate-400 font-bold uppercase flex items-center gap-1 mb-1"><MessageSquare className="w-3 h-3" /> Slogan</label>
            <input type="text" value={slogan} onChange={(e) => setSlogan(e.target.value)} placeholder="Label terpercaya" className="w-full input-premium" />
          </div>
          <button onClick={handleSaveProfile} disabled={saving}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#008CEB] to-[#00C9A7] text-white font-bold text-xs active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5 disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? "Menyimpan..." : "Simpan Profil"}
          </button>
        </div>
      </div>

      {/* ─── Metode Pembayaran ─── */}
      <div className="premium-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Landmark className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex-1">
            <span className="text-xs font-heading font-extrabold">Metode Pembayaran</span>
            <p className="text-[9px] text-slate-400">Rekening bank & e-wallet • ({wallets.length})</p>
          </div>
          <button onClick={() => router.push(`/buku-usaha/${cabangSlug}/dompet`)}
            className="text-[10px] font-bold text-[#008CEB] flex items-center gap-1 px-2 py-1 rounded-lg bg-[#008CEB]/10 hover:bg-[#008CEB]/20 transition-all">
            <Plus className="w-3 h-3" /> Kelola
          </button>
        </div>
        <div className="space-y-2">
          {wallets.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">Belum ada metode pembayaran. Tambah via Dompet.</div>
          ) : (
            wallets.map((w) => (
              <div key={w.id} className="flex items-center gap-3 bg-slate-50 dark:bg-zinc-800/50 rounded-xl p-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-extrabold ${
                  w.tipe === "Bank" ? "bg-blue-500" : w.tipe === "EWallet" ? "bg-emerald-500" : "bg-amber-500"
                }`}>
                  {w.tipe === "Bank" ? <Landmark className="w-4 h-4" /> : w.tipe === "EWallet" ? <Smartphone className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-heading font-bold">{w.namaDompet}</p>
                  {w.tipe === "Bank" && w.namaBank ? (
                    <p className="text-[9px] text-slate-400">{w.namaBank}{w.atasNama ? ` a.n. ${w.atasNama}` : ""}{w.nomorRekening ? ` • ${w.nomorRekening}` : ""}</p>
                  ) : (
                    <p className="text-[9px] text-slate-400">{w.tipe === "EWallet" ? "E-Wallet" : "Kas Tunai"}{w.catatan ? ` • ${w.catatan}` : ""}</p>
                  )}
                </div>
                <p className="text-[11px] font-heading font-extrabold text-[#008CEB]">Rp{w.saldo.toLocaleString()}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ─── Quick Actions ─── */}
      <div className="premium-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <ExternalLink className="w-4 h-4 text-purple-500" />
          </div>
          <span className="text-xs font-heading font-extrabold">Aksi Cepat</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => router.push(`/buku-usaha/${cabangSlug}/dompet`)}
            className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-800/50 rounded-xl p-3 text-left hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all">
            <Wallet className="w-4 h-4 text-cyan-500 shrink-0" />
            <span className="text-[10px] font-bold">Dompet</span>
          </button>
          <button onClick={() => router.push(`/buku-usaha/${cabangSlug}/inventory`)}
            className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-800/50 rounded-xl p-3 text-left hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all">
            <Package className="w-4 h-4 text-blue-500 shrink-0" />
            <span className="text-[10px] font-bold">Inventory</span>
          </button>
          <button onClick={() => router.push(`/buku-usaha/${cabangSlug}/pelanggan`)}
            className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-800/50 rounded-xl p-3 text-left hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all">
            <Users className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="text-[10px] font-bold">Pelanggan</span>
          </button>
          <button onClick={handleExport}
            className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-800/50 rounded-xl p-3 text-left hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all">
            <Download className="w-4 h-4 text-purple-500 shrink-0" />
            <span className="text-[10px] font-bold">Backup JSON</span>
          </button>
        </div>
      </div>

      {/* ─── Audit Log ─── */}
      <div className="premium-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-slate-500/10 flex items-center justify-center">
            <History className="w-4 h-4 text-slate-500" />
          </div>
          <span className="text-xs font-heading font-extrabold">Aktivitas Terakhir</span>
          <span className="ml-auto text-[10px] text-slate-400">{auditLogs.length} log</span>
        </div>
        <div className="space-y-1.5 max-h-60 overflow-y-auto">
          {auditLogs.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">Belum ada aktivitas</div>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-2 text-[10px] py-1.5 border-b border-slate-100 dark:border-zinc-800 last:border-0">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold capitalize">{log.action} <span className="font-normal text-slate-400">{log.entityType}</span></p>
                  {log.entityId && <p className="text-[8px] text-slate-400 truncate">ID: {log.entityId}</p>}
                </div>
                <span className="text-[8px] text-slate-400 shrink-0">{new Date(log.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ─── Reset Data ─── */}
      {!showReset ? (
        <button onClick={() => setShowReset(true)}
          className="premium-card p-4 border-rose-200/60 dark:border-rose-900/40 flex items-center gap-3 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-all">
          <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
            <Trash2 className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-xs font-heading font-bold text-rose-600 dark:text-rose-400">Reset Data</p>
            <p className="text-[9px] text-slate-400">Hapus semua transaksi & cashflow cabang ini</p>
          </div>
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
        </button>
      ) : (
        <div className="premium-card p-4 border-rose-400/60 dark:border-rose-700/60 bg-rose-50/50 dark:bg-rose-950/20">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            <span className="text-xs font-heading font-extrabold text-rose-600 dark:text-rose-400">Konfirmasi Reset</span>
          </div>
          <p className="text-[10px] text-slate-500 mb-2">Tindakan ini akan menghapus SEMUA transaksi, cashflow, piutang, dan mutasi. Saldo dompet akan dikembalikan ke 0. Tidak bisa dibatalkan.</p>
          <input type="text" value={resetConfirm} onChange={(e) => setResetConfirm(e.target.value)}
            placeholder='Ketik "RESET" untuk konfirmasi' className="w-full input-premium text-xs text-center font-bold mb-2" />
          <div className="flex gap-2">
            <button onClick={() => { setShowReset(false); setResetConfirm(""); }}
              className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs font-bold">Batal</button>
            <button onClick={handleResetData} disabled={resetConfirm !== "RESET"}
              className="flex-1 py-2 rounded-xl bg-rose-500 text-white text-xs font-bold disabled:opacity-40 flex items-center justify-center gap-1">
              <Trash2 className="w-3.5 h-3.5" /> Reset Sekarang
            </button>
          </div>
        </div>
      )}

      {/* ─── Footer Info ─── */}
      <div className="text-center py-4">
        <div className="flex items-center justify-center gap-1 text-[9px] text-slate-400 mb-1">
          <Shield className="w-3 h-3" />
          Data tersimpan aman di perangkat Anda
        </div>
        <p className="text-[8px] text-slate-300">MMCBANK v4 • {cabangSlug}</p>
      </div>
    </div>
  );
}


