"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ClipboardList, Save } from "lucide-react";
import { type BookOrBranch } from "@/lib/db-v4";

type BranchCategory = "percetakan" | "gadget-laptop" | "konveksi" | "general";

function getBranchCategory(branch: BookOrBranch): BranchCategory {
  if (branch === "usaha-percetakan") return "percetakan";
  if (branch === "usaha-gadget" || branch === "usaha-laptop") return "gadget-laptop";
  if (branch === "usaha-konveksi" || branch === "usaha-toko-pakaian") return "konveksi";
  return "general";
}

interface PercetakanSpec {
  ukuran: string;
  kertasBahan: string;
  jilid: string;
  cover: string;
  halaman: string;
}

interface GadgetLaptopSpec {
  imeiSn: string;
  spesifikasiHardware: string;
  kondisiKelengkapan: string;
  masaGaransi: string;
}

interface KonveksiSpec {
  ukuranBaju: string;
  warna: string;
  bahanJenis: string;
  jumlah: string;
  catatan: string;
}

interface GeneralSpec {
  catatan: string;
}

type SpecData = PercetakanSpec | GadgetLaptopSpec | KonveksiSpec | GeneralSpec;

function parseSpesifikasi(existing: string, category: BranchCategory): SpecData {
  if (!existing) {
    if (category === "percetakan") return { ukuran: "", kertasBahan: "", jilid: "", cover: "", halaman: "" };
    if (category === "gadget-laptop") return { imeiSn: "", spesifikasiHardware: "", kondisiKelengkapan: "", masaGaransi: "" };
    if (category === "konveksi") return { ukuranBaju: "", warna: "", bahanJenis: "", jumlah: "", catatan: "" };
    return { catatan: "" };
  }
  if (category === "percetakan") {
    return {
      ukuran: extract(existing, "Ukuran"),
      kertasBahan: extract(existing, "Kertas"),
      jilid: extract(existing, "Jilid"),
      cover: extract(existing, "Cover"),
      halaman: extract(existing, "Halaman"),
    };
  }
  if (category === "gadget-laptop") {
    return {
      imeiSn: extract(existing, "IMEI"),
      spesifikasiHardware: extract(existing, "Spesifikasi"),
      kondisiKelengkapan: extract(existing, "Kondisi"),
      masaGaransi: extract(existing, "Garansi"),
    };
  }
  if (category === "konveksi") {
    return {
      ukuranBaju: extract(existing, "Ukuran"),
      warna: extract(existing, "Warna"),
      bahanJenis: extract(existing, "Bahan"),
      jumlah: extract(existing, "Jumlah"),
      catatan: extract(existing, "Catatan"),
    };
  }
  return { catatan: existing };
}

function extract(text: string, label: string): string {
  const re = new RegExp(`${label}:\\s*([^|]+)`);
  const m = text.match(re);
  return m ? m[1].trim() : "";
}

function formatPercetakan(d: PercetakanSpec): string {
  const parts: string[] = [];
  if (d.ukuran) parts.push(`Ukuran: ${d.ukuran}`);
  if (d.kertasBahan) parts.push(`Kertas: ${d.kertasBahan}`);
  if (d.jilid) parts.push(`Jilid: ${d.jilid}`);
  if (d.cover) parts.push(`Cover: ${d.cover}`);
  if (d.halaman) parts.push(`Halaman: ${d.halaman}`);
  return parts.join(" | ");
}

function formatGadgetLaptop(d: GadgetLaptopSpec): string {
  const parts: string[] = [];
  if (d.imeiSn) parts.push(`IMEI/SN: ${d.imeiSn}`);
  if (d.spesifikasiHardware) parts.push(`Spesifikasi: ${d.spesifikasiHardware}`);
  if (d.kondisiKelengkapan) parts.push(`Kondisi: ${d.kondisiKelengkapan}`);
  if (d.masaGaransi) parts.push(`Garansi: ${d.masaGaransi}`);
  return parts.join(" | ");
}

function formatKonveksi(d: KonveksiSpec): string {
  const parts: string[] = [];
  if (d.ukuranBaju) parts.push(`Ukuran: ${d.ukuranBaju}`);
  if (d.warna) parts.push(`Warna: ${d.warna}`);
  if (d.bahanJenis) parts.push(`Bahan: ${d.bahanJenis}`);
  if (d.jumlah) parts.push(`Jumlah: ${d.jumlah}`);
  if (d.catatan) parts.push(`Catatan: ${d.catatan}`);
  return parts.join(" | ");
}

interface SpesifikasiModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branch: BookOrBranch;
  existingSpesifikasi: string;
  onSave: (formatted: string) => void;
}

