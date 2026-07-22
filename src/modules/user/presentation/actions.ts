"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { authorize } from "@/shared/infrastructure/session";
import type { AppError } from "@/shared/domain/result";
import {
  createUser,
  updateUser,
  setUserActive,
} from "../application/user.usecase";
import type {
  CreateUserInput,
  UpdateUserInput,
} from "../application/user.schema";

export type UserActionResult =
  | { ok: true; data: { id: string } }
  | { ok: false; error: AppError };

async function ctx(actorId: string) {
  const h = await headers();
  return {
    actorId,
    ipAddress:
      h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip"),
    userAgent: h.get("user-agent"),
  };
}

export async function createUserAction(
  input: CreateUserInput,
): Promise<UserActionResult> {
  const authz = await authorize("user", "create");
  if (!authz.ok) return { ok: false, error: authz.error };
  const res = await createUser(input, await ctx(authz.value.id));
  if (res.ok) revalidatePath("/pengguna");
  return res.ok ? { ok: true, data: res.value } : { ok: false, error: res.error };
}

export async function updateUserAction(
  id: string,
  input: UpdateUserInput,
): Promise<UserActionResult> {
  const authz = await authorize("user", "update");
  if (!authz.ok) return { ok: false, error: authz.error };
  const res = await updateUser(id, input, await ctx(authz.value.id));
  if (res.ok) revalidatePath("/pengguna");
  return res.ok ? { ok: true, data: res.value } : { ok: false, error: res.error };
}

export async function toggleUserActiveAction(
  id: string,
  isActive: boolean,
): Promise<UserActionResult> {
  const authz = await authorize("user", "update");
  if (!authz.ok) return { ok: false, error: authz.error };
  const res = await setUserActive(id, isActive, await ctx(authz.value.id));
  if (res.ok) revalidatePath("/pengguna");
  return res.ok ? { ok: true, data: res.value } : { ok: false, error: res.error };
}
