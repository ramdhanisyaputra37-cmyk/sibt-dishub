import { prisma } from "@/shared/infrastructure/prisma";

export interface GuestLookups {
  institutions: { id: string; name: string }[];
  departments: { id: string; name: string }[];
  employees: { id: string; name: string; departmentId: string }[];
  purposes: { id: string; name: string }[];
}

/** Data referensi aktif untuk dropdown/autocomplete form tamu (docs/04 §5). */
export async function getGuestLookups(): Promise<GuestLookups> {
  const [institutions, departments, employees, purposes] = await Promise.all([
    prisma.institution.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.department.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.employee.findMany({
      where: { isActive: true },
      select: { id: true, name: true, departmentId: true },
      orderBy: { name: "asc" },
    }),
    prisma.purpose.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return { institutions, departments, employees, purposes };
}
