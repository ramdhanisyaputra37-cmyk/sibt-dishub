import { prisma } from "@/shared/infrastructure/prisma";
import type { MasterEntity } from "./schemas";
import type { MasterRow as Row } from "./master-crud.usecase";

interface ListOpts {
  q?: string;
  showInactive?: boolean;
}

/** Hitung referensi buku tamu per id secara batch (groupBy) agar tidak N+1. */
async function guestRefCounts(
  field: "departmentId" | "institutionId" | "purposeId" | "employeeId",
): Promise<Map<string, number>> {
  const grouped = await prisma.guest.groupBy({
    by: [field],
    _count: { _all: true },
  });
  const map = new Map<string, number>();
  for (const g of grouped) {
    const key = g[field];
    if (key) map.set(key, g._count._all);
  }
  return map;
}

export async function listMaster(
  entity: MasterEntity,
  opts: ListOpts = {},
): Promise<Row[]> {
  const nameFilter = opts.q
    ? { name: { contains: opts.q, mode: "insensitive" as const } }
    : {};
  const activeFilter = opts.showInactive ? {} : { isActive: true };
  const where = { ...nameFilter, ...activeFilter };

  switch (entity) {
    case "department": {
      const [rows, guestRefs, empRefs] = await Promise.all([
        prisma.department.findMany({ where, orderBy: { name: "asc" } }),
        guestRefCounts("departmentId"),
        prisma.employee.groupBy({ by: ["departmentId"], _count: { _all: true } }),
      ]);
      const empMap = new Map(
        empRefs.map((e) => [e.departmentId, e._count._all]),
      );
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        isActive: r.isActive,
        description: r.description,
        referenceCount: (guestRefs.get(r.id) ?? 0) + (empMap.get(r.id) ?? 0),
      }));
    }
    case "institution": {
      const [rows, refs] = await Promise.all([
        prisma.institution.findMany({ where, orderBy: { name: "asc" } }),
        guestRefCounts("institutionId"),
      ]);
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        isActive: r.isActive,
        address: r.address,
        phoneNumber: r.phoneNumber,
        referenceCount: refs.get(r.id) ?? 0,
      }));
    }
    case "purpose": {
      const [rows, refs] = await Promise.all([
        prisma.purpose.findMany({ where, orderBy: { name: "asc" } }),
        guestRefCounts("purposeId"),
      ]);
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        isActive: r.isActive,
        description: r.description,
        referenceCount: refs.get(r.id) ?? 0,
      }));
    }
    case "employee": {
      const [rows, refs] = await Promise.all([
        prisma.employee.findMany({
          where,
          orderBy: { name: "asc" },
          include: { department: { select: { name: true } } },
        }),
        guestRefCounts("employeeId"),
      ]);
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        isActive: r.isActive,
        nip: r.nip,
        position: r.position,
        phoneNumber: r.phoneNumber,
        departmentId: r.departmentId,
        departmentName: r.department.name,
        referenceCount: refs.get(r.id) ?? 0,
      }));
    }
  }
}

export type { MasterRow } from "./master-crud.usecase";
