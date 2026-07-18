# Design System — MMCBANK

> **Dokumen ini adalah Design System resmi MMCBANK.**
> Berdasarkan analisis kode yang ada. Tidak ada kode yang diubah.
> Semua aturan bersumber dari pola yang sudah ada di codebase.

---

## 1. Design Principle

### Simple
Setiap halaman memiliki satu tujuan utama. Tidak ada elemen dekoratif yang mengganggu. Pengguna UMKM harus bisa langsung mengerti apa yang harus dilakukan dalam 3 detik pertama.

### Professional
Tampilan harus meyakinkan pengguna bahwa data keuangan mereka aman. Warna biru elektrik (#008CEB) sebagai primary memberikan kesan trust dan stabilitas.

### Fast
Interaksi harus terasa instan. Semua tombol memiliki feedback `active:scale(0.96)`, skeleton muncul saat loading, toast muncul setelah aksi. Tidak ada halaman yang membutuhkan >2 detik untuk terasa responsif.

### Mobile-First
Semua halaman dirancang untuk layar 390px (iPhone 13) terlebih dahulu. Desktop adalah secondary. Bottom navigation, thumb zone, safe area — semuanya untuk mobile.

### Minimal Click
Setiap aksi pengguna harus selesai dalam maksimal 3 tap. Transaksi POS: search produk → atur qty → bayar. Tidak ada wizard, tidak ada konfirmasi berlebihan.

### Accessible
Warna memiliki kontras yang cukup. Semua tombol memiliki focus state. Font size tidak pernah di bawah 10px. Touch target minimal 44x44px.

---

## 2. Design Language

### Card-Based
Setiap konten berada di dalam kartu (`premium-card`). Tidak ada layout full-width tanpa batas. Kartu memberikan hierarki visual dan pemisahan konten yang jelas.

### Soft Shadow
Bayangan halus (`shadow-card: 0 2px 16px rgba(13,27,42,0.05)`) memberikan kedalaman tanpa efek dramatis. Hover state meningkat ke `shadow-card-hover: 0 6px 24px rgba(...)`.

### Rounded Corner
Semua elemen menggunakan `rounded-xl` (12px) sebagai default. Kartu dan modal menggunakan `rounded-2xl` (16px). Tombol menggunakan `rounded-xl` atau `rounded-full`.

### Generous White Space
Padding standar `p-4` (16px) di dalam kartu. Gap antar kartu `gap-3` hingga `gap-4`. Tidak ada konten yang saling menempel.

### Clean Typography
Dua font: **Inter** untuk body text (keterbacaan tinggi di layar kecil), **Plus Jakarta Sans** untuk heading (modern, tegas). Tidak ada font dekoratif.

### Glassmorphism (Subtle)
Bottom navigation dan beberapa overlay menggunakan `backdrop-filter: blur(12px)` dengan background translucent — memberikan efek frosted glass yang modern.

### Gradient Accents
Gradient `from-[#008CEB] to-[#00C9A7]` digunakan sebagai aksen pada tombol primary, avatar, dan indikator aktif. Gradient tidak pernah digunakan sebagai background halaman.

---

## 3. Color System

### Primary — #008CEB
Fungsi: Semua tombol CTA, link aktif, ikon terpilih, indikator status aktif, highlight navigasi.
Penggunaan: `bg-[#008CEB]`, `text-[#008CEB]`, `border-[#008CEB]`, `focus:ring-[#008CEB]`.

### Secondary / Accent — #00C9A7
Fungsi: Pairing gradient dengan primary. Memberikan variasi visual pada elemen yang membutuhkan dua warna.

### Primary Light — rgba(0,140,235,0.03–0.10)
Fungsi: Background subtle untuk card terpilih, input focus, tab aktif, summary card.

### Success — Emerald (#10B981 / emerald-500)
Fungsi: Status LUNAS, stok tersedia, transaksi sukses, pertumbuhan positif.
Dark mode: `emerald-400`.

### Warning — Amber (#F59E0B / amber-500)
Fungsi: Status DP, stok menipis (≤stokMin), piutang mendekati jatuh tempo.
Dark mode: `amber-400`.

### Danger — Rose (#F43F5E / rose-500)
Fungsi: Status BATAL, stok habis, piutang overdue, aksi hapus, tombol destructive.
Dark mode: `rose-400`.

### Info — Sky (#38BDF8 / sky-400)
Fungsi: Informasi tambahan, tooltip, helper text, badge info.

### Background
| Toko | Light | Dark |
|------|-------|------|
| App background | `#F8F9FD` | `#0B0C16` |
| Auth background | `#F5F9FC` | `#0A1628` |
| Surface (card) | `#FFFFFF` | `#131527` atau `#1a1b2e` |
| Input field | `bg-slate-100` | `bg-zinc-800` |
| Input auth | `#FFFFFF` | `#0F1926` |

### Border
| Toko | Light | Dark |
|------|-------|------|
| Card border | `rgba(210,225,240,0.6)` | `rgba(30,55,90,0.4)` |
| Input border | `border-slate-200` | `border-slate-700` |
| Divider | `border-slate-100` | `border-slate-800` |

### Text
| Toko | Light | Dark |
|------|-------|------|
| Heading | `text-slate-900` | `text-slate-100` |
| Body | `text-slate-700` | `text-slate-300` |
| Secondary | `text-slate-500` | `text-slate-400` |
| Muted | `text-slate-400` | `text-slate-500` |
| Placeholder | `text-slate-400` | `text-slate-500` |
| On Primary | `text-white` | `text-white` |
| Link | `text-[#008CEB]` | `text-[#4DA3E0]` |
| On Danger | `text-rose-600` | `text-rose-400` |

### Semantic Mapping
| Makna | Warna |
|-------|-------|
| **Bisnis & Trust** | Primary (#008CEB) |
| **Positif / Sukses** | Emerald |
| **Perhatian / Sedang** | Amber |
| **Negatif / Error** | Rose |
| **Netral / Info** | Sky |
| **POS / Aksi Khusus** | Violet (#7B61FF) → Orange (#FF5C00) |

---

## 4. Typography

### Font Stack
```
Body:     Inter (--font-sans)
Heading:  Plus Jakarta Sans (--font-heading)
Mono:     Geist Mono / ui-monospace (untuk angka)
```

### Hierarchy

| Level | Class | Size | Weight | Letter-spacing | Font Family | Contoh Penggunaan |
|-------|-------|------|--------|----------------|-------------|-------------------|
| **Page Title** | `text-lg` + `font-extrabold` | 18px | 800 | -0.02em | Heading | Judul halaman, "Cashflow" |
| **Section Title** | `text-xs` + `font-extrabold` + `uppercase` | 12px | 800 | — | Heading | "Operasional", "Ringkasan" |
| **Card Title** | `text-xs` + `font-extrabold` | 12px | 800 | — | Heading | Judul di dalam kartu |
| **Saldo / Angka Besar** | `text-xl` + `font-extrabold` | 20px | 800 | -0.03em | Heading Nomor | "Rp 2.450.000" |
| **Body** | `text-xs` | 12px | 500 | — | Inter | Konten umum, deskripsi |
| **Body Large** | `text-sm` | 14px | 500 | — | Inter | Auth form, label besar |
| **Caption** | `text-[10px]` | 10px | 500–600 | — | Inter | Label tombol grid, helper text |
| **Label** | `text-xs` + `font-bold` | 12px | 700 | — | Heading | Label form, badge |
| **Button** | `text-xs` + `font-bold`/`extrabold` | 12px | 700–800 | — | Heading | Semua tombol |
| **Button Auth** | `text-sm` + `font-bold` | 14px | 700 | — | Heading | Login/Register button |
| **KPI Value** | `text-lg` + `font-extrabold` | 18px | 800 | -0.03em | Heading | Angka di KPI card |
| **KPI Label** | `text-[10px]` + `font-semibold` | 10px | 600 | — | Inter | Label di KPI card |
| **Muted** | `text-[10px]` | 10px | 400–500 | — | Inter | Timestamp, metadata |

### Aturan
- **Tidak pernah menggunakan ukuran < 10px** untuk text yang perlu dibaca.
- **Semua heading otomatis menggunakan `font-heading`** (Plus Jakarta Sans).
- **Angka/saldo menggunakan `stat-value` utility** (font-heading + weight 800 + tighter tracking).
- **Gradient text** (`gradient-text`) hanya untuk judul halaman utama (maks 1 per halaman).
- **Line-height** tidak pernah di-set manual — biarkan default (Tailwind `leading-normal`).

---

## 5. Spacing System

### Scale

| Token | Tailwind | Pixels | Penggunaan |
|-------|----------|--------|------------|
| **XS** | `gap-1` / `p-1` | 4px | Antara ikon dan teks dalam tombol |
| **SM** | `gap-2` / `p-2` | 8px | Antar elemen dalam baris yang sama |
| **MD** | `gap-3` / `p-3` | 12px | Antar item dalam list, card compact |
| **LG** | `gap-4` / `p-4` | 16px | **Default** — antar card, padding card |
| **XL** | `gap-5` / `p-5` | 20px | Padding modal, antar section |
| **2XL** | `gap-6` / `p-6` | 24px | Antar grup section, page margin |

### Aturan Padding

| Komponen | Padding |
|----------|---------|
| **Card standar** | `p-4` |
| **Card compact** (list item) | `p-3` |
| **Modal content** | `p-5` |
| **Auth form** | `p-8` |
| **Input field** | `px-3 py-2` |
| **Button** | `px-4 py-2` atau `px-5 h-10` |
| **Icon button** | `p-2` |

### Aturan Gap

| Konteks | Gap |
|---------|-----|
| Antar card dalam grid | `gap-3` atau `gap-4` |
| Antar form field | `space-y-3` atau `space-y-4` |
| Antar section dalam page | `space-y-4` |
| Antar item dalam flex row | `gap-1.5` hingga `gap-2` |
| Antara header dan content card | `gap-1` hingga `gap-2` |

### Aturan Margin
- **Tidak menggunakan margin pada komponen.** Gunakan gap pada parent.
- **Margin-bottom (`mb-`)** hanya digunakan untuk elemen yang benar-benar membutuhkan, seperti judul section.
- **Margin antar page section:** `pt-4` untuk padding top halaman.

---

## 6. Iconography

### Library
**Lucide React** — ikon konsisten, stroke-based, weight 1.5 default.

### Size Guidelines

| Konteks | Size Class | Pixel |
|---------|------------|-------|
| **Bottom nav** | `w-5 h-5` | 20px |
| **Grid menu icon** | `w-5 h-5` | 20px |
| **Button icon** (with text) | `w-4 h-4` | 16px |
| **Icon button** (standalone) | `w-4 h-4` hingga `w-5 h-5` | 16–20px |
| **KPI card icon** | `w-4 h-4` | 16px |
| **Inline indicator** | `w-3 h-3` hingga `w-4 h-4` | 12–16px |
| **Avatar / Profile** | `w-5 h-5` hingga `w-7 h-7` | 20–28px |
| **Alert / Warning** | `w-4 h-4` | 16px |

### Aturan Penggunaan

| Situasi | Ikon Wajib? | Aturan |
|---------|-------------|--------|
| **Tombol navigasi** | ✅ Ya | Setiap tombol di grid menu harus punya ikon |
| **Tombol aksi** | ✅ Ya | Tombol dengan teks harus punya ikon di kiri |
| **Tab navigasi** | ✅ Ya | Setiap tab harus punya ikon + label |
| **Status badge** | ✅ Ya | Status LUNAS/DP/BATAL harus punya ikon |
| **KPI card** | ✅ Ya | Setiap KPI harus punya ikon pembeda |
| **Empty state** | ✅ Ya | Ilustrasi ikon besar (w-12 h-12) |
| **Alert/notification** | ✅ Ya | AlertTriangle, Bell, dll. |
| **Form label** | ❌ Tidak | Cukup teks |
| **Tombol "X" close** | ✅ Ya | Wajib untuk modal/dialog |
| **Back button** | ✅ Ya | ArrowLeft ukuran w-5 h-5 |

### Aturan Warna Ikon
- **Ikon dalam tombol gradient:** `text-white`
- **Ikon dalam tombol ghost:** Warna sesuai konteks (primary, danger, dll.)
- **Ikon KPI:** Warna sesuai konteks (emas untuk warning, biru untuk info)
- **Ikon grid menu:** Selalu `text-white` di atas background gradient `w-10 h-10 rounded-xl`
- **Ikon inline:** `text-slate-400` hingga `text-slate-500`

### Ikon Tetap per Entitas

| Entitas | Ikon | Lucide Name |
|---------|------|-------------|
| Kasir / POS | 🛒 | `ShoppingCart` |
| Barang / Inventory | 📦 | `Package` |
| Pelanggan / CRM | 👥 | `Users` |
| Cashflow | 💳 | `Wallet` |
| Dompet | 👛 | `Wallet` (variant) |
| Transaksi | 📋 | `Receipt` |
| Laporan | 📊 | `BarChart3` |
| Produksi | 🏭 | `ClipboardList` |
| Supplier | 🚚 | `Truck` |
| Pembelian (PO) | 📝 | `ClipboardList` |
| Pengaturan | ⚙️ | `Settings` |
| User | 👤 | `User` |
| Sedekah | ❤️ | `Heart` |
| Transfer | ↔️ | `ArrowLeftRight` |

---

## 7. Button System

### Primary Button
Penggunaan: Aksi utama halaman (simpan, checkout, bayar, submit).
```
Contoh:
"bg-gradient-to-r from-[#008CEB] to-[#00C9A7] text-white font-extrabold
 text-xs rounded-xl px-5 py-2.5 shadow-lg active:scale-[0.98]
 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
```
Hover: `shadow-lg` meningkat.  
Disabled: `opacity-50`, `cursor-not-allowed`.

### Secondary Button
Penggunaan: Aksi alternatif (batal, kembali, filter).
```
Contoh:
"bg-white dark:bg-[#131527] rounded-xl border border-slate-200/60
 dark:border-slate-800/60 text-xs font-bold px-4 py-2
 active:scale-[0.98] transition-all"
```

### Danger Button
Penggunaan: Aksi destructive (hapus, reset, batalkan transaksi).
```
Contoh:
"bg-gradient-to-r from-rose-500 to-red-600 text-white font-bold
 text-xs rounded-xl px-4 py-2 active:scale-[0.98] transition-all"
```
Variant ghost: `"text-rose-500 text-xs font-bold hover:text-rose-600"`

### Ghost Button
Penggunaan: Aksi ringan dalam card (edit, lihat detail).
```
Contoh:
"text-[#008CEB] text-xs font-bold hover:underline"
"text-slate-500 text-[10px] font-bold hover:text-slate-700"
```

### Icon Button (standalone)
Penggunaan: Back navigation, close modal, toggle.
```
Contoh:
"p-2 bg-white dark:bg-[#131527] rounded-full shadow-md
 active:scale-95 transition-transform"
```
Size: Ikuti container. Standard `w-8 h-8` atau `w-10 h-10`.

### Floating Action Button (FAB)
Penggunaan: Aksi utama halaman di mobile — pojok kanan bawah.
```
Contoh:
"w-12 h-12 rounded-2xl bg-gradient-to-br from-[#008CEB] to-[#00C9A7]
 text-white shadow-lg shadow-[#008CEB]/20 active:scale-95
 transition-all flex items-center justify-center"
```

### Loading Button
Saat `isProcessing === true`:
- Button menjadi `disabled`
- Teks berubah menjadi "Menyimpan..." atau spinner
- `disabled:opacity-50` tetap berlaku

### Disabled Button
`disabled:opacity-50 cursor-not-allowed`

### Aturan Universal
- **Semua button memiliki `active:scale-[0.98]`** atau `active:scale-95` — feedback fisik.
- **Semua button memiliki `transition-all`** — animasi halus.
- **Icon dalam button** (jika ada): `w-4 h-4`, di kiri teks dengan `gap-2`.
- **Touch target minimal 44px** (iOS HIG) — jika teks saja terlalu kecil, tambah padding.
- **Teks button menggunakan font-heading** untuk konsistensi.

---

## 8. Form System

### Input Text
```
Format standar:
"w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-zinc-800
 focus:outline-none"

Format auth:
"w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200
 dark:border-slate-700 bg-white dark:bg-[#0F1926] text-sm
 focus:outline-none focus:ring-2 focus:ring-[#008CEB]/40"
```

Aturan:
- Background: `bg-slate-100 dark:bg-zinc-800` (kartu) atau `bg-white` (auth)
- Focus: `outline-none` + `ring-2 ring-[#008CEB]/40` (atau border styling)
- Padding: `px-3 py-2` (default), `h-11` (auth)
- Font: `text-xs` (default), `text-sm` (auth)
- Border radius: `rounded-xl` (default), `rounded-lg` (compact)
- Wajib ada label di atas input (kecuali search)

### Textarea
Sama dengan input text, tambahkan `resize-none` atau `resize-vertical` sesuai kebutuhan.
```
"w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-zinc-800
 focus:outline-none resize-none min-h-[80px]"
```

### Select
Menggunakan `<select>` native atau custom dropdown.
```
"w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-zinc-800
 focus:outline-none appearance-none"
```
Arrow icon `ChevronDown` di pojok kanan (absolute position).

### Checkbox / Radio
- Checkbox: `rounded` dengan border `border-slate-300`
- Radio: `rounded-full` dengan border `border-slate-300`
- Checked: Background `bg-[#008CEB]` dengan icon `Check` putih

### Switch / Toggle
```
Track: "w-9 h-5 rounded-full p-0.5 transition-colors"
Thumb: "w-4 h-4 rounded-full bg-white shadow-sm transition-transform"
```

### Currency Input
Format yang konsisten dengan `formatCurrency()` dari `@/lib/currency`.
- Input numeric dengan `type="number"` atau `inputMode="decimal"`
- Prepend "Rp" atau "$" sebagai label

### Aturan Universal
- **Setiap input wajib memiliki label** (`text-xs font-bold`).
- **Helper text** (`text-[10px] text-slate-400`) opsional di bawah input.
- **Error state**: border merah (`border-rose-500`) + pesan error di bawah.
- **Placeholder** menggunakan `text-slate-400`.
- **Gap antar form field**: `space-y-3`.

---

## 9. Table System

### Wajib

| Fitur | Keterangan |
|-------|------------|
| **Search** | Input search di atas tabel. Minimal `w-full` dengan ikon `Search`. |
| **Filter** | Filter berdasarkan status, tipe, kategori, atau kolom relevan. |
| **Sort** | Sorting minimal ascending/descending. Indikator panah. |
| **Pagination** | Jika data >20 item. "Muat lebih banyak" atau nomor halaman. |
| **Empty State** | Ilustrasi + pesan + tombol aksi jika data kosong. |
| **Loading State** | SkeletonCard selama data dimuat. |

### Opsional

| Fitur | Keterangan |
|-------|------------|
| **Bulk Action** | Pilih multiple item untuk aksi massal (hapus, export). |
| **Export** | Tombol export CSV/Excel/PDF di header tabel. |

### Row Style
- **Alternating rows** — tidak digunakan. Setiap row adalah card terpisah.
- **Hover row** — `hover:bg-slate-50 dark:hover:bg-zinc-800/50`
- **Clickable row** — cursor pointer, active scale press.

### Empty State Pattern
```
<div className="flex flex-col items-center justify-center py-8 text-center">
  <Icon className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
  <p className="text-xs font-bold text-slate-500">Belum ada data</p>
  <p className="text-[10px] text-slate-400 mt-1">Tambahkan data baru untuk memulai</p>
</div>
```

### Loading State Pattern
```
{_data === undefined ? (
  <SkeletonCard count={5} />
) : (
  // actual content
)}
```

---

## 10. Card System

### KPI Card
```
<Card dengan bg-white/transparent, border-b subtle, icon di kiri,
     nilai besar di kanan, label kecil di bawah nilai>
```
Menampilkan: Ikon (w-4 h-4) + Nilai (text-lg font-extrabold) + Label (text-[10px]).

### Statistic Card
```
<Card dengan gradient background subtle, satu angka besar di tengah,
     label di bawah, dan delta (naik/turun) di pojok>
```
Menampilkan: Angka utama + Label + Delta persentase + Ikon trending.

### Summary Card
```
<Card standar p-4 dengan border, header (ikon+judul), content>
```
Untuk ringkasan data, recent transactions, daftar item.

### Info Card
```
<Card dengan bg-[#008CEB]/5 dark:bg-[#008CEB]/10 border-l-4 border-[#008CEB],
     ikon info di kiri, teks penjelasan>
```
Untuk tip, informasi, panduan.

### Warning Card
```
<Card dengan bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-700/40>
```
Untuk alert stok menipis, piutang jatuh tempo.

### Action Card
```
<Card clickable (cursor pointer), hover effect (shadow meningkat),
     panah ">" di kanan, label di kiri>
```
Untuk navigasi grid, menu item.

### Aturan Universal
- **Semua card menggunakan `premium-card`** class CSS.
- **Card clickable menambahkan `premium-card-glow`** untuk hover glow effect.
- **Padding card:** `p-4` (default), `p-3` (compact), `p-5` (modal).
- **Gap antara card dalam grid:** `gap-3`.

---

## 11. Modal System

### Confirmation Modal
```
Header: Judul "Konfirmasi"
Content: Pesan penjelasan
Actions: "Batal" (secondary) + "Ya, Hapus" (danger)
Width: max-w-sm
Backdrop: bg-black/50 z-50
```

### Delete Modal
```
Header: Judul "Hapus [Entity]" dengan ikon AlertTriangle
Content: "Apakah yakin menghapus [nama]? Tindakan ini tidak bisa dibatalkan."
Actions: "Batal" + "Hapus" (danger button)
Width: max-w-sm
```

### Edit / Form Modal
```
Header: Judul "[Tambah/Edit] [Entity]" dengan tombol X
Content: Form fields
Actions: "Simpan" (primary, full-width atau di kanan)
Width: max-w-sm
```

### Preview Modal
```
Header: Judul + tombol X
Content: Data read-only dalam format card/list
Actions: Opsional (print, export, edit)
Width: max-w-md
```

### Detail Modal (Expanded)
```
Header: Judul + tombol X
Content: Detail lengkap dalam beberapa section
Actions: Edit, Hapus, dll.
Width: max-w-md atau max-w-lg
```

### Aturan Universal
- **Backdrop:** `fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4`
- **Content wrapper:** `bg-white dark:bg-[#131527] w-full max-w-sm rounded-2xl p-5 space-y-4 shadow-2xl`
- **Close button:** Tombol `X` di pojok kanan header, `p-1 rounded-full bg-slate-100 dark:bg-zinc-800`
- **Enter animation:** Framer Motion `initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}`
- **Click outside to close:** `onClick={onClose}` di backdrop, `e.stopPropagation()` di content
- **Trap focus** — tab loop di dalam modal (belum diimplementasikan — rekomendasi)

---

## 12. Feedback System

### Loading State
**Sebelum data tersedia:** Gunakan `SkeletonCard count={5}` untuk daftar, `SkeletonLine` untuk text singkat.
**Saat aksi:** Button menjadi `disabled` dengan teks "Menyimpan..." atau spinner `animate-spin`.

### Toast Notification
**Library:** `react-hot-toast` via `showToast` wrapper.
```
Style: fontSize: "13px", fontWeight: 600, borderRadius: "12px", padding: "10px 16px"
Position: top-center
Duration: 3000ms
```

| Tipe | Warna | Ikon | Contoh |
|------|-------|------|--------|
| **Success** | Hijau | ✅ | "Transaksi berhasil!" |
| **Error** | Merah | ❌ | "Gagal menyimpan data" |
| **Loading** | Biru | ⏳ | "Menyimpan..." |

### Alert / Inline Error
Gunakan card dengan warna danger:
```
<div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40">
  <p className="text-xs font-bold text-rose-600 dark:text-rose-400">Pesan error</p>
</div>
```

### Empty State
Setiap halaman yang menampilkan daftar harus memiliki empty state:
```
<div className="flex flex-col items-center justify-center py-12 text-center">
  <Ikon className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
  <p className="text-xs font-bold text-slate-500">Belum ada [entity]</p>
  <p className="text-[10px] text-slate-400 mt-1">Tambahkan [entity] baru untuk memulai</p>
  <button className="mt-4 btn-primary">+ Tambah [Entity]</button>
</div>
```

### Error State
```
<div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20">
  <p className="text-xs font-bold text-rose-600">Terjadi kesalahan</p>
  <p className="text-[10px] text-rose-500 mt-1">{errorMessage}</p>
  <button onClick={retry} className="mt-2 text-xs font-bold text-[#008CEB]">Coba lagi</button>
</div>
```

### Skeleton
```
Komponen: <SkeletonCard count={n} />
           <SkeletonLine />
           <SkeletonCircle size="w-10 h-10" />
Style: bg-slate-200 dark:bg-zinc-700 rounded animate-pulse
```

---

## 13. Dashboard Rules

Setiap halaman dashboard wajib memiliki:

### Header
- **Judul halaman** — `text-lg font-extrabold` (kiri)
- **Back button** — Jika bukan halaman root (ArrowLeft, `w-5 h-5`, rounded-full, shadow-md)
- **Action button** — Tambah, filter, atau settings (kanan)

### Quick Actions
- **FAB** di pojok kanan bawah (mobile) — tombol "+" untuk aksi utama
- **Speed dial** — FAB expandable untuk multi-aksi

### KPI Cards
- **Maksimal 4 KPI** per baris (2 kolom di mobile, 4 di desktop)
- **Setiap KPI:** Ikon (w-4 h-4) + Nilai (text-lg font-extrabold) + Label (text-[10px])
- **KPI clickable** → navigasi ke halaman detail

### Chart
- **7-day cashflow trend** — AreaChart dari recharts
- **Per-branch comparison** — BarChart (di owner dashboard)
- **Tooltip** — Custom tooltip dengan format rupiah

### Recent Activity
- **5 transaksi terakhir** — list vertical
- **Setiap item:** Ikon + Nama + Nominal + Waktu

### Notification Section
- **Alert stok menipis** — card kuning dengan daftar produk
- **Piutang jatuh tempo** — card merah dengan daftar
- **Badge di ikon bel** — jumlah notifikasi

---

## 14. Responsive Rules

### Breakpoints

| Device | Width | Layout |
|--------|-------|--------|
| **Mobile** | < 768px | Bottom navigation, single column, full-width cards |
| **Tablet** | 768px - 1024px | Bottom navigation atau sidebar collapsed, 2 column grid |
| **Desktop** | > 1024px | Sidebar (fixed, 240px), multi-column, max-width container |

### Mobile (< 768px)
- Bottom navigation 5 item
- Single column layout
- Card full-width
- FAB di pojok kanan bawah
- Modal full-width dengan `mx-4`
- Bottom sheet untuk form
- Thumb zone: semua tombol aksi di bagian bawah layar
- Safe area: `pt-safe`, `pb-safe`, `h-safe-screen`

### Tablet (768px - 1024px)
- Bottom navigation atau sidebar collapsed (hamburger menu)
- 2 column grid untuk card
- Modal dengan `max-w-md`
- Sidebar bisa di-toggle

### Desktop (> 1024px)
- Sidebar kiri fixed (240px)
- Content area: sisa lebar, max-width 1200px
- 3-4 column grid untuk card
- Hover state untuk semua interaktif elemen
- Keyboard shortcuts aktif
- Full breadcrumb

### Aturan Universal
- **Gunakan `max-w-md mx-auto`** untuk mobile container.
- **Gunakan grid responsive:** `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`.
- **Jangan sembunyikan konten penting di desktop** — hanya adaptasi layout.
- **Touch target 44x44px** di semua device.

---

## 15. Accessibility

### Keyboard Navigation
| Action | Shortcut |
|--------|----------|
| **Global Search** | `CTRL+K` / `CMD+K` |
| **Submit form** | `Enter` (dalam input) |
| **Close modal** | `Escape` |
| **Submit (override)** | `CTRL+Enter` / `CMD+Enter` |
| **Navigasi tabel** | Arrow Up/Down |
| **Pilih item** | `Enter` / `Space` |

### Focus State
- **Semua elemen interaktif** memiliki focus ring: `focus:outline-none focus:ring-2 focus:ring-[#008CEB]/40`
- **Modal** trap focus di dalam modal
- **Skip to content** link untuk screen reader

### Color Contrast
| Kombinasi | Ratio | WCAG |
|-----------|-------|------|
| Text putih di atas #008CEB | ~4.5:1 | AA |
| Text #008CEB di atas putih | ~4.5:1 | AA |
| Text slate-900 di atas putih | ~12:1 | AAA |
| Text slate-400 di atas putih | ~3:1 | ⚠️ Hanya untuk non-esensial |

### Screen Reader
- **Ikon dekoratif:** `aria-hidden="true"`
- **Ikon fungsional:** `aria-label` deskriptif
- **Tombol ikon:** Judul atau aria-label
- **Status dinamis:** `role="status"` atau `aria-live="polite"` untuk toast
- **Loading:** `aria-busy="true"`

---

## 16. Component Inventory

Daftar komponen UI yang harus dibuat (diekstrak dari pola yang sudah ada):

### Foundation
| # | Komponen | Status Sekarang | Deskripsi |
|---|----------|----------------|-----------|
| 1 | **Button** | ❌ Inline di 39 tempat | Primary, Secondary, Danger, Ghost, Icon, Loading |
| 2 | **Input** | ❌ Inline di 50+ tempat | Text, Number, Currency, Search |
| 3 | **Select** | ❌ Inline | Native select dengan styling |
| 4 | **Textarea** | ❌ Inline | Multi-line input |
| 5 | **Toggle/Switch** | ❌ Inline | Boolean toggle |
| 6 | **Badge** | ❌ Inline | Status badge (LUNAS, DP, BATAL) |
| 7 | **Avatar** | ❌ Inline | Profile photo atau inisial |
| 8 | **Divider** | ❌ Inline | Pemisah horizontal |

### Surface
| # | Komponen | Status Sekarang | Deskripsi |
|---|----------|----------------|-----------|
| 9 | **Card** | ✅ `premium-card` class | Base card container |
| 10 | **KpiCard** | ❌ Inline | KPI metric display |
| 11 | **StatCard** | ❌ Inline | Statistic with delta |
| 12 | **WarningCard** | ❌ Inline | Alert/peringatan card |
| 13 | **ActionCard** | ❌ Inline | Clickable navigation card |
| 14 | **Modal** | ❌ Inline di 17 tempat | Confirmation, Form, Preview |
| 15 | **BottomSheet** | ❌ 1 tempat | Mobile form container |
| 16 | **Drawer** | ❌ Belum ada | Side drawer untuk menu desktop |

### Navigation
| # | Komponen | Status Sekarang | Deskripsi |
|---|----------|----------------|-----------|
| 17 | **BottomNav** | ✅ `bottom-nav.tsx` | 5 item bottom navigation |
| 18 | **Sidebar** | ❌ Belum ada | Desktop sidebar |
| 19 | **Breadcrumb** | ❌ Belum ada | Breadcrumb trail |
| 20 | **Tabs** | ❌ Inline | Tab navigation pill |
| 21 | **SearchBar** | ❌ Inline | Input dengan ikon search |
| 22 | **GlobalSearch** | ❌ Belum ada | CTRL+K command palette |
| 23 | **FAB** | ❌ Belum ada | Floating action button |
| 24 | **BackButton** | ❌ Inline di 24 tempat | ArrowLeft icon button |

### Data Display
| # | Komponen | Status Sekarang | Deskripsi |
|---|----------|----------------|-----------|
| 25 | **Table** | ❌ Inline | Data table with search/filter |
| 26 | **Pagination** | ❌ Inline | Page navigation |
| 27 | **EmptyState** | ❌ Inline | Ilustrasi + pesan + aksi |
| 28 | **LoadingState** | ✅ `SkeletonCard` | Skeleton placeholder |
| 29 | **ErrorState** | ❌ Inline | Error + retry button |
| 30 | **Accordion** | ❌ Inline | Expand/collapse section |
| 31 | **Timeline** | ❌ Inline | Activity/event timeline |

### Feedback
| # | Komponen | Status Sekarang | Deskripsi |
|---|----------|----------------|-----------|
| 32 | **Toast** | ✅ `showToast` | Success/error/loading toast |
| 33 | **Alert** | ❌ Inline | Inline alert banner |
| 34 | **Tooltip** | ❌ Belum ada | Hover tooltip |
| 35 | **ProgressBar** | ❌ Inline | Progress indicator |
| 36 | **Spinner** | ❌ Inline | Loading spinner |

### Business-Specific
| # | Komponen | Status Sekarang | Deskripsi |
|---|----------|----------------|-----------|
| 37 | **ChartCard** | ❌ Inline | Recharts wrapper card |
| 38 | **InvoiceA4** | ✅ `invoice-a4.tsx` | Invoice print layout |
| 39 | **Kanban** | ❌ Inline | Production status board |
| 40 | **LabelPicker** | ❌ Inline | Color label selector |
| 41 | **BarcodeScanner** | ✅ `barcode-scanner.tsx` | Camera barcode scanner |
| 42 | **Calculator** | ✅ `kalkulator-harga.tsx` | Price calculator |
| 43 | **NotificationBell** | ❌ Inline | Bell with badge |

---

## 17. Kesimpulan

### Bagaimana Design System Menjaga Konsistensi

**1. Satu sumber kebenaran visual.** Seluruh aturan warna, tipografi, spacing, dan komponen didokumentasikan di sini. Developer tidak perlu menebak-nebak ukuran font atau warna yang tepat.

**2. Pola yang sudah ada → komponen formal.** Saat ini Button Primary ditulis inline di 39 tempat, Modal di 17 tempat, BackButton di 24 tempat. Dengan Design System, semua ini menjadi komponen reusable — kode lebih pendek, konsisten, dan mudah diubah.

**3. Role-based dan responsive.** Aturan navigasi dan layout sudah mempertimbangkan role pengguna (kasir vs owner) dan device (mobile vs desktop). Konsistensi bukan berarti seragam — tapi adaptif dengan aturan yang jelas.

**4. Aksesibilitas built-in.** Aturan keyboard navigation, focus state, color contrast, dan screen reader sudah menjadi bagian dari sistem — bukan tambahan di akhir.

**5. Dokumentasi hidup.** Dokumen ini harus diperbarui setiap kali ada komponen baru atau perubahan aturan visual. Design System yang tidak dijaga sama saja tidak memiliki Design System.

### Key Takeaways

| Aspek | Tanpa Design System | Dengan Design System |
|-------|--------------------|--------------------|
| **Button Primary** | 39 implementasi inline, 3 variasi berbeda | 1 komponen `<Button variant="primary" />` |
| **Modal** | 17 implementasi, struktur mirip tapi tidak identik | 1 komponen `<Modal>` dengan props |
| **Card** | 136 penggunaan `premium-card` class (konsisten ✅) | Tetap pertahankan, tambahkan varian komponen |
| **Back button** | 24 tempat, 2 variasi ukuran | 1 komponen `<BackButton href="..." />` |
| **Skeleton** | 5 tempat dengan `SkeletonCard` (konsisten ✅) | Tetap pertahankan |
| **Toast** | 1 wrapper `showToast` di 24 tempat (konsisten ✅) | Tetap pertahankan |
| **Warna** | Berbasis Tailwind utility class dengan CSS vars | Dijaga konsisten via CSS variables |
| **Font** | 2 font via `next/font` | Sudah konsisten ✅ |

### Rekomendasi Prioritas Ekstraksi Komponen

| Fase | Komponen | Estimasi | Dampak Konsistensi |
|:----:|----------|:--------:|:------------------:|
| 🔴 **Fase 1** | Button, Modal, BackButton, Input, Select | 4 jam | ⭐⭐⭐ Menghilangkan 100+ implementasi inline |
| 🟡 **Fase 2** | Badge, Tabs, SearchBar, Card (varian), KpiCard | 3 jam | ⭐⭐⭐ Standarisasi 5 pola paling sering |
| 🟢 **Fase 3** | EmptyState, ErrorState, Pagination, ProgressBar | 2 jam | ⭐⭐ UX konsisten di semua halaman |
| 🔵 **Fase 4** | Sidebar, Breadcrumb, GlobalSearch, FAB, Drawer | 4 jam | ⭐ Navigasi baru (desktop) |
| ⚪ **Fase 5** | Alert, Tooltip, Accordion, Avatar, Divider | 2 jam | ⭐ Pelengkap |

---

*Dokumen Design System ini berdasarkan analisis kode yang ada. Tidak ada source code yang diubah.*
