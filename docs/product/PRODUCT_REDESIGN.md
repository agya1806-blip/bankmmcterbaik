# Product Redesign — MMCBANK

> **Dokumen ini adalah proposal redesign produk MMCBANK.**
> Tidak ada kode yang diubah. Semua rekomendasi bersifat konseptual.

---

## 1. Tujuan Produk

**MMCBANK adalah aplikasi pencatatan keuangan dan operasional untuk pemilik UMKM yang memiliki beberapa cabang atau lini bisnis.** Nilai utamanya adalah memberikan visibilitas penuh terhadap arus kas, stok, dan transaksi dari semua cabang dalam satu dashboard — tanpa perlu koneksi internet (client-side, data di IndexedDB). Pengguna cukup membuka browser, login, dan langsung mencatat penjualan, memantau stok, atau melihat laba-rugi cabang. Tidak ada infrastruktur server, tidak ada biaya langganan, tidak ada integrasi bank — semuanya dirancang agar pemilik toko bisa langsung fokus mengelola bisnisnya.

---

## 2. Target Pengguna

### Owner (Pemilik)
| Aspek | Detail |
|-------|--------|
| **Siapa** | Pemilik bisnis dengan 1-7 cabang |
| **Kebutuhan utama** | Melihat ringkasan keuangan SEMUA cabang dalam satu layar; membandingkan performa antar cabang; mengetahui cabang mana yang paling untung; mengetahui total piutang dan stok menipis di semua cabang |
| **Frekuensi** | Setiap hari (pagi: cek laporan, malam: cek penjualan) |
| **Pain point saat ini** | Harus masuk ke `/buku-global` yang terpisah dari navigasi utama; 7 tab di global terlalu banyak; data global tidak selalu real-time karena perlu polling terpisah |

### Admin Cabang
| Aspek | Detail |
|-------|--------|
| **Siapa** | Manajer atau supervisor satu cabang tertentu |
| **Kebutuhan utama** | Mengelola user cabang, mengatur periode akuntansi, melihat laporan cabang, mengatur profil cabang, melakukan stok opname |
| **Frekuensi** | Harian - Mingguan |
| **Pain point saat ini** | Pengaturan tersebar di `pengaturan`, `users`, `period` — 3 halaman terpisah; harus menghafal 18 link di navigation grid |

### Kasir
| Aspek | Detail |
|-------|--------|
| **Siapa** | Karyawan yang melayani transaksi harian |
| **Kebutuhan utama** | Mencatat penjualan cepat; mencari produk; checkout dengan berbagai metode bayar; melihat riwayat transaksi hari ini |
| **Frekuensi** | Setiap hari, puluhan kali |
| **Pain point saat ini** | Mode Grid dan Manual membingungkan (kenapa warkop pakai grid, percetakan manual?); flow checkout terlalu panjang (pilih customer, pilih wallet, sedekah, poin — terlalu banyak langkah untuk pembeli umum) |

### Staff Gudang
| Aspek | Detail |
|-------|--------|
| **Siapa** | Karyawan yang mengelola stok barang |
| **Kebutuhan utama** | Menambah stok baru; mencatat stok masuk/keluar; mendeteksi stok menipis; import/export produk |
| **Frekuensi** | Harian - Mingguan |
| **Pain point saat ini** | Menu "Barang" ada di grid, tapi stok opname dan mutasi ada di dalamnya; tidak ada fitur barcode cetak; foto produk base64 (ukuran besar, lambat) |

### Staff Produksi
| Aspek | Detail |
|-------|--------|
| **Siapa** | Karyawan di cabang produksi (percetakan, konveksi, toko pakaian) |
| **Kebutuhan utama** | Melihat antrian produksi; mengupdate status pesanan; melihat detail pesanan |
| **Frekuensi** | Harian |
| **Pain point saat ini** | Produksi ada di 2 tempat (halaman produksi sendiri + tab di transaksi) — membingungkan mana yang harus dipakai; kanban hanya 3 status sederhana |

