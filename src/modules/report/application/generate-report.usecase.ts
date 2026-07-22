import type { Prisma } from "@prisma/client";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

import { prisma } from "@/shared/infrastructure/prisma";
import { APP_TIMEZONE, formatDateID } from "@/shared/lib/timezone";
import { statusLabel } from "@/modules/guest/presentation/status-label";
import type { ReportQuery } from "./report.schema";

export interface ReportRow {
  queueNumber: string;
  fullName: string;
  institution: string;
  department: string;
  purpose: string;
  checkIn: Date;
  checkOut: Date | null;
  status: string;
}

export interface ReportData {
  periodLabel: string;
  range: { start: Date; end: Date };
  summary: {
    total: number;
    byStatus: { label: string; count: number }[];
    byDepartment: { name: string; count: number }[];
    byInstitution: { name: string; count: number }[];
  };
  rows: ReportRow[];
}

function ymd(d: Date): string {
  return formatInTimeZone(d, APP_TIMEZONE, "yyyy-MM-dd");
}

/** Hitung rentang tanggal (instant UTC) berdasarkan tipe laporan & acuan,
 *  semua pada APP_TIMEZONE (docs/01 §4.11). */
export function resolveRange(q: ReportQuery): {
  start: Date;
  end: Date;
  label: string;
} {
  const today = ymd(new Date());

  if (q.type === "rentang") {
    const dari = q.dari || today;
    const sampai = q.sampai || today;
    return {
      start: fromZonedTime(`${dari}T00:00:00.000`, APP_TIMEZONE),
      end: fromZonedTime(`${sampai}T23:59:59.999`, APP_TIMEZONE),
      label: `${formatDateID(new Date(dari + "T00:00:00Z"))} – ${formatDateID(new Date(sampai + "T00:00:00Z"))}`,
    };
  }

  if (q.type === "harian") {
    const d = q.date || today;
    return {
      start: fromZonedTime(`${d}T00:00:00.000`, APP_TIMEZONE),
      end: fromZonedTime(`${d}T23:59:59.999`, APP_TIMEZONE),
      label: `Laporan Harian — ${formatDateID(new Date(d + "T00:00:00Z"))}`,
    };
  }

  if (q.type === "mingguan") {
    const d = q.date || today;
    const [y, m, day] = d.split("-").map(Number);
    const midnight = new Date(Date.UTC(y!, m! - 1, day!));
    const dow = midnight.getUTCDay();
    const mondayOffset = dow === 0 ? 6 : dow - 1;
    const monday = new Date(midnight.getTime() - mondayOffset * 86400000);
    const sunday = new Date(monday.getTime() + 6 * 86400000);
    const mondayYmd = monday.toISOString().slice(0, 10);
    const sundayYmd = sunday.toISOString().slice(0, 10);
    return {
      start: fromZonedTime(`${mondayYmd}T00:00:00.000`, APP_TIMEZONE),
      end: fromZonedTime(`${sundayYmd}T23:59:59.999`, APP_TIMEZONE),
      label: `Laporan Mingguan — ${formatDateID(monday)} s/d ${formatDateID(sunday)}`,
    };
  }

  if (q.type === "bulanan") {
    const month = q.date || today.slice(0, 7); // yyyy-MM
    const [y, m] = month.split("-").map(Number);
    const start = fromZonedTime(`${month}-01T00:00:00.000`, APP_TIMEZONE);
    const lastDay = new Date(Date.UTC(y!, m!, 0)).getUTCDate();
    const end = fromZonedTime(
      `${month}-${String(lastDay).padStart(2, "0")}T23:59:59.999`,
      APP_TIMEZONE,
    );
    const monthName = formatInTimeZone(start, APP_TIMEZONE, "MMMM yyyy", {
      locale: idLocale,
    });
    return { start, end, label: `Laporan Bulanan — ${monthName}` };
  }

  // tahunan
  const year = q.date || today.slice(0, 4);
  return {
    start: fromZonedTime(`${year}-01-01T00:00:00.000`, APP_TIMEZONE),
    end: fromZonedTime(`${year}-12-31T23:59:59.999`, APP_TIMEZONE),
    label: `Laporan Tahunan — ${year}`,
  };
}

export async function generateReport(q: ReportQuery): Promise<ReportData> {
  const { start, end, label } = resolveRange(q);
  const where: Prisma.GuestWhereInput = {
    deletedAt: null,
    checkInTime: { gte: start, lte: end },
  };

  const [rowsRaw, byStatusRaw, byDeptRaw, byInstRaw, total] = await Promise.all([
    prisma.guest.findMany({
      where,
      orderBy: { checkInTime: "asc" },
      take: 5000,
      select: {
        queueNumber: true,
        fullName: true,
        checkInTime: true,
        checkOutTime: true,
        status: true,
        institution: { select: { name: true } },
        department: { select: { name: true } },
        purpose: { select: { name: true } },
      },
    }),
    prisma.guest.groupBy({ by: ["status"], where, _count: { _all: true } }),
    prisma.guest.groupBy({ by: ["departmentId"], where, _count: { _all: true } }),
    prisma.guest.groupBy({ by: ["institutionId"], where, _count: { _all: true } }),
    prisma.guest.count({ where }),
  ]);

  const [depts, insts] = await Promise.all([
    prisma.department.findMany({
      where: { id: { in: byDeptRaw.map((r) => r.departmentId) } },
      select: { id: true, name: true },
    }),
    prisma.institution.findMany({
      where: { id: { in: byInstRaw.map((r) => r.institutionId) } },
      select: { id: true, name: true },
    }),
  ]);
  const deptName = new Map(depts.map((d) => [d.id, d.name]));
  const instName = new Map(insts.map((i) => [i.id, i.name]));

  return {
    periodLabel: label,
    range: { start, end },
    summary: {
      total,
      byStatus: byStatusRaw
        .map((s) => ({ label: statusLabel(s.status), count: s._count._all }))
        .sort((a, b) => b.count - a.count),
      byDepartment: byDeptRaw
        .map((d) => ({
          name: deptName.get(d.departmentId) ?? "—",
          count: d._count._all,
        }))
        .sort((a, b) => b.count - a.count),
      byInstitution: byInstRaw
        .map((i) => ({
          name: instName.get(i.institutionId) ?? "—",
          count: i._count._all,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    },
    rows: rowsRaw.map((r) => ({
      queueNumber: r.queueNumber,
      fullName: r.fullName,
      institution: r.institution.name,
      department: r.department.name,
      purpose: r.purpose.name,
      checkIn: r.checkInTime,
      checkOut: r.checkOutTime,
      status: statusLabel(r.status),
    })),
  };
}

import { id as idLocale } from "date-fns/locale";
