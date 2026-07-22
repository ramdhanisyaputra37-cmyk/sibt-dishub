import Link from "next/link";
import type { GuestStatus } from "@prisma/client";
import { Inbox } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GuestStatusBadge } from "@/modules/guest/presentation/status-badge";
import { formatTimeID } from "@/shared/lib/timezone";

interface RecentGuest {
  id: string;
  fullName: string;
  institution: string;
  checkInTime: Date;
  status: string;
}

export function RecentGuestsList({ guests }: { guests: RecentGuest[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tamu Terakhir</CardTitle>
      </CardHeader>
      <CardContent>
        {guests.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
            <Inbox className="h-8 w-8" />
            Belum ada tamu tercatat.
          </div>
        ) : (
          <ul className="divide-y">
            {guests.map((g) => (
              <li key={g.id}>
                <Link
                  href={`/buku-tamu/${g.id}`}
                  className="flex items-center justify-between gap-2 py-2.5 transition-colors hover:bg-accent/50 -mx-2 px-2 rounded-md"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {g.fullName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {g.institution} · {formatTimeID(g.checkInTime)}
                    </p>
                  </div>
                  <GuestStatusBadge status={g.status as GuestStatus} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function TopInstitutionsList({
  institutions,
}: {
  institutions: { name: string; total: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Instansi Kunjungan Terbanyak</CardTitle>
      </CardHeader>
      <CardContent>
        {institutions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
            <Inbox className="h-8 w-8" />
            Belum ada data instansi.
          </div>
        ) : (
          <ol className="space-y-3">
            {institutions.map((inst, i) => (
              <li key={inst.name} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">
                  {inst.name}
                </span>
                <span className="text-sm font-medium tabular-nums text-muted-foreground">
                  {inst.total.toLocaleString("id-ID")}
                </span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
