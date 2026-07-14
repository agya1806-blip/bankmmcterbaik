"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Settings, ArrowLeft, Save, Image, X, Upload, Building2,
  Phone, MapPin, List, Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useProfilUsahaStore } from "../store/useProfilUsahaStore";
import { CardSkeleton } from "@/components/ui/skeleton";
import { saveImage, getImage, deleteImage, isRefKey } from "@/lib/image-store";
import { ImgFromIdb } from "@/components/img-from-idb";

export default function PengaturanProfil() {
  const router = useRouter();
  const { profil, setLogo, setNama, setAlamat, setNoWA, tambahSubLayanan, hapusSubLayanan, resetProfil } = useProfilUsahaStore();

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newLayanan, setNewLayanan] = useState("");
  const [previewLogo, setPreviewLogo] = useState(profil.logo);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  /* Resolve logo key from IDB on mount */
  useEffect(() => {
    if (profil.logo && isRefKey(profil.logo)) {
      getImage(profil.logo).then((img) => { if (img) setPreviewLogo(img); }).catch(() => {});
    }
  }, []);

  const handleLogoUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Maksimal ukuran logo 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const dataUrl = ev.target?.result as string;
        if (dataUrl) {
          await saveImage("logo", dataUrl);
          setPreviewLogo(dataUrl);
          setLogo("logo");
          toast.success("Logo berhasil diupload");
        }
      };
      reader.readAsDataURL(file);
    },
    [setLogo]
  );

  const handleHapusLogo = useCallback(async () => {
    await deleteImage("logo").catch(() => {});
    setPreviewLogo("");
    setLogo("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.success("Logo dihapus");
  }, [setLogo]);

  const handleTambahLayanan = useCallback(() => {
    const trimmed = newLayanan.trim();
    if (!trimmed) return;
    if (profil.subLayanan.includes(trimmed)) {
      toast.error("Layanan sudah ada");
      return;
    }
    tambahSubLayanan(trimmed);
    setNewLayanan("");
  }, [newLayanan, profil.subLayanan, tambahSubLayanan]);

  const handleSimpan = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      /* Simulasi simpan ke persist store */
      await new Promise((r) => setTimeout(r, 600));
      setLoading(false);
      toast.success("Profil usaha berhasil disimpan");
    },
    []
  );

  if (!mounted) return <CardSkeleton />;

  return (
    <div className="max-w-2xl mx-auto pb-20 space-y-6 animate-fade-in">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/buku-usaha/percetakan/dashboard")}
            className="size-9 rounded-xl bg-muted/30 flex items-center justify-center hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="size-4 text-muted-foreground" />
          </button>
          <div className="size-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Settings className="size-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold font-heading">Pengaturan Profil Usaha</h2>
            <p className="text-[10px] text-muted-foreground/60">Data ini akan tampil di Dashboard, Laporan &amp; Invoice</p>
          </div>
        </div>
        <button
          onClick={() => {
            resetProfil();
            setPreviewLogo("");
            toast.success("Profil direset ke default");
          }}
          className="px-2.5 py-1.5 rounded-lg text-[9px] font-medium text-rose-500 hover:bg-rose-500/10 transition-colors"
        >
          Reset
        </button>
      </div>

      <form onSubmit={handleSimpan} className="space-y-5">
        {/* ─── Logo ─── */}
        <div className="floating-card p-5 space-y-3">
          <p className="text-xs font-semibold flex items-center gap-1.5">
            <Image className="size-3.5 text-indigo-500" /> Logo Usaha
          </p>
          <div className="flex items-center gap-4">
            <div className="size-20 rounded-2xl border-2 border-dashed border-muted-foreground/20 flex items-center justify-center overflow-hidden bg-muted/10 shrink-0">
              {previewLogo ? (
                <ImgFromIdb src={previewLogo} alt="Logo" className="size-full object-contain p-1" />
              ) : (
                <Building2 className="size-8 text-muted-foreground/30" />
              )}
            </div>
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
                id="logo-upload"
              />
              <label
                htmlFor="logo-upload"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-semibold hover:bg-indigo-500/20 transition-colors cursor-pointer"
              >
                <Upload className="size-3.5" /> Upload Logo
              </label>
              {previewLogo && (
                <button
                  type="button"
                  onClick={handleHapusLogo}
                  className="block text-[9px] text-rose-500 hover:text-rose-600 transition-colors"
                >
                  Hapus logo
                </button>
              )}
              <p className="text-[8px] text-muted-foreground/40">Format PNG/JPG, maks 2MB</p>
            </div>
          </div>
        </div>

        {/* ─── Identitas ─── */}
        <div className="floating-card p-5 space-y-4">
          <p className="text-xs font-semibold flex items-center gap-1.5">
            <Building2 className="size-3.5 text-indigo-500" /> Identitas Usaha
          </p>

          <div className="space-y-1">
            <label className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">Nama Usaha</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/40" />
              <input
                type="text"
                value={profil.nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="cth: Mughis Group"
                className="input-premium w-full text-xs pl-9"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">Alamat Lengkap</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 size-3.5 text-muted-foreground/40" />
              <textarea
                value={profil.alamat}
                onChange={(e) => setAlamat(e.target.value)}
                placeholder="cth: Samalanga, Bireuen, Aceh"
                rows={3}
                className="input-premium w-full text-xs pl-9 resize-none"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">Nomor Hubungi / WhatsApp</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/40" />
              <input
                type="tel"
                value={profil.noWA}
                onChange={(e) => setNoWA(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="cth: 085217706587"
                maxLength={15}
                className="input-premium w-full text-xs pl-9 tabular-nums"
                required
              />
            </div>
          </div>
        </div>

        {/* ─── Sub-Layanan ─── */}
        <div className="floating-card p-5 space-y-3">
          <p className="text-xs font-semibold flex items-center gap-1.5">
            <List className="size-3.5 text-indigo-500" /> Sub-titel / Jenis Layanan
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              value={newLayanan}
              onChange={(e) => setNewLayanan(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleTambahLayanan(); } }}
              placeholder="cth: Jual Laptop Baru & Bekas"
              className="input-premium flex-1 text-xs"
            />
            <button
              type="button"
              onClick={handleTambahLayanan}
              className="px-3 py-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-semibold hover:bg-indigo-500/20 transition-colors shrink-0"
            >
              Tambah
            </button>
          </div>

          {profil.subLayanan.length === 0 ? (
            <p className="text-[10px] text-muted-foreground/30 py-2">Belum ada layanan. Tambahkan minimal satu.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {profil.subLayanan.map((item, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-muted/50 text-[10px] font-medium group"
                >
                  <span className="before:content-['•'] before:mr-1 before:text-indigo-400">{item}</span>
                  <button
                    type="button"
                    onClick={() => hapusSubLayanan(i)}
                    className="size-3.5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all"
                  >
                    <X className="size-2.5 text-rose-500" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ─── Simpan ─── */}
        <button
          type="submit"
          disabled={loading || !profil.nama || !profil.alamat || !profil.noWA}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Menyimpan...
            </>
          ) : (
            <>
              <Save className="size-4" /> Simpan Perubahan
            </>
          )}
        </button>
      </form>

      {/* Preview card */}
      <div className="floating-card p-4 space-y-2 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border border-indigo-500/10">
        <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Live Preview</p>
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md overflow-hidden shrink-0">
            {previewLogo ? (
              <img src={previewLogo} alt="" className="size-full object-contain" />
            ) : (
              <Building2 className="size-5 text-white" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold font-heading truncate">{profil.nama || "Nama Usaha"}</p>
            <p className="text-[9px] text-muted-foreground/60 truncate">{profil.alamat || "Alamat"}</p>
            {profil.noWA && <p className="text-[9px] text-muted-foreground/40">WA: {profil.noWA}</p>}
          </div>
        </div>
        {profil.subLayanan.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {profil.subLayanan.map((s, i) => (
              <span key={i} className="text-[8px] text-muted-foreground/40 before:content-['•'] before:mr-0.5 before:text-indigo-400">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
