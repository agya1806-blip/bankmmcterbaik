# SKEMA APLIKASI — MMCBANK (MUGHIS BANK)

> Aplikasi POS & pembukuan all-in-one untuk UMKM, offline-first, Next.js 14 App Router + Dexie + Zustand.

---

## 1. ARSITEKTUR ROUTE

```
src/app/
├── layout.tsx                       # Root layout (PWA meta, font, {children})
├── globals.css                      # Tailwind + shadcn + custom classes
├── error.tsx                        # Global error boundary
├── loading.tsx                      # Global loading fallback
├── not-found.tsx                    # 404 page
│
├── (auth)/                          # Route group — tanpa dashboard shell
│   ├── login/page.tsx               # /login — PIN login
│   └── register/page.tsx            # /register — buat akun baru
│
├── (dashboard)/                     # Route group — dengan dashboard shell
│   ├── layout.tsx                   # Header + BottomNav + OnboardingGuard + Kiosk mode
│   ├── page.tsx                     # / — Aggregator dashboard (total kekayaan, 5 buku cards, quick actions)
│   ├── asisten-ai/page.tsx          # /asisten-ai — Chat AI analisis keuangan
│   ├── kiosk/page.tsx               # /kiosk — Pilih cabang + PIN → fullscreen POS
│   ├── mutasi-antar-buku/page.tsx   # /mutasi-antar-buku — Double-entry transfer
│   ├── buku-pribadi/                # Keuangan pribadi
│   │   └── page.tsx
│   ├── buku-usaha/                  # Hub utama 7 cabang
│   │   ├── layout.tsx               # Menu hub (pelanggan, dompet, laporan, pengaturan) + 7 branch cards
│   │   ├── page.tsx                 # Root /buku-usaha
│   │   ├── pelanggan/page.tsx       # Manajemen pelanggan + impor kontak
│   │   ├── dompet/page.tsx          # Dompet usaha
│   │   ├── laporan-keuangan/page.tsx
│   │   ├── pengaturan/page.tsx      # Profil, payment, tema, users, backup, storage
│   │   ├── piutang/page.tsx         # Piutang management
│   │   ├── inventory/page.tsx       # Stok inventory
│   │   ├── labels/page.tsx          # Kategori & label
│   │   ├── percetakan/              # Cabang Percetakan
│   │   │   ├── dashboard/page.tsx   # Kanban production board
│   │   │   ├── kasir/page.tsx       # POS kasir
│   │   │   └── pengaturan/page.tsx
│   │   ├── konveksi/
│   │   │   └── dashboard/page.tsx   # Kanban production board
│   │   ├── gadget-laptop/
│   │   │   ├── dashboard/page.tsx
│   │   │   └── kasir/page.tsx
│   │   ├── warkop-kelontong/
│   │   │   ├── dashboard/page.tsx
│   │   │   └── kasir/page.tsx
│   │   ├── pakaian-konveksi/
│   │   │   ├── dashboard/page.tsx
│   │   │   └── kasir/page.tsx
│   │   └── components/              # Shared komponen buku-usaha
│   │
├── api/
│   ├── ai-chat/route.ts             # POST /api/ai-chat — OpenAI / Gemini
│   └── bank/webhook/route.ts        # Webhook bank callback
```

---

## 2. DATABASE — INDEXEDDB (Dexie v4)

**Nama DB:** `mmcbank-v4`
**File:** `src/lib/db-v4.ts`

### 2.1 Entity `bookOrBranchId`

Setiap tabel punya `bookOrBranchId` untuk isolasi data per buku/cabang:

```
"pribadi" | "keluarga" | "usaha"
| "usaha-percetakan" | "usaha-laptop" | "usaha-gadget"
| "usaha-warkop" | "usaha-kelontong"
| "usaha-konveksi" | "usaha-toko-pakaian"
```

### 2.2 Tabel & Indexes

