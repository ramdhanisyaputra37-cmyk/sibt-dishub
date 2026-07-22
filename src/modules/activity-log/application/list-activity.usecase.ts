import type { ActivityAction, Prisma } from "@prisma/client";
import { fromZonedTime } from "date-fns-tz";

import { prisma } from "@/shared/infrastructure/prisma";
import { APP_TIMEZONE } from "@/shared/lib/timezone";

export interface ActivityLogQuery {
  q?: string;
  userId?: string;
  action?: ActivityAction;
  dari?: string;
  sampai?: string;
  page: number;
  perPage: number;
}

export interface ActivityLogRow {
  id: string;
  createdAt: Date;
  userName: string | null;
  action: ActivityAction;
  entityType: string | null;
  description: string;
  ipAddress: string | null;
}

export async function listActivity(q: ActivityLogQuery) {
  const where: Prisma.ActivityLogWhereInput = {};
  const and: Prisma.ActivityLogWhereInput[] = [];

  if (q.q?.trim()) {
    and.push({
      OR: [
        { description: { contains: q.q.trim(), mode: "insensitive" } },
        { user: { name: { contains: q.q.trim(), mode: "insensitive" } } },
      ],
    });
  }
  if (q.userId) where.userId = q.userId;
  if (q.action) where.action = q.action;
  if (q.dari || q.sampai) {
    const range: Prisma.DateTimeFilter = {};
    if (q.dari) range.gte = fromZonedTime(`${q.dari}T00:00:00`, APP_TIMEZONE);
    if (q.sampai)
      range.lte = fromZonedTime(`${q.sampai}T23:59:59.999`, APP_TIMEZONE);
    where.createdAt = range;
  }
  if (and.length) where.AND = and;

  const skip = (q.page - 1) * q.perPage;
  const [total, rows] = await Promise.all([
    prisma.activityLog.count({ where }),
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: q.perPage,
      select: {
        id: true,
        createdAt: true,
        action: true,
        entityType: true,
        description: true,
        ipAddress: true,
        user: { select: { name: true } },
      },
    }),
  ]);

  return {
    rows: rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      userName: r.user?.name ?? null,
      action: r.action,
      entityType: r.entityType,
      description: r.description,
      ipAddress: r.ipAddress,
    })),
    total,
    page: q.page,
    perPage: q.perPage,
    totalPages: Math.max(1, Math.ceil(total / q.perPage)),
  };
}

/** Daftar user unik (untuk filter dropdown). */
export async function activityUsers() {
  return prisma.user.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export const ACTIVITY_ACTIONS: { value: ActivityAction; label: string }[] = [
  { value: "LOGIN", label: "Login" },
  { value: "LOGOUT", label: "Logout" },
  { value: "CREATE", label: "Tambah" },
  { value: "UPDATE", label: "Ubah" },
  { value: "DELETE", label: "Hapus" },
  { value: "RESTORE", label: "Pulihkan" },
  { value: "CHECK_OUT", label: "Checkout" },
  { value: "PRINT", label: "Cetak" },
  { value: "EXPORT", label: "Export" },
  { value: "IMPORT", label: "Import" },
];
