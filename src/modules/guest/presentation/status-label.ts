import type { GuestStatus } from "@prisma/client";

// Peta label & varian badge status — pure (tanpa JSX) agar aman diimpor di
// server (export/report) maupun client (badge).
export const STATUS_CONFIG: Record<
  GuestStatus,
  { label: string; variant: "secondary" | "info" | "success" | "destructive" }
> = {
  MENUNGGU: { label: "Menunggu", variant: "secondary" },
  DIPROSES: { label: "Diproses", variant: "info" },
  SELESAI: { label: "Selesai", variant: "success" },
  DIBATALKAN: { label: "Dibatalkan", variant: "destructive" },
};

export const GUEST_STATUS_OPTIONS = (
  Object.keys(STATUS_CONFIG) as GuestStatus[]
).map((value) => ({ value, label: STATUS_CONFIG[value].label }));

export function statusLabel(status: GuestStatus): string {
  return STATUS_CONFIG[status].label;
}
