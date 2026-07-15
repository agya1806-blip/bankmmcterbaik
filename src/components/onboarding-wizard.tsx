"use client";

import { useState, useRef } from "react";
import { useOnboardingStore } from "@/store/useOnboardingStore";
import { useBusinessStore, type WalletTipe } from "@/store/useBusinessStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Wallet,
  CreditCard,
  Check,
  ChevronLeft,
  Upload,
  Store,
  MapPin,
  Phone,
  Landmark,
  Banknote,
  QrCode,
  User,
} from "lucide-react";

const WALLET_TIPE_LABEL: Record<WalletTipe, string> = {
  KasTunai: "Tunai",
  Bank: "Bank",
  EWallet: "E-Wallet",
};

function genId(): string {
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function OnboardingWizard() {
  const setCompleted = useOnboardingStore((s) => s.setCompleted);
  const updateProfile = useBusinessStore((s) => s.updateProfile);
  const addWallet = useBusinessStore((s) => s.addWallet);
  const addPaymentMethod = useBusinessStore((s) => s.addPaymentMethod);

  const [step, setStep] = useState(0);

  const [namaUsaha, setNamaUsaha] = useState("");
  const [alamat, setAlamat] = useState("");
  const [noWhatsapp, setNoWhatsapp] = useState("628");
  const [logoPreview, setLogoPreview] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [walletNama, setWalletNama] = useState("Kas Utama");
  const [walletTipe, setWalletTipe] = useState<WalletTipe>("KasTunai");
  const [walletSaldo, setWalletSaldo] = useState("0");

  const [pmBank, setPmBank] = useState("");
  const [pmRekening, setPmRekening] = useState("");
  const [pmNama, setPmNama] = useState("");
  const [pmQris, setPmQris] = useState("");
  const qrisInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataURL(file);
    setLogoPreview(dataUrl);
  };

  const handleQrisUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataURL(file);
    setPmQris(dataUrl);
  };

  const canGoNext = () => {
    if (step === 0) return namaUsaha.trim().length > 0;
    return true;
  };

  const handleNext = () => {
    if (!canGoNext()) return;
    setStep((s) => Math.min(s + 1, 2));
  };

  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleFinish = () => {
    updateProfile({
      namaUsaha: namaUsaha || "Toko Saya",
      alamat,
      noWhatsapp,
      logoUrl: logoPreview,
    });

    if (walletNama.trim()) {
      addWallet({
        id: genId(),
        namaDompet: walletNama,
        tipe: walletTipe,
        saldo: Math.max(0, parseInt(walletSaldo) || 0),
        catatan: "",
      });
    }

    if (pmBank.trim() && pmRekening.trim()) {
      addPaymentMethod({
        id: genId(),
        namaMetode: pmBank,
        bankName: pmBank,
        accountNo: pmRekening,
        accountName: pmNama,
        qrisImageUrl: pmQris,
        isEnabled: true,
      });
    }

    setCompleted();
  };

  const steps = [
    { icon: Building2, label: "Profil Toko" },
    { icon: Wallet, label: "Dompet" },
    { icon: CreditCard, label: "Pembayaran" },
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950">
      <div className="w-full max-w-lg mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex size-16 rounded-2xl bg-white/10 backdrop-blur-sm items-center justify-center text-white font-bold text-2xl shadow-2xl mb-4 ring-1 ring-white/20">
            M
          </div>
          <h1 className="text-2xl font-bold text-white">Selamat Datang di MMCBank</h1>
          <p className="text-white/60 mt-1">Atur toko Anda dalam 3 langkah mudah</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 sm:p-8">
          <div className="flex items-center justify-center gap-2 mb-8">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                    i === step
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                      : i < step
                      ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                  }`}
                >
                  <s.icon className="size-3.5" />
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`w-8 h-px ${
                      i < step
                        ? "bg-emerald-400"
                        : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {step === 0 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-300">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Store className="size-5 text-emerald-500" />
                  Profil Toko
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Informasi dasar usaha Anda
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nama">Nama Toko / Usaha *</Label>
                <Input
                  id="nama"
                  placeholder="Contoh: Toko Serba Ada"
                  value={namaUsaha}
                  onChange={(e) => setNamaUsaha(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label>Logo Toko</Label>
                <div className="flex items-center gap-4">
                  {logoPreview ? (
                    <div className="relative size-16 rounded-xl overflow-hidden ring-2 ring-emerald-200 dark:ring-emerald-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="size-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setLogoPreview("")}
                        className="absolute -top-1 -right-1 size-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center shadow"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="size-16 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors"
                    >
                      <Upload className="size-6 text-gray-400" />
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                  <span className="text-xs text-gray-400">
                    PNG, JPG, WEBP. Maks 2MB.
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alamat">
                  <MapPin className="size-3.5 inline mr-1 text-gray-400" />
                  Alamat
                </Label>
                <textarea
                  id="alamat"
                  placeholder="Jl. Contoh No. 123, Kota, Provinsi"
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  rows={3}
                  className="input-premium w-full resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wa">
                  <Phone className="size-3.5 inline mr-1 text-gray-400" />
                  No. WhatsApp
                </Label>
                <Input
                  id="wa"
                  type="tel"
                  placeholder="6281234567890"
                  value={noWhatsapp}
                  onChange={(e) => setNoWhatsapp(e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-300">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Wallet className="size-5 text-emerald-500" />
                  Dompet Pertama
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Tambahkan kas atau dompet untuk mencatat keuangan
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wallet-nama">Nama Dompet</Label>
                <Input
                  id="wallet-nama"
                  placeholder="Kas Utama"
                  value={walletNama}
                  onChange={(e) => setWalletNama(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wallet-tipe">Jenis Dompet</Label>
                <Select
                  value={walletTipe}
                  onValueChange={(v) => setWalletTipe(v as WalletTipe)}
                >
                  <SelectTrigger id="wallet-tipe" className="w-full">
                    <SelectValue>
                      {walletTipe && (
                        <span className="flex items-center gap-2">
                          <Landmark className="size-4 text-muted-foreground" />
                          {WALLET_TIPE_LABEL[walletTipe]}
                        </span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(WALLET_TIPE_LABEL) as [WalletTipe, string][]).map(
                      ([key, label]) => (
                        <SelectItem key={key} value={key}>
                          <span className="flex items-center gap-2">
                            <Landmark className="size-4" />
                            {label}
                          </span>
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wallet-saldo">
                  <Banknote className="size-3.5 inline mr-1 text-gray-400" />
                  Saldo Awal
                </Label>
                <Input
                  id="wallet-saldo"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={walletSaldo}
                  onChange={(e) => setWalletSaldo(e.target.value)}
                />
              </div>

              <p className="text-xs text-gray-400 dark:text-gray-500">
                Bisa diisi nanti. Lewati jika belum ingin menambahkan dompet.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-300">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="size-5 text-emerald-500" />
                  Metode Pembayaran
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Tambahkan rekening atau QRIS untuk pembayaran
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pm-bank">Nama Bank / Metode</Label>
                <Input
                  id="pm-bank"
                  placeholder="Contoh: Bank BCA, GoPay, Dana"
                  value={pmBank}
                  onChange={(e) => setPmBank(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pm-rekening">Nomor Rekening / Akun</Label>
                <Input
                  id="pm-rekening"
                  placeholder="1234567890"
                  value={pmRekening}
                  onChange={(e) => setPmRekening(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pm-nama">
                  <User className="size-3.5 inline mr-1 text-gray-400" />
                  Atas Nama
                </Label>
                <Input
                  id="pm-nama"
                  placeholder="Nama pemilik rekening"
                  value={pmNama}
                  onChange={(e) => setPmNama(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>
                  <QrCode className="size-3.5 inline mr-1 text-gray-400" />
                  Upload QRIS (opsional)
                </Label>
                <div className="flex items-center gap-3">
                  {pmQris ? (
                    <div className="relative size-16 rounded-xl overflow-hidden ring-2 ring-emerald-200 dark:ring-emerald-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={pmQris}
                        alt="QRIS preview"
                        className="size-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setPmQris("")}
                        className="absolute -top-1 -right-1 size-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center shadow"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => qrisInputRef.current?.click()}
                      className="size-16 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors"
                    >
                      <Upload className="size-6 text-gray-400" />
                    </div>
                  )}
                  <input
                    ref={qrisInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleQrisUpload}
                  />
                  <span className="text-xs text-gray-400">
                    PNG, JPG, WEBP
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-400 dark:text-gray-500">
                Bisa diisi nanti. Lewati jika belum ingin menambahkan.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
            <div>
              {step > 0 ? (
                <Button variant="outline" size="sm" onClick={handleBack}>
                  <ChevronLeft className="size-4" />
                  Kembali
                </Button>
              ) : (
                <div />
              )}
            </div>

            <div className="flex items-center gap-2">
              {step < 2 ? (
                <Button size="sm" onClick={handleNext} disabled={!canGoNext()}>
                  Lanjut
                </Button>
              ) : (
                <Button size="sm" onClick={handleFinish}>
                  <Check className="size-4" />
                  Selesai
                </Button>
              )}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-white/40 mt-4">
          Data disimpan aman di perangkat Anda.
        </p>
      </div>
    </div>
  );
}
