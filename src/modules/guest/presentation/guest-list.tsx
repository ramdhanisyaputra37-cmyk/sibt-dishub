"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { GuestStatus } from "@prisma/client";
import { BookUser, ChevronLeft, ChevronRight } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { formatTimeID, formatDuration } from "@/shared/lib/timezone";
import { GuestStatusBadge } from "./status-badge";
import { GuestFilters } from "./guest-filters";
import { GuestRowActions } from "./guest-row-actions";
import { ImportDialog } from "./import-dialog";

export interface GuestListRowVM {
  id: string;
  queueNumber: string;
  fullName: string;
  institutionName: string;
  departmentName: string;
  checkInTime: string;
  checkOutTime: string | null;
  status: GuestStatus;
  canEdit: boolean;
}

interface GuestListProps {
  rows: GuestListRowVM[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  departments: { id: string; name: string }[];
  permissions: { canDelete: boolean; canExport: boolean; canImport: boolean };
}

export function GuestList({
  rows,
  total,
  page,
  perPage,
  totalPages,
  departments,
  permissions,
}: GuestListProps) {
  const [importOpen, setImportOpen] = useState(false);
  const pathname = usePathname();
  const params = useSearchParams();

  const pageHref = (p: number) => {
    const next = new URLSearchParams(params.toString());
    next.set("page", String(p));
    return `${pathname}?${next.toString()}`;
  };

  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  return (
    <div className="space-y-4">
      <GuestFilters
        departments={departments}
        canExport={permissions.canExport}
        canImport={permissions.canImport}
        onImportClick={() => setImportOpen(true)}
      />

      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Desktop: tabel dengan sticky header */}
          <Card className="hidden lg:block">
            <div className="max-h-[calc(100vh-20rem)] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead>No. Antrian</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Instansi</TableHead>
                    <TableHead>Bidang</TableHead>
                    <TableHead>Jam Masuk</TableHead>
                    <TableHead>Jam Keluar</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((g) => (
                    <TableRow
                      key={g.id}
                      className={cn(
                        g.status === "DIBATALKAN" && "opacity-60",
                      )}
                    >
                      <TableCell className="font-mono text-xs">
                        {g.queueNumber}
                      </TableCell>
                      <TableCell className="font-medium">
                        <Link
                          href={`/buku-tamu/${g.id}`}
                          className="hover:underline"
                        >
                          {g.fullName}
                        </Link>
                      </TableCell>
                      <TableCell>{g.institutionName}</TableCell>
                      <TableCell>{g.departmentName}</TableCell>
                      <TableCell>{formatTimeID(g.checkInTime)}</TableCell>
                      <TableCell>
                        {g.checkOutTime ? formatTimeID(g.checkOutTime) : "—"}
                      </TableCell>
                      <TableCell>
                        <GuestStatusBadge status={g.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <GuestRowActions
                          id={g.id}
                          name={g.fullName}
                          queueNumber={g.queueNumber}
                          canEdit={g.canEdit}
                          canDelete={permissions.canDelete}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Mobile: card-view */}
          <div className="space-y-3 lg:hidden">
            {rows.map((g) => (
              <Card
                key={g.id}
                className={cn(g.status === "DIBATALKAN" && "opacity-60")}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={`/buku-tamu/${g.id}`}
                        className="font-medium hover:underline"
                      >
                        {g.fullName}
                      </Link>
                      <p className="font-mono text-xs text-muted-foreground">
                        {g.queueNumber}
                      </p>
                    </div>
                    <GuestStatusBadge status={g.status} />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {g.institutionName} · {g.departmentName}
                  </p>
                  <p className="mt-1 text-sm">
                    {formatTimeID(g.checkInTime)}
                    {g.checkOutTime
                      ? ` – ${formatTimeID(g.checkOutTime)} (${formatDuration(
                          new Date(g.checkInTime),
                          new Date(g.checkOutTime),
                        )})`
                      : " – masih berkunjung"}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/buku-tamu/${g.id}`}>Detail</Link>
                    </Button>
                    <GuestRowActions
                      id={g.id}
                      name={g.fullName}
                      queueNumber={g.queueNumber}
                      canEdit={g.canEdit}
                      canDelete={permissions.canDelete}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              Menampilkan {from}–{to} dari {total.toLocaleString("id-ID")} tamu
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                asChild={page > 1}
                disabled={page <= 1}
              >
                {page > 1 ? (
                  <Link href={pageHref(page - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                    Sebelumnya
                  </Link>
                ) : (
                  <span>
                    <ChevronLeft className="h-4 w-4" />
                    Sebelumnya
                  </span>
                )}
              </Button>
              <span className="text-sm">
                Hal. {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                asChild={page < totalPages}
                disabled={page >= totalPages}
              >
                {page < totalPages ? (
                  <Link href={pageHref(page + 1)}>
                    Berikutnya
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <span>
                    Berikutnya
                    <ChevronRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </div>
          </div>
        </>
      )}

      {permissions.canImport && (
        <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <BookUser className="h-7 w-7 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">Belum ada data tamu</p>
          <p className="text-sm text-muted-foreground">
            Tidak ada tamu yang cocok dengan pencarian atau filter saat ini.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
