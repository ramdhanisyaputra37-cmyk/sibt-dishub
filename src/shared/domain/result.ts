/**
 * Result<T, E> — pola error handling eksplisit lintas layer (docs/02-struktur-folder.md).
 * Use case & repository mengembalikan Result, bukan melempar exception untuk error
 * yang diharapkan (validasi gagal, data tidak ditemukan, konflik). Exception hanya
 * untuk kegagalan tak terduga (koneksi DB putus, bug) yang ditangani di batas
 * Server Action.
 */

export type Ok<T> = { ok: true; value: T };
export type Err<E> = { ok: false; error: E };
export type Result<T, E = AppError> = Ok<T> | Err<E>;

export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

export function err<E>(error: E): Err<E> {
  return { ok: false, error };
}

export type AppErrorCode =
  | "VALIDATION"
  | "NOT_FOUND"
  | "CONFLICT"
  | "FORBIDDEN"
  | "UNAUTHORIZED"
  | "RATE_LIMITED"
  | "INTERNAL";

export interface AppError {
  code: AppErrorCode;
  message: string;
  /** Error per-field (untuk ditampilkan di form), key = nama field. */
  fieldErrors?: Record<string, string>;
}

export function appError(
  code: AppErrorCode,
  message: string,
  fieldErrors?: Record<string, string>,
): AppError {
  return { code, message, fieldErrors };
}
