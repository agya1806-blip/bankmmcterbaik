"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Package, ArrowLeft, Plus, TrendingUp, TrendingDown,
  AlertTriangle, Search, X, History, Trash2, PackageSearch,
} from "lucide-react";
import toast from "react-hot-toast";
import { useBusinessStore, BizUnit, BIZ_UNIT_LABELS } from "@/store/useBusinessStore";
import { CardSkeleton } from "@/components/ui/skeleton";

function formatRupiah(n: number) {
  return `IDR ${n.toLocaleString("id-ID")}`;
}

const UNIT_FILTERS: { key: "all" | BizUnit; label: string }[] = [
  { key: "all", label: "Semua" },
  ...(Object.entries(BIZ_UNIT_LABELS) as [BizUnit, string][]).map(([k, v]) => ({
    key: k as "all" | BizUnit,
    label: v,
  })),
];

type FilterKey = "all" | BizUnit;

const KATEGORI_OPTIONS = [
  "Bahan Baku", "Barang Jadi", "Sparepart", "ATK", "Minuman", "Makanan", "Lainnya",
];

const SATUAN_OPTIONS = [
  "Pcs", "Lembar", "Kg", "Gram", "Meter", "Liter", "Pack", "Roll", "Box",
];

export default function InventoryPage() {
  const router = useRouter();
  const store = useBusinessStore();
  const { inventory, inventoryMutations } = store;

  const [mounted, setMounted] = useState(false);

  /* ─── Tab ─── */
  const [tab, setTab] = useState<"list" | "tambah" | "mutasi">("list");

  /* ─── Filter ─── */
  const [filterUnit, setFilterUnit] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");

  /* ─── Form tambah/edit ─── */
  const [editId, setEditId] = useState<string | null>(null);
  const [formUnit, setFormUnit] = useState<BizUnit>("percetakan");
  const [formSku, setFormSku] = useState("");
  const [formNama, setFormNama] = useState("");
  const [formKategori, setFormKategori] = useState("Barang Jadi");
  const [formStok, setFormStok] = useState("");
  const [formStokMin, setFormStokMin] = useState("");
  const [formHargaModal, setFormHargaModal] = useState("");
  const [formHargaJual, setFormHargaJual] = useState("");
  const [formSatuan, setFormSatuan] = useState("Pcs");
  const [formCatatan, setFormCatatan] = useState("");

  /* ─── Stok Masuk/Keluar ─── */
  const [adjustItemId, setAdjustItemId] = useState<string | null>(null);
  const [adjustTipe, setAdjustTipe] = useState<"masuk" | "keluar">("masuk");
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustAlasan, setAdjustAlasan] = useState("");

  useEffect(() => setMounted(true), []);

  /* ─── Filtered items ─── */
  const filteredItems = useMemo(() => {
    let items = inventory;
    if (filterUnit !== "all") {
      items = items.filter((i) => i.unit === filterUnit);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (i) =>
          i.nama.toLowerCase().includes(q) ||
          i.sku.toLowerCase().includes(q) ||
          i.kategori.toLowerCase().includes(q)
      );
    }
    return items;
  }, [inventory, filterUnit, search]);

  const lowStockCount = useMemo(
    () => inventory.filter((i) => i.stok > 0 && i.stok <= i.stokMin).length,
    [inventory]
  );
  const outOfStockCount = useMemo(
    () => inventory.filter((i) => i.stok === 0).length,
    [inventory]
  );

  /* ─── Reset form ─── */
  const resetForm = useCallback(() => {
    setEditId(null);
    setFormUnit("percetakan");
    setFormSku("");
    setFormNama("");
    setFormKategori("Barang Jadi");
    setFormStok("");
    setFormStokMin("");
    setFormHargaModal("");
    setFormHargaJual("");
    setFormSatuan("Pcs");
    setFormCatatan("");
  }, []);

  /* ─── Simpan ─── */
  const handleSimpan = useCallback(() => {
    if (!formNama.trim()) { toast.error("Nama barang wajib diisi"); return; }
    if (!formSku.trim()) { toast.error("SKU wajib diisi"); return; }
    const stok = parseInt(formStok) || 0;
    const stokMin = parseInt(formStokMin) || 0;
    const hargaModal = parseInt(formHargaModal.replace(/\D/g, "")) || 0;
    const hargaJual = parseInt(formHargaJual.replace(/\D/g, "")) || 0;

    if (editId) {
      store.updateInventoryItem(editId, {
        unit: formUnit,
        sku: formSku.trim(),
        nama: formNama.trim(),
        kategori: formKategori,
        stok,
        stokMin,
        hargaModal,
        hargaJual,
        satuan: formSatuan,
        catatan: formCatatan || undefined,
      });
      toast.success("Barang diperbarui");
    } else {
      store.addInventoryItem({
        unit: formUnit,
        sku: formSku.trim(),
        nama: formNama.trim(),
        kategori: formKategori,
        stok,
        stokMin,
        hargaModal,
        hargaJual,
        satuan: formSatuan,
        catatan: formCatatan || undefined,
      });
      toast.success(`Barang ${formNama.trim()} ditambahkan`);
    }
    resetForm();
    setTab("list");
  }, [editId, formUnit, formSku, formNama, formKategori, formStok, formStokMin, formHargaModal, formHargaJual, formSatuan, formCatatan, store, resetForm]);

  /* ─── Edit item ─── */
  const handleEdit = useCallback((id: string) => {
    const item = inventory.find((i) => i.id === id);
    if (!item) return;
    setEditId(item.id);
    setFormUnit(item.unit);
    setFormSku(item.sku);
    setFormNama(item.nama);
    setFormKategori(item.kategori);
    setFormStok(String(item.stok));
    setFormStokMin(String(item.stokMin));
    setFormHargaModal(String(item.hargaModal));
    setFormHargaJual(String(item.hargaJual));
    setFormSatuan(item.satuan);
    setFormCatatan(item.catatan || "");
    setTab("tambah");
  }, [inventory]);

  /* ─── Hapus ─── */
  const handleHapus = useCallback((id: string, nama: string) => {
    store.deleteInventoryItem(id);
    toast.success(`Barang ${nama} dihapus`);
  }, [store]);

  /* ─── Adjust stok ─── */
  const openAdjust = useCallback((id: string, tipe: "masuk" | "keluar") => {
    setAdjustItemId(id);
    setAdjustTipe(tipe);
    setAdjustQty("");
    setAdjustAlasan("");
  }, []);

  const handleAdjust = useCallback(() => {
    if (!adjustItemId || !adjustQty) { toast.error("Isi jumlah"); return; }
    const qty = parseInt(adjustQty);
    if (!qty || qty <= 0) { toast.error("Jumlah harus lebih dari 0"); return; }
    if (!adjustAlasan.trim()) { toast.error("Isi alasan"); return; }
    const item = inventory.find((i) => i.id === adjustItemId);
    if (!item) return;
    if (adjustTipe === "keluar" && qty > item.stok) {
      toast.error(`Stok tidak mencukupi (tersedia: ${item.stok})`);
      return;
    }
    store.adjustStok(adjustItemId, adjustTipe, qty, adjustAlasan.trim());
    toast.success(`Stok ${adjustTipe === "masuk" ? "ditambah" : "dikurangi"} ${qty} ${item.satuan}`);
    setAdjustItemId(null);
  }, [adjustItemId, adjustTipe, adjustQty, adjustAlasan, inventory, store]);

  if (!mounted) return <div className="grid grid-cols-2 gap-4"><CardSkeleton /><CardSkeleton /></div>;

  const tabBtn = (key: "list" | "tambah" | "mutasi", label: string, icon: React.ElementType) => {
    const Ico = icon;
    const aktif = tab === key;
    return (
      <button key={key} onClick={() => { if (key === "tambah") resetForm(); setTab(key); }}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-bold transition-all ${
          aktif
            ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/20"
            : "bg-muted/30 text-muted-foreground/60 hover:bg-muted/50"
        }`}
      >
        <Ico className="size-3.5" /> {label}
      </button>
    );
  };

  const stokBadge = (stok: number, stokMin: number) => {
    if (stok === 0)
      return <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 text-[9px] font-bold">Habis</span>;
    if (stok <= stokMin)
      return <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[9px] font-bold">Menipis</span>;
    return <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-bold">Aman</span>;
  };

  const stokColor = (stok: number, stokMin: number) => {
    if (stok === 0) return "text-rose-500";
    if (stok <= stokMin) return "text-amber-500";
    return "text-emerald-500";
  };

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
            <Package className="size-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold font-heading">Manajemen Stok</h2>
            <p className="text-[10px] text-muted-foreground/60">Inventory & mutasi barang</p>
          </div>
        </div>
        <button onClick={() => { resetForm(); setTab("tambah"); }}
          className="px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 text-[10px] font-bold hover:bg-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-1"
        >
          <Plus className="size-3.5" /> Tambah Barang
        </button>
      </div>

      {/* ─── Summary ─── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="floating-card p-3 text-center">
          <p className="text-lg font-bold font-heading tabular-nums">{inventory.length}</p>
          <p className="text-[9px] text-muted-foreground/50">Total Barang</p>
        </div>
        <div className="floating-card p-3 text-center">
          <p className="text-lg font-bold font-heading tabular-nums text-amber-500">{lowStockCount}</p>
          <p className="text-[9px] text-muted-foreground/50">Stok Menipis</p>
        </div>
        <div className="floating-card p-3 text-center">
          <p className="text-lg font-bold font-heading tabular-nums text-rose-500">{outOfStockCount}</p>
          <p className="text-[9px] text-muted-foreground/50">Stok Habis</p>
        </div>
      </div>

      {/* ─── Tab Nav ─── */}
      <div className="flex gap-2">
        {tabBtn("list", "Daftar Barang", PackageSearch)}
        {tabBtn("tambah", editId ? "Edit Barang" : "Tambah Barang", Plus)}
        {tabBtn("mutasi", "Riwayat Mutasi", History)}
      </div>

      {/* ══════════════════════════════════════════════════
          TAB: LIST
          ══════════════════════════════════════════════════ */}
      {tab === "list" && (
        <div className="space-y-3">
          {/* Filter & Search */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/40" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama, SKU, kategori..." className="input-premium w-full text-[10px] pl-9" />
              {search && (
                <button onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/30 hover:text-muted-foreground/60"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          </div>

          {/* Unit filter chips */}
          <div className="flex gap-1.5 flex-wrap">
            {UNIT_FILTERS.map((f) => (
              <button key={f.key} onClick={() => setFilterUnit(f.key)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-semibold transition-all ${
                  filterUnit === f.key
                    ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md"
                    : "bg-muted/30 text-muted-foreground/50 hover:bg-muted/50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Items */}
          {filteredItems.length === 0 ? (
            <div className="floating-card p-6 text-center">
              <Package className="size-10 mx-auto text-muted-foreground/20" />
              <p className="text-xs text-muted-foreground/40 mt-2">
                {inventory.length === 0 ? "Belum ada barang, tambah barang baru" : "Tidak ada barang ditemukan"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredItems.map((item) => (
                <div key={item.id} className="floating-card p-4 space-y-2.5 group">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold truncate">{item.nama}</p>
                        {stokBadge(item.stok, item.stokMin)}
                      </div>
                      <div className="flex items-center gap-2 text-[9px] text-muted-foreground/50 mt-0.5">
                        <span className="font-mono">{item.sku}</span>
                        <span>|</span>
                        <span>{BIZ_UNIT_LABELS[item.unit]}</span>
                        <span>|</span>
                        <span>{item.kategori}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => openAdjust(item.id, "masuk")}
                        className="size-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center hover:bg-emerald-500/20 transition-all"
                        title="Stok Masuk"
                      >
                        <TrendingUp className="size-3.5" />
                      </button>
                      <button onClick={() => openAdjust(item.id, "keluar")}
                        className="size-7 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center hover:bg-rose-500/20 transition-all"
                        title="Stok Keluar"
                      >
                        <TrendingDown className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-end justify-between">
                    <div className="space-y-1">
                      <p className={`text-xl font-bold font-heading tabular-nums ${stokColor(item.stok, item.stokMin)}`}>
                        {item.stok}
                        <span className="text-[9px] text-muted-foreground/50 font-normal ml-1">{item.satuan}</span>
                      </p>
                      <div className="flex gap-3 text-[9px] text-muted-foreground/50">
                        <span>Min: {item.stokMin}</span>
                        <span>Modal: {formatRupiah(item.hargaModal)}</span>
                        <span>Jual: {formatRupiah(item.hargaJual)}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(item.id)}
                        className="px-2 py-1 rounded-lg bg-muted/30 text-muted-foreground/50 text-[9px] font-medium hover:bg-muted/50 transition-all"
                      >
                        Edit
                      </button>
                      <button onClick={() => handleHapus(item.id, item.nama)}
                        className="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-500 text-[9px] font-medium hover:bg-rose-500/20 transition-all"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </div>

                  {item.catatan && (
                    <p className="text-[9px] text-muted-foreground/30 italic">{item.catatan}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Low stock alert */}
          {lowStockCount + outOfStockCount > 0 && (
            <div className="floating-card p-4 border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-amber-500" />
                <p className="text-[10px] font-semibold text-amber-600">
                  {outOfStockCount > 0
                    ? `${outOfStockCount} barang habis, ${lowStockCount} stok menipis`
                    : `${lowStockCount} barang dengan stok menipis`}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TAB: TAMBAH / EDIT BARANG
          ══════════════════════════════════════════════════ */}
      {tab === "tambah" && (
        <div className="floating-card p-5 space-y-4">
          <p className="text-xs font-semibold flex items-center gap-1.5">
            <Plus className="size-3.5 text-amber-500" />
            {editId ? "Edit Barang" : "Tambah Barang Baru"}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] text-muted-foreground/50">Nama Barang *</label>
              <input type="text" value={formNama} onChange={(e) => setFormNama(e.target.value)}
                placeholder="cth: Kertas A4 80gr" className="input-premium w-full text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-muted-foreground/50">SKU *</label>
              <input type="text" value={formSku} onChange={(e) => setFormSku(e.target.value)}
                placeholder="cth: KRT-A4-80" className="input-premium w-full text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-muted-foreground/50">Unit Bisnis</label>
              <select value={formUnit} onChange={(e) => setFormUnit(e.target.value as BizUnit)}
                className="input-premium w-full text-[10px]">
                {(Object.entries(BIZ_UNIT_LABELS) as [BizUnit, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-muted-foreground/50">Kategori</label>
              <select value={formKategori} onChange={(e) => setFormKategori(e.target.value)}
                className="input-premium w-full text-[10px]">
                {KATEGORI_OPTIONS.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-muted-foreground/50">Stok Awal</label>
              <input type="number" min="0" value={formStok} onChange={(e) => setFormStok(e.target.value)}
                placeholder="0" className="input-premium w-full text-xs tabular-nums" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-muted-foreground/50">Min. Stok (peringatan)</label>
              <input type="number" min="0" value={formStokMin} onChange={(e) => setFormStokMin(e.target.value)}
                placeholder="0" className="input-premium w-full text-xs tabular-nums" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-muted-foreground/50">Harga Modal</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/50">Rp</span>
                <input type="text" inputMode="numeric" value={formHargaModal}
                  onChange={(e) => setFormHargaModal(e.target.value.replace(/\D/g, ""))}
                  placeholder="0" className="input-premium w-full text-xs pl-10 tabular-nums" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-muted-foreground/50">Harga Jual</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/50">Rp</span>
                <input type="text" inputMode="numeric" value={formHargaJual}
                  onChange={(e) => setFormHargaJual(e.target.value.replace(/\D/g, ""))}
                  placeholder="0" className="input-premium w-full text-xs pl-10 tabular-nums" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-muted-foreground/50">Satuan</label>
              <select value={formSatuan} onChange={(e) => setFormSatuan(e.target.value)}
                className="input-premium w-full text-[10px]">
                {SATUAN_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] text-muted-foreground/50">Catatan (opsional)</label>
            <input type="text" value={formCatatan} onChange={(e) => setFormCatatan(e.target.value)}
              placeholder="cth: Supplier: Toko Buku Jaya" className="input-premium w-full text-[10px]" />
          </div>

          <div className="flex gap-2">
            {editId && (
              <button onClick={() => { resetForm(); setTab("list"); }}
                className="flex-1 py-2.5 rounded-xl bg-muted/30 text-muted-foreground/60 text-xs font-bold hover:bg-muted/50 transition-all"
              >
                Batal
              </button>
            )}
            <button onClick={handleSimpan}
              disabled={!formNama.trim() || !formSku.trim()}
              className={`${editId ? "flex-1" : "w-full"} py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2`}
            >
              <Plus className="size-4" /> {editId ? "Simpan Perubahan" : "Tambah Barang"}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TAB: RIWAYAT MUTASI
          ══════════════════════════════════════════════════ */}
      {tab === "mutasi" && (
        <div className="floating-card p-4 space-y-3">
          <p className="text-xs font-semibold flex items-center gap-1.5">
            <History className="size-3.5 text-amber-500" /> Riwayat Mutasi Stok
          </p>
          {inventoryMutations.length === 0 ? (
            <p className="text-[10px] text-muted-foreground/30 py-2 text-center">Belum ada mutasi stok</p>
          ) : (
            <div className="space-y-1.5 max-h-96 overflow-y-auto">
              {inventoryMutations.slice(0, 50).map((m) => {
                const item = inventory.find((i) => i.id === m.itemId);
                const waktu = new Date(m.createdAt);
                const isMasuk = m.tipe === "masuk";
                return (
                  <div key={m.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 text-[9px]">
                    <div className={`size-7 rounded-lg flex items-center justify-center shrink-0 ${isMasuk ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>
                      {isMasuk ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">
                        {item?.nama || "?"} — {isMasuk ? "Stok Masuk" : "Stok Keluar"}
                      </p>
                      <p className="text-muted-foreground/50">{m.alasan}{m.referensi ? ` (ref: ${m.referensi})` : ""}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-semibold tabular-nums ${isMasuk ? "text-emerald-600" : "text-rose-600"}`}>
                        {isMasuk ? "+" : "-"}{m.qty}
                      </p>
                      <p className="text-muted-foreground/30">{waktu.toLocaleDateString("id-ID")}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          MODAL: ADJUST STOK
          ══════════════════════════════════════════════════ */}
      {adjustItemId && (() => {
        const item = inventory.find((i) => i.id === adjustItemId);
        if (!item) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setAdjustItemId(null)}
          >
            <div className="floating-card p-5 space-y-4 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold">{adjustTipe === "masuk" ? "Stok Masuk" : "Stok Keluar"}</p>
                <button onClick={() => setAdjustItemId(null)}
                  className="size-7 rounded-lg bg-muted/30 flex items-center justify-center hover:bg-muted/50"
                >
                  <X className="size-3.5" />
                </button>
              </div>

              <div className="rounded-xl bg-muted/20 p-3 text-[10px] space-y-1">
                <p className="font-medium">{item.nama}</p>
                <p className="text-muted-foreground/50">SKU: {item.sku} | Stok saat ini: <span className="font-semibold">{item.stok}</span></p>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-muted-foreground/50">Jumlah</label>
                <input type="number" min="1" value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  placeholder="0" className="input-premium w-full text-xs tabular-nums" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-muted-foreground/50">Alasan *</label>
                <input type="text" value={adjustAlasan} onChange={(e) => setAdjustAlasan(e.target.value)}
                  placeholder={adjustTipe === "masuk" ? "cth: Restok dari supplier" : "cth: Terjual via kasir"}
                  className="input-premium w-full text-[10px]" />
              </div>

              <button onClick={handleAdjust}
                disabled={!adjustQty || !adjustAlasan.trim()}
                className={`w-full py-2.5 rounded-xl text-white text-xs font-bold shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                  adjustTipe === "masuk"
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-500/20"
                    : "bg-gradient-to-r from-rose-500 to-rose-600 shadow-rose-500/20"
                }`}
              >
                {adjustTipe === "masuk" ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
                {adjustTipe === "masuk" ? "Tambah Stok" : "Kurangi Stok"}
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
