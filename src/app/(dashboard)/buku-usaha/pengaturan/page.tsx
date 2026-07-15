"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Settings, ArrowLeft, Save, Image, Upload, Building2,
  Phone, MapPin, List, Loader2, Trash2, X, Plus,
  CreditCard, Banknote, Palette, CheckCircle2,
  Users, Fingerprint, Shield,
  Download, Database, AlertTriangle,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import { useBusinessStore, ACCENT_THEMES, AccentColor, PaymentMethod, BIZ_UNIT_LABELS, type BizUnit } from "@/store/useBusinessStore";
import { useRoleStore, type Role } from "@/store/useRoleStore";
import { CardSkeleton } from "@/components/ui/skeleton";
import { exportBackup, importBackup } from "@/lib/backup";
import { generateSyncCode, applySyncCode, getSyncCodeSize, estimateLocalStorageUsage, getLastSyncTimestamp, setLastSyncTimestamp } from "@/lib/sync";
import { exportEncryptedBackup, importEncryptedBackup, downloadBlob } from "@/lib/backupEngine";
import { requestPersistentStorage, getStorageEstimate, formatBytes } from "@/lib/storageStatus";
import { saveImage, getImage, deleteImage, isRefKey } from "@/lib/image-store";

function genId(): string {
  return `pm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export default function PengaturanBukuUsaha() {
  const router = useRouter();
  const store = useBusinessStore();
  const { profile, paymentMethods, accentColor } = store;
  const { pinUsers, currentPinUserId, addPinUser, removePinUser, updatePinUser, logoutPin } = useRoleStore();

  const [mounted, setMounted] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [tab, setTab] = useState<"profil" | "payment" | "tema" | "users" | "backup" | "sinkron">("profil");
  const [loading, setLoading] = useState(false);

  /* ─── Tab 1: Profil ─── */
  const [localLogo, setLocalLogo] = useState(profile.logoUrl);
  const [localNama, setLocalNama] = useState(profile.namaUsaha);
  const [localAlamat, setLocalAlamat] = useState(profile.alamat);
  const [localWA, setLocalWA] = useState(profile.noWhatsapp);
  const [localSlogan, setLocalSlogan] = useState(profile.slogan);
  const [localSubLayanan, setLocalSubLayanan] = useState<string[]>([...profile.subLayanan]);
  const [newLayanan, setNewLayanan] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ─── Tab 2: Payment ─── */
  const [pmNama, setPmNama] = useState("");
  const [pmBank, setPmBank] = useState("");
  const [pmNoRek, setPmNoRek] = useState("");
  const [pmAn, setPmAn] = useState("");
  const [pmQrisUrl, setPmQrisUrl] = useState("");
  const [pmEditId, setPmEditId] = useState<string | null>(null);
  const qrisInputRef = useRef<HTMLInputElement>(null);
  const [pmQrisPreview, setPmQrisPreview] = useState("");
  const [newPmId, setNewPmId] = useState<string | null>(null);
  const [resolvedQris, setResolvedQris] = useState<Record<string, string>>({});

  /* ─── Tab 4: Users ─── */
  const [newUName, setNewUName] = useState("");
  const [newUPin, setNewUPin] = useState("");
  const [newURole, setNewURole] = useState<Role>("kasir");
  const [newUUnits, setNewUUnits] = useState<BizUnit[]>([]);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const toggleUnit = (u: BizUnit) => setNewUUnits((prev) => prev.includes(u) ? prev.filter((x) => x !== u) : [...prev, u]);

  /* ─── Tab 5: Backup ─── */
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const backupFileInputRef = useRef<HTMLInputElement>(null);
  const [encryptPin, setEncryptPin] = useState("");
  const [restorePin, setRestorePin] = useState("");
  const [encryptLoading, setEncryptLoading] = useState(false);
  const [decryptLoading, setDecryptLoading] = useState(false);
  const encBackupFileRef = useRef<HTMLInputElement>(null);

  /* ─── Storage Health ─── */
  const [storagePersisted, setStoragePersisted] = useState(false);
  const [storageUsage, setStorageUsage] = useState({ usage: 0, quota: 0, percentUsed: 0 });

  /* ─── Tab 6: Sinkron ─── */
  const [syncCode, setSyncCode] = useState("");
  const [importCode, setImportCode] = useState("");
  const [syncGenerating, setSyncGenerating] = useState(false);
  const [syncApplying, setSyncApplying] = useState(false);

  useEffect(() => setMounted(true), []);

  /* Load storage health */
  useEffect(() => {
    if (!mounted) return;
    (async () => {
      const est = await getStorageEstimate();
      setStoragePersisted(est.persisted);
      setStorageUsage({ usage: est.usage, quota: est.quota, percentUsed: est.percentUsed });
    })();
  }, [mounted]);

  const handleRequestPersist = useCallback(async () => {
    const ok = await requestPersistentStorage();
    setStoragePersisted(ok);
    toast.success(ok ? "Penyimpanan permanen aktif!" : "Gagal mengaktifkan");
  }, []);

  const handleEncryptedBackup = useCallback(async () => {
    if (encryptPin.length < 4) { toast.error("PIN minimal 4 digit"); return; }
    setEncryptLoading(true);
    try {
      const blob = await exportEncryptedBackup(encryptPin);
      downloadBlob(blob, `mmcbank-encrypted-backup-${new Date().toISOString().slice(0, 10)}.json`);
      toast.success("Backup terenkripsi berhasil diunduh");
    } catch (err) {
      toast.error("Gagal: " + (err instanceof Error ? err.message : "Unknown"));
    } finally {
      setEncryptLoading(false);
    }
  }, [encryptPin]);

  const handleEncryptedRestore = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || restorePin.length < 4) { toast.error("Pilih file dan masukkan PIN"); return; }
    setDecryptLoading(true);
    try {
      const result = await importEncryptedBackup(file, restorePin);
      if (result.success) {
        toast.success(result.message);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Gagal restore backup");
    } finally {
      setDecryptLoading(false);
      if (encBackupFileRef.current) encBackupFileRef.current.value = "";
    }
  }, [restorePin]);

  /* Resolve pmQrisUrl (key) → actual dataUrl for form preview */
  useEffect(() => {
    if (!pmQrisUrl) { setPmQrisPreview(""); return; }
    if (isRefKey(pmQrisUrl)) {
      getImage(pmQrisUrl).then((img) => { if (img) setPmQrisPreview(img); }).catch(() => setPmQrisPreview(""));
    } else {
      setPmQrisPreview(pmQrisUrl);
    }
  }, [pmQrisUrl]);

  /* Resolve all QRIS image keys in the payment list for display */
  useEffect(() => {
    const resolveAll = async () => {
      const map: Record<string, string> = {};
      for (const pm of paymentMethods) {
        if (!pm.qrisImageUrl) continue;
        if (isRefKey(pm.qrisImageUrl)) {
          const img = await getImage(pm.qrisImageUrl).catch(() => null);
          if (img) map[pm.id] = img;
        } else {
          map[pm.id] = pm.qrisImageUrl;
        }
      }
      setResolvedQris(map);
    };
    resolveAll();
  }, [paymentMethods]);

  /* Sync store → local when tab changes (resolve logo key from IDB) */
  useEffect(() => {
    const sync = async () => {
      const p = useBusinessStore.getState().profile;
      if (p.logoUrl && isRefKey(p.logoUrl)) {
        const img = await getImage(p.logoUrl).catch(() => null);
        setLocalLogo(img || p.logoUrl);
      } else {
        setLocalLogo(p.logoUrl);
      }
      setLocalNama(p.namaUsaha);
      setLocalAlamat(p.alamat);
      setLocalWA(p.noWhatsapp);
      setLocalSlogan(p.slogan);
      setLocalSubLayanan([...p.subLayanan]);
    };
    sync();
  }, [tab]);

  /* ─── Profil Handlers ─── */
  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Maksimal 2MB"); return; }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        await saveImage("logo", dataUrl);
        setLocalLogo(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleHapusLogo = useCallback(async () => {
    await deleteImage("logo").catch(() => {});
    setLocalLogo("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleTambahLayanan = useCallback(() => {
    const trimmed = newLayanan.trim();
    if (!trimmed) return;
    if (localSubLayanan.includes(trimmed)) { toast.error("Layanan sudah ada"); return; }
    setLocalSubLayanan((prev) => [...prev, trimmed]);
    setNewLayanan("");
  }, [newLayanan, localSubLayanan]);

  const handleHapusLayanan = useCallback((index: number) => {
    setLocalSubLayanan((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSimpanProfil = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const cleanWA = localWA.replace(/[^0-9]/g, "");
    const intlWA = cleanWA.startsWith("0") ? "62" + cleanWA.slice(1) : cleanWA.startsWith("62") ? cleanWA : "62" + cleanWA;
    store.setProfileLogo(localLogo ? "logo" : "");
    store.setProfileNama(localNama);
    store.setProfileAlamat(localAlamat);
    store.setProfileWhatsapp(intlWA);
    store.setProfileSlogan(localSlogan);
    store.updateProfile({ subLayanan: localSubLayanan });
    await new Promise((r) => setTimeout(r, 400));
    setLoading(false);
    toast.success("Profil usaha berhasil disimpan");
  }, [localLogo, localNama, localAlamat, localWA, localSlogan, localSubLayanan, store]);

  /* ─── Payment Handlers ─── */
  const handleQrisUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Maksimal 2MB"); return; }
    const id = pmEditId || genId();
    const key = `qris-${id}`;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        await saveImage(key, dataUrl);
        setPmQrisUrl(key);
        if (!pmEditId) setNewPmId(id);
      }
    };
    reader.readAsDataURL(file);
  }, [pmEditId]);

  const resetPmForm = useCallback(() => {
    setPmNama(""); setPmBank(""); setPmNoRek(""); setPmAn(""); setPmQrisUrl(""); setPmEditId(null); setNewPmId(null);
  }, []);

  const handleSimpanPayment = useCallback(async () => {
    if (!pmNama.trim() || !pmNoRek.trim()) { toast.error("Nama metode & No Rekening wajib diisi"); return; }
    let finalQrisUrl = pmQrisUrl;
    if (finalQrisUrl && !isRefKey(finalQrisUrl)) {
      const id = pmEditId || newPmId || genId();
      const key = `qris-${id}`;
      await saveImage(key, finalQrisUrl).catch(() => {});
      finalQrisUrl = key;
      if (!pmEditId && !newPmId) setNewPmId(id);
    }
    if (pmEditId) {
      store.updatePaymentMethod(pmEditId, { namaMetode: pmNama, bankName: pmBank, accountNo: pmNoRek, accountName: pmAn, qrisImageUrl: finalQrisUrl });
      toast.success("Metode pembayaran diperbarui");
    } else {
      const id = newPmId || genId();
      store.addPaymentMethod({ id, namaMetode: pmNama, bankName: pmBank, accountNo: pmNoRek, accountName: pmAn, qrisImageUrl: finalQrisUrl, isEnabled: true });
      toast.success("Metode pembayaran ditambahkan");
    }
    resetPmForm();
  }, [pmNama, pmBank, pmNoRek, pmAn, pmQrisUrl, pmEditId, newPmId, store, resetPmForm]);

  const handleEditPm = useCallback(async (pm: PaymentMethod) => {
    setPmNama(pm.namaMetode);
    setPmBank(pm.bankName);
    setPmNoRek(pm.accountNo);
    setPmAn(pm.accountName);
    setPmEditId(pm.id);
    if (pm.qrisImageUrl && !isRefKey(pm.qrisImageUrl)) {
      const key = `qris-${pm.id}`;
      await saveImage(key, pm.qrisImageUrl).catch(() => {});
      setPmQrisUrl(key);
    } else {
      setPmQrisUrl(pm.qrisImageUrl);
    }
  }, []);

  /* ─── Theme Handlers ─── */
  const handleSetAccent = useCallback((color: AccentColor) => {
    store.setAccentColor(color);
    toast.success(`Tema diubah ke ${ACCENT_THEMES[color].label}`);
  }, [store]);

  /* ─── Backup Handlers ─── */
  const handleDownloadBackup = useCallback(async () => {
    setBackupLoading(true);
    try {
      const indexedDbData = await exportBackup();
      const lsBusiness = localStorage.getItem("mmcbank-business-store-v3");
      const lsRole = localStorage.getItem("mmcbank-role-store");
      const lsTheme = localStorage.getItem("mmcbank-theme");
      const combined = {
        version: "1.0",
        date: new Date().toISOString(),
        indexedDB: indexedDbData,
        localStorage: {
          "mmcbank-business-store-v3": lsBusiness ? JSON.parse(lsBusiness) : null,
          "mmcbank-role-store": lsRole ? JSON.parse(lsRole) : null,
          "mmcbank-theme": lsTheme ? JSON.parse(lsTheme) : null,
        },
      };
      const blob = new Blob([JSON.stringify(combined, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mmcbank-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Backup berhasil diunduh");
    } catch (err) {
      toast.error("Gagal membuat backup: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setBackupLoading(false);
    }
  }, []);

  const handleRestoreBackup = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoreLoading(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.indexedDB || !data.localStorage) {
        toast.error("Format file backup tidak valid");
        return;
      }
      const results = await importBackup(data.indexedDB);
      if (data.localStorage["mmcbank-business-store-v3"]) {
        localStorage.setItem("mmcbank-business-store-v3", JSON.stringify(data.localStorage["mmcbank-business-store-v3"]));
      }
      if (data.localStorage["mmcbank-role-store"]) {
        localStorage.setItem("mmcbank-role-store", JSON.stringify(data.localStorage["mmcbank-role-store"]));
      }
      if (data.localStorage["mmcbank-theme"]) {
        localStorage.setItem("mmcbank-theme", JSON.stringify(data.localStorage["mmcbank-theme"]));
      }
      toast.success(`Restore berhasil! ${results.length} penyimpanan dipulihkan.`);
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      toast.error("Gagal restore: " + (err instanceof Error ? err.message : "Format tidak valid"));
    } finally {
      setRestoreLoading(false);
      if (backupFileInputRef.current) backupFileInputRef.current.value = "";
    }
  }, []);

  if (!mounted) return <CardSkeleton />;

  const tabButton = (key: "profil" | "payment" | "tema" | "users" | "backup" | "sinkron", label: string, icon: React.ElementType) => {
    const Ico = icon;
    const aktif = tab === key;
    return (
      <button key={key} onClick={() => setTab(key)}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-bold transition-all active:scale-[0.97] ${
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
    <div className="max-w-3xl mx-auto pb-20 space-y-5 animate-fade-in">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/buku-usaha")}
            className="size-9 rounded-xl bg-muted/30 flex items-center justify-center hover:bg-muted/50 transition-all active:scale-[0.97]"
          >
            <ArrowLeft className="size-4 text-muted-foreground" />
          </button>
          <div className="size-11 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Settings className="size-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold font-heading">Pengaturan Buku Usaha</h2>
            <p className="text-[10px] text-muted-foreground/60">Profil, pembayaran, dan tampilan</p>
          </div>
        </div>
      </div>

      {/* ─── Tab Navigation ─── */}
      <div className="flex gap-2">
        {tabButton("profil", "Profil Toko", Building2)}
        {tabButton("payment", "Pembayaran & QRIS", CreditCard)}
        {tabButton("tema", "Tema Visual", Palette)}
        {tabButton("users", "Pengguna", Users)}
        {tabButton("backup", "Cadangan Data", Database)}
        {tabButton("sinkron", "Sinkronisasi", RefreshCw)}
      </div>

      {/* ══════════════════════════════════════════════════
          TAB 1: PROFIL TOKO
          ══════════════════════════════════════════════════ */}
      {tab === "profil" && (
        <form onSubmit={handleSimpanProfil} className="space-y-5">
          {/* Logo */}
          <div className="floating-card p-5 space-y-3">
            <p className="text-xs font-semibold flex items-center gap-1.5">
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image className="size-3.5 text-violet-500" /> Logo Usaha
            </p>
            <div className="flex items-center gap-4">
              <div className="size-20 rounded-2xl border-2 border-dashed border-muted-foreground/20 flex items-center justify-center overflow-hidden bg-muted/10 shrink-0">
                {localLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={localLogo} alt="" className="size-full object-contain p-1" />
                ) : (
                  <Building2 className="size-8 text-muted-foreground/30" />
                )}
              </div>
              <div className="space-y-2">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" id="logo-upload" />
                <label htmlFor="logo-upload" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 text-violet-600 text-[10px] font-semibold hover:bg-violet-500/20 transition-colors cursor-pointer">
                  <Upload className="size-3.5" /> Upload Logo
                </label>
                {localLogo && (
                  <button type="button" onClick={handleHapusLogo} className="block text-[9px] text-rose-500 hover:text-rose-600 transition-colors">
                    Hapus logo
                  </button>
                )}
                <p className="text-[8px] text-muted-foreground/40">Format PNG/JPG, maks 2MB</p>
              </div>
            </div>
          </div>

          {/* Identitas */}
          <div className="floating-card p-5 space-y-4">
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <Building2 className="size-3.5 text-violet-500" /> Identitas Usaha
            </p>
            <div className="space-y-1">
              <label className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">Nama Usaha</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/40" />
                <input type="text" value={localNama} onChange={(e) => setLocalNama(e.target.value)} placeholder="Nama usaha Anda" className="input-premium w-full text-xs pl-9" required />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">Alamat Lengkap</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 size-3.5 text-muted-foreground/40" />
                <textarea value={localAlamat} onChange={(e) => setLocalAlamat(e.target.value)} placeholder="Alamat lengkap usaha" rows={3} className="input-premium w-full text-xs pl-9 resize-none" required />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">Nomor WhatsApp</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/40" />
                <input type="tel" value={localWA} onChange={(e) => setLocalWA(e.target.value.replace(/[^0-9]/g, ""))} placeholder="6281xxxxxxxxx" maxLength={15} className="input-premium w-full text-xs pl-9 tabular-nums" required />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">Slogan / Sub-titel</label>
              <input type="text" value={localSlogan} onChange={(e) => setLocalSlogan(e.target.value)} placeholder="Slogan atau deskripsi singkat" className="input-premium w-full text-xs" />
            </div>
          </div>

          {/* Sub Layanan */}
          <div className="floating-card p-5 space-y-3">
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <List className="size-3.5 text-violet-500" /> Sub-Layanan (tags)
            </p>
            <div className="flex gap-2">
              <input type="text" value={newLayanan} onChange={(e) => setNewLayanan(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleTambahLayanan(); } }}
                placeholder="cth: Jasa Desain Grafis" className="input-premium flex-1 text-xs" />
              <button type="button" onClick={handleTambahLayanan}
                className="px-3 py-2 rounded-lg bg-violet-500/10 text-violet-600 text-[10px] font-semibold hover:bg-violet-500/20 transition-colors shrink-0">
                <Plus className="size-3.5 inline" /> Tambah
              </button>
            </div>
            {localSubLayanan.length === 0 ? (
              <p className="text-[10px] text-muted-foreground/30 py-2">Belum ada layanan. Tambahkan minimal satu.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {localSubLayanan.map((item, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-muted/50 text-[10px] font-medium group">
                    <span>{item}</span>
                    <button type="button" onClick={() => handleHapusLayanan(i)}
                      className="size-3.5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-rose-100 transition-all">
                      <X className="size-2.5 text-rose-500" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Simpan */}
          <button type="submit" disabled={loading || !localNama || !localAlamat || !localWA}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-bold shadow-lg shadow-violet-500/20 hover:shadow-xl hover:shadow-violet-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="size-4 animate-spin" /> Menyimpan...</> : <><Save className="size-4" /> Simpan Profil</>}
          </button>

          {/* Live Preview */}
          <div className="floating-card p-4 bg-gradient-to-br from-violet-500/5 to-purple-500/5 border border-violet-500/10">
            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-2">Live Preview</p>
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md overflow-hidden shrink-0">
                {localLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={localLogo} alt="" className="size-full object-contain" />
                ) : (
                  <Building2 className="size-5 text-white" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold font-heading truncate">{localNama || "Nama Usaha"}</p>
                <p className="text-[9px] text-muted-foreground/60 truncate">{localAlamat || "Alamat"}</p>
                {localWA && <p className="text-[9px] text-muted-foreground/40 tabular-nums">WA: {localWA}</p>}
              </div>
            </div>
            {localSubLayanan.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-2">
                {localSubLayanan.map((s, i) => (
                  <span key={i} className="text-[8px] text-muted-foreground/40 before:content-['•'] before:mr-0.5 before:text-violet-400">{s}</span>
                ))}
              </div>
            )}
          </div>
        </form>
      )}

      {/* ══════════════════════════════════════════════════
          TAB 2: METODE PEMBAYARAN & QRIS
          ══════════════════════════════════════════════════ */}
      {tab === "payment" && (
        <div className="space-y-5">
          {/* Form Tambah */}
          <div className="floating-card p-5 space-y-4">
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <CreditCard className="size-3.5 text-violet-500" /> {pmEditId ? "Edit" : "Tambah"} Metode Pembayaran
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] text-muted-foreground/50">Nama Metode *</label>
                <input type="text" value={pmNama} onChange={(e) => setPmNama(e.target.value)} placeholder="cth: BSI / DANA / Tunai" className="input-premium w-full text-[10px]" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-muted-foreground/50">Nama Bank / E-Wallet</label>
                <input type="text" value={pmBank} onChange={(e) => setPmBank(e.target.value)} placeholder="cth: Bank Syariah Indonesia" className="input-premium w-full text-[10px]" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-muted-foreground/50">No Rekening / Akun *</label>
                <input type="text" value={pmNoRek} onChange={(e) => setPmNoRek(e.target.value)} placeholder="cth: 1234567890" className="input-premium w-full text-[10px] tabular-nums" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-muted-foreground/50">Atas Nama</label>
                <input type="text" value={pmAn} onChange={(e) => setPmAn(e.target.value)} placeholder="Nama pemilik rekening" className="input-premium w-full text-[10px]" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-muted-foreground/50">QRIS Image (upload gambar barcode)</label>
              <div className="flex items-center gap-3">
                <input ref={qrisInputRef} type="file" accept="image/*" onChange={handleQrisUpload} className="hidden" id="qris-upload" />
                <label htmlFor="qris-upload" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 text-violet-600 text-[10px] font-semibold hover:bg-violet-500/20 transition-colors cursor-pointer">
                  <Upload className="size-3.5" /> Upload QRIS
                </label>
                {pmQrisUrl && (
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={pmQrisPreview} alt="" className="size-10 rounded-lg object-contain border border-border/40" />
                    <button type="button" onClick={() => {
                      if (pmQrisUrl && isRefKey(pmQrisUrl)) deleteImage(pmQrisUrl).catch(() => {});
                      setPmQrisUrl("");
                    }} className="text-[9px] text-rose-500 hover:text-rose-600">
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSimpanPayment}
                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-[10px] font-bold shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <Save className="size-3.5" /> {pmEditId ? "Update" : "Simpan"} Metode
              </button>
              {pmEditId && (
                <button onClick={resetPmForm} className="px-4 py-2 rounded-xl bg-muted/30 text-muted-foreground text-[10px] font-semibold hover:bg-muted/50 transition-colors">
                  Batal Edit
                </button>
              )}
            </div>
          </div>

          {/* Daftar Metode */}
          <div className="floating-card p-5 space-y-3">
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <Banknote className="size-3.5 text-violet-500" /> Daftar Metode Pembayaran
            </p>
            {paymentMethods.length === 0 ? (
              <p className="text-[10px] text-muted-foreground/30 py-3 text-center">Belum ada metode pembayaran</p>
            ) : (
              <div className="space-y-2">
                {paymentMethods.map((pm) => (
                  <div key={pm.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors group">
                    <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${pm.isEnabled ? "bg-violet-500/10 text-violet-600" : "bg-muted/30 text-muted-foreground/30"}`}>
                      <CreditCard className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{pm.namaMetode}</p>
                      <p className="text-[9px] text-muted-foreground/50">{pm.bankName} — {pm.accountNo}</p>
                      {pm.accountName && <p className="text-[9px] text-muted-foreground/40">a.n {pm.accountName}</p>}
                      {resolvedQris[pm.id] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={resolvedQris[pm.id]} alt="QRIS" className="size-8 mt-1 rounded-lg border border-border/30 object-contain" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => store.togglePaymentMethod(pm.id)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${pm.isEnabled ? "bg-emerald-500" : "bg-muted/50"}`}
                      >
                        <span className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform ${pm.isEnabled ? "translate-x-[18px]" : "translate-x-0.5"}`} />
                      </button>
                      <button onClick={() => handleEditPm(pm)} className="size-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-violet-500/10 text-muted-foreground/40 hover:text-violet-500 transition-all active:scale-[0.97]">
                        <Settings className="size-3" />
                      </button>
                      <button onClick={() => {
                        if (pm.qrisImageUrl && isRefKey(pm.qrisImageUrl)) deleteImage(pm.qrisImageUrl).catch(() => {});
                        store.removePaymentMethod(pm.id); toast.success("Metode dihapus");
                      }}
                        className="size-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 text-muted-foreground/40 hover:text-rose-500 transition-all active:scale-[0.97]">
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TAB 3: TEMA VISUAL
          ══════════════════════════════════════════════════ */}
      {tab === "tema" && (
        <div className="space-y-5">
          <div className="floating-card p-5 space-y-4">
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <Palette className="size-3.5 text-violet-500" /> Pilih Warna Aksen Tema
            </p>
            <p className="text-[10px] text-muted-foreground/60">Pilih warna aksen visual yang akan digunakan di seluruh tampilan Buku Usaha.</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(Object.entries(ACCENT_THEMES) as [AccentColor, typeof ACCENT_THEMES[AccentColor]][]).map(([key, theme]) => {
                const aktif = accentColor === key;
                return (
                  <button key={key} onClick={() => handleSetAccent(key)}
                    className={`relative rounded-xl p-4 text-center transition-all ${
                      aktif
                        ? "ring-2 ring-offset-2 ring-offset-background scale-[1.02] shadow-lg"
                        : "hover:scale-[1.01] hover:shadow-md"
                    }`}
                    style={{ borderColor: aktif ? "var(--theme-color, #7c3aed)" : undefined }}
                  >
                    <div className={`h-10 rounded-lg bg-gradient-to-r ${theme.from} ${theme.via} ${theme.to} mb-2 shadow-md`} />
                    <p className="text-[10px] font-semibold">{theme.label}</p>
                    {aktif && <CheckCircle2 className="size-4 text-emerald-500 absolute top-2 right-2" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="floating-card p-4 space-y-3 bg-gradient-to-br from-violet-500/5 to-purple-500/5 border border-violet-500/10">
            <p className="text-xs font-semibold">Preview Theme</p>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-black/20 border border-border/30">
              <div className={`size-10 rounded-xl bg-gradient-to-br ${ACCENT_THEMES[accentColor].from} ${ACCENT_THEMES[accentColor].via} ${ACCENT_THEMES[accentColor].to} flex items-center justify-center shadow-md`}>
                <Building2 className="size-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold font-heading">{profile.namaUsaha}</p>
                <p className={`text-[9px] ${accentColor === "indigo" ? "text-indigo-500" : accentColor === "amber" ? "text-amber-500" : accentColor === "emerald" ? "text-emerald-500" : accentColor === "sapphire" ? "text-blue-500" : "text-rose-500"}`}>
                  {profile.slogan}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TAB 4: MANAJEMEN PENGGUNA
          ══════════════════════════════════════════════════ */}
      {tab === "users" && (
        <div className="space-y-5">
          <div className="floating-card p-5 space-y-4">
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <Fingerprint className="size-3.5 text-violet-500" /> Manajemen PIN Kasir
            </p>
            <p className="text-[10px] text-muted-foreground/60">Kelola pengguna yang dapat mengakses POS Kasir dengan PIN.</p>

            {currentPinUserId && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-violet-50/50 dark:bg-violet-950/20 border border-violet-500/20">
                <div className="flex items-center gap-2">
                  <Shield className="size-4 text-violet-500" />
                  <span className="text-xs font-medium">Login sebagai: {pinUsers.find((u) => u.id === currentPinUserId)?.nama}</span>
                </div>
                <button onClick={() => { logoutPin(); toast.success("Logout berhasil"); }}
                  className="text-[10px] text-rose-500 font-medium hover:underline"
                >Logout</button>
              </div>
            )}

            {/* Daftar PIN Users */}
            <div className="space-y-1">
              {pinUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors">
                  <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${
                    u.role === "admin" ? "bg-violet-500/10 text-violet-600" :
                    u.role === "kasir" ? "bg-emerald-500/10 text-emerald-600" :
                    "bg-blue-500/10 text-blue-600"
                  }`}>
                    <Fingerprint className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium">{u.nama}</p>
                      <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded-full ${
                        u.role === "admin" ? "bg-violet-100 text-violet-700" :
                        u.role === "kasir" ? "bg-emerald-100 text-emerald-700" :
                        "bg-blue-100 text-blue-700"
                      }`}>
                        {u.role}
                      </span>
                      {!u.aktif && <span className="text-[8px] text-muted-foreground/50">Nonaktif</span>}
                    </div>
                    <p className="text-[9px] text-muted-foreground/50">{u.allowedUnits.map((x) => BIZ_UNIT_LABELS[x]).join(", ")}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => {
                      setEditingUserId(u.id);
                      setNewUName(u.nama);
                      setNewUPin("");
                      setNewURole(u.role);
                      setNewUUnits([...u.allowedUnits]);
                    }} className="size-7 rounded-lg bg-muted/30 flex items-center justify-center hover:bg-muted/50 text-[9px]">Edit</button>
                    <button onClick={() => {
                      if (u.id === currentPinUserId) { toast.error("Logout dulu sebelum menghapus akun sendiri"); return; }
                      removePinUser(u.id);
                      toast.success(`${u.nama} dihapus`);
                    }} className="size-7 rounded-lg bg-rose-500/10 flex items-center justify-center hover:bg-rose-500/20 text-[9px] text-rose-500"><Trash2 className="size-3" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Tambah/Edit PIN User */}
          <div className="floating-card p-5 space-y-4">
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <Plus className="size-3.5 text-violet-500" /> {editingUserId ? "Edit" : "Tambah"} Pengguna PIN
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] text-muted-foreground/50">Nama</label>
                <input type="text" value={newUName} onChange={(e) => setNewUName(e.target.value)} placeholder="Nama pengguna" className="input-premium w-full text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-muted-foreground/50">PIN {editingUserId ? "(kosongkan jika tidak diganti)" : ""}</label>
                <input type="password" inputMode="numeric" maxLength={6} value={newUPin} onChange={(e) => setNewUPin(e.target.value.replace(/\D/g, ""))} placeholder="6 digit" className="input-premium w-full text-xs tabular-nums" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-muted-foreground/50">Role</label>
                <select value={newURole} onChange={(e) => setNewURole(e.target.value as Role)} className="input-premium w-full text-[10px]">
                  <option value="admin">Admin</option>
                  <option value="kasir">Kasir</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-muted-foreground/50">Akses Unit</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(Object.entries(BIZ_UNIT_LABELS) as [BizUnit, string][]).map(([key, label]) => (
                    <button key={key} onClick={() => toggleUnit(key)}
                      className={`px-2 py-0.5 rounded-lg text-[9px] font-medium border transition-all active:scale-[0.97] ${
                        newUUnits.includes(key)
                          ? "border-violet-500/50 bg-violet-50 text-violet-600 dark:bg-violet-950/20"
                          : "border-border/40 text-muted-foreground/50"
                      }`}
                    >{label}</button>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={() => {
              if (!newUName.trim()) { toast.error("Nama wajib diisi"); return; }
              if (!editingUserId && newUPin.length < 4) { toast.error("PIN minimal 4 digit"); return; }

              function hashPin(pin: string): string {
                let hash = 0;
                for (let i = 0; i < pin.length; i++) { const c = pin.charCodeAt(i); hash = ((hash << 5) - hash) + c; hash = hash & hash; }
                return "pin_" + Math.abs(hash).toString(36);
              }

              if (editingUserId) {
                const data: Partial<import("@/store/useRoleStore").PinUser> = { nama: newUName.trim(), role: newURole, allowedUnits: newUUnits };
                if (newUPin.length >= 4) data.pin = hashPin(newUPin);
                updatePinUser(editingUserId, data);
                toast.success("Pengguna diperbarui");
              } else {
                addPinUser({
                  id: `pin_${Date.now()}`,
                  nama: newUName.trim(),
                  pin: hashPin(newUPin),
                  role: newURole,
                  allowedUnits: newUUnits,
                  aktif: true,
                });
                toast.success(`Pengguna ${newUName.trim()} ditambahkan`);
              }
              setNewUName(""); setNewUPin(""); setNewURole("kasir"); setNewUUnits([]); setEditingUserId(null);
            }} disabled={!newUName.trim() || (!editingUserId && newUPin.length < 4)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-bold shadow-lg disabled:opacity-40 transition-all"
            >
              {editingUserId ? "Simpan Perubahan" : "Tambah Pengguna"}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TAB 5: BACKUP & RESTORE (CADANGAN DATA)
          ══════════════════════════════════════════════════ */}
      {tab === "backup" && (
        <div className="space-y-5">
          {/* Download Backup */}
          <div className="floating-card p-5 space-y-4">
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <Download className="size-3.5 text-violet-500" /> Download Backup
            </p>
            <p className="text-[10px] text-muted-foreground/60">
              Unduh semua data bisnis, dompet, transaksi, dan pengaturan ke dalam satu file JSON.
            </p>
            <button onClick={handleDownloadBackup} disabled={backupLoading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-bold shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {backupLoading ? <><Loader2 className="size-4 animate-spin" /> Memproses...</> : <><Download className="size-4" /> Download Backup</>}
            </button>
          </div>

          {/* Encrypted Backup */}
          <div className="floating-card p-5 space-y-4 border border-emerald-500/20">
            <p className="text-xs font-semibold flex items-center gap-1.5 text-emerald-500">
              <Shield className="size-3.5" /> Backup Terenkripsi (AES-GCM)
            </p>
            <p className="text-[10px] text-muted-foreground/60">
              Backup dengan enkripsi AES-GCM menggunakan PIN Admin. File aman dibagikan via WA.
            </p>
            <div className="space-y-1">
              <label className="text-[9px] text-muted-foreground/50">PIN Enkripsi (min 4 digit)</label>
              <input type="password" inputMode="numeric" maxLength={6} value={encryptPin}
                onChange={(e) => setEncryptPin(e.target.value.replace(/\D/g, ""))}
                placeholder="6 digit" className="input-premium w-full text-xs tabular-nums" />
            </div>
            <button onClick={handleEncryptedBackup} disabled={encryptLoading || encryptPin.length < 4}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {encryptLoading ? <><Loader2 className="size-4 animate-spin" /> Mengenkripsi...</> : <><Shield className="size-4" /> Download Backup Terenkripsi</>}
            </button>
          </div>

          {/* Encrypted Restore */}
          <div className="floating-card p-5 space-y-4 border border-emerald-500/20">
            <p className="text-xs font-semibold flex items-center gap-1.5 text-emerald-500">
              <Upload className="size-3.5" /> Restore Backup Terenkripsi
            </p>
            <div className="space-y-1">
              <label className="text-[9px] text-muted-foreground/50">PIN Dekripsi</label>
              <input type="password" inputMode="numeric" maxLength={6} value={restorePin}
                onChange={(e) => setRestorePin(e.target.value.replace(/\D/g, ""))}
                placeholder="6 digit" className="input-premium w-full text-xs tabular-nums" />
            </div>
            <input ref={encBackupFileRef} type="file" accept=".json" onChange={handleEncryptedRestore}
              disabled={decryptLoading} className="hidden" id="enc-backup-upload" />
            <label htmlFor="enc-backup-upload"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-emerald-500/30 text-xs text-emerald-500 hover:border-emerald-500/50 transition-all cursor-pointer"
            >
              {decryptLoading ? <><Loader2 className="size-4 animate-spin" /> Mendekripsi...</> : <><Upload className="size-4" /> Pilih & Restore</>}
            </label>
          </div>

          {/* Restore Backup (non-encrypted) */}
          <div className="floating-card p-5 space-y-4">
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <Upload className="size-3.5 text-violet-500" /> Restore dari Backup (Non-Enkripsi)
            </p>
            <p className="text-[10px] text-muted-foreground/60">
              Pilih file backup JSON yang sebelumnya telah diunduh untuk mengembalikan data.
            </p>
            <input
              ref={backupFileInputRef}
              type="file"
              accept=".json"
              onChange={handleRestoreBackup}
              disabled={restoreLoading}
              className="hidden"
              id="backup-upload"
            />
            <label htmlFor="backup-upload"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-muted-foreground/20 text-xs text-muted-foreground/60 hover:border-violet-500/50 hover:text-violet-500 transition-all cursor-pointer"
            >
              {restoreLoading ? <><Loader2 className="size-4 animate-spin" /> Memulihkan...</> : <><Upload className="size-4" /> Pilih File Backup</>}
            </label>
          </div>

          {/* Warning */}
          <div className="floating-card p-4 space-y-2 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-500/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                Backup mencakup semua data bisnis, dompet, dan pengaturan. Restore akan menimpa data yang ada.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TAB 6: SINKRONISASI MULTI-DEVICE
          ══════════════════════════════════════════════════ */}
      {tab === "sinkron" && (
        <div className="space-y-5">
          {/* Export */}
          <div className="floating-card p-5 space-y-4">
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <RefreshCw className="size-3.5 text-violet-500" /> Export / Kirim Data
            </p>
            <p className="text-[10px] text-muted-foreground/60">
              Generate kode sinkronisasi untuk dibagikan ke perangkat lain. Kode berisi semua data pengaturan bisnis.
            </p>
            <button
              onClick={() => {
                setSyncGenerating(true);
                try {
                  const code = generateSyncCode();
                  setSyncCode(code);
                  toast.success("Kode sinkronisasi berhasil dibuat");
                } catch {
                  toast.error("Gagal membuat kode sinkronisasi");
                }
                setSyncGenerating(false);
              }}
              disabled={syncGenerating}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-bold shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {syncGenerating ? <><Loader2 className="size-4 animate-spin" /> Memproses...</> : <><RefreshCw className="size-4" /> Generate Kode Sinkronisasi</>}
            </button>
            {syncCode && (
              <div className="space-y-3">
                <textarea
                  readOnly
                  value={syncCode}
                  rows={4}
                  className="input-premium w-full text-[9px] font-mono break-all resize-none"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(syncCode);
                    toast.success("Kode berhasil disalin");
                  }}
                  className="w-full py-2 rounded-xl bg-emerald-500/10 text-emerald-600 text-[10px] font-semibold hover:bg-emerald-500/20 transition-all border border-emerald-500/20"
                >
                  Salin Kode
                </button>
                <p className="text-[9px] text-muted-foreground/40 text-center">
                  Bagikan kode ini ke perangkat lain. Kode hanya berlaku untuk sesi ini.
                </p>
              </div>
            )}
          </div>

          {/* Import */}
          <div className="floating-card p-5 space-y-4">
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <Upload className="size-3.5 text-violet-500" /> Import / Terima Data
            </p>
            <p className="text-[10px] text-muted-foreground/60">
              Tempel kode sinkronisasi dari perangkat lain untuk menerapkan data yang sama.
            </p>
            <textarea
              value={importCode}
              onChange={(e) => setImportCode(e.target.value)}
              placeholder="Tempel kode sinkronisasi di sini..."
              rows={4}
              className="input-premium w-full text-[9px] font-mono break-all resize-none"
            />
            <button
              onClick={() => {
                if (!importCode.trim()) { toast.error("Masukkan kode sinkronisasi terlebih dahulu"); return; }
                setSyncApplying(true);
                try {
                  const result = applySyncCode(importCode.trim());
                  if (result.success) {
                    setLastSyncTimestamp();
                    toast.success(result.message);
                    setTimeout(() => window.location.reload(), 1500);
                  } else {
                    toast.error(result.message);
                  }
                } catch {
                  toast.error("Gagal menerapkan sinkronisasi");
                }
                setSyncApplying(false);
              }}
              disabled={syncApplying || !importCode.trim()}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-bold shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {syncApplying ? <><Loader2 className="size-4 animate-spin" /> Menerapkan...</> : <><Upload className="size-4" /> Terapkan Sinkronisasi</>}
            </button>
            <p className="text-[9px] text-amber-600 dark:text-amber-400 flex items-start gap-1.5">
              <AlertTriangle className="size-3 shrink-0 mt-0.5" />
              <span>Ini akan menimpa semua data yang ada di perangkat ini.</span>
            </p>
          </div>

          {/* Storage Health */}
          <div className="floating-card p-5 space-y-3">
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <Database className="size-3.5 text-violet-500" /> Kesehatan Penyimpanan
            </p>
            <div className="space-y-2 text-[10px]">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground/70">Status Persistency</span>
                <span className={`font-semibold ${storagePersisted ? "text-emerald-500" : "text-amber-500"}`}>
                  {storagePersisted ? "Aman (Permanen)" : "Tidak Permanen"}
                </span>
              </div>
              {!storagePersisted && (
                <button onClick={handleRequestPersist}
                  className="w-full py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-[9px] font-semibold hover:bg-emerald-500/20 transition-colors"
                >
                  Aktifkan Penyimpanan Permanen
                </button>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground/70">Kapasitas Terpakai</span>
                <span className="font-medium tabular-nums">{formatBytes(storageUsage.usage)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground/70">Total Kapasitas</span>
                <span className="font-medium tabular-nums">{formatBytes(storageUsage.quota)}</span>
              </div>
              <div className="h-2 rounded-full bg-muted/50 overflow-hidden mt-1">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    storageUsage.percentUsed > 80
                      ? "bg-rose-500"
                      : storageUsage.percentUsed > 50
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(storageUsage.percentUsed, 100)}%` }}
                />
              </div>
              <p className="text-[9px] text-muted-foreground/40 text-center">
                {storageUsage.percentUsed.toFixed(1)}% dari total kapasitas
              </p>
            </div>
          </div>

          {/* Info */}
          <div className="floating-card p-5 space-y-3 bg-gradient-to-br from-violet-500/5 to-purple-500/5 border border-violet-500/10">
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <Database className="size-3.5 text-violet-500" /> Status Sinkronisasi
            </p>
            <div className="space-y-2 text-[10px] text-muted-foreground/70">
              <div className="flex justify-between">
                <span>Total data tersimpan</span>
                <span className="font-medium tabular-nums">{estimateLocalStorageUsage()}</span>
              </div>
              <div className="flex justify-between">
                <span>Sinkronisasi terakhir</span>
                <span className="font-medium tabular-nums">{getLastSyncTimestamp() ? new Date(getLastSyncTimestamp()!).toLocaleString("id-ID") : "Belum pernah"}</span>
              </div>
              <div className="flex justify-between">
                <span>Ukuran kode saat ini</span>
                <span className="font-medium tabular-nums">{(getSyncCodeSize() / 1024).toFixed(1)} KB</span>
              </div>
            </div>
            <p className="text-[9px] text-muted-foreground/40 italic">
              Semua data disimpan secara lokal di perangkat. Sinkronasi hanya mentransfer data antar perangkat.
            </p>
          </div>
        </div>
      )}

      {/* ═══════════════ RESET DATA ═══════════════ */}
      <div className="floating-card p-5 space-y-3 border border-rose-500/20 bg-rose-500/5">
        <button
          type="button"
          onClick={() => setShowReset(!showReset)}
          className="w-full flex items-center justify-between text-left"
        >
          <p className="text-xs font-semibold flex items-center gap-1.5 text-rose-600">
            <Trash2 className="size-3.5" /> Reset Data
          </p>
          <span className="text-[10px] text-muted-foreground/50">{showReset ? "Tutup" : "Buka"}</span>
        </button>
        {showReset && (
          <div className="space-y-3 pt-2 border-t border-rose-500/10">
            <p className="text-[10px] text-muted-foreground/60">
              Hapus semua data bisnis termasuk dompet, transaksi, pelanggan, dan pengaturan. 
              Tindakan ini tidak bisa dibatalkan.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  if (confirm("Hapus semua data bisnis? Data tidak bisa dikembalikan.")) {
                    localStorage.removeItem("mmcbank-business-store-v3");
                    toast.success("Data bisnis direset. Halaman akan dimuat ulang...");
                    setTimeout(() => window.location.reload(), 1000);
                  }
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white text-xs font-bold shadow-lg shadow-rose-500/20 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all"
              >
                <Trash2 className="size-3.5 inline mr-1" /> Reset Semua Data Bisnis
              </button>
              <button
                onClick={() => {
                  if (confirm("Reset semua data PIN & pengguna? PIN default 123456 akan dikembalikan.")) {
                    localStorage.removeItem("mmcbank-role-store");
                    toast.success("Data pengguna direset. Halaman akan dimuat ulang...");
                    setTimeout(() => window.location.reload(), 1000);
                  }
                }}
                className="w-full py-2 rounded-xl bg-rose-500/10 text-rose-600 text-[10px] font-semibold hover:bg-rose-500/20 transition-colors"
              >
                Reset Data Pengguna (PIN)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
