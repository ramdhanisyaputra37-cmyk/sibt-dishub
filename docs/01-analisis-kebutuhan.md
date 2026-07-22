# Tahap 1 — Dokumen Analisis Kebutuhan
## SIBT-DISHUB — Sistem Informasi Buku Tamu Digital Dinas Perhubungan

Status: **Draft untuk disetujui** — tidak ada kode aplikasi yang ditulis sampai dokumen ini dikonfirmasi.

---

## 1. Ringkasan Eksekutif

SIBT-DISHUB menggantikan buku tamu kertas di Dinas Perhubungan dengan pencatatan
digital. Prioritas utama: **kecepatan input bagi resepsionis** (target < 60 detik
per tamu), **akurasi data** untuk pelaporan manajemen, dan **jejak audit penuh**
karena ini sistem instansi pemerintah.

Dibangun sebagai monolith Next.js 15 (App Router + Server Actions) dengan
PostgreSQL/Prisma, di-deploy ke Vercel. Tidak ada layanan backend terpisah.

## 2. Aktor Sistem

| Aktor | Autentikasi | Deskripsi singkat |
|---|---|---|
| Super Admin | Login | Kontrol penuh sistem, termasuk manajemen user & pengaturan |
| Admin | Login | Operasional harian: buku tamu, master data, laporan |
| Resepsionis | Login | Front-desk: input & edit tamu hari berjalan |
| Kepala Dinas | Login | Read-only: dashboard & laporan eksekutif |
| Tamu (kios) | **Tanpa login** | Memindai QR miliknya sendiri untuk self-checkout di halaman kios |

Kios bukan "role" dalam RBAC pengguna — ia adalah endpoint publik yang sangat
dibatasi (lihat §5.4), diakses dari perangkat kios/tablet di lobi, bukan akun.

---

## 3. Keputusan Terkunci

Poin berikut sudah diputuskan sebelumnya (lihat brief asli) dan **tidak dibuka
ulang** di sini — dicantumkan agar dokumen ini lengkap sebagai satu sumber
kebenaran.

| Area | Keputusan | Alasan singkat |
|---|---|---|
| Tanda tangan digital | Base64 PNG disimpan langsung di kolom `TEXT` database | Ukuran kecil (canvas garis), tidak butuh object storage terpisah |
| Foto tamu | Vercel Blob (`@vercel/blob`), bukan filesystem lokal | Vercel serverless = filesystem ephemeral, hilang tiap deploy/cold start |
| Password hashing | bcrypt, bukan argon2 | argon2 butuh native binding yang rawan gagal compile di serverless Vercel |
| QR Code | Berisi token kunjungan; dipindai di halaman kios untuk mencatat jam keluar otomatis & menghitung durasi | Self-checkout tanpa perlu resepsionis mengetik ulang |

---

## 4. Keputusan & Asumsi Tahap 1

Bagian ini adalah **inti** dari analisis — menjawab semua titik keputusan yang
diminta secara eksplisit di brief. Jika ada asumsi yang salah, koreksi sebelum
Tahap 2 dimulai karena beberapa akan sulit diubah setelah skema database dibuat.

### 4.1 Alur QR Code (detail)

1. Saat resepsionis submit form "Tambah Tamu", server membuat record `Guest`
   dengan `qrToken` (UUID acak, terpisah dari `id` primer sebagai lapisan
   keamanan tambahan — lihat §4.9).
2. Halaman detail/cetak tamu menampilkan QR yang meng-encode URL
   `https://<domain>/kios/{qrToken}` (di-generate di server dengan `qrcode`
   npm package saat render, tidak disimpan sebagai file gambar — QR selalu
   diturunkan ulang dari token, sehingga tidak ada storage tambahan).
3. QR dapat dicetak di tiket kunjungan/kartu, atau ditampilkan di layar untuk
   dipindai tamu sendiri.
4. Di halaman kios (`/kios/[token]`, **tanpa autentikasi**), tamu atau
   resepsionis memindai/membuka URL tsb → sistem menampilkan konfirmasi
   ringkas ("Konfirmasi checkout untuk Budi Santoso?") → submit menulis
   `checkOutTime = now()` dan mengubah `status` menjadi `SELESAI` bila belum
   final.
5. Endpoint kios menolak jika: token tidak ditemukan, kunjungan sudah
   checkout (`checkOutTime` sudah terisi), atau status sudah `DIBATALKAN`.
   Endpoint ini di rate-limit (§4.6) karena publik dan tanpa login.
