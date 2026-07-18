# Database Map — MMCBANK

**Engine:** Dexie.js v4 (IndexedDB wrapper)  
**Schema Version:** v7 (mmcbank-v7)  
**Total Tables:** 24  

Setiap tabel keuangan memiliki field `bookOrBranchId: UnitId` untuk isolasi data per-cabang. Unit `"GLOBAL"` adalah super-aggregator (membaca semua unit).

---

## Unit ID System

```typescript
type UnitId =
  | "pribadi"                // Buku Pribadi
  | "keluarga"               // Buku Keluarga
  | "usaha-percetakan"       // Percetakan
  | "usaha-laptop"           // Laptop / PC
  | "usaha-gadget"           // Gadget
  | "usaha-warkop"           // Kedai Kopi
  | "usaha-kelontong"        // Kelontong
  | "usaha-konveksi"         // Fashion & Konveksi
  | "usaha-toko-pakaian";    // Toko Pakaian
```

---

## Tabel

### 1. `users` — User Akun

| Field | Type | Keterangan |
|-------|------|------------|
| `id` | `string` | Primary key (UUID) |
| `bookOrBranchId` | `UnitId` | Unit pemilik user |
| `nama` | `string` | Username (unique) |
| `pinHash` | `string` | SHA-256 hash dari PIN |
| `fotoUrl` | `string` | URL foto profil (base64) |
| `role` | `"admin" \| "kasir" \| "viewer"` | Role akses |
| `allowedUnits` | `string[]` | Cabang-cabang yang bisa diakses |
| `isActive` | `boolean` | Status aktif |
| `createdAt` | `string` | ISO timestamp |

**Index:** `id`, `&nama` (unique), `role`, `bookOrBranchId`  
**Relasi:** —
**Digunakan oleh halaman:** login, register, users, profile, all guarded pages (via useSessionStore)

---

### 2. `profiles` — Profil Bisnis

| Field | Type | Keterangan |
|-------|------|------------|
| `id` | `string` | Primary key |
| `bookOrBranchId` | `UnitId` | Unit pemilik profil |
| `namaUsaha` | `string` | Nama usaha |
| `logoUrl` | `string` | Logo (base64) |
| `alamat` | `string` | Alamat |
| `noWhatsapp` | `string` | Nomor WA |
| `slogan` | `string` | Slogan |
| `subLayanan` | `string[]` | Daftar sub-layanan |
| `updatedAt` | `string` | ISO timestamp |

**Index:** `id`, `bookOrBranchId`  
**Relasi:** Satu profil per unit  
**Digunakan oleh halaman:** kasir (invoice), pengaturan (edit), buku-global (profil tab), transaksi (invoice)

---

### 3. `wallets` — Dompet

| Field | Type | Keterangan |
|-------|------|------------|
| `id` | `string` | Primary key |
| `bookOrBranchId` | `UnitId` | Unit pemilik |
| `unitId` | `UnitId` | Unit (sama dengan bookOrBranchId) |
| `namaDompet` | `string` | Nama dompet |
| `saldo` | `number` | Saldo terkini |
| `tipe` | `"KasTunai" \| "Bank" \| "EWallet"` | Tipe dompet |
| `mataUang` | `MataUang?` | IDR / USD (default IDR) |
| `nomorRekening` | `string?` | Untuk tipe Bank |
| `atasNama` | `string?` | Untuk tipe Bank |
| `namaBank` | `string?` | Untuk tipe Bank |
| `catatan` | `string` | Catatan |
| `isActive` | `boolean` | Status aktif (max 4 per unit) |
| `createdAt` | `string` | ISO timestamp |

**Index:** `id`, `bookOrBranchId`, `unitId`, `tipe`, `isActive`  
**Relasi:** Wallet → WalletMutation (dariWalletId, keWalletId)  
**Digunakan oleh halaman:** dompet, cashflow, kasir, transaksi, transfer, recurring, buku-global, buku-pribadi, buku-keluarga, budget, laporan, pengaturan

---

### 4. `walletMutations` — Mutasi Dompet

