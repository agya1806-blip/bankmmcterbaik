"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useWorkspaceStore } from "@/engines/workspace/workspace-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toCanvas } from "qrcode";
import {
  Download, Copy, Check, QrCode, Plus, X, Trash2, Search, History
} from "lucide-react";
import toast from "react-hot-toast";

interface QrisItem {
  id: string;
  amount: number;
  description: string;
  customerName: string;
  status: "paid" | "unpaid";
  createdAt: number;
}

export default function QrisPage() {
  const { activeWorkspace } = useWorkspaceStore();
  const qrRef = useRef<HTMLDivElement>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [history, setHistory] = useState<QrisItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);

  const qrisData = activeWorkspace
    ? `QRIS:${activeWorkspace.name}:${amount || "0"}:${description || "Pembayaran"}:${customerName || "Pelanggan"}`
    : "";

  useEffect(() => {
    if (qrCanvasRef.current && qrisData) {
      toCanvas(qrCanvasRef.current, qrisData, { width: 180, margin: 2 });
    }
  }, [qrisData]);

  useEffect(() => {
    if (activeWorkspace) {
      const saved = localStorage.getItem(`qris_${activeWorkspace.id}`);
      if (saved) setHistory(JSON.parse(saved));
    }
  }, [activeWorkspace]);

  const saveHistory = useCallback((items: QrisItem[]) => {
    if (activeWorkspace) {
      localStorage.setItem(`qris_${activeWorkspace.id}`, JSON.stringify(items));
    }
    setHistory(items);
  }, [activeWorkspace]);

  const handleDownload = () => {
    if (!qrCanvasRef.current) return;
    const canvas = qrCanvasRef.current;
    const png = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.download = `qris-${activeWorkspace?.name || "payment"}.png`;
    a.href = png;
    a.click();
  };

  const handleCopy = () => {
    if (!qrisData) return;
    navigator.clipboard.writeText(qrisData);
    setCopied(true);
    toast.success("QRIS data copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddPayment = () => {
    if (!amount || !activeWorkspace) return;
    const item: QrisItem = {
      id: Date.now().toString(),
      amount: Number(amount),
      description: description || "Pembayaran QRIS",
      customerName: customerName || "Pelanggan",
      status: "unpaid",
      createdAt: Date.now(),
    };
    saveHistory([item, ...history]);
    setAmount("");
    setDescription("");
    setCustomerName("");
    setShowForm(false);
    toast.success("Payment request created");
  };

  const markPaid = (id: string) => {
    saveHistory(history.map((h) => (h.id === id ? { ...h, status: "paid" as const } : h)));
    toast.success("Marked as paid");
  };

  const deleteItem = (id: string) => {
    saveHistory(history.filter((h) => h.id !== id));
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
          <h1 className="text-xl font-bold font-heading">QRIS</h1>
          <p className="text-sm text-muted-foreground/60">Terima pembayaran QRIS</p>
        </div>
        <div className="flex items-center justify-center size-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/20">
          <QrCode className="size-6 text-white" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="floating-card p-4">
          <p className="text-xs text-muted-foreground/60 mb-1">Tertagih</p>
          <p className="text-lg font-bold text-amber-600">
            {activeWorkspace?.currency || "IDR"} {totalPending.toLocaleString()}
          </p>
        </div>
        <div className="floating-card p-4">
          <p className="text-xs text-muted-foreground/60 mb-1">Diterima</p>
          <p className="text-lg font-bold text-emerald-600">
            {activeWorkspace?.currency || "IDR"} {totalPaid.toLocaleString()}
          </p>
        </div>
      </div>

      {/* QR Code Display */}
      {activeWorkspace && (
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-center">
            <p className="text-white/90 text-sm font-medium mb-1">{activeWorkspace.name}</p>
            <p className="text-white/60 text-xs">QRIS Pembayaran</p>
          </div>
          <CardContent className="p-6 flex flex-col items-center">
            <div ref={qrRef} className="bg-white p-4 rounded-2xl shadow-inner mb-4">
              {qrisData ? (
                <canvas ref={qrCanvasRef} width={180} height={180} />
              ) : (
                <div className="size-[180px] flex items-center justify-center bg-muted rounded-lg">
                  <QrCode className="size-12 text-muted-foreground/30" />
                </div>
              )}
            </div>
            {amount && (
              <p className="text-2xl font-bold font-heading mb-1">
                {activeWorkspace.currency} {Number(amount).toLocaleString()}
              </p>
            )}
            {description && <p className="text-sm text-muted-foreground/70 mb-3">{description}</p>}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload} disabled={!qrisData}>
                <Download className="size-3.5" /> Simpan
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopy} disabled={!qrisData}>
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied ? "Tersalin" : "Salin"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* New Payment Button */}
      <Button className="w-full" onClick={() => setShowForm(!showForm)}>
        <Plus className="size-4" /> {showForm ? "Batal" : "Buat Pembayaran QRIS"}
      </Button>

      {/* Payment Form */}
      {showForm && (
        <div className="floating-card p-4 space-y-3 animate-slide-up">
          <div>
            <label className="text-xs font-medium text-muted-foreground/70 mb-1 block">Jumlah</label>
            <Input
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground/70 mb-1 block">Deskripsi</label>
            <Input
              placeholder="Pembayaran..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground/70 mb-1 block">Nama Pelanggan</label>
            <Input
              placeholder="Pelanggan"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>
          <Button onClick={handleAddPayment} disabled={!amount} className="w-full">
            <QrCode className="size-4" /> Generate QRIS
          </Button>
        </div>
      )}

      {/* History */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <History className="size-4 text-muted-foreground/60" />
          <h2 className="text-sm font-semibold">Riwayat Pembayaran</h2>
        </div>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
          <input
            type="text"
            placeholder="Cari..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-xl bg-muted/50 border border-border/30 text-sm focus:outline-none focus:border-blue-500/50"
          />
        </div>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="size-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
              <QrCode className="size-5 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground/60">Belum ada pembayaran QRIS</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((item) => (
              <div key={item.id} className="floating-card p-3 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`status-dot ${item.status === "paid" ? "status-dot-active" : "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]"}`} />
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
                      <Check className="size-3.5" />
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
    </div>
  );
}
