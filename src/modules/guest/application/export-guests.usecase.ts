import ExcelJS from "exceljs";

import { prisma } from "@/shared/infrastructure/prisma";
import { formatDateTimeID, formatDateID } from "@/shared/lib/timezone";
import { statusLabel } from "../presentation/status-label";
import { buildGuestWhere } from "./list-guests.usecase";
import type { ListQuery } from "./guest.schema";

interface ExportRow {
  queueNumber: string;
  visitDate: Date;
  fullName: string;
  nik: string | null;
  gender: string;
  phoneNumber: string;
  institution: string;
  department: string;
  employee: string | null;
  purpose: string;
  checkInTime: Date;
  checkOutTime: Date | null;
  status: string;
}

async function fetchForExport(q: ListQuery): Promise<ExportRow[]> {
  const where = buildGuestWhere(q);
  const rows = await prisma.guest.findMany({
    where,
    orderBy: { [q.sort]: q.order },
    take: 10000, // batas aman ekspor
    select: {
      queueNumber: true,
      visitDate: true,
      fullName: true,
      nik: true,
      gender: true,
      phoneNumber: true,
      checkInTime: true,
      checkOutTime: true,
      status: true,
      institution: { select: { name: true } },
      department: { select: { name: true } },
      employee: { select: { name: true } },
      purpose: { select: { name: true } },
    },
  });
  return rows.map((g) => ({
    queueNumber: g.queueNumber,
    visitDate: g.visitDate,
    fullName: g.fullName,
    nik: g.nik,
    gender: g.gender === "LAKI_LAKI" ? "Laki-laki" : "Perempuan",
    phoneNumber: g.phoneNumber,
    institution: g.institution.name,
    department: g.department.name,
    employee: g.employee?.name ?? null,
    purpose: g.purpose.name,
    checkInTime: g.checkInTime,
    checkOutTime: g.checkOutTime,
    status: g.status,
  }));
}

export async function exportGuestsExcel(q: ListQuery): Promise<Buffer> {
  const rows = await fetchForExport(q);
  const wb = new ExcelJS.Workbook();
  wb.creator = "SIBT-DISHUB";
  wb.created = new Date();
  const ws = wb.addWorksheet("Buku Tamu");

  ws.columns = [
    { header: "No. Antrian", key: "queueNumber", width: 18 },
    { header: "Tanggal", key: "visitDate", width: 16 },
    { header: "Nama", key: "fullName", width: 26 },
    { header: "NIK", key: "nik", width: 20 },
    { header: "Kelamin", key: "gender", width: 12 },
    { header: "No. HP", key: "phoneNumber", width: 16 },
    { header: "Instansi", key: "institution", width: 26 },
    { header: "Bidang", key: "department", width: 22 },
    { header: "Pegawai", key: "employee", width: 22 },
    { header: "Keperluan", key: "purpose", width: 24 },
    { header: "Jam Masuk", key: "checkIn", width: 18 },
    { header: "Jam Keluar", key: "checkOut", width: 18 },
    { header: "Status", key: "status", width: 14 },
  ];

  ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  ws.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF005BAC" },
  };
  ws.getRow(1).alignment = { vertical: "middle" };

  for (const r of rows) {
    ws.addRow({
      queueNumber: r.queueNumber,
      visitDate: formatDateID(r.visitDate),
      fullName: r.fullName,
      nik: r.nik ?? "-",
      gender: r.gender,
      phoneNumber: r.phoneNumber,
      institution: r.institution,
      department: r.department,
      employee: r.employee ?? "-",
      purpose: r.purpose,
      checkIn: formatDateTimeID(r.checkInTime),
      checkOut: r.checkOutTime ? formatDateTimeID(r.checkOutTime) : "-",
      status: statusLabel(r.status as never),
    });
  }

  ws.autoFilter = { from: "A1", to: "M1" };
  const arrayBuffer = await wb.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

/** Data terformat untuk PDF (dipakai template @react-pdf/renderer). */
export async function getGuestExportData(q: ListQuery) {
  const rows = await fetchForExport(q);
  return rows.map((r) => ({
    queueNumber: r.queueNumber,
    fullName: r.fullName,
    institution: r.institution,
    department: r.department,
    purpose: r.purpose,
    checkIn: formatDateTimeID(r.checkInTime),
    checkOut: r.checkOutTime ? formatDateTimeID(r.checkOutTime) : "-",
    status: statusLabel(r.status as never),
  }));
}
