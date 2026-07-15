"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  db,
  type BookOrBranch,
  type DbTransaction,
  type DbProduction,
  type ProductionStatus,
} from "@/lib/db-v4";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Search,
  TrendingUp,
  AlertCircle,
  Printer,
  Download,
  FileText,
  Calendar,
  ChevronRight,
  Receipt,
  Factory,
} from "lucide-react";
import toast from "react-hot-toast";
import { jsPDF } from "jspdf";

function formatRupiah(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}
function formatDate(d: string) {
  return d?.slice(0, 10) || "-";
}

interface Props {
  branch: BookOrBranch;
  branchLabel: string;
  showProduction?: boolean;
}

const PROD_LABELS: Record<ProductionStatus, string> = {
  antre: "Antrean",
  diproduksi: "Diproduksi",
  selesai: "Selesai",
};

const PROD_COLORS: Record<ProductionStatus, string> = {
  antre: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  diproduksi: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  selesai: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
};

export default function BranchTransactionHistory({ branch, branchLabel, showProduction }: Props) {
  const [mounted, setMounted] = useState(false);
  const [transactions, setTransactions] = useState<DbTransaction[]>([]);
  const [productions, setProductions] = useState<Map<string, DbProduction>>(new Map());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTx, setSelectedTx] = useState<DbTransaction | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => setMounted(true), []);

  const fetchData = useCallback(async () => {
    try {
      const [txs, prods] = await Promise.all([
        db.transactions.where("bookOrBranchId").equals(branch).reverse().toArray(),
        showProduction
          ? db.productions.where("bookOrBranchId").equals(branch).toArray()
          : Promise.resolve([] as DbProduction[]),
      ]);
      setTransactions(txs);
      setProductions(new Map(prods.map((p) => [p.transactionId, p])));
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [branch, showProduction]);

  useEffect(() => {
    if (!mounted) return;
    fetchData();
  }, [mounted, fetchData]);

  const filtered = useMemo(() => {
    let result = transactions;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.invoiceNumber?.toLowerCase().includes(q) ||
          t.customerNama?.toLowerCase().includes(q)
      );
    }
    if (dateFrom) result = result.filter((t) => (t.tanggal || "") >= dateFrom);
    if (dateTo) result = result.filter((t) => (t.tanggal || "").slice(0, 10) <= dateTo);
    return result;
  }, [transactions, search, dateFrom, dateTo]);

  const ringkasan = useMemo(() => {
    const totalQty = filtered.length;
    const totalOmzet = filtered
      .filter((t) => t.status !== "BATAL")
      .reduce((s, t) => s + t.totalBruto, 0);
    const totalPiutang = filtered
      .filter((t) => t.status === "DP")
      .reduce((s, t) => s + t.sisaTagihan, 0);
    return { totalQty, totalOmzet, totalPiutang };
  }, [filtered]);

  const updateProductionStatus = useCallback(
    async (txId: string, newStatus: ProductionStatus) => {
      const existing = productions.get(txId);
      try {
        if (existing) {
          await db.productions.update(existing.id, {
            status: newStatus,
            updatedAt: new Date().toISOString(),
          });
        } else {
          const tx = transactions.find((t) => t.id === txId);
          await db.productions.add({
            id: crypto.randomUUID(),
            bookOrBranchId: branch,
            transactionId: txId,
            invoiceNumber: tx?.invoiceNumber || "",
            status: newStatus,
            catatan: "",
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          });
        }
        await fetchData();
        toast.success(`Status produksi: ${PROD_LABELS[newStatus]}`);
      } catch {
        toast.error("Gagal update status produksi");
      }
    },
    [productions, branch, transactions, fetchData]
  );

  const exportPdf = useCallback(async () => {
    try {
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 15;
      const colX = [margin, margin + 40, margin + 70, margin + 115, margin + 160];
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(`Laporan Transaksi - ${branchLabel}`, margin, 18);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Dicetak: ${new Date().toLocaleDateString("id-ID", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}`,
        pageW - margin,
        18,
        { align: "right" }
      );
      let y = 30;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      const headers = ["No. Invoice", "Tanggal", "Pelanggan", "Total", "Status"];
      headers.forEach((h, i) => doc.text(h, colX[i], y));
      y += 5;
      doc.line(margin, y, pageW - margin, y);
      y += 4;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      filtered.slice(0, 50).forEach((t) => {
        if (y > 185) {
          doc.addPage();
          y = 20;
        }
        doc.text(t.invoiceNumber || "-", colX[0], y);
        doc.text(t.tanggal?.slice(0, 10) || "-", colX[1], y);
        doc.text(t.customerNama || "Walk-in", colX[2], y);
        doc.text(formatRupiah(t.totalBruto), colX[3], y, { align: "right" });
        const statusColor =
          t.status === "LUNAS" ? "#10b981" : t.status === "DP" ? "#f59e0b" : "#ef4444";
        doc.setTextColor(statusColor);
        doc.text(t.status, colX[4], y);
        doc.setTextColor("#000000");
        y += 6;
      });
      y += 4;
      doc.line(margin, y, pageW - margin, y);
      y += 5;
      const totalOmzet = filtered
        .filter((t) => t.status !== "BATAL")
        .reduce((s, t) => s + t.totalBruto, 0);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(`Total Omzet: ${formatRupiah(totalOmzet)}`, pageW - margin, y, { align: "right" });
      doc.save(`transaksi-${branch}-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("PDF berhasil diunduh");
    } catch {
      toast.error("Gagal export PDF");
    }
  }, [filtered, branch, branchLabel]);

  const exportCsv = useCallback(() => {
    const rows = [["No. Invoice", "Tanggal", "Pelanggan", "Total", "Status"]];
    filtered.forEach((t) =>
      rows.push([
        t.invoiceNumber || "",
        t.tanggal?.slice(0, 10) || "",
        t.customerNama || "Walk-in",
        formatRupiah(t.totalBruto),
        t.status,
      ])
    );
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transaksi-${branch}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV berhasil diunduh");
  }, [filtered, branch]);

  const printNota = useCallback(
    (tx: DbTransaction) => {
      const win = window.open("", "_blank");
      if (!win) return;
      win.document.write(`<html><head><style>
body{font-family:'Segoe UI',sans-serif;padding:24px;color:#1e293b;max-width:800px;margin:auto;background:#fff}
.nota-header{text-align:center;margin-bottom:20px;border-bottom:2px solid #10b981;padding-bottom:12px}
.nota-header h1{font-size:18px;margin:0;color:#10b981}
.nota-header p{font-size:12px;margin:4px 0 0;color:#64748b}
.nota-info{font-size:11px;color:#475569;margin-bottom:16px}
.nota-table{width:100%;border-collapse:collapse;font-size:12px}
.nota-table th{background:#f1f5f9;padding:8px 10px;text-align:left;font-weight:600;border-bottom:2px solid #e2e8f0}
.nota-table td{padding:8px 10px;border-bottom:1px solid #e2e8f0}
.nota-table .item-spec{font-size:10px;color:#94a3b8;font-style:italic}
.nota-table .text-right{text-align:right}
.nota-total{margin-top:16px;border-top:2px solid #10b981;padding-top:8px;font-size:14px;font-weight:700;text-align:right}
.nota-status{display:inline-block;padding:2px 8px;border-radius:99px;font-size:10px;font-weight:600}
.status-lunas{background:#d1fae5;color:#059669}
.status-dp{background:#fef3c7;color:#d97706}
.status-batal{background:#fee2e2;color:#dc2626}
</style></head><body>`);
      win.document.write(`<div class="nota-header"><h1>${branchLabel}</h1><p>Nota Transaksi</p></div>`);
      win.document.write(`<div class="nota-info">`);
      win.document.write(`<strong>Invoice:</strong> ${tx.invoiceNumber}<br>`);
      win.document.write(`<strong>Tanggal:</strong> ${tx.tanggal?.slice(0, 10)}<br>`);
      win.document.write(`<strong>Pelanggan:</strong> ${tx.customerNama || "Walk-in"}<br>`);
      if (tx.customerWA) win.document.write(`<strong>WA:</strong> ${tx.customerWA}<br>`);
      win.document.write(
        `<strong>Status:</strong> <span class="nota-status status-${tx.status.toLowerCase()}">${tx.status}</span>`
      );
      win.document.write(`</div>`);
      win.document.write(
        `<table class="nota-table"><thead><tr><th>Item</th><th>Qty</th><th class="text-right">Harga</th><th class="text-right">Subtotal</th></tr></thead><tbody>`
      );
      tx.items?.forEach((item) => {
        win.document.write(
          `<tr><td>${item.namaItem}${
            item.spesifikasi ? `<br><span class="item-spec">${item.spesifikasi}</span>` : ""
          }</td><td>${item.qty}</td><td class="text-right">${formatRupiah(
            item.hargaSatuan
          )}</td><td class="text-right">${formatRupiah(item.subtotal)}</td></tr>`
        );
      });
      win.document.write(`</tbody></table>`);
      if (tx.dpDibayar > 0)
        win.document.write(
          `<div style="margin-top:8px;text-align:right;font-size:12px;color:#3b82f6">DP: ${formatRupiah(
            tx.dpDibayar
          )}</div>`
        );
      if (tx.sisaTagihan > 0)
        win.document.write(
          `<div style="margin-top:4px;text-align:right;font-size:12px;color:#ef4444">Sisa: ${formatRupiah(
            tx.sisaTagihan
          )}</div>`
        );
      win.document.write(
        `<div class="nota-total">Total: ${formatRupiah(tx.totalBruto)}</div>`
      );
      win.document.write(`</body></html>`);
      win.document.close();
      setTimeout(() => win.print(), 300);
    },
    [branchLabel]
  );

  const openWa = useCallback((tx: DbTransaction) => {
    if (!tx.customerWA) {
      toast.error("Nomor WA tidak tersedia");
      return;
    }
    const msg = encodeURIComponent(
      `Terima kasih ${tx.customerNama}!\n\nInvoice: ${tx.invoiceNumber}\nTotal: ${formatRupiah(tx.totalBruto)}\nStatus: ${tx.status}`
    );
    window.open(`https://wa.me/${tx.customerWA}?text=${msg}`, "_blank");
  }, []);

  if (!mounted || loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-800/20" />
          ))}
        </div>
        <div className="h-10 rounded-2xl bg-slate-800/20" />
        <div className="h-72 rounded-2xl bg-slate-800/20" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="premium-stat border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
          <div className="size-7 rounded-lg bg-emerald-500/15 flex items-center justify-center mb-2">
            <Receipt className="size-3.5 text-emerald-500" />
          </div>
          <p className="premium-stat-label">Total Invoice</p>
          <p className="premium-stat-value text-emerald-500">{ringkasan.totalQty}</p>
        </div>
        <div className="premium-stat border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
          <div className="size-7 rounded-lg bg-blue-500/15 flex items-center justify-center mb-2">
            <TrendingUp className="size-3.5 text-blue-500" />
          </div>
          <p className="premium-stat-label">Pendapatan</p>
          <p className="premium-stat-value text-sm text-blue-500">{formatRupiah(ringkasan.totalOmzet)}</p>
        </div>
        <div className="premium-stat border-rose-500/20 bg-gradient-to-br from-rose-500/5 to-transparent">
          <div className="size-7 rounded-lg bg-rose-500/15 flex items-center justify-center mb-2">
            <AlertCircle className="size-3.5 text-rose-500" />
          </div>
          <p className="premium-stat-label">Piutang</p>
          <p className="premium-stat-value text-sm text-rose-500">{formatRupiah(ringkasan.totalPiutang)}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari invoice / pelanggan..."
            className="input-premium w-full text-xs pl-8"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground/40 pointer-events-none" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input-premium w-[130px] text-xs pl-7"
              title="Dari tanggal"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground/40 pointer-events-none" />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input-premium w-[130px] text-xs pl-7"
              title="Sampai tanggal"
            />
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="outline" size="icon-xs" onClick={exportPdf} title="Export PDF">
            <FileText className="size-3.5" />
          </Button>
          <Button variant="outline" size="icon-xs" onClick={exportCsv} title="Export CSV">
            <Download className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="hidden sm:grid grid-cols-[1fr_1.5fr_1fr_1fr_1fr] gap-3 px-4 py-2 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">
        <span>Tanggal</span>
        <span>No. Invoice</span>
        <span>Pelanggan</span>
        <span className="text-right">Total</span>
        <span className="text-center">Status</span>
      </div>

      {filtered.length === 0 ? (
        <div className="premium-card p-12 text-center">
          <div className="size-12 rounded-2xl bg-gradient-to-br from-[#7B61FF]/10 to-[#FF5C00]/10 flex items-center justify-center mx-auto mb-3">
            <Receipt className="size-5 text-[#7B61FF]" />
          </div>
          <p className="text-sm font-medium text-muted-foreground/60">Belum ada transaksi</p>
          <p className="text-xs text-muted-foreground/40 mt-1">
            Transaksi akan muncul di sini setelah kamu membuat invoice
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.slice(0, 100).map((tx) => {
            const prod = productions.get(tx.id);
            return (
              <button
                key={tx.id}
                onClick={() => setSelectedTx(tx)}
                className="w-full text-left floating-card p-3.5 sm:p-4 hover:shadow-md transition-all active:scale-[0.99]"
              >
                <div className="sm:hidden">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold">{tx.invoiceNumber || "-"}</span>
                    <span className={`badge-${tx.status.toLowerCase()}`}>
                      {tx.status === "LUNAS" ? "Lunas" : tx.status === "DP" ? "DP" : "Batal"}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground/60">
                    {formatDate(tx.tanggal)} — {tx.customerNama || "Walk-in"}
                  </p>
                  <p className="text-xs font-bold mt-1 tabular-nums text-emerald-500">
                    {formatRupiah(tx.totalBruto)}
                  </p>
                  {tx.status === "DP" && (
                    <p className="text-[9px] text-rose-400/60 tabular-nums">
                      Sisa: {formatRupiah(tx.sisaTagihan)}
                    </p>
                  )}
                </div>
                <div className="hidden sm:grid sm:grid-cols-[1fr_1.5fr_1fr_1fr_1fr] gap-3 items-center">
                  <span className="text-xs text-muted-foreground/70">{formatDate(tx.tanggal)}</span>
                  <span className="text-xs font-semibold">{tx.invoiceNumber || "-"}</span>
                  <span className="text-xs text-muted-foreground/70 truncate">
                    {tx.customerNama || "Walk-in"}
                  </span>
                  <span className="text-xs font-bold tabular-nums text-right text-emerald-500">
                    {formatRupiah(tx.totalBruto)}
                  </span>
                  <span className={`badge-${tx.status.toLowerCase()} justify-self-center`}>
                    {tx.status === "LUNAS" ? "Lunas" : tx.status === "DP" ? "DP" : "Batal"}
                  </span>
                </div>
                {showProduction && prod && (
                  <div className="mt-2 pt-2 border-t border-slate-200/40 dark:border-slate-800/40">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold border ${
                        PROD_COLORS[prod.status] || ""
                      }`}
                    >
                      <Factory className="size-2.5" />
                      {PROD_LABELS[prod.status] || prod.status}
                    </span>
                  </div>
                )}
                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/20 hidden sm:block" />
              </button>
            );
          })}
        </div>
      )}

      <Dialog open={!!selectedTx} onOpenChange={(o) => { if (!o) setSelectedTx(null); }}>
        <DialogContent className="max-w-lg">
          {selectedTx && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Receipt className="size-4 text-[#7B61FF]" />
                  {selectedTx.invoiceNumber}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                    <Calendar className="size-3" />
                    {formatDate(selectedTx.tanggal)}
                  </div>
                  <span className={`badge-${selectedTx.status.toLowerCase()}`}>
                    {selectedTx.status === "LUNAS"
                      ? "Lunas"
                      : selectedTx.status === "DP"
                      ? "DP"
                      : "Batal"}
                  </span>
                </div>

                <div className="premium-card p-3 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground/50">Pelanggan</span>
                    <span className="font-medium">{selectedTx.customerNama || "Walk-in"}</span>
                  </div>
                  {selectedTx.customerWA && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground/50">WA</span>
                      <span>{selectedTx.customerWA}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">
                    Item
                  </p>
                  {selectedTx.items?.map((item, i) => (
                    <div key={item.id || i} className="premium-card p-3">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium">
                          {item.namaItem}
                          <span className="text-muted-foreground/50 ml-1">x{item.qty}</span>
                        </span>
                        <span className="tabular-nums font-semibold">
                          {formatRupiah(item.subtotal)}
                        </span>
                      </div>
                      {item.spesifikasi && (
                        <p className="text-[10px] italic text-muted-foreground/50 mt-0.5">
                          {item.spesifikasi}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-200/60 dark:border-slate-800/60 pt-3 space-y-1.5 text-xs">
                  {selectedTx.dpDibayar > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground/60">DP Dibayar</span>
                      <span className="tabular-nums text-blue-500 font-medium">
                        {formatRupiah(selectedTx.dpDibayar)}
                      </span>
                    </div>
                  )}
                  {selectedTx.sisaTagihan > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground/60">Sisa Tagihan</span>
                      <span className="tabular-nums text-rose-500 font-medium">
                        {formatRupiah(selectedTx.sisaTagihan)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                    <span>Total</span>
                    <span className="gradient-text tabular-nums">
                      {formatRupiah(selectedTx.totalBruto)}
                    </span>
                  </div>
                </div>

                {showProduction && (
                  <div className="border-t border-slate-200/60 dark:border-slate-800/60 pt-3">
                    <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider mb-2">
                      Status Produksi
                    </p>
                    <div className="flex gap-1.5">
                      {(Object.entries(PROD_LABELS) as [ProductionStatus, string][]).map(
                        ([key, label]) => {
                          const current = productions.get(selectedTx.id)?.status;
                          const isActive = current === key;
                          return (
                            <button
                              key={key}
                              onClick={() => updateProductionStatus(selectedTx.id, key)}
                              className={`flex-1 text-[10px] font-semibold py-2 rounded-xl border transition-all ${
                                isActive
                                  ? `${PROD_COLORS[key]} border-current`
                                  : "border-slate-200 dark:border-slate-700 text-muted-foreground/50 hover:border-slate-300 dark:hover:border-slate-600"
                              }`}
                            >
                              {label}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => printNota(selectedTx)}
                    className="flex-1"
                  >
                    <Printer className="size-3.5" /> Cetak
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openWa(selectedTx)}
                    className="flex-1"
                  >
                    <FileText className="size-3.5" /> WA
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
