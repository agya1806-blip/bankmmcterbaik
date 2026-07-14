/* ══════════════════════════════════════════════════════════════
   LEGACY TYPE EXPORTS — untuk backward compatibility
   Semua tipe yang dulu ada di useBusinessStore sekarang di sini
   Data operasional disimpan di IndexedDB, bukan localStorage
   ══════════════════════════════════════════════════════════════ */

export type PersonalCategory = "Makanan" | "Transportasi" | "Cicilan" | "Hiburan" | "Lainnya";

export interface PersonalTransaction {
  id: string;
  tanggal: string;
  tipe: "Pemasukan" | "Pengeluaran";
  kategori: PersonalCategory;
  nominal: number;
  catatan?: string;
}

export interface SavingsGoal {
  id: string;
  nama: string;
  targetNominal: number;
  terkumpul: number;
  targetDate: string;
}

/* ─── BUKU USAHA ─── */

export type WalletTipe = "KasTunai" | "Bank" | "EWallet";

export interface Wallet {
  id: string;
  namaDompet: string;
  saldo: number;
  tipe: WalletTipe;
  catatan: string;
}

export interface WalletMutasi {
  id: string;
  dariWalletId: string;
  keWalletId: string;
  nominal: number;
  alasan: string;
  createdAt: number;
}

export type PrintingType = "meteran" | "buku";

export interface PrintingJob {
  id: string;
  type: PrintingType;
  panjang: number;
  lebar: number;
  qty: number;
  pages?: number;
  kertas?: { label: string; hargaPerLembar: number };
  cover?: { label: string; harga: number };
  jilid?: { label: string; harga: number };
  totalCost: number;
  hargaJual: number;
  margin: number;
}

export interface GadgetItem {
  id: string;
  imei1: string;
  imei2?: string;
  model: string;
  brand?: string;
  warrantyEnd: string;
  hpp: number;
  price: number;
  tukarTambahValue?: number;
  catatan?: string;
}

export interface TukarTambahResult {
  bayar: number;
  hppBekas: number;
  diskonSelisih: number;
}

export interface LaptopPart {
  name: string;
  sn: string;
  price: number;
}

export interface LaptopBuild {
  id: string;
  sn: string;
  parts: LaptopPart[];
  totalHpp: number;
  price: number;
  invoiceNumber: string;
  margin: number;
}

export interface CoffeeIngredient {
  id: string;
  name: string;
  stockGram: number;
  minStockThreshold: number;
  hargaPerGram?: number;
}

export interface CoffeeBOM {
  coffee?: number;
  milk?: number;
  syrup?: number;
  other?: number;
}

export interface CoffeeMenuItem {
  name: string;
  price: number;
  bom: CoffeeBOM;
  kategori?: "Kopi" | "Non-Kopi";
}

export type FashionSize = "S" | "M" | "L" | "XL" | "XXL" | "3XL";
export type FashionColor = "Hitam" | "Putih" | "Merah" | "Biru" | "Hijau" | "Kuning" | "Abu" | "Coklat" | "Navy" | "Burgundy";

export interface FashionSKU {
  id: string;
  productName: string;
  color: FashionColor;
  size: FashionSize;
  price: number;
  stock: number;
  hpp?: number;
}

export interface KonveksiCostResult {
  totalCost: number;
  hargaJual: number;
  margin: number;
  rincian: { bahan: number; cmt: number; sablon: number; wastage: number };
}

/* ─── PIUTANG ─── */

export type BizUnit = "percetakan" | "gadget" | "laptop" | "kedai_kopi" | "konveksi";

export const BIZ_UNIT_LABELS: Record<BizUnit, string> = {
  percetakan: "Percetakan",
  gadget: "Gadget",
  laptop: "Laptop/PC",
  kedai_kopi: "Kedai Kopi",
  konveksi: "Konveksi",
};

export interface Piutang {
  id: string;
  unit: BizUnit;
  customerNama: string;
  customerWA: string;
  invoiceId: string;
  totalPiutang: number;
  sisaPiutang: number;
  jatuhTempo: string;
  status: "aktif" | "lunas" | "dihapus";
  catatan?: string;
  createdAt: string;
}

export interface PembayaranCicilan {
  id: string;
  piutangId: string;
  jumlah: number;
  metode: string;
  tanggal: string;
  catatan?: string;
}

/* ─── INVENTORY ─── */