| Table | Key | Indexes |
|-------|-----|---------|
| `users` | id | &nama (unique), role, bookOrBranchId |
| `profiles` | id | bookOrBranchId |
| `wallets` | id | bookOrBranchId, tipe |
| `walletMutations` | id | bookOrBranchId, dariWalletId, keWalletId, createdAt |
| `customers` | id | bookOrBranchId, &[bookOrBranchId+noWA] (composite unique), nama |
| `transactions` | id | bookOrBranchId, customerId, tanggal, status, walletIdTarget, invoiceNumber |
| `piutang` | id | bookOrBranchId, customerId, status, jatuhTempo |
| `piutangInstallments` | id | bookOrBranchId, piutangId, tanggal |
| `inventory` | id | bookOrBranchId, sku, kategori |
| `inventoryMutations` | id | bookOrBranchId, itemId, tipe, createdAt |
| `labels` | id | bookOrBranchId |
| `labelTags` | id | bookOrBranchId, transaksiRef, labelId |
| `quickOrders` | id | bookOrBranchId |
| `sedekahBalances` | id | bookOrBranchId |
| `invoiceCounters` | id | bookOrBranchId, prefix |
| `auditLogs` | id | bookOrBranchId, action, entityType, entityId, createdAt |

### 2.3 Field Definitions per Tabel

**DbUser**
```
id: string, bookOrBranchId, nama, pinHash, role: "admin"|"kasir"|"viewer",
allowedUnits: string[], isActive: boolean, createdAt: string
```

**DbProfile**
```
id, bookOrBranchId, namaUsaha, logoUrl, alamat, noWhatsapp, slogan, subLayanan: string[], updatedAt
```

**DbWallet**
```
id, bookOrBranchId, namaDompet, saldo: number, tipe: "KasTunai"|"Bank"|"EWallet",
catatan, isActive, createdAt
```

**DbTransaction**
```
id, bookOrBranchId, invoiceNumber, customerId?, customerNama, customerWA, tanggal,
items: DbTransactionItem[], totalBruto, dpDibayar, sisaTagihan,
status: "LUNAS"|"DP"|"BATAL", walletIdTarget, catatan, createdAt
```

**DbTransactionItem**
```
id, namaItem, qty, hargaSatuan, subtotal, spesifikasi
```

**DbCustomer**
```
id, bookOrBranchId, nama, noWA, totalTransaksi, totalBelanja, poin, terakhirTransaksi, createdAt
```

**DbPiutang**
```
id, bookOrBranchId, transactionId, customerId, customerNama, customerWA,
totalPiutang, sisaPiutang, jatuhTempo, status: "AKTIF"|"LUNAS"|"DIHAPUS", catatan, createdAt
```

**DbInventoryItem**
```
id, bookOrBranchId, sku, nama, kategori, stok, stokMin, hargaModal, hargaJual, satuan, catatan, createdAt, updatedAt
```

**DbAuditLog**
```
id, bookOrBranchId, action: "CREATE"|"UPDATE"|"DELETE"|"BATAL"|"TRANSFER_KELUAR"|"TRANSFER_MASUK",
entityType: "transaction"|"piutang"|"wallet"|"customer"|"inventory"|"transfer",
entityId, userId, userName, dataBefore: string (JSON), dataAfter: string (JSON),
nominal, alasan, createdAt
```

---

## 3. STATE MANAGEMENT — ZUSTAND STORES

### 3.1 `useSessionStore` (`src/store/useSessionStore.ts`)
```
State: currentUserId, currentUser (DbUser|null), onboardingCompleted,
       kioskTarget (KioskTarget|null), _hydrated, isInitializing
Actions: setSession, clearSession, setOnboardingCompleted, setHydrated, finishInit,
         hasUnitAccess, isLoggedIn, enterKioskMode, exitKioskMode, isKiosk
Persist: localStorage key "mmcbank-session"
```

### 3.2 `useBusinessStore` (`src/store/useBusinessStore.ts`)
```
State: profile, paymentMethods, accentColor, lastKasirUnit,
       personalTransactions, savingsGoals
       + legacy arrays for backward compat: wallets, customers, inventory, etc.
Actions: setProfile*, addPaymentMethod, addPersonalTransaction, dll.
Persist: localStorage key "mmcbank-business-config"
```

### 3.3 `useOnboardingStore` (`src/store/useOnboardingStore.ts`)
```
State: completed
Actions: setCompleted
Persist: localStorage key "mmcbank-onboarding"
```

### 3.4 `useRoleStore` (`src/store/useRoleStore.ts`)
```
State: pinUsers, currentPinUserId
Actions: addPinUser, removePinUser, updatePinUser, loginPin, logoutPin
```

---

## 4. ENGINE — TRANSACTION PIPELINE v4

**File:** `src/engine/transaction-pipeline-v4.ts`

Alur atomik dalam 1 transaksi Dexie (`db.transaction("rw", [...])`):

