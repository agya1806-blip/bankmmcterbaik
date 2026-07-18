# Component Map — MMCBANK

## Kategori Komponen

| Kategori | Deskripsi |
|----------|-----------|
| **Layout** | Komponen struktur halaman: shell, navigation, wrapper |
| **Business** | Komponen domain bisnis: POS, global management, personal finance |
| **Shared** | Komponen umum yang digunakan banyak halaman |
| **Utility** | Komponen kecil dengan fungsi spesifik |

---

## Layout Components

### `AppShell`
| Atribut | Nilai |
|---------|-------|
| **File** | `src/components/layout/app-shell.tsx` |
| **Tipe Ekspor** | `default` |
| **Fungsi** | Root layout wrapper. Menerapkan theme class (`data-theme`), merender `BottomNav` pada non-auth routes, animasi transisi halaman via `AnimatePresence`. |
| **Props** | `children: React.ReactNode` |
| **State** | — (membaca `useSessionStore`, `useThemeStore`) |
| **Digunakan oleh** | `(dashboard)/layout.tsx` |

### `BottomNav`
| Atribut | Nilai |
|---------|-------|
| **File** | `src/components/layout/bottom-nav.tsx` |
| **Tipe Ekspor** | `default` |
| **Fungsi** | Fixed bottom navigation bar (glass pill style). 5 link: Home, Bisnis, Pribadi, Profil, Lainnya. Active state berdasarkan pathname. |
| **Props** | — |
| **Digunakan oleh** | `AppShell` (internal) |

### `InactivityWrapper`
| Atribut | Nilai |
|---------|-------|
| **File** | `src/components/layout/inactivity-wrapper.tsx` |
| **Tipe Ekspor** | `named` (`export function`) |
| **Fungsi** | Monitor activity mouse/keyboard/touch. Auto-logout setelah 15 menit inactivity dengan redirect ke `/login`. |
| **Props** | `children: React.ReactNode` |
| **Digunakan oleh** | `(dashboard)/layout.tsx` |

### `RoleGuard`
| Atribut | Nilai |
|---------|-------|
| **File** | `src/components/layout/role-guard.tsx` |
| **Tipe Ekspor** | `named` |
| **Fungsi** | Access control. Cek role user terhadap `requiredRole`. Hierarki: admin(3) > kasir(2) > viewer(1). Menampilkan fallback "403" jika tidak authorized. |
| **Props** | `requiredRole: "admin" \| "kasir" \| "viewer"`, `children: React.ReactNode` |
| **Digunakan oleh** | `dompet/page.tsx` (kasir), `pengaturan/page.tsx` (admin), `sedekah/page.tsx` (admin), `users/page.tsx` (admin), `profile/page.tsx` |

### `RecurringScheduler`
| Atribut | Nilai |
|---------|-------|
| **File** | `src/components/layout/recurring-scheduler.tsx` |
| **Tipe Ekspor** | `default` |
| **Fungsi** | Process recurring templates. Mengecek template aktif saat mount, membuat cashflow record berdasarkan jadwal (daily/weekly/monthly/yearly). |
| **Props** | — |
| **Digunakan oleh** | `(dashboard)/layout.tsx` |

### `NotificationChecker`
| Atribut | Nilai |
|---------|-------|
| **File** | `src/components/layout/notification-checker.tsx` |
| **Tipe Ekspor** | `default` |
| **Fungsi** | Cek piutang jatuh tempo (3 hari) dan stok menipis, trigger browser notification via Web Notification API. |
| **Props** | — |
| **Digunakan oleh** | `(dashboard)/layout.tsx` |

---

## Business Components — POS (Point of Sale)

### `PosProductGrid`
| Atribut | Nilai |
|---------|-------|
| **File** | `src/components/business/pos-product-grid.tsx` |
| **Tipe Ekspor** | `default` |
| **Fungsi** | Grid produk inventory dengan search, barcode scan button, qty increment/decrement, kategori filter. Floating "View Cart" button. |
| **Props** | `products`, `cartItems`, `searchQuery`, `selectedKategori`, kategori list, callbacks untuk add/update/remove |
| **Digunakan oleh** | `kasir/page.tsx` |