| Field | Type | Keterangan |
|-------|------|------------|
| `id` | `string` | Primary key |
| `bookOrBranchId` | `UnitId` | Unit pemilik |
| `dariWalletId` | `string` | Wallet asal |
| `keWalletId` | `string` | Wallet tujuan |
| `nominal` | `number` | Jumlah transfer |
| `alasan` | `string` | Alasan / catatan |
| `createdAt` | `string` | ISO timestamp |

**Index:** `id`, `bookOrBranchId`, `dariWalletId`, `keWalletId`, `createdAt`  
**Relasi:** → wallets (dariWalletId, keWalletId)  
**Digunakan oleh halaman:** dompet, transfer

---

### 5. `customers` — Pelanggan

| Field | Type | Keterangan |
|-------|------|------------|
| `id` | `string` | Primary key |
| `bookOrBranchId` | `UnitId` | Unit pemilik |
| `nama` | `string` | Nama pelanggan |
| `noWA` | `string` | Nomor WhatsApp (unique per unit) |
| `totalTransaksi` | `number` | Jumlah total transaksi |
| `totalBelanja` | `number` | Total nominal belanja |
| `poin` | `number` | Poin loyalty (1 poin = Rp100 diskon) |
| `terakhirTransaksi` | `string` | Tanggal transaksi terakhir |
| `createdAt` | `string` | ISO timestamp |

**Index:** `id`, `bookOrBranchId`, `&[bookOrBranchId+noWA]` (composite unique), `nama`  
**Relasi:** → transactions (customerId), → piutang (customerId)  
**Digunakan oleh halaman:** kasir, pelanggan, transaksi, buku-global (pelanggan tab, piutang tab)

---

### 6. `transactions` — Transaksi POS

| Field | Type | Keterangan |
|-------|------|------------|
| `id` | `string` | Primary key (UUID) |
| `bookOrBranchId` | `UnitId` | Unit pemilik |
| `unitId` | `UnitId` | Unit |
| `userId` | `string` | ID user kasir |
| `invoiceNumber` | `string` | Nomor invoice |
| `customerId` | `string?` | ID pelanggan |
| `customerNama` | `string` | Nama pelanggan (denormalized) |
| `customerWA` | `string` | No WA pelanggan |
| `tanggal` | `string` | Tanggal transaksi |
| `items` | `DbTransactionItem[]` | Array item (nested object) |
| `totalBruto` | `number` | Total sebelum diskon |
| `diskonGlobalPersen` | `number` | Diskon global % |
| `totalDiskonItem` | `number` | Total diskon item |
| `totalDiskonGlobal` | `number` | Total diskon global |
| `subtotalAfterDiskon` | `number` | Subtotal setelah diskon |
| `ppnPersen` | `number` | PPN % |
| `ppnNominal` | `number` | Nominal PPN |
| `grandTotal` | `number` | Total akhir |
| `dpDibayar` | `number` | DP dibayar |
| `sisaTagihan` | `number` | Sisa tagihan (jika DP) |
| `sedekahNominal` | `number` | Nominal sedekah |
| `sedekahType` | `SedekahType?` | Jenis sedekah |
| `mataUang` | `MataUang?` | Mata uang transaksi |
| `status` | `"LUNAS" \| "DP" \| "BATAL"` | Status transaksi |
| `walletIdTarget` | `string` | Dompet tujuan |
| `catatan` | `string` | Catatan |
| `buktiBayar` | `string?` | Bukti bayar (base64) |
| `createdAt` | `string` | ISO timestamp |

**Index:** `id`, `bookOrBranchId`, `unitId`, `userId`, `customerId`, `tanggal`, `status`, `walletIdTarget`, `invoiceNumber`  
**Relasi:** → customers (customerId), → piutang (transactionId), → productions (transactionId), → cashflows (referensiId)  
**Digunakan oleh halaman:** kasir, transaksi, laporan, buku-global, pelanggan, buku-usaha landing, cabang dashboard

---

### 7. `piutang` — Piutang (Receivables)

