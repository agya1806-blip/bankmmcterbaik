# Laporan Audit Struktur Project MMCBANK

**Tanggal:** 19 Juli 2026  
**Auditor:** Senior Software Architect (Automated Analysis)  
**Project:** MMCBANK — Multi-Branch Financial Management PWA  
**Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, Dexie.js, Zustand, Framer Motion

---

## Daftar Isi

1. [Struktur Project](#1-struktur-project)
2. [Ringkasan Temuan](#2-ringkasan-temuan)
3. [Temuan Detail & Rekomendasi](#3-temuan-detail--rekomendasi)
   - [HIGH PRIORITY](#high-priority)
   - [MEDIUM PRIORITY](#medium-priority)
   - [LOW PRIORITY](#low-priority)
4. [Kesimpulan](#4-kesimpulan)

---

## 1. Struktur Project

```
mmcbank/
├── public/
│   └── manifest.json                          # PWA manifest
├── src/
│   ├── __tests__/                             # (5 files) Jest test suites
│   │   ├── accounting.test.ts
│   │   ├── cancel-transaction.test.ts
│   │   ├── constants.test.ts
│   │   ├── db-v4.test.ts
│   │   └── pipeline.test.ts
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx                         # Root layout (metadata, fonts, Toaster)
│   │   ├── page.tsx                           # Landing page
│   │   ├── api/webhook/route.ts               # Webhook API route
│   │   ├── (auth)/
│   │   │   ├── layout.tsx                     # Auth layout wrapper
│   │   │   ├── forgot-pin/page.tsx
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   └── (dashboard)/
│   │       ├── layout.tsx                     # Dashboard layout (AppShell, BottomNav)
│   │       ├── profile/page.tsx
│   │       ├── buku-global/page.tsx           # Global multi-branch manager (365 lines)
│   │       ├── buku-keluarga/
│   │       │   ├── page.tsx                   # 6 lines (delegates to shared component)
│   │       │   └── cashflow/page.tsx          # 6 lines (delegates to shared component)
│   │       ├── buku-pribadi/
│   │       │   ├── page.tsx                   # 6 lines (delegates to shared component)
│   │       │   └── cashflow/page.tsx          # 6 lines (delegates to shared component)
│   │       ├── buku-usaha/
│   │       │   ├── page.tsx                   # Landing page bisnis
│   │       │   ├── usaha/page.tsx             # Unit usaha listing
│   │       │   └── [cabang]/
│   │       │       ├── layout.tsx
│   │       │       ├── page.tsx               # Branch dashboard
│   │       │       ├── budget/page.tsx
│   │       │       ├── cashflow/page.tsx
│   │       │       ├── dompet/page.tsx
│   │       │       ├── exchange-rate/page.tsx
│   │       │       ├── inventory/page.tsx     # 722 baris — TERBESAR
│   │       │       ├── kasir/page.tsx
│   │       │       ├── label/page.tsx
│   │       │       ├── laporan/page.tsx
│   │       │       ├── pelanggan/page.tsx     # 635 baris
│   │       │       ├── pengaturan/page.tsx
│   │       │       ├── period/page.tsx
│   │       │       ├── produksi/page.tsx
│   │       │       ├── purchase-order/page.tsx
│   │       │       ├── recurring/page.tsx
│   │       │       ├── sedekah/page.tsx
│   │       │       ├── supplier/page.tsx
│   │       │       ├── transaksi/page.tsx     # 710 baris
│   │       │       ├── transfer/page.tsx
│   │       │       └── users/page.tsx
│   ├── components/
│   │   ├── error-boundary.tsx
│   │   ├── hydration-safe.tsx
│   │   ├── invoice-a4.tsx
│   │   ├── pin-lock.tsx                       # DEAD CODE — tidak digunakan
│   │   ├── skeleton.tsx
│   │   ├── business/                          # (15 files) Komponen bisnis
│   │   │   ├── barcode-scanner.tsx
│   │   │   ├── global-audit-tab.tsx
│   │   │   ├── global-dompet-tab.tsx
│   │   │   ├── global-kpi-cards.tsx
│   │   │   ├── global-pelanggan-tab.tsx
│   │   │   ├── global-piutang-tab.tsx
│   │   │   ├── global-profil-tab.tsx
│   │   │   ├── global-settings-tab.tsx
│   │   │   ├── kalkulator-harga.tsx           # 427 baris
│   │   │   ├── pos-cart-panel.tsx
│   │   │   ├── pos-manual-form.tsx
│   │   │   ├── pos-order-history.tsx
│   │   │   ├── pos-product-grid.tsx
│   │   │   ├── pribadi-keluarga-cashflow.tsx
│   │   │   └── pribadi-keluarga-dashboard.tsx # 431 baris
│   │   └── layout/                            # (6 files) Layout components
│   │       ├── app-shell.tsx
│   │       ├── bottom-nav.tsx
│   │       ├── inactivity-wrapper.tsx
│   │       ├── notification-checker.tsx
│   │       ├── recurring-scheduler.tsx
│   │       └── role-guard.tsx
│   ├── engine/                                # (3 files) Business logic engine
│   │   ├── cancel-transaction.ts
│   │   ├── double-entry.ts
│   │   └── transaction-pipeline-v4.ts
│   ├── hooks/                                 # (2 files)
│   │   ├── useLiveQuery.ts                    # Custom polling hook
│   │   └── useThermalPrinter.ts               # DEAD CODE — tidak digunakan
│   ├── lib/                                   # (9 files) Utilities
│   │   ├── audit-logger.ts
│   │   ├── backup.ts
│   │   ├── crypto.ts
│   │   ├── currency.ts
│   │   ├── db-helpers.ts                      # DEAD CODE — tidak digunakan
│   │   ├── db-v4.ts                           # 605 baris — schema utama
│   │   ├── export-utils.ts
│   │   ├── notification.ts
│   │   └── toast.ts
│   └── store/                                 # (2 files) Zustand stores
│       ├── useSessionStore.ts
│       └── useThemeStore.ts
├── jest.config.ts
├── jest.setup.ts
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json
```

**Total:** 92 file sumber (eksklusif node_modules, .next, .git)  
**Routes:** 34 route (30 App Router + 4 auth/static)  
**Database:** 24 tabel Dexie v7

---

## 2. Ringkasan Temuan

| # | Temuan | Tingkat | File Terkena Dampak |
|---|--------|---------|---------------------|
| H1 | **Dead Code: `lib/db-helpers.ts`** — 262 baris tidak pernah diimpor | **HIGH** | `src/lib/db-helpers.ts` |
| H2 | **Dead Code: `hooks/useThermalPrinter.ts`** — 141 baris tidak pernah diimpor | **HIGH** | `src/hooks/useThermalPrinter.ts` |
| H3 | **Dead Code: `components/pin-lock.tsx`** — 129 baris tidak pernah diimpor | **HIGH** | `src/components/pin-lock.tsx` |
| H4 | **File Terlalu Besar: `inventory/page.tsx`** — 722 baris | **HIGH** | `src/app/.../inventory/page.tsx` |
| H5 | **File Terlalu Besar: `transaksi/page.tsx`** — 710 baris | **HIGH** | `src/app/.../transaksi/page.tsx` |
| H6 | **File Terlalu Besar: `pelanggan/page.tsx`** — 635 baris | **HIGH** | `src/app/.../pelanggan/page.tsx` |
| H7 | **File Terlalu Besar: `lib/db-v4.ts`** — 605 baris, terlalu banyak tanggung jawab | **HIGH** | `src/lib/db-v4.ts` |
| H8 | **7 Dependency Tidak Digunakan** — `@base-ui/react`, `clsx`, `cva`, `idb`, `jsqr`, `shadcn`, `tailwind-merge` | **HIGH** | `package.json` |
| M1 | **Hook Redundan: custom `useLiveQuery` vs `dexie-react-hooks`** | **MEDIUM** | `src/hooks/useLiveQuery.ts` |
| M2 | **Duplikasi Manajemen Dompet** — 4 lokasi dengan implementasi serupa | **MEDIUM** | buku-global, buku-pribadi, buku-keluarga, [cabang]/dompet |
| M3 | **Duplikasi Manajemen Piutang** — 3 lokasi | **MEDIUM** | buku-global, buku-pribadi/keluarga, [cabang]/transaksi |
| M4 | **~15 File dengan `import React` Tidak Perlu** — JSX transform otomatis | **MEDIUM** | ~15 file komponen & halaman |
| L1 | **1-consumer lib files** — `backup.ts`, `export-utils.ts`, `notification.ts` | **LOW** | `src/lib/` |
| L2 | **Duplikasi Edit Profile** — `/profile` + `GlobalProfilTab` | **LOW** | `profile/page.tsx`, `global-profil-tab.tsx` |
| L3 | **AnimatePresence unused import** di `kalkulator-harga.tsx` | **LOW** | `src/components/business/kalkulator-harga.tsx` |
| L4 | **File Mendekati Ambang 500 Baris** — `kasir` (465), `pribadi-keluarga-dashboard` (431), `kalkulator-harga` (427) | **LOW** | 3 file |

---

## 3. Temuan Detail & Rekomendasi

---

### HIGH PRIORITY

---

#### H1 — Dead Code: `lib/db-helpers.ts` (262 baris)

**Lokasi:** `src/lib/db-helpers.ts`  
**Baris:** 262  
**Status:** Tidak pernah diimpor oleh file lain. Satu-satunya referensi adalah komentar di `__tests__/accounting.test.ts` baris 5.

**Fungsi yang diekspor (semua tidak terpakai):**
- `isGlobalMode(unitId)`
- `getUnitLabel(unitId)`
- `getVisibleUnits(currentUnit)`
- `getNonBizUnits()`
- `bookOrBranchSchema()` — validasi Zod schema
- `computeLabaBersih()` — aggregasi cashflow
- `canAddWallet()` — batas maksimum dompet
- `getAggregatedData()` — query multi-unit

**Rekomendasi:** Hapus file ini. Tidak ada ketergantungan. Jika fungsionalitasnya diperlukan di masa depan, bisa diambil kembali dari git history.

---

#### H2 — Dead Code: `hooks/useThermalPrinter.ts` (141 baris)

**Lokasi:** `src/hooks/useThermalPrinter.ts`  
**Baris:** 141  
**Status:** Tidak pernah diimpor oleh file lain.

**Fungsi:**
- `useThermalPrinter()` — hook untuk koneksi Bluetooth ke thermal printer Web Bluetooth API, dengan fungsi `connect()`, `disconnect()`, `printReceipt()`.

**Rekomendasi:** Hapus file ini. Jika fitur printer thermal dibutuhkan, bisa diambil kembali dari git history. Atau pindahkan ke folder `components/business/` jika memang akan digunakan segera.

---

#### H3 — Dead Code: `components/pin-lock.tsx` (129 baris)

**Lokasi:** `src/components/pin-lock.tsx`  
**Baris:** 129  
**Status:** Tidak pernah diimpor oleh file lain.

**Fungsi:**
- `PinLock` component — layar kunci dengan input PIN 6 digit, menggunakan `verifyPin` dari lib/crypto.

**Rekomendasi:** Hapus file ini. Fungsi PIN lock tidak digunakan di mana pun dalam app.

---

#### H4 — File Terlalu Besar: `inventory/page.tsx` (722 baris)

**Lokasi:** `src/app/(dashboard)/buku-usaha/[cabang]/inventory/page.tsx`  
**Baris:** 722  
**Ukuran:** File terbesar di project

**Analisis:** Satu file ini mengandung:
- Form CRUD produk (~120 baris) dengan 12 field state
- Mutasi stok (masuk/keluar) dengan form terintegrasi
- Barcode scanner integration
- Kalkulator harga (inline — duplikasi logika dari `kalkulator-harga.tsx`)
- Search & filter (search query, low stock, out of stock, mutation view)
- Sorting (by name, stock, price)
- Foto produk (base64 upload)
- Stock alerts
- 12 `useState`, 4 `useMemo`, inline handler functions

**Rekomendasi:** Ekstrak menjadi komponen terpisah:
| Komponen | Estimasi Baris |
|----------|---------------|
| `InventoryTable` — tabel produk dengan search/filter/sort | ~150 |
| `InventoryForm` — modal form tambah/edit produk | ~150 |
| `StockMutationPanel` — stok masuk/keluar | ~100 |
| `StockAlertBanner` — peringatan stok menipis | ~50 |

---

#### H5 — File Terlalu Besar: `transaksi/page.tsx` (710 baris)

**Lokasi:** `src/app/(dashboard)/buku-usaha/[cabang]/transaksi/page.tsx`  
**Baris:** 710

**Analisis:** Satu file ini mengandung:
- Daftar transaksi dengan pagination
- Produksi management (Kanban board: antre → diproduksi → selesai)
- Invoice A4 printing (inline HTML template ~80 baris)
- Cicilan piutang (modal, form, history)
- Label management (warna tags)
- Search transactions

**Rekomendasi:** Ekstrak komponen:
| Komponen | Estimasi Baris |
|----------|---------------|
| `TransactionList` — tabel + pagination + search | ~150 |
| `ProductionKanban` — board produksi 3 kolom | ~120 |
| `CicilanModal` — modal cicilan piutang | ~100 |
| `TransactionLabels` — label color tags | ~50 |

---

#### H6 — File Terlalu Besar: `pelanggan/page.tsx` (635 baris)

**Lokasi:** `src/app/(dashboard)/buku-usaha/[cabang]/pelanggan/page.tsx`  
**Baris:** 635

**Analisis:** Satu file ini mengandung:
- Customer CRUD (form tambah/edit inline)
- Import kontak (CSV, VCF, Excel parser) — 3 fungsi parser
- Search/filter pelanggan
- Piutang per customer
- Cicilan piutang (modal, form, history)
- Poin rewards (redeem modal)
- WhatsApp integration (composing message, send)
- Transaksi history per customer

**Rekomendasi:** Ekstrak komponen:
| Komponen | Estimasi Baris |
|----------|---------------|
| `CustomerTable` — daftar + search | ~100 |
| `CustomerForm` — tambah/edit | ~80 |
| `ContactImporter` — CSV/VCF/Excel parser + preview | ~150 |
| `PiutangCard` — piutang + cicilan per customer | ~100 |
| `RedeemPoinModal` — penukaran poin | ~50 |
| `PromoMessage` — WhatsApp broadcast | ~50 |

---

#### H7 — File Terlalu Besar & Multitanggungjawab: `lib/db-v4.ts` (605 baris)

**Lokasi:** `src/lib/db-v4.ts`  
**Baris:** 605  
**Impor oleh:** ~49 file (core module, digunakan di mana-mana)

**Analisis:** File ini mencampur 4 tanggung jawab berbeda:
1. **Type definitions** — `UnitId`, `MataUang`, `SedekahType`, dan 20+ interface untuk tabel
2. **Constants** — `BRANCH_MAP`, `BRANCH_LABELS`, `BRANCH_COLORS`, `UNIT_LABELS`, `unitList`
3. **Dexie schema** — kelas `MMCBankDB` dengan 24 tabel, definisi `db` instance
4. **Exports** — re-export semua type + db instance

**Rekomendasi:** Pisahkan menjadi 3 file:
| File | Isi | Estimasi Baris |
|------|-----|---------------|
| `types.ts` | Semua type definitions (`UnitId`, interface, dll.) | ~250 |
| `constants.ts` | `BRANCH_MAP`, `UNIT_LABELS`, dll. | ~80 |
| `schema.ts` / `db-v4.ts` | Dexie class + db instance | ~250 |

---

#### H8 — 7 Dependency Tidak Digunakan di `package.json`

| Dependency | Version | Alasan Tidak Terpakai |
|-----------|---------|----------------------|
| `@base-ui/react` | ^1.6.0 | Tidak ada import dari package ini |
| `class-variance-authority` | ^0.7.1 | Tidak ada `cva()` atau import CVA |
| `clsx` | ^2.1.1 | Tidak ada import `clsx` |
| `idb` | ^8.0.3 | Semua operasi IndexedDB via Dexie; 0 import `idb` |
| `jsqr` | ^1.4.0 | Barcode scanner menggunakan native `BarcodeDetector` API, bukan jsQR |
| `shadcn` | ^4.13.0 | CLI tool, tidak digunakan dalam kode |
| `tailwind-merge` | ^3.6.0 | Tidak ada `twMerge()` atau utility `cn()` |

**Rekomendasi:** Hapus 7 dependency ini dari `dependencies` di `package.json` dan jalankan `npm install` untuk membersihkan `node_modules` dan `package-lock.json`. Estimasi pengurangan: ~50-100 MB node_modules + kecepatan build lebih cepat.

---

### MEDIUM PRIORITY

---

#### M1 — Hook Redundan: Custom `useLiveQuery` vs `dexie-react-hooks`

**Lokasi:** `src/hooks/useLiveQuery.ts` (29 baris)  
**Digunakan oleh:** `inventory/page.tsx`, `laporan/page.tsx`, `kasir/page.tsx`, `dompet/page.tsx`  
**Juga digunakan (dari dexie-react-hooks):** `buku-global/page.tsx`, `pelanggan/page.tsx`, `transaksi/page.tsx`, dll.

**Analisis:** Project menggunakan **dua implementasi `useLiveQuery` yang berbeda**:
| Aspek | Custom (`hooks/useLiveQuery.ts`) | Official (`dexie-react-hooks`) |
|-------|-------------------------------|-------------------------------|
| Mekanisme | 2-second polling via `setInterval` | Dexie Observable (push-based) |
| Re-render | Setiap 2 detik (boros CPU) | Hanya saat data berubah |
| Ukuran | 29 baris | Library |
| Berat | ~20-50ms siklus CPU per poll | Minimal |

Custom hook menggunakan polling (setiap 2 detik menjalankan query IndexedDB), sementara official hook menggunakan Dexie's Observable pattern yang hanya re-render saat data benar-benar berubah.

**Rekomendasi:** Hapus `hooks/useLiveQuery.ts` dan ganti semua import-nya dengan `import { useLiveQuery } from "dexie-react-hooks"`. Ini akan:
- Mengurangi CPU usage (tidak ada polling 2 detik)
- Mengurangi bundle size (29 baris kurang)
- Mengurangi jumlah `setInterval` aktif di background

**File yang perlu diubah:**
- `inventory/page.tsx` — `import { useLiveQuery } from "@/hooks/useLiveQuery"` → `import { useLiveQuery } from "dexie-react-hooks"`
- `laporan/page.tsx` — sama
- `kasir/page.tsx` — sama
- `dompet/page.tsx` — sama
- `buku-usaha/[cabang]/page.tsx` — sama

---

#### M2 — Duplikasi Manajemen Dompet di 4 Lokasi

**Lokasi:**
1. `buku-global/page.tsx` → `GlobalDompetTab` di tabs
2. `buku-pribadi` → tab "Dompet" dalam `pribadi-keluarga-dashboard.tsx`
3. `buku-keluarga` → tab "Dompet" dalam `pribadi-keluarga-dashboard.tsx`
4. `buku-usaha/[cabang]/dompet/page.tsx` — halaman dedicated

**Analisis:** Keempat lokasi mengimplementasikan wallet CRUD dengan field yang sama:
- Nama dompet, tipe (KasTunai/Bank/EWallet), saldo
- Field bank: nomor rekening, atas nama, nama bank
- Edit, delete, topup/tarik

**Rekomendasi:** Ekstrak `WalletManager` component (mirip dengan pola `pribadi-keluarga-dashboard.tsx` yang sudah menggunakan komponen bersama). Setiap halaman cukup mengintegrasikan komponen ini dengan prop `unitId` dan `bookOrBranchId`.

---

#### M3 — Duplikasi Manajemen Piutang di 3 Lokasi

**Lokasi:**
1. `buku-global/page.tsx` → `GlobalPiutangTab`
2. `buku-pribadi` + `buku-keluarga` → tab "Hutang" dalam `pribadi-keluarga-dashboard.tsx`
3. `buku-usaha/[cabang]/transaksi/page.tsx` — cicilan piutang inline

**Rekomendasi:** Ekstrak `PiutangManager` component yang bisa digunakan ulang dengan parameter `unitId`. Konsolidasi logic cicilan dan status piutang.

---

#### M4 — ~15 File dengan `import React` Tidak Perlu

**Pola umum:**
```tsx
import React, { useState, useMemo } from "react";
// hanya menggunakan useState dan useMemo, TIDAK pernah menggunakan React.*
```

Next.js 14 + React 18 menggunakan automatic JSX transform, sehingga `import React` hanya diperlukan jika:
- Menggunakan `React.` sebagai value (`React.ReactNode`, `React.Component`)
- Class component (`React.Component<Props>`)

**File yang bisa diubah:**
| File | Import Saat Ini | Perbaikan |
|------|----------------|-----------|
| `skeleton.tsx` | `import React from "react"` | Hapus `React` |
| `bottom-nav.tsx` | `import React from 'react'` | Hapus `React` |
| `global-audit-tab.tsx` | `import React from "react"` | Hapus `React` |
| `global-pelanggan-tab.tsx` | `import React from "react"` | Hapus `React` |
| `global-piutang-tab.tsx` | `import React from "react"` | Hapus `React` |
| `global-kpi-cards.tsx` | `import React from "react"` | Hapus `React` |
| `pos-order-history.tsx` | `import React from "react"` | Hapus `React` |
| `barcode-scanner.tsx` | `import React, { useEffect, ... }` | Hapus `React` |
| ~7 app pages | `import React, { useState, ... }` | Hapus `React` |

**Rekomendasi:** Hapus `React` dari import statement di ~15 file. Tidak mengubah perilaku, hanya mengurangi noise dan potensi warning.

---

### LOW PRIORITY

---

#### L1 — 1-Consumer Lib Files (Bisa Di-inline)

| File | Baris | Satu-satunya Konsumen |
|------|-------|----------------------|
| `lib/backup.ts` | 146 | `buku-global/page.tsx` |
| `lib/export-utils.ts` | 165 | `buku-global/page.tsx` |
| `lib/notification.ts` | 29 | `notification-checker.tsx` |

**Rekomendasi:**
- `notification.ts` (29 baris) — kecil, bisa di-inline ke `notification-checker.tsx`
- `backup.ts` (146 baris) + `export-utils.ts` (165 baris) — bisa digabung menjadi `global-utils.ts` atau tetap dipisah karena masing-masing punya tanggung jawab berbeda

---

#### L2 — Duplikasi Edit Profile

**Lokasi:**
1. `src/app/(dashboard)/profile/page.tsx` — halaman dedicated
2. `src/components/business/global-profil-tab.tsx` — tab di buku-global

**Analisis:** Keduanya memiliki form edit profil (nama, alamat, dll). Halaman `/profile` juga memiliki foto profil, ganti PIN, dan toggle tema, yang tidak ada di `GlobalProfilTab`.

**Rekomendasi:** Jika dianggap perlu, ekstrak `ProfileForm` component yang digunakan oleh kedua lokasi. Jika tidak masalah, biarkan saja (minor).

---

#### L3 — Unused Import: `AnimatePresence` di `kalkulator-harga.tsx`

**Lokasi:** `src/components/business/kalkulator-harga.tsx`, baris 2
```tsx
import { motion, AnimatePresence } from "framer-motion";
//       ^^^^^^^^^^^^^^^^
// AnimatePresence tidak pernah digunakan di file ini
```

**Rekomendasi:** Hapus `AnimatePresence` dari import.

---

#### L4 — File Mendekati Ambang 500 Baris

| File | Baris | Catatan |
|------|-------|---------|
| `kasir/page.tsx` | 465 | Baru di-refactor, masih ada ruang untuk ekstraksi lebih lanjut |
| `pribadi-keluarga-dashboard.tsx` | 431 | 6 tabs, banyak state & handler inline |
| `kalkulator-harga.tsx` | 427 | 6 kalkulator berbeda dalam 1 file (meteran, HP, service, menu, konveksi, retail) |

**Rekomendasi (kalkulator-harga.tsx):** Pisahkan setiap jenis kalkulator menjadi komponen sendiri. Saat ini `kalkulator-harga.tsx` memiliki 6 kalkulator:
- Kalkulator Meteran (baris ~95)
- Kalkulator HP (baris ~160)
- Kalkulator Service HP (baris ~227)
- Kalkulator Menu Makanan (baris ~300)
- Kalkulator Konveksi (baris ~375)
- Kalkulator Retail (baris ~375, bagian dari konveksi)

Masing-masing bisa menjadi file terpisah di `components/business/kalkulator/`.

---

## 4. Kesimpulan

### Dampak Kode Mati (Dead Code)

3 file mati dengan total **532 baris kode** yang tidak pernah dieksekusi. Prioritas tertinggi untuk dibersihkan.

### Dampak File Terlalu Besar

3 halaman + 1 library file berukuran > 600 baris. File besar ini sulit dipelihara, sulit di-test, dan rawan konflik git. Ekstraksi komponen akan sangat membantu maintainability jangka panjang.

### Dampak Dependency Tidak Digunakan

7 dependency tidak terpakai. Membersihkannya akan mengurangi ukuran `node_modules`, mempercepat install, dan mempercepat build.

### Dampak Duplikasi Fungsional

Pola duplikasi wallet dan piutang bisa dikonsolidasi dengan pola yang sama seperti `pribadi-keluarga-dashboard` (shared component dengan prop `unitId`).

### Estimasi Usaha Refactor

| Prioritas | Item | Estimasi Usaha |
|-----------|------|---------------|
| HIGH | 3 file dead code — hapus | 5 menit |
| HIGH | 7 dependency — hapus dari package.json | 5 menit |
| HIGH | 4 file > 600 baris — ekstrak komponen | 4-8 jam |
| MEDIUM | Consolidate `useLiveQuery` | 30 menit |
| MEDIUM | Hapus `import React` ~15 file | 15 menit |
| MEDIUM | Duplikasi wallet/piutang | 2-4 jam |
| LOW | Inline 1-consumer lib files | 30 menit |
| LOW | Pisahkan `kalkulator-harga.tsx` | 1-2 jam |

**Total estimasi refactor:** 8-16 jam (1-2 hari kerja)

---

*Laporan ini dihasilkan oleh analisis otomatis. Tidak ada kode yang diubah.*
