"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { authorize } from "@/shared/infrastructure/session";
import type { AppError } from "@/shared/domain/result";
import { createGuest } from "../application/create-guest.usecase";
import { updateGuest } from "../application/update-guest.usecase";
import { deleteGuest } from "../application/delete-guest.usecase";
import { updateGuestStatus } from "../application/checkout-guest.usecase";
import { importGuestsFromExcel } from "../application/import-guests.usecase";
import type { GuestFormInput } from "../application/guest.schema";

async function requestMeta() {
  const h = await headers();
  return {
    ipAddress:
      h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip"),
    userAgent: h.get("user-agent"),
  };
}

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: AppError };

export async function createGuestAction(
  input: GuestFormInput,
): Promise<ActionResult<{ id: string; queueNumber: string }>> {
  const authz = await authorize("guest", "create");
  if (!authz.ok) return { ok: false, error: authz.error };

  const meta = await requestMeta();
  const result = await createGuest(input, { userId: authz.value.id, ...meta });
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath("/buku-tamu");
  revalidatePath("/dashboard");
  return { ok: true, data: result.value };
}

export async function updateGuestAction(
  id: string,
  input: GuestFormInput,
): Promise<ActionResult<{ id: string }>> {
  const authz = await authorize("guest", "update");
  if (!authz.ok) return { ok: false, error: authz.error };

  const meta = await requestMeta();
  const result = await updateGuest(id, input, {
    userId: authz.value.id,
    role: authz.value.role,
    ...meta,
  });
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath("/buku-tamu");
  revalidatePath(`/buku-tamu/${id}`);
  return { ok: true, data: result.value };
}

export async function deleteGuestAction(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  const authz = await authorize("guest", "delete");
  if (!authz.ok) return { ok: false, error: authz.error };

  const meta = await requestMeta();
  const result = await deleteGuest(id, { userId: authz.value.id, ...meta });
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath("/buku-tamu");
  revalidatePath("/dashboard");
  return { ok: true, data: result.value };
}

export async function updateStatusAction(
  id: string,
  status: "MENUNGGU" | "DIPROSES" | "SELESAI" | "DIBATALKAN",
): Promise<ActionResult<{ id: string }>> {
  const authz = await authorize("guest", "update");
  if (!authz.ok) return { ok: false, error: authz.error };

  const meta = await requestMeta();
  const result = await updateGuestStatus(id, status, {
    userId: authz.value.id,
    ...meta,
  });
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath("/buku-tamu");
  revalidatePath(`/buku-tamu/${id}`);
  revalidatePath("/dashboard");
  return { ok: true, data: result.value };
}

export async function importGuestsAction(
  formData: FormData,
): Promise<
  ActionResult<{ imported: number; failed: number; errors: { row: number; field: string; message: string }[] }>
> {
  const authz = await authorize("guest", "import");
  if (!authz.ok) return { ok: false, error: authz.error };

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return {
      ok: false,
      error: { code: "VALIDATION", message: "File Excel wajib diunggah." },
    };
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const meta = await requestMeta();
  const result = await importGuestsFromExcel(buffer, {
    userId: authz.value.id,
    ...meta,
  });

  revalidatePath("/buku-tamu");
  revalidatePath("/dashboard");
  return { ok: true, data: result };
}
