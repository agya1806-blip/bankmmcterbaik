# Project Structure — MMCBANK

## Overview

MMCBANK adalah aplikasi PWA (Progressive Web App) manajemen keuangan multi-cabang berbasis client-side. Seluruh data disimpan di IndexedDB melalui Dexie.js. Tidak ada backend server — semua logika berjalan di browser.

**Stack:** Next.js 14 App Router, TypeScript 5.7, Tailwind CSS 3.4, Dexie.js 4, Zustand 5, Framer Motion 12, Recharts, jsPDF.

---

## Folder Tree

```
mmcbank/
├── public/                          # Static assets (PWA manifest, icons)
├── src/                             # Source code
│   ├── __tests__/                   # Jest test suites (5 files)
│   ├── app/                         # Next.js App Router pages & layouts
│   │   ├── layout.tsx               # Root layout (font, metadata, Toaster)
│   │   ├── page.tsx                 # Landing page (redirect to login/buku-usaha)
│   │   ├── globals.css              # Global Tailwind styles
│   │   ├── api/webhook/route.ts     # Payment webhook simulator endpoint
│   │   ├── (auth)/                  # Auth route group
│   │   │   ├── layout.tsx           # Auth layout (centered card wrapper)
│   │   │   ├── forgot-pin/page.tsx
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   └── (dashboard)/             # Dashboard route group (requires auth)
│   │       ├── layout.tsx           # Dashboard layout (AppShell, BottomNav, guards)
│   │       ├── profile/page.tsx
│   │       ├── buku-global/         # Global multi-branch management
│   │       │   └── page.tsx
│   │       ├── buku-pribadi/        # Personal finance
│   │       │   ├── page.tsx         (thin wrapper → shared component)
│   │       │   └── cashflow/page.tsx
│   │       ├── buku-keluarga/       # Family finance
│   │       │   ├── page.tsx         (thin wrapper → shared component)
│   │       │   └── cashflow/page.tsx
│   │       └── buku-usaha/          # Business finance
│   │           ├── page.tsx         # Landing / hub page
│   │           ├── usaha/page.tsx   # Business unit listing
│   │           └── [cabang]/        # Dynamic branch routes
│   │               ├── layout.tsx   (ErrorBoundary + HydrationSafe)
│   │               ├── page.tsx     # Branch dashboard
│   │               ├── budget/page.tsx
│   │               ├── cashflow/page.tsx
│   │               ├── dompet/page.tsx
│   │               ├── exchange-rate/page.tsx
│   │               ├── inventory/page.tsx
│   │               ├── kasir/page.tsx
│   │               ├── label/page.tsx
│   │               ├── laporan/page.tsx
│   │               ├── pelanggan/page.tsx
│   │               ├── pengaturan/page.tsx
│   │               ├── period/page.tsx
│   │               ├── produksi/page.tsx
│   │               ├── purchase-order/page.tsx
│   │               ├── recurring/page.tsx
│   │               ├── sedekah/page.tsx
│   │               ├── supplier/page.tsx
│   │               ├── transaksi/page.tsx
│   │               ├── transfer/page.tsx
│   │               └── users/page.tsx
│   ├── components/                  # Reusable React components
│   │   ├── error-boundary.tsx
│   │   ├── hydration-safe.tsx
│   │   ├── invoice-a4.tsx
│   │   ├── pin-lock.tsx             # UNUSED — dead code
│   │   ├── skeleton.tsx             (SkeletonCard, SkeletonLine, SkeletonCircle)
│   │   ├── business/               # Business-domain components
│   │   │   ├── barcode-scanner.tsx
│   │   │   ├── global-audit-tab.tsx
│   │   │   ├── global-dompet-tab.tsx
│   │   │   ├── global-kpi-cards.tsx
│   │   │   ├── global-pelanggan-tab.tsx
│   │   │   ├── global-piutang-tab.tsx
│   │   │   ├── global-profil-tab.tsx
│   │   │   ├── global-settings-tab.tsx
│   │   │   ├── kalkulator-harga.tsx
│   │   │   ├── pos-cart-panel.tsx
│   │   │   ├── pos-manual-form.tsx
│   │   │   ├── pos-order-history.tsx
│   │   │   ├── pos-product-grid.tsx
│   │   │   ├── pribadi-keluarga-cashflow.tsx
│   │   │   └── pribadi-keluarga-dashboard.tsx
│   │   └── layout/                 # Application layout components
│   │       ├── app-shell.tsx
│   │       ├── bottom-nav.tsx
│   │       ├── inactivity-wrapper.tsx
│   │       ├── notification-checker.tsx
│   │       ├── recurring-scheduler.tsx
│   │       └── role-guard.tsx
│   ├── engine/                     # Business logic / transaction pipeline
│   │   ├── transaction-pipeline-v4.ts  # POS checkout pipeline
│   │   ├── cancel-transaction.ts       # Cancel/return transaction
│   │   └── double-entry.ts            # Inter-branch transfer
│   ├── hooks/                      # Custom React hooks
│   │   ├── useLiveQuery.ts          # Polling-based live query (Dexie alternative)
│   │   └── useThermalPrinter.ts     # UNUSED — dead code
│   ├── lib/                        # Utility libraries & DB schema
│   │   ├── audit-logger.ts         # Audit trail writer
│   │   ├── backup.ts               # Backup/restore IndexedDB
│   │   ├── crypto.ts               # PIN hashing & verification
│   │   ├── currency.ts             # Formatting & exchange rate
│   │   ├── db-helpers.ts           # UNUSED — dead code
│   │   ├── db-v4.ts                # Core: 24-table Dexie schema + types + constants
│   │   ├── export-utils.ts         # Excel/CSV export
│   │   ├── notification.ts         # Browser notification helpers
│   │   └── toast.ts               # Toast notification wrapper (react-hot-toast)
│   └── store/                      # Zustand global state stores
│       ├── useSessionStore.ts      # Session state (user, branch, PIN, activity)
│       └── useThemeStore.ts        # Theme toggle (light/dark)
├── jest.config.ts
├── jest.setup.ts
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json
```

