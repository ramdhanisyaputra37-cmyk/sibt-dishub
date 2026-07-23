import { fromZonedTime, formatInTimeZone } from "date-fns-tz";

import { prisma } from "@/shared/infrastructure/prisma";
import { APP_TIMEZONE, dayRangeInAppTz } from "@/shared/lib/timezone";

export interface PublicStats {
  today: number;
  month: number;
}

/**
 * Statistik publik untuk hero landing page — ANGKA NYATA dari database, bukan
 * hardcode. Dipanggil di server component dengan revalidate 60 agar ringan.
 */
export async function getPublicStats(): Promise<PublicStats> {
  const now = new Date();
  const { start: todayStart, end: todayEnd } = dayRangeInAppTz(now);
  const monthKey = formatInTimeZone(now, APP_TIMEZONE, "yyyy-MM");
  const monthStart = fromZonedTime(`${monthKey}-01T00:00:00`, APP_TIMEZONE);

  // Landing dirender ISR (revalidate 60). Saat build/prerender, DB bisa saja
  // belum terjangkau (mis. build Vercel tanpa akses DB) — jangan gagalkan
  // build; kembalikan 0 dan biarkan revalidasi runtime mengisi angka nyata.
  try {
    const [today, month] = await Promise.all([
      prisma.guest.count({
        where: {
          deletedAt: null,
          checkInTime: { gte: todayStart, lte: todayEnd },
        },
      }),
      prisma.guest.count({
        where: { deletedAt: null, checkInTime: { gte: monthStart } },
      }),
    ]);
    return { today, month };
  } catch (e) {
    console.error("[get-public-stats] DB tidak terjangkau, fallback 0:", e);
    return { today: 0, month: 0 };
  }
}