### Pengguna Pribadi
| Aspek | Detail |
|-------|--------|
| **Siapa** | Individu atau keluarga yang mencatat keuangan pribadi |
| **Kebutuhan utama** | Mencatat pemasukan/pengeluaran; lihat saldo dompet; lihat laporan bulanan |
| **Frekuensi** | Beberapa kali seminggu |
| **Pain point saat ini** | Harus tap "Pribadi" di bottom nav, lalu tap lagi tab yang benar; dashboard pribadi terlalu kompleks dengan 6 tab (ringkasan, catat, hutang, laporan, riwayat, dompet) |

---

## 3. Analisis Fitur Saat Ini

### Evaluasi Menu Navigation Grid (18 item)

| # | Fitur | Route | Digunakan? | Jarang? | Bisa Digabung? | Sebaiknya Dihapus? | Alasan |
|---|------|-------|:----------:|:-------:|:--------------:|:------------------:|--------|
| 1 | **Kasir** | `kasir` | ✅ **Sangat sering** | | | | Ini fitur inti POS — jantung aplikasi |
| 2 | **Barang / Inventory** | `inventory` | ✅ **Sering** | | | | Fitur inti untuk bisnis ritel/manufaktur |
| 3 | **CRM / Pelanggan** | `pelanggan` | ✅ **Sering** | | | | Fitur inti untuk bisnis dengan pelanggan tetap |
| 4 | **Cashflow** | `cashflow` | ✅ **Sering** | | | | Fitur inti pencatatan keuangan |
| 5 | **Transaksi** | `transaksi` | ✅ **Sering** | | | | History penjualan — harus diakses mudah |
| 6 | **Dompet** | `dompet` | ✅ **Sering** | | | | Dompet adalah akun bank/kas — fitur inti |
| 7 | **Laporan** | `laporan` | ✅ **Sering** | | | | Owner & admin perlu lihat laporan |
| 8 | **Anggaran / Budget** | `budget` | | ✅ **Jarang** | → Laporan | | Budget vs realisasi bisa jadi bagian laporan, bukan fitur terpisah |
| 9 | **Transfer** | `transfer` | ✅ **Sering** | | → Dompet | | Bisa jadi sub-fitur dalam Dompet (transfer antar dompet) |
| 10 | **Pembelian (PO)** | `purchase-order` | | ✅ **Jarang** | → Inventory | | PO adalah bagian dari manajemen inventory |
| 11 | **Supplier** | `supplier` | | ✅ **Jarang** | → Inventory | | Supplier adalah data pendukung inventory |
| 12 | **Produksi** | `produksi` | | ✅ **Jarang** | → Kasir / Transaksi | | Hanya relevan untuk 3 dari 7 cabang |
| 13 | **Periode** | `period` | | ✅ **Jarang** | → Pengaturan | | Period closing adalah fungsi admin, bukan fitur harian |
| 14 | **Sedekah** | `sedekah` | | ✅ **Jarang** | → Pengaturan | ⛔ | Fitur spesifik, hanya admin, bisa jadi bagian pengaturan |
| 15 | **Transaksi Berulang** | `recurring` | | ✅ **Jarang** | → Cashflow / Pengaturan | ⛔ | Berguna untuk tagihan rutin, tapi jarang diutak-atik |
| 16 | **Label** | `label` | | ✅ **Jarang** | → Transaksi | ⛔ | Tagging transaksi — tapi terlalu advanced untuk UMKM |
| 17 | **Kurs Valuta** | `exchange-rate` | | ✅ **Jarang** | → Pengaturan | ⛔ | Multimata uang terlalu kompleks untuk UKM |
| 18 | **Users** | `users` | | ✅ **Jarang** | → Pengaturan | | Manajemen user adalah fungsi admin |

### Evaluasi Menu Bottom Navigation (5 item)

| # | Label | Route | Analisis |
|---|-------|-------|----------|
| 1 | **Global** | `/buku-global` | Owner tool — harus ada tapi tidak perlu di bottom bar, bisa di drawer/sidebar |
| 2 | **Pribadi** | `/buku-pribadi` | Buku Pribadi dan Keluarga adalah use case berbeda — namun keduanya bisa digabung jadi "Personal Finance" |
| 3 | **USAHA** | `/buku-usaha/usaha` | Ini yang paling sering dipakai — sudah tepat sebagai tombol utama |
| 4 | **Keluarga** | `/buku-keluarga` | Lihat no.2 — bisa digabung dengan Pribadi |
| 5 | **Beranda** | `/buku-usaha` | Halaman landing yang isinya sudah tumpang tindih dengan `/buku-usaha/usaha` |

