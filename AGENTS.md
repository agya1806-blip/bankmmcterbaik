# MMCBANK — Buku Usaha v3 Roadmap & Ideas

## Visi
Aplikasi POS & pembukuan all-in-one untuk UMKM yang bisa jalan offline-first, tanpa internet sekalipun. Fokus: **cepat diakses**, **data aman**, **tanpa ribet**.

---

## 🚨 Prioritas Tinggi (Quick Win, Dampak Besar)

### 1. Backup & Restore Satu Tombol
- Backup semua data (localStorage + IndexedDB) ke file JSON
- Restore dari file JSON
- Auto-backup berkala (setiap hari/sebelum update)
- Upload ke Google Drive / iCloud (opsional)
- File: `src/lib/backup.ts` sudah ada, tinggal bikin UI

### 2. Thermal Printer Support
- Cetak nota langsung ke printer thermal Bluetooth/USB (ESC/POS)
- Library: `esc-pos-printer` atau `thermal-printer`
- Ganti tombol "Cetak" di invoice agar bisa pilih mode: PDF / Thermal / WA

### 3. Onboarding Wizard (First Launch)
- Layar sambutan 3 langkah:
  1. Nama toko, logo, alamat, WA
  2. Tambah dompet pertama
  3. Tambah metode pembayaran pertama
- Baru masuk ke dashboard. User langsung siap jualan.

### 4. IndexedDB untuk Data Besar
- Pindahkan logo (base64), QRIS images, dan riwayat transaksi dari localStorage ke IndexedDB
- localStorage cuma untuk config ringan (theme, PIN, preferensi)
- Mencegah crash `QuotaExceededError` (limit 5MB localStorage)

### 5. Search & Filter Global
- Search bar di header yang bisa cari: pelanggan, produk, transaksi, invoice
- Filter by tanggal, unit bisnis, status pembayaran

---

## 🎯 Fitur Inti (Meningkatkan Kegunaan Sehari-hari)

### 6. Manajemen Stok / Inventory
- Track stok per produk (gadget, sparepart, bahan percetakan)
- Stok otomatis berkurang saat transaksi POS
- Notifikasi stok menipis
- Mutasi stok (barang masuk/keluar)

### 7. Riwayat Pelanggan & Loyalty
- Auto-save pelanggan baru dari transaksi kasir
- Riwayat pembelian per pelanggan (lengkap dengan invoice)
- Poin loyalitas / reward

### 8. Recurring / Cicilan / Piutang
- Catat piutang dengan jatuh tempo
- Notifikasi jatuh tempo H-1
- Riwayat pembayaran cicilan
- Buku piutang terpisah (view "Hutang/Piutang")

### 9. Export Laporan
- Export PDF laporan keuangan
- Export CSV/Excel untuk akuntan
- Grafik pendapatan per bulan (Chart.js / Recharts)

### 10. Multi-Device Sync
- Sync data antar device via WebRTC atau Firebase
- Atau simpan ke file dan restore di device lain
- Ideal untuk: HP kasir + laptop owner

---

## 💡 Fitur Advanced (Diferensiasi dari Kompetitor)

### 11. QRIS Dynamic / Static Display
- Tampilkan QRIS di layar kasir (monitor pelanggan)
- Validasi pembayaran manual (cek saldo masuk)
- Copy nomor rekening otomatis ke clipboard

### 12. Dashboard Eksekutif (Ringkasan Semua Lini)
- Total omset hari ini / minggu / bulan
- Unit bisnis paling laris
- 5 transaksi terbesar
- Arus kas real-time
- Sudah ada di `(dashboard)/page.tsx`, perlu dipercantik

### 13. Mode Offline-First + PWA
- Service Worker cache semua asset
- Semua data lokal (IndexedDB)
- Buka aplikasi tanpa internet = tetap jalan
- Install ke home screen (PWA manifest sudah ada)

### 14. Kategori & Label Kustom
- Tag transaksi: "Modal", "Operasional", "Gaji", dll
- Filter laporan berdasarkan tag
- Warna kustom per kategori

### 15. Template Cepat (Quick Order)
- Tombol "Cepat" untuk pesanan yang sering (cth: "Fotokopi A4 50 lbr")
- Price book per layanan
- Mempercepat input di kasir

---

## 🛠 Teknis & UX

### 16. Skeleton Loading
- Ganti `if (!mounted) return <div className="min-h-[60vh]" />` dengan skeleton card yang sesuai layout
- UX terasa lebih responsif

### 17. Pull-to-Refresh
- Tarik ke bawah di halaman laporan / dompet untuk refresh data
- Library: `react-pull-to-refresh` atau custom

### 18. Dark Mode Sempurna
- Dark mode sudah ada tapi beberapa komponen masih perlu penyesuaian
- Preview warna aksen di dark mode
- Konsistensi di semua elemen

### 19. Gesture Navigation
- Swipe kiri/kiri untuk ganti tab di dashboard
- Swipe untuk hapus item di cart/keranjang
- Long-press untuk edit item

### 20. Haptic Feedback (iOS/Android)
- Getaran haptic saat tombol ditekan
- Feedback transaksi berhasil
- Library: `navigator.vibrate()` (support di Chrome Android)

---

## 📱 Spesifik Mobile

- **Safe area insets** untuk iPhone notch/pill (sudah partial di bottom-nav)
- **Keyboard-aware** scroll saat input (hindari keyboard nutup form)
- **Font size** sudah dioptimasi 12px di 320px
- **Touch targets** ≥44px di semua tombol (sudah di globals.css)
- **Bottom sheet** alih-alih dialog modal untuk mobile (lebih ergonomis)

---

## Ringkasan Prioritas

| Prioritas | Fitur | Estimasi Effort |
|-----------|-------|-----------------|
| 🔴 P0 | Backup/Restore UI | ½ hari |
| 🔴 P0 | Thermal Printer | 1 hari |
| 🔴 P0 | IndexedDB untuk gambar | 1 hari |
| 🟡 P1 | Onboarding Wizard | ½ hari |
| 🟡 P1 | Manajemen Stok | 2 hari |
| 🟡 P1 | Riwayat Pelanggan | 1 hari |
| 🟢 P2 | Export Laporan | ½ hari |
| 🟢 P2 | Skeleton Loading | ½ hari |
| 🟢 P2 | PWA Offline | 1 hari |
| 🔵 P3 | Multi-Device Sync | 3 hari |
| 🔵 P3 | Recurring / Piutang | 1 hari |
| 🔵 P3 | Quick Order Template | ½ hari |
