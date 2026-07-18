"use client";

import React, { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type UnitId, type Customer } from "@/lib/db-v4";
import * as XLSX from "xlsx";
import { ArrowLeft, Download, UserPlus, Search, Smartphone, DollarSign, MessageCircle, Send, Check, History } from "lucide-react";
import { showToast } from "@/lib/toast";

const BRANCH_MAP: Record<string, UnitId> = {
  pribadi: "pribadi",
  keluarga: "keluarga",
  percetakan: "usaha-percetakan",
  laptop: "usaha-laptop",
  gadget: "usaha-gadget",
  warkop: "usaha-warkop",
  konveksi: "usaha-konveksi",
  kelontong: "usaha-kelontong",
  "toko-pakaian": "usaha-toko-pakaian",
};

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
    const name = fnLine ? fnLine.replace("FN:", "").trim() : "";
    const phone = telLine ? telLine.split(":").slice(1).join(":").replace(/[^0-9+]/g, "") : "";
    return { nama: name, noWA: phone };
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
  const router = useRouter();
  const cabangSlug = (params?.cabang as string) || "";
  const bookOrBranchId = BRANCH_MAP[cabangSlug] || "usaha-percetakan";
  const fileRef = useRef<HTMLInputElement>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPreview, setImportPreview] = useState<ParsedContact[]>([]);
  const [importFileName, setImportFileName] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [promoMessage, setPromoMessage] = useState(
    "Halo [Nama], dapatkan penawaran spesial minggu ini hanya di toko kami!"
  );
  const [expandedInstallment, setExpandedInstallment] = useState<string | null>(null);

  const customers =
    useLiveQuery(
      () => db.customers.where("bookOrBranchId").equals(bookOrBranchId).toArray(),
      [bookOrBranchId]
    ) || [];

  const customerPiutang =
    useLiveQuery(
      () => {
        if (!selectedCustomer?.id) return [];
        return db.piutang.where("customerId").equals(selectedCustomer.id).toArray();
      },
      [selectedCustomer?.id]
    ) || [];

  const piutangInstallments =
    useLiveQuery(
      () => db.piutangInstallments.where("bookOrBranchId").equals(bookOrBranchId).toArray(),
      [bookOrBranchId]
    ) || [];

  const filteredCustomers = customers.filter(
    (c) =>
      c.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.noWA.includes(searchQuery)
  );

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return showToast.error("Nama dan nomor HP wajib diisi!");
    const formattedPhone = phone.replace(/[^0-9+]/g, "");
    await db.customers.add({
      id: crypto.randomUUID(),
      bookOrBranchId,
      nama: name,
      noWA: formattedPhone,
      totalTransaksi: 0,
      totalBelanja: 0,
      poin: 0,
      terakhirTransaksi: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
    setName("");
    setPhone("");
    setShowAddModal(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);
    const ext = file.name.split(".").pop()?.toLowerCase();
    try {
      let parsed: ParsedContact[] = [];
      if (ext === "csv" || ext === "txt") {
        const text = await file.text();
        parsed = parseCSV(text);
      } else if (ext === "vcf" || ext === "vcard") {
        const text = await file.text();
        parsed = parseVCF(text);
      } else if (ext === "xlsx" || ext === "xls") {
        const buffer = await file.arrayBuffer();
        parsed = parseExcel(buffer);
      } else {
        showToast.error("Format file tidak didukung. Gunakan CSV, VCF, atau Excel (.xlsx)");
        return;
      }
      if (parsed.length === 0) {
        showToast.error("Tidak ditemukan kontak valid di file ini.");
        return;
      }
      setImportPreview(parsed);
      setShowImportModal(true);
    } catch {
      showToast.error("Gagal membaca file. Pastikan format file benar.");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleImportConfirm = async () => {
    let imported = 0;
    for (const c of importPreview) {
      const exists = customers.some(
        (ex) => ex.nama.toLowerCase() === c.nama.toLowerCase() && ex.noWA === c.noWA
      );
      if (exists) continue;
      await db.customers.add({
        id: crypto.randomUUID(),
        bookOrBranchId,
        nama: c.nama,
        noWA: c.noWA,
        totalTransaksi: 0,
        totalBelanja: 0,
        poin: 0,
        terakhirTransaksi: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
      imported++;
    }
    setImportPreview([]);
    setShowImportModal(false);
    showToast.success(`Berhasil impor ${imported} pelanggan.`);
  };

  const handleBroadcast = (customer: Customer) => {
    const personalizedMessage = promoMessage.replace("[Nama]", customer.nama);
    const phoneClean = customer.noWA.replace(/[^0-9]/g, "");
    const waUrl = `https://api.whatsapp.com/send?phone=${phoneClean}&text=${encodeURIComponent(personalizedMessage)}`;
    window.open(waUrl, "_blank");
  };

  return (
    <div className="flex-1 flex flex-col pt-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push(`/buku-usaha/${cabangSlug}`)}
          className="p-2 bg-white dark:bg-[#131527] rounded-full shadow-md scale-press"
        >
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </button>
        <h1 className="text-lg font-extrabold tracking-tight capitalize">CRM Pelanggan</h1>
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt,.vcf,.vcard,.xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="p-2 bg-amber-500 text-white rounded-full shadow-md scale-press"
            title="Impor dari file"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="p-2 bg-[#008CEB] text-white rounded-full shadow-md scale-press"
          >
            <UserPlus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Cari nama atau nomor HP..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs bg-slate-100 dark:bg-zinc-900 rounded-xl border-none outline-none focus:ring-1 focus:ring-[#008CEB]"
        />
      </div>

      {/* Customer List */}
      <div className="flex-1 overflow-y-auto space-y-3 max-h-[300px] pr-1">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">Belum ada data pelanggan.</div>
        ) : (
          filteredCustomers.map((c, i) => (
            <div
              key={c.id}
              onClick={() => setSelectedCustomer(selectedCustomer?.id === c.id ? null : c)}
              className={`premium-card premium-card-glow p-4 cursor-pointer transition-all duration-200 animate-slide-up ${
                selectedCustomer?.id === c.id ? "border-[#008CEB] ring-1 ring-[#008CEB]/30" : ""
              }`}
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: "backwards" }}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#008CEB] to-[#00C9A7] flex items-center justify-center text-white text-xs font-extrabold shadow-md">
                    {c.nama.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-heading font-extrabold">{c.nama}</h4>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Smartphone className="w-3.5 h-3.5" /> {c.noWA}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Total Belanja</span>
                  <p className="text-xs font-heading font-extrabold text-[#00C9A7] flex items-center gap-1 justify-end">
                    <DollarSign className="w-3.5 h-3.5" /> Rp{c.totalBelanja.toLocaleString()}
                  </p>
                </div>
              </div>

              {selectedCustomer?.id === c.id && (
                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-zinc-800 space-y-2 animate-fade-in">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBroadcast(c);
                    }}
                    className="w-full py-2.5 bg-emerald-500 text-white rounded-xl flex items-center justify-center gap-1.5 font-bold text-[10px] hover:bg-emerald-600 active:scale-[0.97] transition-all duration-200"
                  >
                    <MessageCircle className="w-4 h-4" /> Kirim WA Promosi
                  </button>

                  {customerPiutang.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Riwayat Piutang</h4>
                      {customerPiutang.map((p) => {
                        const installments = piutangInstallments.filter((i) => i.piutangId === p.id);
                        return (
                          <div key={p.id} className="bg-slate-50 dark:bg-zinc-900 rounded-xl p-3 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs font-bold">
                                  Rp{p.totalPiutang.toLocaleString()}
                                </p>
                                <p className={`text-[10px] font-semibold ${p.status === "LUNAS" ? "text-emerald-500" : "text-amber-500"}`}>
                                  {p.status} • Sisa Rp{p.sisaPiutang.toLocaleString()}
                                </p>
                              </div>
                              {installments.length > 0 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedInstallment(expandedInstallment === p.id ? null : p.id);
                                  }}
                                  className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold bg-white dark:bg-[#131527] rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-[#008CEB]/5 active:scale-[0.97] transition-all"
                                >
                                  <History className="w-3 h-3" /> {expandedInstallment === p.id ? "Tutup" : `${installments.length} Cicilan`}
                                </button>
                              )}
                            </div>
                            {expandedInstallment === p.id && installments.length > 0 && (
                              <div className="pt-1 space-y-1">
                                {installments.sort((a, b) => b.tanggal.localeCompare(a.tanggal)).map((inst) => (
                                  <div key={inst.id} className="flex items-center justify-between text-[10px] py-1.5 px-2 bg-white dark:bg-[#131527] rounded-lg">
                                    <div className="min-w-0">
                                      <p className="font-bold text-[#008CEB]">
                                        Rp{inst.jumlah.toLocaleString()}
                                      </p>
                                      <p className="text-slate-400">
                                        {new Date(inst.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                                      </p>
                                    </div>
                                    <div className="text-right min-w-0">
                                      <p className="font-semibold text-slate-600 dark:text-slate-300 capitalize">{inst.metode}</p>
                                      {inst.catatan && (
                                        <p className="text-slate-400 line-clamp-1">{inst.catatan}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Broadcast Area */}
      {selectedCustomer && (
        <div className="premium-card p-4 space-y-3 border-[#008CEB]/40">
          <h3 className="text-xs font-extrabold text-[#008CEB]">
            Kirim Promosi ke: {selectedCustomer.nama}
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={promoMessage}
              onChange={(e) => setPromoMessage(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs bg-slate-100 dark:bg-zinc-900 rounded-xl outline-none"
            />
            <button
              onClick={() => handleBroadcast(selectedCustomer)}
              className="px-3 py-1.5 bg-[#008CEB] text-white rounded-xl text-xs font-bold flex items-center gap-1"
            >
              <Send className="w-4 h-4" /> Kirim
            </button>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleAddCustomer}
            className="bg-white dark:bg-[#131527] w-full max-w-sm rounded-3xl p-5 space-y-4 shadow-xl animate-slide-up"
          >
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">
              Daftarkan Pelanggan Baru
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nama Pelanggan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-zinc-900 rounded-xl border-none outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">No. HP / WhatsApp</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 62812345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-zinc-900 rounded-xl border-none outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2 text-xs font-bold pt-2">
              <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 bg-slate-100 dark:bg-zinc-800 rounded-xl">Batal</button>
              <button type="submit" className="flex-1 py-2.5 bg-[#008CEB] text-white rounded-xl">Simpan</button>
            </div>
          </form>
        </div>
      )}

      {/* Import Preview Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#131527] w-full max-w-sm rounded-3xl p-5 space-y-4 shadow-xl animate-slide-up">
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-[#008CEB]" />
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">
                Impor Pelanggan
              </h3>
            </div>
            <p className="text-[10px] text-slate-400">
              File: <span className="font-bold text-slate-600 dark:text-slate-300">{importFileName}</span>
            </p>
            <p className="text-[10px] text-slate-400">
              Ditemukan <span className="font-bold text-[#008CEB]">{importPreview.length}</span> kontak
            </p>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {importPreview.map((c, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-zinc-800 last:border-0">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#008CEB] to-[#00C9A7] flex items-center justify-center text-white text-[10px] font-extrabold">
                    {c.nama.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold line-clamp-1">{c.nama}</p>
                    <p className="text-[9px] text-slate-400">{c.noWA}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 text-xs font-bold pt-2">
              <button
                onClick={() => { setShowImportModal(false); setImportPreview([]); }}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-zinc-800 rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={handleImportConfirm}
                className="flex-1 py-2.5 bg-[#008CEB] text-white rounded-xl flex items-center justify-center gap-1"
              >
                <Check className="w-4 h-4" /> Impor {importPreview.length} Pelanggan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
