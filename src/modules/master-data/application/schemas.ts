import { z } from "zod";

import { optionalPhoneSchema } from "@/shared/lib/validators";

// Empat entitas master data. Discriminator dipakai untuk memilih model Prisma
// & pemeriksaan referensi di use case generik.
export type MasterEntity =
  | "department"
  | "institution"
  | "purpose"
  | "employee";

const baseName = z
  .string()
  .min(2, "Nama minimal 2 karakter")
  .max(150, "Nama terlalu panjang");

export const departmentSchema = z.object({
  name: baseName,
  description: z.string().max(255).optional(),
  isActive: z.boolean().default(true),
});

export const institutionSchema = z.object({
  name: baseName,
  address: z.string().max(255).optional(),
  phoneNumber: optionalPhoneSchema,
  isActive: z.boolean().default(true),
});

export const purposeSchema = z.object({
  name: baseName,
  description: z.string().max(255).optional(),
  isActive: z.boolean().default(true),
});

export const employeeSchema = z.object({
  name: baseName,
  nip: z
    .string()
    .max(30)
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : undefined)),
  position: z.string().max(120).optional(),
  phoneNumber: optionalPhoneSchema,
  departmentId: z.string().min(1, "Bidang wajib dipilih"),
  isActive: z.boolean().default(true),
});

export const MASTER_SCHEMAS = {
  department: departmentSchema,
  institution: institutionSchema,
  purpose: purposeSchema,
  employee: employeeSchema,
} as const;

export type DepartmentInput = z.input<typeof departmentSchema>;
export type InstitutionInput = z.input<typeof institutionSchema>;
export type PurposeInput = z.input<typeof purposeSchema>;
export type EmployeeInput = z.input<typeof employeeSchema>;
export type MasterInput =
  | DepartmentInput
  | InstitutionInput
  | PurposeInput
  | EmployeeInput;
