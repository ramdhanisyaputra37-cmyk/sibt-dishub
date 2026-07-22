# Tahap 1 — Wireframe

ASCII, bukan desain final — tujuannya menyepakati tata letak & elemen wajib
tiap halaman sebelum implementasi. Palet warna, spacing, dan detail visual
mengikuti token di §9 brief (dieksekusi di Tahap 2 lewat `tailwind.config`).

Setiap halaman ber-autentikasi dibungkus **satu shell layout** yang sama
(sidebar + topbar) — digambar sekali di §1, wireframe halaman lain hanya
menampilkan area konten utama.

---

## 1. Shell Layout (Sidebar + Topbar) — membungkus semua halaman `(app)`

```
+---+----------------------------------------------------------------------+
| S |  [ = ] SIBT-DISHUB    [ Cari global...      ]      [bell] [sun/moon]|
| I |----------------------------------------------------------------------|
| D |                                                          [Avatar]   |
| E |                                                          Nama User  |
| B |                                                          Role Badge |
| A |----------------------------------------------------------------------|
| R |                                                                      |
|   |                        << AREA KONTEN HALAMAN >>                    |
+---+----------------------------------------------------------------------+
```

Sidebar (collapsible, ikon Lucide, item aktif ter-highlight primary color),
menu ditampilkan **sesuai role** — mengikuti matriks RBAC `docs/01` §6:

```
[icon] Dashboard                  <- semua role
[icon] Buku Tamu                  <- semua role
[icon] Master Data          v     <- Super Admin, Admin
   - Pegawai
   - Bidang
   - Instansi
   - Keperluan
[icon] Laporan                    <- Super Admin, Admin, Kepala Dinas
[icon] Activity Log                <- Super Admin
[icon] Manajemen Pengguna          <- Super Admin
[icon] Pengaturan                  <- Super Admin
---------------------------------
[icon] Keluar (logout)
```

Topbar: logo + nama sistem, search global (nama tamu/instansi — hasil
dropdown ringkas, Enter membuka halaman Buku Tamu dengan filter ter-isi),
lonceng notifikasi (opsional MVP, placeholder), toggle dark mode, avatar +
nama + badge role + dropdown (Profil, Keluar).

---

## 2. Login (`/login`) — tanpa shell

```
+--------------------------------------------------------------------+
|                                                                      |
|                    [Logo Dishub]   SIBT-DISHUB                      |
|              Sistem Informasi Buku Tamu Digital                     |
|                                                                      |
|            +------------------------------------------+             |
|            |  Email                          * wajib   |             |
|            |  [____________________________________]   |             |
|            |                                            |             |
|            |  Kata Sandi                     * wajib   |             |
|            |  [________________________________] [o]   |             |
|            |                                            |             |
|            |  [        MASUK          ] (loading spin)  |             |
|            |                                            |             |
|            |  [!] Email atau kata sandi salah            |             |
|            |      (toast + inline, muncul setelah submit)|             |
|            +------------------------------------------+             |
|                                                                      |
|                    Dinas Perhubungan (c) 2026                        |
+--------------------------------------------------------------------+
```

Floating label, validasi realtime (email format, password min length),
tombol submit disabled selagi pending. Rate limit terlampaui -> pesan
spesifik "Terlalu banyak percobaan, coba lagi dalam X menit" (§4.6 `docs/01`).

---

## 3. Dashboard (`/dashboard`)

```
Area Konten:
+----------------------------------------------------------------------+
| Selamat datang, {Nama}          [+ Tambah Tamu]  (shortcut sesuai role)|
+----------------------------------------------------------------------+
| [Hari Ini]    | [Minggu Ini]  | [Bulan Ini]   | [Tahun Ini]           |
| 12 tamu       | 84 tamu       | 340 tamu      | 4.120 tamu            |
| ^ +3 vs kmrn  |               |               |                       |
+----------------------------------------------------------------------+
| Grafik Kunjungan Bulanan (line/bar)   | Kunjungan per Bidang (bar)   |
| [.......chart recharts.......]        | [.......chart recharts.....]|
+----------------------------------------------------------------------+
| Instansi Kunjungan Terbanyak          | Tamu Terakhir (polling)     |
| 1. Dishub Kab. X       45 kunjungan   | Budi S.  - Dishub A - 10:32 |
| 2. PT Angkutan Y       31 kunjungan   | Siti R.  - Dishub B - 10:15 |
| 3. Koperasi Z          22 kunjungan   | ...  (skeleton saat loading)|
+----------------------------------------------------------------------+
```

