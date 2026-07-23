import type { Prisma } from "@prisma/client";

import { prisma } from "@/shared/infrastructure/prisma";
import { APP_TIMEZONE } from "@/shared/lib/timezone";
import { fromZonedTime } from "date-fns-tz";
import type { ListQuery } from "./guest.schema";

export interface GuestListRow {
  id: string;
  queueNumber: string;
  fullName: string;
  institutionName: string;
  departmentName: string;
  employeeName: string | null;
  checkInTime: Date;
  checkOutTime: Date | null;
  status: string;
  autoClosed: boolean;
}

export interface GuestListResult {
  rows: GuestListRow[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

/** Bangun where-clause Prisma dari query (search + filter). Selalu kecualikan
 *  data terhapus. Kombinasi search + filter dipakai bersamaan (docs/01 §5.3). */
export function buildGuestWhere(q: ListQuery): Prisma.GuestWhereInput {
  const where: Prisma.GuestWhereInput = { deletedAt: null };
  const and: Prisma.GuestWhereInput[] = [];

  if (q.q && q.q.trim()) {
    const term = q.q.trim();
    and.push({
      OR: [
        { fullName: { contains: term, mode: "insensitive" } },
        { queueNumber: { contains: term, mode: "insensitive" } },
        { institution: { name: { contains: term, mode: "insensitive" } } },
        { employee: { name: { contains: term, mode: "insensitive" } } },
        { department: { name: { contains: term, mode: "insensitive" } } },
      ],
    });
  }
  if (q.status) where.status = q.status;
  if (q.departmentId) where.departmentId = q.departmentId;
  if (q.employeeId) where.employeeId = q.employeeId;

  if (q.dari || q.sampai) {
    const range: Prisma.DateTimeFilter = {};
    if (q.dari) range.gte = fromZonedTime(`${q.dari}T00:00:00`, APP_TIMEZONE);
    if (q.sampai)
      range.lte = fromZonedTime(`${q.sampai}T23:59:59.999`, APP_TIMEZONE);
    where.checkInTime = range;
  }

  if (and.length) where.AND = and;
  return where;
}

export async function listGuests(q: ListQuery): Promise<GuestListResult> {
  const where = buildGuestWhere(q);
  const skip = (q.page - 1) * q.perPage;

  const [total, rows] = await Promise.all([
    prisma.guest.count({ where }),
    prisma.guest.findMany({
      where,
      orderBy: { [q.sort]: q.order },
      skip,
      take: q.perPage,
      select: {
        id: true,
        queueNumber: true,
        fullName: true,
        checkInTime: true,
        checkOutTime: true,
        status: true,
        autoClosed: true,
        institution: { select: { name: true } },
        department: { select: { name: true } },
        employee: { select: { name: true } },
      },
    }),
  ]);

  return {
    rows: rows.map((g) => ({
      id: g.id,
      queueNumber: g.queueNumber,
      fullName: g.fullName,
      institutionName: g.institution.name,
      departmentName: g.department.name,
      employeeName: g.employee?.name ?? null,
      checkInTime: g.checkInTime,
      checkOutTime: g.checkOutTime,
      status: g.status,
      autoClosed: g.autoClosed,
    })),
    total,
    page: q.page,
    perPage: q.perPage,
    totalPages: Math.max(1, Math.ceil(total / q.perPage)),
  };
}
