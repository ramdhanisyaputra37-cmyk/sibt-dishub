import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight, ScrollText } from "lucide-react";

import { requireUser } from "@/shared/infrastructure/session";
import { can } from "@/shared/lib/rbac";
import { formatDateTimeID } from "@/shared/lib/timezone";
import {
  listActivity,
  activityUsers,
  ACTIVITY_ACTIONS,
  type ActivityLogQuery,
} from "@/modules/activity-log/application/list-activity.usecase";
import { ActivityFilters } from "@/modules/activity-log/presentation/activity-filters";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Activity Log" };
export const dynamic = "force-dynamic";

const ACTION_LABEL = Object.fromEntries(
  ACTIVITY_ACTIONS.map((a) => [a.value, a.label]),
);

export default async function ActivityLogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  if (!can(user.role, "activityLog", "read")) redirect("/dashboard");

  const sp = await searchParams;
  const str = (v: string | string[] | undefined) =>
    typeof v === "string" ? v : undefined;

  const query: ActivityLogQuery = {
    q: str(sp.q),
    userId: str(sp.userId),
    action: str(sp.action) as ActivityLogQuery["action"],
    dari: str(sp.dari),
    sampai: str(sp.sampai),
    page: Number(str(sp.page) ?? "1") || 1,
    perPage: 20,
  };

  const [result, users] = await Promise.all([
    listActivity(query),
    activityUsers(),
  ]);

  const pageHref = (p: number) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) {
      if (typeof v === "string") next.set(k, v);
    }
    next.set("page", String(p));
    return `/activity-log?${next.toString()}`;
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-grad-title text-2xl font-bold tracking-tight">Activity Log</h1>
        <p className="text-sm text-muted-foreground">
          Jejak audit seluruh aktivitas sistem (hanya-baca).
        </p>
      </div>

      <ActivityFilters users={users} />

      {result.rows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <ScrollText className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium">Tidak ada aktivitas</p>
            <p className="text-sm text-muted-foreground">
              Belum ada log yang cocok dengan filter.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Pengguna</TableHead>
                  <TableHead>Aksi</TableHead>
                  <TableHead>Entitas</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDateTimeID(r.createdAt)}
                    </TableCell>
                    <TableCell>{r.userName ?? "Sistem/Tamu"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {ACTION_LABEL[r.action] ?? r.action}
                      </Badge>
                    </TableCell>
                    <TableCell>{r.entityType ?? "—"}</TableCell>
                    <TableCell className="max-w-md truncate">
                      {r.description}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.ipAddress ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {result.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Total {result.total.toLocaleString("id-ID")} aktivitas
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild={result.page > 1}
              disabled={result.page <= 1}
            >
              {result.page > 1 ? (
                <Link href={pageHref(result.page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              ) : (
                <span>
                  <ChevronLeft className="h-4 w-4" />
                </span>
              )}
            </Button>
            <span className="text-sm">
              {result.page} / {result.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              asChild={result.page < result.totalPages}
              disabled={result.page >= result.totalPages}
            >
              {result.page < result.totalPages ? (
                <Link href={pageHref(result.page + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ) : (
                <span>
                  <ChevronRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
