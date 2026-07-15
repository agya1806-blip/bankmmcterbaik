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
│   ├── login/page.tsx               # /login — PIN login (blur+150ms anti-flicker)
│   └── register/page.tsx            # /register — buat akun baru (blur+150ms anti-flicker)
│
├── (dashboard)/                     # Route group — dengan dashboard shell
│   ├── layout.tsx                   # Header + BottomNav + OnboardingGuard + Kiosk mode
│   ├── page.tsx                     # / — Dashboard Eksekutif (total kekayaan, omset H/M/B,
│   │                                #      5 transaksi terbesar, piutang aktif, tot pelanggan)
│   ├── asisten-ai/page.tsx          # /asisten-ai — Chat AI analisis keuangan (context real IndexedDB)
│   ├── kiosk/page.tsx               # /kiosk — Pilih cabang + PIN → fullscreen POS
│   ├── mutasi-antar-buku/page.tsx   # /mutasi-antar-buku — Double-entry transfer
│   ├── buku-pribadi/                # Keuangan pribadi
│   │   ├── page.tsx                 # Dashboard pribadi
│   │   ├── transaksi/page.tsx       # Riwayat transaksi pribadi
│   │   ├── dompet/page.tsx          # Manajemen dompet pribadi
│   │   └── laporan/page.tsx         # Laporan per kategori
│   ├── buku-keluarga/               # Keuangan keluarga
│   │   ├── page.tsx                 # Dashboard + form catat transaksi + ringkasan
│   │   ├── transaksi/page.tsx       # Riwayat transaksi keluarga
│   │   ├── dompet/page.tsx          # Manajemen dompet keluarga
│   │   └── laporan/page.tsx         # Laporan per kategori
│   ├── buku-usaha/                  # Hub utama 7 cabang
│   │   ├── layout.tsx               # Menu hub (pelanggan, dompet, laporan, pengaturan) + 7 branch cards
│   │   ├── page.tsx                 # Root /buku-usaha — listing 7 cabang individu
│   │   ├── pelanggan/page.tsx       # Manajemen pelanggan + impor kontak (parse Nama - WA)
│   │   ├── dompet/page.tsx          # Dompet usaha
│   │   ├── laporan-keuangan/page.tsx# Laporan keuangan (PDF, CSV, Excel, WA, Print)
│   │   ├── pengaturan/page.tsx      # Profil, payment, tema, users, backup AEG-GCM, storage health
│   │   ├── piutang/page.tsx         # Piutang management + riwayat cicilan
│   │   ├── inventory/page.tsx       # Stok inventory (add/edit/hapus, mutasi, alert stok menipis)
│   │   ├── labels/page.tsx          # Kategori & label kustom
│   │   │
│   │   ├── percetakan/              # Cabang 1: Percetakan
│   │   │   ├── dashboard/page.tsx   # Kanban production board (3 kolom)
│   │   │   ├── kasir/page.tsx       # POS kasir (meteran calculator, live invoice preview)
│   │   │   └── pengaturan/page.tsx
│   │   ├── laptop/                  # Cabang 2: Laptop/PC (INDIVIDUAL)
│   │   │   ├── dashboard/page.tsx   # KPI dashboard
│   │   │   └── kasir/page.tsx       # POS kasir
│   │   ├── gadget/                  # Cabang 3: Gadget (INDIVIDUAL)
│   │   │   ├── dashboard/page.tsx   # KPI dashboard
│   │   │   └── kasir/page.tsx       # POS kasir
│   │   ├── warkop/                  # Cabang 4: Warkop (INDIVIDUAL)
│   │   │   ├── dashboard/page.tsx   # KPI dashboard
│   │   │   └── kasir/page.tsx       # POS kasir + product search stok + poin loyalitas
│   │   ├── kelontong/               # Cabang 5: Kelontong (INDIVIDUAL)
│   │   │   ├── dashboard/page.tsx   # KPI dashboard
│   │   │   └── kasir/page.tsx       # POS kasir + product search stok + poin loyalitas
│   │   ├── konveksi/                # Cabang 6: Konveksi (INDIVIDUAL)
│   │   │   └── dashboard/page.tsx   # Kanban production board (3 kolom)
│   │   ├── toko-pakaian/            # Cabang 7: Toko Pakaian (INDIVIDUAL)
│   │   │   ├── dashboard/page.tsx   # KPI dashboard
│   │   │   └── kasir/page.tsx       # POS kasir + product search stok + poin loyalitas
│   │   │
│   │   ├── gadget-laptop/           # LEGACY — redirect ke /buku-usaha
│   │   │   ├── dashboard/page.tsx
│   │   │   └── kasir/page.tsx
│   │   ├── warkop-kelontong/        # LEGACY — redirect ke /buku-usaha
│   │   │   ├── dashboard/page.tsx
│   │   │   └── kasir/page.tsx
│   │   ├── pakaian-konveksi/        # LEGACY — redirect ke /buku-usaha
│   │   │   ├── dashboard/page.tsx
│   │   │   └── kasir/page.tsx
│   │   │
│   │   └── components/              # Shared komponen buku-usaha
│   │       ├── PercetakanForm.tsx
│   │       ├── InvoicePercetakanView.tsx
│   │       ├── InvoicePakaianKonveksiView.tsx
│   │       ├── InvoiceGadgetLaptopView.tsx
│   │       └── BillWarkopKelontongView.tsx
│   │
├── api/
│   ├── ai-chat/route.ts             # POST /api/ai-chat — OpenAI GPT-4o-mini + Gemini fallback
│   └── bank/webhook/route.ts        # Webhook bank callback
```

**Total: 48 routes static**

---

## 2. DATABASE — INDEXEDDB (Dexie v4)

**Nama DB:** `mmcbank-v4`
**File:** `src/lib/db-v4.ts`
**17 tabel** (16 operasional + class Dexie)

### 2.1 Entity `bookOrBranchId`

Setiap tabel punya `bookOrBranchId` untuk isolasi data per buku/cabang:

```
"pribadi" | "keluarga" | "usaha"
| "usaha-percetakan" | "usaha-laptop" | "usaha-gadget"
| "usaha-warkop" | "usaha-kelontong"
| "usaha-konveksi" | "usaha-toko-pakaian"
```

### 2.2 Tabel & Indexes

| Table | Key | Indexes | Deskripsi |
|-------|-----|---------|-----------|
| `users` | id | **&nama** (unique), role, bookOrBranchId | Akun pengguna (pinHash SHA-256) |
| `profiles` | id | bookOrBranchId | Profil toko/bisnis |
| `wallets` | id | bookOrBranchId, tipe, **isActive** | Dompet kas |
| `walletMutations` | id | bookOrBranchId, dariWalletId, keWalletId, createdAt | Mutasi transfer antar dompet |
| `customers` | id | bookOrBranchId, **&[bookOrBranchId+noWA]** (composite unique), nama | Data pelanggan + poin loyalitas |
| `transactions` | id | bookOrBranchId, customerId, tanggal, status, walletIdTarget, invoiceNumber | Transaksi POS |
| `piutang` | id | bookOrBranchId, customerId, status, jatuhTempo | Piutang/cicilan |
| `piutangInstallments` | id | bookOrBranchId, piutangId, tanggal | Riwayat cicilan terbayar |
| `inventory` | id | bookOrBranchId, sku, kategori | Stok barang |
| `inventoryMutations` | id | bookOrBranchId, itemId, tipe, createdAt | Mutasi stok (masuk/keluar/penyesuaian) |
| `labels` | id | bookOrBranchId | Label/kategori |
| `labelTags` | id | bookOrBranchId, transaksiRef, labelId | Tag label ke transaksi |
| `quickOrders` | id | bookOrBranchId | Template pesanan cepat |
| `sedekahBalances` | id | bookOrBranchId | Saldo zakat/infak/sedekah |
| `invoiceCounters` | id | bookOrBranchId, prefix | Counter nomor invoice |
| `auditLogs` | id | bookOrBranchId, action, entityType, entityId, createdAt | Log audit append-only |

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

**DbCustomer**
```
id, bookOrBranchId, nama, noWA, totalTransaksi, totalBelanja, poin, terakhirTransaksi, createdAt
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