6. Aksi checkout via kios dicatat di `activity_logs` dengan `userId = null`
   (aksi sistem/tamu, bukan staf) dan `entityType = "Guest"`.

### 4.2 Format & Generasi Nomor Antrian

Format: **`YYYYMMDD-XXXX`** (contoh `20260722-0007`), reset harian, 4 digit
zero-padded (kapasitas 9.999 tamu/hari — jauh di atas kebutuhan realistis satu
kantor Dishub).

Risiko konkurensi: dua resepsionis submit bersamaan tidak boleh menghasilkan
nomor antrian yang sama. Solusi: tabel bantu `daily_counters` (`date` unik +
`lastValue`) yang di-increment secara **atomik** lewat satu query
`INSERT ... ON CONFLICT (date) DO UPDATE SET last_value = last_value + 1
RETURNING last_value`. Ini menghindari pola *read-then-write* yang rentan
race condition. Detail query ada di use case Tahap 3, bukan di sini.

Timezone hari "reset" mengikuti `APP_TIMEZONE` (§4.11), bukan UTC naif.

### 4.3 Soft Delete vs Hard Delete vs Nonaktif — Kebijakan Final

| Entitas | Mekanisme "hapus" | Kolom | Siapa berwenang |
|---|---|---|---|
| `Guest` (buku tamu) | **Soft delete** | `deletedAt` | Admin, Super Admin (Resepsionis **tidak bisa** hapus) |
| `Employee`, `Department`, `Institution`, `Purpose` (master data) | **Nonaktifkan** (bukan hapus baris) | `isActive` | Admin, Super Admin |
| `User` | **Nonaktifkan** (login diblokir) | `isActive` | Super Admin saja |
| `ActivityLog` | **Tidak pernah dihapus** — append-only | — | Tidak ada aksi hapus di aplikasi |
| `Settings` | Update biasa, tanpa konsep hapus | — | Super Admin |

Alasan master data pakai `isActive` (bukan `deletedAt`): brief eksplisit
meminta "bukan hard delete jika sudah direferensikan" — dengan `isActive`,
data tetap satu baris yang sama (tidak ada ambiguitas soft-deleted-tapi-masih-
dipakai), muncul di dropdown autocomplete hanya saat aktif, tapi riwayat
kunjungan lama tetap menunjukkan nama instansi/pegawai yang benar.

Alasan `User` tidak pakai `deletedAt` terpisah: akun staf tidak pernah benar-
benar "dihapus" karena `activity_logs.userId` dan `guests.createdBy/updatedBy`
mereferensikannya untuk audit. `isActive = false` sudah merepresentasikan
"user dinonaktifkan" secara lengkap — login diblokir di `authorize()`
callback, tapi jejak siapa mengerjakan apa tetap utuh.

**Constraint di level database**: semua relasi dari `Guest` ke master data
(`institution`, `department`, `employee`, `purpose`) menggunakan
`onDelete: Restrict` — mencegah hard-delete baris master data yang masih
direferensikan, sebagai lapisan pertahanan kedua di luar UI yang memang
tidak pernah menyediakan tombol hard-delete untuk data yang sudah dipakai.

### 4.4 Kebijakan Retensi Edit Resepsionis

Resepsionis boleh mengedit data tamu **hanya jika kedua syarat berikut
terpenuhi**:

1. `visitDate` = tanggal hari ini (dihitung di server, timezone `APP_TIMEZONE`).
2. `status` masih `MENUNGGU` atau `DIPROSES` (belum `SELESAI`/`DIBATALKAN`).

Di luar itu (lewat tengah malam, atau status sudah final), hanya Admin/Super
Admin yang bisa mengoreksi. Aturan ini **ditegakkan di Server Action**, bukan
hanya disembunyikan di UI (lihat §12 brief — server action tidak boleh percaya
input/role dari client).

### 4.5 Strategi Autentikasi & Sesi

Auth.js v5, **Credentials Provider** (email + password, bcrypt) dengan
**strategi sesi JWT** — bukan database session, dan **tanpa Prisma Adapter**.

Alasan:
- RBAC ditegakkan di Next.js Middleware (edge), yang butuh pengecekan role
  cepat tanpa round-trip database di setiap request — JWT yang membawa
  `role` di dalam token memenuhi ini langsung dari cookie yang di-decode.
- Sistem internal, tidak perlu OAuth/social login → tidak perlu tabel
  `accounts`/`sessions`/`verification_tokens` dari Prisma Adapter (karena itu
  juga sejalan dengan daftar "tabel minimal" di brief yang tidak
  menyebutkan tabel-tabel tsb).
