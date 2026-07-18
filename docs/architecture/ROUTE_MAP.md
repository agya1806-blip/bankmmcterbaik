# Route Map — MMCBANK

**Total Routes:** 34 (30 App Router + 4 auth/static)

---

## Legend

| Status | Keterangan |
|--------|------------|
| **Auth** | Halaman sebelum login (login, register, lupa PIN) |
| **Global** | Aggregator semua cabang (multi-branch) |
| **Personal** | Buku Pribadi / Keluarga (non-bisnis) |
| **Business** | Buku Usaha & cabang-cabangnya |

---

## Auth Routes

| # | URL | Status | Halaman | Komponen Utama | Dependency |
|---|-----|--------|---------|----------------|------------|
| 1 | `/login` | Auth | Login dengan username + PIN | inline | `useSessionStore`, `db`, `verifyPin`, `showToast` |
| 2 | `/register` | Auth | Registrasi user baru | inline | `useSessionStore`, `db`, `hashPin`, `showToast` |
| 3 | `/forgot-pin` | Auth | Reset PIN (2-step: verifikasi user → PIN baru) | inline | `db`, `hashPin`, `showToast` |

---

## Dashboard Routes

| # | URL | Status | Halaman | Komponen Utama | Dependency |
|---|-----|--------|---------|----------------|------------|
| 4 | `/` | — | Landing page (redirect ke `/buku-usaha` atau `/login`) | inline | `useSessionStore`, `useRouter` |
| 5 | `/profile` | Personal | Profil user: ganti nama, foto, PIN, theme toggle, logout | inline | `useSessionStore`, `useThemeStore`, `db`, `hashPin`, `verifyPin` |

---

## Buku Global

| # | URL | Status | Halaman | Komponen Utama | Dependency |
|---|-----|--------|---------|----------------|------------|
| 6 | `/buku-global` | Global | Dashboard multi-cabang dengan 7 tab: Dashboard, Piutang, Pelanggan, Audit, Settings, Dompet, Profil | `GlobalKpiCards`, `GlobalPiutangTab`, `GlobalPelangganTab`, `GlobalAuditTab`, `GlobalSettingsTab`, `GlobalDompetTab`, `GlobalProfilTab` | `useSessionStore`, `useThemeStore`, `db`, `executeTransfer`, `backup`, `export-utils` |

---

## Buku Pribadi & Keluarga

| # | URL | Status | Halaman | Komponen Utama | Dependency |
|---|-----|--------|---------|----------------|------------|
| 7 | `/buku-pribadi` | Personal | Dashboard keuangan pribadi (ringkasan, dompet, hutang, laporan, riwayat) | `PribadiKeluargaDashboard` (unitId="pribadi") | `db`, `useSessionStore`, `useLiveQuery` |
| 8 | `/buku-pribadi/cashflow` | Personal | Catatan cashflow pribadi (CRUD, filter, statistik) | `PribadiKeluargaCashflow` (unitId="pribadi") | `db`, `useLiveQuery`, `showToast` |
| 9 | `/buku-keluarga` | Personal | Dashboard keuangan keluarga | `PribadiKeluargaDashboard` (unitId="keluarga") | `db`, `useSessionStore`, `useLiveQuery` |
| 10 | `/buku-keluarga/cashflow` | Personal | Catatan cashflow keluarga | `PribadiKeluargaCashflow` (unitId="keluarga") | `db`, `useLiveQuery`, `showToast` |

---

## Buku Usaha — Landing & Listing

| # | URL | Status | Halaman | Komponen Utama | Dependency |
|---|-----|--------|---------|----------------|------------|
| 11 | `/buku-usaha` | Business | Landing page: ringkasan keuangan semua unit, 7-day cashflow chart, recent transactions | inline | `db`, `useLiveQuery`, `useSessionStore`, `recharts`, `date-fns` |
| 12 | `/buku-usaha/usaha` | Business | Daftar unit usaha dengan statistik per-unit | inline | `db`, `useLiveQuery`, `useSessionStore` |

---

## Buku Usaha — Per-Cabang (Dynamic Route `[cabang]`)

Parameter `[cabang]` dapat berupa: `percetakan`, `laptop`, `gadget`, `warkop`, `konveksi`, `kelontong`, `toko-pakaian`