### `PosManualForm`
| Atribut | Nilai |
|---------|-------|
| **File** | `src/components/business/pos-manual-form.tsx` |
| **Tipe Ekspor** | `default` |
| **Fungsi** | Form entry manual untuk POS. Tambah item kustom (nama, qty, harga, modal) dengan inline editing, delete, price calculator button. |
| **Props** | `items`, `onAdd`, `onUpdate`, `onRemove`, `onOpenCalculator`, `formatRp` |
| **Digunakan oleh** | `kasir/page.tsx` |

### `PosCartPanel`
| Atribut | Nilai |
|---------|-------|
| **File** | `src/components/business/pos-cart-panel.tsx` |
| **Tipe Ekspor** | `default` |
| **Fungsi** | Panel keranjang POS. Menampilkan items, subtotal, diskon, PPN, total. Customer selection, poin loyalty, metode bayar (Cash/Deposit/Transfer/QRIS), wallet selection, sedekah. |
| **Props** | `cartItems`, `grandTotal`, `dpDibayar`, `poinDigunakan`, `sedekahNominal`, `wallets`, customers, dll. |
| **Digunakan oleh** | `kasir/page.tsx` |

### `PosOrderHistory`
| Atribut | Nilai |
|---------|-------|
| **File** | `src/components/business/pos-order-history.tsx` |
| **Tipe Ekspor** | `default` |
| **Fungsi** | Daftar transaksi POS sebelumnya. Menampilkan invoice number, date, total, status badge, tombol View Invoice, Edit, Delete. |
| **Props** | `transactions`, `getProdStatus`, `formatRp`, `formatDate`, callbacks untuk view/edit/delete |
| **Digunakan oleh** | `kasir/page.tsx` |

---

## Business Components — Global Dashboard

### `GlobalKpiCards`
| Atribut | Nilai |
|---------|-------|
| **File** | `src/components/business/global-kpi-cards.tsx` |
| **Tipe Ekspor** | `default` |
| **Fungsi** | KPI dashboard cards: pendapatan, laba, cashflow, piutang, stok alert. Termasuk AreaChart (7-day revenue trend) dan BarChart (per-branch revenue). |
| **Props** | `dashData` (totalPendapatan, labaBersih, cashflowMasuk, piutangAktifCount, stokMenipisCount, dll.) |
| **Digunakan oleh** | `buku-global/page.tsx` |

### `GlobalPiutangTab`
| Atribut | Nilai |
|---------|-------|
| **File** | `src/components/business/global-piutang-tab.tsx` |
| **Tipe Ekspor** | `default` |
| **Fungsi** | Tab manajemen piutang global. Search, branch filter. Menampilkan piutang dengan due date, amount, remaining balance. Expandable untuk lihat detail. Tombol bayar/hapus. |
| **Props** | `piutangSearch`, `piutangBranchFilter`, callbacks dan data |
| **Digunakan oleh** | `buku-global/page.tsx` |

### `GlobalPelangganTab`
| Atribut | Nilai |
|---------|-------|
| **File** | `src/components/business/global-pelanggan-tab.tsx` |
| **Tipe Ekspor** | `default` |
| **Fungsi** | Tab daftar pelanggan global. Search, branch filter. Menampilkan nama, no WA, total transaksi, total belanja. Edit/delete actions. |
| **Props** | `pelangganSearch`, `pelangganBranch`, `filteredPelanggan`, callbacks |
| **Digunakan oleh** | `buku-global/page.tsx` |

### `GlobalAuditTab`
| Atribut | Nilai |
|---------|-------|
| **File** | `src/components/business/global-audit-tab.tsx` |
| **Tipe Ekspor** | `default` |
| **Fungsi** | Tab audit log. Search, branch filter, action type filter. Table menampilkan user, action, entity details, nominal, timestamp. |
| **Props** | `auditSearch`, `auditBranch`, `auditType`, callbacks dan data |
| **Digunakan oleh** | `buku-global/page.tsx` |

