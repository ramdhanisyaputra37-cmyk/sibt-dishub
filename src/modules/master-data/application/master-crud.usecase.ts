import { prisma } from "@/shared/infrastructure/prisma";
import { recordActivity } from "@/shared/infrastructure/activity-logger";
import { appError, err, ok, type Result } from "@/shared/domain/result";
import { zodToAppError } from "@/shared/lib/zod-error";
import { MASTER_SCHEMAS, type MasterEntity } from "./schemas";

interface Ctx {
  userId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

const ENTITY_LABEL: Record<MasterEntity, string> = {
  department: "Bidang",
  institution: "Instansi",
  purpose: "Keperluan",
  employee: "Pegawai",
};

// Akses delegasi model Prisma per entitas (name identik dgn model).
function model(entity: MasterEntity) {
  switch (entity) {
    case "department":
      return prisma.department;
    case "institution":
      return prisma.institution;
    case "purpose":
      return prisma.purpose;
    case "employee":
      return prisma.employee;
  }
}

/** Cek duplikasi nama case-insensitive (docs/03). Untuk employee di-scope ke
 *  (name, departmentId) karena nama orang bisa kembar antar bidang. */
async function isDuplicateName(
  entity: MasterEntity,
  name: string,
  departmentId: string | undefined,
  excludeId?: string,
): Promise<boolean> {
  const where: Record<string, unknown> = {
    name: { equals: name, mode: "insensitive" },
  };
  if (entity === "employee" && departmentId) where.departmentId = departmentId;
  if (excludeId) where.id = { not: excludeId };
  const found = await (model(entity) as { findFirst: (a: unknown) => Promise<unknown> }).findFirst({ where });
  return !!found;
}

export async function createMaster(
  entity: MasterEntity,
  input: unknown,
  ctx: Ctx,
): Promise<Result<{ id: string }>> {
  const parsed = MASTER_SCHEMAS[entity].safeParse(input);
  if (!parsed.success) return err(zodToAppError(parsed.error));
  const data = parsed.data as Record<string, unknown>;

  // Employee: nama boleh kembar antar bidang -> peringatan lunak (duplikat
  // hanya diblokir bila sama persis di bidang yang sama). Entitas lain:
  // duplikat nama diblokir keras.
  const dept = (data.departmentId as string) || undefined;
  if (await isDuplicateName(entity, data.name as string, dept)) {
    return err(
      appError("CONFLICT", `${ENTITY_LABEL[entity]} "${data.name}" sudah terdaftar.`, {
        name: "Nama sudah terdaftar.",
      }),
    );
  }

  try {
    const created = await (model(entity) as { create: (a: unknown) => Promise<{ id: string }> }).create({
      data: { ...data, createdById: ctx.userId },
    });
    await recordActivity({
      userId: ctx.userId,
      action: "CREATE",
      entityType: ENTITY_LABEL[entity],
      entityId: created.id,
      description: `Menambah ${ENTITY_LABEL[entity].toLowerCase()}: ${data.name}`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
    return ok({ id: created.id });
  } catch (e) {
    return handlePrismaError(e, entity);
  }
}

export async function updateMaster(
  entity: MasterEntity,
  id: string,
  input: unknown,
  ctx: Ctx,
): Promise<Result<{ id: string }>> {
  const parsed = MASTER_SCHEMAS[entity].safeParse(input);
  if (!parsed.success) return err(zodToAppError(parsed.error));
  const data = parsed.data as Record<string, unknown>;

  const dept = (data.departmentId as string) || undefined;
  if (await isDuplicateName(entity, data.name as string, dept, id)) {
    return err(
      appError("CONFLICT", `${ENTITY_LABEL[entity]} "${data.name}" sudah terdaftar.`, {
        name: "Nama sudah terdaftar.",
      }),
    );
  }

  try {
    await (model(entity) as { update: (a: unknown) => Promise<unknown> }).update({
      where: { id },
      data: { ...data, updatedById: ctx.userId },
    });
    await recordActivity({
      userId: ctx.userId,
      action: "UPDATE",
      entityType: ENTITY_LABEL[entity],
      entityId: id,
      description: `Mengubah ${ENTITY_LABEL[entity].toLowerCase()}: ${data.name}`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
    return ok({ id });
  } catch (e) {
    return handlePrismaError(e, entity);
  }
}

/** Hitung berapa data buku tamu (dan pegawai utk bidang) yang mereferensikan. */
export async function countReferences(
  entity: MasterEntity,
  id: string,
): Promise<number> {
  switch (entity) {
    case "department": {
      const [g, e] = await Promise.all([
        prisma.guest.count({ where: { departmentId: id } }),
        prisma.employee.count({ where: { departmentId: id } }),
      ]);
      return g + e;
    }
    case "institution":
      return prisma.guest.count({ where: { institutionId: id } });
    case "purpose":
      return prisma.guest.count({ where: { purposeId: id } });
    case "employee":
      return prisma.guest.count({ where: { employeeId: id } });
  }
}

export async function setMasterActive(
  entity: MasterEntity,
  id: string,
  isActive: boolean,
  ctx: Ctx,
): Promise<Result<{ id: string }>> {
  await (model(entity) as { update: (a: unknown) => Promise<unknown> }).update({
    where: { id },
    data: { isActive, updatedById: ctx.userId },
  });
  await recordActivity({
    userId: ctx.userId,
    action: "UPDATE",
    entityType: ENTITY_LABEL[entity],
    entityId: id,
    description: `${isActive ? "Mengaktifkan" : "Menonaktifkan"} ${ENTITY_LABEL[entity].toLowerCase()}`,
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
  });
  return ok({ id });
}

/**
 * Hard delete HANYA jika nol referensi (docs/04 §8). Bila masih direferensikan,
 * tolak & sarankan nonaktifkan. onDelete: Restrict di DB adalah jaring terakhir.
 */
export async function deleteMaster(
  entity: MasterEntity,
  id: string,
  ctx: Ctx,
): Promise<Result<{ id: string }>> {
  const refs = await countReferences(entity, id);
  if (refs > 0) {
    return err(
      appError(
        "CONFLICT",
        `Tidak dapat menghapus: masih dipakai oleh ${refs} data. Nonaktifkan saja.`,
      ),
    );
  }
  try {
    await (model(entity) as { delete: (a: unknown) => Promise<{ name?: string }> }).delete({
      where: { id },
    });
    await recordActivity({
      userId: ctx.userId,
      action: "DELETE",
      entityType: ENTITY_LABEL[entity],
      entityId: id,
      description: `Menghapus ${ENTITY_LABEL[entity].toLowerCase()}`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
    return ok({ id });
  } catch (e) {
    return handlePrismaError(e, entity);
  }
}

function handlePrismaError(
  e: unknown,
  entity: MasterEntity,
): Result<{ id: string }> {
  const err_ = e as { code?: string };
  if (err_.code === "P2002") {
    return err(
      appError("CONFLICT", `${ENTITY_LABEL[entity]} dengan nama itu sudah ada.`, {
        name: "Nama sudah terdaftar.",
      }),
    );
  }
  if (err_.code === "P2003") {
    return err(
      appError("CONFLICT", "Data masih direferensikan dan tidak bisa dihapus."),
    );
  }
  console.error(`[master-crud:${entity}] gagal:`, e);
  return err(appError("INTERNAL", "Terjadi kesalahan. Coba lagi."));
}

export type MasterRow = {
  id: string;
  name: string;
  isActive: boolean;
  description?: string | null;
  address?: string | null;
  phoneNumber?: string | null;
  nip?: string | null;
  position?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  referenceCount: number;
};
