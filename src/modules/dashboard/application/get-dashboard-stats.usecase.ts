import type { Prisma } from "@prisma/client";

import { prisma } from "@/shared/infrastructure/prisma";
import {
  APP_TIMEZONE,
  dayRangeInAppTz,
} from "@/shared/lib/timezone";
import { fromZonedTime, formatInTimeZone } from "date-fns-tz";

export interface DashboardStats {
  today: number;
  week: number;
  month: number;
  year: number;
  yesterdayDelta: number;
  monthly: { label: string; total: number }[];
  byDepartment: { name: string; total: number }[];
  topInstitutions: { name: string; total: number }[];
  recent: {
    id: string;
    fullName: string;
    institution: string;
    checkInTime: Date;
    status: string;
  }[];
}

// Filter dasar: kecualikan data terhapus (soft delete).
const notDeleted: Prisma.GuestWhereInput = { deletedAt: null };

/**
 * Agregasi statistik dashboard (docs/04 §3). Semua batas "hari/minggu/bulan/
 * tahun" dihitung pada APP_TIMEZONE agar konsisten dengan zona kantor.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();
  const { start: todayStart, end: todayEnd } = dayRangeInAppTz(now);

  // Kemarin (untuk delta).
  const yesterday = new Date(todayStart.getTime() - 12 * 60 * 60 * 1000);
  const { start: yStart, end: yEnd } = dayRangeInAppTz(yesterday);

  // Awal minggu (Senin), bulan, tahun pada zona kantor.
  const ymd = formatInTimeZone(now, APP_TIMEZONE, "yyyy-MM-dd");
  const [y, m, d] = ymd.split("-").map(Number);
  const localMidnight = new Date(Date.UTC(y!, m! - 1, d!));
  const dow = localMidnight.getUTCDay(); // 0=Minggu
  const mondayOffset = dow === 0 ? 6 : dow - 1;
  const weekStartYmd = new Date(
    localMidnight.getTime() - mondayOffset * 86400000,
  )
    .toISOString()
    .slice(0, 10);
  const weekStart = fromZonedTime(`${weekStartYmd}T00:00:00`, APP_TIMEZONE);
  const monthStart = fromZonedTime(
    `${ymd.slice(0, 7)}-01T00:00:00`,
    APP_TIMEZONE,
  );
  const yearStart = fromZonedTime(`${ymd.slice(0, 4)}-01-01T00:00:00`, APP_TIMEZONE);

  const [today, yesterdayCount, week, month, year] = await Promise.all([
    prisma.guest.count({
      where: { ...notDeleted, checkInTime: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.guest.count({
      where: { ...notDeleted, checkInTime: { gte: yStart, lte: yEnd } },
    }),
    prisma.guest.count({
      where: { ...notDeleted, checkInTime: { gte: weekStart } },
    }),
    prisma.guest.count({
      where: { ...notDeleted, checkInTime: { gte: monthStart } },
    }),
    prisma.guest.count({
      where: { ...notDeleted, checkInTime: { gte: yearStart } },
    }),
  ]);

  // Grafik bulanan tahun berjalan — 12 bucket, dihitung di aplikasi agar
  // tidak bergantung pada fungsi tanggal Postgres yang timezone-sensitive.
  const yearGuests = await prisma.guest.findMany({
    where: { ...notDeleted, checkInTime: { gte: yearStart } },
    select: { checkInTime: true },
  });
  const monthBuckets = new Array(12).fill(0);
  for (const g of yearGuests) {
    const monthIdx =
      Number(formatInTimeZone(g.checkInTime, APP_TIMEZONE, "M")) - 1;
    if (monthIdx >= 0 && monthIdx < 12) monthBuckets[monthIdx] += 1;
  }
  const MONTH_LABELS = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
  ];
  const monthly = monthBuckets.map((total, i) => ({
    label: MONTH_LABELS[i]!,
    total,
  }));

  // Kunjungan per bidang & instansi terbanyak (tahun berjalan).
  const [byDeptRaw, byInstRaw] = await Promise.all([
    prisma.guest.groupBy({
      by: ["departmentId"],
      where: { ...notDeleted, checkInTime: { gte: yearStart } },
      _count: { _all: true },
    }),
    prisma.guest.groupBy({
      by: ["institutionId"],
      where: { ...notDeleted, checkInTime: { gte: yearStart } },
      _count: { _all: true },
    }),
  ]);

  const deptIds = byDeptRaw.map((r) => r.departmentId);
  const instIds = byInstRaw.map((r) => r.institutionId);
  const [depts, insts] = await Promise.all([
    prisma.department.findMany({
      where: { id: { in: deptIds } },
      select: { id: true, name: true },
    }),
    prisma.institution.findMany({
      where: { id: { in: instIds } },
      select: { id: true, name: true },
    }),
  ]);
  const deptName = new Map(depts.map((d) => [d.id, d.name]));
  const instName = new Map(insts.map((i) => [i.id, i.name]));

  const byDepartment = byDeptRaw
    .map((r) => ({
      name: deptName.get(r.departmentId) ?? "—",
      total: r._count._all,
    }))
    .sort((a, b) => b.total - a.total);

  const topInstitutions = byInstRaw
    .map((r) => ({
      name: instName.get(r.institutionId) ?? "—",
      total: r._count._all,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Tamu terakhir.
  const recentRaw = await prisma.guest.findMany({
    where: notDeleted,
    orderBy: { checkInTime: "desc" },
    take: 8,
    select: {
      id: true,
      fullName: true,
      checkInTime: true,
      status: true,
      institution: { select: { name: true } },
    },
  });
  const recent = recentRaw.map((g) => ({
    id: g.id,
    fullName: g.fullName,
    institution: g.institution.name,
    checkInTime: g.checkInTime,
    status: g.status,
  }));

  return {
    today,
    week,
    month,
    year,
    yesterdayDelta: today - yesterdayCount,
    monthly,
    byDepartment,
    topInstitutions,
    recent,
  };
}
