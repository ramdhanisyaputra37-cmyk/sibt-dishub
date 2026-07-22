import type { RoleName } from "@prisma/client";

import { prisma } from "@/shared/infrastructure/prisma";
import { recordActivity } from "@/shared/infrastructure/activity-logger";
import { uploadGuestPhoto } from "@/shared/infrastructure/blob-storage";
import { isSameAppTzDay } from "@/shared/lib/timezone";
import { appError, err, ok, type Result } from "@/shared/domain/result";
import { zodToAppError } from "@/shared/lib/zod-error";
import { guestFormSchema, type GuestFormInput } from "./guest.schema";

interface UpdateContext {
  userId: string;
  role: RoleName;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Kebijakan retensi edit resepsionis (docs/01 §4.4), ditegakkan di SERVER:
 * resepsionis hanya boleh edit tamu hari berjalan yang belum final. Admin &
 * Super Admin bebas. Dikembalikan sebagai fungsi agar bisa dipakai UI juga.
 */
export function canEditGuest(
  role: RoleName,
  guest: { visitDate: Date; status: string; checkInTime: Date },
): boolean {
  if (role === "SUPER_ADMIN" || role === "ADMIN") return true;
  if (role === "RESEPSIONIS") {
    const today = isSameAppTzDay(guest.checkInTime, new Date());
    const notFinal = guest.status === "MENUNGGU" || guest.status === "DIPROSES";
    return today && notFinal;
  }
  return false;
}

export async function updateGuest(
  id: string,
  input: GuestFormInput,
  ctx: UpdateContext,
): Promise<Result<{ id: string }>> {
  const parsed = guestFormSchema.safeParse(input);
  if (!parsed.success) return err(zodToAppError(parsed.error));
  const data = parsed.data;

  const existing = await prisma.guest.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, visitDate: true, status: true, checkInTime: true, fullName: true },
  });
  if (!existing) return err(appError("NOT_FOUND", "Data tamu tidak ditemukan."));

  if (!canEditGuest(ctx.role, existing)) {
    return err(
      appError(
        "FORBIDDEN",
        "Anda tidak dapat mengedit data ini. Resepsionis hanya bisa mengubah tamu hari berjalan yang belum selesai.",
      ),
    );
  }

  let photoUrl: string | undefined;
  if (data.photoData && data.photoData.startsWith("data:image/")) {
    const uploaded = await uploadGuestPhoto(data.photoData);
    if (!uploaded.ok) return err(uploaded.error);
    photoUrl = uploaded.value.url;
  }

  try {
    await prisma.$transaction(async (tx) => {
      let institutionId = data.institutionId;
      if (!institutionId && data.newInstitutionName) {
        const found = await tx.institution.findFirst({
          where: {
            name: { equals: data.newInstitutionName, mode: "insensitive" },
          },
        });
        institutionId =
          found?.id ??
          (
            await tx.institution.create({
              data: { name: data.newInstitutionName, createdById: ctx.userId },
            })
          ).id;
      }
      if (!institutionId) {
        throw new Error("VALIDATION:Instansi wajib dipilih atau ditambahkan.");
      }

      await tx.guest.update({
        where: { id },
        data: {
          fullName: data.fullName,
          nik: data.nik,
          gender: data.gender,
          address: data.address,
          phoneNumber: data.phoneNumber,
          email: data.email,
          institutionId,
          departmentId: data.departmentId,
          employeeId: data.employeeId,
          purposeId: data.purposeId,
          visitDetail: data.visitDetail,
          notes: data.notes,
          status: data.status,
          signatureImage: data.signatureImage,
          ...(photoUrl ? { photoUrl } : {}),
          updatedById: ctx.userId,
        },
      });
    });

    await recordActivity({
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "Guest",
      entityId: id,
      description: `Mengubah data tamu ${data.fullName}`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return ok({ id });
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("VALIDATION:")) {
      return err(appError("VALIDATION", e.message.slice("VALIDATION:".length)));
    }
    console.error("[update-guest] gagal:", e);
    return err(appError("INTERNAL", "Gagal memperbarui data tamu."));
  }
}
