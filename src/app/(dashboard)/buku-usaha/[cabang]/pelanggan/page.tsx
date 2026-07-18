"use client";

import React, { useState, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type Customer, BRANCH_MAP } from "@/lib/db-v4";
import * as XLSX from "xlsx";
import { showToast } from "@/lib/toast";
import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Check, Gift } from "lucide-react";
import { CustomerHeader } from "@/components/customer/customer-header";
import { CustomerSummaryCards } from "@/components/customer/customer-summary-cards";
import { CustomerToolbar } from "@/components/customer/customer-toolbar";
import { CustomerTable } from "@/components/customer/customer-table";
import { CustomerForm } from "@/components/customer/customer-form";
import { CustomerDetailDrawer } from "@/components/customer/customer-detail-drawer";
import { CustomerEmptyState } from "@/components/customer/customer-empty-state";

interface ParsedContact {
  nama: string;
  noWA: string;
}

function parseCSV(text: string): ParsedContact[] {
  const lines = text.trim().split("\n").filter(Boolean);
  if (lines.length === 0) return [];
  const header = lines[0].toLowerCase();
  const nameIdx = header.split(",").findIndex((h) => /nama|name/i.test(h));
  const phoneIdx = header.split(",").findIndex((h) => /phone|hp|wa|telp|nomor|no/i.test(h));
  if (nameIdx === -1 || phoneIdx === -1) return [];
  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    return { nama: cols[nameIdx] || "", noWA: (cols[phoneIdx] || "").replace(/[^0-9+]/g, "") };
  }).filter((c) => c.nama && c.noWA);
}

function parseVCF(text: string): ParsedContact[] {
  const cards = text.split("BEGIN:VCARD").filter(Boolean);
  return cards.map((card) => {
    const fnLine = card.split("\n").find((l) => l.startsWith("FN:"));
    const telLine = card.split("\n").find((l) => l.startsWith("TEL"));
    return {
      nama: fnLine ? fnLine.replace("FN:", "").trim() : "",
      noWA: telLine ? telLine.split(":").slice(1).join(":").replace(/[^0-9+]/g, "") : "",
    };
  }).filter((c) => c.nama && c.noWA);
}

function parseExcel(data: ArrayBuffer): ParsedContact[] {
  const wb = XLSX.read(data, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);
  if (json.length === 0) return [];
  const keys = Object.keys(json[0]);
  const nameKey = keys.find((k) => /nama|name/i.test(k)) || keys[0];
  const phoneKey = keys.find((k) => /phone|hp|wa|telp|nomor|no/i.test(k)) || keys[1];
  return json.map((row) => ({
    nama: String(row[nameKey] || "").trim(),
    noWA: String(row[phoneKey] || "").replace(/[^0-9+]/g, "").trim(),
  })).filter((c) => c.nama && c.noWA);
}

