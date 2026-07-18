# Navigation & Information Architecture Redesign — MMCBANK

> **Dokumen ini adalah proposal redesign navigasi MMCBANK.**
> Tidak ada kode yang diubah. Semua rekomendasi bersifat konseptual.

---

## 1. Analisis Navigasi Saat Ini

### 1.1 Bottom Navigation — 5 Item

| # | Label | Route | Ikon | Analisis |
|---|-------|-------|------|----------|
| 1 | **Global** | `/buku-global` | `BarChart3` | ✅ Penting untuk owner, tapi tidak se-harian kasir. Posisi di bottom nav membuatnya sejajar dengan "USAHA" — padahal fungsinya berbeda level. |
| 2 | **Pribadi** | `/buku-pribadi` | `User` | ⚠️ Berguna, tapi hampir identik dengan Keluarga. Dua tombol untuk fungsi yang sama membuang-buang ruang. |
| 3 | **USAHA** | `/buku-usaha/usaha` | `Building2` | ✅ **Fitur inti** — ini yang paling sering dipakai. Posisi tengah dengan ukuran berbeda sudah tepat. |
| 4 | **Keluarga** | `/buku-keluarga` | `Home` | ⚠️ Sama seperti Pribadi — duplikasi. Seharusnya bisa digabung. |
| 5 | **Beranda** | `/buku-usaha` | `LayoutGrid` | ❌ Tumpang tindih dengan USAHA. Bedanya: Beranda = landing page global, USAHA = daftar cabang. Keduanya menunjukkan data agregat — membingungkan. |

### 1.2 Navigation Grid di Dashboard Cabang — 18 Item

| # | Label | Route | Kepentingan | Alasan |
|---|-------|-------|:-----------:|--------|
| 1 | **Kasir** | `kasir` | 🟢 **Sangat Penting** | Fitur inti — digunakan setiap hari, puluhan kali. |
| 2 | **Barang** | `inventory` | 🟢 **Sangat Penting** | Inti untuk bisnis ritel & manufaktur. |
| 3 | **CRM** | `pelanggan` | 🟢 **Sangat Penting** | Penting untuk bisnis dengan pelanggan tetap. |
| 4 | **Cashflow** | `cashflow` | 🟢 **Sangat Penting** | Inti pencatatan keuangan. |
| 5 | **Transaksi** | `transaksi` | 🟢 **Sangat Penting** | Riwayat penjualan — diakses setiap hari. |
| 6 | **Dompet** | `dompet` | 🟢 **Sangat Penting** | Akun bank/kas — perlu dipantau rutin. |
| 7 | **Laporan** | `laporan` | 🟢 **Penting** | Tidak setiap hari, tapi rutin (mingguan/bulanan). |
| 8 | **Transfer** | `transfer` | 🟡 **Penting** | Sering untuk cabang dengan banyak dompet, tapi bisa jadi sub-fitur dompet. |
| 9 | **Pembelian (PO)** | `purchase-order` | 🟡 **Jarang** | Hanya staff gudang yang mengakses. Bisa jadi sub-fitur inventory. |
| 10 | **Supplier** | `supplier` | 🟡 **Jarang** | Data master — diubah sekali-sekali. Bisa jadi sub-fitur inventory. |
| 11 | **Produksi** | `produksi` | 🟡 **Jarang** | Hanya 3 dari 7 cabang yang pakai. Bisa jadi sub-fitur transaksi. |
| 12 | **Pengaturan** | `pengaturan` | 🟡 **Jarang** | Hanya admin — sekali-sekali. |
| 13 | **Users** | `users` | 🟡 **Jarang** | Hanya admin — jarang diubah. Bisa jadi sub-fitur pengaturan. |
| 14 | **Periode** | `period` | 🔴 **Tidak Perlu Menu Sendiri** | Period closing — fungsi akuntansi yang bisa diakses dari pengaturan. |
| 15 | **Sedekah** | `sedekah` | 🔴 **Tidak Perlu Menu Sendiri** | Fitur niche, hanya admin, bisa di pengaturan atau cashflow. |
| 16 | **Anggaran** | `budget` | 🔴 **Tidak Perlu Menu Sendiri** | Bisa jadi bagian dari laporan atau cashflow. |
| 17 | **Trans. Berulang** | `recurring` | 🔴 **Tidak Perlu Menu Sendiri** | Konfigurasi sekali, jarak diubah. Bisa di pengaturan. |
| 18 | **Kurs Valuta** | `exchange-rate` | 🔴 **Tidak Perlu Menu Sendiri** | IDR-only untuk 99% UMKM. Bisa di pengaturan. |
| 19 | **Label** | `label` | 🔴 **Tidak Perlu Menu Sendiri** | Tagging transaksi — advanced. Bisa di dalam halaman transaksi. |

