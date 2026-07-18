"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type UnitId, type Transaction, type ProductionStatus, BRANCH_MAP, type DbPiutangInstallment } from '@/lib/db-v4';
import { SkeletonCard } from "@/components/skeleton";
import { ArrowLeft, ClipboardList, FileText, Printer, Image, Phone, BarChart3, X, Search, Tag } from "lucide-react";
import { showToast } from "@/lib/toast";
import InvoiceA4 from "@/components/invoice-a4";

export default function TransaksiDanProduksiPage() {
  const params = useParams();
  const router = useRouter();
  const cabangSlug = (params?.cabang as string) || '';
  const bookOrBranchId = BRANCH_MAP[cabangSlug] || 'usaha-percetakan';

  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  const _allTransactions =
    useLiveQuery(
      () => db.transactions.where('bookOrBranchId').equals(bookOrBranchId).reverse().toArray(),
      [bookOrBranchId]
    );
  const allTransactions = _allTransactions || [];
  if (_allTransactions === undefined) return <SkeletonCard count={5} />;

  const paginatedTransactions = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return allTransactions.slice(start, start + PER_PAGE);
  }, [allTransactions, page]);

  const totalPages = Math.max(1, Math.ceil(allTransactions.length / PER_PAGE));

  const productions =
    useLiveQuery(
      () => db.productions.where('bookOrBranchId').equals(bookOrBranchId).toArray(),
      [bookOrBranchId]
    ) || [];

  const wallets = useLiveQuery(() => db.wallets.where("bookOrBranchId").equals(bookOrBranchId).toArray(), [bookOrBranchId]) || [];
  const profiles = useLiveQuery(() => db.profiles.where("bookOrBranchId").equals(bookOrBranchId).toArray(), [bookOrBranchId]) || [];
  const profile = profiles[0];

  const labels = useLiveQuery(() => db.labels.where("bookOrBranchId").equals(bookOrBranchId).toArray(), [bookOrBranchId]) || [];
  const labelTags = useLiveQuery(() => db.labelTags.where("bookOrBranchId").equals(bookOrBranchId).toArray(), [bookOrBranchId]) || [];

  const labelMap = useMemo(() => {
    const map: Record<string, string> = {};
    labels.forEach(l => { map[l.id] = l.warna; });
    return map;
  }, [labels]);

  const txLabelIds = useMemo(() => {
    const map: Record<string, string[]> = {};
    labelTags.forEach(lt => {
      if (!map[lt.transaksiRef]) map[lt.transaksiRef] = [];
      map[lt.transaksiRef].push(lt.labelId);
    });
    return map;
  }, [labelTags]);

  const [activeTab, setActiveTab] = useState<'riwayat' | 'produksi'>('riwayat');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [showInvoice, setShowInvoice] = useState<Transaction | null>(null);
  const [showCicilanModal, setShowCicilanModal] = useState(false);
  const [cicilanTxId, setCicilanTxId] = useState<string | null>(null);
  const [cicilanList, setCicilanList] = useState<DbPiutangInstallment[]>([]);
  const [showAddCicilan, setShowAddCicilan] = useState(false);
  const [newCicilanJumlah, setNewCicilanJumlah] = useState(0);
  const [newCicilanMetode, setNewCicilanMetode] = useState("CASH");
  const [newCicilanCatatan, setNewCicilanCatatan] = useState("");

  const kanbanData = useMemo(() => {
    const columns: Record<ProductionStatus, { tx: Transaction; prodId: string }[]> = {
      antre: [],
      diproduksi: [],
      selesai: [],
    };

    productions.forEach((prod) => {
      const tx = allTransactions.find((t) => t.id === prod.transactionId);
      if (tx) {
        columns[prod.status].push({ tx, prodId: prod.id });
      }
    });

    return columns;
  }, [productions, allTransactions]);

  const moveProductionStatus = async (prodId: string, currentStatus: ProductionStatus) => {
    let nextStatus: ProductionStatus = 'antre';
    if (currentStatus === 'antre') nextStatus = 'diproduksi';
    else if (currentStatus === 'diproduksi') nextStatus = 'selesai';
    else return;

    await db.productions.update(prodId, { status: nextStatus, updatedAt: new Date().toISOString() });

    await db.auditLogs.add({
      id: crypto.randomUUID(),
      bookOrBranchId,
      action: 'UPDATE',
      entityType: 'transaction',
      entityId: prodId,
      userId: 'system',
      userName: 'System',
      dataBefore: '',
      dataAfter: `Status: ${nextStatus}`,
      nominal: 0,
      alasan: `Status: ${nextStatus}`,
      createdAt: new Date().toISOString(),
    });
  };

  const initializeProduction = async (txId: string) => {
    const existing = await db.productions.where({ transactionId: txId }).first();
    if (existing) return showToast.error('Transaksi ini sudah masuk dalam antrean produksi!');

    const now = new Date().toISOString();
    await db.productions.add({
      id: crypto.randomUUID(),
      bookOrBranchId,
      unitId: bookOrBranchId,
      transactionId: txId,
      invoiceNumber: allTransactions.find((t) => t.id === txId)?.invoiceNumber || '',
      status: 'antre',
      catatan: '',
      updatedAt: now,
      createdAt: now,
    });
    showToast.success('Berhasil didaftarkan ke antrean produksi!');
  };

  const sendWhatsAppBilling = (tx: Transaction) => {
    const itemsList = tx.items
      .map((item) => `- ${item.namaItem} (x${item.qty})`)
      .join('\n');

    const message =
      `*INVOICE ${tx.invoiceNumber}*\n` +
      `Toko: ${cabangSlug.toUpperCase()}\n` +
      `Pelanggan: ${tx.customerNama}\n` +
      `----------------------------------------\n` +
      `*Daftar Item:*\n${itemsList}\n` +
      `----------------------------------------\n` +
      `*Total Belanja:* Rp${tx.totalBruto.toLocaleString()}\n` +
      `*Status:* ${tx.status}\n` +
      `${
        tx.sisaTagihan > 0
          ? `*Sisa Piutang:* Rp${tx.sisaTagihan.toLocaleString()}`
          : 'Lunas Terbayar! Terima kasih.'
      }\n` +
      `----------------------------------------\n` +
      `Harap simpan bukti pembayaran ini.`;

    const phone = tx.customerWA || '628123456789';
    const waUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  const openCicilanModal = async (txId: string) => {
    setCicilanTxId(txId);
    const piutang = await db.piutang.where("transactionId").equals(txId).first();
    if (piutang) {
      const installments = await db.piutangInstallments
        .where("piutangId").equals(piutang.id)
        .toArray();
      setCicilanList(installments);
    } else {
      setCicilanList([]);
    }
    setShowCicilanModal(true);
  };

  const handleAddCicilan = async () => {
    if (!cicilanTxId || newCicilanJumlah <= 0) return;
    const piutang = await db.piutang.where("transactionId").equals(cicilanTxId).first();
    if (!piutang) return;

    await db.piutangInstallments.add({
      id: crypto.randomUUID(),
      bookOrBranchId: bookOrBranchId,
      piutangId: piutang.id,
      jumlah: newCicilanJumlah,
      metode: newCicilanMetode,
      tanggal: new Date().toISOString(),
      catatan: newCicilanCatatan,
    });

    const newSisa = Math.max(0, piutang.sisaPiutang - newCicilanJumlah);
    const newStatus = newSisa <= 0 ? "LUNAS" : "AKTIF";
    await db.piutang.update(piutang.id, { sisaPiutang: newSisa, status: newStatus });

    const tx = await db.transactions.get(cicilanTxId);
    if (tx) {
      const newDpDibayar = tx.dpDibayar + newCicilanJumlah;
      const newSisaTagihan = Math.max(0, tx.grandTotal - newDpDibayar);
      const newTxStatus = newSisaTagihan <= 0 ? "LUNAS" : "DP";
      await db.transactions.update(cicilanTxId, { dpDibayar: newDpDibayar, sisaTagihan: newSisaTagihan, status: newTxStatus });
    }

    const updated = await db.piutangInstallments.where("piutangId").equals(piutang.id).toArray();
    setCicilanList(updated);
    setNewCicilanJumlah(0);
    setNewCicilanMetode("CASH");
    setNewCicilanCatatan("");
    setShowAddCicilan(false);
    showToast.success("Cicilan berhasil dicatat!");
  };

  const handleExportPng = async (tx: Transaction) => {
    try {
      const { default: html2canvas } = await import("html2canvas");
      const tempDiv = document.createElement("div");
      tempDiv.style.padding = "20px";
      tempDiv.style.background = "#fff";
      tempDiv.style.color = "#000";
      tempDiv.style.fontFamily = "monospace";
      tempDiv.style.width = "320px";
      tempDiv.innerHTML = `
        <div style="text-align:center;font-size:14px;font-weight:bold;margin-bottom:8px;">MMCBANK BUKU USAHA</div>
        <div style="text-align:center;font-size:10px;margin-bottom:12px;">Cabang: ${cabangSlug.toUpperCase()}</div>
        <div style="font-size:10px;margin-bottom:8px;">
          <div>No: ${tx.invoiceNumber}</div>
          <div>Tgl: ${new Date(tx.tanggal).toLocaleString("id-ID")}</div>
          <div>Pelanggan: ${tx.customerNama}</div>
        </div>
        <div style="border-top:1px dashed #000;margin:6px 0;"></div>
        ${tx.items.map((item) => `<div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px;"><span>${item.namaItem} x${item.qty}</span><span>Rp${item.subtotal.toLocaleString()}</span></div>`).join("")}
        <div style="border-top:1px dashed #000;margin:6px 0;"></div>
        <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:bold;"><span>Total</span><span>Rp${tx.totalBruto.toLocaleString()}</span></div>
        <div style="display:flex;justify-content:space-between;font-size:10px;"><span>Dibayar</span><span>Rp${tx.dpDibayar.toLocaleString()}</span></div>
        <div style="display:flex;justify-content:space-between;font-size:10px;"><span>Sisa</span><span>Rp${tx.sisaTagihan.toLocaleString()}</span></div>
      `;
      document.body.appendChild(tempDiv);
      const canvas = await html2canvas(tempDiv, { scale: 2, useCORS: true });
      const link = document.createElement("a");
      link.download = `Invoice-${tx.invoiceNumber}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      document.body.removeChild(tempDiv);
    } catch {
      showToast.error("Gagal export PNG. Pastikan html2canvas terinstall.");
    }
  };

  const handleExportPdf = async (tx: Transaction) => {
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF("p", "mm", "a4");
      let y = 20;
      const write = (text: string, bold = false) => {
        if (bold) doc.setFont("helvetica", "bold");
        else doc.setFont("helvetica", "normal");
        doc.text(text, 15, y);
        y += 6;
      };
      write("MMCBANK BUKU USAHA", true);
      write(`Cabang: ${cabangSlug.toUpperCase()}`);
      write(`Invoice: ${tx.invoiceNumber}`);
      write(`Tanggal: ${new Date(tx.tanggal).toLocaleString("id-ID")}`);
      write(`Pelanggan: ${tx.customerNama}`);
      write("─".repeat(50));
      tx.items.forEach((item) => {
        write(`${item.namaItem} x${item.qty}  Rp${item.subtotal.toLocaleString()}`);
      });
      write("─".repeat(50));
      write(`Total: Rp${tx.totalBruto.toLocaleString()}`, true);
      write(`Dibayar: Rp${tx.dpDibayar.toLocaleString()}`);
      write(`Sisa: Rp${tx.sisaTagihan.toLocaleString()}`);
      doc.save(`Invoice-${tx.invoiceNumber}.pdf`);
    } catch {
      showToast.error("Gagal export PDF. Pastikan jspdf terinstall.");
    }
  };

  const handleExportExcel = async (tx: Transaction) => {
    try {
      const XLSX = await import("xlsx");
      const headers = ["Item", "Qty", "Harga Satuan", "Subtotal", "Spesifikasi"];
      const rows = tx.items.map((item) => [item.namaItem, item.qty, item.hargaSatuan, item.subtotal, item.spesifikasi]);
      const summary = [
        [],
        ["No Invoice", tx.invoiceNumber],
        ["Pelanggan", tx.customerNama],
        ["Tanggal", new Date(tx.tanggal).toLocaleString("id-ID")],
        ["Total", tx.totalBruto],
        ["Dibayar", tx.dpDibayar],
        ["Sisa", tx.sisaTagihan],
        ["Status", tx.status],
      ];
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows, [], ...summary]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Invoice");
      XLSX.writeFile(wb, `Invoice-${tx.invoiceNumber}.xlsx`);
    } catch {
      showToast.error("Gagal export Excel. Pastikan xlsx terinstall.");
    }
  };

  const handlePrintReceipt = (tx: Transaction) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = tx.items
      .map(
        (item) => `
        <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px;">
          <span>${item.namaItem} x${item.qty}</span>
          <span>Rp${item.subtotal.toLocaleString()}</span>
        </div>`
      )
      .join('');

    const tanggal = new Date(tx.tanggal);

    printWindow.document.write(`
      <html>
      <head><title>Cetak Struk - ${tx.invoiceNumber}</title>
      <style>
        @media print { body{width:58mm;margin:0;padding:10px;font-family:monospace;color:#000;} }
        body{width:300px;margin:20px auto;padding:15px;border:1px solid #ccc;font-family:monospace;}
        .divider{border-top:1px dashed #000;margin:8px 0;}
        .center{text-align:center;}
        .bold{font-weight:bold;}
      </style>
      </head>
      <body>
        <div class="center bold" style="font-size:14px;">MMCBANK BUKU USAHA</div>
        <div class="center" style="font-size:10px;margin-bottom:10px;">Cabang: ${cabangSlug.toUpperCase()}</div>
        <div style="font-size:10px;">
          <div>No: ${tx.invoiceNumber}</div>
          <div>Tgl: ${tanggal.toLocaleString('id-ID')}</div>
          <div>Pelanggan: ${tx.customerNama}</div>
        </div>
        <div class="divider"></div>
        ${itemsHtml}
        <div class="divider"></div>
        <div style="display:flex;justify-content:space-between;font-size:11px;" class="bold">
          <span>Total</span><span>Rp${tx.totalBruto.toLocaleString()}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11px;">
          <span>Dibayar</span><span>Rp${tx.dpDibayar.toLocaleString()}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11px;">
          <span>Sisa Tagihan</span><span>Rp${tx.sisaTagihan.toLocaleString()}</span>
        </div>
        <div class="divider"></div>
        <div class="center" style="font-size:10px;margin-top:15px;">Terima kasih atas kunjungan Anda!</div>
        <script>window.onload=function(){window.print();window.close();}</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="flex-1 flex flex-col pt-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => router.push(`/buku-usaha/${cabangSlug}`)}
          className="p-2 bg-white dark:bg-[#131527] rounded-full shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-lg font-heading font-extrabold tracking-tight capitalize">Hub Transaksi</h1>
        <div className="w-9 h-9" />
      </div>

      <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-zinc-800 p-1 rounded-2xl mb-4">
        <button
          onClick={() => { setActiveTab('riwayat'); setPage(1); }}
          className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'riwayat'
              ? 'bg-white dark:bg-[#131527] text-indigo-500 shadow-sm'
              : 'text-slate-400'
          }`}
        >
          <ClipboardList className="w-5 h-5" />
          Riwayat Kasir
        </button>
        <button
          onClick={() => { setActiveTab('produksi'); setPage(1); }}
          className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'produksi'
              ? 'bg-white dark:bg-[#131527] text-indigo-500 shadow-sm'
              : 'text-slate-400'
          }`}
        >
          <FileText className="w-5 h-5" />
          Kanban Alur Kerja
        </button>
      </div>

      {activeTab === 'riwayat' && (
        <div className="flex-1 overflow-y-auto space-y-3 max-h-[500px] pr-1">
          {paginatedTransactions.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs animate-fade-in"><ClipboardList className="w-6 h-6 mx-auto mb-2 opacity-40" />Belum ada riwayat transaksi.</div>
          ) : (
            paginatedTransactions.map((tx, idx) => {
              const tanggal = new Date(tx.tanggal);
              return (
                <div
                  key={tx.id}
                  onClick={() => setSelectedTx(selectedTx?.id === tx.id ? null : tx)}
                  className={`premium-card premium-card-glow p-4 cursor-pointer transition-all duration-200 space-y-2 animate-slide-up ${
                    selectedTx?.id === tx.id ? 'border-[#008CEB]/40 ring-1 ring-[#008CEB]/20' : ''
                  }`}
                  style={{ animationDelay: `${idx * 40}ms`, animationFillMode: "backwards" }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-heading font-bold bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md text-slate-500 uppercase tracking-wider">
                        {tx.invoiceNumber}
                      </span>
                      <h4 className="text-sm font-heading font-extrabold mt-1">{tx.customerNama}</h4>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-heading font-extrabold text-[#008CEB]">
                        Rp{tx.totalBruto.toLocaleString()}
                      </span>
                      <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                        {tanggal.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] px-2.5 py-0.5 rounded-full font-extrabold ${
                        tx.status === 'LUNAS'
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {tx.status}
                    </span>
                    {tx.sisaTagihan > 0 && (
                      <span className="text-[9px] text-rose-500 font-extrabold bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded-lg">
                        Sisa: Rp{tx.sisaTagihan.toLocaleString()}
                      </span>
                    )}
                    {tx.status === "DP" && (
                      <button onClick={(e) => { e.stopPropagation(); openCicilanModal(tx.id); }}
                        className="text-[10px] text-blue-500 underline">Cicilan</button>
                    )}
                  </div>

                  {txLabelIds[tx.id]?.length > 0 && (
                    <div className="flex items-center gap-1">
                      {txLabelIds[tx.id].map(labelId => (
                        <div
                          key={labelId}
                          className="w-3 h-3 rounded-full border border-slate-300 dark:border-slate-600"
                          style={{ backgroundColor: labelMap[labelId] }}
                        />
                      ))}
                    </div>
                  )}

                  {selectedTx?.id === tx.id && (
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                      <div className="bg-slate-50 dark:bg-zinc-900 p-2.5 rounded-xl space-y-1.5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Item Transaksi:</p>
                        {tx.items.map((item, i) => (
                          <div key={i} className="flex justify-between font-medium">
                            <span>
                              {item.namaItem} (x{item.qty})
                            </span>
                            <span className="font-bold">
                              Rp{item.subtotal.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>

                      {tx.buktiBayar && (
                        <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-zinc-900">
                          <img src={tx.buktiBayar} alt="Bukti Bayar" className="w-12 h-12 object-cover rounded-lg" />
                          <span className="text-[10px] text-slate-400 font-medium">Bukti Pembayaran QRIS</span>
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            initializeProduction(tx.id);
                          }}
                          className="py-2 bg-[#008CEB] text-white text-[10px] font-bold rounded-xl active:scale-95 transition-transform text-center"
                        >
                          Produksi
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrintReceipt(tx);
                          }}
                          className="py-2 bg-slate-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center gap-1 font-bold text-[10px]"
                        >
                          <Printer className="w-4 h-4 text-slate-500" /> Struk
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowInvoice(tx);
                          }}
                          className="py-2 bg-slate-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center gap-1 font-bold text-[10px]"
                        >
                          <FileText className="w-4 h-4 text-slate-500" /> Invoice
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5 pt-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleExportPng(tx); }}
                          className="py-2 bg-amber-400 text-white text-[9px] font-bold rounded-xl active:scale-95 transition-all flex flex-col items-center leading-tight"
                          title="Export Gambar PNG"
                        >
                          <Image className="w-4 h-4 mb-0.5" />
                          PNG
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleExportPdf(tx); }}
                          className="py-2 bg-rose-500 text-white text-[9px] font-bold rounded-xl active:scale-95 transition-all flex flex-col items-center leading-tight"
                          title="Export PDF"
                        >
                          <FileText className="w-4 h-4 mb-0.5" />
                          PDF
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); sendWhatsAppBilling(tx); }}
                          className="py-2 bg-emerald-500 text-white text-[9px] font-bold rounded-xl active:scale-95 transition-all flex flex-col items-center leading-tight"
                          title="Kirim WhatsApp"
                        >
                          <Phone className="w-4 h-4 mb-0.5" />
                          WA
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleExportExcel(tx); }}
                          className="py-2 bg-blue-500 text-white text-[9px] font-bold rounded-xl active:scale-95 transition-all flex flex-col items-center leading-tight"
                          title="Export Excel"
                        >
                          <BarChart3 className="w-4 h-4 mb-0.5" />
                          XLSX
                        </button>
                      </div>
                      {labels.length > 0 && (
                        <div className="pt-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1">
                            <Tag className="w-3 h-3" /> Label
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {labels.map(label => {
                              const isActive = txLabelIds[tx.id]?.includes(label.id);
                              return (
                                <button
                                  key={label.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isActive) {
                                      const tag = labelTags.find(lt => lt.transaksiRef === tx.id && lt.labelId === label.id);
                                      if (tag) db.labelTags.delete(tag.id);
                                    } else {
                                      db.labelTags.add({
                                        id: crypto.randomUUID(),
                                        bookOrBranchId,
                                        transaksiRef: tx.id,
                                        labelId: label.id,
                                      });
                                    }
                                  }}
                                  className={`text-[9px] font-bold px-2 py-1 rounded-full border-2 transition-all active:scale-90 ${
                                    isActive ? 'text-white' : 'text-slate-400 border-slate-200 dark:border-slate-700'
                                  }`}
                                  style={{
                                    backgroundColor: isActive ? label.warna : 'transparent',
                                    borderColor: isActive ? label.warna : undefined,
                                  }}
                                >
                                  {label.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-[10px] font-bold disabled:opacity-40">
                Prev
              </button>
              <span className="text-[10px] text-slate-400 font-bold">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-[10px] font-bold disabled:opacity-40">
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'produksi' && (
        <div className="flex-1 overflow-x-auto flex gap-3 h-[460px] pb-4">
          <div className="flex-shrink-0 w-64 bg-slate-100 dark:bg-zinc-900 rounded-2xl p-3 flex flex-col gap-2.5">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-extrabold text-slate-400">
                ANTRE ({kanbanData.antre.length})
              </span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2.5">
              {kanbanData.antre.map(({ tx, prodId }) => (
                <div
                  key={prodId}
                  className="bg-white dark:bg-[#131527] p-3 rounded-xl border border-slate-200/40 space-y-2 shadow-sm"
                >
                  <h5 className="text-xs font-extrabold">{tx.customerNama}</h5>
                  <p className="text-[10px] text-indigo-500 line-clamp-2">
                    {tx.items[0]?.namaItem || 'Item'}...
                  </p>
                  <button
                    onClick={() => moveProductionStatus(prodId, 'antre')}
                    className="w-full py-1.5 bg-indigo-500 text-white rounded-lg text-[10px] font-bold active:scale-95 transition-transform"
                  >
                    Mulai Kerjakan
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-shrink-0 w-64 bg-slate-100 dark:bg-zinc-900 rounded-2xl p-3 flex flex-col gap-2.5">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-extrabold text-amber-500">
                DIPRODUKSI ({kanbanData.diproduksi.length})
              </span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2.5">
              {kanbanData.diproduksi.map(({ tx, prodId }) => (
                <div
                  key={prodId}
                  className="bg-white dark:bg-[#131527] p-3 rounded-xl border border-amber-200/40 space-y-2 shadow-sm"
                >
                  <h5 className="text-xs font-extrabold">{tx.customerNama}</h5>
                  <p className="text-[10px] text-amber-500 line-clamp-2">
                    {tx.items[0]?.namaItem || 'Item'}...
                  </p>
                  <button
                    onClick={() => moveProductionStatus(prodId, 'diproduksi')}
                    className="w-full py-1.5 bg-amber-500 text-white rounded-lg text-[10px] font-bold active:scale-95 transition-transform"
                  >
                    Selesaikan Produksi
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-shrink-0 w-64 bg-slate-100 dark:bg-zinc-900 rounded-2xl p-3 flex flex-col gap-2.5">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-extrabold text-emerald-500">
                SELESAI ({kanbanData.selesai.length})
              </span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2.5">
              {kanbanData.selesai.map(({ tx, prodId }) => (
                <div
                  key={prodId}
                  className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-200/40 space-y-1.5 shadow-sm"
                >
                  <h5 className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                    {tx.customerNama}
                  </h5>
                  <p className="text-[10px] text-slate-400 line-clamp-2">
                    {tx.items[0]?.namaItem || 'Item'}...
                  </p>
                  <span className="inline-block text-[9px] text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                    Produksi Selesai
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Invoice A4 Modal */}
      {showInvoice && (
        <InvoiceA4
          transaction={showInvoice}
          wallet={wallets.find(w => w.id === showInvoice.walletIdTarget)}
          profile={profile}
          cabangSlug={cabangSlug}
          onClose={() => setShowInvoice(null)}
          onPrint={() => window.print()}
        />
      )}

      {/* Cicilan Modal */}
      {showCicilanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowCicilanModal(false)}>
          <div className="bg-white dark:bg-[#131527] rounded-2xl w-full max-w-md p-5 max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-extrabold mb-3">Riwayat Cicilan</h3>

            {cicilanList.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Belum ada cicilan</p>
            ) : (
              <div className="space-y-2 mb-4">
                {cicilanList.map(c => (
                  <div key={c.id} className="bg-slate-50 dark:bg-zinc-900 p-3 rounded-xl">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold">Rp{c.jumlah.toLocaleString()}</span>
                      <span className="text-slate-400">{new Date(c.tanggal).toLocaleDateString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>{c.metode}</span>
                      {c.catatan && <span>{c.catatan}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showAddCicilan ? (
              <div className="space-y-2 border-t border-slate-200 dark:border-slate-700 pt-3">
                <input type="number" value={newCicilanJumlah || ''} onChange={e => setNewCicilanJumlah(Number(e.target.value))}
                  className="w-full p-2 text-xs border rounded-xl bg-slate-50 dark:bg-zinc-900" placeholder="Jumlah cicilan..." />
                <select value={newCicilanMetode} onChange={e => setNewCicilanMetode(e.target.value)}
                  className="w-full p-2 text-xs border rounded-xl bg-slate-50 dark:bg-zinc-900">
                  <option value="CASH">CASH</option>
                  <option value="TRANSFER">TRANSFER</option>
                  <option value="QRIS">QRIS</option>
                </select>
                <input value={newCicilanCatatan} onChange={e => setNewCicilanCatatan(e.target.value)}
                  className="w-full p-2 text-xs border rounded-xl bg-slate-50 dark:bg-zinc-900" placeholder="Catatan (opsional)..." />
                <div className="flex gap-2">
                  <button onClick={handleAddCicilan} className="flex-1 py-2 bg-emerald-500 text-white text-xs font-bold rounded-xl">Simpan</button>
                  <button onClick={() => setShowAddCicilan(false)} className="flex-1 py-2 bg-slate-100 dark:bg-zinc-800 text-xs font-bold rounded-xl">Batal</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAddCicilan(true)}
                className="w-full py-2 bg-[#008CEB] text-white text-xs font-bold rounded-xl mb-2">+ Tambah Cicilan</button>
            )}

            <button onClick={() => setShowCicilanModal(false)}
              className="w-full py-2 bg-slate-100 dark:bg-zinc-800 text-xs font-bold rounded-xl">Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
}
