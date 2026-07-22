import type { ActivityAction, Prisma } from "@prisma/client";

import { prisma } from "./prisma";

/**
 * Helper penulis activity_logs (docs/01 §11, docs/02). Dipanggil di akhir
 * setiap use case yang mengubah data agar tidak ada mutasi yang lolos tanpa
 * tercatat. Sengaja tidak melempar error — kegagalan mencatat log tidak boleh
 * membatalkan aksi bisnis yang sudah sukses; cukup dicatat ke console.
 */
export interface RecordActivityInput {
  userId?: string | null;
  action: ActivityAction;
  entityType?: string;
  entityId?: string;
  description: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function recordActivity(input: RecordActivityInput): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        description: input.description,
        metadata: input.metadata,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  } catch (e) {
    console.error("[activity-logger] gagal mencatat aktivitas:", e);
  }
}
