"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { db, type BookOrBranch } from "@/lib/db-v4";
import { Package, Save } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branch: BookOrBranch;
  variant?: "warkop" | "kelontong" | "general";
  onSaved?: () => void;
}

export default function QuickAddProductModal({ open, onOpenChange, branch, variant = "general", onSaved }: Props) {
  const [nama, setNama] = useState("");
  const [hargaJual, setHargaJual] = useState("");
  const [hargaModal, setHargaModal] = useState("");
  const [kategori, setKategori] = useState("");
  const [sku, setSku] = useState("");
  const [stok, setStok] = useState("");
  const [satuan, setSatuan] = useState("");
  const [stokMin, setStokMin] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setNama(""); setHargaJual(""); setHargaModal(""); setKategori("");
    setSku(""); setStok(""); setSatuan(""); setStokMin("");
  };

  const handleSave = async () => {
    if (!nama.trim()) { toast.error("Nama produk harus diisi"); return; }
    const hj = parseInt(hargaJual.replace(/\D/g, ""), 10) || 0;
    if (hj <= 0) { toast.error("Harga jual harus diisi"); return; }
    setSaving(true);
    try {
      await db.inventory.add({
        id: crypto.randomUUID(),
        bookOrBranchId: branch,
        sku: sku || `AUTO-${Date.now().toString(36).toUpperCase()}`,
        nama: nama.trim(),
        kategori: kategori || "Umum",
        stok: parseInt(stok) || 0,
        stokMin: parseInt(stokMin) || 0,
        hargaModal: parseInt(hargaModal.replace(/\D/g, ""), 10) || 0,
        hargaJual: hj,
        satuan: satuan || "pcs",
        catatan: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      toast.success(`"${nama.trim()}" berhasil ditambahkan!`);
      reset();
      onOpenChange(false);
      onSaved?.();
    } catch {
      toast.error("Gagal menyimpan produk");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Package className="size-5 text-emerald-500" />
            <DialogTitle>Tambah Produk Baru</DialogTitle>
          </div>
          <DialogDescription>Produk akan langsung tersimpan & muncul di daftar kasir</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Nama Produk</label>
            <input type="text" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama produk" className="input-premium w-full text-xs" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Harga Jual</label>
              <input type="text" inputMode="numeric" value={hargaJual} onChange={(e) => setHargaJual(e.target.value.replace(/\D/g, ""))} placeholder="Rp" className="input-premium w-full text-xs tabular-nums" />
            </div>
            {variant === "kelontong" && (
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Harga Modal (HPP)</label>
                <input type="text" inputMode="numeric" value={hargaModal} onChange={(e) => setHargaModal(e.target.value.replace(/\D/g, ""))} placeholder="Rp" className="input-premium w-full text-xs tabular-nums" />
              </div>
            )}
          </div>

          {(variant === "warkop" || variant === "kelontong") && (
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Kategori</label>
              <select value={kategori} onChange={(e) => setKategori(e.target.value)} className="input-premium w-full text-xs">
                <option value="">Pilih kategori</option>
                {variant === "warkop" ? (
                  <>
                    <option value="Makanan">Makanan</option>
                    <option value="Minuman">Minuman</option>
                    <option value="Snack">Snack</option>
                  </>
                ) : (
                  <>
                    <option value="Sembako">Sembako</option>
                    <option value="Minuman">Minuman</option>
                    <option value="Makanan Ringan">Makanan Ringan</option>
                    <option value="Rumah Tangga">Rumah Tangga</option>
                    <option value="Alat Tulis">Alat Tulis</option>
                  </>
                )}
              </select>
            </div>
          )}

          {variant === "kelontong" && (
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Kode Barcode / SKU</label>
              <input type="text" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Opsional" className="input-premium w-full text-xs" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Stok Awal</label>
              <input type="number" min={0} value={stok} onChange={(e) => setStok(e.target.value)} placeholder="0 = Unlimited" className="input-premium w-full text-xs" />
            </div>
            {variant === "kelontong" && (
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Stok Minimum</label>
                <input type="number" min={0} value={stokMin} onChange={(e) => setStokMin(e.target.value)} placeholder="Safety stock" className="input-premium w-full text-xs" />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Satuan</label>
            <input type="text" value={satuan} onChange={(e) => setSatuan(e.target.value)} placeholder="pcs, kg, meter, dll" className="input-premium w-full text-xs" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }} size="sm">Batal</Button>
          <Button onClick={handleSave} disabled={saving || !nama.trim()} size="sm">
            <Save className="size-3.5" /> {saving ? "Menyimpan..." : "Simpan Produk"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