### Evaluasi Menu "4 Buku" di Landing

| Buku | Analisis |
|------|----------|
| **Buku Global** | Owner tool — penting, tapi seharusnya jadi tab/view di dashboard utama, bukan "buku" terpisah |
| **Buku Pribadi** | Use case personal finance — valid, tapi positioning-nya aneh (kenapa dalam satu app dengan bisnis?) |
| **Buku Keluarga** | Hampir identik dengan Pribadi — hanya berbeda label dan warna |
| **Buku Usaha** | Ini yang utama — 7 cabang usaha |

### Evaluasi Database Tables (24 tabel)

| Tabel | Analisis |
|-------|----------|
| `users` | ✅ Penting |
| `profiles` | ✅ Penting |
| `wallets` | ✅ Penting |
| `walletMutations` | ✅ Penting |
| `customers` | ✅ Penting |
| `transactions` | ✅ Penting |
| `piutang` | ✅ Penting |
| `piutangInstallments` | ✅ Penting |
| `inventory` | ✅ Penting |
| `inventoryMutations` | ✅ Penting |
| `cashflows` | ✅ Penting |
| `labels` | ⚠️ Bisa dihapus (tagging via kategori saja) |
| `labelTags` | ⚠️ Bisa dihapus (ikuti labels) |
| `productions` | ✅ Penting (untuk cabang tertentu) |
| `suppliers` | ⚠️ Bisa digabung ke purchaseOrders sebagai embedded |
| `purchaseOrders` | ⚠️ Bisa disederhanakan |
| `budgets` | ⚠️ Bisa dihapus (manual tracking via spreadsheet) |
| `periods` | ⚠️ Bisa dihapus (period closing terlalu formal untuk UMKM) |
| `recurringTemplates` | ⚠️ Bisa disederhanakan (harian/mingguan/bulanan) |
| `exchangeRates` | ⚠️ Bisa dihapus (IDR-only untuk MVP) |
| `sedekahBalances` | ⚠️ Bisa dipindah ke profile/cashflow |
| `invoiceCounters` | ✅ Penting |
| `auditLogs` | ✅ Penting (untuk audit trail) |
| `quickOrders` | ⛔ **Tidak digunakan oleh halaman manapun** — dead code |

---

## 4. Menu Baru

### Prinsip Redesign

1. **Hierarki maksimal 2 level** — tidak ada 3-level navigation seperti sekarang (Buku > Usaha > Cabang > Fitur)
2. **Role-based view** — setiap role melihat menu yang relevan
3. **Context pertama, menu kedua** — user pilih cabang dulu, baru lihat menu cabang
4. **Kurangi jumlah item menu** — dari 18 menjadi maksimal 8-10

### Proposed Navigation Structure

```
┌─────────────────────────────────────────────┐
│                  TOP BAR                      │
│  [MMCBANK Logo]   [Nama Cabang ▼]   [👤]    │
├─────────────────────────────────────────────┤
│                                               │
│   ┌──────────────┬──────────────┐            │
│   │   KASIR      │ TRANSAKSI    │            │
│   │  (POS)       │  (History)   │            │
│   ├──────────────┼──────────────┤            │
│   │   BARANG     │ CASHFLOW     │            │
│   │  (Inventory) │  (Keuangan)  │            │
│   ├──────────────┼──────────────┤            │
│   │   LAPORAN    │ PENGATURAN   │            │
│   │  (Reports)   │  (Settings)  │            │
│   └──────────────┴──────────────┘            │
│                                               │
│   [ ⚡ Ringkasan Cepat ]                      │
│   Pendapatan hari ini: Rp 2.450.000           │
│   Stok menipis: 3 produk                      │
│   Piutang: Rp 5.200.000                       │
│                                               │
└─────────────────────────────────────────────┘

              BOTTOM NAV
┌─────────────────────────────────────────────┐
│  [🏠 Beranda]  [📊 Owner]  [👤 Akun]       │
└─────────────────────────────────────────────┘
```