### 2.4 Void Data Policy

- **100% empty state** — tidak ada seed/mock data
- Semua data murni input manual melalui wizard onboarding atau input pengguna
- IndexedDB diinisialisasi dengan schema kosong, tabel dibuat saat pertama kali diakses

---

## 3. STATE MANAGEMENT — ZUSTAND STORES

### 3.1 `useSessionStore` (`src/store/useSessionStore.ts`)
```
Persist: localStorage key "mmcbank-session"
State:
  currentUserId: string | null
  currentUser: DbUser | null
  onboardingCompleted: boolean
  kioskTarget: KioskTarget | null
  _hydrated: boolean
  isInitializing: boolean       ← ANTI-FLICKER: true sampai persist hydration selesai
Actions:
  setSession(user)              ← Simpan user setelah login/register
  clearSession()                ← Logout, hapus session
  setOnboardingCompleted(v)
  setHydrated()                 ← Dipanggil onRehydrateStorage
  finishInit()                  ← Set isInitializing = false
  hasUnitAccess(unit)           ← Cek role-based access (admin = all)
  isLoggedIn()
  enterKioskMode(target)        ← Kiosk: { unitSlug, kasirPath }
  exitKioskMode()
  isKiosk()
```

### 3.2 `useBusinessStore` (`src/store/useBusinessStore.ts`)
```
Persist: localStorage key "mmcbank-business-config"
State: profile, paymentMethods, accentColor, lastKasirUnit,
       personalTransactions, savingsGoals
       + legacy arrays: wallets, customers, inventory (backward compat)
Actions: setProfile, addPaymentMethod, addPersonalTransaction,
         adjustStok, tambahSaldoWallet, kurangiSaldoWallet,
         addCustomerRecord, recordCustomerTransaction,
         addQuickOrder, deleteQuickOrder, dll.
```

