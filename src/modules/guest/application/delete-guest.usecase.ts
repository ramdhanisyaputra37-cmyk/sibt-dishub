import { prisma } from "@/shared/infrastructure/prisma";
import { recordActivity } from "@/shared/infrastructure/activity-logger";
import { appError, err, ok, type Result } from "@/shared/domain/result";

interface DeleteContext {
  userId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Soft delete (docs/01 §4.3) — hanya Admin/Super Admin (dicek di action).
 * Set deletedAt & deletedById, tidak menghapus baris (audit trail utuh).
 */
export async function deleteGuest(
  id: string,
  ctx: DeleteContext,
): Promise<Result<{ id: string }>> {
  const existing = await prisma.guest.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, fullName: true, queueNumber: true },
  });
  if (!existing) return err(appError("NOT_FOUND", "Data tamu tidak ditemukan."));

  await prisma.guest.update({
    where: { id },
    data: { deletedAt: new Date(), deletedById: ctx.userId },
  });

  await recordActivity({
    userId: ctx.userId,
    action: "DELETE",
    entityType: "Guest",
    entityId: id,
    description: `Menghapus data tamu ${existing.fullName} (${existing.queueNumber})`,
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
  });

  return ok({ id });
}