| Field | Type | Keterangan |
|-------|------|------------|
| `id` | `string` | Primary key |
| `bookOrBranchId` | `UnitId` | Unit pemilik |
| `unitId` | `UnitId` | Unit |
| `transactionId` | `string` | ID transaksi asal |
| `customerId` | `string` | ID pelanggan |
| `customerNama` | `string` | Nama pelanggan |
| `customerWA` | `string` | No WA pelanggan |
| `totalPiutang` | `number` | Total piutang |
| `sisaPiutang` | `number` | Sisa yang belum dibayar |
| `jatuhTempo` | `string` | Tanggal jatuh tempo |
| `status` | `"AKTIF" \| "LUNAS" \| "DIHAPUS"` | Status piutang |
| `catatan` | `string` | Catatan |
| `createdAt` | `string` | ISO timestamp |

**Index:** `id`, `bookOrBranchId`, `unitId`, `customerId`, `status`, `jatuhTempo`, `transactionId`  
**Relasi:** → transactions (transactionId), → customers (customerId), → piutangInstallments (piutangId)  
**Digunakan oleh halaman:** transaksi, pelanggan, buku-global (piutang tab), cabang dashboard

---

### 8. `piutangInstallments` — Cicilan Piutang

| Field | Type | Keterangan |
|-------|------|------------|
| `id` | `string` | Primary key |
| `bookOrBranchId` | `UnitId` | Unit pemilik |
| `piutangId` | `string` | ID piutang |
| `jumlah` | `number` | Jumlah cicilan |
| `metode` | `string` | Metode pembayaran |
| `tanggal` | `string` | Tanggal cicilan |
| `catatan` | `string` | Catatan |

**Index:** `id`, `bookOrBranchId`, `piutangId`, `tanggal`  
**Relasi:** → piutang (piutangId)  
**Digunakan oleh halaman:** transaksi, pelanggan, buku-global

---

### 9. `inventory` — Inventory / Produk

| Field | Type | Keterangan |
|-------|------|------------|
| `id` | `string` | Primary key |
| `bookOrBranchId` | `UnitId` | Unit pemilik |
| `unitId` | `UnitId` | Unit |
| `sku` | `string` | SKU produk |
| `barcode` | `string?` | Barcode |
| `nama` | `string` | Nama produk |
| `kategori` | `string` | Kategori |
| `stok` | `number` | Stok terkini |
| `stokMin` | `number` | Stok minimum (alert) |
| `hargaModal` | `number` | Harga modal |
| `hargaJual` | `number` | Harga jual |
| `satuan` | `string` | Satuan (pcs, kg, meter, dll) |
| `catatan` | `string` | Catatan |
| `fotoUrl` | `string?` | Foto produk (base64) |
| `createdAt` | `string` | ISO timestamp |
| `updatedAt` | `string` | ISO timestamp |

**Index:** `id`, `bookOrBranchId`, `unitId`, `sku`, `kategori`  
**Relasi:** → inventoryMutations (itemId)  
**Digunakan oleh halaman:** inventory, kasir, produksi, cabang dashboard (stock alert), laporan (HPP)

---

### 10. `inventoryMutations` — Mutasi Stok

| Field | Type | Keterangan |
|-------|------|------------|
| `id` | `string` | Primary key |
| `bookOrBranchId` | `UnitId` | Unit pemilik |
| `itemId` | `string` | ID inventory item |
| `tipe` | `"masuk" \| "keluar" \| "penyesuaian"` | Tipe mutasi |
| `qty` | `number` | Jumlah |
| `stokSebelum` | `number` | Stok sebelum mutasi |
| `stokSesudah` | `number` | Stok setelah mutasi |
| `alasan` | `string` | Alasan mutasi |
| `createdAt` | `string` | ISO timestamp |

**Index:** `id`, `bookOrBranchId`, `itemId`, `tipe`, `createdAt`  
**Relasi:** → inventory (itemId)  
**Digunakan oleh halaman:** inventory

---

### 11. `labels` — Label / Tag

| Field | Type | Keterangan |
|-------|------|------------|
| `id` | `string` | Primary key |
| `bookOrBranchId` | `UnitId` | Unit pemilik |
| `label` | `string` | Nama label |
| `warna` | `string` | Warna (hex/theme) |
| `createdAt` | `string` | ISO timestamp |

**Index:** `id`, `bookOrBranchId`  
**Relasi:** → labelTags (labelId)  
**Digunakan oleh halaman:** label, transaksi

---

