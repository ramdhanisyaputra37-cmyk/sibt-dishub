import { formatInTimeZone, toZonedTime, fromZonedTime } from "date-fns-tz";

/**
 * Semua batas "hari ini" (reset nomor antrian, filter dashboard, jendela edit
 * resepsionis) memakai timezone ini, dihitung di server (docs/01 §4.11).
 * Default Asia/Jakarta (WIB), konfigurabel lewat env agar kantor WITA/WIT
 * tinggal ubah tanpa sentuh kode.
 */
export const APP_TIMEZONE = process.env.APP_TIMEZONE || "Asia/Jakarta";

/** Tanggal (tanpa jam) "hari ini" pada zona kantor, sebagai objek Date di
 *  tengah malam zona tersebut. Dipakai untuk kolom visitDate (@db.Date). */
export function startOfTodayInAppTz(base: Date = new Date()): Date {
  const ymd = formatInTimeZone(base, APP_TIMEZONE, "yyyy-MM-dd");
  // Tengah malam zona kantor, dikonversi ke instant UTC yang benar.
  return fromZonedTime(`${ymd}T00:00:00`, APP_TIMEZONE);
}

/** String yyyyMMdd pada zona kantor — komponen tanggal nomor antrian. */
export function dateKeyInAppTz(base: Date = new Date()): string {
  return formatInTimeZone(base, APP_TIMEZONE, "yyyyMMdd");
}

/** Awal & akhir sebuah hari kalender (zona kantor) sebagai rentang instant UTC. */
export function dayRangeInAppTz(base: Date = new Date()): {
  start: Date;
  end: Date;
} {
  const ymd = formatInTimeZone(base, APP_TIMEZONE, "yyyy-MM-dd");
  const start = fromZonedTime(`${ymd}T00:00:00.000`, APP_TIMEZONE);
  const end = fromZonedTime(`${ymd}T23:59:59.999`, APP_TIMEZONE);
  return { start, end };
}

/** Cek apakah dua instant jatuh pada tanggal kalender yang sama di zona kantor. */
export function isSameAppTzDay(a: Date, b: Date): boolean {
  return (
    formatInTimeZone(a, APP_TIMEZONE, "yyyy-MM-dd") ===
    formatInTimeZone(b, APP_TIMEZONE, "yyyy-MM-dd")
  );
}

/** Format tanggal Indonesia (mis. "22 Juli 2026"). */
export function formatDateID(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatInTimeZone(d, APP_TIMEZONE, "d MMMM yyyy", { locale: idLocale });
}

/** Format jam:menit zona kantor (mis. "08:12"). */
export function formatTimeID(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatInTimeZone(d, APP_TIMEZONE, "HH:mm");
}

/** Format tanggal + jam (mis. "22 Jul 2026, 08:12"). */
export function formatDateTimeID(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatInTimeZone(d, APP_TIMEZONE, "d MMM yyyy, HH:mm", {
    locale: idLocale,
  });
}

/** Durasi antara dua instant sebagai teks Indonesia ("53 menit", "1 jam 5 menit"). */
export function formatDuration(start: Date, end: Date): string {
  const ms = end.getTime() - start.getTime();
  if (ms < 0) return "-";
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} menit`;
  if (minutes === 0) return `${hours} jam`;
  return `${hours} jam ${minutes} menit`;
}

export { toZonedTime };

// Locale Indonesia untuk nama bulan; di-import lazily agar tree-shakeable.
import { id as idLocale } from "date-fns/locale";
