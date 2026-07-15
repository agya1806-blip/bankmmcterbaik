"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users, ArrowLeft, Star, Search, ChevronRight, X,
  Phone, ShoppingCart, Calendar, Upload,
} from "lucide-react";
import toast from "react-hot-toast";
import { useBusinessStore, CustomerRecord, BizUnit, BIZ_UNIT_LABELS } from "@/store/useBusinessStore";
import { CardSkeleton } from "@/components/ui/skeleton";

declare global {
  interface Navigator {
    contacts?: {
      select: (props: string[], opts: { multiple: boolean }) => Promise<Array<{ name?: string[]; tel?: string[] }>>;
    };
  }
}

function formatRupiah(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function getPoinBadge(poin: number) {
  if (poin >= 100) return "text-amber-500";
  if (poin >= 50) return "text-amber-400";
  if (poin >= 10) return "text-amber-300";
  return "text-muted-foreground/40";
}

export default function PelangganPage() {
  const router = useRouter();
  const store = useBusinessStore();
  const { customers, customerTransactions, addCustomerRecord, getCustomerByWA } = store;

  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [importing, setImporting] = useState(false);
  const [showPasteImport, setShowPasteImport] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const handlePasteImport = useCallback(() => {
    const lines = pasteText.split("\n").filter(Boolean);
    let added = 0;
    for (const line of lines) {
      const cleaned = line.trim();
      let nama = "";
      let noWA = "";
      const dashMatch = cleaned.match(/^(.+?)\s*[-–—]\s*(0?81\d[\d\s-]*)$/);
      const csvMatch = cleaned.match(/^(.+?)[,;]\s*(0?81\d[\d\s-]*)$/);
      if (dashMatch) {
        nama = dashMatch[1].trim();
        noWA = dashMatch[2].replace(/[\s-]/g, "");
      } else if (csvMatch) {
        nama = csvMatch[1].trim();
        noWA = csvMatch[2].replace(/[\s-]/g, "");
      } else if (/^0?81\d/.test(cleaned.replace(/[\s-]/g, ""))) {
        noWA = cleaned.replace(/[\s-]/g, "");
        nama = "Pelanggan";
      } else {
        continue;
      }
      if (noWA && !getCustomerByWA(noWA)) {
        addCustomerRecord({ nama, noWA });
        added++;
      }
    }
    toast.success(`${added} kontak diimpor dari teks`);
    setPasteText("");
    setShowPasteImport(false);
  }, [pasteText, addCustomerRecord, getCustomerByWA]);

  const importContacts = useCallback(async () => {
    if (typeof navigator === "undefined" || !("contacts" in navigator) || !navigator.contacts) {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".csv";
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const text = await file.text();
        const lines = text.split("\n").slice(1);
        let added = 0;
        for (const line of lines) {
          const [nama, noWA] = line.split(",").map((s) => s.trim());
          if (nama && noWA && !getCustomerByWA(noWA)) {
            addCustomerRecord({ nama, noWA });
            added++;
          }
        }
        toast.success(`${added} kontak diimpor dari CSV`);
      };
      input.click();
      return;
    }
    setImporting(true);
    try {
      const props = ["name", "tel"];
      const contacts = await navigator.contacts.select(props, { multiple: true });
      let added = 0;
      for (const c of contacts) {
        const nama = c.name?.[0] || "Kontak";
        const noWA = c.tel?.[0]?.replace(/[^0-9]/g, "");
        if (noWA && !getCustomerByWA(noWA)) {
          addCustomerRecord({ nama, noWA });
          added++;
        }
      }
      toast.success(`${added} kontak diimpor dari ponsel`);
    } catch {
      toast.error("Gagal mengimpor kontak");
    }
    setImporting(false);
  }, [addCustomerRecord, getCustomerByWA]);

  useEffect(() => setMounted(true), []);

  const filtered = useMemo(() => {
    if (!search) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) => c.nama.toLowerCase().includes(q) || c.noWA.includes(q)
    );
  }, [customers, search]);

  const customerTxs = useMemo(() => {
    if (!selectedCustomer) return [];
    return customerTransactions.filter((t) => t.customerId === selectedCustomer.id);
  }, [selectedCustomer, customerTransactions]);

  if (!mounted) return <div className="grid grid-cols-2 gap-4"><CardSkeleton /><CardSkeleton /></div>;

  return (
    <div className="max-w-3xl mx-auto pb-20 space-y-5 animate-fade-in">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/buku-usaha")}
            className="size-9 rounded-xl bg-muted/30 flex items-center justify-center hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="size-4 text-muted-foreground" />
          </button>
          <div className="size-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Users className="size-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold font-heading">Pelanggan & Riwayat</h2>
            <p className="text-[10px] text-muted-foreground/60">{customers.length} pelanggan terdaftar</p>
          </div>
        </div>
        <div className="text-[10px] text-muted-foreground/40 bg-muted/30 px-2.5 py-1 rounded-lg">
          {customers.length} total
        </div>
      </div>

      {/* ─── Search + Import ─── */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau nomor WA..."
            className="input-premium w-full text-xs pl-10" />
          {search && (
            <button onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <button onClick={importContacts} disabled={importing}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.97] transition-all disabled:opacity-50 shrink-0"
          title="Impor kontak dari ponsel atau CSV"
        >
          <Upload className="size-3.5" />
          <span className="hidden sm:inline">Impor Kontak</span>
        </button>
        <button onClick={() => setShowPasteImport(!showPasteImport)}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 active:scale-[0.97] transition-all shrink-0"
          title="Salin-tempel kontak massal"
        >
          <Upload className="size-3.5" />
          <span className="hidden sm:inline">Paste</span>
        </button>
      </div>

      {/* ─── Bulk Paste Import ─── */}
      {showPasteImport && (
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800/60 p-4 space-y-3">
          <p className="text-xs font-semibold">Salin-Tempel Massal</p>
          <p className="text-[10px] text-slate-400">
            Tempel daftar kontak. Format: <code className="text-emerald-400">Nama - 0812xxxx</code> atau <code className="text-emerald-400">Nama,0812xxxx</code> (satu per baris).
          </p>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={`Ahmad Fauzi - 081234567890\nSiti Nurhaliza, 081298765432\nBudi Santoso - 081111222333`}
            rows={5}
            className="input-premium w-full text-xs bg-slate-900/80 resize-none"
          />
          <div className="flex gap-2">
            <button onClick={handlePasteImport} disabled={!pasteText.trim()}
              className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold shadow-lg disabled:opacity-50"
            >
              Impor {pasteText.trim() ? `(${pasteText.split("\n").filter(Boolean).length} baris)` : ""}
            </button>
            <button onClick={() => { setShowPasteImport(false); setPasteText(""); }}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 text-xs font-semibold"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* ─── Stat cards ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="floating-card p-3 text-center">
          <p className="text-[10px] text-muted-foreground/60">Total Pelanggan</p>
          <p className="text-lg font-bold tabular-nums">{customers.length}</p>
        </div>
        <div className="floating-card p-3 text-center">
          <p className="text-[10px] text-muted-foreground/60">Total Transaksi</p>
          <p className="text-lg font-bold tabular-nums">{customers.reduce((s, c) => s + c.totalTransaksi, 0)}</p>
        </div>
        <div className="floating-card p-3 text-center">
          <p className="text-[10px] text-muted-foreground/60">Total Belanja</p>
          <p className="text-lg font-bold tabular-nums text-emerald-600">{formatRupiah(customers.reduce((s, c) => s + c.totalBelanja, 0))}</p>
        </div>
        <div className="floating-card p-3 text-center">
          <p className="text-[10px] text-muted-foreground/60">Total Poin</p>
          <p className="text-lg font-bold tabular-nums text-amber-500">{customers.reduce((s, c) => s + c.poin, 0)}</p>
        </div>
      </div>

      {/* ─── Customer List ─── */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="floating-card p-6 text-center">
            <Users className="size-10 mx-auto text-muted-foreground/20" />
            <p className="text-xs text-muted-foreground/40 mt-2">
              {search ? "Tidak ada pelanggan ditemukan" : "Belum ada pelanggan"}
            </p>
            {!search && (
              <p className="text-[10px] text-muted-foreground/30 mt-1">Pelanggan akan otomatis tercatat saat transaksi kasir</p>
            )}
          </div>
        ) : (
          filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCustomer(c)}
              className="w-full text-left floating-card p-4 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 flex items-center gap-4"
            >
              <div className="size-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                <Users className="size-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold truncate">{c.nama}</p>
                  {c.poin > 0 && (
                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-500 shrink-0">
                      <Star className="size-3 fill-amber-500" /> {c.poin}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground/50">
                  {c.noWA && <span className="flex items-center gap-1"><Phone className="size-3" /> {c.noWA}</span>}
                  <span className="flex items-center gap-1"><ShoppingCart className="size-3" /> {c.totalTransaksi} tx</span>
                  <span className="font-semibold text-emerald-600 tabular-nums">{formatRupiah(c.totalBelanja)}</span>
                </div>
                <p className="text-[9px] text-muted-foreground/30 mt-0.5">
                  Terakhir: {new Date(c.terakhirTransaksi).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground/30 shrink-0" />
            </button>
          ))
        )}
      </div>

      {/* ─── Modal Detail Pelanggan ─── */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedCustomer(null)} />
          <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-card rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-0">
            {/* Close */}
            <button onClick={() => setSelectedCustomer(null)}
              className="absolute top-3 right-3 size-8 rounded-xl bg-muted/30 flex items-center justify-center hover:bg-muted/50 transition-colors"
            >
              <X className="size-4 text-muted-foreground" />
            </button>

            {/* Customer Info */}
            <div className="flex items-center gap-4 mb-5">
              <div className="size-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Users className="size-6 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold font-heading">{selectedCustomer.nama}</h3>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground/50 mt-0.5">
                  {selectedCustomer.noWA && <span className="flex items-center gap-1"><Phone className="size-3" /> {selectedCustomer.noWA}</span>}
                  <span className="flex items-center gap-1"><Calendar className="size-3" /> Bergabung {new Date(selectedCustomer.createdAt).toLocaleDateString("id-ID")}</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              <div className="floating-card p-3 text-center">
                <p className="text-[9px] text-muted-foreground/50">Transaksi</p>
                <p className="text-base font-bold tabular-nums">{selectedCustomer.totalTransaksi}</p>
              </div>
              <div className="floating-card p-3 text-center">
                <p className="text-[9px] text-muted-foreground/50">Belanja</p>
                <p className="text-base font-bold tabular-nums text-emerald-600">{formatRupiah(selectedCustomer.totalBelanja)}</p>
              </div>
              <div className="floating-card p-3 text-center">
                <p className="text-[9px] text-muted-foreground/50">Poin</p>
                <p className={`text-base font-bold tabular-nums ${getPoinBadge(selectedCustomer.poin)} flex items-center justify-center gap-1`}>
                  <Star className={`size-4 ${selectedCustomer.poin > 0 ? "fill-amber-500" : ""}`} /> {selectedCustomer.poin}
                </p>
              </div>
            </div>

            {/* Riwayat Transaksi */}
            <div>
              <h4 className="text-xs font-semibold mb-3 flex items-center gap-1.5">
                <ShoppingCart className="size-3.5 text-amber-500" /> Riwayat Transaksi ({customerTxs.length})
              </h4>
              {customerTxs.length === 0 ? (
                <div className="floating-card p-4 text-center">
                  <p className="text-[10px] text-muted-foreground/30">Belum ada transaksi</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {customerTxs.map((tx) => (
                    <div key={tx.id} className="floating-card p-3 flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center shrink-0">
                        <ShoppingCart className="size-4 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium flex items-center gap-1.5">
                          {tx.invoiceId}
                          <span className="text-[9px] text-muted-foreground/40 px-1.5 py-0.5 rounded bg-muted/30">
                            {BIZ_UNIT_LABELS[tx.unit as BizUnit] || tx.unit}
                          </span>
                        </p>
                        <p className="text-[9px] text-muted-foreground/50 truncate">{tx.items}</p>
                        <p className="text-[9px] text-muted-foreground/30">{new Date(tx.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold tabular-nums text-emerald-600">{formatRupiah(tx.total)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