export interface InventoryItem {
  id: string;
  unit: BizUnit;
  sku: string;
  nama: string;
  kategori: string;
  stok: number;
  stokMin: number;
  hargaModal: number;
  hargaJual: number;
  satuan: string;
  catatan?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryMutation {
  id: string;
  itemId: string;
  tipe: "masuk" | "keluar" | "penyesuaian";
  qty: number;
  stokSebelum: number;
  stokSesudah: number;
  alasan: string;
  referensi?: string;
  createdAt: string;
}

/* ─── SEDEKAH ─── */

export interface SedekahBalance {
  zakatMal: number;
  zakatFitrah: number;
  infakTerikat: number;
  sedekahSubuh: number;
}

export type SedekahSource = keyof SedekahBalance;
export type DistributionTujuan = "Fakir Miskin" | "Pembangunan" | "Operasional" | "Beasiswa" | "Bencana Alam";

export interface Distribution {
  id: string;
  amount: number;
  source: SedekahSource;
  tujuan: DistributionTujuan;
  notes: string;
  dokumentasi: string;
  createdAt: number;
}

export const SEDEKAH_PERSENTASE: Record<SedekahSource, number> = {
  zakatMal: 0.025,
  zakatFitrah: 0.25,
  infakTerikat: 0.25,
  sedekahSubuh: 0.475,
};

/* ─── CATATAN ─── */

export interface LedgerDebt {
  id: string;
  tipe: "hutang_kita" | "piutang_orang";
  contactName: string;
  whatsapp: string;
  nominal: number;
  status: "Belum Lunas" | "Lunas";
  jatuhTempo: string;
  catatan?: string;
}

export interface DigitalMemo {
  id: string;
  judul: string;
  isi: string;
  tags: string[];
  pinned: boolean;
  updatedAt: number;
}

/* ─── LABEL ─── */

export interface TransaksiLabel {
  id: string;
  label: string;
  warna: string;
  createdAt: string;
}

export interface TransaksiTag {
  id: string;
  transaksiRef: string;
  labelId: string;
}

/* ─── PELANGGAN ─── */

export interface CustomerRecord {
  id: string;
  nama: string;
  noWA: string;
  totalTransaksi: number;
  totalBelanja: number;
  poin: number;
  terakhirTransaksi: string;
  createdAt: string;
}

export interface CustomerTransaction {
  id: string;
  customerId: string;
  unit: BizUnit;
  invoiceId: string;
  total: number;
  tanggal: string;
  items: string;
}

/* ─── QUICK ORDER ─── */

export interface QuickOrder {
  id: string;
  unit: BizUnit;
  label: string;
  items: { desc: string; price: number }[];
  createdAt: string;
}

/* ─── KALKULATOR (utility functions) ─── */

export function hitungCetakMeteran(
  panjangCm: number, lebarCm: number, qty: number, modalPerCm2: number
): { totalCost: number; hargaJual: number; margin: number } {
  const area = panjangCm * lebarCm * qty;
  const totalCost = Math.ceil(area * modalPerCm2 * 1.05);
  const hargaJual = Math.ceil(totalCost * 1.4);
  const margin = hargaJual - totalCost;
  return { totalCost, hargaJual, margin };
}

export function hitungCetakBuku(
  halaman: number, kertasPerLembar: number, hargaKertas: number,
  cover: number, jilid: number, qty: number
): { totalCost: number; hargaJual: number; margin: number } {
  const kertasCost = (halaman / kertasPerLembar) * hargaKertas;
  const totalCost = Math.ceil((kertasCost + cover + jilid) * qty * 1.05);
  const hargaJual = Math.ceil(totalCost * 1.35);
  const margin = hargaJual - totalCost;
  return { totalCost, hargaJual, margin };
}

export function hitungTukarTambah(hargaBaru: number, taksiranBekas: number): TukarTambahResult {
  const bayar = Math.max(0, hargaBaru - taksiranBekas);
  const hppBekas = Math.ceil(taksiranBekas * 0.85);
  const diskonSelisih = hargaBaru - bayar;
  return { bayar, hppBekas, diskonSelisih };
}

export function hitungKonveksi(
  beratKg: number, hargaKainPerKg: number, cmt: number,
  sablon: number, wastagePct: number
): KonveksiCostResult {
  const bahan = beratKg * hargaKainPerKg;
  const wastage = bahan * (wastagePct / 100);
  const totalCost = bahan + cmt + sablon + wastage;
  const hargaJual = Math.ceil(totalCost * 1.4);
  return {
    totalCost: Math.ceil(totalCost),
    hargaJual,
    margin: hargaJual - Math.ceil(totalCost),
    rincian: { bahan: Math.ceil(bahan), cmt, sablon, wastage: Math.ceil(wastage) },
  };
}

export const ACCENT_THEMES = {
  indigo:   { from: "from-indigo-500", via: "via-purple-600", to: "to-indigo-700", label: "Indigo" },
  amber:    { from: "from-amber-500", via: "via-orange-600", to: "to-amber-700",  label: "Amber" },
  emerald:  { from: "from-emerald-500", via: "via-teal-600", to: "to-emerald-700", label: "Emerald" },
  sapphire: { from: "from-blue-500", via: "via-cyan-600", to: "to-blue-700",     label: "Sapphire" },
  rose:     { from: "from-rose-500", via: "via-pink-600", to: "to-rose-700",     label: "Rose" },
};
