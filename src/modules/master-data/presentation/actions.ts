"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { authorize } from "@/shared/infrastructure/session";
import type { AppError } from "@/shared/domain/result";
import {
  createMaster,
  updateMaster,
  setMasterActive,
  deleteMaster,
} from "../application/master-crud.usecase";
import type { MasterEntity } from "../application/schemas";

export type MasterActionResult =
  | { ok: true; data: { id: string } }
  | { ok: false; error: AppError };

async function meta() {
  const h = await headers();
  return {
    ipAddress:
      h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip"),
    userAgent: h.get("user-agent"),
  };
}

const PATH: Record<MasterEntity, string> = {
  department: "/master/bidang",
  institution: "/master/instansi",
  purpose: "/master/keperluan",
  employee: "/master/pegawai",
};

export async function createMasterAction(
  entity: MasterEntity,
  input: unknown,
): Promise<MasterActionResult> {
  const authz = await authorize("master", "create");
  if (!authz.ok) return { ok: false, error: authz.error };
  const res = await createMaster(entity, input, {
    userId: authz.value.id,
    ...(await meta()),
  });
  if (res.ok) revalidatePath(PATH[entity]);
  return res.ok ? { ok: true, data: res.value } : { ok: false, error: res.error };
}

export async function updateMasterAction(
  entity: MasterEntity,
  id: string,
  input: unknown,
): Promise<MasterActionResult> {
  const authz = await authorize("master", "update");
  if (!authz.ok) return { ok: false, error: authz.error };
  const res = await updateMaster(entity, id, input, {
    userId: authz.value.id,
    ...(await meta()),
  });
  if (res.ok) revalidatePath(PATH[entity]);
  return res.ok ? { ok: true, data: res.value } : { ok: false, error: res.error };
}

export async function toggleMasterActiveAction(
  entity: MasterEntity,
  id: string,
  isActive: boolean,
): Promise<MasterActionResult> {
  const authz = await authorize("master", "update");
  if (!authz.ok) return { ok: false, error: authz.error };
  const res = await setMasterActive(entity, id, isActive, {
    userId: authz.value.id,
    ...(await meta()),
  });
  if (res.ok) revalidatePath(PATH[entity]);
  return res.ok ? { ok: true, data: res.value } : { ok: false, error: res.error };
}

export async function deleteMasterAction(
  entity: MasterEntity,
  id: string,
): Promise<MasterActionResult> {
  const authz = await authorize("master", "delete");
  if (!authz.ok) return { ok: false, error: authz.error };
  const res = await deleteMaster(entity, id, {
    userId: authz.value.id,
    ...(await meta()),
  });
  if (res.ok) revalidatePath(PATH[entity]);
  return res.ok ? { ok: true, data: res.value } : { ok: false, error: res.error };
}
