import { prisma } from "@/shared/infrastructure/prisma";
import { recordActivity } from "@/shared/infrastructure/activity-logger";
import { startOfTodayInAppTz } from "@/shared/lib/timezone";
import { appError, err, ok, type Result } from "@/shared/domain/result";
import { zodToAppError } from "@/shared/lib/zod-error";
import { nextQueueNumber } from "../infrastructure/daily-counter.repository";
import { guestFormSchema, type GuestFormInput } from "./guest.schema";

export interface RegisteredGuest {
  id: string;
  queueNumber: string;
  qrToken: string;
}

/**
 * Registrasi tamu MANDIRI dari halaman kios publik (docs/01 §4.1, model
 * self-service). Tanpa sesi staf: createdById = null. Status DIPAKSA MENUNGGU
 * dan foto tidak diterima di jalur publik — dua hal itu urusan petugas.
 * Memakai skema validasi yang sama dengan form staf (satu sumber kebenaran).
 */
export async function registerGuestPublic(
  input: GuestFormInput,
  meta: { ipAddress?: string | null; userAgent?: string | null },
): Promise<Result<RegisteredGuest>> {
  // Abaikan field yang tidak boleh diatur tamu; validasi sisanya.
  const sanitized: GuestFormInput = {
    ...input,
    status: "MENUNGGU",
    photoData: "",
  };
  const parsed = guestFormSchema.safeParse(sanitized);
  if (!parsed.success) return err(zodToAppError(parsed.error));
  const data = parsed.data;

  try {
    const created = await prisma.$transaction(async (tx) => {
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
              // Instansi baru dari tamu: createdById null (bukan staf).
              data: { name: data.newInstitutionName },
            })
          ).id;
      }
      if (!institutionId) {
        throw new Error("VALIDATION:Instansi wajib dipilih atau ditambahkan.");
      }

      const now = new Date();
      const queueNumber = await nextQueueNumber(tx, now);

      return tx.guest.create({
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
          status: "MENUNGGU",
          signatureImage: data.signatureImage,
          createdById: null,
        },
        select: { id: true, queueNumber: true, qrToken: true },
      });
    });

    await recordActivity({
      userId: null, // aksi tamu, bukan staf
      action: "CREATE",
      entityType: "Guest",
      entityId: created.id,
      description: `Registrasi mandiri: ${data.fullName} (${created.queueNumber})`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return ok(created);
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("VALIDATION:")) {
      return err(appError("VALIDATION", e.message.slice("VALIDATION:".length)));
    }
    console.error("[register-guest-public] gagal:", e);
    return err(appError("INTERNAL", "Gagal menyimpan data. Silakan coba lagi."));
  }
}