### 1.3 Ringkasan Masalah Navigasi

| Masalah | Dampak |
|---------|--------|
| **18 item grid** — terlalu banyak pilihan sekaligus | User stress, butuh waktu lebih lama untuk menemukan fitur yang dicari |
| **Tidak ada grouping** — semua fitur setara (kasir sejajar dengan kurs valuta) | Tidak ada hierarki prioritas, fitur inti tidak menonjol |
| **Dua bottom nav untuk fungsi serupa** (Pribadi + Keluarga) | Membuang-buang ruang navigasi yang berharga |
| **Beranda vs USAHA vs Global** — tiga halaman dengan fungsi tumpang tindih | User bingung harus klik yang mana |
| **Fitur niche setara dengan fitur inti** (sedekah, label, exchange rate sejajar dengan kasir) | Clutter visual, rasio signal-to-noise rendah |
| **Tidak ada indikator role-based** — kasir melihat 18 menu yang sama dengan admin | Role kasir kewalahan dengan menu yang tidak relevan |

---

## 2. Sitemap Lama

```
MMCBANK CURRENT SITEMAP
│
├── / (Landing) ─── redirect to /login or /buku-usaha
│
├── [Auth]
│   ├── /login
│   ├── /register
│   └── /forgot-pin
│
├── [Dashboard] ─── AppShell + BottomNav
│   │
│   ├── /buku-usaha
│   │   └── Landing page: 4 book cards + global stats + chart
│   │
│   ├── /buku-global
│   │   └── 7 tabs: Dashboard, Piutang, Pelanggan, Audit, Settings, Dompet, Profil
│   │
│   ├── /buku-pribadi
│   │   └── Shared component: 6 tabs (Ringkasan, Catat, Hutang, Laporan, Riwayat, Dompet)
│   │
│   ├── /buku-pribadi/cashflow
│   │   └── Shared cashflow component (pribadi categories)
│   │
│   ├── /buku-keluarga
│   │   └── Shared component: 6 tabs (sama seperti pribadi, label berbeda)
│   │
│   ├── /buku-keluarga/cashflow
│   │   └── Shared cashflow component (keluarga categories)
│   │
│   ├── /buku-usaha/usaha
│   │   └── 7 business unit cards with per-unit stats
│   │
│   ├── /buku-usaha/[cabang]
│   │   ├── Branch dashboard with 18-item navigation grid
│   │   │
│   │   ├── /kasir (POS)
│   │   ├── /inventory
│   │   ├── /pelanggan (CRM)
│   │   ├── /cashflow
│   │   ├── /budget
│   │   ├── /transaksi (history + production kanban)
│   │   ├── /dompet
│   │   ├── /laporan
│   │   ├── /period
│   │   ├── /sedekah
│   │   ├── /recurring
│   │   ├── /transfer
│   │   ├── /supplier
│   │   ├── /purchase-order
│   │   ├── /label
│   │   ├── /users
│   │   ├── /pengaturan
│   │   └── /exchange-rate
│   │
│   └── /profile
│       └── User profile, photo, PIN, theme toggle
│
└── /api/webhook
    └── Payment webhook simulator
```

**Total: 34 route** (30 page + 2 layout + 1 API + 1 root)

---

## 3. Sitemap Baru

### 3.1 Prinsip Redesign

1. **Role-based filtering** — setiap role hanya melihat menu yang relevan
2. **Grouping fungsional** — menu dikelompokkan berdasarkan fungsi bisnis, bukan jenis buku
3. **Maksimal 2 level** — dari halaman utama ke fitur dalam 2 klik
4. **Konsep "buku" dihilangkan** — diganti dengan kategori: Bisnis & Personal
5. **Fitur niche dipindah ke "Pengaturan"** — grid utama hanya berisi fitur yang benar-benar dipakai setiap hari

### 3.2 Sitemap Baru