### `GlobalSettingsTab`
| Atribut | Nilai |
|---------|-------|
| **File** | `src/components/business/global-settings-tab.tsx` |
| **Tipe Ekspor** | `default` |
| **Fungsi** | Tab settings global (391 lines). Theme toggle, backup/restore IndexedDB, branch transfers, inventory management, account management, logout. |
| **Props** | `theme`, callbacks untuk toggle theme, backup, restore, transfer, dll. |
| **Digunakan oleh** | `buku-global/page.tsx` |

### `GlobalDompetTab`
| Atribut | Nilai |
|---------|-------|
| **File** | `src/components/business/global-dompet-tab.tsx` |
| **Tipe Ekspor** | `default` |
| **Fungsi** | Tab manajemen dompet global. CRUD wallets per branch. Type icons (KasTunai/Bank/EWallet). Balance editing. List wallets grouped by branch. |
| **Props** | `allWallets`, field state dan callbacks untuk CRUD |
| **Digunakan oleh** | `buku-global/page.tsx` |

### `GlobalProfilTab`
| Atribut | Nilai |
|---------|-------|
| **File** | `src/components/business/global-profil-tab.tsx` |
| **Tipe Ekspor** | `default` |
| **Fungsi** | Tab profil. Edit nama, no HP, alamat, save. Menampilkan daftar wallet user dengan balance. |
| **Props** | `currentUser`, `allWallets`, field state dan callbacks |
| **Digunakan oleh** | `buku-global/page.tsx` |

---

## Business Components — Personal / Keluarga

### `PribadiKeluargaDashboard`
| Atribut | Nilai |
|---------|-------|
| **File** | `src/components/business/pribadi-keluarga-dashboard.tsx` |
| **Tipe Ekspor** | `default` |
| **Fungsi** | Dashboard lengkap untuk Pribadi & Keluarga (462 lines). 6 tab: Ringkasan, Catat (→ cashflow), Hutang, Laporan, Riwayat, Dompet. Wallet CRUD, charts (recharts), recent transactions. |
| **Props** | `unitId: "pribadi" \| "keluarga"`, `label: string`, `backHref: string` |
| **Digunakan oleh** | `buku-pribadi/page.tsx`, `buku-keluarga/page.tsx` |

### `PribadiKeluargaCashflow`
| Atribut | Nilai |
|---------|-------|
| **File** | `src/components/business/pribadi-keluarga-cashflow.tsx` |
| **Tipe Ekspor** | `default` |
| **Fungsi** | Cashflow manager untuk Pribadi & Keluarga. CRUD, filter income/expense, monthly grouping, wallet balance display. Kategori berbeda antara pribadi dan keluarga. |
| **Props** | `unitId: "pribadi" \| "keluarga"`, `label: string` |
| **Digunakan oleh** | `buku-pribadi/cashflow/page.tsx`, `buku-keluarga/cashflow/page.tsx` |

---

## Business Components — Utility

### `BarcodeScanner`
| Atribut | Nilai |
|---------|-------|
| **File** | `src/components/business/barcode-scanner.tsx` |
| **Tipe Ekspor** | `default` |
| **Fungsi** | Barcode scanner. Menggunakan camera (`getUserMedia`) untuk scan barcode. Fallback input manual. Tombol toggle camera/manual. |
| **Props** | `onScan: (barcode: string) => void`, `onClose: () => void` |
| **Digunakan oleh** | `kasir/page.tsx`, `inventory/page.tsx`, `transaksi/page.tsx` |

### `KalkulatorHarga`
| Atribut | Nilai |
|---------|-------|
| **File** | `src/components/business/kalkulator-harga.tsx` |
| **Tipe Ekspor** | `default` |
| **Fungsi** | Kalkulator harga dengan 6 strategi pricing: sederhana (margin%), meteran, HP, service HP, menu makanan, konveksi/retail. 427 lines. |
| **Props** | `onResult: (hargaJual: number) => void`, `onClose: () => void`, `hargaModal?: number` |
| **Digunakan oleh** | `kasir/page.tsx`, `inventory/page.tsx`, `transaksi/page.tsx` |

---

## Shared Components

