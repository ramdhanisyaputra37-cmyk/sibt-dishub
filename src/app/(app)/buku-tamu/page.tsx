import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { requireUser } from "@/shared/infrastructure/session";
import { can } from "@/shared/lib/rbac";
import { prisma } from "@/shared/infrastructure/prisma";
import { listQuerySchema } from "@/modules/guest/application/guest.schema";
import { listGuests } from "@/modules/guest/application/list-guests.usecase";
import { autoCloseStaleGuests } from "@/modules/guest/application/auto-close-guests.usecase";
import { canEditGuest } from "@/modules/guest/application/update-guest.usecase";
import {
  GuestList,
  type GuestListRowVM,
} from "@/modules/guest/presentation/guest-list";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Buku Tamu" };
export const dynamic = "force-dynamic";

export default async function BukuTamuPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const sp = await searchParams;

  const query = listQuerySchema.parse({
    q: sp.q,
    status: sp.status,
    departmentId: sp.departmentId,
    employeeId: sp.employeeId,
    dari: sp.dari,
    sampai: sp.sampai,
    page: sp.page,
    perPage: sp.perPage,
    sort: sp.sort,
    order: sp.order,
  });

  // Rapikan kunjungan menggantung sebelum data ditampilkan (lazy, ter-throttle).
  await autoCloseStaleGuests();

  const [result, departments] = await Promise.all([
    listGuests(query),
    prisma.department.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const rows: GuestListRowVM[] = result.rows.map((g) => ({
    id: g.id,
    queueNumber: g.queueNumber,
    fullName: g.fullName,
    institutionName: g.institutionName,
    departmentName: g.departmentName,
    checkInTime: g.checkInTime.toISOString(),
    checkOutTime: g.checkOutTime ? g.checkOutTime.toISOString() : null,
    status: g.status as GuestListRowVM["status"],
    autoClosed: g.autoClosed,
    canEdit:
      can(user.role, "guest", "update") &&
      canEditGuest(user.role, {
        visitDate: g.checkInTime,
        status: g.status,
        checkInTime: g.checkInTime,
      }),
  }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Buku Tamu</h1>
          <p className="text-sm text-muted-foreground">
            Daftar seluruh kunjungan tamu Dinas Perhubungan.
          </p>
        </div>
        {can(user.role, "guest", "create") && (
          <Button asChild>
            <Link href="/buku-tamu/tambah">
              <Plus className="h-4 w-4" />
              Tambah Tamu
            </Link>
          </Button>
        )}
      </div>

      <GuestList
        rows={rows}
        total={result.total}
        page={result.page}
        perPage={result.perPage}
        totalPages={result.totalPages}
        departments={departments}
        permissions={{
          canDelete: can(user.role, "guest", "delete"),
          canExport: can(user.role, "guest", "export"),
          canImport: can(user.role, "guest", "import"),
        }}
      />
    </div>
  );
}
