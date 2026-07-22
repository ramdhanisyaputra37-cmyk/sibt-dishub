import ExcelJS from "exceljs";

import { prisma } from "@/shared/infrastructure/prisma";
import { recordActivity } from "@/shared/infrastructure/activity-logger";
import { startOfTodayInAppTz } from "@/shared/lib/timezone";
import { normalizePhone } from "@/shared/lib/validators";
import { nextQueueNumber } from "../infrastructure/daily-counter.repository";

export interface ImportRowError {
  row: number;
  field: string;
  message: string;
}

export interface ImportResult {
  imported: number;
  failed: number;
  errors: ImportRowError[];
}

// Kolom yang diharapkan (case-insensitive) — referensi master data by-name.
// Nama | NIK | Kelamin | Alamat | No HP | Email | Instansi | Bidang | Pegawai | Keperluan
const HEADER_MAP: Record<string, string> = {
  nama: "fullName",
  nik: "nik",
  kelamin: "gender",
  "jenis kelamin": "gender",
  alamat: "address",
  "no hp": "phone",
  "no. hp": "phone",
  "nomor hp": "phone",
  email: "email",
  instansi: "institution",
  bidang: "department",
  pegawai: "employee",
  keperluan: "purpose",
};

/**
 * Import Excel dengan validasi per-baris (docs/01 §4.8). Baris gagal
 * dikumpulkan jadi laporan error tanpa menghentikan baris valid lainnya.
 * Referensi master data dicocokkan by-name (case-insensitive); instansi baru
 * dibuat otomatis, bidang/keperluan/pegawai harus sudah ada.
 */
export async function importGuestsFromExcel(
  buffer: Buffer,
  ctx: { userId: string; ipAddress?: string | null; userAgent?: string | null },
): Promise<ImportResult> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as unknown as ArrayBuffer);
  const ws = wb.worksheets[0];
  const errors: ImportRowError[] = [];
  let imported = 0;
  let failed = 0;

  if (!ws) {
    return { imported: 0, failed: 0, errors: [{ row: 0, field: "file", message: "Sheet kosong." }] };
  }

  // Petakan kolom dari header baris 1.
  const colIndex: Record<string, number> = {};
  const headerRow = ws.getRow(1);
  headerRow.eachCell((cell, col) => {
    const key = HEADER_MAP[String(cell.value ?? "").trim().toLowerCase()];
    if (key) colIndex[key] = col;
  });
  if (colIndex.fullName === undefined) {
    return {
      imported: 0,
      failed: 0,
      errors: [{ row: 1, field: "header", message: "Kolom 'Nama' tidak ditemukan." }],
    };
  }

  // Cache master data untuk pencocokan by-name.
  const [depts, purposes, employees, institutions] = await Promise.all([
    prisma.department.findMany({ where: { isActive: true }, select: { id: true, name: true } }),
    prisma.purpose.findMany({ where: { isActive: true }, select: { id: true, name: true } }),
    prisma.employee.findMany({ where: { isActive: true }, select: { id: true, name: true } }),
    prisma.institution.findMany({ select: { id: true, name: true } }),
  ]);
  const deptByName = new Map(depts.map((d) => [d.name.toLowerCase(), d.id]));
  const purposeByName = new Map(purposes.map((p) => [p.name.toLowerCase(), p.id]));
  const empByName = new Map(employees.map((e) => [e.name.toLowerCase(), e.id]));
  const instByName = new Map(institutions.map((i) => [i.name.toLowerCase(), i.id]));

  const cellStr = (row: ExcelJS.Row, key: string): string => {
    const idx = colIndex[key];
    if (idx === undefined) return "";
    const v = row.getCell(idx).value;
    if (v === null || v === undefined) return "";
    if (typeof v === "object" && "text" in v) return String(v.text).trim();
    return String(v).trim();
  };

  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const fullName = cellStr(row, "fullName");
    if (!fullName) continue; // baris kosong, lewati

    const rowErrors: ImportRowError[] = [];

    const nik = cellStr(row, "nik");
    if (nik && !/^\d{16}$/.test(nik)) {
      rowErrors.push({ row: r, field: "NIK", message: "NIK harus 16 digit." });
    }

    const genderRaw = cellStr(row, "gender").toLowerCase();
    const gender =
      genderRaw.startsWith("l") || genderRaw.startsWith("m")
        ? "LAKI_LAKI"
        : genderRaw.startsWith("p") || genderRaw.startsWith("w")
          ? "PEREMPUAN"
          : null;
    if (!gender) {
      rowErrors.push({ row: r, field: "Kelamin", message: "Kelamin tidak dikenali (L/P)." });
    }

    const address = cellStr(row, "address");
    if (!address) rowErrors.push({ row: r, field: "Alamat", message: "Alamat wajib." });

    const phoneRaw = cellStr(row, "phone");
    const phone = phoneRaw ? normalizePhone(phoneRaw) : "";
    if (!phone || !/^0?8[1-9][0-9]{7,11}$/.test(phone)) {
      rowErrors.push({ row: r, field: "No HP", message: "Nomor HP tidak valid." });
    }

    const deptName = cellStr(row, "department");
    const departmentId = deptByName.get(deptName.toLowerCase());
    if (!departmentId) {
      rowErrors.push({ row: r, field: "Bidang", message: `Bidang "${deptName}" tidak ditemukan.` });
    }

    const purposeName = cellStr(row, "purpose");
    const purposeId = purposeByName.get(purposeName.toLowerCase());
    if (!purposeId) {
      rowErrors.push({ row: r, field: "Keperluan", message: `Keperluan "${purposeName}" tidak ditemukan.` });
    }

    const empName = cellStr(row, "employee");
    const employeeId = empName ? empByName.get(empName.toLowerCase()) : undefined;
    if (empName && !employeeId) {
      rowErrors.push({ row: r, field: "Pegawai", message: `Pegawai "${empName}" tidak ditemukan.` });
    }

    if (rowErrors.length) {
      errors.push(...rowErrors);
      failed++;
      continue;
    }

    // Resolusi instansi (buat baru bila belum ada).
    const instName = cellStr(row, "institution") || "Umum / Perorangan";
    let institutionId = instByName.get(instName.toLowerCase());

    try {
      await prisma.$transaction(async (tx) => {
        if (!institutionId) {
          const inst = await tx.institution.create({
            data: { name: instName, createdById: ctx.userId },
          });
          institutionId = inst.id;
          instByName.set(instName.toLowerCase(), inst.id);
        }
        const now = new Date();
        const queueNumber = await nextQueueNumber(tx, now);
        await tx.guest.create({
          data: {
            queueNumber,
            visitDate: startOfTodayInAppTz(now),
            checkInTime: now,
            fullName,
            nik: nik || null,
            gender: gender!,
            address,
            phoneNumber: phone,
            email: cellStr(row, "email") || null,
            institutionId: institutionId!,
            departmentId: departmentId!,
            employeeId: employeeId ?? null,
            purposeId: purposeId!,
            status: "SELESAI",
            signatureImage: null,
            createdById: ctx.userId,
          },
        });
      });
      imported++;
    } catch (e) {
      console.error(`[import-guests] baris ${r} gagal:`, e);
      errors.push({ row: r, field: "-", message: "Gagal menyimpan baris." });
      failed++;
    }
  }

  await recordActivity({
    userId: ctx.userId,
    action: "IMPORT",
    entityType: "Guest",
    description: `Impor Excel: ${imported} berhasil, ${failed} gagal`,
    metadata: { imported, failed },
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
  });

  return { imported, failed, errors };
}
