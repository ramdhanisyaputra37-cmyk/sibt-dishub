"use client";

import { useTransition } from "react";
import type { GuestStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GUEST_STATUS_OPTIONS } from "./status-label";
import { updateStatusAction } from "./actions";

/** Ubah status kunjungan langsung dari halaman detail (docs/04 §6). */
export function StatusSelect({
  guestId,
  current,
  disabled,
}: {
  guestId: string;
  current: GuestStatus;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onChange = (value: string) => {
    const status = value as GuestStatus;
    if (status === current) return;
    startTransition(async () => {
      const res = await updateStatusAction(guestId, status);
      if (!res.ok) {
        toast.error(res.error.message);
        return;
      }
      toast.success("Status kunjungan diperbarui.");
      router.refresh();
    });
  };

  return (
    <Select value={current} onValueChange={onChange} disabled={disabled || pending}>
      <SelectTrigger className="w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {GUEST_STATUS_OPTIONS.map((s) => (
          <SelectItem key={s.value} value={s.value}>
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