| # | URL | Status | Halaman | Komponen Utama | Dependency | Role Guard |
|---|-----|--------|---------|----------------|------------|------------|
| 13 | `/buku-usaha/[cabang]` | Business | Dashboard cabang: greeting, income, growth, piutang, stok alerts, chart, recent tx, navigation grid | inline | `db`, `useLiveQuery`, `useSessionStore`, `recharts`, `date-fns` | — |
| 14 | `/buku-usaha/[cabang]/kasir` | Business | POS Kasir: grid produk / manual entry, cart, checkout, order history, barcode scan | `PosProductGrid`, `PosManualForm`, `PosCartPanel`, `PosOrderHistory`, `InvoiceA4`, `KalkulatorHarga`, `BarcodeScanner` | `db`, `engine/transaction-pipeline-v4`, `engine/cancel-transaction` | — |
| 15 | `/buku-usaha/[cabang]/transaksi` | Business | Daftar transaksi + produksi (kanban board) + invoice print + cicilan piutang | `InvoiceA4`, `KalkulatorHarga`, `BarcodeScanner` | `db` (useLiveQuery dexie-react-hooks), `formatCurrency` | — |
| 16 | `/buku-usaha/[cabang]/inventory` | Business | Manajemen inventory: CRUD, stok mutasi, barcode, foto, kalkulator harga, stock alert | `KalkulatorHarga`, `BarcodeScanner` | `db`, `useLiveQuery`, `showToast` | — |
| 17 | `/buku-usaha/[cabang]/cashflow` | Business | Catatan cashflow: CRUD, filter tanggal, statistik masuk/keluar | inline | `db`, `useLiveQuery`, `formatCurrency`, `showToast` | — |
| 18 | `/buku-usaha/[cabang]/dompet` | Business | Manajemen dompet: CRUD, topup/tarik, multi-currency, history mutasi | inline | `db`, `useLiveQuery`, `formatCurrency` | `kasir` |
| 19 | `/buku-usaha/[cabang]/budget` | Business | Budget planning: set budget per kategori per bulan, vs realisasi | inline | `db` (useLiveQuery dexie-react-hooks), `showToast` | — |
| 20 | `/buku-usaha/[cabang]/laporan` | Business | Laporan keuangan: income statement, laba kotor/bersih, PDF export | inline | `db`, `useLiveQuery`, `jsPDF` | — |
| 21 | `/buku-usaha/[cabang]/purchase-order` | Business | Purchase Order: CRUD, status workflow, auto-update stok | inline | `db` (useLiveQuery dexie-react-hooks), `showToast` | — |
| 22 | `/buku-usaha/[cabang]/supplier` | Business | Manajemen supplier: CRUD, search | inline | `db` (useLiveQuery dexie-react-hooks), `showToast` | — |
| 23 | `/buku-usaha/[cabang]/period` | Business | Period closing: month-end, guard checkout | inline | `db`, `useLiveQuery`, `useSessionStore`, `showToast` | — |
| 24 | `/buku-usaha/[cabang]/recurring` | Business | Transaksi berulang: template recurring, auto-generate cashflow | inline | `db`, `useLiveQuery`, `showToast` | — |
| 25 | `/buku-usaha/[cabang]/exchange-rate` | Business | Konfigurasi kurs USD/IDR | inline | `db`, `useLiveQuery`, `formatCurrency` | — |
| 26 | `/buku-usaha/[cabang]/transfer` | Business | Transfer antar dompet dalam satu cabang | inline | `db`, `useLiveQuery`, `showToast` | — |
| 27 | `/buku-usaha/[cabang]/sedekah` | Business | Manajemen sedekah: 4 jenis saldo (zakat, infak, sedekah) | inline | `db`, `useLiveQuery`, `showToast` | `admin` |
| 28 | `/buku-usaha/[cabang]/users` | Business | Manajemen user: CRUD, role (admin/kasir/viewer), set PIN | inline | `db`, `useLiveQuery`, `useSessionStore`, `hashPin` | `admin` |
| 29 | `/buku-usaha/[cabang]/pengaturan` | Business | Pengaturan cabang: profil bisnis, export data, reset data | inline | `db`, `useLiveQuery`, `useSessionStore`, `showToast` | `admin` |
| 30 | `/buku-usaha/[cabang]/produksi` | Business | Tracking produksi: status antre → diproduksi → selesai | inline | `db` (useLiveQuery dexie-react-hooks), `showToast` | — |
| 31 | `/buku-usaha/[cabang]/label` | Business | Manajemen label/warna untuk tagging transaksi | inline | `db` (useLiveQuery dexie-react-hooks), `showToast` | — |

---

## API Routes

| # | URL | Method | Fungsi |
|---|-----|--------|--------|
| 32 | `/api/webhook` | POST | Simulasi webhook payment gateway (payment.success/failed/refund) |
| 33 | `/api/webhook` | GET | Health check endpoint |

---

## Layout Routes (non-page)

| # | URL | Layout File | Fungsi |
|---|-----|-------------|--------|
| — | `/(auth)` | `(auth)/layout.tsx` | Wrapper centered card untuk halaman auth |
| — | `/(dashboard)` | `(dashboard)/layout.tsx` | AppShell + BottomNav + InactivityWrapper + NotificationChecker + RecurringScheduler |
| — | `/buku-usaha/[cabang]` | `buku-usaha/[cabang]/layout.tsx` | ErrorBoundary + HydrationSafe |

---

## Ringkasan per Status

| Status | Jumlah Route |
|--------|-------------|
| Auth | 3 |
| Personal | 4 |
| Global | 1 |
| Business | 25 |
| API | 1 (2 method) |
| **Total** | **34** |
