"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useWorkspaceStore } from "@/engines/workspace/workspace-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  UploadCloud, QrCode, Trash2, CheckCircle, Search, Plus
} from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "@/lib/i18n";
import {
  createQrisPayment,
  updateQrisPayment,
  deleteQrisPayment,
  getQrisPaymentsByWorkspace,
} from "@/lib/db";
import type { QrisPayment } from "@/lib/db";

export default function QrisPage() {
  const { t } = useTranslation();
  const { activeWorkspace } = useWorkspaceStore();
  const [tab, setTab] = useState<"saya" | "riwayat">("saya");
  const [image, setImage] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [history, setHistory] = useState<QrisPayment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImage = useCallback((file: File) => {
    if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
      toast.error("Hanya file PNG/JPG yang diperbolehkan");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImage(file);
  }, [handleImage]);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  useEffect(() => {
    if (activeWorkspace) {
      getQrisPaymentsByWorkspace(activeWorkspace.id).then(setHistory);
    }
  }, [activeWorkspace]);

  const handleSave = async () => {
    if (!activeWorkspace || !amount) return;
    const item: QrisPayment = {
      id: Date.now().toString(),
      workspaceId: activeWorkspace.id,
      amount: Number(amount),
      description: description || "Pembayaran QRIS",
      customerName: customerName || "Pelanggan",
      status: "unpaid",
      createdAt: Date.now(),
    };
    await createQrisPayment(item);
    setHistory((prev) => [item, ...prev]);
    setAmount("");
    setDescription("");
    setCustomerName("");
    setImage(null);
    toast.success("QRIS berhasil disimpan");
  };

  const markPaid = async (id: string) => {
    const item = history.find((h) => h.id === id);
    if (!item) return;
    const updated = { ...item, status: "paid" as const };
    await updateQrisPayment(updated);
    setHistory((prev) => prev.map((h) => (h.id === id ? updated : h)));
    toast.success("Status diperbarui");
  };

  const deleteItem = async (id: string) => {
    await deleteQrisPayment(id);
    setHistory((prev) => prev.filter((h) => h.id !== id));
    toast.success("Dihapus");
  };

  const filtered = history.filter(
    (h) =>
      h.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPending = history.filter((h) => h.status === "unpaid").reduce((s, h) => s + h.amount, 0);
  const totalPaid = history.filter((h) => h.status === "paid").reduce((s, h) => s + h.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in max-w-lg mx-auto pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-heading">{t("qris.title") || "QRIS"}</h1>
          <p className="text-sm text-muted-foreground/60">{t("qris.subtitle") || "Terima pembayaran QRIS"}</p>
        </div>
        <div className="flex items-center justify-center size-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/20">
          <QrCode className="size-6 text-white" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-muted/40 p-1 rounded-xl">
        <button
          onClick={() => setTab("saya")}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            tab === "saya" ? "bg-white dark:bg-gray-800 shadow-sm" : "text-muted-foreground/60"
          }`}
        >
          {t("qris.myQris") || "QRIS Saya"}
        </button>
        <button
          onClick={() => setTab("riwayat")}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            tab === "riwayat" ? "bg-white dark:bg-gray-800 shadow-sm" : "text-muted-foreground/60"
          }`}
        >
          {t("qris.history") || "Riwayat"}
        </button>
      </div>

      {/* QRIS Saya Tab */}
      {tab === "saya" && (
        <div className="space-y-4">
          {/* Image Upload / Display */}
          <div className="premium-card p-4">
            {image ? (
              <div className="flex flex-col items-center">
                <div className="w-full max-w-sm bg-white dark:bg-card rounded-2xl p-4 shadow-inner mb-4">
                  <img src={image} alt="QRIS" className="w-full h-auto rounded-lg" />
                </div>
                <Button variant="outline" size="sm" onClick={() => setImage(null)}>
                  {t("qris.changeImage") || "Ganti Gambar"}
                </Button>
              </div>
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileRef.current?.click()}
                className={`flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${
                  dragging
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                    : "border-border/40 hover:border-blue-400/50 hover:bg-muted/30"
                }`}
              >
                <UploadCloud className="size-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium text-muted-foreground/70">
                  {t("qris.uploadLabel") || "Upload Gambar QRIS"}
                </p>
                <p className="text-xs text-muted-foreground/40 mt-1">
                  {t("qris.uploadHint") || "PNG / JPG — klik atau drag & drop"}
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImage(file);
                  }}
                />
              </div>
            )}
          </div>

          {/* Amount & Description */}
          <div className="premium-card p-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground/70 mb-1 block">
                {t("qris.amount") || "Jumlah"}
              </label>
              <Input
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground/70 mb-1 block">
                {t("qris.description") || "Deskripsi"}
              </label>
              <Input
                placeholder={t("qris.descriptionPlaceholder") || "Pembayaran..."}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground/70 mb-1 block">
                {t("qris.customerName") || "Nama Pelanggan"}
              </label>
              <Input
                placeholder={t("qris.customerPlaceholder") || "Pelanggan"}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <Button onClick={handleSave} disabled={!amount || !image} className="w-full">
              <Plus className="size-4" /> {t("qris.save") || "Simpan"}
            </Button>
          </div>
        </div>
      )}

      {/* Riwayat Tab */}
      {tab === "riwayat" && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="floating-card p-4">
              <p className="text-xs text-muted-foreground/60 mb-1">{t("qris.totalPending") || "Tertagih"}</p>
              <p className="text-lg font-bold text-amber-600">
                {activeWorkspace?.currency || "IDR"} {totalPending.toLocaleString()}
              </p>
            </div>
            <div className="floating-card p-4">
              <p className="text-xs text-muted-foreground/60 mb-1">{t("qris.totalPaid") || "Diterima"}</p>
              <p className="text-lg font-bold text-emerald-600">
                {activeWorkspace?.currency || "IDR"} {totalPaid.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
            <input
              type="text"
              placeholder={t("qris.search") || "Cari pelanggan atau deskripsi..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-xl bg-muted/50 border border-border/30 text-sm focus:outline-none focus:border-blue-500/50"
            />
          </div>

          {/* List */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="size-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
                <QrCode className="size-5 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground/60">
                {t("qris.noHistory") || "Belum ada pembayaran QRIS"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((item) => (
                <div key={item.id} className="floating-card p-3 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`status-dot ${
                          item.status === "paid"
                            ? "status-dot-active"
                            : "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]"
                        }`}
                      />
                      <p className="text-sm font-medium truncate">{item.customerName}</p>
                    </div>
                    <p className="text-xs text-muted-foreground/60 truncate">{item.description}</p>
                    <p className="text-xs font-semibold mt-0.5">
                      {activeWorkspace?.currency || "IDR"} {item.amount.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {item.status === "unpaid" && (
                      <Button variant="outline" size="sm" onClick={() => markPaid(item.id)}>
                        <CheckCircle className="size-3.5" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => deleteItem(item.id)}>
                      <Trash2 className="size-3.5 text-muted-foreground/60" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
