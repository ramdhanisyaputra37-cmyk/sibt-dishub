import bcrypt from "bcrypt";

import { prisma } from "@/shared/infrastructure/prisma";
import { recordActivity } from "@/shared/infrastructure/activity-logger";
import { appError, err, ok, type Result } from "@/shared/domain/result";
import { zodToAppError } from "@/shared/lib/zod-error";
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserInput,
  type UpdateUserInput,
} from "./user.schema";

interface Ctx {
  actorId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt: Date | null;
}

export async function listUsers(q?: string): Promise<UserRow[]> {
  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "asc" },
    include: { role: true },
  });
  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role.name,
    isActive: u.isActive,
    lastLoginAt: u.lastLoginAt,
  }));
}

async function roleIdByName(name: string): Promise<string | null> {
  const r = await prisma.role.findUnique({ where: { name: name as never } });
  return r?.id ?? null;
}

export async function createUser(
  input: CreateUserInput,
  ctx: Ctx,
): Promise<Result<{ id: string }>> {
  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) return err(zodToAppError(parsed.error));
  const data = parsed.data;

  const email = data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return err(
      appError("CONFLICT", "Email sudah terdaftar.", {
        email: "Email sudah dipakai.",
      }),
    );
  }
  const roleId = await roleIdByName(data.role);
  if (!roleId) return err(appError("VALIDATION", "Role tidak valid."));

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email,
      passwordHash,
      roleId,
      phoneNumber: data.phoneNumber,
      isActive: data.isActive,
    },
    select: { id: true },
  });

  await recordActivity({
    userId: ctx.actorId,
    action: "CREATE",
    entityType: "User",
    entityId: user.id,
    description: `Menambah pengguna ${data.name} (${data.role})`,
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
  });

  return ok({ id: user.id });
}

export async function updateUser(
  id: string,
  input: UpdateUserInput,
  ctx: Ctx,
): Promise<Result<{ id: string }>> {
  const parsed = updateUserSchema.safeParse(input);
  if (!parsed.success) return err(zodToAppError(parsed.error));
  const data = parsed.data;

  const target = await prisma.user.findUnique({
    where: { id },
    include: { role: true },
  });
  if (!target) return err(appError("NOT_FOUND", "Pengguna tidak ditemukan."));

  const email = data.email.toLowerCase();
  if (email !== target.email) {
    const dup = await prisma.user.findUnique({ where: { email } });
    if (dup) {
      return err(
        appError("CONFLICT", "Email sudah terdaftar.", {
          email: "Email sudah dipakai.",
        }),
      );
    }
  }

  // Cegah Super Admin menonaktifkan/menurunkan dirinya sendiri (lockout).
  if (id === ctx.actorId) {
    if (!data.isActive) {
      return err(
        appError("FORBIDDEN", "Anda tidak dapat menonaktifkan akun Anda sendiri."),
      );
    }
    if (data.role !== "SUPER_ADMIN") {
      return err(
        appError("FORBIDDEN", "Anda tidak dapat mengubah role akun Anda sendiri."),
      );
    }
  }

  // Cegah menonaktifkan Super Admin terakhir yang aktif.
  if (!data.isActive || data.role !== "SUPER_ADMIN") {
    if (target.role.name === "SUPER_ADMIN") {
      const activeSupers = await prisma.user.count({
        where: { isActive: true, role: { name: "SUPER_ADMIN" } },
      });
      if (activeSupers <= 1) {
        return err(
          appError(
            "FORBIDDEN",
            "Tidak dapat menonaktifkan/menurunkan Super Admin terakhir.",
          ),
        );
      }
    }
  }

  const roleId = await roleIdByName(data.role);
  if (!roleId) return err(appError("VALIDATION", "Role tidak valid."));

  const passwordHash = data.password
    ? await bcrypt.hash(data.password, 10)
    : undefined;

  await prisma.user.update({
    where: { id },
    data: {
      name: data.name,
      email,
      roleId,
      phoneNumber: data.phoneNumber,
      isActive: data.isActive,
      ...(passwordHash ? { passwordHash } : {}),
    },
  });

  await recordActivity({
    userId: ctx.actorId,
    action: "UPDATE",
    entityType: "User",
    entityId: id,
    description: `Mengubah pengguna ${data.name}${passwordHash ? " (reset kata sandi)" : ""}`,
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
  });

  return ok({ id });
}

export async function setUserActive(
  id: string,
  isActive: boolean,
  ctx: Ctx,
): Promise<Result<{ id: string }>> {
  if (id === ctx.actorId && !isActive) {
    return err(
      appError("FORBIDDEN", "Anda tidak dapat menonaktifkan akun Anda sendiri."),
    );
  }
  const target = await prisma.user.findUnique({
    where: { id },
    include: { role: true },
  });
  if (!target) return err(appError("NOT_FOUND", "Pengguna tidak ditemukan."));

  if (!isActive && target.role.name === "SUPER_ADMIN") {
    const activeSupers = await prisma.user.count({
      where: { isActive: true, role: { name: "SUPER_ADMIN" } },
    });
    if (activeSupers <= 1) {
      return err(
        appError("FORBIDDEN", "Tidak dapat menonaktifkan Super Admin terakhir."),
      );
    }
  }

  await prisma.user.update({ where: { id }, data: { isActive } });
  await recordActivity({
    userId: ctx.actorId,
    action: "UPDATE",
    entityType: "User",
    entityId: id,
    description: `${isActive ? "Mengaktifkan" : "Menonaktifkan"} pengguna ${target.name}`,
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
  });
  return ok({ id });
}
