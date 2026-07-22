import type { Prisma } from "@prisma/client";

import { dateKeyInAppTz, startOfTodayInAppTz } from "@/shared/lib/timezone";

/**
 * Generasi nomor antrian atomik (docs/01 §4.2, docs/03). Satu query
 * INSERT ... ON CONFLICT DO UPDATE ... RETURNING — bukan read-then-write —
 * agar dua resepsionis submit bersamaan tidak pernah dapat nomor sama.
 * Harus dijalankan di dalam transaksi yang sama dengan create Guest.
 */
export async function nextQueueNumber(
  tx: Prisma.TransactionClient,
  now: Date = new Date(),
): Promise<string> {
  const today = startOfTodayInAppTz(now);
  const dateKey = dateKeyInAppTz(now);

  const rows = await tx.$queryRaw<{ last_value: number }[]>`
    INSERT INTO daily_counters (date, last_value)
    VALUES (${today}::date, 1)
    ON CONFLICT (date)
    DO UPDATE SET last_value = daily_counters.last_value + 1
    RETURNING last_value
  `;

  const seq = rows[0]?.last_value ?? 1;
  return `${dateKey}-${String(seq).padStart(4, "0")}`;
}
