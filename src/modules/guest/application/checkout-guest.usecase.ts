import { prisma } from "@/shared/infrastructure/prisma";
import { recordActivity } from "@/shared/infrastructure/activity-logger";
import { appError, err, ok, type Result } from "@/shared/domain/result";

export interface CheckoutInfo {
  fullName: string;
  institutionName: string;
  checkInTime: Date;
  checkOutTime: Date;
  alreadyCheckedOut: boolean;
}

/** Ambil ringkasan kunjungan by qrToken untuk halaman kios (publik). */
export async function getGuestByToken(token: string) {
  return prisma.guest.findFirst({
    where: { qrToken: token, deletedAt: null },
    select: {
      id: true,
      fullName: true,
      checkInTime: true,
      checkOutTime: true,
      status: true,
      institution: { select: { name: true } },
    },
  });
}

/**
 * Self-checkout via kios (docs/01 §4.1). Tanpa sesi staf — userId log = null.
 * Menolak bila token invalid, sudah checkout, atau kunjungan dibatalkan.
 */
export async function checkoutGuest(
  token: string,
  ctx: { ipAddress?: string | null; userAgent?: string | null },
): Promise<Result<CheckoutInfo>> {
  const guest = await prisma.guest.findFirst({
    where: { qrToken: token, deletedAt: null },
    select: {
      id: true,
      fullName: true,
      checkInTime: true,
      checkOutTime: true,
      status: true,
      institution: { select: { name: true } },
    },
  });

  if (!guest) {
    return err(appError("NOT_FOUND", "Tautan tidak valid atau kunjungan tidak ditemukan."));
  }
  if (guest.status === "DIBATALKAN") {
    return err(appError("CONFLICT", "Kunjungan ini telah dibatalkan."));
  }
  if (guest.checkOutTime) {
    return err(
      appError("CONFLICT", "Kunjungan ini sudah diselesaikan sebelumnya."),
    );
  }

  const now = new Date();
  await prisma.guest.update({
    where: { id: guest.id },
    data: { checkOutTime: now, status: "SELESAI" },
  });

  await recordActivity({
    userId: null, // aksi tamu/kios, bukan staf (docs/01 §4.1)
    action: "CHECK_OUT",
    entityType: "Guest",
    entityId: guest.id,
    description: `Checkout mandiri via kios: ${guest.fullName}`,
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
  });

  return ok({
    fullName: guest.fullName,
    institutionName: guest.institution.name,
    checkInTime: guest.checkInTime,
    checkOutTime: now,
    alreadyCheckedOut: false,
  });
}

/** Update status cepat dari halaman detail (Admin/Resepsionis sesuai RBAC). */
export async function updateGuestStatus(
  id: string,
  status: "MENUNGGU" | "DIPROSES" | "SELESAI" | "DIBATALKAN",
  ctx: { userId: string; ipAddress?: string | null; userAgent?: string | null },
): Promise<Result<{ id: string }>> {
  const existing = await prisma.guest.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, fullName: true, checkOutTime: true },
  });
  if (!existing) return err(appError("NOT_FOUND", "Data tamu tidak ditemukan."));

  // Saat status jadi SELESAI dan belum ada jam keluar, isi otomatis.
  const setCheckout =
    status === "SELESAI" && !existing.checkOutTime ? new Date() : undefined;

  await prisma.guest.update({
    where: { id },
    data: {
      status,
      ...(setCheckout ? { checkOutTime: setCheckout } : {}),
      updatedById: ctx.userId,
    },
  });

  await recordActivity({
    userId: ctx.userId,
    action: "UPDATE",
    entityType: "Guest",
    entityId: id,
    description: `Mengubah status ${existing.fullName} menjadi ${status}`,
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
  });

  return ok({ id });
}