### Menu per Role

| Menu | Owner | Admin Cabang | Kasir | Gudang | Produksi |
|------|:-----:|:------------:|:-----:|:------:|:--------:|
| **Dashboard** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Kasir (POS)** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Transaksi** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Barang** | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Cashflow** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Laporan** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Pengaturan** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Dashboard Owner** | ✅ | ❌ | ❌ | ❌ | ❌ |

### Detail Menu — Owner Dashboard (Menggantikan `/buku-global`)

```
OWNER DASHBOARD — Ringkasan Semua Cabang
├── Tab: Ringkasan (KPI cards, 7-day chart, per-cabang bar chart)
├── Tab: Cabang (daftar cabang + status masing-masing)
├── Tab: Piutang Global
├── Tab: Audit Trail
├── Tab: Backup / Restore
└── Tab: Pengaturan Global
```

### Detail Menu — Dashboard Cabang (Menggantikan landing page)

```
DASHBOARD CABANG
├── Ringkasan (saldo, pendapatan hari ini, piutang, stok)
├── Tombol: KASIR — langsung masuk ke POS
├── Tombol: BARANG — manajemen produk
├── Tombol: CASHFLOW — catatan pemasukan/pengeluaran
├── Tombol: TRANSAKSI — riwayat penjualan
├── Tombol: LAPORAN — laba rugi, PDF export
└── Tombol: PENGATURAN — profil cabang, user, periode
```

### Unified Personal Finance

```
PERSONAL FINANCE (menggabungkan Pribadi + Keluarga)
├── Tab: Ringkasan (saldo, bulan ini, chart)
├── Tab: Cashflow (catatan harian)
├── Tab: Dompet (kelola rekening)
├── Tab: Laporan (bulanan, kategorisasi)
└── Tab: Target/Limit (pengganti budget)
```

**Perubahan:** Parameter `tipe: "pribadi" | "keluarga"` menjadi field di profil user, bukan dua route terpisah.

---

## 5. User Journey

### Kasir — Flow Baru

```
1. Buka app                              [1 tap]
2. Tap "Kasir" di dashboard              [1 tap]
3. Cari produk (search / scan)           [2-5 detik]
4. Atur qty                              [1-2 tap]
5. Tap "Bayar"                           [1 tap]
6. Pilih metode bayar (CASH default)     [0-1 tap]
7. Konfirmasi                            [1 tap]

Total: ~5 tap, ~15 detik untuk transaksi sederhana
       (sekarang: ~10-15 tap, ~45 detik)
```

**Penyederhanaan:**
- Hapus mode Grid vs Manual — cukup satu mode (search-based)
- Hapus sedekah dari flow checkout (pindah ke pengaturan)
- Hapus poin loyalty dari flow checkout (otomatis)
- Customer jadi opsional (skip jika pembeli umum)
- Wallet default dari cabang (tidak perlu pilih)
- Otomatis pilih "CASH" sebagai metode bayar default

### Owner — Flow Baru

```
1. Buka app                                         [1 tap]
2. Lihat dashboard cabang (default cabang pertama)  [0 tap]
   - Saldo: Rp X
   - Pendapatan hari ini: Rp Y
   - Stok menipis: Z produk
   - Piutang: Rp W
3. Tap "Owner Dashboard" di bottom nav               [1 tap]
4. Lihat ringkasan SEMUA cabang:
   - Total pendapatan: Rp A
   - Cabang terlaris: Warkop (Rp B)
   - Piutang total: Rp C
   - Stok menipis: D item (di cabang Konveksi)
5. Tap cabang tertentu → detail cabang               [1 tap]
6. Tap "Laporan" → export PDF / lihat laba           [1 tap]

Total: 4 tap untuk lihat ringkasan global
       (sekarang: 3 tap + 7 tab + scroll)
```

### Staff Produksi — Flow Baru

