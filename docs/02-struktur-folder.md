# Tahap 1 — Struktur Folder Project

## Pendekatan Arsitektur

Clean Architecture klasik (folder top-level `domain/ application/
infrastructure/ presentation/` yang membungkus seluruh aplikasi) berbenturan
dengan routing berbasis filesystem Next.js App Router — `app/` **harus**
mencerminkan struktur URL, sehingga tidak bisa jadi satu-satunya folder
"presentation" generik di root.

Solusi yang dipakai: **Clean Architecture per modul (vertical slice)**.
Setiap fitur bisnis (`guest`, `master-data`, `user`, `report`,
`activity-log`) punya keempat lapisan sendiri di `src/modules/*`, sementara
`src/app/` menyusut jadi lapisan routing tipis yang hanya mengimpor dan
menyusun komponen dari `modules/*/presentation`. Infrastruktur lintas-modul
(koneksi database, konfigurasi auth, klien blob storage) hidup di
`src/shared/infrastructure` supaya tidak diduplikasi tiap modul.

Aturan ketergantungan (sama seperti Clean Architecture konvensional):

```
presentation ──▶ application ──▶ domain
                      │
infrastructure ───────┘
(infrastructure mengimplementasikan interface/port yang didefinisikan domain)
```

`domain` tidak boleh mengimpor dari `infrastructure` atau `presentation`.
`app/**/page.tsx` tidak boleh berisi query Prisma langsung — selalu lewat
Server Action di `modules/*/presentation/actions.ts` yang memanggil use case
di `application`.

## Struktur Lengkap