```
MMCBANK NEW SITEMAP
│
├── / (Landing) ─── role-based redirect:
│   │                  kasir → /bisnis/[cabang]/kasir
│   │                  admin → /bisnis/[cabang]
│   │                  owner → /owner
│   │                  personal → /personal
│
├── [Auth]
│   ├── /login
│   ├── /register
│   └── /forgot-pin
│
├── [Main App]
│   │
│   ├── /bisnis (menggantikan /buku-usaha/usaha + /buku-usaha/[cabang])
│   │   ├── → Daftar cabang (hanya jika user memiliki akses ke >1 cabang)
│   │   │
│   │   └── /[cabang]
│   │       ├── → Dashboard (ringkasan: saldo, pendapatan hari ini, piutang, stok)
│   │       │
│   │       ├── ── OPERASIONAL ──
│   │       ├── /kasir     → POS (Point of Sale)
│   │       ├── /barang    → Inventory + Supplier + Purchase Order
│   │       ├── /produksi  → Production tracking (jika relevan)
│   │       ├── /pelanggan → CRM + Piutang per customer
│   │       │
│   │       ├── ── KEUANGAN ──
│   │       ├── /cashflow  → Pemasukan & Pengeluaran + Budget
│   │       ├── /dompet    → Wallet management + Transfer
│   │       ├── /transaksi → Riwayat penjualan + Label
│   │       └── /laporan   → Laba rugi, PDF export, Period info
│   │       │
│   │       └── ── PENGATURAN ──
│   │         └── /pengaturan
│   │             ├── Profil Cabang
│   │             ├── Users
│   │             ├── Periode
│   │             ├── Sedekah
│   │             ├── Transaksi Berulang
│   │             ├── Kurs Valuta
│   │             └── Label
│   │
│   ├── /owner (menggantikan /buku-global)
│   │   ├── → Dashboard (ringkasan semua cabang, KPI)
│   │   ├── → Cabang (daftar + perbandingan)
│   │   ├── → Piutang (global)
│   │   ├── → Audit Log
│   │   └── → Backup / Restore
│   │
│   ├── /personal (menggabungkan /buku-pribadi + /buku-keluarga)
│   │   ├── → Dashboard (ringkasan saldo, bulan ini)
│   │   ├── /cashflow  → Catatan harian
│   │   ├── /dompet    → Wallet management
│   │   └── /laporan   → Bulanan + target
│   │
│   └── /profile
│       └── Profil, foto, PIN, theme toggle, logout
│
└── /api/webhook
    └── Payment webhook simulator
```

### 3.3 Perubahan Spesifik dari Sitemap Lama ke Baru

| Aspek | Lama | Baru |
|-------|------|------|
| **Konsep buku** | 4 buku (Global, Pribadi, Keluarga, Usaha) | 3 menu (Bisnis, Owner, Personal) |
| **Hierarchy bisnis** | 3 level (Buku > Unit > Fitur) | 2 level (Bisnis > Cabang > Fitur) |
| **Navigation grid** | 18 item (flat) | 8 item (2 kelompok: Operasional + Keuangan) + Pengaturan |
| **Fitur niche** | Setara dengan fitur inti di grid | Dipindah ke halaman Pengaturan |
| **Pribadi + Keluarga** | 2 route + 2 bottom nav | 1 route (dengan toggle pribadi/keluarga) |
| **Global** | Route terpisah di bottom nav | Tab di Owner Dashboard |
| **Landing page** | 4 book cards | Role-based redirect langsung ke halaman relevan |

### 3.4 Navigation Grid Baru — 8 Item (+ Pengaturan)

```
┌─────────────────────────────────────────────────────┐
│  OPERASIONAL                                        │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐            │
│  │ KASIR│  │BARANG│  │PRODUK│  │ CRM  │            │
│  │      │  │      │  │  SI  │  │      │            │
│  └──────┘  └──────┘  └──────┘  └──────┘            │
│                                                     │
│  KEUANGAN                                           │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐            │
│  │CASH  │  │DOMPET│  │TRANSA│  │LAPOR │            │
│  │ FLOW │  │      │  │  KSI │  │  AN  │            │
│  └──────┘  └──────┘  └──────┘  └──────┘            │
│                                                     │
│  [⚙️ Pengaturan] — Users, Periode, dll.            │
└─────────────────────────────────────────────────────┘
```

**Dari 18 → 8 item (+1 link ke Pengaturan). Reduksi: 50%.**

---

## 4. Navigasi Mobile (Bottom Navigation)

### 4.1 Desain Bottom Nav — 5 Item

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   [🏠]      [🛒]      [📊]      [👤]      [☰]     │
│  Beranda    Kasir    Keuangan   Akun     Menu      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 4.2 Detail Item