```
1. Buka app                                                    [1 tap]
2. Dashboard cabang → lihat status produksi di ringkasan       [0 tap]
3. Tap notifikasi "3 pesanan dalam antrian"                    [1 tap]
4. Lihat daftar produksi (filter: antre/diproduksi/selesai)    [0 tap]
5. Tap pesanan → lihat detail item                             [1 tap]
6. Tap "Mulai Produksi" atau "Selesai"                         [1 tap]

Total: 4 tap untuk update status
       (sekarang: harus buka transaksi page atau produksi page — bingung pilih yang mana)
```

### Staff Gudang — Flow Baru

```
1. Buka app                                        [1 tap]
2. Tap "Barang" dari dashboard                     [1 tap]
3. Tap "Tambah Produk" atau "Stok Masuk"           [1 tap]
4. Isi form (scan barcode dari kemasan)            [5-10 detik]
5. Simpan                                          [1 tap]

Total: 4 tap + scan
       (sekarang: sama, 4 tap, tapi menu "Barang" sulit ditemukan di antara 18 menu)
```

---

## 6. Pain Point

### Yang Membingungkan Pengguna

| Pain Point | Sumber Masalah | Dampak |
|-----------|---------------|--------|
| **"Ada berapa buku?"** | Konsep 4 buku (Global, Pribadi, Keluarga, Usaha) tidak intuitif. Pengguna UMKM hanya peduli "bisnis saya" dan "keuangan pribadi" | Kebingungan navigasi, sering salah masuk halaman |
| **"Saya harus klik apa?"** | 18 menu di navigation grid — overwhelming. Sebagian besar jarang dipakai. | User stress, fitur inti (Kasir) terkubur di antara 18 ikon |
| **"Global itu apa?"** | `/buku-global` adalah halaman terpisah dengan 7 tab, padahal isinya adalah aggregasi dari cabang | Owner tidak tahu harus lihat global atau usaha dulu |
| **"Pribadi dan Keluarga beda apa?"** | Keduanya identik, hanya label berbeda | Redundan, membingungkan |
| **"Sedekah untuk apa?"** | Fitur spesifik (4 jenis zakat/infak) yang hanya admin bisa akses — terlalu niche untuk menu utama | Menu menganggur, menambah clutter |
| **"Label fungsinya apa?"** | Tagging transaksi dengan warna — terlalu advanced untuk UMKM | Jarang dipakai, menambah kompleksitas |
| **"Anggaran vs Laporan beda apa?"** | Budget adalah perencanaan, Laporan adalah realisasi — tapi pengguna melihatnya sebagai duplikasi | Satu bisa digabung |
| **"Kenapa ada dua tempat produksi?"** | Produksi ada di halaman sendiri + tab di transaksi | User bingung mana yang harus dipakai |
| **"Kurs Valuta untuk apa?"** | Multi-currency menambah kompleksitas untuk bisnis yang 99% transaksi IDR | Fitur jarang dipakai, menambah beban mental |

### Yang Terlalu Banyak

| Aspek | Sekarang | Seharusnya |
|-------|----------|------------|
| Menu navigation grid | 18 item | 6 item (+ pengaturan) |
| Bottom nav items | 5 | 3 (Beranda, Owner, Akun) |
| Konsep "buku" | 4 buku (Global, Pribadi, Keluarga, Usaha) | 2 kategori (Bisnis, Personal) |
| Tab di dashboard pribadi | 6 tab | 3 tab (Ringkasan, Cashflow, Dompet) |
| Tab di global | 7 tab | 3 tab (Ringkasan, Cabang, Audit) |
| Step checkout kasir | ~15 langkah | ~5 langkah |
| Database tables | 24 tabel | ~18 tabel (target) |
| File >600 baris | 4 file | 0 file (setelah refactor) |

### Yang Terlalu Teknis