```
sibt-dishub/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts                        # Tahap 6
│   └── migrations/                    # digenerate otomatis oleh Prisma
│
├── src/
│   ├── app/                                       # PRESENTATION (routing only)
│   │   ├── (public)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── kios/
│   │   │       └── [token]/
│   │   │           └── page.tsx                   # self-checkout, tanpa auth
│   │   │
│   │   ├── (app)/                                 # route group ber-auth
│   │   │   ├── layout.tsx                         # shell: sidebar + topbar
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── buku-tamu/
│   │   │   │   ├── page.tsx                       # list + filter + search
│   │   │   │   ├── tambah/page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx                   # detail + QR + cetak
│   │   │   │       └── edit/page.tsx
│   │   │   ├── master/
│   │   │   │   ├── pegawai/page.tsx
│   │   │   │   ├── bidang/page.tsx
│   │   │   │   ├── instansi/page.tsx
│   │   │   │   └── keperluan/page.tsx
│   │   │   ├── laporan/
│   │   │   │   └── page.tsx
│   │   │   ├── activity-log/
│   │   │   │   └── page.tsx                       # Super Admin only
│   │   │   ├── pengguna/
│   │   │   │   ├── page.tsx                       # Super Admin only
│   │   │   │   └── [id]/edit/page.tsx
│   │   │   └── pengaturan/
│   │   │       └── page.tsx                       # Super Admin only
│   │   │
│   │   ├── api/
│   │   │   └── auth/[...nextauth]/route.ts
│   │   │
│   │   ├── layout.tsx                             # root layout (fonts, providers)
│   │   ├── globals.css                            # Tailwind + CSS variables tema
│   │   └── not-found.tsx
│   │
│   ├── modules/                                   # DOMAIN + APPLICATION per fitur
│   │   ├── guest/
│   │   │   ├── domain/
│   │   │   │   ├── guest.entity.ts
│   │   │   │   ├── guest.repository.ts            # interface/port
│   │   │   │   └── guest-number.service.ts         # aturan format nomor antrian
│   │   │   ├── application/
│   │   │   │   ├── guest.schema.ts                # Zod — dipakai client & server
│   │   │   │   ├── create-guest.usecase.ts
│   │   │   │   ├── update-guest.usecase.ts
│   │   │   │   ├── delete-guest.usecase.ts
│   │   │   │   ├── checkout-guest.usecase.ts      # dipanggil dari kios
│   │   │   │   ├── list-guests.usecase.ts
│   │   │   │   ├── import-guests.usecase.ts
│   │   │   │   └── export-guests.usecase.ts
│   │   │   ├── infrastructure/
│   │   │   │   ├── prisma-guest.repository.ts     # implementasi port
│   │   │   │   └── daily-counter.repository.ts
│   │   │   └── presentation/
│   │   │       ├── actions.ts                     # 'use server'
│   │   │       ├── guest-form.tsx
│   │   │       ├── guest-table.tsx
│   │   │       ├── guest-table-columns.tsx
│   │   │       ├── guest-card-mobile.tsx
│   │   │       ├── signature-pad.tsx
│   │   │       ├── qr-preview.tsx
│   │   │       └── guest-filters.tsx
│   │   │
│   │   ├── master-data/
│   │   │   ├── domain/
│   │   │   │   └── master-entity.repository.ts    # interface generik (§ reuse)
│   │   │   ├── application/
│   │   │   │   ├── {employee,department,institution,purpose}.schema.ts
│   │   │   │   └── {employee,department,institution,purpose}.usecase.ts
│   │   │   ├── infrastructure/
│   │   │   │   └── prisma-{...}.repository.ts
│   │   │   └── presentation/
│   │   │       ├── actions.ts
│   │   │       └── master-data-table.tsx          # komponen reusable lintas 4 entitas
│   │   │
│   │   ├── auth/
│   │   │   ├── application/
│   │   │   │   └── login.schema.ts
│   │   │   └── presentation/
│   │   │       └── login-form.tsx
│   │   │
│   │   ├── user/
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   │
│   │   ├── report/
│   │   │   ├── application/
│   │   │   │   ├── report.schema.ts
│   │   │   │   └── generate-report.usecase.ts
│   │   │   ├── infrastructure/
│   │   │   │   ├── report-pdf.template.tsx        # @react-pdf/renderer
│   │   │   │   └── report-excel.builder.ts         # exceljs
│   │   │   └── presentation/
│   │   │
│   │   ├── activity-log/
│   │   │   ├── domain/
│   │   │   │   └── activity-log.repository.ts
│   │   │   ├── application/
│   │   │   │   └── record-activity.usecase.ts      # dipanggil dari modul lain
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   │
│   │   └── dashboard/
│   │       ├── application/
│   │       │   └── get-dashboard-stats.usecase.ts
│   │       └── presentation/
│   │           ├── stat-card.tsx
│   │           ├── visits-chart.tsx
│   │           └── recent-guests-list.tsx
│   │
│   ├── shared/                                    # kernel lintas-modul
│   │   ├── domain/
│   │   │   └── result.ts                          # Result<T, E> — error handling eksplisit
│   │   ├── infrastructure/
│   │   │   ├── prisma.ts                          # Prisma client singleton
│   │   │   ├── auth.config.ts                     # Auth.js config (JWT, RBAC callback)
│   │   │   ├── blob-storage.ts                    # wrapper @vercel/blob
│   │   │   ├── rate-limiter.ts                    # Upstash + fallback in-memory
│   │   │   └── activity-logger.ts                 # helper tulis activity_logs
│   │   └── lib/
│   │       ├── rbac.ts                            # matriks §6 → guard functions
│   │       ├── timezone.ts                        # helper APP_TIMEZONE (§4.11)
│   │       └── utils.ts                            # cn(), formatters, dll.
│   │
│   ├── components/
│   │   ├── ui/                                    # primitif shadcn/ui (generated)
│   │   └── layout/
│   │       ├── sidebar.tsx
│   │       ├── topbar.tsx
│   │       ├── dark-mode-toggle.tsx
│   │       └── breadcrumb.tsx
│   │
│   ├── middleware.ts                              # RBAC route guard (edge)
│   └── types/
│       └── next-auth.d.ts                         # augment Session/JWT dgn role
│
├── public/
│   └── logo-dishub.svg
├── docs/                                          # dokumen tahap 1 (file ini)
├── .env.example                                   # Tahap 6
├── package.json
├── tailwind.config.ts
├── components.json                                # config shadcn/ui
└── tsconfig.json
```

## Catatan Implementasi

- **`master-data` digabung satu modul** (bukan 4 modul terpisah) karena
  keempat entitas (Pegawai, Bidang, Instansi, Keperluan) punya bentuk CRUD
  yang identik (nama unik case-insensitive + toggle aktif/nonaktif) — komponen
  tabel & form di-generalisasi lewat satu komponen reusable yang menerima
  konfigurasi per entitas, menghindari duplikasi 4x tanpa memaksakan
  abstraksi yang tidak perlu (tetap 4 schema/usecase terpisah karena field
  tiap entitas sedikit berbeda, mis. Pegawai punya `departmentId`).
- **`activity-log` di-inject ke modul lain**, bukan dipanggil manual di
  setiap action — use case `record-activity` dipanggil di akhir setiap
  use case modul lain yang mengubah data (create/update/delete/checkout),
  supaya tidak ada satupun mutasi yang lolos tanpa tercatat.
- **`middleware.ts`** hanya melakukan pengecekan role berbasis JWT (cepat,
  edge-safe) untuk memblokir route yang jelas tidak diizinkan; validasi
  detail per-record (mis. jendela edit resepsionis §4.4 dokumen analisis)
  tetap dilakukan di Server Action karena butuh data yang tidak ada di JWT.
- File test co-located sebagai `*.test.ts` di sebelah file yang diuji
  (tidak ada folder `__tests__` terpisah) — keputusan menyusul di tahap
  implementasi terkait, tidak dibahas lebih lanjut di Tahap 1.
