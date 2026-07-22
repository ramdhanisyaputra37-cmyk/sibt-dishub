import { redirect } from "next/navigation";
import type { RoleName } from "@prisma/client";

import { auth } from "./auth";
import { prisma } from "./prisma";
import { can, type Action, type Module } from "@/shared/lib/rbac";
import { appError, err, ok, type Result } from "@/shared/domain/result";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: RoleName;
}

/** Ambil user sesi saat ini (atau null). Tidak melempar. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    name: session.user.name ?? "",
    email: session.user.email ?? "",
    role: session.user.role,
  };
}

/**
 * Untuk halaman (app) — pastikan ada sesi valid & user masih aktif. JWT bisa
 * saja masih hidup walau user baru dinonaktifkan, jadi kita verifikasi ulang
 * isActive ke DB di sini (docs/01 §4.5). Redirect ke /login bila gagal.
 */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const fresh = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isActive: true },
  });
  if (!fresh || !fresh.isActive) redirect("/login");

  return user;
}

/**
 * Guard untuk Server Action — kembalikan Result agar action bisa mengirim
 * pesan error jelas ke UI, bukan redirect. Verifikasi izin RBAC + isActive.
 */
export async function authorize(
  module: Module,
  action: Action,
): Promise<Result<CurrentUser>> {
  const user = await getCurrentUser();
  if (!user) {
    return err(appError("UNAUTHORIZED", "Anda belum masuk. Silakan login."));
  }

  const fresh = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isActive: true },
  });
  if (!fresh || !fresh.isActive) {
    return err(
      appError("UNAUTHORIZED", "Akun Anda tidak aktif. Hubungi Super Admin."),
    );
  }

  if (!can(user.role, module, action)) {
    return err(
      appError("FORBIDDEN", "Anda tidak memiliki izin untuk aksi ini."),
    );
  }

  return ok(user);
}