### 3.3 `useOnboardingStore` (`src/store/useOnboardingStore.ts`)
```
Persist: localStorage key "mmcbank-onboarding"
State: completed
Actions: setCompleted
```

### 3.4 `useRoleStore` (`src/store/useRoleStore.ts`)
```
State: pinUsers, currentPinUserId
Actions: addPinUser, removePinUser, loginPin, logoutPin
```

---

## 4. ENGINE — TRANSACTION PIPELINE v4

**File:** `src/engine/transaction-pipeline-v4.ts`

### 4.1 Alur Atomik (dalam 1 `db.transaction("rw", ...)`)

```
Input PipelineInputV4
├── bookOrBranchId, invoiceNumber, tanggal, items: DbTransactionItem[]
├── totalBruto, dpDibayar, walletIdTarget
├── customerNama, customerWA
├── inventoryLinks?: { itemId, qtyDipotong }[]
├── poinDigunakan?: number (cross-branch redemption)
├── jatuhTempo?: string (auto 14 hari jika kosong)
└── userId?, userName?

Proses (dalam satu transaksi Dexie RW):
├── 0. Cross-branch poin redemption
│     → findCustomerCrossBranch(noWA) — cari semua cabang
│     → usePoinCustomer() — kurangi poin dari cabang dengan poin tertinggi
│
├── 1. Cut inventory stock
│     → cutInventoryStock(branch, inventoryLinks)
│     → catat inventoryMutations (stokSebelum, stokSesudah, alasan: "Transaksi POS")
│
├── 2. Find or create customer
│     → findOrCreateCustomer(branch, nama, wa) — by [bookOrBranchId+noWA]
│
├── 3. Save transaction (transactions table)
│     → status = LUNAS (sisa≤0) / DP (sisa>0)
│
├── 4. Update wallet balance (+nominal)
│     → nominal = dpDibayar > 0 ? dpDibayar : totalBruto
│
├── 5. Update customer metrics
│     → totalTransaksi++, totalBelanja, poin (+1% dari totalBruto)
│
├── 6. Auto-create piutang (jika sisaTagihan > 0 && customerId terisi)
│     → createPiutang() dengan jatuhTempo default +14 hari
│
└── 7. Write audit log (jika userId terisi)
      → action: "CREATE", entityType: "transaction"
      → dataAfter: full DbTransaction object

Output PipelineResultV4 { ok, transactionId, customerId?, piutangId?, poinTerpakai?, error? }
```

