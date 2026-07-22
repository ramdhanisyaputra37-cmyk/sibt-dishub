import { z } from "zod";

import {
  nikSchema,
  optionalEmailSchema,
  phoneSchema,
} from "@/shared/lib/validators";

// Schema inti data tamu — dipakai bersama client (react-hook-form) & server
// action (docs/01 §12: server tidak percaya validasi client). Field relasi
// menerima id yang sudah ada; instansi punya jalur "buat baru" via
// newInstitutionName.

export const GENDER_OPTIONS = [
  { value: "LAKI_LAKI", label: "Laki-laki" },
  { value: "PEREMPUAN", label: "Perempuan" },
] as const;

export const guestFormSchema = z
  .object({
    fullName: z
      .string()
      .min(1, "Nama lengkap wajib diisi")
      .max(120, "Nama terlalu panjang"),
    nik: nikSchema,
    gender: z.enum(["LAKI_LAKI", "PEREMPUAN"], {
      message: "Jenis kelamin wajib dipilih",
    }),
    address: z.string().min(1, "Alamat wajib diisi").max(255),
    phoneNumber: phoneSchema,
    email: optionalEmailSchema,

    institutionId: z.string().optional(),
    newInstitutionName: z
      .string()
      .max(150)
      .optional()
      .transform((v) => (v && v.trim() ? v.trim() : undefined)),

    departmentId: z.string().min(1, "Bidang tujuan wajib dipilih"),
    employeeId: z
      .string()
      .optional()
      .transform((v) => (v && v.trim() ? v.trim() : undefined)),
    purposeId: z.string().min(1, "Keperluan wajib dipilih"),
    visitDetail: z
      .string()
      .max(500)
      .optional()
      .transform((v) => (v && v.trim() ? v.trim() : undefined)),
    notes: z
      .string()
      .max(1000)
      .optional()
      .transform((v) => (v && v.trim() ? v.trim() : undefined)),

    // Base64 PNG dari signature pad (docs/01 §3). Wajib — buku tamu perlu ttd.
    signatureImage: z
      .string()
      .min(1, "Tanda tangan wajib diisi")
      .refine((v) => v.startsWith("data:image/"), {
        message: "Tanda tangan tidak valid",
      }),
    // Foto opsional — dikirim sebagai base64 dari client, diupload ke Blob di
    // server (docs/01 §3). Bila kosong berarti tidak ada foto.
    photoData: z
      .string()
      .optional()
      .transform((v) => (v && v.trim() ? v.trim() : undefined)),
    status: z
      .enum(["MENUNGGU", "DIPROSES", "SELESAI", "DIBATALKAN"])
      .default("MENUNGGU"),
  })
  .refine((d) => !!d.institutionId || !!d.newInstitutionName, {
    message: "Instansi wajib dipilih atau ditambahkan",
    path: ["institutionId"],
  });

export type GuestFormInput = z.input<typeof guestFormSchema>;
export type GuestFormOutput = z.output<typeof guestFormSchema>;

// Schema untuk update status cepat dari halaman detail.
export const updateStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["MENUNGGU", "DIPROSES", "SELESAI", "DIBATALKAN"]),
});

// Parameter list (search + filter + pagination), tercermin di URL (docs/01 §5.3).
export const listQuerySchema = z.object({
  q: z.string().optional(),
  status: z.enum(["MENUNGGU", "DIPROSES", "SELESAI", "DIBATALKAN"]).optional(),
  departmentId: z.string().optional(),
  employeeId: z.string().optional(),
  dari: z.string().optional(), // yyyy-MM-dd
  sampai: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(5).max(100).default(10),
  sort: z.enum(["checkInTime", "fullName", "queueNumber"]).default("checkInTime"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type ListQuery = z.infer<typeof listQuerySchema>;