### 12. `labelTags` — Transaksi-Label Mapping

| Field | Type | Keterangan |
|-------|------|------------|
| `id` | `string` | Primary key |
| `bookOrBranchId` | `UnitId` | Unit pemilik |
| `transaksiRef` | `string` | ID transaksi |
| `labelId` | `string` | ID label |

**Index:** `id`, `bookOrBranchId`, `transaksiRef`, `labelId`  
**Relasi:** → labels (labelId), → transactions (transaksiRef)  
**Digunakan oleh halaman:** transaksi, label

---

### 13. `quickOrders` — Pesanan Cepat

| Field | Type | Keterangan |
|-------|------|------------|
| `id` | `string` | Primary key |
| `bookOrBranchId` | `UnitId` | Unit pemilik |
| `label` | `string` | Nama pesanan |
| `items` | `{ desc: string; price: number }[]` | Item pesanan |
| `createdAt` | `string` | ISO timestamp |

**Index:** `id`, `bookOrBranchId`  
**Relasi:** —  
**Digunakan oleh halaman:** buku-global (settings tab)

---

### 14. `sedekahBalances` — Saldo Sedekah

| Field | Type | Keterangan |
|-------|------|------------|
| `id` | `string` | Primary key (format: `sedekah-{unitId}`) |
| `bookOrBranchId` | `UnitId` | Unit pemilik |
| `zakatMal` | `number` | Saldo Zakat Mal |
| `zakatFitrah` | `number` | Saldo Zakat Fitrah |
| `infakTerikat` | `number` | Saldo Infak Terikat |
| `sedekahSubuh` | `number` | Saldo Sedekah Subuh |

**Index:** `id`, `bookOrBranchId`  
**Relasi:** — (di-refer oleh transactions.sedekahType)  
**Digunakan oleh halaman:** sedekah  
**Seed:** 1 record per unit saat database pertama dibuat (via `populate` event)

---

### 15. `invoiceCounters` — Counter Nomor Invoice

| Field | Type | Keterangan |
|-------|------|------------|
| `id` | `string` | Primary key |
| `bookOrBranchId` | `UnitId` | Unit pemilik |
| `prefix` | `string` | Prefix invoice |
| `counter` | `number` | Counter berjalan |

**Index:** `id`, `bookOrBranchId`, `prefix`  
**Relasi:** —  
**Digunakan oleh halaman:** kasir (pipeline generates invoice number)

---

### 16. `auditLogs` — Catatan Audit

| Field | Type | Keterangan |
|-------|------|------------|
| `id` | `string` | Primary key |
| `bookOrBranchId` | `UnitId` | Unit pemilik |
| `action` | `enum` | CREATE, UPDATE, DELETE, BATAL, RETUR, TRANSFER_KELUAR, TRANSFER_MASUK |
| `entityType` | `enum` | transaction, piutang, wallet, customer, inventory, transfer, sedekah |
| `entityId` | `string` | ID entitas |
| `userId` | `string` | ID user |
| `userName` | `string` | Nama user |
| `dataBefore` | `string` | Data sebelum (JSON) |
| `dataAfter` | `string` | Data setelah (JSON) |
| `nominal` | `number` | Nominal transaksi |
| `alasan` | `string` | Alasan / deskripsi |
| `createdAt` | `string` | ISO timestamp |

**Index:** `id`, `bookOrBranchId`, `action`, `entityType`, `entityId`, `createdAt`  
**Relasi:** —  
**Digunakan oleh halaman:** buku-global (audit tab), engine files (writeAuditLog)

---

### 17. `cashflows` — Catatan Arus Kas

| Field | Type | Keterangan |
|-------|------|------------|
| `id` | `string` | Primary key |
| `bookOrBranchId` | `UnitId` | Unit pemilik |
| `unitId` | `UnitId` | Unit |
| `mataUang` | `MataUang?` | IDR / USD |
| `tipe` | `"masuk" \| "keluar"` | Tipe cashflow |
| `kategori` | `string` | Kategori transaksi |
| `nominal` | `number` | Jumlah |
| `saldoSebelum` | `number` | Saldo wallet sebelum |
| `saldoSesudah` | `number` | Saldo wallet setelah |
| `walletId` | `string` | ID wallet |
| `walletNama` | `string` | Nama wallet (denormalized) |
| `referensiId` | `string` | ID referensi |
| `referensiTipe` | `enum` | transaction, mutasi, adjustment, retur, sedekah, recurring |
| `catatan` | `string` | Catatan |
| `createdAt` | `string` | ISO timestamp |