### `ErrorBoundary`
| Atribut | Nilai |
|---------|-------|
| **File** | `src/components/error-boundary.tsx` |
| **Tipe Ekspor** | `default` (class component) |
| **Fungsi** | React error boundary. Catch runtime errors, tampilkan fallback UI dengan alert icon dan tombol retry. |
| **Props** | `children: React.ReactNode`, `fallback?: React.ReactNode` |
| **Digunakan oleh** | `buku-usaha/[cabang]/layout.tsx` |

### `HydrationSafe`
| Atribut | Nilai |
|---------|-------|
| **File** | `src/components/hydration-safe.tsx` |
| **Tipe Ekspor** | `default` |
| **Fungsi** | Mencegah hydration mismatch. Hanya render children setelah component mount di client. Menampilkan spinner saat waiting. |
| **Props** | `children: React.ReactNode` |
| **Digunakan oleh** | `buku-usaha/[cabang]/layout.tsx` |

### `InvoiceA4`
| Atribut | Nilai |
|---------|-------|
| **File** | `src/components/invoice-a4.tsx` |
| **Tipe Ekspor** | `default` |
| **Fungsi** | Invoice A4 siap print. Menampilkan header (logo, nama usaha), QR code (invoice number), table items, totals, pembayaran, signature. |
| **Props** | `transaction: DbTransaction`, `wallet: DbWallet \| undefined`, `profile: DbProfile \| undefined`, `cabangSlug: string`, `onClose: () => void` |
| **Digunakan oleh** | `kasir/page.tsx`, `transaksi/page.tsx` |

### `SkeletonCard`, `SkeletonLine`, `SkeletonCircle`
| Atribut | Nilai |
|---------|-------|
| **File** | `src/components/skeleton.tsx` |
| **Tipe Ekspor** | `named` (3 exports) |
| **Fungsi** | Loading placeholder components dengan animasi pulse. `SkeletonCard(count?)`, `SkeletonLine`, `SkeletonCircle`. |
| **Props** | `count?: number` (SkeletonCard) |
| **Digunakan oleh** | 10+ halaman: kasir, inventory, dompet, pelanggan, pengaturan, sedekah, transaksi, users, cabang dashboard, usaha listing |

---

## Unused Components (Dead Code)

### `PinLock`
| Atribut | Nilai |
|---------|-------|
| **File** | `src/components/pin-lock.tsx` |
| **Tipe Ekspor** | `default` |
| **Fungsi** | PIN entry screen dengan numeric keypad, animasi shake, biometric fallback. **Tidak digunakan oleh halaman manapun.** |
| **Status** | **DEAD CODE** (129 lines, 0 imports) |

---

## Dependency Graph Antar Komponen

```
(Page Layout)
    │
    ├── ErrorBoundary ───> (catch errors)
    ├── HydrationSafe ───> (prevent mismatch)
    ├── AppShell
    │      ├── BottomNav
    │      └── AnimatePresence
    ├── InactivityWrapper
    ├── NotificationChecker ───> lib/notification
    ├── RecurringScheduler ───> db
    └── RoleGuard ───> useSessionStore
    
(Page Content)
    │
    ├── SkeletonCard ───> (loading state)
    ├── InvoiceA4 ───> db types, qrcode
    ├── KalkulatorHarga
    ├── BarcodeScanner
    │
    ├── [POS Components]
    │   ├── PosProductGrid
    │   ├── PosManualForm
    │   ├── PosCartPanel
    │   └── PosOrderHistory
    │
    ├── [Global Components]
    │   ├── GlobalKpiCards ───> recharts
    │   ├── GlobalPiutangTab
    │   ├── GlobalPelangganTab
    │   ├── GlobalAuditTab
    │   ├── GlobalSettingsTab
    │   ├── GlobalDompetTab
    │   └── GlobalProfilTab
    │
    └── [Shared Business]
        ├── PribadiKeluargaDashboard ───> recharts, date-fns
        └── PribadiKeluargaCashflow
```

Semua komponen mengimpor dari `@/lib/db-v4` (types) dan `@/lib/toast` (notifikasi). Tidak ada komponen yang mengimpor langsung dari `engine/`.