**Total file sumber:** 92  
**Total route:** 34  

---

## Fungsi Setiap Folder Utama

| Folder | Fungsi |
|--------|--------|
| `src/app/` | Next.js App Router — semua halaman dan API route. Menggunakan route groups `(auth)` dan `(dashboard)` untuk layout berbeda. |
| `src/app/(auth)/` | Halaman auth (login, register, forgot-pin) dengan layout terpusat (centered card). Tidak memiliki bottom navigation. |
| `src/app/(dashboard)/` | Halaman dashboard dengan layout yang menyertakan AppShell, BottomNav, InactivityWrapper, NotificationChecker, RecurringScheduler. |
| `src/app/(dashboard)/buku-usaha/[cabang]/` | Route dinamis untuk 7 cabang usaha. Setiap cabang memiliki 20 sub-halaman (transaksi, cashflow, inventory, dll.). |
| `src/components/` | Komponen React reusable. Dipisah menjadi `business/` (domain bisnis), `layout/` (struktur aplikasi), dan shared (root). |
| `src/engine/` | Business logic engine — fungsi-fungsi transaksional yang memanipulasi beberapa tabel Dexie secara atomik. |
| `src/hooks/` | Custom React hooks. Hanya 2 file, 1 di antaranya dead code. |
| `src/lib/` | Utility libraries. Berisi schema database (db-v4.ts), helper fungsi (crypto, currency, toast), dan utility (backup, export, notification). |
| `src/store/` | Zustand stores untuk global state. Session store (user login, branch, kiosk mode) dan Theme store (light/dark). |
| `src/__tests__/` | Jest test suites: pipeline, cancel transaction, accounting formulas, constants validation, schema coverage. |

---

## Dependency Antar Folder

```
                    ┌─────────────────────────────────────────────┐
                    │                  app/                        │
                    │  (halaman routing, layout, API route)        │
                    └──┬──────────┬──────────┬──────────┬──────────┘
                       │          │          │          │
                       ▼          ▼          ▼          ▼
              ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
              │components│ │   lib/   │ │ engine/  │ │ store/   │
              │ (UI)     │ │(db-v4,   │ │(business │ │(Zustand) │
              │          │ │ toast,   │ │  logic)  │ │          │
              │          │ │crypto...)│ │          │ │          │
              └──────────┘ └──────────┘ └──────────┘ └──────────┘
                   │              │            │            │
                   │              ▼            │            │
                   │       ┌──────────┐        │            │
                   └──────►│  hooks/  │◄───────┘            │
                           │(useLive  │                      │
                           │ Query)   │                      │
                           └──────────┘                      │
                                                              │
                   ┌──────────────────────────────────────────┘
                   ▼
          ┌────────────────┐
          │   Dexie.js     │
          │ (IndexedDB)    │
          │ 24 tables v7   │
          └────────────────┘
```

### Aturan Dependency:

1. **`app/`** → boleh import: `components/`, `lib/`, `engine/`, `store/`, `hooks/`
2. **`components/`** → boleh import: `lib/`, `store/`, `hooks/` (tidak pernah import `engine/` langsung)
3. **`engine/`** → boleh import: `lib/` saja (`db-v4.ts`, `audit-logger.ts`)
4. **`lib/`** → hanya import dari lib lain (tidak import dari folder lain)
5. **`hooks/`** → boleh import: `lib/`
6. **`store/`** → tidak import dari folder lain (Zustand murni)

### Pola Circular Dependency:

Tidak ada circular dependency. Dependency bersifat asiklik:
- `lib/db-v4.ts` adalah root dari semua dependency (semua folder bergantung padanya)
- `lib/toast.ts` adalah dependency kedua yang paling banyak digunakan
- `store/useSessionStore.ts` tidak bergantung pada folder lain

### Pola Data Flow:

```
User Action
    │
    ▼
app/page.tsx (event handler)
    │
    ├──► lib/db-v4.ts (read/write Dexie)
    ├──► engine/pipeline.ts (complex transaction)
    ├──► lib/toast.ts (feedback)
    │
    ▼
IndexedDB (Dexie) ——► React re-render via useLiveQuery
```

Semua data flow bersifat client-side. Tidak ada server API (kecuali `/api/webhook` yang sifatnya simulasi).
