# SIBT-DISHUB

**Sistem Informasi Buku Tamu Digital Dinas Perhubungan** — menggantikan buku
tamu kertas dengan pencatatan digital yang cepat (<60 detik/tamu), akurat, dan
terekam audit penuh.

Dibangun sebagai aplikasi Next.js 15 (App Router + Server Actions) dengan
PostgreSQL/Prisma, di-deploy ke Vercel.

---

## Fitur Utama

| Modul | Ringkasan |
|---|---|
| **Autentikasi & RBAC** | Auth.js v5 (Credentials + JWT), 4 role (Super Admin, Admin, Resepsionis, Kepala Dinas), proteksi route di middleware edge + verifikasi ulang di server action |
| **Dashboard** | Statistik hari/minggu/bulan/tahun, grafik kunjungan bulanan & per bidang, instansi terbanyak, tamu terakhir — konten menyesuaikan role |
| **Buku Tamu** | CRUD lengkap, nomor antrian otomatis reset harian (race-safe), tanda tangan digital, foto tamu (Vercel Blob), QR self-checkout, search+filter+pagination server-side, export Excel/PDF, import Excel |
| **Kios Self-Checkout** | Halaman publik `/kios/[token]` — tamu memindai QR untuk mencatat jam keluar & durasi otomatis |
| **Master Data** | Pegawai, Bidang, Instansi, Keperluan — validasi duplikasi case-insensitive, aktif/nonaktif, hapus aman (tolak bila direferensikan) |
| **Laporan** | Harian/mingguan/bulanan/tahunan/rentang tanggal + ringkasan statistik, export Excel/PDF, cetak |
| **Activity Log** | Jejak audit append-only, difilter Super Admin |
| **Manajemen Pengguna** | CRUD akun staf + role, hashing bcrypt (Super Admin) |
| **Pengaturan Sistem** | Konfigurasi key-value (Super Admin) |

Detail keputusan desain, matriks RBAC, ERD, dan wireframe ada di [`docs/`](./docs).

---

## Tech Stack

Next.js 15 · React 19 · TypeScript (strict) · Tailwind CSS + shadcn/ui ·
Prisma + PostgreSQL · Auth.js v5 · React Hook Form + Zod · TanStack Table ·
Recharts · Framer Motion · Sonner · Lucide · @react-pdf/renderer · ExcelJS ·
@vercel/blob · bcrypt · Upstash Ratelimit.

---

## Arsitektur

Clean Architecture per modul (vertical slice) di dalam Next.js App Router:

```
src/
├── app/          # routing (presentation tipis) — pages & route handlers
├── modules/      # fitur bisnis, tiap modul: domain / application / infrastructure / presentation
│   ├── guest/         master-data/  report/  user/  activity-log/  settings/  auth/  dashboard/
├── shared/       # kernel lintas-modul (prisma, auth, rbac, timezone, result, blob, rate-limiter)
├── components/   # ui/ (shadcn primitives) + layout/
└── middleware.ts # RBAC guard edge
```

Aturan: `app/**/page.tsx` tidak query DB langsung → selalu lewat Server Action
di `modules/*/presentation/actions.ts` → use case (`application`) → repository/
Prisma (`infrastructure`). Lihat [`docs/02-struktur-folder.md`](./docs/02-struktur-folder.md).

---

## Menjalankan Secara Lokal

### Prasyarat
- Node.js ≥ 20.9
- PostgreSQL 14+ berjalan lokal (atau connection string ke Neon/Supabase)

### Langkah

```bash
# 1. Install dependency
npm install

# 2. Siapkan environment
cp .env.example .env
#    lalu isi minimal DATABASE_URL dan AUTH_SECRET
#    (generate secret: openssl rand -base64 32)

# 3. Terapkan skema database + migrasi
npm run db:deploy         # atau: npm run db:migrate (untuk dev, membuat migrasi baru)

# 4. Isi data awal (akun tiap role + master data + 120 sample tamu)
npm run db:seed

# 5. Jalankan
npm run dev               # http://localhost:3000
```

### Akun Demo (dari seeder)

Semua akun memakai kata sandi **`Password123!`** — **WAJIB diganti sebelum
production**.

| Role | Email |
|---|---|
| Super Admin | `superadmin@dishub.go.id` |
| Admin | `admin@dishub.go.id` |
| Resepsionis | `resepsionis@dishub.go.id` |
| Kepala Dinas | `kadis@dishub.go.id` |

---

## Skrip NPM

| Skrip | Fungsi |
|---|---|
| `npm run dev` | Server pengembangan |
| `npm run build` | Build production |
| `npm run start` | Jalankan hasil build |
| `npm run lint` | ESLint |
| `npm run typecheck` | Pengecekan tipe TypeScript |
| `npm run db:migrate` | Buat & terapkan migrasi (dev) |
| `npm run db:deploy` | Terapkan migrasi (production/CI) |
| `npm run db:seed` | Isi data awal |
| `npm run db:studio` | Prisma Studio (GUI database) |

---

## Deployment

Panduan lengkap (Vercel + Neon) dan **checklist kesiapan production** ada di
[`docs/05-deployment.md`](./docs/05-deployment.md).

Ringkas:
1. Buat database PostgreSQL (Neon direkomendasikan) → set `DATABASE_URL`.
2. Import repo ke Vercel, set semua env var dari `.env.example`.
3. Buat Vercel Blob store → set `BLOB_READ_WRITE_TOKEN`.
4. (Disarankan) Buat Upstash Redis → set `UPSTASH_REDIS_REST_*` untuk rate limit.
5. Jalankan `prisma migrate deploy` + `prisma db seed` sekali pada database
   production, lalu **ganti semua kata sandi akun demo**.

---

## Dokumentasi

- [`docs/01-analisis-kebutuhan.md`](./docs/01-analisis-kebutuhan.md) — kebutuhan, keputusan, matriks RBAC
- [`docs/02-struktur-folder.md`](./docs/02-struktur-folder.md) — arsitektur
- [`docs/03-erd-dan-skema-database.md`](./docs/03-erd-dan-skema-database.md) — ERD & skema
- [`docs/04-wireframe.md`](./docs/04-wireframe.md) — wireframe
- [`docs/05-deployment.md`](./docs/05-deployment.md) — deployment & checklist production

---

## Lisensi

Dikembangkan untuk kebutuhan internal Dinas Perhubungan.
