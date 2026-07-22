# Dokumentasi SIBT-DISHUB

Indeks dokumen Tahap 1 — Analisis & Desain. Tidak ada kode aplikasi di tahap
ini (sesuai aturan kerja proyek); `prisma/schema.prisma` dianggap bagian
dari desain database, bukan kode aplikasi, dan dicantumkan penuh di sini.

| Dokumen | Isi |
|---|---|
| [01-analisis-kebutuhan.md](./01-analisis-kebutuhan.md) | Ringkasan sistem, keputusan terkunci vs terbuka, matriks RBAC, non-fungsional, rencana dependency |
| [02-struktur-folder.md](./02-struktur-folder.md) | Struktur folder Next.js App Router + Clean Architecture per modul |
| [03-erd-dan-skema-database.md](./03-erd-dan-skema-database.md) | ERD (Mermaid) + rasional tiap entitas, index, dan constraint |
| [04-wireframe.md](./04-wireframe.md) | Wireframe ASCII seluruh halaman utama |
| [05-deployment.md](./05-deployment.md) | Panduan deployment (Vercel + Neon) & checklist kesiapan production |
| [`../prisma/schema.prisma`](../prisma/schema.prisma) | Schema Prisma lengkap (tervalidasi `prisma validate` & `prisma format`) |
| [`../README.md`](../README.md) | Panduan menjalankan, fitur, skrip, akun demo |

**Sebelum Tahap 2 dimulai**, mohon konfirmasi §7 di
`01-analisis-kebutuhan.md` (5 pertanyaan terbuka) — terutama interpretasi
field "Tujuan Kunjungan" vs "Keperluan", karena itu memengaruhi bentuk form
Buku Tamu di Tahap 3.