### 4.2 Functions Diexport

| Function | Deskripsi |
|----------|-----------|
| `executeTransactionPipelineV4(input)` | Jalankan pipeline atomik penuh |
| `cutInventoryStock(branch, links)` | Potong stok + catat mutasi (digunakan juga oleh POS standalone) |
| `updateCustomerMetrics(customerId, nominal, poinBertambah)` | Update totalTransaksi, totalBelanja, poin, terakhirTransaksi |

### 4.3 POS Pages yang Menggunakan Pipeline

| POS Page | Pipeline | Keterangan |
|----------|----------|------------|
| kelontong/kasir | ✅ **v4** | Atomic, inventory cut, customer, poin, audit log |
| warkop/kasir | ✅ **v4** | Atomic, inventory cut, customer, poin, audit log |
| toko-pakaian/kasir | ✅ **v4** | Atomic, inventory cut, customer, poin, audit log |
| percetakan/kasir | ⚠️ Legacy | Masih pakai store lama (non-atomic), perlu refactor |
| gadget/kasir | ⚠️ Legacy | Masih pakai store lama, perlu refactor |
| laptop/kasir | ⚠️ Legacy | Masih pakai store lama, perlu refactor |
| konveksi | N/A | Tidak punya halaman kasir |

---

## 5. CORE LIBRARIES

### `src/lib/db-v4.ts`
- Definisi semua tipe Dexie + class `MmcBankDB` (16 tabel operasional)
- Helper `generateInvoiceNumber()`, `branchPrefix()`
- 10 nilai `bookOrBranchId`: `pribadi`, `keluarga`, `usaha`, 7 cabang

### `src/lib/audit-logger.ts`
- `writeAuditLog(input)` — catat perubahan data ke tabel auditLogs (append-only)
- `getAuditLogs(branch?, entityType?, entityId?, limit?)` — baca riwayat audit

### `src/lib/backupEngine.ts`
- `exportEncryptedBackup(pin)` — AES-GCM 256 enkripsi, key derived via PBKDF2 (100k iterasi, SHA-256)
- `importEncryptedBackup(blob, pin)` — dekripsi + restore semua data
- `downloadBlob(blob, filename)` — trigger download file JSON

### `src/lib/aiContext.ts`
- `buildAiContext()` — rangkum **real-time** data dari IndexedDB:
  - Total kekayaan (aggregasi semua wallet)
  - Per-buku saldo
  - Omzet harian per cabang + jumlah transaksi
  - Piutang aktif (total + count + jatuh tempo terdekat)
- Output: `AiContextPayload { ringkasanKeuangan: string, totalKekayaan, perBuku[], omzetHarian[], piutangAktif[] }`
- Dipanggil setiap user kirim pesan di `/asisten-ai`

### `src/lib/storageStatus.ts`
- `requestPersistentStorage()` — minta persistensi penyimpanan browser (cegah iOS hapus data)
- `getStorageEstimate()` — kapasitas terpakai/total
- `formatBytes(n)` — format angka byte ke KB/MB/GB

### `src/lib/export-utils.ts`
- `exportWA(text)` — share via WhatsApp
- `exportPhoto(el)` — html2canvas → PNG download
- `exportPDF(el, filename)` — jsPDF → PDF
- `exportExcel(data, filename, sheetName)` — SheetJS → XLSX

### `src/lib/sync.ts`
- `generateSyncCode()` — encode config ke base64
- `applySyncCode(code)` — decode + restore ke localStorage

### `src/lib/image-store.ts`
- Simpan gambar logo/QRIS ke IndexedDB via native `indexedDB.open()`
- Fungsi: `saveImage`, `getImage`, `deleteImage`, `getAllKeys`

### `src/lib/haptic.ts`
- `hapticLight()`, `hapticMedium()`, `hapticSuccess()` via `navigator.vibrate()`

### `src/lib/validation.ts`
- `isValidPIN(pin)`, `isValidWA(wa)`, validasi format input

---

## 6. COMPONENTS

### 6.1 Layout Components (`src/components/layout/`)

