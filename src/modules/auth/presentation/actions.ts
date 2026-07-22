"use server";

import { AuthError } from "next-auth";
import { headers } from "next/headers";

import { signIn, signOut } from "@/shared/infrastructure/auth";
import { recordActivity } from "@/shared/infrastructure/activity-logger";
import { getCurrentUser } from "@/shared/infrastructure/session";
import { loginLimiter } from "@/shared/infrastructure/rate-limiter";
import { loginSchema } from "../application/login.schema";

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const raw = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
  const callbackUrl = String(formData.get("callbackUrl") || "/dashboard");

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Email dan kata sandi wajib diisi dengan benar." };
  }

  // Rate limit per email + IP (docs/01 §4.6).
  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    hdrs.get("x-real-ip") ||
    "unknown";
  const { success, reset } = await loginLimiter.limit(
    `${parsed.data.email.toLowerCase()}:${ip}`,
  );
  if (!success) {
    const waitSec = Math.max(0, Math.ceil((reset - Date.now()) / 1000));
    return {
      error: `Terlalu banyak percobaan. Coba lagi dalam ${waitSec} detik.`,
    };
  }

  try {
    // redirectTo: pada sukses, signIn melempar NEXT_REDIRECT (ditangani Next);
    // pada gagal, melempar AuthError yang kita ubah jadi pesan UI. Aktivitas
    // LOGIN dicatat di authorize() (auth.ts) karena baris ini tak tercapai
    // saat sukses.
    await signIn("credentials", {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      redirectTo: callbackUrl.startsWith("/") ? callbackUrl : "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email atau kata sandi salah." };
    }
    // NEXT_REDIRECT & error tak terduga: lempar ulang.
    throw error;
  }

  return {};
}

export async function logoutAction(): Promise<void> {
  const user = await getCurrentUser();
  if (user) {
    await recordActivity({
      userId: user.id,
      action: "LOGOUT",
      description: `${user.name} keluar dari sistem`,
    });
  }
  await signOut({ redirectTo: "/login" });
}
