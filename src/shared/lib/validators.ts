import { z } from "zod";

// Regex nomor HP Indonesia (docs/01 §4.7): 0/62/+62 lalu 8, operator 1-9,
// sisa 7-11 digit. Contoh valid: 081234567890, 6281234567890, +6281234567890.
const ID_PHONE_REGEX = /^(0|62|\+62)8[1-9][0-9]{7,11}$/;

/** Normalisasi nomor HP ke format 08xxxxxxxxxx. */
export function normalizePhone(input: string): string {
  const trimmed = input.replace(/[\s-]/g, "");
  if (trimmed.startsWith("+62")) return "0" + trimmed.slice(3);
  if (trimmed.startsWith("62")) return "0" + trimmed.slice(2);
  return trimmed;
}

export const phoneSchema = z
  .string()
  .min(1, "Nomor HP wajib diisi")
  .refine((v) => ID_PHONE_REGEX.test(v.replace(/[\s-]/g, "")), {
    message: "Format nomor HP Indonesia tidak valid (mis. 081234567890)",
  })
  .transform(normalizePhone);

export const optionalPhoneSchema = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() ? v.trim() : undefined))
  .refine((v) => !v || ID_PHONE_REGEX.test(v.replace(/[\s-]/g, "")), {
    message: "Format nomor HP Indonesia tidak valid",
  })
  .transform((v) => (v ? normalizePhone(v) : undefined));

export const nikSchema = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() ? v.trim() : undefined))
  .refine((v) => !v || /^\d{16}$/.test(v), {
    message: "NIK harus 16 digit angka",
  });

export const optionalEmailSchema = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() ? v.trim() : undefined))
  .refine((v) => !v || z.string().email().safeParse(v).success, {
    message: "Format email tidak valid",
  });