- Trade-off yang disadari: revoke sesi instan (mis. saat Super Admin
  menonaktifkan user) tidak langsung memutus JWT yang sudah terbit sampai
  expired. Mitigasi: JWT `maxAge` pendek (mis. 8 jam, disesuaikan jam kerja
  kantor) + pengecekan `isActive` ulang di setiap Server Action sensitif
  (bukan hanya saat login), sehingga user nonaktif tetap tertolak walau
  token teknisnya belum expired.

### 4.6 CSRF & Rate Limiting

**CSRF:**
- Semua mutasi data (Server Actions) otomatis dilindungi mekanisme bawaan
  Next.js: setiap Server Action punya action-id terenkripsi yang divalidasi,
  dan Next.js memverifikasi header `Origin` terhadap origin deployment untuk
  setiap POST ke Server Action — request cross-origin ditolak tanpa perlu
  token CSRF manual.
- Auth.js v5 menambahkan proteksi CSRF miliknya sendiri (double-submit cookie)
  khusus untuk endpoint sign-in credentials (`/api/auth/callback/credentials`).
- Kesimpulan: tidak perlu implementasi CSRF token manual di mana pun.

**Rate limiting:**
- Target: endpoint login dan endpoint kios publik (`/kios/[token]`) — dua-
  duanya bisa diakses tanpa sesi sehingga rawan brute-force/spam.
- Rencana produksi: `@upstash/ratelimit` + Upstash Redis (REST API, cocok
  serverless Vercel — tidak butuh koneksi TCP persisten).
- **Asumsi terbuka**: kredensial Upstash belum tentu tersedia saat Tahap 2.
  Jika belum ada, dipasang in-memory limiter sederhana sebagai fallback
  dengan log peringatan eksplisit bahwa itu tidak aman untuk multi-instance
  production — perlu dikonfirmasi user sebelum go-live.

### 4.7 Validasi Format

| Field | Aturan |
|---|---|
| NIK | Opsional; jika diisi harus tepat 16 digit numerik. Tidak divalidasi checksum wilayah (algoritma resmi Dukcapil tidak publik) |
| No. HP | Wajib; format Indonesia — regex `^(0|62|\+62)8[1-9][0-9]{7,11}$`, dinormalisasi ke format `08xxxxxxxxxx` saat disimpan |
| Email tamu | Opsional; validasi format standar (Zod `.email()`) |
| Email user (staf) | Wajib, unik |

### 4.8 Export, Import, Print

| Kebutuhan | Library | Alasan |
|---|---|---|
| Export PDF (laporan & detail kunjungan) | `@react-pdf/renderer` | Render PDF murni di Node tanpa headless browser — Puppeteer/Playwright terlalu berat & rawan gagal di serverless function (ukuran bundle, cold start, binary Chromium) |
| Export Excel | `exceljs` | Kontrol format (header, lebar kolom, style) lebih baik dari SheetJS versi gratis; maintenance aktif |
| Import Excel | `exceljs` (parse) + skema Zod yang sama dengan form tambah tamu (mode relaxed untuk referensi master data by-name) | Satu sumber kebenaran validasi; setiap baris gagal dikumpulkan jadi laporan error (baris ke-N, kolom apa, kenapa gagal) tanpa menghentikan baris lain yang valid |
| Print | CSS print stylesheet (`@media print`) + `window.print()` untuk tampilan cepat; dokumen resmi (laporan, detail kunjungan) pakai jalur PDF yang sama lalu dibuka di tab baru | Konsisten dengan hasil export PDF, menghindari duplikasi layout cetak |

### 4.9 Keamanan Foto & QR Token

- Foto tamu disimpan di Vercel Blob dengan `access: 'public'` (satu-satunya
  mode yang tersedia di Vercel Blob saat ini) dan `addRandomSuffix: true`.
  Kerahasiaan bergantung pada URL yang tidak bisa ditebak (random token di
  URL), bukan access control — ini **trade-off yang disadari**, wajar untuk
  foto tamu (sensitivitas moderat), dicatat sebagai keterbatasan yang bisa
  ditingkatkan nanti (mis. proxy download via Server Action yang mengecek
  sesi, jika suatu saat dibutuhkan).
- `Guest.qrToken` sengaja dibuat terpisah dari `Guest.id` (walau keduanya
  UUID acak): agar id internal yang mungkin muncul di URL admin/log lain
  tidak otomatis menjadi tiket self-checkout yang valid. Rotasi/pencabutan
  token bisa dilakukan tanpa mengubah primary key jika suatu saat diperlukan.