export default function SpesifikasiModal({ open, onOpenChange, branch, existingSpesifikasi, onSave }: SpesifikasiModalProps) {
  const category = getBranchCategory(branch);
  const [data, setData] = useState<SpecData>(() => parseSpesifikasi(existingSpesifikasi, category));

  useEffect(() => {
    setData(parseSpesifikasi(existingSpesifikasi, category));
  }, [existingSpesifikasi, category, open]);

  const handleSave = () => {
    let formatted = "";
    if (category === "percetakan") formatted = formatPercetakan(data as PercetakanSpec);
    else if (category === "gadget-laptop") formatted = formatGadgetLaptop(data as GadgetLaptopSpec);
    else if (category === "konveksi") formatted = formatKonveksi(data as KonveksiSpec);
    else formatted = (data as GeneralSpec).catatan;
    onSave(formatted);
    onOpenChange(false);
  };

  const setField = (key: string, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="backdrop-blur-lg bg-white/95 dark:bg-[#131527]/95">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ClipboardList className="size-5 text-[#7B61FF]" />
            <DialogTitle>Atur Spesifikasi</DialogTitle>
          </div>
          <DialogDescription>Isi detail spesifikasi item ini</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* ── Percetakan / Sablon ── */}
          {category === "percetakan" && (
            <>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Ukuran</label>
                <input
                  type="text"
                  value={(data as PercetakanSpec).ukuran}
                  onChange={(e) => setField("ukuran", e.target.value)}
                  placeholder="e.g. A5, A4, F4, Banner 2x3m"
                  className="input-premium w-full text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Kertas / Bahan</label>
                <input
                  type="text"
                  value={(data as PercetakanSpec).kertasBahan}
                  onChange={(e) => setField("kertasBahan", e.target.value)}
                  placeholder="e.g. Art Paper 150g, HVS 80g, Flexi 340g"
                  className="input-premium w-full text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Jilid / Finishing</label>
                <input
                  type="text"
                  value={(data as PercetakanSpec).jilid}
                  onChange={(e) => setField("jilid", e.target.value)}
                  placeholder="e.g. Lem Panas, Spiral, Staples"
                  className="input-premium w-full text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Cover</label>
                <input
                  type="text"
                  value={(data as PercetakanSpec).cover}
                  onChange={(e) => setField("cover", e.target.value)}
                  placeholder="e.g. Softcover Doff, Hardcover Emboss"
                  className="input-premium w-full text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Halaman</label>
                <input
                  type="number"
                  min={0}
                  value={(data as PercetakanSpec).halaman}
                  onChange={(e) => setField("halaman", e.target.value)}
                  placeholder="Jumlah halaman cetak"
                  className="input-premium w-full text-xs"
                />
              </div>
            </>
          )}

          {/* ── Gadget / Laptop ── */}
          {category === "gadget-laptop" && (
            <>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">IMEI / Serial Number (SN)</label>
                <input
                  type="text"
                  value={(data as GadgetLaptopSpec).imeiSn}
                  onChange={(e) => setField("imeiSn", e.target.value)}
                  placeholder="Wajib diisi untuk pelacakan garansi"
                  className="input-premium w-full text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Spesifikasi Hardware</label>
                <input
                  type="text"
                  value={(data as GadgetLaptopSpec).spesifikasiHardware}
                  onChange={(e) => setField("spesifikasiHardware", e.target.value)}
                  placeholder="RAM, Storage, Processor"
                  className="input-premium w-full text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Kondisi & Kelengkapan</label>
                <input
                  type="text"
                  value={(data as GadgetLaptopSpec).kondisiKelengkapan}
                  onChange={(e) => setField("kondisiKelengkapan", e.target.value)}
                  placeholder="e.g. Fullset mulus, minus lecet pemakaian"
                  className="input-premium w-full text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Masa Garansi</label>
                <input
                  type="text"
                  value={(data as GadgetLaptopSpec).masaGaransi}
                  onChange={(e) => setField("masaGaransi", e.target.value)}
                  placeholder="e.g. Resmi iBox s/d Okt 2026, Toko 1 Bulan"
                  className="input-premium w-full text-xs"
                />
              </div>
            </>
          )}

          {/* ── Konveksi / Pakaian ── */}
          {category === "konveksi" && (
            <>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Ukuran Baju</label>
                <input
                  type="text"
                  value={(data as KonveksiSpec).ukuranBaju}
                  onChange={(e) => setField("ukuranBaju", e.target.value)}
                  placeholder="e.g. S, M, L, XL, XXL, Custom"
                  className="input-premium w-full text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Warna</label>
                <input
                  type="text"
                  value={(data as KonveksiSpec).warna}
                  onChange={(e) => setField("warna", e.target.value)}
                  placeholder="e.g. Hitam, Navy, Putih, Custom #FF0000"
                  className="input-premium w-full text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Bahan / Jenis</label>
                <input
                  type="text"
                  value={(data as KonveksiSpec).bahanJenis}
                  onChange={(e) => setField("bahanJenis", e.target.value)}
                  placeholder="e.g. Cotton Combed 30s, Fleece, Diadora"
                  className="input-premium w-full text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Jumlah</label>
                <input
                  type="number"
                  min={0}
                  value={(data as KonveksiSpec).jumlah}
                  onChange={(e) => setField("jumlah", e.target.value)}
                  placeholder="Jumlah pcs"
                  className="input-premium w-full text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Catatan Tambahan</label>
                <textarea
                  value={(data as KonveksiSpec).catatan}
                  onChange={(e) => setField("catatan", e.target.value)}
                  placeholder="e.g. Sablon depan, Bordir belakang, Kancing 3"
                  rows={3}
                  className="input-premium w-full text-xs resize-none"
                />
              </div>
            </>
          )}

          {/* ── General (Warkop, Kelontong, dll) ── */}
          {category === "general" && (
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Catatan / Spesifikasi Tambahan</label>
              <textarea
                value={(data as GeneralSpec).catatan}
                onChange={(e) => setField("catatan", e.target.value)}
                placeholder="e.g. Ukuran baju: L, Warna: Hitam, Catatan: Tidak pedas"
                rows={4}
                className="input-premium w-full text-xs resize-none"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} size="sm">Batal</Button>
          <Button onClick={handleSave} size="sm">
            <Save className="size-3.5" /> Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