export default function PelangganCRMPage() {
  const params = useParams();
  const cabangSlug = (params?.cabang as string) || "";
  const bookOrBranchId = BRANCH_MAP[cabangSlug] || "usaha-percetakan";
  const fileRef = useRef<HTMLInputElement>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPreview, setImportPreview] = useState<ParsedContact[]>([]);
  const [importFileName, setImportFileName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"semua" | "aktif" | "tidak-aktif" | "memiliki-piutang">("semua");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [redeemPoin, setRedeemPoin] = useState(0);
  const [redeemingCustomer, setRedeemingCustomer] = useState<Customer | null>(null);

  const _customers = useLiveQuery(
    () => db.customers.where("bookOrBranchId").equals(bookOrBranchId).toArray(),
    [bookOrBranchId]
  );
  const customers = _customers || [];

  const allPiutang = useLiveQuery(
    () => db.piutang.where("bookOrBranchId").equals(bookOrBranchId).toArray(),
    [bookOrBranchId]
  ) || [];

  const customerPiutangMap = useMemo(() => {
    const map: Record<string, typeof allPiutang> = {};
    for (const p of allPiutang) {
      if (!map[p.customerId]) map[p.customerId] = [];
      map[p.customerId].push(p);
    }
    return map;
  }, [allPiutang]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchesSearch = !searchQuery ||
        c.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.noWA.includes(searchQuery);
      if (!matchesSearch) return false;
      if (filterStatus === "aktif") {
        const daysSince = c.terakhirTransaksi
          ? Math.floor((Date.now() - new Date(c.terakhirTransaksi).getTime()) / (1000 * 60 * 60 * 24))
          : Infinity;
        return daysSince <= 90;
      }
      if (filterStatus === "tidak-aktif") {
        const daysSince = c.terakhirTransaksi
          ? Math.floor((Date.now() - new Date(c.terakhirTransaksi).getTime()) / (1000 * 60 * 60 * 24))
          : Infinity;
        return daysSince > 90;
      }
      if (filterStatus === "memiliki-piutang") {
        return allPiutang.some(p => p.customerId === c.id);
      }
      return true;
    });
  }, [customers, searchQuery, filterStatus, allPiutang]);

  const handleAddCustomer = async (data: { nama: string; noWA: string }) => {
    await db.customers.add({
      id: crypto.randomUUID(),
      bookOrBranchId,
      nama: data.nama,
      noWA: data.noWA,
      totalTransaksi: 0,
      totalBelanja: 0,
      poin: 0,
      terakhirTransaksi: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
    showToast.success("Pelanggan ditambahkan");
  };

  const handleEditSubmit = async (data: { nama: string; noWA: string }) => {
    if (!editingCustomer) return;
    await db.customers.update(editingCustomer.id, { nama: data.nama, noWA: data.noWA });
    showToast.success("Pelanggan diperbarui");
    setEditingCustomer(null);
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm("Hapus pelanggan ini?")) return;
    await db.customers.delete(id);
    if (selectedCustomer?.id === id) setSelectedCustomer(null);
    showToast.success("Pelanggan dihapus");
  };

  const handleBroadcast = (customer: Customer) => {
    const message = "Halo [Nama], dapatkan penawaran spesial minggu ini hanya di toko kami!";
    const personalized = message.replace("[Nama]", customer.nama);
    const phoneClean = customer.noWA.replace(/[^0-9]/g, "");
    window.open(`https://api.whatsapp.com/send?phone=${phoneClean}&text=${encodeURIComponent(personalized)}`, "_blank");
  };

  const handleRedeemPoin = async () => {
    if (!redeemingCustomer || redeemPoin <= 0) return;
    const customer = await db.customers.get(redeemingCustomer.id);
    if (!customer || customer.poin < redeemPoin) return showToast.error("Poin tidak cukup!");
    await db.customers.update(redeemingCustomer.id, { poin: customer.poin - redeemPoin });
    showToast.success(`${redeemPoin} poin berhasil ditukar!`);
    setShowRedeemModal(false);
    setRedeemPoin(0);
    setRedeemingCustomer(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);
    const ext = file.name.split(".").pop()?.toLowerCase();
    try {
      let parsed: ParsedContact[] = [];
      if (ext === "csv" || ext === "txt") parsed = parseCSV(await file.text());
      else if (ext === "vcf" || ext === "vcard") parsed = parseVCF(await file.text());
      else if (ext === "xlsx" || ext === "xls") parsed = parseExcel(await file.arrayBuffer());
      else { showToast.error("Format file tidak didukung"); return; }
      if (parsed.length === 0) { showToast.error("Tidak ditemukan kontak valid."); return; }
      setImportPreview(parsed);
      setShowImportModal(true);
    } catch { showToast.error("Gagal membaca file."); }
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleImportConfirm = async () => {
    let imported = 0;
    for (const c of importPreview) {
      const exists = customers.some((ex) => ex.nama.toLowerCase() === c.nama.toLowerCase() && ex.noWA === c.noWA);
      if (exists) continue;
      await db.customers.add({
        id: crypto.randomUUID(),
        bookOrBranchId,
        nama: c.nama,
        noWA: c.noWA,
        totalTransaksi: 0, totalBelanja: 0, poin: 0,
        terakhirTransaksi: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
      imported++;
    }
    setImportPreview([]);
    setShowImportModal(false);
    showToast.success(`Berhasil impor ${imported} pelanggan.`);
  };

  if (_customers === undefined) return (
    <PageContainer>
      <Skeleton variant="card" count={5} />
    </PageContainer>
  );

  return (
    <PageContainer>
      <input ref={fileRef} type="file" accept=".csv,.txt,.vcf,.vcard,.xlsx,.xls" className="hidden" onChange={handleFileChange} />

      <div className="space-y-4">
        <CustomerHeader cabangSlug={cabangSlug} onImport={() => fileRef.current?.click()} onAdd={() => setShowAddModal(true)} />
        <CustomerSummaryCards customers={customers} allPiutang={allPiutang} />
        <CustomerToolbar searchValue={searchQuery} onSearchChange={setSearchQuery} filterStatus={filterStatus} onFilterStatusChange={setFilterStatus} />

        {filteredCustomers.length === 0 ? (
          <CustomerEmptyState onAdd={() => setShowAddModal(true)} hasFilter={!!searchQuery || filterStatus !== "semua"} />
        ) : (
          <CustomerTable
            customers={filteredCustomers}
            customerPiutangMap={customerPiutangMap}
            onSelect={setSelectedCustomer}
            onEdit={setEditingCustomer}
            onDelete={handleDeleteCustomer}
            onBroadcast={handleBroadcast}
            selectedId={selectedCustomer?.id}
          />
        )}
      </div>

      <CustomerForm open={showAddModal} onClose={() => setShowAddModal(false)} onSubmit={handleAddCustomer} title="Daftarkan Pelanggan Baru" />

      <CustomerForm
        open={!!editingCustomer}
        onClose={() => setEditingCustomer(null)}
        onSubmit={handleEditSubmit}
        title="Edit Pelanggan"
        initialData={editingCustomer ? { nama: editingCustomer.nama, noWA: editingCustomer.noWA } : undefined}
      />

      <CustomerDetailDrawer
        customer={selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        onRedeem={(c) => { setRedeemingCustomer(c); setRedeemPoin(0); setShowRedeemModal(true); }}
        onEdit={setEditingCustomer}
        onDelete={handleDeleteCustomer}
      />

      <Modal open={showImportModal} onClose={() => { setShowImportModal(false); setImportPreview([]); }} title="Impor Pelanggan" size="sm"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => { setShowImportModal(false); setImportPreview([]); }}>Batal</Button>
            <Button variant="primary" className="flex-1" onClick={handleImportConfirm}><Check className="w-4 h-4" /> Impor {importPreview.length} Pelanggan</Button>
          </div>
        }
      >
        <p className="text-[10px] text-slate-400 mb-1">
          File: <span className="font-bold text-slate-600 dark:text-slate-300">{importFileName}</span>
        </p>
        <p className="text-[10px] text-slate-400 mb-3">
          Ditemukan <span className="font-bold text-[#008CEB]">{importPreview.length}</span> kontak
        </p>
        <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
          {importPreview.map((c, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-zinc-800 last:border-0">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#008CEB] to-[#00C9A7] flex items-center justify-center text-white text-[10px] font-extrabold shrink-0">
                {c.nama.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold line-clamp-1">{c.nama}</p>
                <p className="text-[9px] text-slate-400">{c.noWA}</p>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      <Modal open={showRedeemModal} onClose={() => { setShowRedeemModal(false); setRedeemingCustomer(null); setRedeemPoin(0); }} title={`Tukar Poin - ${redeemingCustomer?.nama || ""}`} size="sm"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => { setShowRedeemModal(false); setRedeemingCustomer(null); setRedeemPoin(0); }}>Batal</Button>
            <Button variant="primary" className="flex-1 !bg-gradient-to-r from-amber-500 to-amber-600 !shadow-amber-500/20" onClick={handleRedeemPoin} disabled={redeemPoin <= 0}>Tukar</Button>
          </div>
        }
      >
        <p className="text-[10px] text-slate-400 mb-3">
          Poin tersedia: <span className="font-bold text-amber-500">{redeemingCustomer?.poin.toLocaleString() || "0"}</span>
        </p>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Jumlah Poin</label>
          <input
            type="number"
            min="0"
            max={redeemingCustomer?.poin || 0}
            value={redeemPoin || ""}
            onChange={(e) => setRedeemPoin(Math.min(redeemingCustomer?.poin || 0, Math.max(0, Number(e.target.value))))}
            placeholder="0"
            className="w-full px-3 py-2 bg-slate-100 dark:bg-zinc-900 rounded-xl border-none outline-none text-xs"
          />
        </div>
        {redeemPoin > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-3 text-center mt-3">
            <p className="text-xs text-slate-500">Nilai diskon setara</p>
            <p className="text-lg font-extrabold text-amber-500">Rp{(redeemPoin * 100).toLocaleString()}</p>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}