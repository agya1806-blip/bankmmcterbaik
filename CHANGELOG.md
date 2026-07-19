# CHANGELOG

## v0.2.0 — Production Hardening & Security Audit (2026-07-19)

### 🔐 Security Fixes
- **PIN hashing upgrade**: SHA-256 (tanpa salt) → PBKDF2 + salt 16-byte + 100.000 iterasi. Backward compatible dengan legacy hash.
- **Forgot PIN verification**: Sekarang membutuhkan verifikasi PIN lama sebelum reset.
- **AuthService bug fixes**: 3 bugs diperbaiki — plaintext comparison (`pinHash !== pin`), plaintext storage di register dan changePin.
- **Route protection**: AppShell sekarang redirect unauthenticated users ke `/login`.
- **Hydration-safe initialization**: Zustand `onRehydrateStorage` + `isInitializing` state mencegah flash-of-unauthenticated-content.

### 🗄️ Database Fixes
- **Version ordering**: v6→v5→v4→v3→v7 → v3→v4→v5→v6→v7 (ascending).
- **recurringTemplates**: Ditambahkan ke v7 schema (sebelumnya hanya ada di v4, tidak dibuat untuk instalasi baru).

### ⚡ Performance
- **useLiveQuery**: Polling 2s → reactive changes-based + fallback 10s polling.
- **Activity throttle**: Inactivity wrapper update dibatasi 30s (sebelumnya setiap event).
- **Unused dependencies**: Hapus @base-ui/react, idb, shadcn, class-variance-authority (195 packages removed).