| Masalah Teknis | Penjelasan | Dampak ke Pengguna |
|---------------|-----------|-------------------|
| **IndexedDB client-side** | Semua data di browser — tidak ada backup otomatis, tidak bisa akses dari HP lain | Risiko kehilangan data, tidak bisa shared device |
| **PIN-only auth** | Tidak ada email/HP recovery, registrasi langsung admin | Jika lupa PIN, orang lain bisa daftar jadi admin |
| **"Kiosk mode" tidak jalan** | Fitur disiapkan tapi tidak pernah dipakai | Kode mati, membingungkan developer |
| **allowedUnits tidak dipakai** | Field di schema untuk restrict cabang per user | Tidak bisa batasi akses kasir ke cabang tertentu |
| **Dead code** | pin-lock.tsx, useThermalPrinter.ts, db-helpers.ts, quickOrders | Maintenance burden, kode tidak terpakai |
| **600+ baris file** | inventory (754), transaksi (762), pelanggan (668), db-v4 (605) | Sulit dipelihara, rawan bug |
| **Dua useLiveQuery** | Custom polling (2 detik) vs official dexie-react-hooks | Boros baterai/CPU, inkonsisten |
| **7 dependency tidak dipakai** | @base-ui/react, clsx, cva, idb, jsqr, shadcn, tailwind-merge | Node_modules besar, build lambat |

### Yang Sebaiknya Disederhanakan

| Fitur | Sekarang | Sederhanakan Jadi |
|-------|----------|-------------------|
| **Kasir** | Grid mode + Manual mode (dual logic) | Satu mode: search + scan barcode |
| **Checkout** | Items + Customer + Poin + Diskon + PPN + Sedekah + Wallet + Metode Bayar + DP | Items + Metode Bayar (sisanya default/otomatis) |
| **Transaksi** | Riwayat + Produksi (2 tab berbeda) | Riwayat saja (produksi pindah ke halaman sendiri) |
| **Produksi** | Di transaksi page (Kanban) + di halaman sendiri | Cukup satu halaman sederhana |
| **Pelanggan** | CRM + Piutang + Broadcast + Import (Excel/CSV/VCF) | CRM + Piutang (broadcast jadi fitur tambahan) |
| **Dompet** | 4 implementasi CRUD berbeda | Satu shared component |
| **Cashflow** | Business + Pribadi (90% identik) | Satu component dengan parameter kategori |
| **4 Buku** | Global + Pribadi + Keluarga + Usaha | Bisnis (cabang) + Personal (pribadi/keluarga digabung) |
| **Bottom Nav** | 5 item (Global, Pribadi, USAHA, Keluarga, Beranda) | 3 item (Beranda, Owner Dashboard, Akun) |

---

## 7. Rekomendasi

### Prioritas — Dikerjakan Segera

| # | Rekomendasi | Dampak | Estimasi |
|---|-------------|--------|----------|
| R1 | **Hapus konsep "4 buku" → ganti jadi 2 kategori: Bisnis & Personal** | Simplifikasi navigasi 50%; user tidak bingung | 2-3 jam (rename routes, update bottom nav) |
| R2 | **Gabung Pribadi + Keluarga jadi satu "Personal Finance" dengan toggle** | Hilangkan duplikasi 90% kode, kurangi 2 route | 1 jam (shared component sudah ada, tinggal merge page) |
| R3 | **Kurangi navigation grid dari 18 ke 6-8 item** | Kurangi overwhelming 60%; user lebih cepat sampai ke fitur inti | 1 jam (redesign grid, pindah fitur jarang ke pengaturan) |
| R4 | **Sederhanakan flow checkout POS — hapus langkah tidak perlu dari default** | Transaksi jadi ~5 tap bukan ~15 tap | 2-3 jam (modifikasi pipeline, buat mode "fast checkout") |
| R5 | **Hapus dead code** (pin-lock.tsx, useThermalPrinter.ts, db-helpers.ts, quickOrders table) | Kurangi 532 baris kode mati, 1 tabel tidak dipakai | 10 menit |
| R6 | **Hapus 7 dependency tidak terpakai** dari package.json | Build lebih cepat, node_modules -50MB | 5 menit |

### Prioritas — Menengah

| # | Rekomendasi | Dampak | Estimasi |
|---|-------------|--------|----------|
| R7 | **Refactor file >600 baris** — ekstrak inventory, transaksi, pelanggan, db-v4 | Maintainability jangka panjang | 6-8 jam |
| R8 | **Konsolidasi wallet CRUD** — satu shared component dengan feature flags | Hilangkan duplikasi 3-4 implementasi | 2-3 jam |
| R9 | **Konsolidasi cashflow** — satu shared component untuk business & personal | Hilangkan duplikasi ~250 baris | 1 jam |
| R10 | **Ganti custom `useLiveQuery` dengan dexie-react-hooks** | Kurangi CPU usage, polling 2 detik dihentikan | 30 menit |
| R11 | **Hapus `import React` dari ~15 file** (JSX transform otomatis) | Kode lebih bersih | 15 menit |
| R12 | **Standarisasi modal pattern** — buat reusable `Modal` component | 17 modal → 1 komponen reusable | 1 jam |