Statistik & chart mengagregasi `Guest` (exclude `deletedAt IS NOT NULL`).
"Tamu Terakhir" polling interval pendek (mis. 30 detik, `revalidate`/
client-side interval — keputusan teknis final di Tahap 3). Resepsionis
melihat versi ringkas (tanpa grafik institusi/bidang yang lebih relevan
untuk manajemen); Kepala Dinas & Admin/Super Admin melihat versi lengkap.

---

## 4. Buku Tamu — List Desktop (`/buku-tamu`)

```
+----------------------------------------------------------------------+
| Buku Tamu                                          [+ Tambah Tamu]   |
+----------------------------------------------------------------------+
| [Cari nama/instansi/pegawai...]  [Tanggal v] [Status v] [Bidang v]   |
| [Kolom v]  [Export PDF] [Export Excel] [Import Excel]                |
+----------------------------------------------------------------------+
| No.Antrian | Nama    | Instansi | Bidang | Jam Masuk | Status | Aksi |
|------------|---------|----------|--------|-----------|--------|------|
| 20260722-  | Budi S. | Dishub A | Angkut | 08:12     |[Selesai]|[..] |
|   0001     |         |          | an     |           |        |     |
| 20260722-  | Siti R. | PT Y     | Perizi | 08:40     |[Diprose|[..] |
|   0002     |         |          | nan    |           | s]     |     |
| ...        |         |          |        |           |        | (sticky header saat scroll)
+----------------------------------------------------------------------+
| Menampilkan 1-10 dari 340       [<  1 2 3 ... 34  >]   [10/hal v]    |
+----------------------------------------------------------------------+
```

Filter & search dikombinasikan dan direfleksikan ke URL query
(`?q=budi&status=SELESAI&dari=2026-07-01&sampai=2026-07-22&bidang=...`) —
bisa di-bookmark/share sesuai §5.3 brief. Kolom `Aksi`: Detail, Edit
(sesuai §4.4 `docs/01`), Hapus (Admin/Super Admin, konfirmasi dialog),
Cetak. Baris berstatus `DIBATALKAN` tampil redup (opacity rendah) sebagai
isyarat visual. Empty state ("Belum ada data tamu untuk filter ini" +
ilustrasi ringan) menggantikan tabel kosong polos. Skeleton row saat
loading, bukan spinner penuh halaman.

## 4b. Buku Tamu — List Mobile (<768px, card-view)

```
+---------------------------------+
| Buku Tamu          [+ Tambah]   |
| [Cari...]           [Filter v]  |
+---------------------------------+
| Budi Santoso        [Selesai]   |
| 20260722-0001                   |
| Dishub A - Bidang Angkutan      |
| 08:12 - 09:05 (53 mnt)          |
| [Detail]              [...]     |
+---------------------------------+
| Siti Rahma          [Diproses]  |
| 20260722-0002                   |
| PT Y - Bidang Perizinan         |
| 08:40 - masih berkunjung        |
| [Detail]              [...]     |
+---------------------------------+
|      [ Muat lebih banyak ]      |
+---------------------------------+
```

Card menggantikan tabel penuh di breakpoint mobile (§9 brief) — field
paling penting saja terlihat, sisanya di halaman Detail. Aksi sekunder
(edit/hapus/cetak) di belakang menu titik-tiga agar target sentuh tetap
besar.

---

## 5. Buku Tamu — Form Tambah/Edit (`/buku-tamu/tambah`)

```
+----------------------------------------------------------------------+
| Tambah Tamu Baru                                                     |
+----------------------------------------------------------------------+
| -- Data Diri --                                                      |
| Nama Lengkap *          [____________________________]              |
| NIK (opsional)          [________________] 16 digit                 |
| Jenis Kelamin *         ( ) Laki-laki   ( ) Perempuan                |
| Alamat *                [____________________________]              |
| No. HP *                [____________________________]              |
| Email (opsional)        [____________________________]              |
|                                                                        |
| -- Kunjungan --                                                      |
| Instansi *          [Cari/pilih instansi...  v] [+ Baru]             |
| Bidang Tujuan *      [Pilih bidang...          v]                    |
| Pegawai Ditemui      [Pilih pegawai (opsional)  v]                   |
| Keperluan *          [Pilih kategori keperluan  v]                   |
| Tujuan Kunjungan     [___________________________] (detail bebas)   |
| Catatan              [___________________________]                  |
|                                                                        |
| -- Verifikasi --                                                     |
| Foto Tamu (opsional)   [ Ambil/Unggah Foto ]  (preview thumbnail)    |
| Tanda Tangan *         +------------------------+                    |
|                        |  (canvas signature pad)|  [Hapus] [Ulang]   |
|                        +------------------------+                    |
|                                                                        |
|                [ Batal ]              [ Simpan & Cetak Tiket ]        |
+----------------------------------------------------------------------+
```