| Component | File | Fungsi |
|-----------|------|--------|
| Header | `header.tsx` | Sticky top bar + breadcrumb + **global search modal** + logout |
| BottomNav | `bottom-nav.tsx` | Fixed bottom 64px, 7 menu: Dashboard, Pribadi, Keluarga, Usaha, Transfer, AI Chat, Kios |
| AppShell | `app-shell.tsx` | Legacy shell (tidak aktif di root layout — sudah dihapus) |

### 6.2 Guard Components

| Component | File | Fungsi |
|-----------|------|--------|
| OnboardingGuard | `onboarding-guard.tsx` | Cek onboarding selesai, jika belum → wizard |
| OnboardingWizard | `onboarding-wizard.tsx` | 3-step: Profil Toko → Dompet Pertama → Pembayaran |

### 6.3 Business Components

| Component | File | Fungsi |
|-----------|------|--------|
| ProductSearchModal | `product-search-modal.tsx` | Cari produk dari inventory berdasarkan branch, satu klik add ke cart |
| GlobalSearch | `global-search.tsx` | Search modal di header — cari pelanggan, transaksi, produk di **semua** branch (debounce 300ms) |
| QuickOrder | `quick-order.tsx` | Tombol template pesanan cepat per unit bisnis |
| QRISDisplay | `qris-display.tsx` | Tampilkan QRIS di monitor pelanggan |
| LabelManager | `label-manager.tsx` | Kelola label/kategori transaksi |
| LabelPicker | `label-picker.tsx` | Picker label untuk form |
| ImgFromIdb | `img-from-idb.tsx` | Gambar dari IndexedDB dengan fallback |
| PWA | `pwa.tsx` | PWA install prompt |
| Reminder | `reminder.tsx` | Notifikasi pengingat |
| Skeleton | `skeleton.tsx` | 4 varian: `Skeleton`, `CardSkeleton`, `TableRowSkeleton`, `KasirSkeleton` |

### 6.4 UI Primitives (`src/components/ui/`)
`badge`, `button`, `card`, `dialog`, `dropdown-menu`, `input`, `label`, `select`, `skeleton`, `switch`, `tabs`, `tooltip`

---

## 7. HOOKS

| Hook | File | Fungsi |
|------|------|--------|
| useThermalPrinter | `useThermalPrinter.ts` | Printer thermal **Bluetooth** (Web Bluetooth) + **USB** (WebUSB) ESC/POS |
| useHaptic | `use-haptic.ts` | Haptic feedback wrapper |
| useClickSound | `use-click-sound.ts` | Feedback audio klik |

### useThermalPrinter — Fitur Lengkap
- **Bluetooth**: `connect()`, `print(data)`, `disconnect()`, `scanAndPrint(data)`
- **USB**: `connectUSB()`, `printViaUSB(data)`, `disconnectUSB()`
- **Auto-detect**: `printReceipt(data)` — pilih metode sesuai `connectionType`
- **Status**: `connectionType: "bluetooth"|"usb"|null`, `printerStatus: "terhubung"|"tidak terhubung"|"mencoba..."`
- **Receipt Builder**: `buildReceipt(data)` — layout ESC/POS (header, items, total, footer, cut, drawer)

---

## 8. AUTH & SECURITY

### 8.1 Authentication Flow
```
Register → hash PIN (SHA-256 via Web Crypto API)
         → simpan di db.users (isActive: true, role: "admin")
         → setSession → blur() → setTimeout(150ms) → router.replace("/")

Login → cari user by pinHash (SHA-256)
      → setSession
      → blur() → setTimeout(150ms) → router.replace("/")
```

### 8.2 Anti-Flicker Protection
```
Store:
  isInitializing: true  ← default sampai persist hydration selesai
  onRehydrateStorage → state.setHydrated() + state.finishInit()

Layout:
  if (isInitializing) → render <SolidLoader> (bg-slate-950 + bouncing dots)
  if (!isLoggedIn)    → render <SolidLoader>
  else                → render <Header + BottomNav + {children}>

Login/Register blur + 150ms:
  document.activeElement?.blur()
  // ... proses async ...
  setTimeout(() => router.replace("/"), 150)
  // → iOS keyboard dismissal + viewport 100dvh recalc selesai
```

