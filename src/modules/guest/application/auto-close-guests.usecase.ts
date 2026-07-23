import { prisma } from "@/shared/infrastructure/prisma";
import { recordActivity } from "@/shared/infrastructure/activity-logger";

/** Kunci pengaturan batas waktu penutupan otomatis (dalam jam). */
export const AUTO_CLOSE_SETTING_KEY = "guest.auto_close_hours";

/** Dipakai bila pengaturan belum ada atau nilainya tidak valid. */
const DEFAULT_AUTO_CLOSE_HOURS = 4;

/** Jeda minimal antar-eksekusi agar tidak menjalankan query tiap render. */
const THROTTLE_MS = 5 * 60 * 1000;

let lastRunAt = 0;

async function getAutoCloseHours(): Promise<number> {
  const setting = await prisma.setting.findUnique({
    where: { key: AUTO_CLOSE_SETTING_KEY },
    select: { value: true },
  });

  const parsed = Number(setting?.value);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_AUTO_CLOSE_HOURS;
  return parsed;
}

/**
 * Menutup kunjungan yang menggantung karena tamu tidak melakukan checkout.
 *
 * Dijalankan secara lazy (dipanggil saat halaman buku tamu/dashboard dimuat),
 * bukan lewat cron eksternal, agar tidak bergantung pada penjadwal hosting.
 *
 * Integritas data: `checkOutTime` sengaja TIDAK diisi — mengarang jam keluar
 * akan merusak laporan durasi kunjungan. Entri hanya ditandai `autoClosed`
 * sehingga petugas tahu jam keluarnya memang tidak tercatat.
 *
 * Nilai 0 pada pengaturan dianggap tidak valid dan memakai nilai default;
 * untuk menonaktifkan fitur, isi pengaturan dengan angka yang sangat besar.
 */
export async function autoCloseStaleGuests(): Promise<number> {
  const now = Date.now();
  if (now - lastRunAt < THROTTLE_MS) return 0;
  lastRunAt = now;

  try {
    const hours = await getAutoCloseHours();
    const threshold = new Date(now - hours * 60 * 60 * 1000);

    const result = await prisma.guest.updateMany({
      where: {
        deletedAt: null,
        checkOutTime: null,
        status: { in: ["MENUNGGU", "DIPROSES"] },
        checkInTime: { lt: threshold },
      },
      data: { status: "SELESAI", autoClosed: true },
    });

    if (result.count > 0) {
      await recordActivity({
        userId: null, // dijalankan sistem, bukan pengguna
        action: "UPDATE",
        entityType: "Guest",
        description: `Sistem menutup otomatis ${result.count} kunjungan yang melewati ${hours} jam tanpa checkout`,
      });
    }

    return result.count;
  } catch {
    // Kegagalan perapihan tidak boleh menggagalkan render halaman.
    return 0;
  }
}