| # | Ikon | Label | Route | Tampak Untuk | Alasan |
|---|------|-------|-------|-------------|--------|
| 1 | `🏠` | **Beranda** | `/bisnis/[activeCabang]` atau `/personal` | Semua user | Halaman utama setelah login. Menampilkan ringkasan cabang aktif. |
| 2 | `🛒` | **Kasir** | `/bisnis/[activeCabang]/kasir` | Kasir, Admin, Owner | Shortcut ke POS — fitur yang paling sering dipakai. Satu tap langsung ke halaman transaksi. |
| 3 | `📊` | **Keuangan** | `/bisnis/[activeCabang]/cashflow` | Admin, Owner | Akses cepat ke cashflow. Tap dua kali untuk laporan. |
| 4 | `👤` | **Akun** | `/profile` | Semua user | Profil, theme toggle, logout. |
| 5 | `☰` | **Menu** | *(drawer)* | Semua user | Drawer sidebar untuk akses ke fitur lain (Inventory, CRM, Dompet, Transaksi, Owner Dashboard, Personal, Pengaturan). |

### 4.3 Logic Roles

| Role | Beranda → | Kasir? | Keuangan? | Akun? | Menu → Isi |
|------|-----------|--------|-----------|-------|-----------|
| **Kasir** | `/bisnis/[cabang]` | ✅ Ya | ❌ Sembunyi | ✅ | Inventory, Pelanggan, Transaksi |
| **Admin Cabang** | `/bisnis/[cabang]` | ✅ | ✅ | ✅ | Semua fitur cabang + Pengaturan |
| **Owner** | `/owner` | ✅ | ✅ | ✅ | Semua fitur cabang + Owner Dashboard + Personal |
| **Personal User** | `/personal` | ❌ | ✅ | ✅ | Dompet, Laporan |

### 4.4 Perbandingan dengan Bottom Nav Lama

| Aspek | Lama (5 item) | Baru (5 item) |
|-------|---------------|----------------|
| Global | ✅ Menu sendiri | 📍 Di dalam drawer "Menu" → Owner Dashboard |
| Pribadi | ✅ Menu sendiri | 📍 Di dalam drawer "Menu" → bagian Personal |
| USAHA | ✅ Pusat (tombol besar) | ✅ Tetap pusat, tapi nama "Beranda" lebih intuitif |
| Keluarga | ✅ Menu sendiri | ❌ Dihapus (digabung dengan Pribadi via toggle) |
| Beranda | ✅ (tapi tumpang tindih dengan USAHA) | ✅ Sekarang jadi halaman utama yang benar-benar berguna |
| Kasir | ❌ Tidak ada shortcut | ✅ Shortcut satu tap — fitur paling sering dipakai |
| Keuangan | ❌ Tidak ada shortcut | ✅ Shortcut ke cashflow |

---

## 5. Navigasi Desktop (Sidebar)

### 5.1 Ketika Mode Desktop

Untuk layar lebar (>768px), Bottom Nav berubah menjadi Sidebar kiri.

### 5.2 Desain Sidebar

