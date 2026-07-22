import { z } from "zod";

import { optionalPhoneSchema } from "@/shared/lib/validators";

export const ROLE_OPTIONS = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "ADMIN", label: "Admin" },
  { value: "RESEPSIONIS", label: "Resepsionis" },
  { value: "KEPALA_DINAS", label: "Kepala Dinas" },
] as const;

// Password: saat create wajib; saat edit opsional (kosong = tidak diubah).
export const createUserSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(120),
  email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
  password: z
    .string()
    .min(8, "Kata sandi minimal 8 karakter")
    .max(72, "Kata sandi terlalu panjang"),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "RESEPSIONIS", "KEPALA_DINAS"]),
  phoneNumber: optionalPhoneSchema,
  isActive: z.boolean().default(true),
});

export const updateUserSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(120),
  email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
  password: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : undefined))
    .refine((v) => !v || (v.length >= 8 && v.length <= 72), {
      message: "Kata sandi minimal 8 karakter",
    }),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "RESEPSIONIS", "KEPALA_DINAS"]),
  phoneNumber: optionalPhoneSchema,
  isActive: z.boolean().default(true),
});

export type CreateUserInput = z.input<typeof createUserSchema>;
export type UpdateUserInput = z.input<typeof updateUserSchema>;