Autocomplete relasi (Instansi/Bidang/Pegawai/Keperluan) — ketik untuk
filter, opsi "+ Tambah instansi baru" inline tanpa keluar halaman (§5.1
brief). Validasi realtime per field (Zod, pesan error di bawah field,
`aria-describedby`), badge `*` merah untuk wajib. Submit sukses -> toast
sukses + redirect ke halaman Detail (yang menampilkan QR, §6) sehingga
tiket bisa langsung dicetak. Target keseluruhan alur < 60 detik (§1 brief)
— field wajib diminimalkan, autocomplete mengurangi ketikan.

---

## 6. Buku Tamu — Detail (`/buku-tamu/[id]`)

```
+----------------------------------------------------------------------+
| < Kembali            Detail Kunjungan            [Edit] [Cetak] [...]|
+----------------------------------------------------------------------+
| No. Antrian: 20260722-0007                    [Status: Diproses v]   |
|                                                                        |
| +-------------------+   Nama       : Budi Santoso                    |
| |                   |   NIK        : 3201xxxxxxxxxxxx                |
| |   (Foto Tamu)     |   Kelamin    : Laki-laki                       |
| |                   |   Instansi   : Dishub Kabupaten X               |
| +-------------------+   Alamat     : Jl. ...                         |
|                         No. HP     : 0812xxxxxxxx                    |
|   Tanda Tangan:         Keperluan  : Konsultasi Perizinan            |
|  +----------------+     Tujuan     : Izin trayek AKAP rute A-B       |
|  |  (garis ttd)   |     Bidang     : Angkutan                        |
|  +----------------+     Pegawai    : Ahmad (Kasi Angkutan)           |
|                         Jam Masuk  : 08:12    Jam Keluar: -          |
|                         Catatan    : -                                |
|                                                                        |
|          +--------------+   Pindai untuk checkout mandiri di kios     |
|          |   [QR CODE]  |   atau tunjukkan ke resepsionis saat        |
|          |              |   meninggalkan lokasi.                     |
|          +--------------+                                             |
+----------------------------------------------------------------------+
```

Perubahan `status` langsung dari halaman ini (dropdown, Admin/Resepsionis
sesuai §4.4 `docs/01`) memicu Server Action + entri `activity_logs`. Tombol
Cetak membuka PDF (§4.8 `docs/01`) di tab baru. QR selalu diturunkan dari
`qrToken` saat render (bukan gambar tersimpan).

---

## 7. Kios Self-Checkout (`/kios/[token]`) — publik, tanpa shell/login

```
+--------------------------------------------------+
|              [Logo Dishub]  SIBT-DISHUB           |
|                                                    |
|        Konfirmasi Selesai Kunjungan?              |
|                                                    |
|              Budi Santoso                         |
|              Dishub Kabupaten X                   |
|              Masuk pukul 08:12                    |
|                                                    |
|         [   YA, SAYA SELESAI (CHECK-OUT)   ]      |
|                                                    |
|         [        Batal / Kembali        ]         |
+--------------------------------------------------+

-- setelah submit --
+--------------------------------------------------+
|         [check icon besar, animasi ringan]        |
|         Terima kasih, Budi Santoso!                |
|         Durasi kunjungan: 53 menit                 |
|         (08:12 - 09:05)                            |
+--------------------------------------------------+

-- token tidak valid / sudah checkout --
+--------------------------------------------------+
|         [!] Kunjungan ini sudah diselesaikan       |
|             sebelumnya, atau tautan tidak valid.   |
|         Silakan hubungi resepsionis.               |
+--------------------------------------------------+
```

Layar besar, tombol besar (dioptimalkan untuk tablet kios & jari, bukan
mouse). Tanpa sidebar/topbar/login. Rate-limited per §4.6 `docs/01`. Tidak
menampilkan data sensitif berlebihan (cukup nama + instansi + jam masuk
untuk konfirmasi visual, bukan NIK/No. HP/alamat).

---

## 8. Master Data — pola umum (contoh: Instansi, `/master/instansi`)

Keempat master data (Pegawai/Bidang/Instansi/Keperluan) memakai satu pola
identik — hanya kolom tabel & field form yang berbeda:

```
+----------------------------------------------------------------------+
| Master Instansi                                    [+ Tambah Instansi]|
+----------------------------------------------------------------------+
| [Cari nama instansi...]                    [Semua v] (aktif/nonaktif)|
+----------------------------------------------------------------------+
| Nama              | Alamat        | No. HP     | Status  | Aksi      |
|--------------------|---------------|------------|---------|-----------|
| Dishub Kab. X      | Jl. ...       | 0812...    | Aktif   | [Edit][..]|
| PT Angkutan Y      | Jl. ...       | 0813...    | Aktif   | [Edit][..]|
| CV Lama Z          | Jl. ...       | 0814...    | Nonaktif| [Edit][..]|
+----------------------------------------------------------------------+
| Menampilkan 1-10 dari 48                         [<  1 2 3 4 5  >]   |
+----------------------------------------------------------------------+

-- Modal Tambah/Edit --
+---------------------------------------+
| Tambah Instansi                    [X]|
|---------------------------------------|
| Nama Instansi *   [________________]  |
| Alamat            [________________]  |
| No. HP            [________________]  |
| Status            (o) Aktif ( ) Non   |
|                                        |
|            [Batal]  [Simpan]          |
| [!] "Dishub Kab. X" sudah terdaftar    |
|     (validasi duplikasi case-insens.) |
+---------------------------------------+
```

Tombol "Nonaktifkan" (bukan "Hapus") ditampilkan bila entitas sudah pernah
direferensikan `Guest`/`Employee`; jika belum pernah dipakai sama sekali,
tombol boleh berlabel "Hapus" (hard delete sungguhan diperbolehkan hanya
untuk baris yang nol referensi — kenyamanan tambahan, bukan kewajiban
brief). Dialog konfirmasi wajib sebelum aksi ini (§8 brief).

---

## 9. Laporan (`/laporan`)

```
+----------------------------------------------------------------------+
| Laporan Kunjungan                                                    |
+----------------------------------------------------------------------+
| Jenis: (o)Harian ( )Mingguan ( )Bulanan ( )Tahunan ( )Rentang Tanggal |
| Periode: [22 Jul 2026 v]                    [ Tampilkan ]            |
+----------------------------------------------------------------------+
| Ringkasan: Total 12 kunjungan | Selesai 9 | Batal 1 | Sedang berjalan 2|
| Breakdown per Bidang: Angkutan 5, Perizinan 4, Umum 3                |
| Breakdown per Instansi (top 5): ...                                  |
+----------------------------------------------------------------------+
|                    [Export PDF]  [Export Excel]  [Cetak]             |
+----------------------------------------------------------------------+
| (tabel detail kunjungan periode terpilih, sama pola dgn Buku Tamu)   |
+----------------------------------------------------------------------+
```

## 10. Activity Log (`/activity-log`) — Super Admin

```
+----------------------------------------------------------------------+
| Activity Log                                                         |
+----------------------------------------------------------------------+
| [Cari...] [Pengguna v] [Aksi v] [Tanggal v]                          |
+----------------------------------------------------------------------+
| Waktu            | Pengguna    | Aksi   | Entitas       | Keterangan |
|-------------------|-------------|--------|---------------|-----------|
| 22 Jul 08:41      | Siti (Resep)| CREATE | Guest #0007   | Tambah tamu Budi..|
| 22 Jul 08:15      | Ahmad (Adm) | DELETE | Guest #0003   | Hapus data tamu.. |
| 22 Jul 07:58      | Siti (Resep)| LOGIN  | -             | Login berhasil    |
+----------------------------------------------------------------------+
```

Read-only, tidak ada aksi ubah/hapus di halaman ini sama sekali (§4.3
`docs/01` — append-only).

## 11. Manajemen Pengguna (`/pengguna`) — Super Admin

```
+----------------------------------------------------------------------+
| Manajemen Pengguna                                  [+ Tambah User]  |
+----------------------------------------------------------------------+
| Nama        | Email               | Role         | Status | Aksi     |
|-------------|---------------------|--------------|--------|----------|
| Ahmad F.    | ahmad@dishub.go.id  | Admin        | Aktif  |[Edit][..]|
| Siti R.     | siti@dishub.go.id   | Resepsionis  | Aktif  |[Edit][..]|
+----------------------------------------------------------------------+
```

Form tambah/edit user: Nama, Email, Role (dropdown 4 pilihan), Password
(hanya wajib saat tambah baru; kosong saat edit = tidak diubah), toggle
Aktif/Nonaktif. Password di-hash bcrypt di server action sebelum simpan,
tidak pernah tampil kembali dalam bentuk apa pun setelah diset.

---

**Dokumen terkait**: `docs/01-analisis-kebutuhan.md` (RBAC & keputusan
field), `docs/02-struktur-folder.md`, `docs/03-erd-dan-skema-database.md`.
