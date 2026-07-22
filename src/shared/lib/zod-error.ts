import type { ZodError } from "zod";

import { appError, type AppError } from "@/shared/domain/result";

/** Ubah ZodError menjadi AppError dengan fieldErrors untuk ditampilkan di form. */
export function zodToAppError(
  error: ZodError,
  message = "Periksa kembali isian formulir.",
): AppError {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return appError("VALIDATION", message, fieldErrors);
}
