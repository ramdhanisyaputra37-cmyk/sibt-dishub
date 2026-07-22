import type { GuestStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { STATUS_CONFIG } from "./status-label";

export { GUEST_STATUS_OPTIONS, statusLabel } from "./status-label";

export function GuestStatusBadge({ status }: { status: GuestStatus }) {
  const cfg = STATUS_CONFIG[status];
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}
