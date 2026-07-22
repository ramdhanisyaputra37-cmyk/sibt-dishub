import { prisma } from "@/shared/infrastructure/prisma";

/** Detail lengkap satu tamu (untuk halaman detail & edit). Null bila tidak
 *  ada atau sudah soft-deleted. */
export async function getGuestById(id: string) {
  return prisma.guest.findFirst({
    where: { id, deletedAt: null },
    include: {
      institution: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
      employee: { select: { id: true, name: true, position: true } },
      purpose: { select: { id: true, name: true } },
      createdBy: { select: { name: true } },
    },
  });
}

export type GuestDetail = NonNullable<
  Awaited<ReturnType<typeof getGuestById>>
>;