```
Input PipelineInputV4
├── 0. Cross-branch poin redemption (jika poinDigunakan > 0)
├── 1. Cut inventory stock (jika ada inventoryLinks)
├── 2. Find or create customer (by [bookOrBranchId + noWA])
├── 3. Save transaction (status LUNAS/DP)
├── 4. Update wallet balance (+nominal)
├── 5. Update customer metrics (totalBelanja, poin, terakhirTransaksi)
├── 6. Auto-create piutang (jika sisaTagihan > 0)
└── 7. Write audit log

Output PipelineResultV4 { ok, transactionId, customerId?, piutangId?, poinTerpakai?, error? }
```

---

## 5. CORE LIBRARIES

### `src/lib/db-v4.ts`
- Definisi semua tipe Dexie + class `MmcBankDB` (16 tabel)
- Helper `generateInvoiceNumber()`, `branchPrefix()`

### `src/lib/audit-logger.ts`
- `writeAuditLog(input)` — catat perubahan data ke tabel auditLogs
- `getAuditLogs(branch?, entityType?, entityId?, limit?)` — baca riwayat audit

### `src/lib/backupEngine.ts`
- `exportEncryptedBackup(pin)` — AES-GCM enkripsi semua tabel Dexie + download JSON
- `importEncryptedBackup(blob, pin)` — dekripsi + restore semua data
- Kunci diturunkan via PBKDF2 (100.000 iterasi, SHA-256)

### `src/lib/backup.ts`
- Backup non-enkripsi JSON (legacy, untuk DB lama via `idb`)

### `src/lib/aiContext.ts`
- `buildAiContext()` — rangkum total kekayaan, omzet harian per cabang, piutang aktif
- Output: `AiContextPayload` untuk dikirim ke system prompt AI

### `src/lib/storageStatus.ts`
- `requestPersistentStorage()` — minta persistensi penyimpanan browser
- `getStorageEstimate()` — kapasitas terpakai/total
- `formatBytes()` — format byte ke KB/MB/GB

### `src/lib/export-utils.ts`
- `exportWA()`, `exportPhoto()` (html2canvas → PNG), `exportPDF()` (jspdf), `exportExcel()` (SheetJS)

### `src/lib/sync.ts`
- Generate & apply kode sinkronisasi multi-device

### `src/lib/image-store.ts`
- Simpan gambar (logo, QRIS) ke IndexedDB (IDB), kompresi base64

### `src/lib/haptic.ts` / `use-haptic.ts`
- Haptic feedback via `navigator.vibrate()`

### `src/lib/validation.ts`
- Validasi PIN, nomor WA, format input

---

## 6. UI COMPONENTS

### Layout Components (`src/components/layout/`)

| Component | File | Fungsi |
|-----------|------|--------|
| Header | `header.tsx` | Sticky top bar, breadcrumb, search, logout |
| BottomNav | `bottom-nav.tsx` | Fixed bottom nav (Dashboard, Usaha, Transfer, AI Chat, Kios) |
| Sidebar | `sidebar.tsx` | Sidebar navigasi (legacy desktop) |
| AppShell | `app-shell.tsx` | Legacy shell wrapper (tidak aktif di root layout) |
| ThemeStore | `theme-store.ts` | Zustand store tema light/dark |

### Guard Components (`src/components/guards/`)
- Auth guard, route protection components

### UI Primitives (`src/components/ui/`)
`badge`, `button`, `card`, `dialog`, `dropdown-menu`, `input`, `label`, `select`, `skeleton`, `switch`, `tabs`, `tooltip`

### Business Components

| Component | File | Fungsi |
|-----------|------|--------|
| OnboardingGuard | `onboarding-guard.tsx` | Cek onboarding selesai, jika tidak → wizard |
| OnboardingWizard | `onboarding-wizard.tsx` | 3-step wizard (profil → wallet → payment) |
| QRISDisplay | `qris-display.tsx` | Tampilkan QRIS di monitor pelanggan |
| LabelManager | `label-manager.tsx` | Kelola label/kategori transaksi |
| LabelPicker | `label-picker.tsx` | Picker label untuk form |
| QuickOrder | `quick-order.tsx` | Tombol cepat pesanan sering |
| ImgFromIdb | `img-from-idb.tsx` | Gambar dari IndexedDB dengan fallback |
| PWA | `pwa.tsx` | PWA install prompt |
| Reminder | `reminder.tsx` | Notifikasi pengingat |

