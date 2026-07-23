"use server";

import { headers } from "next/headers";

import { kioskLimiter } from "@/shared/infrastructure/rate-limiter";
import { generateKioskQr } from "@/shared/lib/qr";
import { registerGuestPublic } from "../application/register-guest-public.usecase";
import type { GuestFormInput } from "../application/guest.schema";

export type KioskRegisterResult =
  | {
      ok: true;
      queueNumber: string;
      qrToken: string;
      qrDataUrl: string;
    }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

/**
 * Aksi PUBLIK registrasi tamu mandiri — tanpa sesi, di rate-limit per IP
 * (docs/01 §4.6). Mengembalikan nomor antrian + QR checkout yang di-generate
 * di server dari token kunjungan.
 */
export async function kioskRegisterAction(
  input: GuestFormInput,
): Promise<KioskRegisterResult> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown";

  const { success, reset } = await kioskLimiter.limit(`register:${ip}`);
  if (!success) {
    const waitSec = Math.max(0, Math.ceil((reset - Date.now()) / 1000));
    return {
      ok: false,
      message: `Terlalu banyak pengisian. Coba lagi dalam ${waitSec} detik atau minta bantuan petugas.`,
    };
  }

  const result = await registerGuestPublic(input, {
    ipAddress: ip,
    userAgent: h.get("user-agent"),
  });
  if (!result.ok) {
    return {
      ok: false,
      message: result.error.message,
      fieldErrors: result.error.fieldErrors,
    };
  }

  const qrDataUrl = await generateKioskQr(result.value.qrToken);
  return {
    ok: true,
    queueNumber: result.value.queueNumber,
    qrToken: result.value.qrToken,
    qrDataUrl,
  };
}