```
┌──────┬─────────────────────────────────────────────┐
│      │                                             │
│  🏪  │  MMCBANK                                    │
│      │  [Cabang: Warkop ▼]                         │
│      │                                             │
├──────┤                                             │
│      │                                             │
│  🔍  │  Cari fitur... (CTRL+K)                     │
│      │                                             │
│      ├─────────────────────────────────────────────┤
│      │                                             │
│      │  ⚡ OPERASIONAL                              │
│      │  ┌──────────────────────────────────────┐   │
│      │  │ 🛒  Kasir                            │   │
│      │  │ 📦  Barang                   3 ⚠️    │   │
│      │  │ 🏭  Produksi                         │   │
│      │  │ 👥  Pelanggan                        │   │
│      │  └──────────────────────────────────────┘   │
│      │                                             │
│      │  💰 KEUANGAN                                 │
│      │  ┌──────────────────────────────────────┐   │
│      │  │ 💳  Cashflow                          │   │
│      │  │ 👛  Dompet                    Rp 2jt │   │
│      │  │ 📋  Transaksi                         │   │
│      │  │ 📊  Laporan                           │   │
│      │  └──────────────────────────────────────┘   │
│      │                                             │
│      │  👑 OWNER                                    │
│      │  ┌──────────────────────────────────────┐   │
│      │  │ 📈  Owner Dashboard                   │   │
│      │  │ 🏢  Semua Cabang                      │   │
│      │  │ 📝  Audit Log                         │   │
│      │  └──────────────────────────────────────┘   │
│      │                                             │
│      │  ⚙️ PENGATURAN                               │
│      │  ┌──────────────────────────────────────┐   │
│      │  │ 🔧  Pengaturan Cabang                 │   │
│      │  │ 👤  Users                             │   │
│      │  │ 📅  Periode                           │   │
│      │  │ 📌  Lainnya...                        │   │
│      │  └──────────────────────────────────────┘   │
│      │                                             │
│      │  👤 Akun                                    │
│      │  ┌──────────────────────────────────────┐   │
│      │  │ 🧑  Profil                           │   │
│      │  │ 🌙  Tema                             │   │
│      │  │ 🚪  Keluar                           │   │
│      │  └──────────────────────────────────────┘   │
│      │                                             │
├──────┴─────────────────────────────────────────────┤
│                                                     │
│              [MAIN CONTENT AREA]                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 5.3 Peraturan Sidebar

- **Maksimal 7 item per group** — tidak ada group yang punya >7 item
- **Group dengan header** — judul group dalam huruf kapital/kecil tebal
- **Active state** — item yang aktif diberi highlight
- **Badge** — stok menipis, piutang jatuh tempo sebagai badge angka
- **Saldo** — dompet menampilkan saldo ringkas
- **Global search** — input search di header sidebar (CTRL+K)
- **Collapsible group** — group bisa di-collapse untuk menghemat ruang
- **Role-based visibility** — group Owner hanya muncul untuk owner; group Produksi hanya untuk cabang yang relevan

---

## 6. Breadcrumb

### 6.1 Format

```
Level 1 > Level 2 > Level 3
```

Setiap level adalah link yang bisa diklik (kecuali level terakhir = halaman saat ini).

### 6.2 Daftar Breadcrumb

| Halaman | Breadcrumb |
|---------|------------|
| **Dashboard (root)** | `Beranda` |
| | |
| **— BISNIS —** | |
| Daftar Cabang | `Beranda > Bisnis` |
| Dashboard Cabang | `Beranda > Bisnis > [Nama Cabang]` |
| Kasir | `Beranda > Bisnis > [Nama Cabang] > Kasir` |
| Barang / Inventory | `Beranda > Bisnis > [Nama Cabang] > Barang` |
| Produksi | `Beranda > Bisnis > [Nama Cabang] > Produksi` |
| Pelanggan | `Beranda > Bisnis > [Nama Cabang] > Pelanggan` |
| Cashflow | `Beranda > Bisnis > [Nama Cabang] > Cashflow` |
| Dompet | `Beranda > Bisnis > [Nama Cabang] > Dompet` |
| Transaksi | `Beranda > Bisnis > [Nama Cabang] > Transaksi` |
| Laporan | `Beranda > Bisnis > [Nama Cabang] > Laporan` |
| Pengaturan | `Beranda > Bisnis > [Nama Cabang] > Pengaturan` |
| Users | `Beranda > Bisnis > [Nama Cabang] > Pengaturan > Users` |
| Periode | `Beranda > Bisnis > [Nama Cabang] > Pengaturan > Periode` |
| Sedekah | `Beranda > Bisnis > [Nama Cabang] > Pengaturan > Sedekah` |
| Trans. Berulang | `Beranda > Bisnis > [Nama Cabang] > Pengaturan > Transaksi Berulang` |
| Kurs Valuta | `Beranda > Bisnis > [Nama Cabang] > Pengaturan > Kurs Valuta` |
| Label | `Beranda > Bisnis > [Nama Cabang] > Pengaturan > Label` |
| | |
| **— OWNER —** | |
| Owner Dashboard | `Beranda > Owner` |
| Semua Cabang | `Beranda > Owner > Cabang` |
| Audit Log | `Beranda > Owner > Audit Log` |
| Backup / Restore | `Beranda > Owner > Pengaturan` |
| | |
| **— PERSONAL —** | |
| Dashboard Personal | `Beranda > Personal` |
| Cashflow Personal | `Beranda > Personal > Cashflow` |
| Dompet Personal | `Beranda > Personal > Dompet` |
| Laporan Personal | `Beranda > Personal > Laporan` |
| | |
| **— AKUN —** | |
| Profil | `Beranda > Akun` |

### 6.3 Aturan Breadcrumb

- **Halaman utama (dashboard cabang):** Tidak menampilkan breadcrumb (cukup judul).
- **Halaman level 2 (cashflow, dompet, dll.):** `Beranda > [Nama Cabang] > Cashflow`
- **Halaman pengaturan level 3:** `Beranda > [Nama Cabang] > Pengaturan > Users`
- **Mobile:** Breadcrumb di-truncate dengan ellipsis di tengah jika terlalu panjang.
- **Desktop:** Breadcrumb selalu full.

---

## 7. Global Search

### 7.1 Konsep

- **Pintasan:** `CTRL+K` (desktop) atau tap ikon 🔍 di header (mobile)
- **Modal:** Full-screen overlay dengan input search di bagian atas
- **Real-time:** Hasil muncul saat user mengetik (debounce 300ms)
- **Scope:** Mencari di seluruh data dalam cabang yang sedang aktif

### 7.2 Data yang Bisa Dicari

| Kategori | Sumber Data | Contoh Hasil |
|----------|-------------|--------------|
| **Produk** | `inventory` | Nama produk, SKU, barcode |
| **Invoice** | `transactions` | Nomor invoice, nama pelanggan |
| **Customer** | `customers` | Nama, no WA |
| **Supplier** | `suppliers` | Nama, kontak |
| **Transaksi** | `transactions` + `cashflows` | Tanggal, nominal, catatan |
| **Piutang** | `piutang` | Nama customer, jumlah |
| **Produksi** | `productions` | Invoice number, status |
| **Dompet** | `wallets` | Nama dompet |
| **Fitur** | *(hardcoded)* | Nama menu (Kasir, Barang, dll.) |

### 7.3 Alur Pengguna

```
1. User tekan CTRL+K (atau tap ikon 🔍)
2. Modal search terbuka, input otomatis focus
3. User ketik "abc"
4. Sistem mencari di semua sumber data dalam cabang aktif:
   - inventory.where("nama").startsWithIgnoreCase("abc")
   - customers.where("nama").startsWithIgnoreCase("abc")
   - transactions.where("invoiceNumber").startsWithIgnoreCase("abc")
   - suppliers.where("nama").startsWithIgnoreCase("abc")
   - wallets.where("namaDompet").startsWithIgnoreCase("abc")
   - dll.