**Index:** `id`, `bookOrBranchId`, `unitId`, `tipe`, `kategori`, `walletId`, `referensiId`, `createdAt`  
**Relasi:** → wallets (walletId), → transactions/recurring/etc (referensiId)  
**Digunakan oleh halaman:** cashflow, laporan, buku-pribadi/cashflow, buku-keluarga/cashflow, buku-global, recurring, engine files

---

### 18. `productions` — Produksi

| Field | Type | Keterangan |
|-------|------|------------|
| `id` | `string` | Primary key |
| `bookOrBranchId` | `UnitId` | Unit pemilik |
| `unitId` | `UnitId` | Unit |
| `transactionId` | `string` | ID transaksi |
| `invoiceNumber` | `string` | Nomor invoice |
| `status` | `"antre" \| "diproduksi" \| "selesai"` | Status produksi |
| `catatan` | `string` | Catatan |
| `updatedAt` | `string` | ISO timestamp |
| `createdAt` | `string` | ISO timestamp |

**Index:** `id`, `bookOrBranchId`, `unitId`, `transactionId`, `status`, `updatedAt`  
**Relasi:** → transactions (transactionId)  
**Digunakan oleh halaman:** transaksi, produksi, kasir (pipeline creates production record)

---

### 19. `suppliers` — Supplier

| Field | Type | Keterangan |
|-------|------|------------|
| `id` | `string` | Primary key |
| `bookOrBranchId` | `UnitId` | Unit pemilik |
| `unitId` | `UnitId` | Unit |
| `nama` | `string` | Nama supplier |
| `kontak` | `string` | Kontak |
| `alamat` | `string` | Alamat |
| `catatan` | `string` | Catatan |
| `createdAt` | `string` | ISO timestamp |

**Index:** `id`, `bookOrBranchId`, `unitId`, `nama`  
**Relasi:** → purchaseOrders (supplierId)  
**Digunakan oleh halaman:** supplier, purchase-order

---

### 20. `purchaseOrders` — Purchase Order

| Field | Type | Keterangan |
|-------|------|------------|
| `id` | `string` | Primary key |
| `bookOrBranchId` | `UnitId` | Unit pemilik |
| `unitId` | `UnitId` | Unit |
| `poNumber` | `string` | Nomor PO |
| `supplierId` | `string` | ID supplier |
| `supplierNama` | `string` | Nama supplier (denormalized) |
| `items` | `DbPurchaseOrderItem[]` | Array item (nama, qty, harga, subtotal) |
| `total` | `number` | Total PO |
| `status` | `"draft" \| "dikirim" \| "diterima" \| "selesai" \| "batal"` | Status PO |
| `catatan` | `string` | Catatan |
| `createdAt` | `string` | ISO timestamp |

**Index:** `id`, `bookOrBranchId`, `unitId`, `poNumber`, `supplierId`, `status`  
**Relasi:** → suppliers (supplierId), → inventory (auto-update stok saat diterima)  
**Digunakan oleh halaman:** purchase-order

---

### 21. `recurringTemplates` — Template Transaksi Berulang

| Field | Type | Keterangan |
|-------|------|------------|
| `id` | `string` | Primary key |
| `bookOrBranchId` | `UnitId` | Unit pemilik |
| `unitId` | `UnitId` | Unit |
| `nama` | `string` | Nama template |
| `tipe` | `"pemasukan" \| "pengeluaran"` | Tipe |
| `jumlah` | `number` | Jumlah nominal |
| `kategori` | `string` | Kategori cashflow |
| `catatan` | `string` | Catatan |
| `frequency` | `"daily" \| "weekly" \| "monthly" \| "yearly"` | Frekuensi |
| `dayOfWeek` | `number?` | Hari (untuk weekly) |
| `dayOfMonth` | `number?` | Tanggal (untuk monthly/yearly) |
| `startDate` | `string` | Tanggal mulai |
| `endDate` | `string?` | Tanggal selesai |
| `walletId` | `string` | ID wallet tujuan |
| `isActive` | `boolean` | Aktif / nonaktif |
| `lastGenerated` | `string` | Terakhir di-generate |
| `createdAt` | `string` | ISO timestamp |