---

## 7. BOOK / BRANCH STRUCTURE

### Buku Pribadi (`/buku-pribadi`)
- Keuangan pribadi, tabungan, target

### Buku Keluarga
- Keuangan rumah tangga

### Buku Usaha (`/buku-usaha`) — 7 Cabang:

| Cabang | Slug | Warna Aksen |
|--------|------|-------------|
| Percetakan | `usaha-percetakan` | Violet |
| Laptop / PC | `usaha-laptop` | Cyan |
| Gadget | `usaha-gadget` | Sky |
| Warkop | `usaha-warkop` | Emerald |
| Kelontong | `usaha-kelontong` | Amber |
| Konveksi | `usaha-konveksi` | Rose |
| Toko Pakaian | `usaha-toko-pakaian` | Pink |

Setiap cabang memiliki:
- **Dashboard** — KPI, kanban production board
- **Kasir** — POS kasir lengkap dengan cart, customer, payment

### Buku Sedekah
- Zakat, infak, sedekah

---

## 8. AUTH & SECURITY

```
Register → hash PIN (SHA-256) → simpan di db.users → setSession → redirect /
Login → cari user by pinHash → setSession → redirect /
Kiosk → pilih cabang → input PIN staf/admin → enterKioskMode → redirect ke POS kasir fullscreen
       → Exit: PIN override "123456" (admin)
```

- Role: `admin` (full access), `kasir` (terbatas ke unit tertentu), `viewer` (read-only)
- Session: Zustand persist ke localStorage key `mmcbank-session`
- Inisialisasi: `isInitializing: true` sampai persist hydration selesai → cegah flicker

---

## 9. DEPENDENCIES UTAMA

| Package | Versi | Fungsi |
|---------|-------|--------|
| next | 14.2.35 | Framework React (App Router) |
| dexie | 4.4.4 | IndexedDB wrapper (16 tables) |
| zustand | 5.0.14 | State management (persist middleware) |
| lucide-react | 1.24 | Icons |
| tailwindcss | 3.4 | CSS utility framework |
| recharts | 3.9 | Grafik dashboard |
| xlsx | 0.18 | Export Excel |
| jspdf | 4.2 | Export PDF |
| html2canvas | 1.4 | Export foto nota |
| html2pdf.js | 0.14 | Export PDF alternatif |
| date-fns | 4.4 | Manipulasi tanggal |
| react-hot-toast | 2.6 | Notifikasi toast |
| qrcode | 1.5 | Generate QR code |
| jsqr | 1.4 | Scan QR code |
| framer-motion | 12.42 | Animasi |
| shadcn | 4.13 | UI primitives |

---

## 10. DEPLOYMENT

- **Vercel** — auto-deploy dari GitHub push
- **URL**: `https://mmcbank.vercel.app`
- **Config**: `vercel.json` (buildCommand: next build, framework: nextjs)
- **PWA**: manifest.json, service worker (sw.js), offline-capable

---

## 11. ALUR DATA END-TO-END (POS Transaction)

```
User input di Kasir → hitung totalBruto, dpDibayar
  → executeTransactionPipelineV4({
      bookOrBranchId, invoiceNumber, items, totalBruto, dpDibayar,
      walletIdTarget, customerNama, customerWA, inventoryLinks, userId
    })
  → db.transaction("rw", [wallets, inventory, customers, transactions, piutang, auditLogs]) {
      1. Potong stok (inventory)
      2. FindOrCreate customer (customers)
      3. Simpan transaksi (transactions)
      4. Update saldo wallet (wallets)
      5. Update metrics customer (totalBelanja, poin)
      6. Auto-buat piutang jika sisa > 0
      7. Catat audit log
    }
  → Result: { ok, transactionId, customerId, piutangId }
  → Cetak nota (WA / PDF / Foto / Excel)
```

---

## 12. KEAMANAN DATA

- **PIN** — di-hash SHA-256 (Web Crypto API), tidak pernah disimpan plaintext
- **Backup** — AES-GCM 256-bit + PBKDF2 (100k iterasi)
- **Audit Log** — append-only, mencatat semua CREATE/UPDATE/DELETE/BATAL + data before/after
- **Penyimpanan** — localStorage hanya untuk config ringan, IndexedDB untuk data operasional
- **Permanen** — `navigator.storage.persist()` cegah iOS hapus data saat memori penuh
