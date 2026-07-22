"use server";

import { revalidatePath } from "next/cache";

import { authorize } from "@/shared/infrastructure/session";
import { prisma } from "@/shared/infrastructure/prisma";
import { recordActivity } from "@/shared/infrastructure/activity-logger";
import type { AppError } from "@/shared/domain/result";

export type SettingsActionResult =
  | { ok: true }
  | { ok: false; error: AppError };

export async function updateSettingsAction(
  updates: Record<string, string>,
): Promise<SettingsActionResult> {
  const authz = await authorize("settings", "update");
  if (!authz.ok) return { ok: false, error: authz.error };

  await prisma.$transaction(
    Object.entries(updates).map(([key, value]) =>
      prisma.setting.update({
        where: { key },
        data: { value, updatedById: authz.value.id },
      }),
    ),
  );

  await recordActivity({
    userId: authz.value.id,
    action: "UPDATE",
    entityType: "Setting",
    description: `Memperbarui ${Object.keys(updates).length} pengaturan sistem`,
  });

  revalidatePath("/pengaturan");
  return { ok: true };
}
