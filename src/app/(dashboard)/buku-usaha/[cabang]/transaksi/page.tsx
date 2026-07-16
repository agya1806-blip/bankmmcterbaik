"use client";

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type BookOrBranch, type Transaction, type ProductionStatus } from '@/lib/db-v4';
import {
  ArrowLeft,
  Printer,
  Layers,
  ClipboardList,
  Send,
} from 'lucide-react';

const BRANCH_MAP: Record<string, BookOrBranch> = {
  percetakan: 'usaha-percetakan',
  laptop: 'usaha-laptop',
  gadget: 'usaha-gadget',
  warkop: 'usaha-warkop',
  kelontong: 'usaha-kelontong',
  konveksi: 'usaha-konveksi',
  'toko-pakaian': 'usaha-toko-pakaian',
};

export default function TransaksiDanProduksiPage() {
  const params = useParams();
  const router = useRouter();
  const cabangSlug = (params?.cabang as string) || '';
  const bookOrBranchId = BRANCH_MAP[cabangSlug] || 'usaha-percetakan';

  const transactions =
    useLiveQuery(
      () => db.transactions.where('bookOrBranchId').equals(bookOrBranchId).reverse().toArray(),
      [bookOrBranchId]
    ) || [];

  const productions =
    useLiveQuery(
      () => db.productions.where('bookOrBranchId').equals(bookOrBranchId).toArray(),
      [bookOrBranchId]
    ) || [];

  const [activeTab, setActiveTab] = useState<'riwayat' | 'produksi'>('riwayat');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const kanbanData = useMemo(() => {
    const columns: Record<ProductionStatus, { tx: Transaction; prodId: string }[]> = {
      antre: [],
      diproduksi: [],
      selesai: [],
    };

    productions.forEach((prod) => {
      const tx = transactions.find((t) => t.id === prod.transactionId);
      if (tx) {
        columns[prod.status].push({ tx, prodId: prod.id });
      }
    });

    return columns;
  }, [productions, transactions]);

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
    if (existing) return alert('Transaksi ini sudah masuk dalam antrean produksi!');

    const now = new Date().toISOString();
    await db.productions.add({
      id: crypto.randomUUID(),
      bookOrBranchId,
      transactionId: txId,
      invoiceNumber: transactions.find((t) => t.id === txId)?.invoiceNumber || '',
      status: 'antre',
      catatan: '',
      updatedAt: now,
      createdAt: now,
    });
    alert('Berhasil didaftarkan ke antrean produksi!');
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
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-extrabold tracking-tight capitalize">Hub Transaksi</h1>
        <div className="w-9 h-9" />
      </div>

      <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-zinc-800 p-1 rounded-2xl mb-4">
        <button
          onClick={() => setActiveTab('riwayat')}
          className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'riwayat'
              ? 'bg-white dark:bg-[#131527] text-indigo-500 shadow-sm'
              : 'text-slate-400'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Riwayat Kasir
        </button>
        <button
          onClick={() => setActiveTab('produksi')}
          className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'produksi'
              ? 'bg-white dark:bg-[#131527] text-indigo-500 shadow-sm'
              : 'text-slate-400'
          }`}
        >
          <Layers className="w-4 h-4" />
          Kanban Alur Kerja
        </button>
      </div>

      {activeTab === 'riwayat' && (
        <div className="flex-1 overflow-y-auto space-y-3 max-h-[500px] pr-1">
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">Belum ada riwayat transaksi.</div>
          ) : (
            transactions.map((tx) => {
              const tanggal = new Date(tx.tanggal);
              return (
                <div
                  key={tx.id}
                  onClick={() => setSelectedTx(selectedTx?.id === tx.id ? null : tx)}
                  className="premium-card p-4 cursor-pointer hover:border-[#7B61FF]/40 transition-all space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md text-slate-500 font-extrabold uppercase">
                        {tx.invoiceNumber}
                      </span>
                      <h4 className="text-sm font-extrabold mt-1">{tx.customerNama}</h4>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-[#7B61FF]">
                        Rp{tx.totalBruto.toLocaleString()}
                      </span>
                      <p className="text-[9px] text-slate-400 mt-0.5">
                        {tanggal.toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold ${
                        tx.status === 'LUNAS'
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-amber-100 text-amber-600'
                      }`}
                    >
                      {tx.status}
                    </span>
                    {tx.sisaTagihan > 0 && (
                      <span className="text-[9px] text-rose-500 font-bold">
                        Sisa: Rp{tx.sisaTagihan.toLocaleString()}
                      </span>
                    )}
                  </div>

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

                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            initializeProduction(tx.id);
                          }}
                          className="py-2 bg-[#7B61FF] text-white text-[10px] font-bold rounded-xl active:scale-95 transition-transform text-center"
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
                          <Printer className="w-3.5 h-3.5 text-slate-500" /> Struk
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            sendWhatsAppBilling(tx);
                          }}
                          className="py-2 bg-emerald-500 text-white rounded-xl flex items-center justify-center gap-1 font-bold text-[10px]"
                        >
                          <Send className="w-3.5 h-3.5" /> WA Struk
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
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
    </div>
  );
}
