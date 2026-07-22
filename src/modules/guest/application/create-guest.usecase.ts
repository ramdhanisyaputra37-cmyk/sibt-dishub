import { prisma } from "@/shared/infrastructure/prisma";
import { recordActivity } from "@/shared/infrastructure/activity-logger";
import { uploadGuestPhoto } from "@/shared/infrastructure/blob-storage";
import { startOfTodayInAppTz } from "@/shared/lib/timezone";
import { appError, err, ok, type Result } from "@/shared/domain/result";
import { zodToAppError } from "@/shared/lib/zod-error";
import { nextQueueNumber } from "../infrastructure/daily-counter.repository";
import { guestFormSchema, type GuestFormInput } from "./guest.schema";

interface CreateContext {
  userId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface CreatedGuest {
  id: string;
  queueNumber: string;
}

export async function createGuest(
  input: GuestFormInput,
  ctx: CreateContext,
): Promise<Result<CreatedGuest>> {
  const parsed = guestFormSchema.safeParse(input);
  if (!parsed.success) {
    return err(zodToAppError(parsed.error));
  }
  const data = parsed.data;

  // Upload foto (bila ada) SEBELUM transaksi — panggilan jaringan tidak boleh
  // menahan lock DB. Jika gagal, batalkan sebelum menyentuh DB.
  let photoUrl: string | undefined;
  if (data.photoData) {
    const uploaded = await uploadGuestPhoto(data.photoData);
    if (!uploaded.ok) return err(uploaded.error);
    photoUrl = uploaded.value.url;
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      // Resolusi instansi: pakai id yang ada, atau buat baru (docs/05 §5.1).
      let institutionId = data.institutionId;
      if (!institutionId && data.newInstitutionName) {
        const existing = await tx.institution.findFirst({
          where: {
            name: { equals: data.newInstitutionName, mode: "insensitive" },
          },
        });
        institutionId =
          existing?.id ??
          (
            await tx.institution.create({
              data: {
                name: data.newInstitutionName,
                createdById: ctx.userId,
              },
            })
          ).id;
      }
      if (!institutionId) {
        throw new ValidationBoundary("Instansi wajib dipilih atau ditambahkan.");
      }

      const now = new Date();
      const queueNumber = await nextQueueNumber(tx, now);

      const guest = await tx.guest.create({
        data: {
          queueNumber,
          visitDate: startOfTodayInAppTz(now),
          checkInTime: now,
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
          photoUrl,
          createdById: ctx.userId,
        },
        select: { id: true, queueNumber: true },
      });
      return guest;
    });

    await recordActivity({
      userId: ctx.userId,
      action: "CREATE",
      entityType: "Guest",
      entityId: created.id,
      description: `Menambahkan tamu ${data.fullName} (${created.queueNumber})`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return ok(created);
  } catch (e) {
    if (e instanceof ValidationBoundary) {
      return err(appError("VALIDATION", e.message));
    }
    console.error("[create-guest] gagal:", e);
    return err(appError("INTERNAL", "Gagal menyimpan data tamu. Coba lagi."));
  }
}

class ValidationBoundary extends Error {}
