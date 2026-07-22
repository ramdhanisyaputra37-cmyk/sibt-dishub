import { z } from "zod";

export const REPORT_TYPES = [
  { value: "harian", label: "Harian" },
  { value: "mingguan", label: "Mingguan" },
  { value: "bulanan", label: "Bulanan" },
  { value: "tahunan", label: "Tahunan" },
  { value: "rentang", label: "Rentang Tanggal" },
] as const;

export const reportQuerySchema = z.object({
  type: z
    .enum(["harian", "mingguan", "bulanan", "tahunan", "rentang"])
    .default("harian"),
  // Tanggal acuan (yyyy-MM-dd) untuk harian/mingguan; bulan (yyyy-MM) untuk
  // bulanan; tahun (yyyy) untuk tahunan; dari/sampai untuk rentang.
  date: z.string().optional(),
  dari: z.string().optional(),
  sampai: z.string().optional(),
});

export type ReportType = z.infer<typeof reportQuerySchema>["type"];
export type ReportQuery = z.infer<typeof reportQuerySchema>;
