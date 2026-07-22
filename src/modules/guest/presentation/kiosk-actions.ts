"use server";

import { headers } from "next/headers";

import { kioskLimiter } from "@/shared/infrastructure/rate-limiter";
import { checkoutGuest } from "../application/checkout-guest.usecase";

export type KioskResult =
  | {
      ok: true;
      fullName: string;
      institutionName: string;
      checkInTime: string;
      checkOutTime: string;
    }
  | { ok: false; message: string };

/**
 * Aksi checkout kios — PUBLIK (tanpa sesi staf), di rate-limit per IP
 * (docs/01 §4.6). Tidak memakai authorize(); keamanan bertumpu pada token
 * yang tidak bisa ditebak + rate limit.
 */
export async function kioskCheckoutAction(
  token: string,
): Promise<KioskResult> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown";

  const { success, reset } = await kioskLimiter.limit(ip);
  if (!success) {
    const waitSec = Math.max(0, Math.ceil((reset - Date.now()) / 1000));
    return {
      ok: false,
      message: `Terlalu banyak permintaan. Coba lagi dalam ${waitSec} detik.`,
    };
  }

  const result = await checkoutGuest(token, {
    ipAddress: ip,
    userAgent: h.get("user-agent"),
  });
  if (!result.ok) {
    return { ok: false, message: result.error.message };
  }

  return {
    ok: true,
    fullName: result.value.fullName,
    institutionName: result.value.institutionName,
    checkInTime: result.value.checkInTime.toISOString(),
    checkOutTime: result.value.checkOutTime.toISOString(),
  };
}
