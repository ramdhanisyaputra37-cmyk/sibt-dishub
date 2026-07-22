import type { GuestStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG: Record<
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

export function GuestStatusBadge({ status }: { status: GuestStatus }) {
  const cfg = STATUS_CONFIG[status];
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export function statusLabel(status: GuestStatus): string {
  return STATUS_CONFIG[status].label;
}
