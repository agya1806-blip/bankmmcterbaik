# LAPORAN AUDIT & PRODUCTION HARDENING

## 1. TEMUAN SELAMA AUDIT

### KRITIS — Keamanan
| # | Temuan | Severity | File |
|---|--------|----------|------|
| 1 | **PIN hashing SHA-256 tanpa salt** — rentan rainbow table attack | KRITIS | `src/lib/crypto.ts` |
| 2 | **Forgot PIN tanpa verifikasi identitas** — siapapun bisa reset PIN hanya dengan tahu username | KRITIS | `src/app/(auth)/forgot-pin/page.tsx` |
| 3 | **AuthService.login() membandingkan hash vs plaintext** — `user.pinHash !== pin` | KRITIS | `src/services/auth/AuthService.ts:37` |
| 4 | **AuthService.register() menyimpan PIN plaintext** — `pinHash: data.pin` | KRITIS | `src/services/auth/AuthService.ts:48` |
| 5 | **AuthService.changePin() menyimpan PIN plaintext** — `pinHash: newPin` | TINGGI | `src/services/auth/AuthService.ts:80` |
| 6 | **Tidak ada route protection** — halaman dashboard bisa diakses tanpa login | TINGGI | `src/components/layout/app-shell.tsx` |
| 7 | **Session tersimpan di localStorage plaintext** — tidak ada enkripsi | SEDANG | `src/store/useSessionStore.ts` |

### KRITIS — Database
| # | Temuan | Severity | File |
|---|--------|----------|------|
| 8 | **Versi DB deklarasi tidak urut** — v6, v5, v4, v3, v7 (harus ascending) | TINGGI | `src/lib/db-v4.ts` |
| 9 | **recurringTemplates hilang dari v7 schema** — tidak dibuat untuk instalasi baru | TINGGI | `src/lib/db-v4.ts` |

### SEDANG — Performa & Arsitektur
| # | Temuan | Severity | File |
|---|--------|----------|------|
| 10 | **useLiveQuery polling 2 detik** — 15+ halaman polling setiap 2s | SEDANG | `src/hooks/useLiveQuery.ts` |
| 11 | **Zustand persist write setiap event** — `updateActivity()` dipanggil ribuan kali | RENDAH | `src/components/layout/inactivity-wrapper.tsx` |
| 12 | **Skeleton component duplikat** — dua file skeleton.tsx dengan fungsi mirip | RENDAH | `src/components/skeleton.tsx` + `src/components/ui/skeleton.tsx` |
| 13 | **Dependency tidak terpakai** — @base-ui/react, idb, shadcn, class-variance-authority | RENDAH | `package.json` |
| 14 | **src/utils/ kosong** — direktori tidak berfungsi | RENDAH | `src/utils/` |
| 15 | **PWA icons tidak ada** — manifest.json referensi icon yang tidak ada | RENDAH | `public/manifest.json` |
| 16 | **Tidak ada service worker** — tidak ada offline cache | RENDAH | — |
| 17 | **Tidak ada error pages** — 404, 500, offline page missing | RENDAH | — |

---

## 2. BUG YANG DIPERBAIKI

| # | Bug | Fix |
|---|-----|-----|
| 1 | PIN disimpan sebagai SHA-256 tanpa salt | Upgrade ke PBKDF2 + salt acak (16 byte) + 100.000 iterasi, kompatibel backward dengan legacy SHA-256 hash |
| 2 | Forgot PIN tanpa verifikasi | Tambah step verifikasi: user harus masukkan PIN lama yang valid sebelum bisa reset |
| 3 | `pinHash !== pin` (hash vs plaintext) | Ganti dengan `await verifyPin(pin, user.pinHash)` |
| 4 | `pinHash: data.pin` menyimpan plaintext | Ganti dengan `pinHash: await hashPin(data.pin)` |
| 5 | `pinHash: newPin` menyimpan plaintext di changePin | Ganti dengan `pinHash: await hashPin(newPin)` |
| 6 | Versi DB deklarasi tidak urut (v6→v5→v4→v3→v7) | Reorder ke ascending (v3→v4→v5→v6→v7) |
| 7 | recurringTemplates tidak ada di v7 schema | Tambah ke v7 schema |
| 8 | useLiveQuery polling agresif (2s) | Ganti ke perubahan-based + fallback 10s polling; tambah error handling |
| 9 | Zustand persist menulis pada setiap interaksi | Throttle 30 detik di inactivity-wrapper |
| 10 | AppShell tidak redirect unauthenticated user | Tambah redirect logic dengan hydration-safe initializing state |
| 11 | Zustand initial state tidak handle hydration | Tambah `isInitializing: true` + `onRehydrateStorage` callback |
| 12 | Skeleton component duplikat | Konsolidasi ke `components/ui/skeleton.tsx`, hapus `components/skeleton.tsx`, update 4 imports |

---

## 3. FILE YANG DIREFACTOR