**Index:** `id`, `bookOrBranchId`, `unitId`, `isActive`, `tipe`  
**Relasi:** → wallets (walletId), → cashflows (via scheduler)  
**Digunakan oleh halaman:** recurring, recurring-scheduler component

---

### 22. `budgets` — Budget / Anggaran

| Field | Type | Keterangan |
|-------|------|------------|
| `id` | `string` | Primary key |
| `bookOrBranchId` | `UnitId` | Unit pemilik |
| `unitId` | `UnitId` | Unit |
| `kategori` | `string` | Kategori |
| `jumlah` | `number` | Jumlah budget |
| `periode` | `string` | Periode ("YYYY-MM") |
| `createdAt` | `string` | ISO timestamp |

**Index:** `id`, `bookOrBranchId`, `unitId`, `kategori`, `periode`  
**Relasi:** — (dibandingkan dengan cashflows per kategori per bulan)  
**Digunakan oleh halaman:** budget

---

### 23. `periods` — Periode Akuntansi

| Field | Type | Keterangan |
|-------|------|------------|
| `id` | `string` | Primary key |
| `bookOrBranchId` | `UnitId` | Unit pemilik |
| `unitId` | `UnitId` | Unit |
| `periode` | `string` | Periode ("YYYY-MM") |
| `status` | `"open" \| "closed"` | Status periode |
| `labaBersih` | `number` | Laba bersih periode |
| `totalPendapatan` | `number` | Total pendapatan |
| `totalPengeluaran` | `number` | Total pengeluaran |
| `createdAt` | `string` | ISO timestamp |
| `closedAt` | `string?` | Timestamp close |

**Index:** `id`, `bookOrBranchId`, `unitId`, `periode`, `status`  
**Relasi:** — (guard untuk kasir checkout)  
**Digunakan oleh halaman:** period, kasir (guard checkout)

---

### 24. `exchangeRates` — Kurs Mata Uang

| Field | Type | Keterangan |
|-------|------|------------|
| `id` | `string` | Primary key |
| `from` | `MataUang` | Mata uang asal |
| `to` | `MataUang` | Mata uang tujuan |
| `rate` | `number` | Nilai kurs |
| `updatedAt` | `string` | ISO timestamp |

**Index:** `id`, `from`, `to`  
**Relasi:** —  
**Digunakan oleh halaman:** exchange-rate, dompet, transaksi, cashflow

---

## Entity Relationship Diagram (Textual)

```
users ──> transactions (userId)
profiles ──> (satu per unit)
wallets ──> walletMutations (dariWalletId, keWalletId)
wallets ──> cashflows (walletId)
wallets ──> recurringTemplates (walletId)
customers ──> transactions (customerId)
customers ──> piutang (customerId)
transactions ──> piutang (transactionId)
transactions ──> productions (transactionId)
transactions ──> cashflows (referensiId)
transactions ──> labelTags (transaksiRef)
piutang ──> piutangInstallments (piutangId)
inventory ──> inventoryMutations (itemId)
labels ──> labelTags (labelId)
suppliers ──> purchaseOrders (supplierId)
purchaseOrders ──> inventory (auto-update stok)
recurringTemplates ──> cashflows (auto-generate)
budgets ──> cashflows (comparison by kategori + periode)
periods ──> (guard for kasir checkout)
exchangeRates ──> (used by currency conversion)
```

## Migration History

| Version | Perubahan |
|---------|-----------|
| v3 | Base schema: 18 tables (users s.d. purchaseOrders) |
| v4 | Added `budgets` and `recurringTemplates` |
| v5 | Added `periods` |
| v6 | Added `exchangeRates` (final version running in production as `mmcbank-v6`) |
| v7 | Latest schema with `exchangeRates` (defined in code as version 7) |

Semua migrasi bersifat auto-migration oleh Dexie. Tidak ada data loss antar versi.