5. Hasil dikelompokkan per kategori dengan ikon:
   📦 Produk (3)
   👤 Pelanggan (2)
   📄 Invoice (1)
   🏭 Supplier (0)
6. User klik hasil → navigasi ke halaman terkait
   - Klik produk → buka /barang dengan highlight produk tersebut
   - Klik invoice → buka /transaksi dengan scroll ke invoice
   - Klik fitur → navigasi ke halaman fitur
7. Modal tertutup, user sampai di tujuan
```

### 7.4 Tampilan Hasil

```
┌─────────────────────────────────────────┐
│  🔍  Cari produk, invoice, pelanggan... │
│                                         │
│  ──── HASIL PENCARIAN ────              │
│                                         │
│  📦 PRODUK (3)                          │
│  ├── ABC Juice — Rp 5.000               │
│  ├── ABC Snack — Rp 2.000               │
│  └── ABC Minyak — Rp 15.000             │
│                                         │
│  👤 PELANGGAN (2)                       │
│  ├── ABC Sukses — 0812xxxx              │
│  └── Abdi Cell — 0856xxxx               │
│                                         │
│  📄 INVOICE (1)                         │
│  └── WRK/20260719/0012 — Rp 45.000      │
│                                         │
│  🔗 FITUR (1)                           │
│  └── 🛒 Kasir                           │
│                                         │
│  Tekan ↑↓ untuk navigasi, Enter buka    │
└─────────────────────────────────────────┘
```

---

## 8. Quick Action

### 8.1 Floating Action Button (FAB)

Di semua halaman (kecuali Kasir), terdapat **FAB** di pojok kanan bawah:

```
        ┌─────┐
        │  +  │  ← FAB (Tombol utama)
        └─────┘
```

### 8.2 Aksi per Halaman

| Halaman | Aksi FAB | Shortcut ke |
|---------|----------|-------------|
| **Dashboard Cabang** | `+ Transaksi Baru` | Kasir (POS) |
| **Dashboard Cabang** | `+ Tambah Produk` | Barang (form tambah) |
| **Dashboard Cabang** | `+ Catat Cashflow` | Cashflow (form tambah) |
| **Dashboard Cabang** | `+ Customer Baru` | Pelanggan (form tambah) |
| **Barang** | `+ Produk Baru` | Form tambah produk |
| **Pelanggan** | `+ Customer Baru` | Form tambah customer |
| **Cashflow** | `+ Catat Transaksi` | Form tambah cashflow |
| **Dompet** | `+ Dompet Baru` | Form tambah dompet |
| **Transaksi** | `+ Transaksi Baru` | Kasir (POS) |
| **Supplier** | `+ Supplier Baru` | Form tambah supplier |
| **Purchase Order** | `+ PO Baru` | Form tambah PO |
| **Produksi** | `+ Produksi Baru` | (dari transaksi yang ada) |
| **Laporan** | `📄 Export PDF` | Download laporan PDF |
| **Laporan** | `📊 Export Excel` | Download laporan Excel |

### 8.3 Implementasi

- **Mobile:** FAB di pojok kanan bawah, tap untuk menu aksi melingkar (speed dial)
- **Desktop:** Tombol "+" di pojok kanan atas header halaman (bukan FAB)
- **Maksimal 4 aksi per halaman** — aksi paling relevan saja
- **Aksi pertama adalah default** — tap langsung menjalankan aksi pertama (bisa dikonfigurasi)

### 8.4 Speed Dial (Mobile)

```
        ┌─────┐
        │  ×  │  ← FAB aktif (untuk tutup)
        └─────┘
    ┌─────┘
    │