- Validasi upload: tipe file dibatasi `image/jpeg`, `image/png`, `image/webp`;
  ukuran maksimum 2MB; validasi dilakukan di Server Action (membaca magic
  bytes/`file.type`), bukan hanya di `<input accept>` client yang mudah
  dilewati.

### 4.10 Interpretasi "Tujuan Kunjungan" vs "Keperluan"

Brief menyebut keduanya berdampingan tapi hanya "Keperluan" yang punya master
data eksplisit (§6 brief). Interpretasi yang dipakai:

- **Keperluan** (`purposeId`, wajib) → relasi ke master `purposes`, kategori
  terstruktur untuk kebutuhan pelaporan/statistik (mis. "Pengurusan Izin
  Trayek", "Konsultasi Perizinan", "Undangan Rapat", "Pengaduan", "Lainnya").
- **Tujuan Kunjungan** (`visitDetail`, opsional, teks bebas) → keterangan
  spesifik pelengkap kategori di atas (mis. "Konsultasi izin trayek AKAP
  rute Jakarta–Bandung"), karena memaksa semua alasan kunjungan ke daftar
  tetap tidak realistis untuk buku tamu.

**Perlu dikonfirmasi user** — lihat §7.

### 4.11 Non-Fungsional

- **Timezone**: `Asia/Jakarta` (WIB) sebagai default, dibuat konfigurabel
  lewat env var `APP_TIMEZONE` (bukan hardcode) agar kantor Dishub di
  wilayah WITA/WIT tinggal ubah env. Semua batas "hari ini" (reset nomor
  antrian, filter dashboard, jendela edit resepsionis) memakai nilai ini,
  dihitung di server.
- **Bahasa**: UI sepenuhnya Bahasa Indonesia (tidak ada i18n multi-bahasa
  di MVP).
- **Skala asumsi**: satu lokasi/kantor (satu "counter" resepsionis logis —
  nomor antrian tidak per-loket). Jika ke depan ada multi-lokasi, `Guest`
  perlu kolom `locationId` — di luar cakupan MVP.
- **Performa**: pagination server-side wajib untuk `Guest` (bisa puluhan
  ribu baris/tahun); pencarian nama pakai `ILIKE` dengan index biasa di MVP,
  dicatat sebagai kandidat index trigram (`pg_trgm` + `GIN`) jika volume
  data membuat `ILIKE` lambat — perubahan skema minor, tidak mengubah
  struktur tabel.
- **Aksesibilitas**: kontras warna token desain (§9 brief) sudah AA-safe
  untuk teks utama; form pakai label eksplisit (bukan hanya placeholder)
  dan pesan error terasosiasi ke field (`aria-describedby`).
- **Breakpoint responsif**: mobile ≥375px, tablet ≥768px, desktop ≥1024px,
  wide ≥1440px. Tabel data beralih ke card-view di bawah `768px`.
- **Browser**: 2 versi terakhir Chrome/Edge/Firefox/Safari — sesuai
  perangkat pemerintah pada umumnya (tidak menargetkan IE/legacy).

---

## 5. Daftar Modul Sistem

1. Autentikasi (login, logout, session)
2. Dashboard
3. Buku Tamu (CRUD, cetak, export, import, QR)
4. Kios Self-Checkout (publik, 1 halaman)
5. Master Data (Pegawai, Bidang, Instansi, Keperluan)
6. Laporan (harian/mingguan/bulanan/tahunan/rentang, export)
7. Activity Log (Super Admin)
8. Manajemen User (Super Admin)
9. Pengaturan Sistem (Super Admin)

## 6. Matriks Hak Akses (RBAC)

Legenda: C=Create, R=Read, U=Update, D=Delete(soft), X=Export, P=Print,
I=Import. `-` = tidak ada akses ke modul tsb sama sekali.

| Modul | Aksi | Super Admin | Admin | Resepsionis | Kepala Dinas |
|---|---|:---:|:---:|:---:|:---:|
| Dashboard | R | ✅ | ✅ | ✅ (ringkas) | ✅ |
| Buku Tamu | C | ✅ | ✅ | ✅ | ❌ |
| Buku Tamu | R | ✅ | ✅ | ✅ | ✅ |
| Buku Tamu | U | ✅ | ✅ | ✅ *(§4.4)* | ❌ |
| Buku Tamu | D (soft) | ✅ | ✅ | ❌ | ❌ |
| Buku Tamu | X (PDF/Excel) | ✅ | ✅ | ❌ | ✅ |
| Buku Tamu | P (cetak) | ✅ | ✅ | ✅ | ✅ |
| Buku Tamu | I (import Excel) | ✅ | ✅ | ❌ | ❌ |
| Master Data | C/U/D | ✅ | ✅ | ❌ | ❌ |
| Master Data | R (untuk autocomplete) | ✅ | ✅ | ✅ | ✅ |
| Laporan | R/X/P | ✅ | ✅ | ❌ | ✅ |
| Activity Log | R | ✅ | ❌ | ❌ | ❌ |
| Manajemen User | C/R/U/D | ✅ | ❌ | ❌ | ❌ |
| Pengaturan Sistem | R/U | ✅ | ❌ | ❌ | ❌ |
| Kios Self-Checkout | U (checkout only) | publik, token-gated — bukan role pengguna (§4.1) | | | |

Matriks ini adalah **satu sumber kebenaran** untuk implementasi
`shared/lib/rbac.ts` di Tahap 2 — tidak ada aturan akses yang boleh
diasumsikan implisit di kode tanpa merujuk ke tabel ini.

## 7. Pertanyaan Terbuka — Mohon Konfirmasi Sebelum Tahap 2

Butuh keputusan eksplisit karena akan sulit/mahal diubah setelah skema
database final:

1. **Tujuan Kunjungan vs Keperluan** (§4.10) — apakah interpretasi di atas
   (Keperluan = kategori master, Tujuan Kunjungan = teks bebas pelengkap)
   sudah sesuai maksud, atau keduanya sebenarnya dimaksudkan sebagai field
   yang sama?
2. **Timezone** kantor: konfirmasi `Asia/Jakarta`, atau perlu WITA/WIT?
3. **Rate limiting**: apakah kredensial Upstash Redis akan disiapkan sebelum
   go-live, atau MVP cukup dengan fallback in-memory (dengan catatan
   keterbatasannya)?
4. **Kepala Dinas & Activity Log**: saat ini di luar akses Kepala Dinas
   (hanya Super Admin). Konfirmasi ini sudah sesuai kebutuhan.
5. **Skala**: konfirmasi asumsi satu lokasi/kantor (nomor antrian tidak
   per-loket/per-cabang).

Jika tidak ada koreksi, keputusan di §4 dianggap final dan menjadi dasar
skema Prisma (`docs/03-erd-dan-skema-database.md`) serta implementasi Tahap
2 seterusnya.

## 8. Rencana Dependencies (versi akan dipasang di Tahap 2 — Setup Project)

Dicantumkan di sini agar tidak ada ambiguitas versi sebelum implementasi,
sesuai permintaan brief — **belum ada `package.json`/`npm install` yang
dijalankan di Tahap 1 ini**, karena instalasi project adalah bagian dari
Tahap 2 ("Setup project").

| Package | Versi rencana | Kategori |
|---|---|---|
| next | ^15.1.0 | Framework |
| react / react-dom | ^19.0.0 | Framework |
| typescript | ^5.7.0 | Bahasa |
| tailwindcss | ^3.4.17 | Styling |
| shadcn/ui (CLI, tanpa versi paket — generate komponen ke repo) | latest CLI | Styling |
| prisma / @prisma/client | ^6.1.0 | ORM |
| next-auth | ^5.0.0-beta.25 | Auth |
| bcrypt | ^5.1.1 | Hashing |
| react-hook-form | ^7.54.0 | Form |
| zod | ^3.24.1 | Validasi |
| @tanstack/react-table | ^8.20.5 | Tabel |
| lucide-react | ^0.468.0 | Ikon |
| framer-motion | ^11.15.0 | Animasi |
| sonner | ^1.7.1 | Notifikasi |
| recharts | ^2.15.0 | Grafik |
| @vercel/blob | ^0.27.0 | Storage foto |
| qrcode | ^1.5.4 | Generate QR |
| @react-pdf/renderer | ^4.1.5 | Export PDF |
| exceljs | ^4.4.0 | Export/Import Excel |
| react-signature-canvas | ^1.0.6 | Tanda tangan digital |
| @upstash/ratelimit + @upstash/redis | ^2.0.5 / ^1.34.3 | Rate limiting (§4.6) |
| date-fns-tz | ^3.2.0 | Timezone-aware date handling (§4.11) |

Versi minor/patch akan disesuaikan ke rilis stabil terbaru saat `npm install`
benar-benar dijalankan di Tahap 2 jika ada update penting, dan akan dicatat
di ringkasan Tahap 2.

---

**Dokumen terkait**: `docs/02-struktur-folder.md`,
`docs/03-erd-dan-skema-database.md`, `docs/04-wireframe.md`,
`prisma/schema.prisma`.