### 8.3 Access Control
- `admin` — full access semua unit
- `kasir` — akses terbatas ke `allowedUnits[]` tertentu, dicek via `hasUnitAccess(unit)`
- `viewer` — read-only
- Kiosk mode exit: hanya dengan PIN admin (override `"123456"`)

### 8.4 Data Security
- **PIN**: SHA-256 (Web Crypto API), tidak pernah plaintext
- **Backup**: AES-GCM 256 + PBKDF2 (100k iterasi), key dari PIN admin
- **Audit Log**: Append-only, semua CREATE terdata dengan `dataAfter` (JSON string)
- **Storage**: localStorage hanya config ringan, IndexedDB untuk data operasional
- **Permanent**: `navigator.storage.persist()` cegah iOS purge

---

## 9. FITUR-FITUR UTAMA

### 9.1 POS Kasir (3 varian)
1. **Simplified** (kelontong, warkop, toko-pakaian) — input manual, support **product search** dari inventory, poin loyalitas otomatis
2. **Complex** (percetakan) — split-screen, meteran calculator, live invoice preview, HPP tracking
3. **Full** (gadget, laptop) — desktop-style POS dengan search, filter, grid

### 9.2 Manajemen Stok
- CRUD produk (SKU, nama, kategori, stok, harga modal/jual)
- Mutasi stok (masuk/keluar/penyesuaian) dengan riwayat lengkap
- **Auto-decrement** saat transaksi POS via `cutInventoryStock()` (pipeline v4)
- Badge "Habis" / "Menipis" (stok ≤ stokMin)

### 9.3 Loyalty Points
- **1% dari totalBruto** otomatis jadi poin setiap transaksi (via `updateCustomerMetrics`)
- Cross-branch redemption: cari poin tertinggi di semua cabang via `findCustomerCrossBranch()`
- Tidak bertambah jika transaksi menggunakan poin

### 9.4 Dashboard Eksekutif
- Total kekayaan (aggregasi saldo semua buku/cabang)
- Omset hari ini / minggu ini / bulan ini (real-time dari IndexedDB)
- Piutang aktif total
- Total pelanggan terdaftar
- 5 transaksi terbesar (rank by nominal)
- Quick actions: Mutasi Antar-Buku, Tanya AI
- Buku cards: Pribadi, Keluarga, Usaha, Sedekah, Catatan

### 9.5 Global Search (Header)
- Search modal di setiap halaman (icon Search di header kanan)
- Cari **pelanggan**, **transaksi**, **produk** di semua branch
- 300ms debounce, grouped result per kategori
- Click → navigasi ke halaman terkait

### 9.6 Inter-Book Transfer
- Double-entry: debit wallet source + credit wallet target
- Audit log untuk kedua sisi (TRANSFER_KELUAR + TRANSFER_MASUK)
- Validasi saldo cukup

### 9.7 Kanban Production Board
- Percetakan & Konveksi: 3 kolom (Menunggu Bahan / Diproduksi / Selesai)
- Data dari real IndexedDB transactions
- Click untuk advance status
- "Kirim Tagihan WA" button

### 9.8 Kiosk Mode
- `/kiosk` → pilih cabang → input PIN → fullscreen POS (tanpa header/bottom-nav)
- Exit: admin PIN "123456"

### 9.9 AI Chat
- `/asisten-ai` → chat UI with 44px input area
- `buildAiContext()` — compile real financial data → system prompt
- `/api/ai-chat` proxy → OpenAI GPT-4o-mini + Gemini fallback

### 9.10 Export Engine (4 format)
- WA text
- Photo/PNG (html2canvas)
- PDF (jsPDF / html2pdf.js)
- Excel/XLSX (SheetJS)

---

## 10. BOOK / BRANCH STRUCTURE

### Buku Pribadi (`/buku-pribadi`)
- Keuangan pribadi, tabungan, target
- Sub: transaksi, dompet, laporan

### Buku Keluarga (`/buku-keluarga`)
- Keuangan rumah tangga (dibuat dari scratch)
- Sub: transaksi, dompet, laporan

### Buku Usaha (`/buku-usaha`) — 7 Cabang Individu:

| # | Cabang | Slug | Aksen | Dashboard | Kasir | Note |
|---|--------|------|-------|-----------|-------|------|
| 1 | Percetakan | `usaha-percetakan` | Violet | Kanban | Split-screen meteran | 🔴 Perlu refactor pipeline |
| 2 | Laptop/PC | `usaha-laptop` | Cyan | KPI | Full POS | 🔴 Perlu refactor pipeline |
| 3 | Gadget | `usaha-gadget` | Sky | KPI | Full POS | 🔴 Perlu refactor pipeline |
| 4 | Warkop | `usaha-warkop` | Emerald | KPI | **Simplified ✅** | Pipeline v4 |
| 5 | Kelontong | `usaha-kelontong` | Amber | KPI | **Simplified ✅** | Pipeline v4 |
| 6 | Konveksi | `usaha-konveksi` | Rose | Kanban | N/A | Tidak punya POS |
| 7 | Toko Pakaian | `usaha-toko-pakaian` | Pink | KPI | **Simplified ✅** | Pipeline v4 |

---

## 11. DEPENDENCIES UTAMA

| Package | Versi | Fungsi |
|---------|-------|--------|
| next | 14.2.35 | Framework React (App Router) |
| dexie | 4.4.4 | IndexedDB wrapper (16 tables) |
| zustand | 5.0.14 | State management (persist middleware) |
| lucide-react | ^1 | Icons |
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

## 12. DEPLOYMENT

- **Vercel** — auto-deploy dari GitHub push ke `main`
- **URL**: `https://mmcbank.vercel.app`
- **Config**: `vercel.json` — `{ buildCommand: "next build", framework: "nextjs" }`
- **PWA**: manifest.json, service worker (sw.js), offline-capable (PWA install prompt)
- **Next.config**: `experimental.scrollRestoration: true`

---

## 13. ALUR DATA END-TO-END (POS Transaction)

```
User input di Kasir → hitung totalBruto
  → executeTransactionPipelineV4({...})
  → db.transaction("rw", [wallets, inventory, inventoryMutations,
                           customers, transactions, piutang, auditLogs]) {
      1. Cross-poin redemption (jika ada)
      2. Potong stok inventory + catat mutasi
      3. FindOrCreate customer (by WA per branch)
      4. Simpan transaksi dengan status LUNAS/DP
      5. Update saldo wallet (+nominal)
      6. Update customer metrics (totalTransaksi++, totalBelanja, poin+1%)
      7. Auto-create piutang jika sisa tagihan > 0
      8. Audit log CREATE transaction
    }
  → Result: { ok, transactionId, customerId?, piutangId?, poinTerpakai? }
  → Tampilkan sukses + invoiceId
```

---

## 14. BUILD STATUS

**Per `npx next build`**: ✅ **0 errors, 0 warnings, 48 routes**

```
✓ Compiled successfully
✓ Generating static pages (48/48)
✓ Finalizing page optimization

Route (app)                   Size
┌ ○ /                         5.35 kB
├ ○ /asisten-ai               4.35 kB
├ ○ /buku-keluarga/*          4 sub-routes
├ ○ /buku-pribadi/*           4 sub-routes
├ ○ /buku-usaha/*             ~30 sub-routes (7 cabang × 2 + hub pages + legacy redirects)
├ ○ /kiosk                    4.17 kB
├ ○ /login                    3.04 kB
├ ○ /register                 3.32 kB
├ ○ /mutasi-antar-buku        ...
└ ƒ /api/*                    2 API routes (ai-chat, bank/webhook)
```

---

## 15. RIWAYAT COMMIT

```
fceea1f feat: inventory auto-decrement POS, loyalty points, dashboard eksekutif,
             global search, thermal USB, atomic pipeline v4 fix
a94e510 fix: bersihkan warning + redirect rute lama ke /buku-usaha
6a8a6f2 feat: split combined branches + buku-pribadi sub-pages + buku-keluarga module
3da88ed docs: tambah SKEMA_APLIKASI.md
da86666 fix: remove redundant AppShell from root layout
03cd425 fix: register page keyboard dismissal + 150ms delay
1f96cba feat: kiosk mode, persistent storage, encrypted backup, AI chat
ac5ff9e feat: transaction-pipeline-v4 + cross-branch loyalty
```
