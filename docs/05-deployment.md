# Tahap 6 — Deployment & Checklist Kesiapan Production

Target deployment: **Vercel** (aplikasi) + **Neon** (PostgreSQL serverless).
Kombinasi lain (Supabase, Railway, VPS) juga bisa selama menyediakan
PostgreSQL dan runtime Node.

---

## 1. Siapkan Database (Neon)

1. Buat project di [neon.tech](https://neon.tech), pilih region terdekat
   (mis. Singapore untuk Indonesia).
2. Salin dua connection string:
   - **Pooled** (untuk aplikasi runtime) → `DATABASE_URL`
   - **Direct** (untuk migrasi) → `DIRECT_URL` (opsional tapi disarankan)
3. Pastikan string mengandung `?sslmode=require`.

> Prisma sudah dikonfigurasi memakai `DATABASE_URL`. Bila memakai `DIRECT_URL`
> untuk migrasi, tambahkan `directUrl = env("DIRECT_URL")` pada blok
> `datasource` di `prisma/schema.prisma` sebelum deploy.

## 2. Siapkan Vercel Blob (foto tamu)

1. Vercel Dashboard → Storage → Create → **Blob**.
2. Salin token `BLOB_READ_WRITE_TOKEN`.

Tanpa token ini aplikasi tetap berjalan; upload foto akan ditolak dengan pesan
jelas dan foto memang bersifat opsional.

## 3. Siapkan Rate Limiting (disarankan)

1. Buat database **Redis** di [upstash.com](https://upstash.com) (REST enabled).
2. Salin `UPSTASH_REDIS_REST_URL` dan `UPSTASH_REDIS_REST_TOKEN`.

Tanpa Upstash, limiter jatuh ke mode in-memory yang **tidak aman untuk
serverless multi-instance** — endpoint login & kios bisa di-brute force lintas
instance. Wajib untuk go-live serius.

## 4. Deploy ke Vercel

1. Import repository ke Vercel.
2. Framework preset terdeteksi otomatis (Next.js).
3. Set Environment Variables (semua dari `.env.example`):
   - `DATABASE_URL` (wajib)
   - `AUTH_SECRET` (wajib) — `openssl rand -base64 32`
   - `APP_TIMEZONE` — `Asia/Jakarta` / `Asia/Makassar` / `Asia/Jayapura`
   - `NEXT_PUBLIC_APP_URL` — domain production (mis. `https://sibt.dishub.go.id`)
   - `BLOB_READ_WRITE_TOKEN`
   - `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
4. Deploy.

## 5. Inisialisasi Database Production

Sekali saja, dari mesin lokal yang `DATABASE_URL`-nya menunjuk ke DB production
(atau via Vercel CLI `vercel env pull`):

```bash
npx prisma migrate deploy     # terapkan seluruh migrasi
npx prisma db seed            # isi role, akun, master data, sample
```

> **Untuk production murni**, pertimbangkan menyunting `prisma/seed.ts` agar
> hanya membuat role + satu akun Super Admin (tanpa 120 sample tamu). Sample
> tamu berguna untuk demo/staging, bukan production.

## 6. Amankan Akun

Setelah seed, **segera**:
- Ganti kata sandi keempat akun demo (via menu Manajemen Pengguna atau langsung).
- Hapus/nonaktifkan akun yang tidak dipakai.
- Pastikan hanya ada akun Super Admin yang benar-benar diperlukan.

---

## Checklist Kesiapan Production

### Keamanan
- [ ] `AUTH_SECRET` acak & unik (bukan nilai contoh)
- [ ] Semua kata sandi akun demo sudah diganti
- [ ] `UPSTASH_REDIS_REST_*` diset (rate limit login & kios aktif lintas instance)
- [ ] `NEXT_PUBLIC_APP_URL` menunjuk domain production (QR kios benar)
- [ ] HTTPS aktif (otomatis di Vercel)
- [ ] Middleware RBAC & verifikasi `isActive` di server action aktif (bawaan)
- [ ] Tidak ada `.env` ter-commit (dicek `.gitignore`)

### Database
- [ ] `prisma migrate deploy` sukses di production
- [ ] Index case-insensitive nama master data terpasang (migrasi kedua)
- [ ] Backup otomatis DB aktif (Neon menyediakan PITR)
- [ ] Connection pooling dipakai (`DATABASE_URL` pooled)

### Fungsional (uji asap di production)
- [ ] Login tiap role → melihat menu sesuai RBAC
- [ ] Tambah tamu (dengan tanda tangan) → detail + QR muncul
- [ ] Scan QR kios → checkout mencatat jam keluar & durasi
- [ ] Export Excel & PDF (buku tamu + laporan) terunduh benar
- [ ] Import Excel + laporan error per-baris
- [ ] Master data: tambah, cegah duplikat, nonaktifkan, tolak hapus terreferensi
- [ ] Foto tamu ter-upload ke Blob (bila token diset)
- [ ] Activity log mencatat aksi

### Operasional
- [ ] Timezone (`APP_TIMEZONE`) sesuai lokasi kantor
- [ ] Foto/Blob storage punya kuota memadai
- [ ] Log error Vercel dipantau
- [ ] Rencana rotasi `AUTH_SECRET` bila diperlukan (memutus semua sesi)

### Non-fungsional
- [ ] `npm run build` sukses tanpa error
- [ ] `npm run typecheck` & `npm run lint` bersih
- [ ] Uji responsif di mobile (form tamu & tabel → card-view)
- [ ] Uji dark mode

---

## Catatan Runtime

- **PDF/Excel/bcrypt** berjalan di Node runtime (route handler & server action),
  bukan edge — sudah sesuai default Next.js. Middleware tetap edge-safe (tidak
  mengimpor Prisma/bcrypt).
- **Warning `jose`/Edge** saat build (CompressionStream) berasal dari Auth.js
  dan tidak berdampak fungsional.
- **Sisa 1 advisory `postcss`** melekat pada tooling build internal Next.js
  (bukan runtime); dipantau, lihat `docs/01` §8.