### Prioritas — Future / Optional

| # | Rekomendasi | Dampak | Estimasi |
|---|-------------|--------|----------|
| R13 | **Pindahkan fitur niche ke halaman "Pengaturan" atau "Lanjutan"** — Budget, Sedekah, Exchange Rate, Label, Recurring | Menu grid lebih bersih (6 item utama + 1 "Lainnya") | 1 jam |
| R14 | **Implementasi `allowedUnits`** — admin bisa batasi akses kasir ke cabang tertentu | Security improvement, multi-cabang yang aman | 3-4 jam |
| R15 | **Integrasi backup otomatis** — IndexedDB ke file JSON periodik | Prevent data loss (pain point utama IndexedDB) | 2-3 jam |
| R16 | **Hapus tabel: `labels`, `labelTags`, `budgets`, `exchangeRates`** | Kurangi 4 tabel dari 24 → 20 tabel, schema lebih sederhana | 3-4 jam (beserta hapus halaman terkait) |
| R17 | **Gabung `suppliers` ke `purchaseOrders`** sebagai field embedded | Sederhanakan relasi, kurangi 1 tabel | 1 jam |
| R18 | **Hapus `periods` — ganti dengan flag tanggal di transaksi** | Period closing terlalu formal untuk UMKM | 1 jam |
| R19 | **Integrasi `quickOrders` atau hapus tabel** | Dead table — jika tidak dipakai, hapus | 15 menit |
| R20 | **Desain ulang halaman `/buku-usaha`** — jadi landing yang benar-benar berguna (ringkasan + aksi cepat) | User experience, kurangi bounce | 2-3 jam |

### Target Akhir Sederhanakan

| Metrik | Sebelum | Sesudah |
|--------|---------|---------|
| **Menu navigation grid** | 18 item | 6-8 item |
| **Bottom nav item** | 5 | 3 |
| **Konsep buku** | 4 | 2 (Bisnis, Personal) |
| **Route** | 34 | ~28 |
| **Database table** | 24 | ~18-20 |
| **File >500 baris** | 4 file | 0 file |
| **Dead code** | 532 baris + 1 tabel | 0 |
| **Unused dependencies** | 7 | 0 |
| **Modal pattern** | 17 copy-paste | 1 reusable |
| **Wallet CRUD** | 4 implementasi | 1 |
| **Cashflow component** | 2 implementasi | 1 |
| **Step checkout** | ~15 | ~5 |
| **SkeletonCard** | 5× `count={5}` | 1 reusable pattern |
| **ArrowLeft button** | 24× copy-paste | 1 reusable component |

---

## Summary

**MMCBANK saat ini memiliki fondasi yang kuat** — pipeline transaksi, engine cancel, double-entry, schema database, dan komponen POS sudah dirancang dengan baik.

**Masalah utamanya adalah kompleksitas yang tidak perlu:**
- 18 menu navigation → terlalu banyak
- 4 konsep buku → membingungkan
- 24 tabel database → beberapa bisa dieliminasi
- 4 implementasi wallet → boros
- 7 dependency tidak terpakai → beban

**Redesign fokus pada:**
1. Simplifikasi navigasi (18 → 6 menu, 5 → 3 bottom nav)
2. Konsolidasi duplikasi (wallet, cashflow, pribadi/keluarga)
3. Pembersihan (dead code, dependency mati, tabel tidak dipakai)
4. Pengalaman pengguna (checkout dari 15 tap ke 5 tap)

**Perubahan tidak mengubah arsitektur dasar.** Engine pipeline, double-entry, role system, dan schema inti tetap sama. Yang berubah adalah cara pengguna melihat dan berinteraksi dengan fitur-fitur tersebut.

---

*Dokumen ini bersifat konseptual. Tidak ada source code yang diubah.*