┌─────┐
│  🛒 │  ← Aksi 1: Transaksi Baru
└─────┘
    │
┌─────┐
│  📦 │  ← Aksi 2: Tambah Produk
└─────┘
    │
┌─────┐
│  💳 │  ← Aksi 3: Catat Cashflow
└─────┘
```

---

## 9. UX Rules

### 9.1 Navigation Rules

| # | Aturan | Penjelasan |
|---|--------|------------|
| N1 | **Maksimal 3 level menu** | Dashboard > Cabang > Fitur. Tidak boleh lebih dalam dari 3 tap. |
| N2 | **Maksimal 5 item Bottom Navigation** | Keterbatasan ibu jari (thumb zone). 5 item adalah maksimal ergonomis. |
| N3 | **Maksimal 7 item per group Sidebar** | Aturan Miller's Law — manusia bisa memproses 7±2 item. |
| N4 | **Group dengan header jelas** | Setiap group sidebar punya judul (Operasional, Keuangan, Owner, Pengaturan). |
| N5 | **Role-based filtering** | Kasir tidak melihat menu Owner. Staff gudang tidak melihat menu Kasir. |
| N6 | **Active state visual** | Menu yang aktif harus jelas berbeda secara visual. |
| N7 | **Back button konsisten** | Setiap halaman level 2+ punya tombol kembali ke parent. |

### 9.2 Page Rules

| # | Aturan | Penjelasan |
|---|--------|------------|
| P1 | **Setiap halaman punya judul** | Judul halaman di bagian atas, konsisten dengan breadcrumb. |
| P2 | **Setiap halaman punya Search** | Input search di bagian atas untuk data yang bisa dicari. |
| P3 | **Setiap tabel punya Filter** | Filter berdasarkan status, tanggal, kategori, atau kolom relevan. |
| P4 | **Setiap halaman CRUD punya tombol Add** | Posisi konsisten: pojok kanan atas (desktop) atau FAB (mobile). |
| P5 | **Loading state** | Setiap halaman menampilkan skeleton saat data dimuat. |
| P6 | **Empty state** | Setiap halaman menampilkan ilustrasi + pesan + tombol aksi saat data kosong. |
| P7 | **Error state** | Setiap halaman menampilkan pesan error + tombol retry. |
| P8 | **Konfirmasi destruktif** | Semua aksi hapus memerlukan konfirmasi (modal, bukan confirm() native). |
| P9 | **Toast feedback** | Setiap aksi (simpan, hapus, update) menampilkan toast sukses/gagal. |

### 9.3 Data Rules

| # | Aturan | Penjelasan |
|---|--------|------------|
| D1 | **Format rupiah konsisten** | Semua nominal menggunakan `formatCurrency()` — bukan string concat manual. |
| D2 | **Format tanggal konsisten** | Semua tanggal menggunakan `date-fns` format `dd MMM yyyy` (Indonesia). |
| D3 | **Warna status konsisten** | Hijau = sukses/aktif/lunas, Merah = error/batal, Kuning = warning/DP, Abu = inactive. |
| D4 | **Ikon konsisten** | Setiap tipe entitas punya ikon tetap (Kasir 🛒, Barang 📦, Cashflow 💳, dll). |

### 9.4 Mobile Rules

| # | Aturan | Penjelasan |
|---|--------|------------|
| M1 | **Thumb zone** | Semua tombol aksi di bagian bawah layar (mudah dijangkau ibu jari). |
| M2 | **Bottom sheet untuk form** | Form di mobile menggunakan bottom sheet, bukan modal penuh. |
| M3 | **Swipe untuk back** | Gestur swipe kiri untuk kembali (iOS native). |
| M4 | **Safe area** | Konten menghormati safe area (notch, home indicator). |
| M5 | **Max width 480px** | Konten tidak melebihi 480px di mobile, centered. |

### 9.5 Desktop Rules

| # | Aturan | Penjelasan |
|---|--------|------------|
| T1 | **Sidebar tetap** | Sidebar selalu terlihat di kiri, tidak auto-hide. |
| T2 | **Content full width** | Konten menggunakan sisa lebar layar setelah sidebar. |
| T3 | **Hover state** | Semua item yang bisa diklik memiliki hover state. |
| T4 | **Tooltip** | Ikon tanpa label memiliki tooltip. |
| T5 | **Keyboard shortcut** | CTRL+K untuk search, ESC untuk tutup modal, CTRL+Enter untuk submit form. |

---

## 10. Kesimpulan

### 10.1 Mengapa Navigasi Baru Lebih Baik

| Aspek | Navigasi Lama | Navigasi Baru | Improvement |
|-------|---------------|---------------|:-----------:|
| **Item navigation grid** | 18 (flat) | 8 (2 kelompok) | **-56%** |
| **Bottom nav redundancy** | 2 item identik (Pribadi + Keluarga) | 0 (digabung) | — |
| **Hierarki menu** | 3 level (Buku > Unit > Fitur) | 2 level (Cabang > Fitur) | **-33%** |
| **Konsep buku** | 4 (membingungkan) | 3 (jelas: Bisnis, Owner, Personal) | **+25% clarity** |
| **Shortcut ke fitur inti** | ❌ Tidak ada | ✅ Kasir + Keuangan di bottom nav | **+2 shortcut** |
| **Role-based filtering** | ❌ Semua role lihat 18 menu | ✅ Setiap role lihat menu relevan | **+100% (baru)** |
| **Fitur niche di grid** | ✅ 8 item niche setara fitur inti | ❌ Dipindah ke Pengaturan | — |
| **Global Search** | ❌ Tidak ada | ✅ CTRL+K (semua data) | **+100% (baru)** |
| **Quick Action FAB** | ❌ Tidak ada | ✅ Aksi cepat per halaman | **+100% (baru)** |
| **Breadcrumb** | ❌ Tidak ada | ✅ Konsisten di semua halaman | **+100% (baru)** |
| **Desktop sidebar** | ❌ Sama dengan mobile | ✅ Sidebar dengan grouping | **+100% (baru)** |
| **UX rules dokumentasi** | ❌ Tidak ada | ✅ 23 aturan eksplisit | **+100% (baru)** |

### 10.2 Dampak ke Pengguna

| Role | Sebelum (langkah ke fitur inti) | Sesudah |
|------|--------------------------------|---------|
| **Kasir** | Buka app > 3 tap ke kasir (app > beranda > usaha > cabang > grid > kasir) | Buka app > 1 tap ke kasir (beranda langsung atau bottom nav "Kasir") |
| **Admin Cabang** | 18 menu membingungkan, sering salah pilih | 2 grup jelas (Operasional + Keuangan), fitur jarang di pengaturan |
| **Owner** | Harus buka buku-global terpisah, 7 tab | Owner Dashboard dengan ringkasan semua cabang, akses dari drawer |
| **Personal User** | Pribadi & Keluarga bingung bedanya | Satu "Personal" dengan toggle pribadi/keluarga |

### 10.3 Estimasi Implementasi

| Komponen | Estimasi | Catatan |
|----------|----------|---------|
| Bottom Nav baru | 1-2 jam | Ubah route & ikon |
| Navigation grid baru | 2-3 jam | Kurangi dari 18 ke 8 item |
| Sidebar desktop | 3-4 jam | Komponen baru + responsive |
| Breadcrumb | 2-3 jam | Komponen + implementasi di layout |
| Global Search | 4-6 jam | Modal + search logic + highlight |
| Quick Action FAB | 2-3 jam | Speed dial component |
| Role-based filtering | 2-3 jam | Integrasi dengan RoleGuard |
| Gabung Pribadi + Keluarga | 1 jam | Route + toggle |
| Pindah fitur niche ke Pengaturan | 2-3 jam | Route restructuring |
| UX rules implementasi | 4-8 jam | Empty state, error state, konsistensi |
| **Total** | **~23-35 jam** | **3-5 hari kerja** |

### 10.4 Prioritas Implementasi

| Fase | Item | Durasi | Dampak |
|:----:|------|:------:|--------|
| **🔴 Fase 1** | Bottom Nav baru, Navigation grid baru, Breadcrumb | 2 hari | ⭐⭐⭐ Tertinggi — langsung terasa |
| **🟡 Fase 2** | Role-based filtering, Gabung Pribadi/Keluarga, Pindah niche | 1 hari | ⭐⭐ Tinggi — menyederhanakan |
| **🟢 Fase 3** | Sidebar desktop, Quick Action, Global Search | 2 hari | ⭐ Sedang — power user features |
| **🔵 Fase 4** | UX rules (empty/error state, konsistensi) | 1 hari | ⭐ Polishing — kualitas |

---

*Dokumen ini bersifat konseptual. Tidak ada source code yang diubah.*