### 🧹 Code Quality
- **Skeleton component**: Konsolidasi `components/skeleton.tsx` → `components/ui/skeleton.tsx`. Tambah SkeletonLine, SkeletonCircle exports.
- **Barrel exports**: Semua varian skeleton di-export dari `components/ui/index.ts`.
- **Empty utils/**: Direktori `src/utils/` dihapus.

### 🌐 PWA
- **Icons**: SVG icons 192x192 dan 512x512 untuk manifest.
- **Service Worker**: Cache statis + offline fallback.
- **Error pages**: Custom 404, global-error (500), dan `/offline` page.
- **Service Worker register**: Auto-register di root layout.

### 📦 Dependency Cleanup
- Removed: `@base-ui/react`, `idb`, `shadcn`, `class-variance-authority`

---

## v0.1.0 — Refactor Navigasi & Menu

## Arsitektur Navigasi Baru

```
BottomNav (5 item)
├── Dashboard   → / (ringkasan semua buku)
├── Buku        → /buku (pemilih buku)
│   ├── Pribadi → /buku-pribadi
│   ├── Keluarga → /buku-keluarga
│   └── Bisnis  → /buku-bisnis (daftar unit usaha)
│       └── [Unit] → /buku-bisnis/[unit] (dashboard unit)
├── Transaksi   → kontekstual (berdasarkan buku aktif)
├── Laporan     → kontekstual (berdasarkan buku aktif)
└── Profil      → /profile
```

## Menu yang Dipindahkan

| Menu | Dari (Navigasi Utama) | Ke (Submenu) |
|---|---|---|
| Supplier | Sidebar > OPERASIONAL | Produk > Sub-feature Grid |
| Purchase Order | Sidebar > OPERASIONAL | Produk > Sub-feature Grid |
| Barcode | Sidebar > OPERASIONAL | Produk > Sub-feature Grid |
| Label & Kategori | Sidebar > OPERASIONAL | Produk > Sub-feature Grid |
| Budget | Sidebar > KEUANGAN | Pengaturan > Sub-feature Grid |
| Exchange Rate | Sidebar > KEUANGAN | Pengaturan > Sub-feature Grid |
| Recurring | Sidebar > KEUANGAN | Pengaturan > Sub-feature Grid |
| Users | Sidebar > OWNER | Pengaturan > Sub-feature Grid |
| Period Closing | Sidebar > PENGATURAN | Pengaturan > Sub-feature Grid |
| Sedekah | Sidebar > PENGATURAN | Pengaturan > Sub-feature Grid |
| Dompet | Sidebar > KEUANGAN | Sidebar Unit > (dihapus dari sidebar, akses via halaman lain) |
| Cashflow | Sidebar > KEUANGAN | Sidebar Unit > (dihapus dari sidebar, akses via halaman lain) |
| Transfer | Sidebar > KEUANGAN | Sidebar Unit > (dihapus dari sidebar, akses via halaman lain) |

## Menu yang Dihapus dari Navigasi Utama

- Dashboard Global (Buku Global) — konsep dihapus
- Buku Usaha hub lama — diganti Dashboard Utama
- Floating Menu / Menu button — dihapus dari BottomNav
- Shortcut grid duplikat — dirapikan
- Sidebar items yang tidak perlu (10+ item dipindah ke submenu)

## Struktur Route Baru

```
/                    → Dashboard Utama (aggregate stats)
/buku                → Pemilih Buku (Pribadi/Keluarga/Bisnis)
/buku-pribadi        → Dashboard Pribadi
/buku-pribadi/cashflow → Cashflow Pribadi
/buku-keluarga      → Dashboard Keluarga
/buku-keluarga/cashflow → Cashflow Keluarga
/buku-bisnis         → Daftar Unit Usaha (dinamis)
/buku-bisnis/[unit]  → Dashboard Unit Usaha
/buku-bisnis/[unit]/kasir → POS
/buku-bisnis/[unit]/transaksi → Riwayat Transaksi
/buku-bisnis/[unit]/produk → Manajemen Produk
/buku-bisnis/[unit]/produksi → Produksi
/buku-bisnis/[unit]/pelanggan → CRM
/buku-bisnis/[unit]/supplier → Supplier (submenu Produk)
/buku-bisnis/[unit]/purchase-order → PO (submenu Produk)
/buku-bisnis/[unit]/laporan → Laporan
/buku-bisnis/[unit]/pengaturan → Pengaturan + sub-features
/buku-bisnis/[unit]/budget → Budget (submenu Pengaturan)
/buku-bisnis/[unit]/recurring → Recurring (submenu Pengaturan)
/buku-bisnis/[unit]/period → Period Closing (submenu Pengaturan)
/buku-bisnis/[unit]/sedekah → Sedekah (submenu Pengaturan)
/buku-bisnis/[unit]/exchange-rate → Kurs (submenu Pengaturan)
/buku-bisnis/[unit]/users → Users (submenu Pengaturan)
/buku-bisnis/[unit]/label → Label (submenu Produk)
/buku-bisnis/[unit]/dompet → Dompet
/buku-bisnis/[unit]/cashflow → Cashflow
/buku-bisnis/[unit]/transfer → Transfer
/buku-bisnis/[unit]/inventory → Inventory/Gudang
/profile             → Profil User
```

## File yang Dihapus

| File | Alasan |
|---|---|
| `src/app/page.tsx` | Root redirect, diganti Dashboard Utama |
| `src/app/(dashboard)/buku-global/page.tsx` | Konsep Global Book dihapus |
| `src/app/(dashboard)/buku-usaha/page.tsx` | Hub lama, diganti Dashboard Utama |
| `src/app/(dashboard)/buku-usaha/usaha/page.tsx` | Dipindah ke `/buku-bisnis` |
| `src/app/(dashboard)/buku-usaha/[cabang]/**/*` | Dipindah ke `/buku-bisnis/[cabang]/**/*` |
| `src/components/pin-lock.tsx` | Dead code (0 import) |
| `src/hooks/useThermalPrinter.ts` | Dead code (0 import) |
| `src/lib/db-helpers.ts` | Dead code (0 import) |
| `src/components/business/global-*.tsx` (7 file) | Dead code setelah Global Book dihapus |

## Komponen yang Diubah

| Komponen | Perubahan |
|---|---|
| `bottom-nav.tsx` | 5 item: Dashboard, Buku, Transaksi, Laporan, Profil. Transaksi/Laporan kontekstual berdasarkan pathname |
| `sidebar.tsx` | Kontekstual: menu berbeda saat di main pages vs di unit bisnis. Hanya 8 item utama + submenu |
| `app-shell.tsx` | Hapus prop `onMenuClick` dari BottomNav |
| `buku-bisnis/page.tsx` | Dynamic unit listing dari database, tambah/hapus unit, back ke `/buku` |
| `buku-bisnis/[cabang]/pengaturan/page.tsx` | Tambah grid sub-feature (Budget, Recurring, Users, Period, Sedekah, Exchange Rate) |
| `buku-bisnis/[cabang]/produk/page.tsx` | Tambah grid sub-feature (Supplier, PO, Barcode, Label) |
| `buku/page.tsx` | **BARU** — pemilih buku (Pribadi/Keluarga/Bisnis) |

## Unit Usaha Dinamis

User dapat menambah unit usaha baru langsung dari halaman `/buku-bisnis`:
- Klik "Tambah Unit Usaha"
- Masukkan nama unit
- Sistem otomatis membuat profile + dompet default
- Unit muncul di grid tanpa perlu hardcode

Unit dihapus via Pengaturan Unit (data tetap aman).