| File | Perubahan |
|------|-----------|
| `src/lib/crypto.ts` | Full rewrite: SHA-256 → PBKDF2 with salt, 100k iterasi, backward compatible |
| `src/lib/db-v4.ts` | Reorder version declarations (ascending), add recurringTemplates to v7 |
| `src/services/auth/AuthService.ts` | Fix 3 PIN handling bugs + import verifyPin/hashPin |
| `src/hooks/useLiveQuery.ts` | Replace polling with Dexie changes event + fallback 10s interval + error handling |
| `src/store/useSessionStore.ts` | Add `isInitializing: true` default + `onRehydrateStorage` callback |
| `src/components/layout/app-shell.tsx` | Add route redirection logic + hydration-safe loading state |
| `src/components/layout/inactivity-wrapper.tsx` | Throttle activity updates to 30s intervals |
| `src/components/ui/skeleton.tsx` | Added SkeletonLine, SkeletonCircle exports |
| `src/components/ui/index.ts` | Added SkeletonCard, SkeletonLine, SkeletonCircle exports |
| `src/app/(auth)/forgot-pin/page.tsx` | Added current PIN verification step |
| `src/package.json` | Removed 4 unused dependencies |
| `public/manifest.json` | Updated icons reference + theme_color |

---

## 4. FILE YANG DIHAPUS

| File | Alasan |
|------|--------|
| `src/components/skeleton.tsx` | Duplikat dari `src/components/ui/skeleton.tsx` |
| `src/utils/` (direktori) | Kosong, tidak berfungsi |

---

## 5. FILE BARU

| File | Tujuan |
|------|--------|
| `public/icon-192.svg` | PWA icon 192x192 |
| `public/icon-512.svg` | PWA icon 512x512 |
| `public/sw.js` | Service Worker untuk offline cache |
| `src/app/not-found.tsx` | Custom 404 page |
| `src/app/global-error.tsx` | Global error boundary (500) |
| `src/app/offline/page.tsx` | Offline page |
| `src/components/service-worker-register.tsx` | Client component untuk register SW |

---

## 6. OPTIMASI PERFORMA

| Optimasi | Dampak |
|----------|--------|
| **useLiveQuery polling 2s → reactive changes** | 15+ halaman × polling tiap 2s = ~30 query/detik → hanya query saat data berubah |
| **Throttle activity update 30s** | Zustand persist write dari ribuan kali/hari → ~2880 kali/hari (setiap 30s) |
| **Hapus 4 unused dependencies** | Bundle size lebih kecil, npm install lebih cepat (195 packages removed) |
| **Skeleton component deduplikasi** | Satu source of truth, bundle lebih kecil |
| **Service Worker cache** | Asset statis di-cache untuk offline loading |

---

## 7. OPTIMASI KEAMANAN

| Optimasi | Detail |
|----------|--------|
| **PIN hashing upgrade** | SHA-256 (tanpa salt) → PBKDF2 + salt 16-byte + 100,000 iterasi |
| **Forgot PIN verification** | Sebelumnya: hanya masukkan username → sekarang: verifikasi PIN lama dulu |
| **AuthService bug fixes** | 3 bugs diperbaiki (plaintext comparison, plaintext storage) |
| **Route protection** | AppShell redirect unauthenticated users ke /login |
| **Hydration-safe auth** | Initializing state prevents flash-of-unauthenticated-content |
| **Backward compat crypto** | verifyPin() mendeteksi legacy SHA-256 hash dan fallback otomatis |

---

## 8. OPTIMASI DATABASE

| Optimasi | Detail |
|----------|--------|
| **Version ordering fixed** | v3→v4→v5→v6→v7 ascending (sebelumnya v6→v5→v4→v3→v7) |
| **recurringTemplates in v7** | Table ditambahkan ke schema versi 7 untuk instalasi baru |
| **Indexes preserved** | Semua index yang ada dipertahankan |

---

## 9. OPTIMASI API

| Optimasi | Detail |
|----------|--------|
| **Tidak ada API eksternal** | Aplikasi 100% client-side (IndexedDB) |
| **Error handling useLiveQuery** | Try-catch ditambahkan, fallback empty array |
| **Single API route (/api/webhook)** | Sudah memiliki error handling yang baik |

---

## 10. REKOMENDASI PENGEMBANGAN TAHAP BERIKUTNYA

### Prioritas Tinggi
1. **Multi-device sync engine** — Implementasi sistem sinkronisasi cloud (REST API + WebSocket) agar data konsisten antar device
2. **Email/phone verification** — Tambah verifikasi identitas untuk registrasi dan forgot PIN
3. **Rate limiting** — Proteksi brute force pada login endpoint
4. **Account lockout** — Auto-lock setelah N gagal login

### Prioritas Sedang
5. **Unit test coverage** — Tambah unit test untuk service layer (auth, transaction pipeline, backup)
6. **E2E test** — Cypress/Playwright untuk critical paths (login → kasir → transaksi)
7. **Dexie sync** — Gunakan Dexie Cloud atau custom sync adapter untuk cloud backup
8. **Dark mode refinement** — Perbaiki kontras di mode gelap untuk accessibility

### Prioritas Rendah
9. **Analytics** — Tambah event tracking opsional (usage patterns)
10. **i18n** — Persiapan multi-bahasa (Inggris, Arab)
11. **Keyboard shortcuts** — Shortcuts untuk kasir (scan, bayar, dll)
12. **Accessibility audit** — WCAG compliance (screen reader, keyboard nav, contrast)

---

**Commit:** `0ac3dc8`
**Branch:** `main`
**Status:** Build success ✅ — 36 routes, 0 errors, 0 warnings
